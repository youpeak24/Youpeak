import 'dart:developer';

import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/referral/api/referral_code_apply_api.dart';
import 'package:youpeak/core/services/branch_io_services.dart';

class AppSettings {
  //  >>>>>> Debug Variable <<<<<<
  static showLog(String text) => true == true ? log(text) : null;

  static const String languageEn = "en";
  static const String countryCodeEn = "US";

  // >>>>>>>>>> Bottom Navigation <<<<<<<<<
  static RxInt navigationIndex = 0.obs;

  //  >>>>>>>>>> Create History <<<<<<<<<
  static RxBool isCreateHistory = true.obs; // Use History Create or not...

  // >>>>>>>>>> Incognito Mode <<<<<<<<<
  static RxBool isIncognitoMode = false.obs;

  // >>>>>>>>>> Notification <<<<<<<<<
  static RxBool showNotification = true.obs;

  // >>>>>>>>>> Auto Play Video <<<<<<<<<
  static RxBool isAutoPlayVideo = false.obs;

  // >>>>>>>>>> Pick Profile Image <<<<<<<<<
  static RxString pickImagePath = "".obs;

  // >>>>>>>>>> Bottom Navigation <<<<<<<<<
  static RxString paymentType = "".obs;

  // >>>>>>>>>> All Page Title <<<<<<<<<
  static bool isCenterTitle = false;

  // >>>>>>>>>> Show Ads Index <<<<<<<<<

  static int showAdsIndex = AdminSettingsApi.adminSettingsModel?.setting?.adDisplayIndex?.toInt() ?? 10;

  // static int showAdsIndex = 2;

  static bool get isShowAds {
    bool isPremium = GetProfileApi.profileModel?.user?.isPremiumPlan ?? false;
    bool hasAdFreeBenefit = false;

    if (isPremium && GetProfileApi.profileModel?.user?.plan?.planBenefit != null) {
      for (var benefit in GetProfileApi.profileModel!.user!.plan!.planBenefit!) {
        if (benefit.toLowerCase().contains("ad-free")) {
          hasAdFreeBenefit = true;
          break;
        }
      }
    }

    return (!hasAdFreeBenefit) && (AdminSettingsApi.adminSettingsModel?.setting?.isGoogle ?? false);
  }

  static RxString profileImage = "".obs;
  static RxString channelName = "".obs;

  static RxBool isUploading = false.obs;
  static RxBool isDownloading = false.obs;

  static RxBool isAvailableProfileData = false.obs;

  static String ipAddress = "192.168.98.99";

  // >>>>>>>>>> Fill/Edit Profile Controller <<<<<<<<<
  static TextEditingController emailController = TextEditingController();
  static TextEditingController nickNameController = TextEditingController();
  static TextEditingController phoneController = TextEditingController();
  static TextEditingController ageController = TextEditingController();

  static TextEditingController instagramController = TextEditingController();
  static TextEditingController facebookController = TextEditingController();
  static TextEditingController twitterController = TextEditingController();
  static TextEditingController websiteController = TextEditingController();
  static TextEditingController countryController = TextEditingController();
  static String selectedGender = 'male'.tr;
  static TextEditingController playListNameController = TextEditingController();
  static RxBool isValidPhone = true.obs;

  // >>>>>>>>>> Create Channel Controller <<<<<<<<<

  static TextEditingController nameController = TextEditingController(); //  Channel Name Controller => Both Use => Fill/Edit Profile And Channel Create Time
  static TextEditingController channelDescriptionController = TextEditingController();

  static RxInt channelType = 1.obs; // 1.Public 2.Private

  static String? selectedPayment;

  static String referralCodeLink = "";

  static Future<void> onCreateLink() async {
    await BranchIoServices.onCreateBranchIoLink(
      userId: GetProfileApi.profileModel?.user?.id ?? "",
      videoId: "",
      url: "",
      channelId: GetProfileApi.profileModel?.user?.channelId ?? "",
      name: GetProfileApi.profileModel?.user?.fullName ?? "",
      image: GetProfileApi.profileModel?.user?.image ?? "",
      pageRoutes: "referralCode",
      referralCode: GetProfileApi.profileModel?.user?.referralCode ?? "",
    );

    final link = await BranchIoServices.onGenerateLink() ?? "";

    showLog("Referral Code Link => $link");
    referralCodeLink = link;
  }

  static Future<void> onLoginWithReferral({required String loginUserId}) async {
    if (BranchIoServices.userId != loginUserId) {
      ReferralCodeApplyApi.callApi(loginUserId: loginUserId, referralCode: BranchIoServices.referralCode);
    }
  }
}
