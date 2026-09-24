import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/pages/nav_library_page/history_page/history_view.dart';
import 'package:youpeak/pages/profile_page/main_page/profile_controller.dart';
import 'package:youpeak/pages/profile_page/setting_page/grievance_page/grievance_view.dart';
import 'package:youpeak/pages/profile_page/setting_page/language_view.dart';
import 'package:youpeak/pages/profile_page/setting_page/privacy_policy_web_view.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/config/size_config.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/settings/app_settings.dart';
import 'package:youpeak/utils/string/app_string.dart';
import 'package:youpeak/utils/theme/theme_services.dart';

import 'premium_purchase_history_page/premium_plan_purchase_history_view.dart';

class SettingsView extends GetView<ProfileController> {
  const SettingsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        systemOverlayStyle: const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarBrightness: Brightness.dark),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: GestureDetector(
            child: Obx(() => Image.asset(AppIcons.arrowBack, color: isDarkMode.value ? AppColor.white : AppColor.black).paddingOnly(left: 15)),
            onTap: () => Get.back()),
        leadingWidth: 33,
        title: Text(AppStrings.settings.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
        centerTitle: AppSettings.isCenterTitle,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 10),
              SettingItemUi(
                callback: () => Get.to(() => const HistoryPageView()),
                leading: AppIcons.timeCircle,
                title: AppStrings.history.tr,
              ),

              SettingItemUi(
                callback: () {},
                leading: AppIcons.play,
                title: AppStrings.autoPlay.tr,
                trailing: SizedBox(
                  height: 20,
                  width: 25,
                  child: Transform.scale(
                    scale: 0.7,
                    child: Obx(
                      () => CupertinoSwitch(
                        activeColor: AppColor.primaryColor,
                        value: AppSettings.isAutoPlayVideo.value,
                        onChanged: (value) {
                          AppSettings.isAutoPlayVideo.value = value;
                          Database.onSetAutoPlayVideo(value);
                        },
                      ),
                    ),
                  ),
                ),
              ),

              SettingItemUi(
                leading: AppIcons.darkMode,
                title: AppStrings.darkMode.tr,
                callback: () {},
                trailing: GestureDetector(
                  // The switch's own onChanged used to carry this same logic,
                  // so one tap could fire both this onTap and onChanged —
                  // switchTheme() reads-and-flips a *stored* value rather than
                  // taking an explicit target, so a double-fire could leave the
                  // real Flutter ThemeMode and isDarkMode pointing opposite
                  // directions (the "half light, half dark" UI). Single handler
                  // now; the switch below is display-only.
                  onTap: () {
                    isDarkMode.value = !isDarkMode.value;
                    ThemeService().switchTheme();
                  },
                  child: Container(
                    height: 20,
                    width: 60,
                    alignment: Alignment.centerRight,
                    color: Colors.transparent,
                    child: SizedBox(
                      height: 20,
                      width: 25,
                      child: Transform.scale(
                        scale: 0.7,
                        child: Obx(
                          () => IgnorePointer(
                            child: CupertinoSwitch(
                              activeColor: AppColor.primaryColor,
                              value: isDarkMode.value,
                              onChanged: (value) {},
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              SettingItemUi(
                callback: () {
                  controller.onGetPurchaseHistory(isFirstLoad: true);
                  Get.to(const PremiumPlanPurchaseHistoryView());
                },
                leading: AppIcons.wallet,
                title: AppStrings.paymentsHistory.tr,
              ),
              SettingItemUi(
                callback: () => Get.to(() => const LanguageView()),
                leading: AppIcons.translate,
                title: AppStrings.language.tr,
              ),
              SettingItemUi(
                callback: () {},
                leading: AppIcons.notification,
                title: AppStrings.notification.tr,
                trailing: SizedBox(
                  height: 20,
                  width: 25,
                  child: Transform.scale(
                    scale: 0.7,
                    child: Obx(
                      () => CupertinoSwitch(
                        activeColor: AppColor.primaryColor,
                        value: AppSettings.showNotification.value,
                        onChanged: (value) {
                          AppSettings.showNotification.value = value;
                          Database.onSetNotification(value);
                        },
                      ),
                    ),
                  ),
                ),
              ),
              SettingItemUi(
                callback: () => Get.to(const PrivacyPolicyWebView()),
                leading: AppIcons.help,
                title: AppStrings.privacyPolicy.tr,
              ),
              SettingItemUi(
                callback: () => Get.to(() => const GrievanceView()),
                leading: AppIcons.grievance,
                title: AppStrings.grievanceOfficer.tr,
              ),
              // SettingItemUi(
              //   callback: () {},
              //   leading: AppIcons.moreSquare,
              //   title: AppStrings.about.tr,
              // ),
            ],
          ),
        ),
      ),
    );
  }
}

class SettingItemUi extends StatelessWidget {
  const SettingItemUi({super.key, required this.title, required this.leading, this.trailing, required this.callback});

  final String title;
  final String leading;
  final Widget? trailing;
  final Callback callback;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: callback,
      child: Padding(
        padding: EdgeInsets.only(bottom: SizeConfig.blockSizeVertical * 2.5),
        child: Container(
          color: AppColor.transparent,
          child: Row(
            children: [
              ImageIcon(AssetImage(leading), size: 25),
              SizedBox(width: SizeConfig.blockSizeHorizontal * 2),
              Expanded(child: Text(title, maxLines: 1, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w600))),
              const Spacer(),
              trailing ?? const Icon(Icons.arrow_forward_ios_rounded, size: 15),
            ],
          ),
        ),
      ),
    );
  }
}

