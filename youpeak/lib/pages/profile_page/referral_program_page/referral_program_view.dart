import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/custom/custom_method/custom_toast.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/pages/profile_page/withdraw_page/withdraw_setting_api.dart';
import 'package:youpeak/pages/profile_page/referral_history_page/referral_history_view.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/icons/app_visuals.dart';
import 'package:youpeak/deep_link/share_manager/pure_flutter_share_service.dart';
import 'package:youpeak/utils/settings/app_settings.dart';
import 'package:youpeak/utils/string/app_string.dart';

class ReferralProgramView extends StatelessWidget {
  const ReferralProgramView({super.key});

  @override
  Widget build(BuildContext context) {
    print("******* ${AppSettings.referralCodeLink}");
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(MediaQuery.of(context).viewPadding.top + 60),
        child: Container(
          padding: EdgeInsets.only(top: MediaQuery.of(context).viewPadding.top, left: 15, right: 15),
          height: MediaQuery.of(context).viewPadding.top + 60,
          width: Get.width,
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
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 15),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Image.asset(
                AppIcons.referralImage,
                width: Get.width,
                height: 300,
              ),
              Text(
                AppStrings.referralProgramContent.tr,
                textAlign: TextAlign.center,
                style: GoogleFonts.urbanist(
                  fontSize: 16,
                  color: isDarkMode.value ? AppColor.white : AppColor.grey,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 25),
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
                width: Get.width,
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
                width: Get.width,
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
                    GestureDetector(
                      onTap: () {
                        Clipboard.setData(ClipboardData(text: AppSettings.referralCodeLink));
                        CustomToast.show(AppStrings.copiedOnClipboard.tr);
                      },
                      child: Image.asset(
                        AppIcons.copyIcon,
                        width: 22,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
      bottomNavigationBar: GestureDetector(
        onTap: () async {
          try {
            await PureFlutterShareService.shareAsset(assetPath: AppVisuals.referralShareBanner, text: AppSettings.referralCodeLink);
          } catch (e) {
            AppSettings.showLog("Share Error => $e");
          }
        },
        child: Container(
          height: 55,
          width: MediaQuery.of(context).size.width,
          alignment: Alignment.center,
          margin: const EdgeInsets.all(15),
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
      ),
    );
  }
}
