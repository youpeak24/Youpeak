import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/network/api_problem.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/subscriptions/api/subscribe_channel_api.dart';
import 'package:youpeak/features/coins/api/get_my_coin_api.dart';
import 'package:youpeak/features/channel/api/channel_about_api.dart';
import 'package:youpeak/features/channel/model/channel_about_model.dart';
import 'package:youpeak/features/channel/view/channel_about_tab_view.dart';
import 'package:youpeak/features/channel/api/channel_home_api.dart';
import 'package:youpeak/features/channel/model/channel_home_model.dart';
import 'package:youpeak/features/channel/view/channel_home_tab_view.dart';
import 'package:youpeak/features/channel/api/channel_playlist_api.dart';
import 'package:youpeak/features/channel/model/channel_playlist_model.dart';
import 'package:youpeak/features/channel/view/channel_playlist_tab_view.dart';
import 'package:youpeak/features/channel/model/get_play_list_model.dart';
import 'package:youpeak/features/channel/view/channel_video_tab_view.dart';
import 'package:youpeak/features/channel/api/get_channel_video_api.dart';
import 'package:youpeak/features/channel/model/get_channel_video_model.dart';
import 'package:youpeak/features/video/api/unlock_private_video_api.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/shared/widgets/subscribe_premium_channel_bottom_sheet.dart';
import 'package:youpeak/shared/widgets/subscribed_success_dialog.dart';
import 'package:youpeak/shared/widgets/unlock_premium_video_bottom_sheet.dart';

class YourChannelController extends GetxController {
  ScrollController channelShortVideoController = ScrollController();
  ScrollController channelNormalVideoController = ScrollController();
  ScrollController mainScrollController = ScrollController();
  ScrollController homeScrollController = ScrollController();
  ScrollController playListScrollController = ScrollController();
  ScrollController scrollController = ScrollController();

  //  Main Variable...

  String channelId = "";
  String playListId = "";
  String loginUserId = "";
  RxBool isSubscribe = false.obs;
  RxInt countSubscribes = 0.obs;
  RxBool isPaginationLoading = false.obs;
  RxBool isPlayListPaginationLoading = false.obs;

  //  Custom TabBar Variable...

  int selectedTab = 0;

  final List tabBarPage = [
    const ChannelHomeTabView(),
    const ChannelPlayListTabView(),
    const ChannelVideoTabView(),
    const ChannelAboutTabView(),
  ];

  @override
  void onInit() {
    homeScrollController.addListener(onHomeScrolling);
    playListScrollController.addListener(onChannelPlayListScrolling);
    scrollController.addListener(onGetPlayListScrolling);
    channelNormalVideoController.addListener(onChannelNormalScrolling);
    channelShortVideoController.addListener(onChannelShortScrolling);
    super.onInit();
  }

  // >>>>> Page <<<<<

  void onRestart() async {
    ChannelHomeApi.startPagination = 0; // Home Restart Pagination
    ChannelPlayListApi.startPagination = 0; // PlayList Restart Pagination
    GetChannelVideoApiClass.startPagination[0] =
        0; // Normal Video Restart Pagination
    GetChannelVideoApiClass.startPagination[1] =
        0; // Shorts Video Restart Pagination
    GetPlayListOnlyApi.startPagination = 0; // Shorts Video Restart Pagination

    selectedTab = 0;
    selectedVideoType = 0;
    channelHomeVideos = null; // Clear All Data...
    getPlayListVideo = null; // Clear All Data...
    channelPlayList = null; // Clear All Data...

    channelVideos[0] = null; // Clear All Data...
    channelVideos[1] = null; // Clear All Data...

    channelHomeModel = null; // Clear All Data...
    channelLoadFailed = false;
    channelAboutModel = null; // Clear All Data...

    update([
      "onGetChannelHomeVideo",
      "onChangeVideoType",
      "onGetPlayList",
      "onChangeTabBar",
      "onGetChannelAbout",
      "onChangeScrollController"
    ]);

    GetMyCoinApi.callApi(loginUserId: loginUserId);
    onGetChannelHomeVideo(loginUserId, channelId);
  }

