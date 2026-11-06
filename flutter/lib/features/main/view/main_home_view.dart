import 'package:youpeak/shared/dialogs/app_sheet.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:youpeak/core/navigation/root_back.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/core/utils/custom_check_internet.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/utils/custom_video_picker.dart';
import 'package:youpeak/core/utils/custom_video_size.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/deep_link/services/deep_link_services.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/features/comments/controller/comment_controller.dart';
import 'package:youpeak/features/comments/controller/reply_controller.dart';
import 'package:youpeak/features/bites/controller/create_short_controller.dart';
import 'package:youpeak/features/bites/view/create_short_view.dart';
import 'package:youpeak/features/live/view/go_live_view.dart';
import 'package:youpeak/features/live/controller/socket_manager_controller.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/features/upload/view/upload_video_view.dart';
import 'package:youpeak/features/home/controller/nav_home_controller.dart';
import 'package:youpeak/features/home/view/nav_home_page.dart';
import 'package:youpeak/features/main/view/wide_side_nav.dart';
import 'package:youpeak/features/library/view/download_view.dart';
import 'package:youpeak/features/library/controller/nav_library_controller.dart';
import 'package:youpeak/features/library/view/nav_library_page.dart';
import 'package:youpeak/features/bites/controller/nav_shorts_controller.dart';
import 'package:youpeak/features/bites/view/nav_shorts_view.dart';
import 'package:youpeak/features/subscriptions/controller/nav_subscription_controller.dart';
import 'package:youpeak/features/subscriptions/view/nav_subscription_view.dart';
import 'package:youpeak/features/notifications/controller/notification_controller.dart';
import 'package:youpeak/features/coins/api/get_my_coin_api.dart';
import 'package:youpeak/features/profile/controller/profile_controller.dart';
import 'package:youpeak/features/wallet/api/withdraw_setting_api.dart';
import 'package:youpeak/features/channel/controller/preview_play_list_controller.dart';
import 'package:youpeak/features/channel/controller/your_channel_controller.dart';
import 'package:youpeak/features/search/controller/search_controller.dart';
import 'package:youpeak/features/search/view/search_view.dart';
import 'package:youpeak/features/video/view/normal_video_details_view.dart';
import 'package:youpeak/features/video/view/shorts_video_details_view.dart';
import 'package:youpeak/core/services/branch_io_services.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/utils/utils.dart';
import 'package:quick_actions/quick_actions.dart';
import 'package:video_player/video_player.dart';
import 'package:youpeak/core/platform/platform_info.dart';
import 'package:youpeak/core/platform/local_media.dart';

final List navigationPages = [
  const NavHomePageView(),
  const NavShortsView(),
  const NavSubscriptionView(),
  const NavLibraryView(),
];

class MainHomePageView extends StatefulWidget {
  const MainHomePageView({super.key});

  // Opens the create menu (upload / Bite / live) of the mounted main screen;
  // used by the desktop sidebar shown beside other pages.
  static VoidCallback? openCreateMenu;

  @override
  State<MainHomePageView> createState() => _MainHomePageViewState();
}

class _MainHomePageViewState extends State<MainHomePageView> {
  final quickAction = const QuickActions();
  VideoPlayerController? _homeVideoController;
  bool _isVideoInitialized = false;

  bool _adsPreloaded = false;

