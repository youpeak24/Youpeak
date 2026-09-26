import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PhoneAuthError implements Exception {
  const PhoneAuthError(this.message);

  final String message;

  @override
  String toString() => message;
}

/// An OTP sent to a phone number, waiting for the code.
class PhoneVerification {
  const PhoneVerification._({this.verificationId, this.resendToken, this.webConfirmation, this.autoIdToken});

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
  PhoneAuthService([FirebaseAuth? auth]) : _auth = auth;

  final FirebaseAuth? _auth;

  FirebaseAuth get _firebase => _auth ?? FirebaseAuth.instance;

  /// Sends the OTP. On Android the SMS may be read automatically; if that
  /// happens after the code screen is showing, [onAutoVerified] gets the
  /// ID token so the screen can finish on its own.
  Future<PhoneVerification> sendCode(String phoneE164, {int? resendToken, void Function(String idToken)? onAutoVerified}) async {
    try {
      if (kIsWeb) {
        // Invisible reCAPTCHA; the page's domain must be an authorized domain.
        final confirmation = await _firebase.signInWithPhoneNumber(phoneE164);
        return PhoneVerification._(webConfirmation: confirmation);
      }
      final completer = Completer<PhoneVerification>();
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
          if (!completer.isCompleted) completer.completeError(PhoneAuthError(describe(e)));
        },
        codeSent: (verificationId, token) {
          if (!completer.isCompleted) completer.complete(PhoneVerification._(verificationId: verificationId, resendToken: token));
        },
        codeAutoRetrievalTimeout: (_) {},
      );
      return completer.future;
    } on FirebaseAuthException catch (e) {
      throw PhoneAuthError(describe(e));
    }
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
      throw PhoneAuthError(describe(e));
    }
  }

  static String describe(FirebaseAuthException e) {
    switch (e.code) {
      case "invalid-phone-number":
        return "That phone number doesn't look right. Check it and try again.";
      case "invalid-verification-code":
        return "Wrong code. Check the SMS and try again.";
      case "session-expired":
      case "code-expired":
        return "This code has expired. Send a new one.";
      case "too-many-requests":
      case "quota-exceeded":
        return "Too many attempts. Please wait a few minutes and try again.";
      case "network-request-failed":
        return "No internet connection. Check your network and try again.";
      default:
        return e.message ?? "Couldn't verify your number. Please try again.";
    }
  }
}

final phoneAuthServiceProvider = Provider<PhoneAuthService>((ref) => PhoneAuthService());
