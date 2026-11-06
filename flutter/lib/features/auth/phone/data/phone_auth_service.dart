import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Why a phone sign-in step failed, taken from the Firebase error code.
enum PhoneAuthFailure {
  /// SMS to this country is not enabled in the project's SMS region policy.
  regionBlocked,

  /// The Phone provider itself is switched off for the project.
  providerDisabled,
  invalidNumber,
  quotaExceeded,
  rateLimited,
  captcha,
  unauthorizedDomain,
  network,
  invalidCode,
  codeExpired,

  /// Another request is in flight, or this number was just sent a code.
  throttled,
  other,
}

class PhoneAuthError implements Exception {
  const PhoneAuthError(this.message, {this.failure = PhoneAuthFailure.other, this.code});

  final String message;
  final PhoneAuthFailure failure;

  /// The Firebase error code (never the phone number), for logs.
  final String? code;

  /// Maps a real [FirebaseAuthException] to a message the user can act on.
  factory PhoneAuthError.fromFirebase(FirebaseAuthException e) {
    final code = e.code;
    final failure = classify(code, e.message);
    return PhoneAuthError(_messages[failure]!, failure: failure, code: code);
  }

  static PhoneAuthFailure classify(String code, [String? message]) {
    switch (code) {
      case "operation-not-allowed":
        // Same code for "provider off" and "region off"; only the text differs.
        final text = (message ?? "").toLowerCase();
        return text.contains("region") ? PhoneAuthFailure.regionBlocked : PhoneAuthFailure.providerDisabled;
      case "invalid-phone-number":
      case "missing-phone-number":
        return PhoneAuthFailure.invalidNumber;
      case "quota-exceeded":
        return PhoneAuthFailure.quotaExceeded;
      case "too-many-requests":
        return PhoneAuthFailure.rateLimited;
      case "captcha-check-failed":
      case "invalid-app-credential":
      case "missing-app-credential":
      case "recaptcha-not-enabled":
      case "missing-recaptcha-token":
      case "invalid-recaptcha-token":
      case "invalid-recaptcha-action":
      case "invalid-recaptcha-version":
      case "recaptcha-sdk-not-linked":
        return PhoneAuthFailure.captcha;
      case "unauthorized-domain":
        return PhoneAuthFailure.unauthorizedDomain;
      case "network-request-failed":
        return PhoneAuthFailure.network;
      case "invalid-verification-code":
      case "missing-verification-code":
        return PhoneAuthFailure.invalidCode;
      case "session-expired":
      case "code-expired":
        return PhoneAuthFailure.codeExpired;
      default:
        return code.contains("region") ? PhoneAuthFailure.regionBlocked : PhoneAuthFailure.other;
    }
  }

  static const _messages = {
    PhoneAuthFailure.regionBlocked: "Phone sign-in isn't available for this country yet. Please sign in with email or Google instead.",
    PhoneAuthFailure.providerDisabled: "Phone sign-in is unavailable right now. Please sign in with email or Google instead.",
    PhoneAuthFailure.invalidNumber: "That phone number doesn't look right. Check it and try again.",
    PhoneAuthFailure.quotaExceeded: "We've sent too many codes for now. Please try again later or sign in with email or Google.",
    PhoneAuthFailure.rateLimited: "Too many attempts. Please wait a few minutes and try again.",
    PhoneAuthFailure.captcha: "Couldn't complete the security check. Refresh the page and try again.",
    PhoneAuthFailure.unauthorizedDomain: "Phone sign-in isn't set up for this website address.",
    PhoneAuthFailure.network: "No internet connection. Check your network and try again.",
    PhoneAuthFailure.invalidCode: "Wrong code. Check the SMS and try again.",
    PhoneAuthFailure.codeExpired: "This code has expired. Send a new one.",
    PhoneAuthFailure.throttled: "Please wait a moment before trying again.",
    PhoneAuthFailure.other: "Couldn't verify your number. Please try again.",
  };

  @override
  String toString() => message;
}

/// An OTP sent to a phone number, waiting for the code.
class PhoneVerification {
  const PhoneVerification._({this.verificationId, this.resendToken, this.webConfirmation, this.autoIdToken});

  @visibleForTesting
  const PhoneVerification.forTest(String this.verificationId)
      : resendToken = null,
        webConfirmation = null,
        autoIdToken = null;

  final String? verificationId;
  final int? resendToken;
  final ConfirmationResult? webConfirmation;

  /// Android read the SMS itself and already signed in.
  final String? autoIdToken;
}

/// Firebase Phone OTP. Produces a Firebase ID token that the backend
/// verifies (POST client/user/login, loginType 5) — the phone number is taken
/// from that token, never from what the app sends.
class PhoneAuthService {
  PhoneAuthService({FirebaseAuth? auth, this.resendCooldown = const Duration(seconds: 30), DateTime Function()? now})
      : _auth = auth,
        _now = now ?? DateTime.now;

  final FirebaseAuth? _auth;
  final DateTime Function() _now;

  /// Minimum gap between two successful sends to the same number.
  final Duration resendCooldown;

