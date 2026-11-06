import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/wallet/api/withdraw_setting_api.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';

class ContentEngagementView extends StatelessWidget {
  const ContentEngagementView({super.key});

  @override
  Widget build(BuildContext context) {
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
                  AppStrings.viewContentEngagement.tr,
                  style: GoogleFonts.urbanist(
                    fontSize: 19,
                    color: isDarkMode.value ? AppColor.white : AppColor.black,
                    fontWeight: FontWeight.bold,
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
            children: [
              const SizedBox(height: 25),
              Image.asset(
                AppIcons.contentImage,
                width: AppLayout.widthOf(context),
                height: 300,
              ),
              const SizedBox(height: 25),
              Container(
                height: 120,
                width: AppLayout.widthOf(context),
                padding: const EdgeInsets.symmetric(horizontal: 15),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColor.grey_300),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          AppStrings.watchingVideos.tr,
                          style: GoogleFonts.urbanist(
                            fontSize: 20,
                            color: isDarkMode.value ? AppColor.white : AppColor.black,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          (WithdrawSettingApi.withdrawSettingModel?.data?.watchingVideoRewardCoins ?? 0).toString(),
                          style: GoogleFonts.urbanist(
                            fontSize: 20,
                            color: isDarkMode.value ? AppColor.white : AppColor.black,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 5),
                        Image.asset(
                          AppIcons.coin,
                          width: 22,
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Text(
                      AppStrings.watchingVideosContent.tr,
                      style: GoogleFonts.urbanist(
                        fontSize: 16,
                        color: isDarkMode.value ? AppColor.white : AppColor.grey,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 15),
              Container(
                height: 120,
                width: AppLayout.widthOf(context),
                padding: const EdgeInsets.symmetric(horizontal: 15),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColor.grey_300),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          AppStrings.commenting.tr,
                          style: GoogleFonts.urbanist(
                            fontSize: 20,
                            color: isDarkMode.value ? AppColor.white : AppColor.black,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          (WithdrawSettingApi.withdrawSettingModel?.data?.commentingRewardCoins ?? 0).toString(),
                          style: GoogleFonts.urbanist(
                            fontSize: 20,
                            color: isDarkMode.value ? AppColor.white : AppColor.black,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 5),
                        Image.asset(
                          AppIcons.coin,
                          width: 22,
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Text(
                      AppStrings.commentingContent.tr,
                      style: GoogleFonts.urbanist(
                        fontSize: 16,
                        color: isDarkMode.value ? AppColor.white : AppColor.grey,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 15),
              Container(
                height: 120,
                width: AppLayout.widthOf(context),
                padding: const EdgeInsets.symmetric(horizontal: 15),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColor.grey_300),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        Text(
                          AppStrings.likingVideos.tr,
                          style: GoogleFonts.urbanist(
                            fontSize: 20,
                            color: isDarkMode.value ? AppColor.white : AppColor.black,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          (WithdrawSettingApi.withdrawSettingModel?.data?.likeVideoRewardCoins ?? 0).toString(),
                          style: GoogleFonts.urbanist(
                            fontSize: 20,
                            color: isDarkMode.value ? AppColor.white : AppColor.black,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 5),
                        Image.asset(
                          AppIcons.coin,
                          width: 22,
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Text(
                      AppStrings.likingVideosContent.tr,
                      style: GoogleFonts.urbanist(
                        fontSize: 16,
                        color: isDarkMode.value ? AppColor.white : AppColor.grey,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 15),
            ],
          ),
        ),
      ),
    );
  }
}
