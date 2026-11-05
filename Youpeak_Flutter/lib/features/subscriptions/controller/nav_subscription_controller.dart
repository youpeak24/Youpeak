import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/subscriptions/api/get_subscribed_channel_api.dart';
import 'package:youpeak/features/subscriptions/model/get_subscribed_channel_model.dart';
import 'package:youpeak/features/subscriptions/api/get_subscribed_channel_video_api.dart';
import 'package:youpeak/features/subscriptions/model/get_subscribed_channel_video_model.dart';
import 'package:youpeak/features/channel/api/get_channel_video_api.dart';
import 'package:youpeak/features/channel/model/get_channel_video_model.dart';
import 'package:youpeak/features/video/api/unlock_private_video_api.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/shared/widgets/subscribed_success_dialog.dart';
import 'package:youpeak/shared/widgets/unlock_premium_video_bottom_sheet.dart';

class NavSubscriptionPageController extends GetxController {
  RxBool isPaginationLoading = false.obs;
  RxBool isChannelPaginationLoading = false.obs;
  bool isAllVideoLastPage = false;
  ScrollController allVideoScrollController = ScrollController();
  ScrollController mainScrollController = ScrollController();
  ScrollController normalVideoController = ScrollController();
  ScrollController shortsVideoController = ScrollController();
  ScrollController scrollController = ScrollController();

  @override
  void onInit() {
    allVideoScrollController.addListener(onScrollAllVideos);
    normalVideoController.addListener(onScrollNormalVideo);
    shortsVideoController.addListener(onScrollShortsVideo);
    scrollController.addListener(onGetChannelScrolling);
    super.onInit();
  }

  // >>>>> Get User Subscriber Channels <<<<<
  List<SubscribedChannel>? mainSubscribedChannels = [];

  Future<void> onGetSubscribedChannels() async {
    mainSubscribedChannels = null; // Use To Old Data Clear...
    GetSubScribedChannelApiClass.startPagination = 0;
    mainSubscribedChannels = await GetSubScribedChannelApiClass.callApi() ?? [];
    update(["onGetSubscribedChannels"]);

    // Get Types => All Videos
    if ((mainSubscribedChannels?.isNotEmpty ?? false) && mainAllChannelVideos[0] == null) {
      typeWiseGetSubScribedVideo(0);
    }
  }

  void onGetChannelScrolling() async {
    if (scrollController.position.pixels == scrollController.position.maxScrollExtent) {
      isChannelPaginationLoading.value = true;
      await onGetSubscribedChannels();
      isChannelPaginationLoading.value = false;
    }
  }

  // >>>>> Get All Subscribed Channel Videos With Type Wise <<<<<
  List<List<VideoOfSubscribedChannel>?> mainAllChannelVideos = [null, null, null];

  Future<void> typeWiseGetSubScribedVideo(int type) async {
    selectedSubscribeType = type;

    /// Reset pagination
    GetSubScribedVideoApiClass.startPagination = 0;
    isAllVideoLastPage = false;

    mainAllChannelVideos[type] = null;
    update(["typeWiseGetSubScribedVideo"]);

    final data = await GetSubScribedVideoApiClass.callApi(type) ?? [];

    mainAllChannelVideos[type] = data;

    /// If first load < limit → no more pages
    if (data.length < GetSubScribedVideoApiClass.limitPagination) {
      isAllVideoLastPage = true;
    }

    update(["typeWiseGetSubScribedVideo"]);
  }

  void onScrollAllVideos() async {
    if (allVideoScrollController.position.pixels >= allVideoScrollController.position.maxScrollExtent - 100) {
      if (isPaginationLoading.value || isAllVideoLastPage) return;

      isPaginationLoading.value = true;

      /// Increment start
      GetSubScribedVideoApiClass.startPagination += GetSubScribedVideoApiClass.limitPagination;

      final data = await GetSubScribedVideoApiClass.callApi(selectedSubscribeType) ?? [];

      if (data.isNotEmpty) {
        mainAllChannelVideos[selectedSubscribeType]?.addAll(data);

        /// If less data received → last page
        if (data.length < GetSubScribedVideoApiClass.limitPagination) {
          isAllVideoLastPage = true;
        }

        update(["typeWiseGetSubScribedVideo"]);
      } else {
        /// rollback
        GetSubScribedVideoApiClass.startPagination -= GetSubScribedVideoApiClass.limitPagination;

        isAllVideoLastPage = true;
      }

      isPaginationLoading.value = false;
    }
  }

  // >>>>> Change Subscribe Type [All/Today/Continue Watching] <<<<<

  int selectedSubscribeType = 0;

  void onChangeSubscribeType(int index) {
    AppSettings.showLog("On Change Subscribe Type => $index");
    selectedSubscribeType = index;
    update(["onChangeSubscribeType"]);

    if (mainAllChannelVideos[index] == null || (mainAllChannelVideos[index]?.isEmpty ?? true)) {
      typeWiseGetSubScribedVideo(index);
    }
  }

  // >>>>> Change Video Type  [Videos/Shorts] <<<<<

  int selectedVideoType = 0;

  void onChangeVideoType(int index) {
    selectedVideoType = index;
    update(["onChangeVideoType"]);

    if (particularChannelVideos[index] == null || (particularChannelVideos[index]?.isEmpty ?? true)) {
      GetChannelVideoApiClass.startPagination[index] = 0;
      typeWiseGetSubscribedChannelVideo(selectedChannel!, index);
    }
  }

  // >>>>> Get Selected Channel Videos With Type Wise [Videos/Shorts] <<<<<

  List<List<VideosTypeWiseOfChannel>?> particularChannelVideos = [null, null];

