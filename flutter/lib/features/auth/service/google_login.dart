import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

/// Result of the Google account step (before the YouPeak backend login).
class GoogleLoginOutcome {
  const GoogleLoginOutcome._(this.credential, this.cancelled, this.errorCode);

  const GoogleLoginOutcome.signedIn(UserCredential credential) : this._(credential, false, null);
  const GoogleLoginOutcome.cancelled() : this._(null, true, null);
  const GoogleLoginOutcome.failed(String code) : this._(null, false, code);

  final UserCredential? credential;

  /// The user closed the account picker / popup. Not an error.
  final bool cancelled;

  /// Firebase Auth error code (e.g. "unauthorized-domain", "popup-blocked"),
  /// or "unknown".
  final String? errorCode;
}

class GoogleLogin {
  // Firebase codes that just mean the user backed out.
  static const _cancelCodes = {
    'popup-closed-by-user',
    'cancelled-popup-request',
    'user-cancelled',
    'web-context-canceled',
  };

  // The Web Client ID from google-services.json (oauth_client where
  // client_type == 3). Required on Android so google_sign_in can request an
  // ID token that Firebase Auth can verify. Without this, signIn() returns a
  // GoogleUser whose idToken is null and signInWithCredential() fails.
  static const _webClientId =
      '554624718564-t75571qjjumnon4au238pecuru4kcmqm.apps.googleusercontent.com';

  // print() rather than AppSettings.showLog (dart:developer log), which
  // release builds strip: these lines are the only way to see why a real
  // sign-in failed (adb logcat / browser console). Never logs tokens.
  static Future<GoogleLoginOutcome> signInWithGoogle() async {
    if (kIsWeb) return _signInOnWeb();
    try {
      // serverClientId is mandatory on Android: without it, google_sign_in
      // won't request an ID token and Firebase signInWithCredential fails.
      // signOut() first so the account picker always appears, even when a
      // Google account is already cached from a previous session.
      final googleSignIn = GoogleSignIn(
        serverClientId: _webClientId,
        scopes: ['email', 'profile'],
      );
      await googleSignIn.signOut();

      final GoogleSignInAccount? googleUser = await googleSignIn.signIn();
      if (googleUser == null) {
        print('GOOGLE_SIGNIN_DEBUG: user cancelled the account picker');
        return const GoogleLoginOutcome.cancelled();
      }

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      // Guard: idToken must be present for Firebase to accept the credential.
      if (googleAuth.idToken == null) {
        print(
            'GOOGLE_SIGNIN_DEBUG: idToken is null — serverClientId mismatch or Play Services issue');
        return const GoogleLoginOutcome.failed('missing-id-token');
      }

      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      final result =
          await FirebaseAuth.instance.signInWithCredential(credential);
      print(
          'GOOGLE_SIGNIN_DEBUG: Firebase sign-in success, isNewUser=${result.additionalUserInfo?.isNewUser}');
      return GoogleLoginOutcome.signedIn(result);
    } on FirebaseAuthException catch (error) {
      print('GOOGLE_SIGNIN_DEBUG: FAILED => ${error.code} | ${error.message}');
      return GoogleLoginOutcome.failed(error.code);
    } catch (error) {
      print('GOOGLE_SIGNIN_DEBUG: FAILED => $error');
      return const GoogleLoginOutcome.failed('unknown');
    }
  }

  // Browsers have no native account picker: Firebase Auth opens Google's
  // sign-in popup. The page's domain must be listed under Firebase Console >
  // Authentication > Settings > Authorized domains, or Firebase refuses with
  // "unauthorized-domain" before Google is even shown.
  static Future<GoogleLoginOutcome> _signInOnWeb() async {
    try {
      final provider = GoogleAuthProvider()
        ..addScope('email')
        ..addScope('profile')
        ..setCustomParameters({'prompt': 'select_account'});
      final result =
          await FirebaseAuth.instance.signInWithPopup(provider);
      print(
          'GOOGLE_SIGNIN_DEBUG: web popup success, isNewUser=${result.additionalUserInfo?.isNewUser}');
      return GoogleLoginOutcome.signedIn(result);
    } on FirebaseAuthException catch (error) {
      print('GOOGLE_SIGNIN_DEBUG: web popup FAILED => ${error.code}');
      if (_cancelCodes.contains(error.code)) {
        return const GoogleLoginOutcome.cancelled();
      }
      return GoogleLoginOutcome.failed(error.code);
    } catch (error) {
      print('GOOGLE_SIGNIN_DEBUG: web popup FAILED => $error');
      return const GoogleLoginOutcome.failed('unknown');
    }
  }
}
