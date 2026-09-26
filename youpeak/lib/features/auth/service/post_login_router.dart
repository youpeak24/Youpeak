import 'package:get/get.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/features/access_gate/presentation/activation_lock_view.dart';
import 'package:youpeak/features/auth/view/fill_profile_view.dart';
import 'package:youpeak/features/main/view/main_home_view.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';

/// Where a user goes right after a successful login: apply a pending
/// referral code (Branch link or youpeak.app/<CODE>), then the web-portal
/// activation lock if a payment is owed, profile setup for new accounts, or
/// home.
class PostLoginRouter {
  PostLoginRouter._();

  static Future<void> go({required String userId, required bool isSignUp, String email = "", String? name, String? photoUrl}) async {
    AppSettings.onLoginWithReferral(loginUserId: userId);
    await GetProfileApi.callApi(userId);

    final gate = GetProfileApi.accessGate;
    if (gate != null && gate["locked"] == true) {
      Get.offAll(() => ActivationLockView(activationUrl: (gate["activationUrl"] as String?) ?? "https://youpeak.in", reason: gate["reason"] as String?));
      return;
    }

    final hasName = GetProfileApi.profileModel?.user?.fullName?.isNotEmpty ?? false;
    if (isSignUp || !hasName) {
      Get.offAll(() => FillProfileView(email: email, loginUserId: userId, username: name, profileImage: photoUrl));
    } else {
      Get.offAll(() => const MainHomePageView());
    }
  }
}
