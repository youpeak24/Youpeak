import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/home/controller/nav_home_controller.dart';
import 'package:youpeak/features/home/widget/nav_home_widget.dart';
import 'package:youpeak/features/notifications/view/notification_view.dart';
import 'package:youpeak/features/tasker/presentation/tasker_dashboard_view.dart';
import 'package:youpeak/features/profile/view/profile_view.dart';
import 'package:youpeak/features/search/view/search_view.dart';
import 'package:youpeak/features/video/model/video_details_model.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';

import 'package:youpeak/features/home/widget/premium_videos_shelf.dart';
import 'package:youpeak/features/video_promotion/widget/promoted_videos_shelf.dart';

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

  Widget _searchBar() {
    final dark = isDarkMode.value;
    return AppPressable(
      onTap: () => Get.to(() => const SearchView(isSearchShorts: false)),
      pressedScale: 0.985,
      semanticLabel: "Search videos",
      child: Container(
        height: 46,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: dark ? AppColor.darkElevated : AppColor.searchContainerBg,
          borderRadius: BorderRadius.circular(AppRadius.control + 2),
          border: Border.all(color: AppElevation.hairline(dark)),
        ),
        child: Row(
          children: [
            AppIcon(
              AppIcons.search,
              size: 20,
              color: dark ? AppColor.mutedTextDark : AppColor.greyColor,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                "Search videos...",
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.urbanist(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w500,
                  color: dark ? AppColor.mutedTextDark : AppColor.greyColor,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Wide browser windows: the sidebar carries the logo, so the header
    // holds the search box instead.
    final wide = AppLayout.isWideWeb;
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        leadingWidth: 45,
        backgroundColor: Colors.transparent,
        // The wordmark's charcoal "You" disappears on dark surfaces, so dark
        // mode pairs the brand mark with live text instead.
        automaticallyImplyLeading: false,
        leading: isDarkMode.value && !wide
            ? Padding(
                padding: const EdgeInsets.only(left: 12),
                child: Image.asset(AppIcons.logo, width: 32, height: 32),
              )
            : null,
        titleSpacing: wide ? 16 : (isDarkMode.value ? 5 : 4),
        centerTitle: wide,
        title: wide
            ? ConstrainedBox(constraints: const BoxConstraints(maxWidth: 640), child: _searchBar())
            : isDarkMode.value
                ? Text(
                    AppStrings.appName.tr,
                    style: GoogleFonts.urbanist(fontSize: 22, fontWeight: FontWeight.w800, color: AppColor.white),
                  )
                : Image.asset(AppVisuals.wordmark, height: 46, semanticLabel: AppStrings.appName.tr),
        actions: [
          // Spec 2.B header actions — each a 44x44 dp target (WCAG 2.1 AA).
          _HeaderAction(
            label: "Notifications",
            onTap: () => Get.to(() => const NotificationPageView()),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Obx(
                  () => AppIcon(
                    AppIcons.notification,
                    size: 24,
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
          _HeaderAction(
            label: "Tasker dashboard",
            onTap: () => Get.to(() => const TaskerDashboardView()),
            child: Obx(
              () => Icon(
                Icons.emoji_events_rounded,
                size: 24,
                color: isDarkMode.value ? AppColor.white : AppColor.primaryTextIcons,
              ),
            ),
          ),
          _HeaderAction(
            label: "Your profile",
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
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Full-Width Search Bar directly under header (Spec 2.A)
          if (!wide)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 6),
              child: _searchBar(),
            ),
          const SizedBox(height: 6),
          // Category Filter Chips (Spec 2.B)
          SizedBox(
            width: double.infinity,
            height: 48,
            child: GetBuilder<NavHomeController>(
              id: "onChangeTab",
              builder: (controller) => ListView.builder(
                padding: EdgeInsets.symmetric(horizontal: wide ? 16 : 0),
                scrollDirection: Axis.horizontal,
                itemCount: controller.tabTitles.length,
                itemBuilder: (context, index) {
                  final isSelected = controller.selectedTabIndex == index;
                  final dark = isDarkMode.value;
                  final badge = _chipBadges[controller.tabTitles[index]];
                  return AppPressable(
                    onTap: () {
                      AppHaptics.tap();
                      controller.onChangeTab(index);
                    },
                    pressedScale: 0.94,
                    child: AnimatedContainer(
                      duration: AppMotion.of(context),
                      curve: AppMotion.curve,
                      alignment: Alignment.center,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      margin: EdgeInsets.fromLTRB(index == 0 && !wide ? 15 : 10, 6, 0, 6),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColor.primaryColor
                            : (dark ? AppColor.white.withValues(alpha: 0.09) : AppColor.secondaryMintGreen),
                        borderRadius: BorderRadius.circular(AppRadius.chip),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (badge != null) ...[
                            Image.asset(badge, width: 18, height: 18),
                            const SizedBox(width: 5),
                          ],
                          Text(
                            controller.tabTitles[index],
                            style: GoogleFonts.urbanist(
                              fontSize: 13.5,
                              color: isSelected ? AppColor.white : (dark ? AppColor.white : AppColor.primaryTextIcons),
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
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
          // Paid promotions (rate card DOC-20260826-WA0214), labelled "Promoted".
          const PromotedVideosShelf(),
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
              const _UploadBanner(),
              Obx(
                () => Visibility(
                  visible: AppSettings.isDownloading.value,
                  child: Container(
                    height: 38,
                    width: double.infinity,
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

class _HeaderAction extends StatelessWidget {
  const _HeaderAction({required this.label, required this.onTap, required this.child});

  final String label;
  final VoidCallback onTap;
  final Widget child;

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        label: label,
        child: InkResponse(
          onTap: onTap,
          radius: 26,
          child: SizedBox(width: 48, height: 48, child: Center(child: ExcludeSemantics(child: child))),
        ),
      );
}

/// The upload banner on Home: progress while a video uploads (with Cancel),
/// and the reason with Retry/Dismiss when it stopped.
class _UploadBanner extends StatelessWidget {
  const _UploadBanner();

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final uploading = AppSettings.isUploading.value;
      final error = AppSettings.uploadError.value;
      if (!uploading && error.isEmpty) return const SizedBox.shrink();
      final progress = AppSettings.uploadProgress.value;
      final determinate = progress >= 0 && progress <= 1;
      final percent = determinate ? " ${(progress * 100).floor()}%" : "";
      final status = AppSettings.uploadStatus.value;
      final controller = Get.isRegistered<UploadVideoController>() ? Get.find<UploadVideoController>() : null;
      return Container(
        width: double.infinity,
        color: isDarkMode.value ? AppColor.secondDarkMode : Colors.white,
        padding: const EdgeInsets.only(left: 10, right: 4, top: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    uploading ? "${status.isNotEmpty ? status : AppStrings.videoUploading.tr}$percent" : error,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.bold, color: uploading ? null : const Color(0xFFE5484D)),
                  ),
                ),
                if (uploading)
                  TextButton(onPressed: () => AppSettings.uploadCancel.value?.cancel(), child: Text(AppStrings.cancel.tr))
                else ...[
                  TextButton(onPressed: controller?.retryFailedUpload, child: Text(AppStrings.retry.tr)),
                  IconButton(
                    tooltip: "Dismiss",
                    visualDensity: VisualDensity.compact,
                    onPressed: controller?.dismissFailedUpload,
                    icon: const Icon(Icons.close_rounded, size: 18),
                  ),
                ],
              ],
            ),
            if (uploading) LinearProgressIndicator(value: determinate ? progress : null, color: AppColor.primaryColor),
          ],
        ),
      );
    });
  }
}
