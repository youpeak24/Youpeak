import 'dart:async';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/storage/database/search_history_database.dart';
import 'package:youpeak/features/subscriptions/api/subscribe_channel_api.dart';
import 'package:youpeak/features/search/api/search_api.dart';
import 'package:youpeak/features/search/model/search_model.dart';
import 'package:youpeak/features/video/api/unlock_private_video_api.dart';
import 'package:youpeak/core/services/permission_service.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/utils/utils.dart';
import 'package:youpeak/shared/widgets/subscribe_premium_channel_bottom_sheet.dart';
import 'package:youpeak/shared/widgets/subscribed_success_dialog.dart';
import 'package:youpeak/shared/widgets/unlock_premium_video_bottom_sheet.dart';
import 'package:speech_to_text/speech_to_text.dart';

class SearchingController extends GetxController {
  TextEditingController searchController = TextEditingController();

  SearchModel? searchModel;
  bool isLoading = false;

  RxBool isShowHistory = false.obs;
  bool isLoadingMore = false;
  List<Channel> searchChannel = [];
  List<Videos> searchVideo = [];
  List<Shorts> searchShorts = [];

  SpeechToText speechToText = SpeechToText();

  int selectedTabIndex = 0;
  List<String> tabTitles = [AppStrings.all.tr, AppStrings.channels.tr, AppStrings.videos.tr, AppStrings.shorts.tr];

  String text = AppStrings.micNode.tr;
  bool isListening = false;

  void init() {
    initializeMic();
    isShowHistory.value = true;
    SearchHistory.onGet();
  }

  void onDispose() {
    SearchHistory.onSet();
    selectedTabIndex = 0;
    searchChannel.clear();
    searchVideo.clear();
    searchShorts.clear();
    searchController.clear();
  }

  void onChangeTab(int value) {
    selectedTabIndex = value;
    update(["onChangeTab"]);
  }

  // Why the last search failed (shown with Retry), or null.
  String? searchError;
  Timer? _debounce;
  int _seq = 0; // only the newest request may update the results
  String _activeQuery = "";

  String get _query => searchController.text.trim().replaceAll(RegExp(r"\s+"), " ");

  /// Typing: search 350 ms after the last keystroke (not on every key).
  Future<void> onChanged() async {
    _debounce?.cancel();
    if (_query.isEmpty) {
      _seq++; // drop any request still in flight
      isShowHistory.value = true;
      isLoading = false;
      searchError = null;
      update(["onGetSearchData", "onChanged"]);
      return;
    }
    isShowHistory.value = false;
    update(["onChanged"]);
    _debounce = Timer(const Duration(milliseconds: 350), onGetSearchData);
  }

  /// Enter / search button: search now.
  void onSubmit() {
    _debounce?.cancel();
    final q = _query;
    if (q.isEmpty) return;
    if (!SearchHistory.mainSearchHistory.contains(q)) {
      SearchHistory.mainSearchHistory.insert(0, q);
      SearchHistory.onSet();
    }
    isShowHistory.value = false;
    onGetSearchData();
  }

  /// The clear (x) button.
  void onClear() {
    searchController.clear();
    onChanged();
  }

  Future<void> onGetSearchData() async {
    final q = _query;
    if (q.isEmpty) return;
    final seq = ++_seq;
    _activeQuery = q;
    isLoading = true;
    searchError = null;
    SearchApi.startPagination = 1;
    SearchApi.hasMoreData = true;
    update(["onGetSearchData"]);

    final model = await SearchApi.callApi(Database.loginUserId ?? "", q, "All");
    if (seq != _seq) return; // a newer search has started: ignore this answer

    searchChannel.clear();
    searchVideo.clear();
    searchShorts.clear();
    if (model == null) {
      searchError = "Search isn't available right now. Check your connection and try again.";
    } else {
      searchModel = model;
      searchChannel.addAll(model.searchData?.channel ?? []);
      searchVideo.addAll(model.searchData?.videos ?? []);
      searchShorts.addAll(model.searchData?.shorts ?? []);
    }
    isLoading = false;
    update(["onGetSearchData"]);
  }