  Future<void> typeWiseGetSubscribedChannelVideo(int channelIndex, int type) async {
    final data = (await GetChannelVideoApiClass.callApi(type, mainSubscribedChannels![channelIndex].channelId!) ?? []);
    if (particularChannelVideos[type] == null) {
      particularChannelVideos[type] = [];
      type == 0 ? update(["onChangeNormalVideo"]) : update(["onChangeShortsVideo"]);
    }
    if (data.isNotEmpty) {
      particularChannelVideos[type]?.addAll(data);
      type == 0 ? update(["onChangeNormalVideo"]) : update(["onChangeShortsVideo"]);
    } else {
      GetChannelVideoApiClass.startPagination[type]--;
      AppSettings.showLog("Api Data Is Empty");
    }
  }

  // >>>>> Change Selected Channel <<<<<

  int? selectedChannel;

  void onChangeParticularChannel(int index) {
    selectedChannel = index;
    particularChannelVideos[0] = null;
    particularChannelVideos[1] = null;
    update(["onChangeParticularChannel"]);
    onChangeVideoType(0);
  }

  void onScrollNormalVideo() async {
    if (normalVideoController.position.pixels == normalVideoController.position.maxScrollExtent) {
      isPaginationLoading.value = true;
      await typeWiseGetSubscribedChannelVideo(selectedChannel!, 0);
      isPaginationLoading.value = false;
    }
  }

  void onScrollShortsVideo() async {
    if (shortsVideoController.position.pixels == shortsVideoController.position.maxScrollExtent) {
      isPaginationLoading.value = true;
      await typeWiseGetSubscribedChannelVideo(selectedChannel!, 1);
      isPaginationLoading.value = false;
    }
  }

  void onUnlockPrivateVideo({required int index, required BuildContext context, bool? isShorts, required bool isAllChannel}) async {
    if (isAllChannel) {
      UnlockPremiumVideoBottomSheet.onShow(
        coin: (mainAllChannelVideos[selectedSubscribeType]?[index].videoUnlockCost ?? 0).toString(),
        callback: () async {
          Get.dialog(const LoaderUi(), barrierDismissible: false);
          await UnlockPrivateVideoApi.callApi(loginUserId: Database.loginUserId ?? "", videoId: mainAllChannelVideos[selectedSubscribeType]?[index].videoId ?? "");

          /// 🔹 Close Loader FIRST
          if (Get.isDialogOpen ?? false) {
            Get.back();
          }

          if (UnlockPrivateVideoApi.unlockPrivateVideoModel?.isUnlocked == true) {
            mainAllChannelVideos[selectedSubscribeType] = mainAllChannelVideos[selectedSubscribeType]?.map((e) {
              if (e.id == mainAllChannelVideos[selectedSubscribeType]?[index].id) {
                e.videoPrivacyType = 1;
              }
              return e;
            }).toList();

            /// 🔹 ALWAYS close loader first
            if (Get.isBottomSheetOpen ?? false) {
              Get.back();
            }

            SubscribedSuccessDialog.show(context);
          }
          if (Get.isBottomSheetOpen ?? false) {
            Get.back();
          }

          CustomToast.show(UnlockPrivateVideoApi.unlockPrivateVideoModel?.message ?? "");
        },
      );
    } else {
      if (isShorts == true) {
        UnlockPremiumVideoBottomSheet.onShow(
          coin: (particularChannelVideos[1]?[index].videoUnlockCost ?? 0).toString(),
          callback: () async {
            Get.dialog(const LoaderUi(), barrierDismissible: false);
            await UnlockPrivateVideoApi.callApi(loginUserId: Database.loginUserId ?? "", videoId: particularChannelVideos[1]?[index].id ?? "");

            /// 🔹 ALWAYS close loader first
            if (Get.isDialogOpen ?? false) {
              Get.back();
            }
            if (UnlockPrivateVideoApi.unlockPrivateVideoModel?.isUnlocked == true) {
              particularChannelVideos[1] = particularChannelVideos[1]?.map((e) {
                if (e.id == particularChannelVideos[1]?[index].id) {
                  e.videoPrivacyType = 1;
                }
                return e;
              }).toList();

              /// 🔹 ALWAYS close loader first
              if (Get.isBottomSheetOpen ?? false) {
                Get.back();
              }

              update(["onChangeShortsVideo"]);
              SubscribedSuccessDialog.show(context);
            }

            if (Get.isBottomSheetOpen ?? false) {
              Get.back();
            }

            CustomToast.show(UnlockPrivateVideoApi.unlockPrivateVideoModel?.message ?? "");
          },
        );
      } else if (isShorts == false) {
        UnlockPremiumVideoBottomSheet.onShow(
          coin: (particularChannelVideos[0]?[index].videoUnlockCost ?? 0).toString(),
          callback: () async {
            Get.dialog(const LoaderUi(), barrierDismissible: false);
            await UnlockPrivateVideoApi.callApi(loginUserId: Database.loginUserId ?? "", videoId: particularChannelVideos[0]?[index].id ?? "");

            /// 🔹 ALWAYS close loader first
            if (Get.isDialogOpen ?? false) {
              Get.back();
            }
            if (UnlockPrivateVideoApi.unlockPrivateVideoModel?.isUnlocked == true) {
              particularChannelVideos[0] = particularChannelVideos[0]?.map((e) {
                if (e.id == particularChannelVideos[0]?[index].id) {
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
            if (Get.isBottomSheetOpen ?? false) {
              Get.back();
            }

            CustomToast.show(UnlockPrivateVideoApi.unlockPrivateVideoModel?.message ?? "");
          },
        );
      }
    }
  }
}