  @override
  void initState() {
    Timer(const Duration(milliseconds: 300), () {
      SystemChrome.setSystemUIOverlayStyle(
        const SystemUiOverlayStyle(
          statusBarIconBrightness: Brightness.light,
          statusBarColor: Colors.transparent,
          systemNavigationBarDividerColor: Colors.black,
          systemNavigationBarColor: Colors.black,
        ),
      );
    });

    if (AdminSettingsApi.adminSettingsModel == null) {
      AdminSettingsApi.callApi();
      AppSettings.showLog("Admin Api Second Time Calling...");
    }
    Get.put(NavHomeController());
    Get.put(ProfileController());
    Get.put(NavShortsController());
    Get.put(NavSubscriptionPageController());
    Get.put(NavLibraryPageController());
    Get.put(UploadVideoController());
    Get.put(CommentController());
    Get.put(RepliesController());
    Get.put(YourChannelController());
    Get.put(PreviewPlayListController());
    Get.put(SearchingController());

    Get.put(NotificationController());
    Get.put(CreateShortController());
    MainHomePageView.openCreateMenu = _openCreateMenu;

    final socketManagerController = Get.put(SocketManagerController());
    socketManagerController.socketConnect();

    WithdrawSettingApi.callApi(loginUserId: Database.loginUserId ?? "");

    AppSettings.onCreateLink();

    GetMyCoinApi.callApi(loginUserId: Database.loginUserId ?? "");
    Timer(const Duration(milliseconds: 500), () {
      DeepLinkServices.onChangeRoutes(isBottomBarRoutes: true);
    });
    Utils.showLog("INTERNET LAGGG");
    Timer(const Duration(milliseconds: 100), () {
      // Offline fallback to downloaded videos exists only in the phone app.
      if (!CustomCheckInternet.isConnect.value && !PlatformInfo.isWeb) {
        AppSettings.navigationIndex.value = 3;
        Get.to(const DownloadView());
      }
    });
    super.initState();

    // Home-screen shortcuts (long-press the app icon) are a phone feature.
    if (PlatformInfo.isWeb) return;

    quickAction.setShortcutItems([
      const ShortcutItem(
        type: 'Subscriptions',
        localizedTitle: 'Subscriptions',
        icon: "subscription",
      ),
      const ShortcutItem(
        type: 'Search',
        localizedTitle: 'Search',
        icon: "search",
      ),
      const ShortcutItem(
        type: 'Shorts',
        localizedTitle: 'Bites',
        icon: "shorts",
      ),
    ]);

    quickAction.initialize(
      (type) {
        if (type == 'Subscriptions') {
          AppSettings.navigationIndex.value = 2;
        } else if (type == 'Search') {
          Get.to(const SearchView(isSearchShorts: false));
        } else if (type == 'Shorts') {
          AppSettings.navigationIndex.value = 1;
        }
      },
    );
  }

