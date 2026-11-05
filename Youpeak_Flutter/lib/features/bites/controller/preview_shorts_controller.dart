import 'package:get/get.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/bites/model/get_shorts_video_model.dart';
import 'package:youpeak/features/bites/api/preview_shorts_api.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/utils/utils.dart';

class PreviewShortsController extends GetxController {
  GetShortsVideoModel? getShortsVideoModel;

  RxList mainShortsVideos = [].obs;

  RxInt currentPageIndex = 0.obs;

  RxBool isPlaying = false.obs;

  RxBool isPaginationLoading = false.obs;

  @override
  void onInit() {
    AppSettings.showLog("Preview Shorts Controller Initialized");
    AppSettings.showLog("short detail onInit call>>>>>>>>>>>>>>>>>");

    super.onInit();
  }

  void init(Shorts firstVideo) async {
    mainShortsVideos.clear();
    currentPageIndex.value = 0;
    mainShortsVideos.add(firstVideo);

    getShortsVideoModel = null;
    GetPreviewShortsVideoApi.startPagination = 0;
    await onGetShortsVideos(firstVideo);
  }

  Future<void> onGetShortsVideos(Shorts firstVideo) async {
    getShortsVideoModel =
        await GetPreviewShortsVideoApi.callApi(Database.loginUserId!);

    if (getShortsVideoModel != null &&
        (getShortsVideoModel?.shorts?.isNotEmpty ?? false)) {
      AppSettings.showLog(
          "Pagination Page : ${GetPreviewShortsVideoApi.startPagination} Length => ${getShortsVideoModel?.shorts?.length}");

      final List<Shorts> data = getShortsVideoModel!.shorts!;

      if (GetPreviewShortsVideoApi.startPagination == 1) {
        data.removeWhere((video) => video.id == firstVideo.id);
        data.shuffle();
      }
      Utils.showLog("AD SHOW ${AppSettings.isShowAds}");
      if (AppSettings.isShowAds) {
        for (int i = 0; i < data.length; i++) {
          if (i != 0 && i % AppSettings.showAdsIndex == 0) {
            mainShortsVideos.add(null);
            AppSettings.showLog("Insert Ads Index => $i");
          }
          mainShortsVideos.add(data[i]);
        }
      } else {
        mainShortsVideos.addAll(data);
      }
    } else {
      GetPreviewShortsVideoApi.startPagination--;

      AppSettings.showLog("Pagination Data Empty !!!");
    }
  }

  void onPagination({required int value, required Shorts firstVideo}) async {
    if ((mainShortsVideos.length - 1) == value) {
      if (!isPaginationLoading.value) {
        isPaginationLoading.value = true;
        await onGetShortsVideos(firstVideo);
        isPaginationLoading.value = false;
      }
    }
  }

// void onShortsConvert(List<Shorts> data) async {
//   for (int i = 0; i < data.length; i++) {
//     AppSettings.showLog("Shorts Index => $i");
//
//     final videoUrl = await ConvertToNetwork.convert(data[i].videoUrl!);
//     if (videoUrl != "") {
//       Database.onSetVideoUrl(data[i].id!, videoUrl);
//     }
//   }
// }
}