  Future<void> loadMoreSearchData() async {
    if (isLoadingMore || isLoading || !SearchApi.hasMoreData || searchError != null) return;
    final q = _activeQuery;
    final seq = _seq;

    isLoadingMore = true;
    update(["onChangeLoadMore"]);

    SearchApi.startPagination += 1;
    AppSettings.showLog("Loading search page: ${SearchApi.startPagination}");

    final newModel = await SearchApi.callApi(Database.loginUserId ?? "", q, "All");
    if (seq != _seq) {
      isLoadingMore = false;
      update(["onChangeLoadMore"]);
      return; // the query changed meanwhile: these rows belong to the old one
    }
    if (newModel == null) SearchApi.startPagination -= 1; // let a later scroll retry this page

    if (newModel != null) {
      searchChannel.addAll(newModel.searchData?.channel ?? []);
      searchVideo.addAll(newModel.searchData?.videos ?? []);
      searchShorts.addAll(newModel.searchData?.shorts ?? []);
      update(["onGetSearchData"]);
    }

    isLoadingMore = false;
    update(["onChangeLoadMore"]);
  }

  void onClickMic() async {
    bool granted = await PermissionService.requestMicPermission();
    if (granted) {
      if (isListening) {
        // Stop listening
        AppSettings.showLog("Audio Recording Stop");
        isListening = false;
        update(["onClickMic"]);
        await stopListening();
      } else {
        // Start listening
        AppSettings.showLog("Audio Recording Start");
        isListening = true;
        update(["onClickMic"]);
        await startListening();
      }
    } else {}
  }

  Future<void> initializeMic() async {
    try {
      var available = await speechToText.initialize(
        onStatus: (status) {
          AppSettings.showLog("SpeechToText status: $status");
          if (status == 'done' || status == 'notListening') {
            if (isListening) {
              isListening = false;
              update(["onClickMic"]);
              stopListening();
            }
          }
        },
        onError: (errorNotification) {
          AppSettings.showLog("SpeechToText error: $errorNotification");
          isListening = false;
          update(["onClickMic"]);
        },
      );
      if (available == false) {
        AppSettings.showLog("Please Initialize Mic...");
      }
    } catch (e) {
      AppSettings.showLog("Mic Error => $e");
    }
  }

  Future<void> startListening() async {
    searchController.clear();
    text = "";
    await speechToText.listen(
      onResult: (result) {
        text = result.recognizedWords;
        searchController.text = text;
        update(["onChanged"]); // Update UI with recognized words
        Utils.showLog("MicroPhone ->> $text");
      },
    );
  }

  Future<void> stopListening() async {
    await speechToText.stop();

    if (text != AppStrings.micNode.tr && text.isNotEmpty) {
      searchController.text = text;
      text = AppStrings.micNode.tr;
    }

    if (searchController.text.trim().isNotEmpty) {
      if (!SearchHistory.mainSearchHistory.contains(searchController.text)) {
        SearchHistory.mainSearchHistory.insert(0, searchController.text);
      }
      isShowHistory.value = false;
      onGetSearchData();
    }
  }

  void onUnlockPrivateVideo({required int index, required BuildContext context, required bool isShorts}) async {
    if (isShorts) {
      UnlockPremiumVideoBottomSheet.onShow(
        coin: (searchShorts[index].videoUnlockCost ?? 0).toString(),
        callback: () async {
          Get.dialog(const LoaderUi(), barrierDismissible: false);
          await UnlockPrivateVideoApi.callApi(loginUserId: Database.loginUserId ?? "", videoId: searchShorts[index].id ?? "");

          /// 🔹 ALWAYS close loader first
          if (Get.isDialogOpen ?? false) {
            Get.back();
          }
          if (UnlockPrivateVideoApi.unlockPrivateVideoModel?.isUnlocked == true) {
            searchShorts = searchShorts.map((e) {
              if (e.id == searchShorts[index].id) {
                e.videoPrivacyType = 1;
              }
              return e;
            }).toList();

            /// 🔹 ALWAYS close loader first
            if (Get.isBottomSheetOpen ?? false) {
              Get.back();
            }

            update(["onGetSearchData"]);
            SubscribedSuccessDialog.show(context);
          }

          CustomToast.show(UnlockPrivateVideoApi.unlockPrivateVideoModel?.message ?? "");
        },
      );
    } else {
      UnlockPremiumVideoBottomSheet.onShow(
        coin: (searchVideo[index].videoUnlockCost ?? 0).toString(),
        callback: () async {
          Get.dialog(const LoaderUi(), barrierDismissible: false);
          await UnlockPrivateVideoApi.callApi(loginUserId: Database.loginUserId ?? "", videoId: searchVideo[index].id ?? "");

          /// 🔹 ALWAYS close loader first
          if (Get.isDialogOpen ?? false) {
            Get.back();
          }
          if (UnlockPrivateVideoApi.unlockPrivateVideoModel?.isUnlocked == true) {
            searchVideo = searchVideo.map((e) {
              if (e.id == searchVideo[index].id) {
                e.videoPrivacyType = 1;
              }
              return e;
            }).toList();

            /// 🔹 ALWAYS close loader first
            if (Get.isBottomSheetOpen ?? false) {
              Get.back();
            }
            update(["onGetSearchData"]);

            SubscribedSuccessDialog.show(context);
          }

          CustomToast.show(UnlockPrivateVideoApi.unlockPrivateVideoModel?.message ?? "");
        },
      );
    }
  }