  @override
  void dispose() {
    if (MainHomePageView.openCreateMenu == _openCreateMenu) MainHomePageView.openCreateMenu = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () => handleRootBack(context),
      // Wide browser windows get a sidebar instead of the bottom bar.
      child: LayoutBuilder(
        builder: (context, constraints) =>
            PlatformInfo.isWeb && constraints.maxWidth >= AppLayout.wideBreakpoint ? _buildWide(context, constraints.maxWidth) : _buildPhone(context),
      ),
    );
  }

  // The create menu: a bottom sheet on the phone, a dialog on wide screens.
  void _openCreateMenu() {
    AppHaptics.press();
    if (AppLayout.isWideWeb) {
      Get.dialog(
        Dialog(
          backgroundColor: isDarkMode.value ? AppColor.darkElevated : AppColor.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.sheet)),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420, maxHeight: 420),
            child: _createMenu(showHandle: false),
          ),
        ),
      );
      return;
    }
    AppSheet.show(
      elevation: 0,
      backgroundColor: isDarkMode.value ? AppColor.darkElevated : AppColor.white,
      shape: const RoundedRectangleBorder(borderRadius: AppRadius.sheetBorder),
      isScrollControlled: true,
      SafeArea(top: false, child: _createMenu(showHandle: true)),
    );
  }

  Widget _createMenu({required bool showHandle}) {
    return SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 10),
          if (showHandle)
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(60),
                color: isDarkMode.value ? AppColor.white.withValues(alpha: 0.24) : AppColor.grey_300,
              ),
            ),
          const SizedBox(height: 18),
          Text(AppStrings.create.tr, style: GoogleFonts.urbanist(fontSize: 19, fontWeight: FontWeight.w800, letterSpacing: -0.2)),
          const SizedBox(height: 12),
          CreateShortsOption(
            logo: AppIcons.boldVideo,
            option: AppStrings.createAShort.tr,
            onTap: () {
              Get.back();
              if (AppSettings.isUploading.value) {
                CustomToast.show("Already video upload running !!");
              } else {
                Get.to(() => CreateShortView());
              }
            },
          ),
          CreateShortsOption(
            logo: AppIcons.boldUpload,
            option: AppStrings.uploadAVideo.tr,
            onTap: () async {
              Get.back();

              if (AppSettings.isUploading.value) {
                CustomToast.show("Already video upload running !!");
              } else {
                AppSettings.showLog("Upload View Bottom Sheet On Click");

                final pickedVideo = await CustomVideoPicker.pickVideo();

                if (pickedVideo != null) {
                  AppSettings.showLog("Picked Video Url => $pickedVideo");
                  final response = await isSupport(pickedVideo);
                  if (response) {
                    final videoSize = await CustomVideoSize.onGet(pickedVideo);
                    AppSettings.showLog("Picked Video Size => $videoSize");

                    Get.to(
                      UploadVideoView(
                        videoPath: pickedVideo,
                        loginUserId: Database.loginUserId ?? "",
                        loginUserChannelId: Database.channelId ?? "",
                        videoType: 1,
                      ),
                    );
                  } else {
                    CustomToast.show(AppStrings.videoNotSupport.tr);
                  }
                }
              }
            },
          ),
          CreateShortsOption(
            logo: AppIcons.goLive,
            option: AppStrings.goLive.tr,
            onTap: () async {
              Get.back();
              if (socket?.connected ?? false) {
                Get.to(const GoLiveView());
              } else {
                CustomToast.show(AppStrings.connectionIssue.tr);
              }
            },
          ),
          SizedBox(height: PlatformInfo.isAndroidOrWeb ? 18 : 24),
        ],
      ),
    );
  }

  // Desktop browser layout: navigation sidebar + the selected tab.
  Widget _buildWide(BuildContext context, double width) {
    return Obx(
      () => Scaffold(
        backgroundColor: isDarkMode.value ? AppColor.mainDark : AppColor.white,
        body: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            WideSideNav(expanded: width >= 1200, onCreate: _openCreateMenu),
            VerticalDivider(width: 1, thickness: 1, color: isDarkMode.value ? Colors.white12 : AppColor.grey_200),
            Expanded(child: _wideTab(AppSettings.navigationIndex.value)),
          ],
        ),
      ),
    );
  }

  // Every tab lays itself out for the width beside the sidebar (Bites as a
  // centered portrait player, Library as sections and grids).
  Widget _wideTab(int index) {
    switch (index) {
      case 1:
        return const NavShortsView();
      case 2:
        return const NavSubscriptionView();
      case 3:
        return const NavLibraryView();
      default:
        return const NavHomePageView();
    }
  }

  Widget _buildPhone(BuildContext context) {
    return Scaffold(
      floatingActionButton: Obx(() {
        final dark = isDarkMode.value;
        return Padding(
          padding: const EdgeInsets.only(top: 55),
          child: AppPressable(
            onTap: _openCreateMenu,
            pressedScale: 0.92,
            semanticLabel: AppStrings.create.tr,
            child: Container(
              height: 62,
              width: 62,
              alignment: Alignment.center,
              margin: const EdgeInsets.only(top: 4),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                // A ring in the bar's own colour makes the button read as
                // seated in the bar rather than pasted over it.
                border: Border.all(color: dark ? AppColor.mainDark : AppColor.white, width: 5),
                gradient: AppColor.brandGradient,
                boxShadow: AppElevation.glow(AppColor.brandTeal, strength: 0.22),
              ),
              child: const AppIcon(AppIcons.extraCreate, color: AppColor.white, size: 28),
            ),
          ),
        );
      }),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      backgroundColor: isDarkMode.value ? AppColor.mainDark : AppColor.white,
      bottomNavigationBar: Obx(
        () {
          final dark = isDarkMode.value;
          return Container(
            // Android 15+ draws edge-to-edge: grow by the gesture/nav-bar inset
            // so the items stay above it (spec 2.F safe-area support).
            height: (PlatformInfo.isIOS)
                ? Get.height / 9.5
                : (PlatformInfo.isAndroidOrWeb)
                    ? Get.height / 13.1 + MediaQuery.paddingOf(context).bottom
                    : 0,
            padding: EdgeInsets.only(bottom: PlatformInfo.isIOS ? 0 : MediaQuery.paddingOf(context).bottom),
            width: double.infinity,
            decoration: BoxDecoration(
              color: dark ? AppColor.mainDark : AppColor.white,
              border: Border(top: BorderSide(color: AppElevation.hairline(dark))),
              boxShadow: dark ? const [] : [BoxShadow(color: const Color(0xFF0A2A18).withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, -4))],
            ),
            child: Row(
              children: [
                BottomBarItemUi(
                  activeIcon: AppIcons.boldHome,
                  icon: AppIcons.homeLogo,
                  title: AppStrings.home.tr,
                  index: 0,
                ),
                BottomBarItemUi(
                  activeIcon: AppIcons.boldVideo,
                  icon: AppIcons.video,
                  title: AppStrings.shorts.tr,
                  index: 1,
                ),
                Expanded(
                  child: Align(
                    alignment: Alignment.bottomCenter,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 7),
                      child: Text(
                        AppStrings.create.tr,
                        maxLines: 1,
                        style: GoogleFonts.urbanist(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: dark ? AppColor.mutedTextDark : AppColor.mutedText,
                        ),
                      ),
                    ),
                  ),
                ),
                BottomBarItemUi(
                  activeIcon: AppIcons.boldPlay,
                  icon: AppIcons.videoCircle,
                  title: AppStrings.subscription.tr,
                  index: 2,
                ),
                BottomBarItemUi(
                  activeIcon: AppIcons.boldLibrary,
                  icon: AppIcons.libraryLogo,
                  title: AppStrings.library.tr,
                  index: 3,
                ),
              ],
            ),
          );
        },
      ),
      body: PageView.builder(
        itemCount: navigationPages.length,
        physics: const NeverScrollableScrollPhysics(),
        itemBuilder: (context, index) => Obx(() => navigationPages[AppSettings.navigationIndex.value]),
      ),
    );
  }
}

