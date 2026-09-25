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
import 'package:youpeak/core/theme/app_color.dart';
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
      onPopInvoked: (didPop) => AppSettings.navigationIndex.value = 0,
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
            style: GoogleFonts.urbanist(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          actions: [
            InkWell(
              onTap: () => Get.to(() => const SearchView(isSearchShorts: false)),
              child: Image.asset(
                AppIcons.search,
                width: 20,
                color: isDarkMode.value ? AppColor.white : AppColor.black,
              ),
            ),
            const SizedBox(width: 18),
            GestureDetector(
              onTap: () => Get.to(() => const NotificationPageView()),
              child: Image.asset(
                AppIcons.notification,
                width: 18,
                color: isDarkMode.value ? AppColor.white : AppColor.black,
              ),
            ),
            const SizedBox(width: 18),
            GestureDetector(
              onTap: () => Get.to(() => const ProfileView()),
              child: Obx(
                () => PreviewProfileImage(
                  size: 35,
                  id: Database.channelId ?? "",
                  image: AppSettings.profileImage.value,
                  fit: BoxFit.cover,
                ),
              ),
            ),
            const SizedBox(width: 15),
          ],
        ),
        body: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GestureDetector(
                onTap: () => Get.to(() => const HistoryPageView()),
                child: Container(
                  height: Get.height * 0.05,
                  width: Get.width,
                  color: AppColor.transparent,
                  padding: const EdgeInsets.symmetric(horizontal: 15),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(AppStrings.history.tr, style: GoogleFonts.urbanist(fontSize: 17, fontWeight: FontWeight.bold)),
                      Text(
                        AppStrings.viewAll.tr,
                        style: GoogleFonts.urbanist(color: AppColor.primaryColor, fontWeight: FontWeight.bold),
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
                        width: Get.width,
                        child: SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          child: ListView.builder(
                            itemCount: WatchHistory.mainWatchHistory.length,
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.only(left: 5, right: 15),
                            shrinkWrap: true,
                            itemBuilder: (context, index) {
                              return GestureDetector(
                                onTap: () {
                                  if (WatchHistory.mainWatchHistory[index]["videoType"] == 1) {
                                    Get.to(
                                      NormalVideoDetailsView(
                                        videoId: WatchHistory.mainWatchHistory[index]["videoId"],
                                        videoUrl: WatchHistory.mainWatchHistory[index]["videoUrl"],
                                        cost: WatchHistory.mainWatchHistory[index]["subscriptionCost"],
                                      ),
                                    );
                                  } else {
                                    Get.to(
                                      ShortsVideoDetailsView(
                                        videoId: WatchHistory.mainWatchHistory[index]["videoId"],
                                        videoUrl: WatchHistory.mainWatchHistory[index]["videoUrl"],
                                      ),
                                    );
                                  }
                                },
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
                                                  color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_400,
                                                  borderRadius: BorderRadius.circular(19)),
                                              child: PreviewVideoImage(
                                                videoId: WatchHistory.mainWatchHistory[index]["videoId"],
                                                videoImage: WatchHistory.mainWatchHistory[index]["videoImage"],
                                              ),
                                              // child: ConvertedPathView(
                                              //     imageVideoPath:
                                              //         WatchHistory.mainWatchHistory[index]["videoImage"].toString()),
                                            ),
                                            Positioned(
                                              bottom: 10,
                                              right: 10,
                                              child: Container(
                                                alignment: Alignment.center,
                                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                                decoration: BoxDecoration(
                                                  borderRadius: BorderRadius.circular(7),
                                                  color: AppColor.black,
                                                ),
                                                child: Text(
                                                  CustomFormatTime.convertSecond(
                                                      int.parse(WatchHistory.mainWatchHistory[index]["videoTime"].toString())),
                                                  style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 11),
                                                ),
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
                                            style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                        // SizedBox(height: Get.height * 0.01),
                                        SizedBox(
                                          width: 175,
                                          child: Text(
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            WatchHistory.mainWatchHistory[index]["channelName"].toString(),
                                            style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.grey),
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
              const Divider(indent: 15, endIndent: 15),
              const SizedBox(height: 10),
              LibraryItem(
                iconPath: AppIcons.boldPlay,
                title: AppStrings.yourVideos.tr,
                callback: () {
                  if (Database.isChannel && Database.channelId != null) {
                    // if (controller.mainChannelVideos[0] == null || (controller.mainChannelVideos[0]?.isEmpty ?? true)) {
                    GetChannelVideoApiClass.startPagination[0] = 0;
                    GetChannelVideoApiClass.startPagination[1] = 0;
                    controller.mainChannelVideos[0] = null;
                    controller.mainChannelVideos[1] = null;
                    controller.typeWiseGetChannelVideo(0);

                    // }
                    Get.to(() => const YourVideoPageView());
                  } else {
                    CustomToast.show(AppStrings.pleaseCreateChannel.tr);
                  }
                },
              ),
              // Offline downloads live in app storage on the phone. The web app
              // saves downloads to the browser's Downloads folder instead, so
              // it has no in-app downloads list.
              if (!PlatformInfo.isWeb) ...[
                const SizedBox(height: 15),
                LibraryItem(
                  iconPath: AppIcons.boldDownload,
                  title: AppStrings.download.tr,
                  callback: () {
                    if (DownloadHistory.mainDownloadHistory.isEmpty) {
                      DownloadHistory.onGet();
                    }
                    Get.to(() => const DownloadView());
                  },
                ),
              ],
              const SizedBox(height: 10),
              const Divider(indent: 15, endIndent: 15),
              SizedBox(height: Get.height * 0.01),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 15),
                    child: Text(
                      AppStrings.playlists.tr,
                      style: GoogleFonts.urbanist(fontSize: 17, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              LibraryItem(
                  iconPath: AppIcons.plus,
                  title: AppStrings.newPlaylist.tr,
                  callback: () {
                    if (Database.isChannel && Database.channelId != null) {
                      controller.playList.clear();
                      Get.to(const CreatePlayListView());
                    } else {
                      CustomToast.show(AppStrings.pleaseCreateChannel.tr);
                    }
                  }),
              const SizedBox(height: 15),
              LibraryItem(
                iconPath: AppIcons.timerHistory,
                title: AppStrings.watchLater.tr,
                callback: () {
                  if (controller.mainWatchLaterVideos == null || (controller.mainWatchLaterVideos?.isEmpty ?? true)) {
                    controller.onGetWatchLaterVideo();
                  }
                  Get.to(() => const WatchLaterView());
                },
              ),
              const SizedBox(height: 15),
              LibraryItem(
                iconPath: AppIcons.boldPlay,
                title: AppStrings.myPlayList.tr,
                callback: () {
                  GetChannelVideoApiClass.startPagination[0] = 0;
                  GetChannelVideoApiClass.startPagination[1] = 0;
                  controller.mainChannelVideos[0] = null;
                  controller.mainChannelVideos[1] = null;
                  controller.typeWiseGetChannelVideo(0);

                  Get.to(() => const GetPlaylistPage());
                },
              ),
              const SizedBox(height: 15),
              SizedBox(height: Get.height * 0.03),
            ],
          ),
        ),
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
    return GestureDetector(
      onTap: callback,
      child: Container(
        color: Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 15),
        child: Row(
          children: [
            Container(
              alignment: Alignment.centerLeft,
              child: Obx(
                () => CircleAvatar(
                  radius: 23,
                  backgroundColor: isDarkMode.value ? const Color(0xFF281C5C) : const Color(0xFFEEF0FF),
                  child: Image(
                    image: AssetImage(iconPath),
                    height: 18,
                    width: 18,
                    color: isDarkMode.value ? AppColor.white : AppColor.primaryColor,
                  ),
                ),
              ),
            ),
            SizedBox(width: Get.width * 0.03),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold)),
                // subTitle == null ? const Offstage() : Text(subTitle!, style: GoogleFonts.urbanist(fontSize: 12, color: AppColors.grey)),
              ],
            ),
          ],
        ),
      ),
    );
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
