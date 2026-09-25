import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/ads/google_reward_ad.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/home/api/fetch_all_video_api.dart';
import 'package:youpeak/features/home/api/fetch_new_video_api.dart';
import 'package:youpeak/features/home/api/fetch_popular_video_api.dart';
import 'package:youpeak/features/home/api/fetch_public_live_api.dart';
import 'package:youpeak/features/home/model/fetch_all_video_model.dart';
import 'package:youpeak/features/home/model/fetch_new_video_model.dart';
import 'package:youpeak/features/home/model/fetch_popular_video_model.dart';
import 'package:youpeak/features/home/model/fetch_public_live_model.dart';
import 'package:youpeak/features/subscriptions/api/subscribe_channel_api.dart';
import 'package:youpeak/features/video/api/unlock_private_video_api.dart';
import 'package:youpeak/core/utils/utils.dart';
import 'package:youpeak/shared/widgets/subscribe_premium_channel_bottom_sheet.dart';
import 'package:youpeak/shared/widgets/subscribed_success_dialog.dart';
import 'package:youpeak/shared/widgets/unlock_premium_video_bottom_sheet.dart';

class NavHomeController extends GetxController {
  bool isLoadingPagination = false;

  int selectedTabIndex = 0;
  List<String> tabTitles = ["All", "Popular", "New", "Live"];

  ScrollController allTabScrollController = ScrollController();
  FetchAllVideoModel? fetchAllVideoModel;
  List<AllVideo> allVideos = [];
  List<AllShorts> allShorts = [];
  bool isLoadingAllTab = false;

  ScrollController popularTabScrollController = ScrollController();
  FetchPopularVideoModel? fetchPopularVideoModel;
  List<PopularVideos> popularVideos = [];
  List<PopularShorts> popularShorts = [];
  bool isLoadingPopularTab = false;

  ScrollController newTabScrollController = ScrollController();
  FetchNewVideoModel? fetchNewVideoModel;
  List<Video> newVideos = [];
  List<Short> newShorts = [];
  bool isLoadingNewTab = false;

  ScrollController publicLiveTabScrollController = ScrollController();
  FetchPublicLiveModel? fetchPublicLiveModel;
  List<LiveData?> publicLive = [];
  bool isLoadingPublicLiveTab = false;

  @override
  void onInit() {
    allTabScrollController.addListener(onPaginationAllTab);
    popularTabScrollController.addListener(onPaginationPopularTab);
    newTabScrollController.addListener(onPaginationNewTab);
    publicLiveTabScrollController.addListener(onPaginationLiveTab);
    GoogleRewardAd.loadAd();

    init();
    super.onInit();
  }

  @override
  void dispose() {
    allTabScrollController.dispose();
    popularTabScrollController.dispose();
    newTabScrollController.dispose();
    publicLiveTabScrollController.dispose();
    super.dispose();
  }

  void onChangeTab(int value) {
    selectedTabIndex = value;
    update(["onChangeTab"]);
  }

  Future init() async {
    FetchAllVideoApi.startPagination = 0;
    allVideos.clear();
    allShorts.clear();
    isLoadingAllTab = true;
    onGetAllTabVideo();

    FetchPopularVideoApi.startPagination = 0;
    popularVideos.clear();
    popularShorts.clear();
    isLoadingPopularTab = true;
    onGetPopularTabVideo();

    FetchNewVideoApi.startPagination = 0;
    newVideos.clear();
    newShorts.clear();
    isLoadingNewTab = true;
    onGetNewTabVideo();

    FetchPublicLiveApi.startPagination = 0;
    publicLive.clear();

    isLoadingPublicLiveTab = true;
    onGetPublicLiveTabVideo();
  }

  bool isRefreshing = false;

  Future<void> refreshInit() async {
    if (isRefreshing) return;
    isRefreshing = true;

    /// Reset All Tab
    FetchAllVideoApi.startPagination = 0;
    allVideos.clear();
    allShorts.clear();
    isLoadingAllTab = true;
    await onGetAllTabVideo();

    /// Reset Popular Tab
    FetchPopularVideoApi.startPagination = 0;
    popularVideos.clear();
    popularShorts.clear();
    isLoadingPopularTab = true;
    await onGetPopularTabVideo();

    /// Reset New Tab
    FetchNewVideoApi.startPagination = 0;
    newVideos.clear();
    newShorts.clear();
    isLoadingNewTab = true;
    await onGetNewTabVideo();

    /// Reset Public Live Tab
    FetchPublicLiveApi.startPagination = 0;
    publicLive.clear();
    isLoadingPublicLiveTab = true;
    await onGetPublicLiveTabVideo();
    isRefreshing = false;
  }