  void onSubscribePrivateChannel({required int index, required BuildContext context, required bool isShorts}) async {
    if (isShorts) {
      SubscribePremiumChannelBottomSheet.onShow(
        coin: (searchShorts[index].subscriptionCost ?? 0).toString(),
        callback: () async {
          Get.dialog(const LoaderUi(), barrierDismissible: false);
          final bool isSuccess = await SubscribeChannelApiClass.callApi(searchShorts[index].channelId ?? "");

          Get.close(2);

          if (isSuccess) {
            searchShorts = searchShorts.map((e) {
              if (e.id == searchShorts[index].id) {
                e.videoPrivacyType = 1;
              }
              return e;
            }).toList();

            update(["onGetSearchData"]);
            SubscribedSuccessDialog.show(context);
          }
        },
      );
    } else {
      SubscribePremiumChannelBottomSheet.onShow(
        coin: (searchVideo[index].subscriptionCost ?? 0).toString(),
        callback: () async {
          Get.dialog(const LoaderUi(), barrierDismissible: false);
          final bool isSuccess = await SubscribeChannelApiClass.callApi(searchVideo[index].channelId ?? "");

          Get.close(2);

          if (isSuccess) {
            searchVideo = searchVideo.map((e) {
              if (e.id == searchVideo[index].id) {
                e.videoPrivacyType = 1;
              }
              return e;
            }).toList();

            update(["onGetSearchData"]);
            SubscribedSuccessDialog.show(context);
          }
        },
      );
    }
  }
}

class SearchAllModel {
  final int type;
  final dynamic data;

  SearchAllModel({required this.type, required this.data});
}

//
//
//
// List<SearchData>? searchAllVideos;
// List<SearchChannelData>? mainSearchChannels;
// List<SearchShortsData>? mainShortsVideos;
//
// // List<LastSearchedData>? allVideoSearchHistory;
// RxList<bool> isSubscribedChannel = <bool>[].obs;
//
// // RxBool isLoading = false.obs;
// RxBool isSearching = false.obs;
// RxBool isFilteredVideo = true.obs;
//
// @override
// void onInit() {
//   searchAllVideos = null;
//   searchController.clear();
//   super.onInit();
// }
//
// Future<void> onGetSearchShorts() async {
//   mainShortsVideos = null; // Clear Old Data...
//   update(["onGetSearchShorts"]);
//   mainShortsVideos = await SearchShortsApi.callApi(searchController.text, Database.loginUserId!) ?? [];
//   update(["onGetSearchShorts"]);
// }
//
// Future<void> onGetSearchVideos() async {
//   searchAllVideos = null;
//   update(["onGetSearchVideos"]);
//   searchAllVideos = await SearchAllVideoApiClass.callApi(searchController.text) ?? [];
//   update(["onGetSearchVideos"]);
// }

// void getAllVideoSearchHistory() async {
//   isLoading.value = true;
//   allVideoSearchHistory = await GetAllVideoSearchHistoryApi.callApi();
//   isLoading.value = false;
//   update();
// }
//
// Future clearAllHistory() async {
//   isLoading.value = true;
//   await ClearSearchHistoryApiClass.callApi();
//   allVideoSearchHistory?.clear();
//   isLoading.value = false;
// }

// void onSearchChannels() async {
//   mainSearchChannels = null;
//   isSubscribedChannel.value = [];
//   update(["onSearchChannels"]);
//   mainSearchChannels = await SearchChannelApiClass.callApi(searchController.text) ?? [];
//   mainSearchChannels?.forEach((element) {
//     isSubscribedChannel.add(element.isSubscribed!);
//   });
//
//   update(["onSearchChannels"]);
// }
