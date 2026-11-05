import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_format_number.dart';
import 'package:youpeak/core/utils/custom_get_current_week_date.dart';
import 'package:youpeak/features/rewards/widget/earn_reward_shimmer_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/monetization/view/content_engagement_view.dart';
import 'package:youpeak/features/coins/view/convert_coin_view.dart';
import 'package:youpeak/features/rewards/controller/earn_reward_controller.dart';
import 'package:youpeak/features/referral/view/referral_program_view.dart';
import 'package:youpeak/features/tiers/view/tasker_tier_view.dart';
import 'package:youpeak/features/rewards/view/earn_reward_wide.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/core/constants/app_string.dart';

class EarnRewardView extends StatefulWidget {
  const EarnRewardView({super.key});

  @override
  State<EarnRewardView> createState() => _EarnRewardViewState();
}

class _EarnRewardViewState extends State<EarnRewardView> {
  final controller = Get.find<EarnRewardController>();

  @override
  void initState() {
    controller.init();
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    Timer(
      const Duration(milliseconds: 300),
      () {
        SystemChrome.setSystemUIOverlayStyle(
          const SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: Brightness.light,
          ),
        );
      },
    );

    return GetBuilder<EarnRewardController>(
      id: "onGetDailyRewards",
      builder: (controller) => (!controller.isLoadingDailyRewards && controller.dailyRewardsError != null)
          ? _EarnRewardError(message: controller.dailyRewardsError!, onRetry: controller.onGetDailyRewards)
          // Browser (any width): the responsive layout. The phone app keeps
          // its own design.
          : (!controller.isLoadingDailyRewards && kIsWeb)
          ? EarnRewardWide(controller: controller)
          : controller.isLoadingDailyRewards
          ? Scaffold(
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
                          AppStrings.earnRewards.tr,
                          style: GoogleFonts.urbanist(
                            fontSize: 19,
                            color: isDarkMode.value ? AppColor.white : AppColor.black,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const Spacer(),
                      GestureDetector(
                        onTap: () => Get.to(const ConvertCoinView()),
                        child: Container(
                          height: 35,
                          width: 35,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(color: AppColor.white, shape: BoxShape.circle, border: Border.all(color: AppColor.yellow, width: 1)),
                          child: Image.asset(
                            AppIcons.convertIcon,
                            width: 30,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              body: const EarnRewardShimmerUi(),
            )
          : Scaffold(
              body: Container(
                color: AppColor.transparent,
                height: Get.height,
                width: AppLayout.widthOf(context),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Positioned(
                      top: 0,
                      child: SizedBox(
                        height: 250,
                        width: AppLayout.widthOf(context),
                        child: Image.asset(
                          AppIcons.giftImage,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    Positioned(
                      top: MediaQuery.of(context).viewPadding.top,
                      child: SizedBox(
                        width: AppLayout.widthOf(context),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 15),
                          child: Row(
                            children: [
                              GestureDetector(
                                onTap: Get.back,
                                child: Container(
                                  height: 40,
                                  width: 40,
                                  alignment: Alignment.center,
                                  decoration: const BoxDecoration(color: Colors.transparent, shape: BoxShape.circle),
                                  child: const DecoratedBox(
                                    decoration: BoxDecoration(shape: BoxShape.circle, color: Color(0x33000000)),
                                    child: Padding(padding: EdgeInsets.all(6), child: Icon(Icons.arrow_back_rounded, color: Colors.white, size: 22)),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                AppStrings.earnRewards.tr,
                                style: GoogleFonts.urbanist(
                                  fontSize: 19,
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  shadows: const [Shadow(color: Color(0x99000000), blurRadius: 6)],
                                ),
                              ),
                              const Spacer(),
                              GestureDetector(
                                onTap: () => Get.to(const ConvertCoinView()),
                                child: Container(
                                  height: 35,
                                  width: 35,
                                  alignment: Alignment.center,
                                  decoration:
                                      BoxDecoration(color: AppColor.white, shape: BoxShape.circle, border: Border.all(color: AppColor.yellow, width: 1.5)),
                                  child: Image.asset(
                                    AppIcons.convertIcon,
                                    width: 30,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        Positioned(
                          top: MediaQuery.of(context).viewPadding.top + 50,
                          child: Container(
                            alignment: Alignment.center,
                            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
                            decoration: BoxDecoration(
                              color: AppColor.transparent,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Obx(
                              () => Column(
                                children: [
                                  Text(
                                    AppStrings.myRewardCoin.tr,
                                    style: GoogleFonts.urbanist(
                                      fontSize: 14,
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () => controller.isShowOriginalCoin.value = !controller.isShowOriginalCoin.value,
                                    child: SizedBox(
                                      width: AppLayout.width / 1.2,
                                      child: Row(
                                        crossAxisAlignment: CrossAxisAlignment.center,
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Image.asset(AppIcons.coin, width: 40),
                                          const SizedBox(width: 10),
                                          Flexible(
                                            child: Text(
                                              controller.isShowOriginalCoin.value
                                                  ? "${controller.myRewardCoin.value}"
                                                  : CustomFormatNumber.convert(controller.myRewardCoin.value),
                                              overflow: TextOverflow.ellipsis,
                                              maxLines: 1,
                                              style: GoogleFonts.urbanist(
                                                fontSize: 50,
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          top: 200,
                          child: SizedBox(
                            height: Get.height - 200,
                            width: AppLayout.widthOf(context),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              child: RefreshIndicator(
                                color: AppColor.primaryColor,
                                onRefresh: () async => await controller.init(),
                                child: ListView(
                                  controller: controller.scrollController,
                                  children: [
                                    Column(
                                      children: [
                                        Obx(
                                          () => Container(
                                            alignment: Alignment.center,
                                            height: 215,
                                            width: AppLayout.widthOf(context),
                                            padding: const EdgeInsets.symmetric(horizontal: 8),
                                            decoration: BoxDecoration(
                                              color: isDarkMode.value ? AppColor.mainDark : AppColor.white,
                                              borderRadius: BorderRadius.circular(30),
                                              border: Border.all(
                                                width: 1.5,
                                                color: AppColor.primaryColor.withOpacity(0.3),
                                              ),
                                            ),
                                            child: Column(
                                              children: [
                                                SizedBox(
                                                  height: 50,
                                                  child: Padding(
                                                    padding: const EdgeInsets.symmetric(horizontal: 5),
                                                    child: Row(
                                                      children: [
                                                        Image.asset(AppVisuals.streak, width: 24, height: 24),
                                                        const SizedBox(width: 6),
                                                        Flexible(
                                                          child: Text(
                                                            AppStrings.youHaveCheckedInFor.tr,
                                                            maxLines: 1,
                                                            overflow: TextOverflow.ellipsis,
                                                            style: GoogleFonts.urbanist(
                                                              fontSize: 15,
                                                              color: isDarkMode.value ? AppColor.primaryColor : AppColor.black.withOpacity(0.5),
                                                              fontWeight: FontWeight.w500,
                                                            ),
                                                          ),
                                                        ),
                                                        Container(
                                                          alignment: Alignment.center,
                                                          height: 28,
                                                          padding: const EdgeInsets.symmetric(horizontal: 15),
                                                          margin: const EdgeInsets.symmetric(horizontal: 10),
                                                          decoration: BoxDecoration(
                                                            color: AppColor.lightPink.withOpacity(0.1),
                                                            borderRadius: BorderRadius.circular(6),
                                                          ),
                                                          child: Text(
                                                            (controller.getDailyRewardModel?.streak ?? 0).toString(),
                                                            style: GoogleFonts.urbanist(
                                                              fontSize: 18,
                                                              color: AppColor.primaryColor,
                                                              fontWeight: FontWeight.w700,
                                                            ),
                                                          ),
                                                        ),
                                                        Text(
                                                          AppStrings.dayStraight.tr,
                                                          style: GoogleFonts.urbanist(
                                                            fontSize: 15,
                                                            color: isDarkMode.value ? AppColor.primaryColor : AppColor.black.withOpacity(0.5),
                                                            fontWeight: FontWeight.w500,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                                GetBuilder<EarnRewardController>(
                                                  id: "onGetDailyRewards",
                                                  builder: (controller) => SizedBox(
                                                    height: 75,
                                                    child: ListView.builder(
                                                      itemCount: controller.dailyRewards.length,
                                                      padding: EdgeInsets.zero,
                                                      scrollDirection: Axis.horizontal,
                                                      itemBuilder: (context, index) {
                                                        final value = controller.dailyRewards[index];

                                                        // India-time calendar from the server.
                                                        final isToday = controller.isTodayIndex(index);
                                                        final isPreviousDay = controller.isPastIndex(index);

                                                        return Container(
                                                          height: 65,
                                                          width: 48,
                                                          margin: const EdgeInsets.only(right: 6),
                                                          decoration: BoxDecoration(
                                                            color: (isPreviousDay && value.isCheckIn == false)
                                                                ? AppColor.lightRed
                                                                : (value.isCheckIn == true)
                                                                    ? AppColor.lightGreen
                                                                    : (isToday && value.isCheckIn == false)
                                                                        ? AppColor.primaryColor
                                                                        : isDarkMode.value
                                                                            ? AppColor.grey_400.withOpacity(0.2)
                                                                            : AppColor.grey_100,
                                                            borderRadius: BorderRadius.circular(10),
                                                          ),
                                                          child: Column(
                                                            mainAxisAlignment: MainAxisAlignment.start,
                                                            children: [
                                                              Container(
                                                                height: 20,
                                                                width: 52,
                                                                alignment: Alignment.center,
                                                                decoration: BoxDecoration(
                                                                  color: (isPreviousDay && value.isCheckIn == false)
                                                                      ? AppColor.lightRed1
                                                                      : (value.isCheckIn == true)
                                                                          ? AppColor.lightGreen1
                                                                          : (isToday && value.isCheckIn == false)
                                                                              ? isDarkMode.value
                                                                                  ? AppColor.black.withOpacity(0.2)
                                                                                  : AppColor.black.withOpacity(0.15)
                                                                              : isDarkMode.value
                                                                                  ? AppColor.grey_400.withOpacity(0.15)
                                                                                  : AppColor.grey_200,
                                                                  borderRadius: const BorderRadius.only(
                                                                    topLeft: Radius.circular(10),
                                                                    topRight: Radius.circular(10),
                                                                  ),
                                                                ),
                                                                child: Text(
                                                                  (isPreviousDay && value.isCheckIn == false) ? "Lost" : "+${value.reward ?? 0}",
                                                                  style: GoogleFonts.urbanist(
                                                                    fontSize: 10,
                                                                    color: (isPreviousDay && value.isCheckIn == false)
                                                                        ? AppColor.white
                                                                        : (value.isCheckIn == true)
                                                                            ? AppColor.darkGrey
                                                                            : (isToday && value.isCheckIn == false)
                                                                                ? AppColor.white
                                                                                : isDarkMode.value
                                                                                    ? AppColor.white
                                                                                    : AppColor.grey,
                                                                    fontWeight: FontWeight.w800,
                                                                  ),
                                                                ),
                                                              ),
                                                              Expanded(
                                                                child: Center(
                                                                  child: Image.asset(
                                                                    (isPreviousDay && value.isCheckIn == false)
                                                                        ? AppIcons.closeIcon
                                                                        : (isToday || value.isCheckIn == true)
                                                                            ? AppIcons.coinIcon
                                                                            : AppIcons.coinIconGrey,
                                                                    height: isToday ? 30 : 24,
                                                                  ),
                                                                ),
                                                              ),
                                                              SizedBox(
                                                                height: 15,
                                                                child: Text(
                                                                  isToday
                                                                      ? AppStrings.today.tr
                                                                      : CustomGetCurrentWeekDate.onShow(CustomGetCurrentWeekDate.onGet()[index]),
                                                                  style: GoogleFonts.urbanist(
                                                                    fontSize: 8,
                                                                    color: (isPreviousDay && value.isCheckIn == false)
                                                                        ? AppColor.darkRed
                                                                        : (value.isCheckIn == true)
                                                                            ? AppColor.darkGrey
                                                                            : (isToday && value.isCheckIn == false)
                                                                                ? AppColor.white
                                                                                : isDarkMode.value
                                                                                    ? AppColor.white
                                                                                    : AppColor.black.withOpacity(0.6),
                                                                    fontWeight: FontWeight.w700,
                                                                  ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        );
                                                      },
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(height: 15),
                                                GestureDetector(
                                                  onTap: () => controller.onCheckIn(context),
                                                  child: Container(
                                                    height: 55,
                                                    alignment: Alignment.center,
                                                    margin: const EdgeInsets.symmetric(horizontal: 10),
                                                    decoration: BoxDecoration(
                                                      color: controller.isTodayCheckIn
                                                          ? isDarkMode.value
                                                              ? AppColor.grey.withOpacity(0.15)
                                                              : AppColor.grey.withOpacity(0.5)
                                                          : AppColor.primaryColor,
                                                      borderRadius: BorderRadius.circular(50),
                                                    ),
                                                    child: Row(
                                                      mainAxisSize: MainAxisSize.min,
                                                      children: [
                                                        Image.asset(AppVisuals.checkIn, width: 26, height: 26),
                                                        const SizedBox(width: 8),
                                                        Text(
                                                          AppStrings.checkIn.tr,
                                                          style: GoogleFonts.urbanist(
                                                            fontSize: 16,
                                                            color: Colors.white,
                                                            fontWeight: FontWeight.bold,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                        const SizedBox(height: 20),
                                        Container(
                                          width: AppLayout.widthOf(context),
                                          decoration: BoxDecoration(
                                            color: isDarkMode.value ? AppColor.mainDark : AppColor.white,
                                            borderRadius: BorderRadius.circular(30),
                                            border: Border.all(
                                              width: 1.5,
                                              color: AppColor.primaryColor.withOpacity(0.3),
                                            ),
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            mainAxisAlignment: MainAxisAlignment.start,
                                            children: [
                                              Container(
                                                alignment: Alignment.centerLeft,
                                                height: 60,
                                                padding: const EdgeInsets.symmetric(horizontal: 20),
                                                decoration: BoxDecoration(
                                                  color: AppColor.lightPink.withOpacity(0.2),
                                                  borderRadius: const BorderRadius.only(
                                                    topLeft: Radius.circular(28),
                                                    topRight: Radius.circular(28),
                                                  ),
                                                ),
                                                child: Text(
                                                  AppStrings.earnMore.tr,
                                                  style: GoogleFonts.urbanist(
                                                    fontSize: 18,
                                                    color: AppColor.primaryColor,
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                                ),
                                              ),
                                              Container(
                                                height: 80,
                                                color: Colors.transparent,
                                                padding: const EdgeInsets.only(left: 5, right: 15),
                                                child: Row(
                                                  crossAxisAlignment: CrossAxisAlignment.center,
                                                  children: [
                                                    Container(
                                                      alignment: Alignment.center,
                                                      height: 55,
                                                      padding: const EdgeInsets.symmetric(horizontal: 20),
                                                      decoration: BoxDecoration(
                                                        color: AppColor.lightPink.withOpacity(0.2),
                                                        shape: BoxShape.circle,
                                                      ),
                                                      child: Image.asset(AppIcons.referralIcon, width: 30),
                                                    ),
                                                    const SizedBox(width: 8),
                                                    Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      mainAxisAlignment: MainAxisAlignment.center,
                                                      children: [
                                                        Obx(
                                                          () => Text(
                                                            AppStrings.referralReward.tr,
                                                            style: GoogleFonts.urbanist(
                                                              fontSize: 18,
                                                              color: isDarkMode.value ? AppColor.primaryColor : AppColor.black,
                                                              fontWeight: FontWeight.w700,
                                                            ),
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                    const Spacer(),
                                                    GestureDetector(
                                                      onTap: () {
                                                        Get.to(const ReferralProgramView());
                                                      },
                                                      child: Container(
                                                        height: 32,
                                                        width: 70,
                                                        alignment: Alignment.center,
                                                        decoration: BoxDecoration(
                                                          color: AppColor.primaryColor,
                                                          borderRadius: BorderRadius.circular(30),
                                                        ),
                                                        child: Text(
                                                          AppStrings.go.tr,
                                                          style: GoogleFonts.urbanist(
                                                            fontSize: 15,
                                                            color: AppColor.white,
                                                            fontWeight: FontWeight.w700,
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                              Divider(
                                                indent: 15,
                                                endIndent: 15,
                                                color: AppColor.lightPink.withOpacity(0.2),
                                              ),
                                              GestureDetector(
                                                onTap: () {
                                                  Get.to(const ContentEngagementView());
                                                },
                                                child: Container(
                                                  height: 80,
                                                  color: Colors.transparent,
                                                  padding: const EdgeInsets.only(left: 5, right: 15),
                                                  child: Row(
                                                    crossAxisAlignment: CrossAxisAlignment.center,
                                                    children: [
                                                      Container(
                                                        alignment: Alignment.center,
                                                        height: 55,
                                                        padding: const EdgeInsets.symmetric(horizontal: 20),
                                                        decoration: BoxDecoration(
                                                          color: AppColor.lightPink.withOpacity(0.2),
                                                          shape: BoxShape.circle,
                                                        ),
                                                        child: Image.asset(AppIcons.engagementIcon, width: 30),
                                                      ),
                                                      const SizedBox(width: 8),
                                                      Column(
                                                        crossAxisAlignment: CrossAxisAlignment.start,
                                                        mainAxisAlignment: MainAxisAlignment.center,
                                                        children: [
                                                          Obx(
                                                            () => Text(
                                                              AppStrings.engagementRewards.tr,
                                                              style: GoogleFonts.urbanist(
                                                                fontSize: 18,
                                                                color: isDarkMode.value ? AppColor.primaryColor : AppColor.black,
                                                                fontWeight: FontWeight.w700,
                                                              ),
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                      const Spacer(),
                                                      Container(
                                                        height: 32,
                                                        width: 70,
                                                        alignment: Alignment.center,
                                                        decoration: BoxDecoration(
                                                          color: AppColor.primaryColor,
                                                          borderRadius: BorderRadius.circular(30),
                                                        ),
                                                        child: Text(
                                                          AppStrings.go.tr,
                                                          style: GoogleFonts.urbanist(
                                                            fontSize: 15,
                                                            color: AppColor.white,
                                                            fontWeight: FontWeight.w700,
                                                          ),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                              Divider(
                                                indent: 15,
                                                endIndent: 15,
                                                color: AppColor.lightPink.withOpacity(0.2),
                                              ),
                                              GestureDetector(
                                                onTap: () {
                                                  Get.to(const TaskerTierView());
                                                },
                                                child: Container(
                                                  height: 80,
                                                  color: Colors.transparent,
                                                  padding: const EdgeInsets.only(left: 5, right: 15),
                                                  child: Row(
                                                    crossAxisAlignment: CrossAxisAlignment.center,
                                                    children: [
                                                      Container(
                                                        alignment: Alignment.center,
                                                        height: 55,
                                                        padding: const EdgeInsets.symmetric(horizontal: 20),
                                                        decoration: BoxDecoration(
                                                          color: AppColor.lightPink.withOpacity(0.2),
                                                          shape: BoxShape.circle,
                                                        ),
                                                        child: Image.asset(AppIcons.king, width: 30),
                                                      ),
                                                      const SizedBox(width: 8),
                                                      Column(
                                                        crossAxisAlignment: CrossAxisAlignment.start,
                                                        mainAxisAlignment: MainAxisAlignment.center,
                                                        children: [
                                                          Obx(
                                                            () => Text(
                                                              AppStrings.starterPass.tr,
                                                              style: GoogleFonts.urbanist(
                                                                fontSize: 18,
                                                                color: isDarkMode.value ? AppColor.primaryColor : AppColor.black,
                                                                fontWeight: FontWeight.w700,
                                                              ),
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                      const Spacer(),
                                                      Container(
                                                        height: 32,
                                                        width: 70,
                                                        alignment: Alignment.center,
                                                        decoration: BoxDecoration(
                                                          color: AppColor.primaryColor,
                                                          borderRadius: BorderRadius.circular(30),
                                                        ),
                                                        child: Text(
                                                          AppStrings.go.tr,
                                                          style: GoogleFonts.urbanist(
                                                            fontSize: 15,
                                                            color: AppColor.white,
                                                            fontWeight: FontWeight.w700,
                                                          ),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(height: 20),
                                        GetBuilder<EarnRewardController>(
                                          id: "onGetAdRewards",
                                          builder: (controller) => Container(
                                            width: AppLayout.widthOf(context),
                                            decoration: BoxDecoration(
                                              color: isDarkMode.value ? AppColor.mainDark : AppColor.white,
                                              borderRadius: BorderRadius.circular(30),
                                              border: Border.all(
                                                width: 1.5,
                                                color: AppColor.primaryColor.withOpacity(0.3),
                                              ),
                                            ),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              mainAxisAlignment: MainAxisAlignment.start,
                                              children: [
                                                Container(
                                                  alignment: Alignment.centerLeft,
                                                  height: 60,
                                                  padding: const EdgeInsets.symmetric(horizontal: 20),
                                                  decoration: BoxDecoration(
                                                    color: AppColor.lightPink.withOpacity(0.2),
                                                    borderRadius: const BorderRadius.only(
                                                      topLeft: Radius.circular(28),
                                                      topRight: Radius.circular(28),
                                                    ),
                                                  ),
                                                  child: Row(
                                                    children: [
                                                      Image.asset(AppVisuals.dailyTasks, width: 30, height: 30),
                                                      const SizedBox(width: 10),
                                                      Text(
                                                        AppStrings.myDailyTasks.tr,
                                                        style: GoogleFonts.urbanist(
                                                          fontSize: 18,
                                                          color: AppColor.primaryColor,
                                                          fontWeight: FontWeight.w700,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                if (!EarnRewardController.adsAvailable) const _AdsAppOnlyNotice(),
                                                const SizedBox(height: 5),
                                                for (int index = 0; index < controller.adRewards.length; index++)
                                                  GetBuilder<EarnRewardController>(
                                                    id: "onChangeAdReward",
                                                    builder: (controller) => Column(
                                                      children: [
                                                        Container(
                                                          height: 70,
                                                          color: Colors.transparent,
                                                          padding: const EdgeInsets.only(left: 5, right: 15),
                                                          child: Row(
                                                            crossAxisAlignment: CrossAxisAlignment.center,
                                                            children: [
                                                              Container(
                                                                alignment: Alignment.center,
                                                                height: 55,
                                                                padding: const EdgeInsets.symmetric(horizontal: 20),
                                                                decoration: BoxDecoration(
                                                                  color: AppColor.lightPink.withOpacity(0.2),
                                                                  shape: BoxShape.circle,
                                                                ),
                                                                child: Image.asset(AppIcons.adIcon, width: 30),
                                                              ),
                                                              const SizedBox(width: 8),
                                                              Column(
                                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                                mainAxisAlignment: MainAxisAlignment.center,
                                                                children: [
                                                                  Obx(
                                                                    () => Text(
                                                                      controller.adRewards[index].adLabel ?? "",
                                                                      style: GoogleFonts.urbanist(
                                                                        fontSize: 18,
                                                                        color: isDarkMode.value ? AppColor.primaryColor : AppColor.black,
                                                                        fontWeight: FontWeight.w700,
                                                                      ),
                                                                    ),
                                                                  ),
                                                                  Row(
                                                                    children: [
                                                                      Image.asset(AppIcons.coin,
                                                                          opacity: AlwaysStoppedAnimation(isDarkMode.value ? 0.7 : 1), width: 20),
                                                                      const SizedBox(width: 3),
                                                                      Text(
                                                                        "+${controller.adRewards[index].coinEarnedFromAd ?? 0}",
                                                                        style: GoogleFonts.urbanist(
                                                                          fontSize: 16,
                                                                          color: isDarkMode.value ? AppColor.yellow.withOpacity(0.7) : AppColor.yellow,
                                                                          fontWeight: FontWeight.w800,
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ],
                                                              ),
                                                              const Spacer(),
                                                              if (!EarnRewardController.adsAvailable)
                                                                const _AppOnlyPill()
                                                              else
                                                                GestureDetector(
                                                                  onTap: () {
                                                                    controller.onClickPlay(index);
                                                                  },
                                                                  child: Container(
                                                                    height: 32,
                                                                    width: 80,
                                                                    alignment: Alignment.center,
                                                                    decoration: BoxDecoration(
                                                                      color: index < controller.completeAdTask
                                                                          ? AppColor.lightGreen
                                                                          : index != controller.completeAdTask
                                                                              ? isDarkMode.value
                                                                                  ? AppColor.grey.withOpacity(0.2)
                                                                                  : AppColor.grey_300
                                                                              : controller.isEnableCurrentAdTask
                                                                                  ? AppColor.primaryColor
                                                                                  : AppColor.primaryColor.withOpacity(0.15),
                                                                      borderRadius: BorderRadius.circular(30),
                                                                    ),
                                                                    child: Text(
                                                                      index < controller.completeAdTask
                                                                          ? AppStrings.earned.tr
                                                                          : index != controller.completeAdTask
                                                                              ? AppStrings.play.tr
                                                                              : controller.isEnableCurrentAdTask
                                                                                  ? AppStrings.play.tr
                                                                                  : controller.convertAdTime(controller.nextAdTaskTime),
                                                                      style: GoogleFonts.urbanist(
                                                                        fontSize: 15,
                                                                        color: (index == controller.completeAdTask && !controller.isEnableCurrentAdTask)
                                                                            ? AppColor.primaryColor
                                                                            : index < controller.completeAdTask
                                                                                ? AppColor.darkGrey
                                                                                : AppColor.white,
                                                                        fontWeight: FontWeight.w700,
                                                                      ),
                                                                    ),
                                                                  ),
                                                                ),
                                                            ],
                                                          ),
                                                        ),
                                                        Visibility(
                                                          visible: index < (controller.adRewards.length - 1),
                                                          child: Divider(
                                                            indent: 15,
                                                            endIndent: 15,
                                                            color: AppColor.lightPink.withOpacity(0.2),
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                if (controller.isPaginationLoading)
                                                  const Padding(
                                                    padding: EdgeInsets.all(15),
                                                    child: Center(
                                                      child: CircularProgressIndicator(
                                                        color: AppColor.primaryColor,
                                                      ),
                                                    ),
                                                  ),
                                                const SizedBox(height: 5),
                                              ],
                                            ),
                                          ),
                                        ),
                                        const SizedBox(height: 60),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}

class _EarnRewardError extends StatelessWidget {
  const _EarnRewardError({required this.message, required this.onRetry});

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(AppStrings.earnRewards.tr, style: GoogleFonts.urbanist(fontWeight: FontWeight.bold))),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off_rounded, size: 40, color: Colors.grey),
              const SizedBox(height: 10),
              Text(message, textAlign: TextAlign.center, style: GoogleFonts.urbanist(fontSize: 15)),
              const SizedBox(height: 14),
              OutlinedButton.icon(onPressed: onRetry, icon: const AppIcon(AppIcons.extraRetry, size: 20), label: const Text("Retry")),
            ],
          ),
        ),
      ),
    );
  }
}

// Rewarded ads can't run (or be verified) in a browser, so on the website
// the ad tasks are shown as app-only instead of as Play buttons that can't
// pay. Check-in, watch time, likes and comments still earn here.
class _AdsAppOnlyNotice extends StatelessWidget {
  const _AdsAppOnlyNotice();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.phone_iphone_rounded, size: 20, color: AppColor.primaryColor),
          const SizedBox(width: 8),
          Expanded(
            child: Obx(
              () => Text(
                "Rewarded ads are available in the YouPeak mobile app. Your other tasks keep earning here.",
                style: GoogleFonts.urbanist(
                  fontSize: 14,
                  height: 1.35,
                  color: isDarkMode.value ? AppColor.white.withValues(alpha: 0.8) : AppColor.black.withValues(alpha: 0.65),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AppOnlyPill extends StatelessWidget {
  const _AppOnlyPill();

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: "Available in the mobile app",
      child: Container(
        height: 32,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isDarkMode.value ? AppColor.grey.withValues(alpha: 0.2) : AppColor.grey_200,
          borderRadius: BorderRadius.circular(30),
        ),
        child: Text(
          "App only",
          style: GoogleFonts.urbanist(fontSize: 14, color: AppColor.darkGrey, fontWeight: FontWeight.w700),
        ),
      ),
    );
  }
}