  Future<void> onGetAllTabVideo() async {
    fetchAllVideoModel = await FetchAllVideoApi.callApi(loginUserId: Database.loginUserId ?? "");

    final paginationShorts = fetchAllVideoModel?.data?.shorts;
    final paginationVideos = fetchAllVideoModel?.data?.videos;

    Utils.showLog("All Tab Pagination Data Len => ${paginationVideos?.length} => ${paginationShorts?.length}");

    if (paginationVideos?.isNotEmpty ?? false) {
      allVideos.addAll(paginationVideos ?? []);
      allShorts.addAll(paginationShorts ?? []);
    } else {
      FetchAllVideoApi.startPagination--;
      Utils.showLog("All Tab Pagination Data Empty");
    }
    isLoadingAllTab = false;
    update(["onGetAllTabVideo"]);
  }

  void onPaginationAllTab() async {
    if (allTabScrollController.position.pixels == allTabScrollController.position.maxScrollExtent) {
      isLoadingPagination = true;
      update(["onPagination"]);
      if (isLoadingPagination != true) {
        await onGetAllTabVideo();
      } else {
        Utils.showLog("REPEAT");
      }
      isLoadingPagination = false;
      update(["onPagination"]);
    }
  }

  Future<void> onGetPopularTabVideo() async {
    fetchPopularVideoModel = await FetchPopularVideoApi.callApi(loginUserId: Database.loginUserId ?? "");

    final paginationShorts = fetchPopularVideoModel?.data?.shorts;
    final paginationVideos = fetchPopularVideoModel?.data?.videos;

    Utils.showLog("Popular Tab Pagination Data Len => ${paginationVideos?.length} => ${paginationShorts?.length}");

    if (paginationVideos?.isNotEmpty ?? false) {
      popularVideos.addAll(paginationVideos ?? []);
      popularShorts.addAll(paginationShorts ?? []);
    } else {
      FetchPopularVideoApi.startPagination--;
      Utils.showLog("Popular Tab Pagination Data Empty");
    }
    isLoadingPopularTab = false;
    update(["onGetPopularTabVideo"]);
  }

  void onPaginationPopularTab() async {
    if (popularTabScrollController.position.pixels == popularTabScrollController.position.maxScrollExtent) {
      isLoadingPagination = true;
      update(["onPagination"]);
      await onGetPopularTabVideo();
      isLoadingPagination = false;
      update(["onPagination"]);
    }
  }

  Future<void> onGetNewTabVideo() async {
    fetchNewVideoModel = await FetchNewVideoApi.callApi(loginUserId: Database.loginUserId ?? "");

    final paginationShorts = fetchNewVideoModel?.data.shorts;
    final paginationVideos = fetchNewVideoModel?.data.videos;

    Utils.showLog("New Tab Pagination Data Len => ${paginationVideos?.length} => ${paginationShorts?.length}");

    if (paginationVideos?.isNotEmpty ?? false) {
      newVideos.addAll(paginationVideos ?? []);
      newShorts.addAll(paginationShorts ?? []);
    } else {
      FetchNewVideoApi.startPagination--;
      Utils.showLog("New Tab Pagination Data Empty");
    }
    isLoadingNewTab = false;
    update(["onGetNewTabVideo"]);
  }

  void onPaginationNewTab() async {
    if (newTabScrollController.position.pixels == newTabScrollController.position.maxScrollExtent) {
      isLoadingPagination = true;
      update(["onPagination"]);
      await onGetNewTabVideo();
      isLoadingPagination = false;
      update(["onPagination"]);
    }
  }

  Future<void> onGetPublicLiveTabVideo() async {
    fetchPublicLiveModel = await FetchPublicLiveApi.callApi(loginUserId: Database.loginUserId ?? "");

    final paginationData = fetchPublicLiveModel?.data;

    Utils.showLog("Live Tab Pagination Data Len => ${paginationData?.length}");

    if (paginationData?.isNotEmpty ?? false) {
      publicLive.addAll(paginationData ?? []);
    } else {
      FetchPublicLiveApi.startPagination--;
      Utils.showLog("Live Tab Pagination Data Empty");
    }
    isLoadingPublicLiveTab = false;
    update(["onGetPublicLiveTabVideo"]);
  }

