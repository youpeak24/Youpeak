import 'package:youpeak/core/platform/responsive.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/wallet/api/withdraw_setting_api.dart';
import 'package:youpeak/features/referral/view/referral_history_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/core/deep_link/share_manager/pure_flutter_share_service.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';

class ReferralProgramView extends StatelessWidget {
  const ReferralProgramView({super.key});

  @override
  Widget build(BuildContext context) {
    print("******* ${AppSettings.referralCodeLink}");
    final wide = PageWidth.of(context) >= Responsive.splitFrom;
    final inline = PageWidth.of(context) >= Responsive.inlineActionFrom;

    final referNow = GestureDetector(
      onTap: () async {
        try {
          await PureFlutterShareService.shareAsset(assetPath: AppVisuals.referralShareBanner, text: AppSettings.referralCodeLink);
        } catch (e) {
          AppSettings.showLog("Share Error => $e");
        }
      },
      child: Container(
        height: 55,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColor.primaryColor,
          borderRadius: BorderRadius.circular(100),
        ),
        child: Text(
          AppStrings.referNow.tr,
          textAlign: TextAlign.center,
          style: GoogleFonts.urbanist(
            fontWeight: FontWeight.w700,
            fontSize: 16,
            color: AppColor.white,
          ),
        ),
      ),
    );

    // The artwork (square, so it is sized by height and never stretched) and
    // what the programme is.
    final intro = <Widget>[
      Image.asset(AppIcons.referralImage, height: 300, fit: BoxFit.contain),
      Text(
        AppStrings.referralProgramContent.tr,
        textAlign: TextAlign.center,
        style: GoogleFonts.urbanist(
          fontSize: 16,
          color: isDarkMode.value ? AppColor.white : AppColor.grey,
          fontWeight: FontWeight.w500,
        ),
      ),
    ];

    // The bonus, the personal link, and (wide) the action next to them.
    final details = <Widget>[
      Text(
        AppStrings.referralBonus.tr,
        style: GoogleFonts.urbanist(
          fontSize: 18,
          color: isDarkMode.value ? AppColor.white : AppColor.black,
          fontWeight: FontWeight.w700,
        ),
      ),
      const SizedBox(height: 15),
      Container(
        height: 100,
        decoration: BoxDecoration(
          color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_200, blurRadius: 10)],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  height: 35,
                  child: Text(
                    "1",
                    style: GoogleFonts.urbanist(fontSize: 24, color: AppColor.primaryColor, fontWeight: FontWeight.w800),
                  ),
                ),
                Text(
                  AppStrings.numberOfMember.tr,
                  style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.grey, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            Image.asset(AppIcons.arrowDoubleRight, width: 25),
            Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  height: 35,
                  child: Text(
                    (WithdrawSettingApi.withdrawSettingModel?.data?.referralRewardCoins ?? 0).toString(),
                    style: GoogleFonts.urbanist(fontSize: 24, color: AppColor.primaryColor, fontWeight: FontWeight.w800),
                  ),
                ),
                Text(
                  AppStrings.earnCoins.tr,
                  style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.grey, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ],
        ),
      ),
      const SizedBox(height: 30),
      Text(
        AppStrings.referralLink.tr,
        style: GoogleFonts.urbanist(
          fontSize: 18,
          color: isDarkMode.value ? AppColor.white : AppColor.black,
          fontWeight: FontWeight.w700,
        ),
      ),
      const SizedBox(height: 15),
      Container(
        height: 50,
        padding: const EdgeInsets.symmetric(horizontal: 15),
        decoration: BoxDecoration(
          border: Border.all(color: AppColor.grey_200),
          borderRadius: BorderRadius.circular(15),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                AppSettings.referralCodeLink,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.urbanist(
                  fontSize: 14,
                  color: isDarkMode.value ? AppColor.white : AppColor.black,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            AppPressable(
              onTap: () {
                Clipboard.setData(ClipboardData(text: AppSettings.referralCodeLink));
                CustomToast.show(AppStrings.copiedOnClipboard.tr);
              },
              semanticLabel: "Copy link",
              child: const SizedBox(
                width: 48,
                height: 48,
                child: Center(child: AppIcon(AppIcons.extraCopyLink, size: 24, color: AppColor.primaryColor)),
              ),
            ),
          ],
        ),
      ),
    ];

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(MediaQuery.of(context).viewPadding.top + 60),
        child: Container(
          padding: EdgeInsets.only(top: MediaQuery.of(context).viewPadding.top, left: 15, right: 15),
          height: MediaQuery.of(context).viewPadding.top + 60,
          width: AppLayout.widthOf(context),
          color: AppColor.transparent,
          child: Row(
            children: [
              GestureDetector(
                onTap: Get.back,
                child: Container(
                  height: 40,
                  width: 40,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(color: Colors.transparent, shape: BoxShape.circle),
                  child: Obx(
                    () => Image.asset(
                      AppIcons.arrowBack,
                      color: isDarkMode.value ? AppColor.white : AppColor.black,
                      width: 23,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Obx(
                () => Text(
                  AppStrings.referralProgram.tr,
                  style: GoogleFonts.urbanist(
                    fontSize: 19,
                    color: isDarkMode.value ? AppColor.white : AppColor.black,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () => Get.to(const ReferralHistoryView()),
                child: Container(
                  height: 40,
                  width: 40,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(color: Colors.transparent, shape: BoxShape.circle),
                  child: Obx(
                    () => Image.asset(
                      AppIcons.historyIcon,
                      color: isDarkMode.value ? AppColor.white : AppColor.black,
                      width: 23,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      // Wide: artwork and explanation beside the bonus, link and the action
      // that shares it. Phones: one column with the action docked below.
      body: wide
          ? AdaptiveScroll(
              maxWidth: 1000,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: intro)),
                  const SizedBox(width: 48),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [...details, const SizedBox(height: 28), referNow],
                    ),
                  ),
                ],
              ),
            )
          : Padding(
              padding: const EdgeInsets.symmetric(horizontal: 15),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    ...intro,
                    const SizedBox(height: 25),
                    ...details,
                    // Between a phone and a split layout the action still sits under the link.
                    if (inline) ...[const SizedBox(height: 28), referNow],
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
      bottomNavigationBar: inline ? null : Padding(padding: const EdgeInsets.all(15), child: referNow),
    );
  }
}
