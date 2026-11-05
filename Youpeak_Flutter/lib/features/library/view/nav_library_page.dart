import 'dart:math' as math;
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_format_timer.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/storage/database/download_history_database.dart';
import 'package:youpeak/core/storage/database/watch_history_database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/playlist/view/create_playlist_view.dart';
import 'package:youpeak/features/library/view/download_view.dart';
import 'package:youpeak/features/library/view/history_view.dart';
import 'package:youpeak/features/library/controller/nav_library_controller.dart';
import 'package:youpeak/features/library/view/watch_later_view.dart';
import 'package:youpeak/features/library/view/your_video_page.dart';
import 'package:youpeak/features/notifications/view/notification_view.dart';
import 'package:youpeak/features/profile/view/profile_view.dart';
import 'package:youpeak/features/channel/view/get_playList_page.dart';
import 'package:youpeak/features/channel/api/get_channel_video_api.dart';
import 'package:youpeak/features/search/view/search_view.dart';
import 'package:youpeak/features/video/view/normal_video_details_view.dart';
import 'package:youpeak/features/video/view/shorts_video_details_view.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/shared/widgets/video_card_parts.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/platform/platform_info.dart';

class NavLibraryView extends GetView<NavLibraryPageController> {
  const NavLibraryView({super.key});

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) => AppSettings.navigationIndex.value = 0,
      child: Scaffold(
        appBar: AppBar(
          elevation: 0,
          backgroundColor: Colors.transparent,
          leading: const Padding(
            padding: EdgeInsets.only(left: 15),
            child: Icon(Icons.play_arrow_rounded, color: AppColor.primaryColor, size: 30),
          ),
          leadingWidth: 45,
          titleSpacing: 10,
          title: Text(
            AppStrings.library.tr,
            style: GoogleFonts.urbanist(fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.3),
          ),
          actions: [
            AppPressable(
              onTap: () => Get.to(() => const SearchView(isSearchShorts: false)),
              semanticLabel: "Search",
              child: SizedBox(
                width: 48,
                height: 48,
                child: Center(
                  child: AppIcon(
                    AppIcons.search,
                    size: 21,
                    color: isDarkMode.value ? AppColor.white : AppColor.black,
                  ),
                ),
              ),
            ),
            AppPressable(
              onTap: () => Get.to(() => const NotificationPageView()),
              semanticLabel: "Notifications",
              child: SizedBox(
                width: 48,
                height: 48,
                child: Center(
                  child: AppIcon(
                    AppIcons.notification,
                    size: 21,
                    color: isDarkMode.value ? AppColor.white : AppColor.black,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 6),
            AppPressable(
              onTap: () => Get.to(() => const ProfileView()),
              semanticLabel: "Profile",
              child: SizedBox(
                width: 48,
                height: 48,
                child: Center(
                  child: Obx(
                    () => PreviewProfileImage(
                      size: 35,
                      id: Database.channelId ?? "",
                      image: AppSettings.profileImage.value,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 15),
          ],
        ),
        // Desktop browser: history as a card grid beside the library actions.
        body: LayoutBuilder(
          builder: (context, constraints) => PlatformInfo.isWeb && constraints.maxWidth >= _wideMinWidth
              ? _WideLibraryBody(
                  onOpenHistory: _openHistory,
                  onOpenHistoryItem: _openHistoryItem,
                  actions: _actions(),
                )
              : _phoneBody(),
        ),
      ),
    );
  }

  static const double _wideMinWidth = 840;

  void _openHistory() => Get.to(() => const HistoryPageView());

  void _openHistoryItem(int index) {
    final item = WatchHistory.mainWatchHistory[index];
    if (item["videoType"] == 1) {
      Get.to(NormalVideoDetailsView(videoId: item["videoId"], videoUrl: item["videoUrl"], cost: item["subscriptionCost"]));
    } else {
      Get.to(ShortsVideoDetailsView(videoId: item["videoId"], videoUrl: item["videoUrl"]));
    }
  }

  void _openYourVideos() {
    if (Database.isChannel && Database.channelId != null) {
      GetChannelVideoApiClass.startPagination[0] = 0;
      GetChannelVideoApiClass.startPagination[1] = 0;
      controller.mainChannelVideos[0] = null;
      controller.mainChannelVideos[1] = null;
      controller.typeWiseGetChannelVideo(0);
      Get.to(() => const YourVideoPageView());
    } else {
      CustomToast.show(AppStrings.pleaseCreateChannel.tr);
    }
  }

  void _openDownloads() {
    if (DownloadHistory.mainDownloadHistory.isEmpty) {
      DownloadHistory.onGet();
    }
    Get.to(() => const DownloadView());
  }

  // Any signed-in user can make playlists (they belong to their profile).
  void _openNewPlaylist() {
    controller.playList.clear();
    Get.to(const CreatePlayListView());
  }

  // Always reload: videos saved or removed elsewhere (e.g. on a video page)
  // must show here.
  void _openWatchLater() {
    controller.onGetWatchLaterVideo();
    Get.to(() => const WatchLaterView());
  }

  void _openMyPlaylists() {
    GetChannelVideoApiClass.startPagination[0] = 0;
    GetChannelVideoApiClass.startPagination[1] = 0;
    controller.mainChannelVideos[0] = null;
    controller.mainChannelVideos[1] = null;
    controller.typeWiseGetChannelVideo(0);
    Get.to(() => const GetPlaylistPage());
  }

  // The library destinations, grouped as on the phone page.
  List<_LibraryAction> _actions() => [
        _LibraryAction(AppIcons.boldPlay, AppStrings.yourVideos.tr, _openYourVideos),
        // Offline downloads live in app storage on the phone. The web app
        // saves downloads to the browser's Downloads folder instead, so it
        // has no in-app downloads list.
        if (!PlatformInfo.isWeb) _LibraryAction(AppIcons.boldDownload, AppStrings.download.tr, _openDownloads),
        _LibraryAction(AppIcons.plus, AppStrings.newPlaylist.tr, _openNewPlaylist, inPlaylists: true),
        _LibraryAction(AppIcons.timerHistory, AppStrings.watchLater.tr, _openWatchLater, inPlaylists: true),
        _LibraryAction(AppIcons.boldPlay, AppStrings.myPlayList.tr, _openMyPlaylists, inPlaylists: true),
      ];

  Widget _phoneBody() {
    return SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppPressable(
                onTap: _openHistory,
                semanticLabel: AppStrings.history.tr,
                child: Container(
                  constraints: const BoxConstraints(minHeight: 48),
                  width: double.infinity,
                  color: AppColor.transparent,
                  padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(AppStrings.history.tr, style: GoogleFonts.urbanist(fontSize: 19, fontWeight: FontWeight.w800, letterSpacing: -0.2)),
                      Text(
                        AppStrings.viewAll.tr,
                        style: GoogleFonts.urbanist(color: AppColor.primaryColor, fontWeight: FontWeight.w800, fontSize: 14.5),
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(height: Get.height * 0.01),
              Obx(
                () => WatchHistory.mainWatchHistory.isEmpty
                    ? const Offstage()
                    : SizedBox(
                        height: 180,
                        width: double.infinity,
                        child: SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          child: ListView.builder(
                            itemCount: WatchHistory.mainWatchHistory.length,
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.only(left: 5, right: 15),
                            shrinkWrap: true,
                            itemBuilder: (context, index) {
                              return AppPressable(
                                onTap: () => _openHistoryItem(index),
                                pressedScale: 0.97,
                                child: Padding(
                                  padding: const EdgeInsets.only(left: 10),
                                  child: SizedBox(
                                    width: 175,
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Stack(
                                          children: [
                                            Container(
                                              clipBehavior: Clip.hardEdge,
                                              height: 125,
                                              width: 175,
                                              decoration: BoxDecoration(
                                                  color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_200,
                                                  borderRadius: BorderRadius.circular(16)),
                                              child: PreviewVideoImage(
                                                videoId: WatchHistory.mainWatchHistory[index]["videoId"],
                                                videoImage: WatchHistory.mainWatchHistory[index]["videoImage"],
                                              ),
                                              // child: ConvertedPathView(
                                              //     imageVideoPath:
                                              //         WatchHistory.mainWatchHistory[index]["videoImage"].toString()),
                                            ),
                                            Positioned(
                                              bottom: 8,
                                              right: 8,
                                              child: DurationBadge(
                                                text: CustomFormatTime.convertSecond(
                                                    int.parse(WatchHistory.mainWatchHistory[index]["videoTime"].toString())),
                                                fontSize: 11,
                                              ),
                                            ),
                                          ],
                                        ),
                                        SizedBox(height: Get.height * 0.01),
                                        SizedBox(
                                          width: 175,
                                          child: Text(
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            WatchHistory.mainWatchHistory[index]["videoTitle"].toString(),
                                            style: GoogleFonts.urbanist(fontSize: 14.5, fontWeight: FontWeight.w800, height: 1.25),
                                          ),
                                        ),
                                        // SizedBox(height: Get.height * 0.01),
                                        SizedBox(
                                          width: 175,
                                          child: Text(
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            WatchHistory.mainWatchHistory[index]["channelName"].toString(),
                                            style: GoogleFonts.urbanist(
                                                fontSize: 12.5,
                                                fontWeight: FontWeight.w600,
                                                color: isDarkMode.value ? AppColor.mutedTextDark : AppColor.mutedText),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
              ),
              Divider(indent: 15, endIndent: 15, color: AppElevation.hairline(isDarkMode.value)),
              const SizedBox(height: 10),
              LibraryItem(
                iconPath: AppIcons.boldPlay,
                title: AppStrings.yourVideos.tr,
                callback: _openYourVideos,
              ),
              // Offline downloads live in app storage on the phone. The web app
              // saves downloads to the browser's Downloads folder instead, so
              // it has no in-app downloads list.
              if (!PlatformInfo.isWeb) ...[
                const SizedBox(height: 2),
                LibraryItem(
                  iconPath: AppIcons.boldDownload,
                  title: AppStrings.download.tr,
                  callback: _openDownloads,
                ),
              ],
              const SizedBox(height: 10),
              Divider(indent: 15, endIndent: 15, color: AppElevation.hairline(isDarkMode.value)),
              SizedBox(height: Get.height * 0.01),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 15),
                    child: Text(
                      AppStrings.playlists.tr,
                      style: GoogleFonts.urbanist(fontSize: 19, fontWeight: FontWeight.w800, letterSpacing: -0.2),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              LibraryItem(
                  iconPath: AppIcons.plus,
                  title: AppStrings.newPlaylist.tr,
                  callback: _openNewPlaylist),
              const SizedBox(height: 2),
              LibraryItem(
                iconPath: AppIcons.timerHistory,
                title: AppStrings.watchLater.tr,
                callback: _openWatchLater,
              ),
              const SizedBox(height: 2),
              LibraryItem(
                iconPath: AppIcons.boldPlay,
                title: AppStrings.myPlayList.tr,
                callback: _openMyPlaylists,
              ),
              SizedBox(height: Get.height * 0.03),
            ],
          ),
        );
  }
}

class LibraryItem extends StatelessWidget {
  const LibraryItem({super.key, required this.title, required this.iconPath, required this.callback});

  final String title;
  final String iconPath;
  final void Function() callback;

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final dark = isDarkMode.value;
      return AppPressable(
        onTap: callback,
        pressedScale: 0.985,
        semanticLabel: title,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 7),
          child: Row(
            children: [
              Container(
                height: 46,
                width: 46,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  color: dark ? AppColor.white.withValues(alpha: 0.08) : AppColor.secondaryMintGreen,
                ),
                child: Center(
                  child: AppIcon(
                    iconPath,
                    size: 20,
                    color: dark ? AppColor.white : AppColor.darkForestAccent,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.urbanist(fontSize: 16.5, fontWeight: FontWeight.w700),
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: dark ? AppColor.mutedTextDark : AppColor.mutedText),
            ],
          ),
        ),
      );
    });
  }
}

// GestureDetector(
//   onTap: () {},
//   child: Row(
//     children: [
//       Text(
//         AppStrings.recentlyAdded,
//         style: GoogleFonts.urbanist(
//           fontSize: 16,
//           fontWeight: FontWeight.bold,
//           color: AppColors.primaryColor,
//         ),
//       ),
//       SizedBox(width: SizeConfig.blockSizeHorizontal * 2),
//       const ImageIcon(
//         AssetImage(AppIcons.arrowDown),
//         color: AppColors.primaryColor,
//       ),
//     ],
//   ),
// ),
// HistoryScreenButton2(
//   logo: AppIcons.likeBold,
//   name: AppStrings.likedVideos,
//   onTap: () {},
//   subTitle: '260 videos',
// ),
// SizedBox(
//   height: SizeConfig.blockSizeVertical * 1.5,
// ),
// GestureDetector(
//   onTap: () {
//     Get.to(
//       () => const MyFavoriteSongsScreen(),
//     );
//   },
//   child: Row(
//     children: [
//       Container(
//         margin: const EdgeInsets.only(
//           left: 13,
//         ),
//         decoration: const BoxDecoration(
//           image: DecorationImage(
//             image: AssetImage(AppIcons.songsImage),
//           ),
//         ),
//         height: 40,
//         width: 40,
//       ),
//       SizedBox(
//         width: SizeConfig.blockSizeHorizontal * 3,
//       ),
//       Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           Text(
//             AppStrings.myFavoriteSongs,
//             style: GoogleFonts.urbanist(
//                 fontSize: 18,
//                 fontWeight: FontWeight.bold),
//           ),
//           SizedBox(
//             height: SizeConfig.blockSizeVertical * 0.5,
//           ),
//           Text(
//             "125 videos",
//             style: GoogleFonts.urbanist(
//               fontSize: 12,
//               color: AppColors.grey,
//             ),
//           ),
//         ],
//       ),
//     ],
//   ),
// ),

class _LibraryAction {
  const _LibraryAction(this.icon, this.title, this.onTap, {this.inPlaylists = false});

  final String icon;
  final String title;
  final VoidCallback onTap;
  final bool inPlaylists;
}

// Library on a desktop browser: recent history as a card grid, with the
// library destinations in a panel beside it (below it on narrower windows).
class _WideLibraryBody extends StatelessWidget {
  const _WideLibraryBody({required this.onOpenHistory, required this.onOpenHistoryItem, required this.actions});

  final VoidCallback onOpenHistory;
  final void Function(int index) onOpenHistoryItem;
  final List<_LibraryAction> actions;

  // Recent history shown here; the rest is one click away ("View All").
  static const _maxHistoryCards = 8;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
      child: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1280),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final history = _history();
              final panel = _LibraryPanel(actions: actions);
              if (constraints.maxWidth < 1040) {
                return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [history, const SizedBox(height: 28), panel]);
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [Expanded(child: history), const SizedBox(width: 32), SizedBox(width: 340, child: panel)],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _history() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Text(AppStrings.history.tr, style: GoogleFonts.urbanist(fontSize: 20, fontWeight: FontWeight.w800)),
            const Spacer(),
            TextButton(
              onPressed: onOpenHistory,
              child: Text(AppStrings.viewAll.tr, style: GoogleFonts.urbanist(color: AppColor.primaryColor, fontWeight: FontWeight.bold, fontSize: 15)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Obx(() {
          final items = WatchHistory.mainWatchHistory;
          if (items.isEmpty) {
            return SizedBox(height: 300, child: DataNotFoundUi(type: EmptyStateType.history, title: AppStrings.historyEmpty));
          }
          return VideoGrid(
            itemCount: math.min(items.length, _maxHistoryCards),
            minTileWidth: 240,
            maxColumns: 4,
            spacing: 16,
            runSpacing: 20,
            itemBuilder: (context, index) => _HistoryCard(item: items[index], onTap: () => onOpenHistoryItem(index)),
          );
        }),
      ],
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.item, required this.onTap});

  final Map item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final seconds = int.tryParse(item["videoTime"].toString()) ?? 0;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: Stack(
                children: [
                  Positioned.fill(
                    child: ColoredBox(
                      color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_200,
                      child: PreviewVideoImage(videoId: item["videoId"].toString(), videoImage: item["videoImage"].toString()),
                    ),
                  ),
                  if (seconds > 0)
                    Positioned(
                      right: 8,
                      bottom: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(color: AppColor.black.withAlpha(200), borderRadius: BorderRadius.circular(6)),
                        child: Text(CustomFormatTime.convertSecond(seconds),
                            style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 12, fontWeight: FontWeight.w600)),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            item["videoTitle"].toString(),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.bold, height: 1.3),
          ),
          const SizedBox(height: 4),
          Text(
            item["channelName"].toString(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.urbanist(fontSize: 13, color: AppColor.grey),
          ),
        ],
      ),
    );
  }
}

// The library destinations as a list panel, with the playlist ones under a
// "Playlists" heading as on the phone page.
class _LibraryPanel extends StatelessWidget {
  const _LibraryPanel({required this.actions});

  final List<_LibraryAction> actions;

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final dark = isDarkMode.value;
      Widget tile(_LibraryAction action) => InkWell(
            onTap: action.onTap,
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                children: [
                  Container(
                    height: 40,
                    width: 40,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: dark ? AppColor.white.withValues(alpha: 0.08) : AppColor.secondaryMintGreen,
                    ),
                    child: Center(
                      child: AppIcon(action.icon, size: 18, color: dark ? AppColor.white : AppColor.darkForestAccent),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(child: Text(action.title, style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.bold))),
                  Icon(Icons.chevron_right_rounded, color: dark ? Colors.white54 : AppColor.grey),
                ],
              ),
            ),
          );
      Widget heading(String text) => Padding(
            padding: const EdgeInsets.fromLTRB(12, 14, 12, 6),
            child: Text(text,
                style: GoogleFonts.urbanist(fontSize: 13, fontWeight: FontWeight.w800, color: dark ? Colors.white60 : AppColor.grey, letterSpacing: 0.4)),
          );
      return Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: dark ? Colors.white12 : AppColor.grey_200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            heading(AppStrings.library.tr),
            ...actions.where((a) => !a.inPlaylists).map(tile),
            heading(AppStrings.playlists.tr),
            ...actions.where((a) => a.inPlaylists).map(tile),
          ],
        ),
      );
    });
  }
}