  FirebaseAuth get _firebase => _auth ?? FirebaseAuth.instance;

  bool _sending = false;
  final Map<String, DateTime> _lastSent = {};

  /// Sends the OTP. On Android the SMS may be read automatically; if that
  /// happens after the code screen is showing, [onAutoVerified] gets the
  /// ID token so the screen can finish on its own.
  ///
  /// Only one send runs at a time, and a number that was just sent a code is
  /// refused until [resendCooldown] has passed, so double taps can't cost two
  /// SMS. Returns only when Firebase confirmed the code was sent.
  Future<PhoneVerification> sendCode(String phoneE164, {int? resendToken, void Function(String idToken)? onAutoVerified}) async {
    if (_sending) {
      throw const PhoneAuthError("A code is already being sent. Please wait a moment.", failure: PhoneAuthFailure.throttled);
    }
    final wait = _cooldownLeft(phoneE164);
    if (wait > Duration.zero) {
      throw PhoneAuthError(
        "A code was just sent. You can ask for another in ${wait.inSeconds + 1}s.",
        failure: PhoneAuthFailure.throttled,
      );
    }
    _sending = true;
    try {
      final verification = await _dispatch(phoneE164, resendToken, onAutoVerified);
      _lastSent[phoneE164] = _now();
      return verification;
    } on FirebaseAuthException catch (e) {
      throw _logged(PhoneAuthError.fromFirebase(e));
    } on PhoneAuthError catch (e) {
      throw _logged(e);
    } on TimeoutException {
      throw _logged(const PhoneAuthError("Couldn't reach the verification service. Try again.", failure: PhoneAuthFailure.network));
    } catch (e) {
      // Not a Firebase error (e.g. the reCAPTCHA script failed to load).
      throw _logged(PhoneAuthError("Couldn't send the code. Please try again.", code: e.runtimeType.toString()));
    } finally {
      _sending = false;
    }
  }

  Duration _cooldownLeft(String phoneE164) {
    final at = _lastSent[phoneE164];
    if (at == null) return Duration.zero;
    final left = resendCooldown - _now().difference(at);
    return left > Duration.zero ? left : Duration.zero;
  }

  PhoneAuthError _logged(PhoneAuthError e) {
    debugPrint("Phone sign-in send failed: ${e.failure.name}${e.code == null ? "" : " (${e.code})"}");
    return e;
  }

  Future<PhoneVerification> _dispatch(String phoneE164, int? resendToken, void Function(String idToken)? onAutoVerified) async {
    if (kIsWeb) {
      // Invisible reCAPTCHA; the page's domain must be an authorized domain.
      final confirmation = await _firebase.signInWithPhoneNumber(phoneE164);
      return PhoneVerification._(webConfirmation: confirmation);
    }
    final completer = Completer<PhoneVerification>();
    // A callback may fire before we await this; the error is still delivered to the await below.
    final outcome = completer.future.timeout(const Duration(seconds: 90))..ignore();
    await _firebase.verifyPhoneNumber(
      phoneNumber: phoneE164,
      forceResendingToken: resendToken,
      timeout: const Duration(seconds: 60),
      verificationCompleted: (credential) async {
        try {
          final result = await _firebase.signInWithCredential(credential);
          final token = await result.user?.getIdToken();
          if (token == null) return;
          if (!completer.isCompleted) {
            completer.complete(PhoneVerification._(autoIdToken: token));
          } else {
            onAutoVerified?.call(token);
          }
        } catch (_) {
          // Fall back to typing the code.
        }
      },
      verificationFailed: (e) {
        if (!completer.isCompleted) completer.completeError(PhoneAuthError.fromFirebase(e));
      },
      codeSent: (verificationId, token) {
        if (!completer.isCompleted) completer.complete(PhoneVerification._(verificationId: verificationId, resendToken: token));
      },
      // Fires after the timeout; if nothing was sent by now, stop waiting.
      codeAutoRetrievalTimeout: (_) {
        if (!completer.isCompleted) {
          completer.completeError(const PhoneAuthError("Couldn't send the code. Please try again.", code: "no-code-sent"));
        }
      },
    );
    return outcome;
  }

  /// Checks the code and returns the Firebase ID token for the phone user.
  Future<String> confirm(PhoneVerification verification, String code) async {
    if (verification.autoIdToken != null) return verification.autoIdToken!;
    try {
      final UserCredential result;
      if (verification.webConfirmation != null) {
        result = await verification.webConfirmation!.confirm(code);
      } else {
        result = await _firebase.signInWithCredential(
          PhoneAuthProvider.credential(verificationId: verification.verificationId!, smsCode: code),
        );
      }
      final token = await result.user?.getIdToken();
      if (token == null) throw const PhoneAuthError("Couldn't sign in. Please try again.");
      return token;
    } on FirebaseAuthException catch (e) {
      throw PhoneAuthError.fromFirebase(e);
    }
  }
}

final phoneAuthServiceProvider = Provider<PhoneAuthService>((ref) => PhoneAuthService());