  Future<void> init(String loginUserId, String channelId) async {
    this.loginUserId = loginUserId;
    this.channelId = channelId;

    channelHomeModel = null;
    channelLoadFailed = false;
    channelHomeVideos = null;
    getPlayListVideo = null;
    update(["onGetChannelHomeVideo"]);

    onClear();

    ChannelHomeApi.startPagination = 0; // Home Restart Pagination
    ChannelPlayListApi.startPagination = 0; // PlayList Restart Pagination
    GetChannelVideoApiClass.startPagination[0] =
        0; // Normal Video Restart Pagination
    GetChannelVideoApiClass.startPagination[1] =
        0; // Shorts Video Restart Pagination
    GetPlayListOnlyApi.startPagination = 0; // Shorts Video Restart Pagination

    GetMyCoinApi.callApi(loginUserId: loginUserId);

    await onGetChannelHomeVideo(loginUserId, channelId);
    await getPlayListApi(loginUserId, playListId);
  }

  // >>>>> Channel Home Tab View <<<<<

  ChannelHomeModel? channelHomeModel;
  List<DetailsOfChannel>? channelHomeVideos;

  /// The channel header could not be loaded (network error, unreadable
  /// reply, or the server refused). The page shows a retry instead of an
  /// endless placeholder.
  bool channelLoadFailed = false;
  String channelLoadMessage = "";

  /// Why the header couldn't be loaded (signed out, session expired, refused,
  /// offline, server error, unreadable reply), so the page can say so and
  /// offer the right action.
  ApiProblem? channelLoadProblem;

  Future<void> onGetChannelHomeVideo(
      String loginUserId, String channelId) async {
    final fetched = await ChannelHomeApi.fetch(loginUserId, channelId);
    final model = fetched.model;
    if (model == null || model.status != true) {
      // Give the page back so the next call asks for the same page again.
      if (ChannelHomeApi.startPagination > 0) ChannelHomeApi.startPagination--;
      if (channelHomeModel == null) {
        channelLoadFailed = true;
        channelLoadProblem = fetched.problem ??
            ApiProblem(ApiProblemKind.refused, serverMessage: model?.message ?? "", httpStatus: 200);
        channelLoadMessage = channelLoadProblem!.message(what: "this channel");
        update(["onGetChannelHomeVideo"]);
      }
      return;
    }
    channelLoadFailed = false;
    channelLoadMessage = "";
    channelLoadProblem = null;
    channelHomeModel = model;

    final data = channelHomeModel?.detailsOfChannel;
    isSubscribe.value = channelHomeModel?.isSubscribed ?? false;
    countSubscribes.value = channelHomeModel?.totalSubscribers ?? 0;
    AppSettings.showLog(
        "Channel Home Pagination Api Data Length => ${data?.length}");
    if (channelHomeModel != null && channelHomeVideos == null) {
      channelHomeVideos = [];
      update(["onGetChannelHomeVideo"]);
    }

    if (data != null && data.isNotEmpty) {
      channelHomeVideos?.addAll(data);
      AppSettings.showLog(
          "Channel Home Video Length => ${channelHomeVideos?.length}");
      update(["onGetChannelHomeVideo"]);
    } else {
      ChannelHomeApi.startPagination--;
    }
  }

  void onHomeScrolling() async {
    if (homeScrollController.position.pixels ==
        homeScrollController.position.maxScrollExtent) {
      isPaginationLoading.value = true;
      await onGetChannelHomeVideo(loginUserId, channelId);
      isPaginationLoading.value = false;
    }
  }

  // >>>>> Channel Playlist Tab View <<<<<

  int? selectedPlayList;
  int selectedPlayListVideo = 0;
  ChannelPlaylistModel? channelPlaylistModel;
  List<PlayListsOfChannel>? channelPlayList;

  Future<void> onGetPlayList() async {
    channelPlaylistModel = await ChannelPlayListApi.callApi(channelId);

    final data = channelPlaylistModel?.playListsOfChannel;
    if (channelPlayList == null) {
      channelPlayList = [];
      update(["onGetPlayList"]);
    }
    if (data != null && data.isNotEmpty) {
      channelPlayList?.addAll(data!);
      update(["onGetPlayList"]);
    } else {
      ChannelPlayListApi.startPagination--;
    }
  }

  void onChannelPlayListScrolling() async {
    if (playListScrollController.position.pixels ==
        playListScrollController.position.maxScrollExtent) {
      isPaginationLoading.value = true;
      await onGetPlayList();
      isPaginationLoading.value = false;
    }
  }

  // >>>>> Channel Video Tab View <<<<<

