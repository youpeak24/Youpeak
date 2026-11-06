import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/playlist/api/fetch_normal_video_api.dart';
import 'package:youpeak/features/playlist/api/play_list_get_with_search_api.dart';
import 'package:youpeak/features/playlist/model/fetch_normal_video_model.dart';
import 'package:youpeak/features/playlist/model/get_playList_with_serach_response_model.dart';
import 'package:youpeak/features/video/api/unlock_private_video_api.dart';
import 'package:youpeak/core/utils/utils.dart';
import 'package:youpeak/shared/widgets/subscribed_success_dialog.dart';
import 'package:youpeak/shared/widgets/unlock_premium_video_bottom_sheet.dart';

class CreatePlaylistController extends GetxController {
  ScrollController scrollController = ScrollController();
  ScrollController scrollControllerPlayList = ScrollController();

  FetchNormalVideoModel? fetchNormalVideoModel;
  GetPlayListWithSearchResponseModel? getPlayListWithSearchResponseModel;

  bool isLoadingPagination = false;
  bool isLoadingPaginationPlayList = false;
  bool isLoading = false;
  bool isLoadingPlayList = false;
  List<Videos> normalVideos = [];
  List<Video> videos = [];

  @override
  void onInit() {
    init();
    scrollController.addListener(onPagination);
    scrollControllerPlayList.addListener(onGetPlayListPagination);
    super.onInit();
  }

  @override
  void onClose() {
    scrollController.dispose();
    scrollControllerPlayList.dispose();
    super.onClose();
  }

  Future<void> init() async {
    FetchNormalVideoApi.startPagination = 0;
    PlayListGetWithSearchApi.startPagination = 0;
    isLoading = true;
    isLoadingPlayList = true;
    normalVideos.clear();
    videos.clear();
    onGetNormalVideo();
    getPlayListWithSearch();
  }

  Future<void> onGetNormalVideo() async {
    fetchNormalVideoModel = await FetchNormalVideoApi.callApi(loginUserId: Database.loginUserId ?? "");

    final paginationVideos = fetchNormalVideoModel?.videos;

    Utils.showLog("Normal Video Pagination Data Len => ${paginationVideos?.length}");

    if (paginationVideos?.isNotEmpty ?? false) {
      normalVideos.addAll(paginationVideos ?? []);

      isLoading = false;
      update(["onGetNormalVideo"]);
    } else {
      FetchNormalVideoApi.startPagination--;
      Utils.showLog("Normal Video Pagination Data Empty");
    }
  }

  void onPagination() async {
    if (scrollController.position.pixels == scrollController.position.maxScrollExtent) {
      isLoadingPagination = true;
      update(["onPagination"]);
      await onGetNormalVideo();
      isLoadingPagination = false;
      update(["onPagination"]);
    }
  }

  void onUnlockPrivateVideo({required int index, required BuildContext context}) async {
    UnlockPremiumVideoBottomSheet.onShow(
      coin: (normalVideos[index].videoUnlockCost ?? 0).toString(),
      callback: () async {
        Get.dialog(const LoaderUi(), barrierDismissible: false);
        await UnlockPrivateVideoApi.callApi(loginUserId: Database.loginUserId ?? "", videoId: normalVideos[index].id ?? "");

        /// 🔹 ALWAYS close loader first
        if (Get.isDialogOpen ?? false) {
          Get.back();
        }
        if (UnlockPrivateVideoApi.unlockPrivateVideoModel?.isUnlocked == true) {
          normalVideos = normalVideos.map((e) {
            if (e.id == normalVideos[index].id) {
              e.videoPrivacyType = 1;
            }
            return e;
          }).toList();

          /// 🔹 ALWAYS close loader first
          if (Get.isBottomSheetOpen ?? false) {
            Get.back();
          }
          update(["onGetNormalVideo"]);

          SubscribedSuccessDialog.show(context);
        }

        CustomToast.show(UnlockPrivateVideoApi.unlockPrivateVideoModel?.message ?? "");
      },
    );
  }

  Future<void> getPlayListWithSearch() async {
    getPlayListWithSearchResponseModel = await PlayListGetWithSearchApi.callApi(search: "");

    final paginationVideos = getPlayListWithSearchResponseModel?.videos;

    Utils.showLog("Normal Video Pagination Data Len => ${paginationVideos?.length}");

    if (paginationVideos?.isNotEmpty ?? false) {
      videos.addAll(paginationVideos ?? []);

      isLoadingPlayList = false;
      update(["onGetNormalVideo"]);
    } else {
      PlayListGetWithSearchApi.startPagination--;
      Utils.showLog("Normal Video Pagination Data Empty");
    }
  }

  void onGetPlayListPagination() async {
    if (scrollControllerPlayList.position.pixels == scrollControllerPlayList.position.maxScrollExtent) {
      isLoadingPaginationPlayList = true;
      update(["onPagination"]);
      await getPlayListWithSearch();
      isLoadingPaginationPlayList = false;
      update(["onPagination"]);
    }
  }
}