  void onPaginationLiveTab() async {
    if (publicLiveTabScrollController.position.pixels == publicLiveTabScrollController.position.maxScrollExtent) {
      isLoadingPagination = true;
      update(["onPagination"]);
      await onGetPublicLiveTabVideo();
      isLoadingPagination = false;
      update(["onPagination"]);
    }
  }

  // ── helper: mark a video as unlocked across ALL home tab lists ──
  void _markVideoUnlocked(String videoId) {
    allVideos = allVideos.map((e) {
      if (e.id == videoId) e.videoPrivacyType = 1;
      return e;
    }).toList();
    allShorts = allShorts.map((e) {
      if (e.id == videoId) e.videoPrivacyType = 1;
      return e;
    }).toList();
    popularVideos = popularVideos.map((e) {
      if (e.id == videoId) e.videoPrivacyType = 1;
      return e;
    }).toList();
    popularShorts = popularShorts.map((e) {
      if (e.id == videoId) e.videoPrivacyType = 1;
      return e;
    }).toList();
    newVideos = newVideos.map((e) {
      if (e.id == videoId) e.videoPrivacyType = 1;
      return e;
    }).toList();
    newShorts = newShorts.map((e) {
      if (e.id == videoId) e.videoPrivacyType = 1;
      return e;
    }).toList();
    update(["onGetAllTabVideo", "onGetPopularTabVideo", "onGetNewTabVideo"]);
  }

  // ── helper: mark a channel as subscribed across ALL home tab lists ──
  void _markChannelSubscribed(String channelId) {
    allVideos = allVideos.map((e) {
      if (e.channelId == channelId) e.videoPrivacyType = 1;
      return e;
    }).toList();
    allShorts = allShorts.map((e) {
      if (e.channelId == channelId) e.videoPrivacyType = 1;
      return e;
    }).toList();
    popularVideos = popularVideos.map((e) {
      if (e.channelId == channelId) e.videoPrivacyType = 1;
      return e;
    }).toList();
    popularShorts = popularShorts.map((e) {
      if (e.channelId == channelId) e.videoPrivacyType = 1;
      return e;
    }).toList();
    newVideos = newVideos.map((e) {
      if (e.channelId == channelId) e.videoPrivacyType = 1;
      return e;
    }).toList();
    newShorts = newShorts.map((e) {
      if (e.channelId == channelId) e.videoPrivacyType = 1;
      return e;
    }).toList();
    update(["onGetAllTabVideo", "onGetPopularTabVideo", "onGetNewTabVideo"]);
  }

  void onUnlockPrivateVideo({required int tabType, required int index, required BuildContext context, required bool isShorts}) async {
    // Determine which video to unlock based on tab & type
    final String videoId;
    final num cost;

    if (tabType == 0) {
      videoId = isShorts ? (allShorts[index].id ?? "") : (allVideos[index].id ?? "");
      cost = isShorts ? (allShorts[index].videoUnlockCost ?? 0) : (allVideos[index].videoUnlockCost ?? 0);
    } else if (tabType == 1) {
      videoId = isShorts ? (popularShorts[index].id ?? "") : (popularVideos[index].id ?? "");
      cost = isShorts ? (popularShorts[index].videoUnlockCost ?? 0) : (popularVideos[index].videoUnlockCost ?? 0);
    } else {
      videoId = isShorts ? (newShorts[index].id ?? "") : (newVideos[index].id ?? "");
      cost = isShorts ? (newShorts[index].videoUnlockCost ?? 0) : (newVideos[index].videoUnlockCost ?? 0);
    }

    UnlockPremiumVideoBottomSheet.onShow(
      coin: cost.toString(),
      callback: () async {
        Get.dialog(const LoaderUi(), barrierDismissible: false);
        await UnlockPrivateVideoApi.callApi(loginUserId: Database.loginUserId ?? "", videoId: videoId);

        if (Get.isDialogOpen ?? false) Get.back();

        if (UnlockPrivateVideoApi.unlockPrivateVideoModel?.isUnlocked == true) {
          // ✅ Update ALL lists at once
          _markVideoUnlocked(videoId);

          if (Get.isBottomSheetOpen ?? false) Get.back();
          SubscribedSuccessDialog.show(context);
        }

        CustomToast.show(UnlockPrivateVideoApi.unlockPrivateVideoModel?.message ?? "");
      },
    );
  }

