import 'package:get/get.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/network/app_session.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/features/auth/api/sign_up_api.dart';
import 'package:youpeak/features/auth/service/google_login.dart';
import 'package:youpeak/features/auth/view/fill_profile_view.dart';
import 'package:youpeak/features/main/view/main_home_view.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/shared/dialogs/blocked_user_dialog.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';

/// "Continue with Google", shared by the sign-in and sign-up screens:
/// Google account (Firebase) → YouPeak backend login (verifies the Firebase
/// ID token) → app session → profile → next screen.
///
/// One attempt at a time; the loader always closes; a cancel is quiet; a
/// failure says what went wrong and leaves no half-signed-in Firebase user.
class GoogleSignInFlow {
  GoogleSignInFlow._();

  static bool _running = false;

  static bool get isRunning => _running;

  static Future<void> run() async {
    if (_running) return; // double tap / second button while the popup is open
    _running = true;
    var loaderOpen = true;
    void closeLoader() {
      if (loaderOpen && (Get.isDialogOpen ?? false)) Get.back();
      loaderOpen = false;
    }

    // Opened in the same tap as the popup below, so the browser still treats
    // the popup as user-initiated.
    Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);
    try {
      final outcome = await GoogleLogin.signInWithGoogle();
      final user = outcome.credential?.user;
      if (outcome.cancelled || user?.email == null) {
        closeLoader();
        final key = messageKeyFor(outcome);
        if (key != null) CustomToast.show(key.tr, long: true);
        return;
      }

      final signUp = await SignUpApi.callApi(user!.email!, null, 2, Database.fcmToken ?? "", Database.deviceId ?? "unknown-device");
      final userId = signUp?.user?.id;
      if (userId == null) {
        // The backend refused (blocked, unverified token, server error):
        // don't leave a Firebase session behind for a user who isn't in.
        await AppSession.end();
        closeLoader();
        final message = signUp?.message;
        if (message != null && message.toLowerCase().contains("block")) {
          Get.dialog(const BlockedUserDialog(), barrierDismissible: false);
        } else {
          CustomToast.show(message?.isNotEmpty == true ? message! : AppStrings.googleSignInServerRejected.tr, long: true);
        }
        return;
      }

      AppSettings.onLoginWithReferral(loginUserId: userId);
      await GetProfileApi.callApi(userId);
      final profile = GetProfileApi.profileModel?.user;
      closeLoader();

      if (signUp!.signUp == true || (profile?.fullName ?? "").isEmpty) {
        Get.offAll(() => FillProfileView(email: user.email!, loginUserId: userId, username: user.displayName, profileImage: user.photoURL));
      } else if (profile != null) {
        Get.offAll(() => const MainHomePageView());
      } else {
        await AppSession.end();
        CustomToast.show(AppStrings.getProfileFailed.tr, long: true);
      }
    } catch (e) {
      print("GOOGLE_SIGNIN_DEBUG: flow FAILED => $e");
      closeLoader();
      CustomToast.show(AppStrings.googleLoginFailed.tr, long: true);
    } finally {
      _running = false;
    }
  }

  /// Translation key to show for a Google step that didn't sign in, or null
  /// for a plain cancel (closing the window is not an error).
  static String? messageKeyFor(GoogleLoginOutcome outcome) {
    if (outcome.cancelled) return null;
    switch (outcome.errorCode) {
      case "unauthorized-domain":
        return AppStrings.googleSignInDomainNotAuthorized;
      case "popup-blocked":
        return AppStrings.googleSignInPopupBlocked;
      case "operation-not-allowed":
        return AppStrings.googleSignInDisabled;
      case "network-request-failed":
        return AppStrings.googleSignInNetwork;
      case "account-exists-with-different-credential":
        return AppStrings.googleSignInAccountExists;
      default:
        return AppStrings.googleLoginFailed;
    }
  }
}
