import 'package:flutter/material.dart';
import 'package:youpeak/features/playlist/api/playlist_manage_api.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/storage/database/download_history_database.dart';
import 'package:youpeak/core/storage/database/watch_history_database.dart';
import 'package:youpeak/features/playlist/controller/create_playlist_controller.dart';
import 'package:youpeak/features/playlist/api/create_play_list_api.dart';
import 'package:youpeak/features/library/model/save_to_watch_later_model.dart';
import 'package:youpeak/features/library/api/watch_later_api.dart';
import 'package:youpeak/features/library/model/watch_later_model.dart';
import 'package:youpeak/features/channel/view/get_playList_page.dart';
import 'package:youpeak/features/channel/api/get_channel_video_api.dart';
import 'package:youpeak/features/channel/model/get_channel_video_model.dart';
import 'package:youpeak/features/video/api/unlock_private_video_api.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/shared/widgets/subscribed_success_dialog.dart';
import 'package:youpeak/shared/widgets/unlock_premium_video_bottom_sheet.dart';

class NavLibraryPageController extends GetxController {
  @override
  void onInit() {
    WatchHistory.onGet(); // Get Into Database...
    DownloadHistory.onGet(); // Get Into Database...
    channelNormalVideo.addListener(onChannelNormalVideoScroll);
    channelShortVideo.addListener(onChannelShortVideoScroll);
    Get.put(CreatePlaylistController());
    super.onInit();
  }

  // ****** Your Channel Video Page ******

  int selectedVideoType = 0;
  SaveToWatchLaterModel? saveToWatchLaterModel;

  final channelShortVideo = ScrollController();
  final channelNormalVideo = ScrollController();

  RxBool isPaginationLoaded = false.obs;

  List<List<VideosTypeWiseOfChannel>?> mainChannelVideos = [null, null]; // [Normal,Shorts]

  void onChangeVideoType(int index) {
    selectedVideoType = index;
    if (mainChannelVideos[index] == null || (mainChannelVideos[index]?.isEmpty ?? true)) {
      GetChannelVideoApiClass.startPagination[index] = 0;
      mainChannelVideos[index] = null;
      typeWiseGetChannelVideo(index);
    }
    update(["onChangeVideoType"]);
  }

  void onChannelNormalVideoScroll() async {
    if (channelNormalVideo.position.pixels == channelNormalVideo.position.maxScrollExtent) {
      isPaginationLoaded.value = true;
      await typeWiseGetChannelVideo(0);
      isPaginationLoaded.value = false;
    }
  }

  void onChannelShortVideoScroll() async {
    if (channelShortVideo.position.pixels == channelShortVideo.position.maxScrollExtent) {
      isPaginationLoaded.value = true;
      await typeWiseGetChannelVideo(1);
      isPaginationLoaded.value = false;
    }
  }

  Future<void> typeWiseGetChannelVideo(int videoType) async {
    final data = (await GetChannelVideoApiClass.callApi(videoType, Database.channelId ?? "") ?? []);

    if (mainChannelVideos[videoType] == null) {
      mainChannelVideos[videoType] = [];
      videoType == 0 ? update(["updateChannelNormalVideo"]) : update(["updateChannelShortsVideo"]);
    }
    if (data.isNotEmpty) {
      mainChannelVideos[videoType]?.addAll(data);
      videoType == 0 ? update(["updateChannelNormalVideo"]) : update(["updateChannelShortsVideo"]);
    } else {
      GetChannelVideoApiClass.startPagination[videoType]--; // Use Recalling Same Page After Pagination
    }
  }

  // ****** Play List Page ******

  int? selectPlayListType;
  List<String> playList = [];

  // void createPlayList() async {
  //   if (playList.isNotEmpty && selectPlayListType != null && AppSettings.playListNameController.text.isNotEmpty) {
  //     Get.dialog(
  //       barrierDismissible: false,
  //       const PopScope(canPop: false, child: LoaderUi()),
  //     );
  //     await CreatePlayListApiClass.callApi(selectPlayListType!, playList);
  //     Get.close(3);
  //     playList.clear();
  //     selectPlayListType = null;
  //     AppSettings.playListNameController.clear();
  //     update(["onChangePlayList"]);
  //
  //     CustomToast.show(AppStrings.newPlayListCreatedSuccess.tr);
  //   } else {
  //     CustomToast.show(AppStrings.pleaseFillUpDetails.tr);
  //   }
  // }

