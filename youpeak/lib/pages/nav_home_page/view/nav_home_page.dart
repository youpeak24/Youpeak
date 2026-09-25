import 'package:flutter/material.dart';
import 'package:youpeak/utils/icons/app_visuals.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/pages/nav_home_page/controller/nav_home_controller.dart';
import 'package:youpeak/pages/nav_home_page/widget/nav_home_widget.dart';
import 'package:youpeak/pages/notification_page/notification_view.dart';
import 'package:youpeak/pages/profile_page/earn_reward_page/earn_reward_view.dart';
import 'package:youpeak/pages/profile_page/main_page/profile_view.dart';
import 'package:youpeak/pages/search_page/search_view.dart';
import 'package:youpeak/pages/video_details_page/video_details_model.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/services/preview_image.dart';
import 'package:youpeak/utils/settings/app_settings.dart';
import 'package:youpeak/utils/string/app_string.dart';

import 'package:youpeak/pages/nav_home_page/widget/premium_videos_shelf.dart';

VideoDetailsModel? videoDetailsModel;

class NavHomePageView extends StatefulWidget {
  const NavHomePageView({super.key});

  @override
  State<NavHomePageView> createState() => _NavHomePageViewState();
}

const _chipBadges = {
  "Popular": AppVisuals.topCreatorBadge,
  "New": AppVisuals.newBadge,
  "Live": AppVisuals.liveBadge,
};

class _NavHomePageViewState extends State<NavHomePageView> {
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        leadingWidth: 45,
        backgroundColor: Colors.transparent,
        // The wordmark's charcoal "You" disappears on dark surfaces, so dark
        // mode pairs the brand mark with live text instead.
        automaticallyImplyLeading: false,
        leading: isDarkMode.value
            ? Padding(
                padding: const EdgeInsets.only(left: 12),
                child: Image.asset(AppIcons.logo, width: 32, height: 32),
              )
            : null,
        titleSpacing: isDarkMode.value ? 5 : 4,
        title: isDarkMode.value
            ? Text(
                AppStrings.appName.tr,
                style: GoogleFonts.urbanist(fontSize: 22, fontWeight: FontWeight.w800, color: AppColor.white),
              )
            : Image.asset(AppVisuals.wordmark, height: 46, semanticLabel: AppStrings.appName.tr),
        actions: [
          GestureDetector(
            onTap: () => Get.to(() => const NotificationPageView()),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Obx(
                  () => Image.asset(
                    AppIcons.notification,
                    width: 22,
                    color: isDarkMode.value ? AppColor.white : AppColor.primaryTextIcons,
                  ),
                ),
                Positioned(
                  right: 0,
                  top: -2,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppColor.notificationAccent,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 18),
          GestureDetector(
            onTap: () => Get.to(() => const EarnRewardView()),
            child: Image.asset(
              AppIcons.earnRewardIcon,
              width: 22,
            ),
          ),
          const SizedBox(width: 18),
          GestureDetector(
            onTap: () => Get.to(() => const ProfileView()),
            child: Obx(
              () => PreviewProfileImage(
                size: 32,
                id: Database.channelId ?? "",
                image: AppSettings.profileImage.value,
                fit: BoxFit.cover,
              ),
            ),
          ),
          const SizedBox(width: 15),
        ],
      ),
      body: Column(
        children: [
          // Full-Width Search Bar directly under header (Spec 2.A)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 5),
            child: GestureDetector(
              onTap: () => Get.to(() => const SearchView(isSearchShorts: false)),
              child: Container(
                height: 40,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: AppColor.searchContainerBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Image.asset(
                      AppIcons.search,
                      width: 18,
                      color: AppColor.greyColor,
                    ),
                    const SizedBox(width: 10),
                    Text(
                      "Search videos...",
                      style: GoogleFonts.urbanist(
                        fontSize: 14,
                        color: AppColor.greyColor,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 5),
          // Category Filter Chips (Spec 2.B)
          SizedBox(
            width: Get.width,
            height: 36,
            child: GetBuilder<NavHomeController>(
              id: "onChangeTab",
              builder: (controller) => ListView.builder(
                padding: EdgeInsets.zero,
                scrollDirection: Axis.horizontal,
                itemCount: controller.tabTitles.length,
                itemBuilder: (context, index) {
                  final isSelected = controller.selectedTabIndex == index;
                  return GestureDetector(
                    onTap: () => controller.onChangeTab(index),
                    child: Container(
                      alignment: Alignment.center,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      margin: const EdgeInsets.only(left: 10),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColor.primaryColor : AppColor.secondaryMintGreen,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (_chipBadges[controller.tabTitles[index]] != null) ...[
                            Image.asset(_chipBadges[controller.tabTitles[index]]!, width: 18, height: 18),
                            const SizedBox(width: 4),
                          ],
                          Text(
                            controller.tabTitles[index],
                            style: GoogleFonts.urbanist(
                              fontSize: 13,
                              color: isSelected ? AppColor.white : AppColor.primaryTextIcons,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          // Premium Videos Shelf [NEW FEATURE] (Spec 2.C)
          const PremiumVideosShelf(),
          const SizedBox(height: 5),
          GetBuilder<NavHomeController>(
            id: "onChangeTab",
            builder: (controller) => controller.selectedTabIndex == 0
                ? const AllTabWidget()
                : controller.selectedTabIndex == 1
                    ? const PopularTabWidget()
                    : controller.selectedTabIndex == 2
                        ? const NewTabWidget()
                        : const LiveTabWidget(),
          ),
          Column(
            children: [
              GetBuilder<NavHomeController>(
                id: "onPagination",
                builder: (controller) => Visibility(
                  visible: controller.isLoadingPagination,
                  child: const LinearProgressIndicator(
                    backgroundColor: AppColor.grey,
                    color: AppColor.primaryColor,
                  ),
                ),
              ),
              Obx(
                () => Visibility(
                  visible: AppSettings.isUploading.value,
                  child: Container(
                    height: 38,
                    width: Get.width,
                    color: isDarkMode.value ? AppColor.secondDarkMode : Colors.white,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("${AppStrings.videoUploading.tr}...", style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold)).paddingOnly(left: 10),
                        const SizedBox(height: 5),
                        const LinearProgressIndicator(color: AppColor.primaryColor),
                      ],
                    ),
                  ),
                ),
              ),
              Obx(
                () => Visibility(
                  visible: AppSettings.isDownloading.value,
                  child: Container(
                    height: 38,
                    width: Get.width,
                    color: isDarkMode.value ? AppColor.secondDarkMode : Colors.white,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("${AppStrings.videoDownloading.tr}...", style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold)).paddingOnly(left: 10),
                        const SizedBox(height: 5),
                        const LinearProgressIndicator(color: AppColor.primaryColor),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