  void onSubscribePrivateChannel({required int tabType, required int index, required BuildContext context, required bool isShorts}) async {
    // Determine which channel to subscribe based on tab & type
    final String channelId;
    final num cost;

    if (tabType == 0) {
      channelId = isShorts ? (allShorts[index].channelId ?? "") : (allVideos[index].channelId ?? "");
      cost = isShorts ? (allShorts[index].subscriptionCost ?? 0) : (allVideos[index].subscriptionCost ?? 0);
    } else if (tabType == 1) {
      channelId = isShorts ? (popularShorts[index].channelId ?? "") : (popularVideos[index].channelId ?? "");
      cost = isShorts ? (popularShorts[index].subscriptionCost ?? 0) : (popularVideos[index].subscriptionCost ?? 0);
    } else {
      channelId = isShorts ? (newShorts[index].channelId ?? "") : (newVideos[index].channelId ?? "");
      cost = isShorts ? (newShorts[index].subscriptionCost ?? 0) : (newVideos[index].subscriptionCost ?? 0);
    }

    SubscribePremiumChannelBottomSheet.onShow(
      coin: cost.toString(),
      callback: () async {
        Get.dialog(const LoaderUi(), barrierDismissible: false);
        final bool isSuccess = await SubscribeChannelApiClass.callApi(channelId);

        Get.close(2);

        if (isSuccess) {
          // ✅ Update ALL lists at once
          _markChannelSubscribed(channelId);
          SubscribedSuccessDialog.show(context);
        }
      },
    );
  }
}

// void onPagination() async {
//   if (scrollController.position.pixels == scrollController.position.maxScrollExtent) {
//     onChangeLoading();
//     await onGetHomeVideos();
//     onChangeLoading();
//   }
// }
//
// void onChangeLoading() {
//   isPaginationLoading = !isPaginationLoading;
//   update(["changeLoader"]);
// }

// Future<void> onGetHomeVideos() async {
//   _getAllVideoModel = await GetAllVideoApi.callApi(loginUserId: Database.loginUserId!);
//   if (_getAllVideoModel?.videos != null && _getAllVideoModel!.videos!.isNotEmpty) {
//     List<Videos> videos = _getAllVideoModel!.videos!;
//     AppSettings.showLog("Api Video Length => ${videos.length}");
//
//     if (videos.isNotEmpty) {
//       mainHomeVideos.addAll(videos);
//
//       onVideoConvert(videos);
//
//       update(["changeVideos"]);
//
//       AppSettings.showLog("Normal Video Pagination Length => ${mainHomeVideos.length}");
//     } else {
//       GetAllVideoApi.startPagination--;
//       AppSettings.showLog("Get All Video Response Is Empty");
//     }
//   } else {
//     GetAllVideoApi.startPagination--;
//     AppSettings.showLog("Get All Video Response Is Empty");
//   }
// }

// Future<void> onGetShortsVideos() async {
//   _getShortsVideoModel = await GetPreviewShortsVideoApi.callApi(Database.loginUserId!, 1, 50);
//
//   if (_getShortsVideoModel != null && (_getShortsVideoModel?.shorts?.isNotEmpty ?? false)) {
//     AppSettings.showLog("Pagination Page Length => ${_getShortsVideoModel?.shorts?.length}");
//
//     mainShortsVideos.addAll(_getShortsVideoModel!.shorts!);
//     mainShortsVideos.shuffle();
//
//     update(["changeVideos"]);
//     onShortsConvert();
//   } else {
//     AppSettings.showLog("Pagination Data Empty !!!");
//   }
// }
//
// void onVideoConvert(List<Videos> data) async {
//   for (int i = 0; i < data.length; i++) {
//     if (Database.onGetVideoUrl(data[i].id!) == null) {
//       if ((data[i].videoTime! < 3600000)) {
//         final videoUrl = await ConvertToNetwork.convert(data[i].videoUrl!);
//         if (videoUrl != "") {
//           AppSettings.showLog("Normal Video Convert Url Index => $i");
//           Database.onSetVideoUrl(data[i].id!, videoUrl);
//         } else {
//           AppSettings.showLog("Normal Video Failed Index => $i");
//         }
//       } else {
//         AppSettings.showLog("Long Video Pending Convert Index => $i");
//       }
//     }
//   }
// }
//
// void onShortsConvert() async {
//   for (int i = 0; i < mainShortsVideos.length; i++) {
//     final videoUrl = await ConvertToNetwork.convert(mainShortsVideos[i].videoUrl!);
//     if (videoUrl != "") {
//       AppSettings.showLog("Home Shorts Video Converted Index => $i");
//       Database.onSetVideoUrl(mainShortsVideos[i].id!, videoUrl);
//     } else {
//       AppSettings.showLog("Shorts Video Failed Index => $i");
//     }
//   }
// }