  int selectedVideoType = 0;

  List<List<VideosTypeWiseOfChannel>?> channelVideos = [
    null,
    null
  ]; // [Normal , Shorts]

  Future<void> typeWiseChannelVideo(int type) async {
    final data = await GetChannelVideoApiClass.callApi(type, channelId);
    if (channelVideos[type] == null) {
      channelVideos[type] = [];
      type == 0
          ? update(["onChangeNormalVideo"])
          : update(["onChangeShortsVideo"]);
    }
    if (data != null && data.isNotEmpty) {
      channelVideos[type]?.addAll(data);
      type == 0
          ? update(["onChangeNormalVideo"])
          : update(["onChangeShortsVideo"]);
    } else {
      GetChannelVideoApiClass.startPagination[type]--;
    }
  }

  void onChangeVideoType(int index) {
    selectedVideoType = index;
    update(["onChangeVideoType", "onChangeScrollController"]);
    if (channelVideos[selectedVideoType] == null) {
      typeWiseChannelVideo(selectedVideoType);
    }
  }

  void onChannelNormalScrolling() async {
    if (channelNormalVideoController.position.pixels ==
        channelNormalVideoController.position.maxScrollExtent) {
      isPaginationLoading.value = true;
      await typeWiseChannelVideo(selectedVideoType);
      isPaginationLoading.value = false;
    }
  }

  void onChannelShortScrolling() async {
    if (channelShortVideoController.position.pixels ==
        channelShortVideoController.position.maxScrollExtent) {
      isPaginationLoading.value = true;
      await typeWiseChannelVideo(selectedVideoType);
      isPaginationLoading.value = false;
    }
  }

  // >>>>> Channel About Tab View <<<<<

  ChannelAboutModel? channelAboutModel;

  void onGetChannelAbout() async {
    channelAboutModel = await ChannelAboutApi.callApi(channelId);
    update(["onGetChannelAbout"]);
  }

  void onChangeTabBar(int index) {
    selectedTab = index;
    if (selectedTab == 0 && channelHomeVideos == null) {
      ChannelHomeApi.startPagination = 0;
      onGetChannelHomeVideo(loginUserId, channelId);
    }
    if (selectedTab == 1 && channelPlayList == null) {
      ChannelPlayListApi.startPagination = 0;
      onGetPlayList();
    }
    if (selectedTab == 2 && channelVideos[selectedVideoType] == null) {
      GetChannelVideoApiClass.startPagination[selectedVideoType] = 0;
      typeWiseChannelVideo(selectedVideoType);
    }
    if (selectedTab == 3 && channelAboutModel == null) {
      onGetChannelAbout();
    }
    update(["onChangeTabBar", "onChangeScrollController"]);
  }

  void onClear() async {
    print("9999999999999999");
    selectedTab = 0;
    selectedVideoType = 0;
    channelHomeVideos = null; // Clear All Data...
    channelPlayList = null; // Clear All Data...

    channelVideos[0] = null; // Clear All Data...
    channelVideos[1] = null; // Clear All Data...

    channelHomeModel = null; // Clear All Data...
    channelLoadFailed = false;
    channelAboutModel = null; // Clear All Data...

    GetChannelVideoApiClass.startPagination[0] = 0; // Restart Pagination
    GetChannelVideoApiClass.startPagination[1] = 0; // Restart Pagination
  }