// SettingItemUi(
//   callback: () => Get.to(() => const GeneralView()),
//   leading: AppIcons.square,
//   title: AppStrings.general.tr,
// ),
// SettingItemUi(
//   callback: () => Get.to(() => const DataSavingScreen()),
//   leading: AppIcons.timeWatched,
//   title: AppStrings.dataSaving.tr,
// ),
// SettingItemUi(
//   callback: () => Get.to(() => const VideoQualityPreferencesScreen()),
//   leading: AppIcons.videoBlack,
//   title: AppStrings.videoQuality.tr,
// ),

// SettingModal(
//   onTap: () {
//     Get.to(
//       () => const BackgroundDownloadsScreen(),
//     );
//   },
//   widget: const Icon(
//     Icons.arrow_forward_ios_rounded,
//     size: 15,
//   ),
//   iconImage: AppIcons.download,
//   tital: AppStrings.backgroundDownloads,
// ),
// SettingModal(
//   onTap: () {},
//   widget: const Icon(
//     Icons.arrow_forward_ios_rounded,
//     size: 15,
//   ),
//   iconImage: AppIcons.videoBlack,
//   tital: AppStrings.watchOnTV,
// ),

// SettingModal(
//   onTap: () {},
//   widget: const Icon(
//     Icons.arrow_forward_ios_rounded,
//     size: 15,
//   ),
//   iconImage: AppIcons.threeUser,
//   tital: AppStrings.communityGuidelines,
// ),
// SettingModal(
//   onTap: () {},
//   widget: const Icon(
//     Icons.arrow_forward_ios_rounded,
//     size: 15,
//   ),
//   iconImage: AppIcons.chat,
//   tital: AppStrings.liveChat,
// ),
// SettingModal(
//   onTap: () {},
//   widget: const Icon(
//     Icons.arrow_forward_ios_rounded,
//     size: 15,
//   ),
//   iconImage: AppIcons.paper,
//   tital: AppStrings.captions,
// ),
// SettingModal(
//   onTap: () {},
//   widget: const Icon(
//     Icons.arrow_forward_ios_rounded,
//     size: 15,
//   ),
//   iconImage: AppIcons.arrowRightCircle,
//   tital: AppStrings.accessibility,
// ),