// Whether the picked file is a video we're willing to upload.
//
// Deliberately NOT gated on VideoPlayerController.initialize() succeeding:
// on real devices that decoder probe fails for plenty of valid videos
// (HEVC / high-res camera output, some OEM encoders, large files taking
// long to probe) and was surfacing as a wrong "Video not support" error
// even after storage/media permission was granted. The file itself
// doesn't need to be locally decodable — it gets uploaded and transcoded
// server-side (Cloudflare Stream), so a light extension + existence +
// size check is what actually matters here.
const _supportedVideoExtensions = {
  'mp4',
  'mov',
  'm4v',
  '3gp',
  '3g2',
  'mkv',
  'webm',
  'avi',
  'flv',
  'wmv',
};

Future<bool> isSupport(String path) async {
  try {
    // LocalMedia: a device path on the phone, a blob: URL in the browser.
    if (!LocalMedia.exists(path)) {
      AppSettings.showLog("isSupport (video): file does not exist => $path");
      return false;
    }
    if (await LocalMedia.length(path) <= 0) {
      AppSettings.showLog("isSupport (video): zero-byte file => $path");
      return false;
    }
    final ext = LocalMedia.fileName(path).split('.').last.toLowerCase();
    if (!_supportedVideoExtensions.contains(ext)) {
      AppSettings.showLog("isSupport (video): unsupported extension .$ext => $path");
      return false;
    }
    return true;
  } catch (e) {
    AppSettings.showLog("isSupport (video) failed for $path => $e");
    return false;
  }
}

class BottomBarItemUi extends StatelessWidget {
  const BottomBarItemUi({super.key, required this.icon, required this.title, required this.index, required this.activeIcon});

