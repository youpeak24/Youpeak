import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/channel/api/channel_home_api.dart';
import 'package:youpeak/features/channel/model/get_play_list_model.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class PreviewPlayListController extends GetxController {
  ScrollController scrollController = ScrollController();

  String playListId = "";
  RxBool isPlayListPaginationLoading = false.obs;
  int selectedPlayListVideo = 0;

  @override
  void onInit() {
    scrollController.addListener(onGetPlayListScrolling);
    super.onInit();
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
    if (scrollController.position.pixels == scrollController.position.maxScrollExtent) {
      isPlayListPaginationLoading.value = true;
      await getPlayListApi(Database.loginUserId ?? "", playListId);
      isPlayListPaginationLoading.value = false;
    }
  }
}