  void onUnlockPrivateVideo(
      {required int tabType,
      required int index,
      required BuildContext context}) async {
    if (tabType == 0) {
      UnlockPremiumVideoBottomSheet.onShow(
        coin: (channelHomeVideos?[index].videoUnlockCost ?? 0).toString(),
        callback: () async {
          Get.dialog(const LoaderUi(), barrierDismissible: false);
          await UnlockPrivateVideoApi.callApi(
              loginUserId: Database.loginUserId ?? "",
              videoId: channelHomeVideos?[index].id ?? "");

          /// 🔹 ALWAYS close loader first
          if (Get.isDialogOpen ?? false) {
            Get.back();
          }
          if (UnlockPrivateVideoApi.unlockPrivateVideoModel?.isUnlocked ==
              true) {
            channelHomeVideos = channelHomeVideos?.map((e) {
              if (e.id == channelHomeVideos?[index].id) {
                e.videoPrivacyType = 1;
              }
              return e;
            }).toList();

            /// 🔹 ALWAYS close loader first
            if (Get.isBottomSheetOpen ?? false) {
              Get.back();
            }
            update(["onGetChannelHomeVideo"]);

            SubscribedSuccessDialog.show(context);
          }

          CustomToast.show(
              UnlockPrivateVideoApi.unlockPrivateVideoModel?.message ?? "");
        },
      );
    } else if (tabType == 2) {
      UnlockPremiumVideoBottomSheet.onShow(
        coin: (channelVideos[0]?[index].videoUnlockCost ?? 0).toString(),
        callback: () async {
          Get.dialog(const LoaderUi(), barrierDismissible: false);
          await UnlockPrivateVideoApi.callApi(
              loginUserId: Database.loginUserId ?? "",
              videoId: channelVideos[0]?[index].id ?? "");

          /// 🔹 ALWAYS close loader first
          if (Get.isDialogOpen ?? false) {
            Get.back();
          }
          if (UnlockPrivateVideoApi.unlockPrivateVideoModel?.isUnlocked ==
              true) {
            channelVideos[0] = channelVideos[0]?.map((e) {
              if (e.id == channelVideos[0]?[index].id) {
                e.videoPrivacyType = 1;
              }
              return e;
            }).toList();

            /// 🔹 ALWAYS close loader first
            if (Get.isBottomSheetOpen ?? false) {
              Get.back();
            }
            update(["onChangeNormalVideo"]);

            SubscribedSuccessDialog.show(context);
          }

          CustomToast.show(
              UnlockPrivateVideoApi.unlockPrivateVideoModel?.message ?? "");
        },
      );
    }
  }

  void onSubscribePrivateChannel(
      {required int tabType,
      required int index,
      required BuildContext context}) async {
    print("*****************");
    if (tabType == 0) {
      SubscribePremiumChannelBottomSheet.onShow(
        coin: (channelHomeVideos?[index].subscriptionCost ?? 0).toString(),
        callback: () async {
          Get.dialog(const LoaderUi(), barrierDismissible: false);
          final bool isSuccess = await SubscribeChannelApiClass.callApi(
              channelHomeVideos?[index].channelId ?? "");

          Get.close(2);

          if (isSuccess) {
            // channelHomeVideos = channelHomeVideos?.map((e) {
            //   if (e.id == channelHomeVideos?[index].id) {
            //     e.videoPrivacyType = 1;
            //   }
            //   return e;
            // }).toList();

            update(["onGetChannelHomeVideo"]);
            SubscribedSuccessDialog.show(context);
            await 2.seconds.delay();
            init(loginUserId, channelId);
          }
        },
      );

      // Type => Popular
    } else if (tabType == 2) {
      SubscribePremiumChannelBottomSheet.onShow(
        coin: (channelVideos[1]?[index].subscriptionCost ?? 0).toString(),
        callback: () async {
          Get.dialog(const LoaderUi(), barrierDismissible: false);
          final bool isSuccess = await SubscribeChannelApiClass.callApi(
              channelVideos[1]?[index].channelId ?? "");

          Get.close(2);

          if (isSuccess) {
            update(["onChangeShortsVideo"]);
            SubscribedSuccessDialog.show(context);
            await 2.seconds.delay();
            onRestart();
          }
        },
      );
    }
  }

  // >>>>> get playlist <<<<<

  GetPlayListModel? getPlayListModel;
  List<PlayList>? getPlayListVideo;

  Future<void> getPlayListApi(String loginUserId, String playListId) async {
    final response = await GetPlayListOnlyApi.callApi(loginUserId, playListId);

    if (response == null) {
      GetPlayListOnlyApi.startPagination--;
      return;
    }

    final data = response.playListVideos;

    AppSettings.showLog("API Data Length => ${data?.length}");

    if (data != null && data.isNotEmpty) {
      getPlayListVideo ??= [];
      getPlayListVideo!.addAll(data);

      AppSettings.showLog("Total Stored Length => ${getPlayListVideo!.length}");

      update(["onGetChannelHomeVideo"]);
    } else {
      GetPlayListOnlyApi.startPagination--;
    }
  }

  void onGetPlayListScrolling() async {
    if (scrollController.position.pixels ==
        scrollController.position.maxScrollExtent) {
      isPlayListPaginationLoading.value = true;
      await getPlayListApi(loginUserId, playListId);
      isPlayListPaginationLoading.value = false;
    }
  }
}