  final String activeIcon;
  final String icon;
  final String title;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: 1,
      child: Semantics(
        button: true,
        selected: AppSettings.navigationIndex.value == index,
        label: title,
        excludeSemantics: true,
        child: InkResponse(
          onTap: () {
            if (AppSettings.navigationIndex.value != index) AppHaptics.tap();
            AppSettings.navigationIndex.value = index;
          },
          radius: 36,
          highlightShape: BoxShape.circle,
          child: Obx(() {
            final selected = AppSettings.navigationIndex.value == index;
            final dark = isDarkMode.value;
            final activeColor = dark ? AppColor.brightGreen : AppColor.primaryColor;
            return SizedBox(
              height: 60,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AnimatedContainer(
                    duration: AppMotion.of(context),
                    curve: AppMotion.curve,
                    height: 30,
                    width: selected ? 56 : 30,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(15),
                      color: selected ? activeColor.withValues(alpha: dark ? 0.20 : 0.12) : Colors.transparent,
                    ),
                    child: AnimatedScale(
                      scale: selected ? 1.08 : 1,
                      duration: AppMotion.of(context),
                      curve: AppMotion.curve,
                      child: AppIcon(
                        selected ? activeIcon : icon,
                        size: 24,
                        color: selected ? activeColor : (dark ? AppColor.mutedTextDark : AppColor.mutedText),
                      ),
                    ),
                  ),
                  const SizedBox(height: 3),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        title,
                        maxLines: 1,
                        style: GoogleFonts.urbanist(
                          fontSize: 12,
                          fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                          color: selected ? activeColor : (dark ? AppColor.mutedTextDark : AppColor.grey),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ),
      ),
    );
  }
}

// old bottom bar working mode

// Obx(
//   () => BottomNavigationBar(
//     backgroundColor: isDarkMode.value ? AppColors.secondDarkMode : AppColors.green,
//     type: BottomNavigationBarType.fixed,
//     selectedItemColor: AppColors.primaryColor,
//     unselectedItemColor: AppColors.grey,
//     onTap: (index) => AppSettings.navigationIndex.value = index,
//     currentIndex: AppSettings.navigationIndex.value,
//     selectedLabelStyle: bottomTabsStyle,
//     unselectedLabelStyle: bottomTabsStyle,
//     items: [
//       BottomNavigationBarItem(
//         activeIcon: const Image(
//           image: AssetImage(AppIcons.boldHome),
//           height: 22,
//           width: 22,
//           color: AppColors.primaryColor,
//         ),
//         label: AppStrings.home.tr,
//         icon: const Image(
//           image: AssetImage(AppIcons.homeLogo),
//           height: 22,
//           width: 22,
//           color: AppColors.grey,
//         ),
//       ),
//       BottomNavigationBarItem(
//         activeIcon: const Image(
//           image: AssetImage(AppIcons.boldVideo),
//           height: 22,
//           width: 22,
//           color: AppColors.primaryColor,
//         ),
//         label: AppStrings.shorts.tr,
//         icon: const Image(
//           image: AssetImage(AppIcons.video),
//           height: 22,
//           width: 22,
//           color: AppColors.grey,
//         ),
//       ),
//       const BottomNavigationBarItem(label: "", icon: SizedBox(height: 0)),
//       BottomNavigationBarItem(
//         activeIcon: const Image(
//           image: AssetImage(AppIcons.boldPlay),
//           height: 22,
//           width: 22,
//           color: AppColors.primaryColor,
//         ),
//         label: AppStrings.subscription.tr,
//         icon: const Image(
//           image: AssetImage(AppIcons.videoCircle),
//           height: 22,
//           width: 22,
//           color: AppColors.grey,
//         ),
//       ),
//       BottomNavigationBarItem(
//         activeIcon: const Image(
//           image: AssetImage(AppIcons.boldLibrary),
//           height: 22,
//           width: 22,
//           color: AppColors.primaryColor,
//         ),
//         label: AppStrings.library.tr,
//         icon: const Image(
//           image: AssetImage(AppIcons.libraryLogo),
//           height: 22,
//           width: 22,
//           color: AppColors.grey,
//         ),
//       ),
//     ],
//   ),
// ),
