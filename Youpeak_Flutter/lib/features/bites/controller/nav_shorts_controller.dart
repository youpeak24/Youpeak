import 'package:get/get.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/bites/api/get_shorts_video_api.dart';
import 'package:youpeak/features/bites/model/get_shorts_video_model.dart';
import 'package:youpeak/core/services/convert_to_network.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class NavShortsController extends GetxController {
  RxList mainShortsVideos = [].obs;
  GetShortsVideoModel? _getShortsVideoModel;

  RxBool isApiLoading = false.obs;

  RxBool isPlaying = false.obs;
  RxInt currentPageIndex = 0.obs;

  RxBool isLoading = true.obs;
  RxBool isPaginationLoading = false.obs;

  // The last request failed (network/server), as opposed to returning no
  // Bites; lets the page show a retry instead of "No Bites yet".
  RxBool loadFailed = false.obs;

  @override
  void onInit() {
    // AppSettings.showLog("Nav Shorts Controller Initialized");

    AppSettings.showLog("Nav Shorts onInit call>>>>>>>>>>>>>>>>>");

    init();
    super.onInit();
  }

  void init() async {
    currentPageIndex.value = 0;
    mainShortsVideos.clear();
    _getShortsVideoModel = null;
    GetShortsVideoApi.startPagination = 0;
    isApiLoading.value = true;
    await onGetShortsVideos();
    isApiLoading.value = false;
  }

  void onPagination(int value) async {
    if ((mainShortsVideos.length - 1) == value) {
      if (!isPaginationLoading.value) {
        isPaginationLoading.value = true;
        await onGetShortsVideos();
        isPaginationLoading.value = false;
      }
    }
  }

  Future<void> onGetShortsVideos() async {
    _getShortsVideoModel =
        await GetShortsVideoApi.callApi(Database.loginUserId ?? "");
    loadFailed.value = _getShortsVideoModel == null;

    final paginationData = _getShortsVideoModel?.shorts ?? [];

    if (paginationData.isNotEmpty ?? false) {
      paginationData.shuffle();
      await 200.milliseconds.delay();

      if (AppSettings.isShowAds) {
        for (int i = 0; i < paginationData.length; i++) {
          // if (i != 0 && i % AppSettings.showAdsIndex == 0 && LoadMultipleAds.shortsAds.isNotEmpty) {
          if (i != 0 && i % AppSettings.showAdsIndex == 0) {
            mainShortsVideos.add(null);
            AppSettings.showLog("Insert Ads Index => $i");
          }

          mainShortsVideos.add(paginationData[i]);
          // onShortsVideoConvert(i, paginationData[i].id!, paginationData[i].videoUrl!);
          // onShortsImageConvert(i, paginationData[i].id!, paginationData[i].videoImage!);
        }
      } else {
        mainShortsVideos.addAll(paginationData);
      }
      // mainShortsVideos.addAll(paginationData ?? []);
      AppSettings.showLog("Pagination Length: ${mainShortsVideos.length}");
    } else {
      GetShortsVideoApi.startPagination--;
      AppSettings.showLog("Pagination Data Empty !!!");
    }
  }

  Future<void> onGetShortsVideos1() async {
    _getShortsVideoModel =
        await GetShortsVideoApi.callApi(Database.loginUserId!);

    List? paginationData = _getShortsVideoModel?.shorts;

    if (paginationData?.isNotEmpty ?? false) {
      paginationData?.shuffle();
      await 200.milliseconds.delay();

      // if (AppSettings.isShowAds) {
      //   for (int i = 0; i < paginationData.length; i++) {
      //     // if (i != 0 && i % AppSettings.showAdsIndex == 0 && LoadMultipleAds.shortsAds.isNotEmpty) {
      //     if (i != 0 && i % AppSettings.showAdsIndex == 0) {
      //       mainShortsVideos.add(null);
      //       AppSettings.showLog("Insert Ads Index => $i");
      //     }
      //
      //     mainShortsVideos.add(paginationData[i]);
      //     // onShortsVideoConvert(i, paginationData[i].id!, paginationData[i].videoUrl!);
      //     // onShortsImageConvert(i, paginationData[i].id!, paginationData[i].videoImage!);
      //   }
      // } else {
      //   mainShortsVideos.addAll(paginationData);
      // }
      mainShortsVideos.addAll(paginationData ?? []);
      AppSettings.showLog("Pagination Length: ${mainShortsVideos.length}");
    } else {
      GetShortsVideoApi.startPagination--;
      AppSettings.showLog("Pagination Data Empty !!!");
    }
  }

  void onShortsVideoConvert(int index, String videoId, String videoUrl) async {
    final networkUrl = await ConvertToNetwork.convert(videoUrl);
    if (networkUrl != "") {
      Database.onSetVideoUrl(videoId, networkUrl);
      AppSettings.showLog("Shorts Video Converted Index => $index");
    } else {
      AppSettings.showLog("Shorts Video Failed Index => $index");
    }
  }

  void onShortsImageConvert(
      int index, String videoId, String videoImage) async {
    if (Database.onGetImageUrl(videoId) == null) {
      final networkUrl = await ConvertToNetwork.convert(videoImage);
      if (networkUrl != "") {
        Database.onSetImageUrl(videoId, networkUrl);
        AppSettings.showLog("Shorts Image Converted Index => $index");
      } else {
        AppSettings.showLog("Shorts Image Failed Index => $index");
      }
    }
  }
}

// Working Mode * WithOut Ads Code....

// Future<void> onGetShortsVideos() async {
//   _getShortsVideoModel = await GetShortsVideoApi.callApi(Database.loginUserId!);
//
//   if (_getShortsVideoModel != null && (_getShortsVideoModel?.shorts?.isNotEmpty ?? false)) {
//     AppSettings.showLog("Pagination Page Length => ${_getShortsVideoModel?.shorts?.length}");
//
//     mainShortsVideos.addAll(_getShortsVideoModel!.shorts!);
//   } else {
//     GetShortsVideoApi.startPagination--;
//     AppSettings.showLog("Pagination Data Empty !!!");
//   }
// }
