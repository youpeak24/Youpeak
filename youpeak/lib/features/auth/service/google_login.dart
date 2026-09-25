import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class GoogleLogin {
  // AppSettings.showLog uses dart:developer's log(), which release builds
  // silently strip — every prior "Google Sign-In failed" report showed
  // nothing in logcat even across real native sign-in attempts, because the
  // actual exception was thrown, caught, and logged into the void. print()
  // always reaches logcat (adb logcat, tag "flutter") regardless of build
  // mode, so use it here specifically to make this diagnosable.
  static Future<UserCredential?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await GoogleSignIn().signIn();
      if (googleUser == null) {
        print("GOOGLE_SIGNIN_DEBUG: user cancelled the account picker (signIn() returned null)");
        return null;
      }
      print("GOOGLE_SIGNIN_DEBUG: picked account => ${googleUser.email}");

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      print("GOOGLE_SIGNIN_DEBUG: got tokens => idToken present=${googleAuth.idToken != null}, accessToken present=${googleAuth.accessToken != null}");

      final credential = GoogleAuthProvider.credential(accessToken: googleAuth.accessToken, idToken: googleAuth.idToken);
      final result = await FirebaseAuth.instance.signInWithCredential(credential);

      print("GOOGLE_SIGNIN_DEBUG: Firebase sign-in success => ${result.user?.email}, isNewUser=${result.additionalUserInfo?.isNewUser}");

      return result;
    } catch (error, stackTrace) {
      print("GOOGLE_SIGNIN_DEBUG: FAILED => $error");
      print("GOOGLE_SIGNIN_DEBUG: stack => $stackTrace");
    }
    return null;
  }
}
