import 'package:firebase_auth/firebase_auth.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/storage/database/database.dart';

/// The signed-in user's Firebase session for the per-user API.
///
/// After the backend verifies a login (phone OTP, Google, Apple or email +
/// password) it returns a Firebase custom token whose uid is the YouPeak user
/// id. Signing in with it gives the app ID tokens that the per-user routes
/// (Peak Boost, watch heartbeat, Tasker dashboard, withdrawals, device
/// attestation) accept instead of a userId in the request body.
class AppSession {
  AppSession._();

  /// Sign in with the custom token from the login response.
  static Future<bool> establish(String? customToken) async {
    if (customToken == null || customToken.isEmpty) return false;
    try {
      final credential = await FirebaseAuth.instance.signInWithCustomToken(customToken);
      // The backend mints the token for the user it has just verified, so the
      // session's uid is that user's id. Record it now: the calls that finish
      // signing in (profile, referral) need [isEstablished] already, and
      // loginUserId used to be set only by the profile call itself — so on a
      // fresh sign-in that call went out without a token and got a 401.
      final uid = credential.user?.uid;
      if (uid != null && uid.isNotEmpty) await Database.onSetLoginUserId(uid);
      return true;
    } catch (e) {
      AppSettings.showLog("AppSession.establish failed => $e");
      return false;
    }
  }

  /// Waits until Firebase Auth has restored any saved session (instant on
  /// phones; asynchronous in the browser).
  static Future<void> ready() async {
    try {
      await FirebaseAuth.instance.authStateChanges().first.timeout(const Duration(seconds: 3));
    } catch (_) {}
  }

  /// Whether the Firebase session belongs to the logged-in YouPeak user.
  static bool get isEstablished {
    final userId = Database.loginUserId;
    return userId != null && FirebaseAuth.instance.currentUser?.uid == userId;
  }

  /// A current ID token for the logged-in user, or null when there is no
  /// matching session (the caller should send the user to sign in again).
  static Future<String?> idToken({bool forceRefresh = false}) async {
    if (!isEstablished) return null;
    try {
      return await FirebaseAuth.instance.currentUser?.getIdToken(forceRefresh);
    } catch (e) {
      AppSettings.showLog("AppSession.idToken failed => $e");
      return null;
    }
  }

  /// Headers for the older API routes that the backend now ties to the
  /// signed-in user (withdrawals, coin conversion, rewards, profile, ...):
  /// the shared app key, any [extra] headers, and this user's ID token.
  /// Without a session the token is left out and the server answers 401.
  static Future<Map<String, String>> authHeaders([Map<String, String> extra = const {}]) async {
    final token = await idToken();
    return {
      "key": Constant.secretKey,
      ...extra,
      if (token != null) "Authorization": "Bearer $token",
    };
  }

  static Future<void> end() async {
    try {
      await FirebaseAuth.instance.signOut();
    } catch (_) {}
  }
}