  void createPlayList() async {
    if (playList.isNotEmpty && selectPlayListType != null && AppSettings.playListNameController.text.isNotEmpty) {
      Get.dialog(
        barrierDismissible: false,
        const PopScope(canPop: false, child: LoaderUi()),
      );

      final result = await PlaylistManageApi.create(
        name: AppSettings.playListNameController.text.trim(),
        playListType: selectPlayListType!, // 1 private, 2 public
        videoIds: List.of(playList),
      );

      Get.back(); // close loader
      if (!result.ok) {
        CustomToast.show(result.message);
        return;
      }
      Get.back(); // close bottom sheet

      playList.clear();
      selectPlayListType = null;
      AppSettings.playListNameController.clear();

      GetChannelVideoApiClass.startPagination[0] = 0;
      GetChannelVideoApiClass.startPagination[1] = 0;
      mainChannelVideos[0] = null;
      mainChannelVideos[1] = null;
      typeWiseGetChannelVideo(0);

      Get.off(() => const GetPlaylistPage());

      CustomToast.show(AppStrings.newPlayListCreatedSuccess.tr);
    } else {
      CustomToast.show(AppStrings.pleaseFillUpDetails.tr);
    }
  }

  void insertIntoPlayList(String videoId) {
    playList.add(videoId);
    update(["onChangePlayList"]);
  }

  void deleteIntoPlayList(String videoId) {
    playList.remove(videoId);
    update(["onChangePlayList"]);
  }

  // ****** Watch Later Page ******

  List<GetSaveToWatchLater>? mainWatchLaterVideos;

  // Call on Watch Later Button and Refresh Indicator
  Future<void> onGetWatchLaterVideo() async {
    mainWatchLaterVideos = null; // Remove Old Video
    mainWatchLaterVideos = (await GetWatchLaterApiClass.callApi()) ?? [];
    update(["onGetWatchLaterVideo"]);
  }

  void onUnlockPrivateVideo({required int index, required BuildContext context}) async {
    UnlockPremiumVideoBottomSheet.onShow(
      coin: (mainWatchLaterVideos?[index].videoUnlockCost ?? 0).toString(),
      callback: () async {
        Get.dialog(const LoaderUi(), barrierDismissible: false);
        await UnlockPrivateVideoApi.callApi(loginUserId: Database.loginUserId ?? "", videoId: mainWatchLaterVideos?[index].videoId ?? "");

        /// 🔹 ALWAYS close loader first
        if (Get.isDialogOpen ?? false) {
          Get.back();
        }
        if (UnlockPrivateVideoApi.unlockPrivateVideoModel?.isUnlocked == true) {
          mainWatchLaterVideos = mainWatchLaterVideos?.map((e) {
            if (e.id == mainWatchLaterVideos?[index].id) {
              e.videoPrivacyType = 1;
            }
            return e;
          }).toList();

          /// 🔹 ALWAYS close loader first
          if (Get.isBottomSheetOpen ?? false) {
            Get.back();
          }
          update(["onGetWatchLaterVideo"]);

          SubscribedSuccessDialog.show(context);
        }

        CustomToast.show(UnlockPrivateVideoApi.unlockPrivateVideoModel?.message ?? "");
      },
    );
  }
}

// for (int i = 0; i < data.length; i++) {
//   await WatchLaterDatabase.onSet(data[i].videoId!, data[i].videoImage!);
//   mainWatchLaterVideos?.add(data[i]);
// }
// ****** Download Page ******

// getDownloadVideos() async {
//   downloadCollection = (await GetDownloadedVideoApiClass.callApi());
//   update(["getDownloadVideos"]);
// }

// ****** Download Page ******

// List<GetdownloadVideoHistory>? downloadCollection;

// ****** Watch History Page ******

// List<WatchHistory>? watchHistoryCollection;

// ****** Watch History Page ******

// void getWatchHistoryVideo() async {
//   // watchHistoryCollection = (await GetWatchHistoryApiClass.callApi()) ?? [];
//   update(["getWatchHistoryVideo"]);
// }
