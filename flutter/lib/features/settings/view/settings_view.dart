import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/library/view/history_view.dart';
import 'package:youpeak/features/profile/controller/profile_controller.dart';
import 'package:youpeak/features/settings/view/grievance_view.dart';
import 'package:youpeak/features/settings/view/language_view.dart';
import 'package:youpeak/features/settings/view/privacy_policy_web_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/theme_services.dart';

import 'package:youpeak/features/premium/view/premium_plan_purchase_history_view.dart';

class SettingsView extends GetView<ProfileController> {
  const SettingsView({super.key});

  static void _toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value;
    ThemeService().switchTheme();
  }

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
        title: Text(AppStrings.settings.tr, style: GoogleFonts.urbanist(fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: -0.2)),
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
                callback: () {
                  final value = !AppSettings.isAutoPlayVideo.value;
                  AppSettings.isAutoPlayVideo.value = value;
                  Database.onSetAutoPlayVideo(value);
                },
                leading: AppIcons.play,
                title: AppStrings.autoPlay.tr,
                trailing: Obx(
                  () => Switch(
                    value: AppSettings.isAutoPlayVideo.value,
                    onChanged: (value) {
                      AppSettings.isAutoPlayVideo.value = value;
                      Database.onSetAutoPlayVideo(value);
                    },
                  ),
                ),
              ),

              SettingItemUi(
                leading: AppIcons.darkMode,
                title: AppStrings.darkMode.tr,
                // One handler: switchTheme() flips a *stored* value rather than
                // taking a target, so firing it twice per tap would leave
                // isDarkMode and the real ThemeMode pointing opposite ways.
                // The row's tap and the switch both end here, and a tap on the
                // switch itself is consumed by it (never reaches the row).
                callback: _toggleDarkMode,
                trailing: Obx(
                  () => Switch(
                    value: isDarkMode.value,
                    onChanged: (_) => _toggleDarkMode(),
                  ),
                ),
              ),
              SettingItemUi(
                callback: () {
                  controller.onGetPurchaseHistory(isFirstLoad: true);
                  Get.to(const PremiumPlanPurchaseHistoryView());
                },
                leading: AppIcons.extraPaymentHistory,
                title: AppStrings.paymentsHistory.tr,
              ),
              SettingItemUi(
                callback: () => Get.to(() => const LanguageView()),
                leading: AppIcons.translate,
                title: AppStrings.language.tr,
              ),
              SettingItemUi(
                callback: () {
                  final value = !AppSettings.showNotification.value;
                  AppSettings.showNotification.value = value;
                  Database.onSetNotification(value);
                },
                leading: AppIcons.notification,
                title: AppStrings.notification.tr,
                trailing: Obx(
                  () => Switch(
                    value: AppSettings.showNotification.value,
                    onChanged: (value) {
                      AppSettings.showNotification.value = value;
                      Database.onSetNotification(value);
                    },
                  ),
                ),
              ),
              SettingItemUi(
                callback: () => PrivacyPolicyWebView.open(),
                leading: AppIcons.extraPrivacyPolicy,
                title: AppStrings.privacyPolicy.tr,
              ),
              SettingItemUi(
                callback: () => Get.to(() => const GrievanceView()),
                leading: AppIcons.extraLegalSupport,
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
    final dark = isDarkMode.value;
    return AppPressable(
      onTap: callback,
      pressedScale: 0.985,
      semanticLabel: title,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 7),
        child: Row(
          children: [
            Container(
              height: 42,
              width: 42,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(13),
                color: dark ? AppColor.white.withValues(alpha: 0.08) : AppColor.secondaryMintGreen,
              ),
              child: Center(
                child: ImageIcon(AssetImage(leading), size: 22, color: dark ? AppColor.white : AppColor.darkForestAccent),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(child: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.urbanist(fontSize: 16.5, fontWeight: FontWeight.w700))),
            trailing ?? Icon(Icons.chevron_right_rounded, size: 24, color: dark ? AppColor.mutedTextDark : AppColor.mutedText),
          ],
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
