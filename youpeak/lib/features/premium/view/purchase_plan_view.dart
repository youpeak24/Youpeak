import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';

class PurchasePlanView extends StatelessWidget {
  const PurchasePlanView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        centerTitle: AppSettings.isCenterTitle,
        leadingWidth: 60,
        leading: IconButtonUi(
          callback: () => Get.back(),
          icon: Obx(
            () => Image.asset(AppIcons.arrowBack, height: 20, width: 20, color: isDarkMode.value ? AppColor.white : AppColor.black),
          ),
        ),
        title: Text(AppStrings.premium.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          const SizedBox(height: 20),
          Center(
            child: SizedBox(
              height: 180,
              width: 180,
              child: Image.asset(AppIcons.premiumDownload),
            ),
          ),
          const SizedBox(height: 20),
          Center(
            child: Text(
              AppStrings.youPeakPremium.tr,
              textAlign: TextAlign.center,
              style: GoogleFonts.urbanist(
                color: AppColor.primaryColor.withOpacity(0.9),
                fontWeight: FontWeight.w800,
                fontSize: 24,
              ),
            ),
          ),
          const SizedBox(height: 5),
          Center(
            child: Text(
              AppStrings.adFreeExperienceWithOfflineViewing.tr,
              textAlign: TextAlign.center,
              style: GoogleFonts.urbanist(
                color: AppColor.primaryColor.withOpacity(0.9),
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              RichText(
                text: TextSpan(
                  text: "\$${GetProfileApi.profileModel?.user?.plan?.amount}",
                  style: GoogleFonts.urbanist(color: isDarkMode.value ? AppColor.white : AppColor.primaryColor, fontSize: 34, fontWeight: FontWeight.w800),
                  children: [
                    TextSpan(
                      text: " / ${GetProfileApi.profileModel?.user?.plan?.validity} ${GetProfileApi.profileModel?.user?.plan?.validityType}",
                      style: GoogleFonts.urbanist(
                        fontWeight: FontWeight.w600,
                        fontSize: 18,
                        color: isDarkMode.value ? AppColor.grey : AppColor.lightPink,
                      ),
                    ),
                  ],
                ),
              ),
              Image.asset(
                AppIcons.tick,
                width: 20,
              ).paddingOnly(left: 5, top: 5),
            ],
          ),
          const SizedBox(height: 20),
          Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (int i = 0; i < (GetProfileApi.profileModel?.user?.plan?.planBenefit?.length ?? 0); i++)
                Row(
                  children: [
                    const ImageIcon(AssetImage(AppIcons.done), color: AppColor.lightPink, size: 18),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Text(
                        GetProfileApi.profileModel?.user?.plan?.planBenefit![i] ?? "",
                        overflow: TextOverflow.fade,
                        maxLines: 1,
                        style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w600, color: isDarkMode.value ? AppColor.white : AppColor.black),
                      ),
                    ),
                  ],
                ).paddingOnly(bottom: 6),
            ],
          ).paddingOnly(left: Get.width * 0.15),
          const SizedBox(height: 40),
          Container(
            height: 200,
            width: Get.width,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            margin: const EdgeInsets.symmetric(horizontal: 15),
            decoration: BoxDecoration(color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white, borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_300, blurRadius: 1.5)]),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      AppStrings.dateOfPurchase.tr,
                      style: GoogleFonts.urbanist(fontSize: 15, color: isDarkMode.value ? AppColor.white : AppColor.black, fontWeight: FontWeight.w600),
                    ).paddingOnly(left: 10),
                    Text(
                      DateFormat('dd/MM/yy').format(DateTime.parse(GetProfileApi.profileModel?.user?.plan?.planStartDate.toString() ?? DateTime.now().toString())),
                      style: GoogleFonts.urbanist(fontSize: 16, color: AppColor.primaryColor, fontWeight: FontWeight.w600),
                    ).paddingOnly(right: 10),
                  ],
                ),
                Divider(indent: 10, endIndent: 10, color: AppColor.grey_200),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      AppStrings.planDuration.tr,
                      style: GoogleFonts.urbanist(fontSize: 15, color: isDarkMode.value ? AppColor.white : AppColor.black, fontWeight: FontWeight.w600),
                    ).paddingOnly(left: 10),
                    Text(
                      "${DateTime.parse(GetProfileApi.profileModel?.user?.plan?.planEndDate.toString() ?? DateTime.now().toString()).difference(DateTime.now()).inDays.toString()} ${AppStrings.daysLeft.tr}",
                      style: GoogleFonts.urbanist(fontSize: 16, color: AppColor.primaryColor, fontWeight: FontWeight.w600),
                    ).paddingOnly(right: 10),
                  ],
                ),
                Divider(indent: 10, endIndent: 10, color: AppColor.grey_200),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      AppStrings.planStatus.tr,
                      style: GoogleFonts.urbanist(fontSize: 15, color: isDarkMode.value ? AppColor.white : AppColor.black, fontWeight: FontWeight.w600),
                    ).paddingOnly(left: 10),
                    Text(
                      (GetProfileApi.profileModel?.user?.isPremiumPlan ?? false) ? AppStrings.active.tr : AppStrings.expire.tr,
                      style: GoogleFonts.urbanist(fontSize: 16, color: AppColor.primaryColor, fontWeight: FontWeight.w600),
                    ).paddingOnly(right: 10),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
