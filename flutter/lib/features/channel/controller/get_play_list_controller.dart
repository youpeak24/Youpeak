import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/channel/api/channel_home_api.dart';
import 'package:youpeak/features/channel/api/channel_playlist_api.dart';
import 'package:youpeak/features/channel/model/channel_playlist_model.dart';
import 'package:youpeak/features/channel/model/get_play_list_model.dart';
import 'package:youpeak/features/channel/api/get_channel_video_api.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class GetPlayListController extends GetxController {
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

  @override
  void onInit() {
    // The page loads the list itself (reload) — loading here too made two
    // requests append the same playlists twice.
    playListScrollController.addListener(onChannelPlayListScrolling);
    scrollController.addListener(onGetPlayListScrolling);
    super.onInit();
  }

  // >>>>> Channel Playlist Tab View <<<<<

  int? selectedPlayList;
  int selectedPlayListVideo = 0;
  ChannelPlaylistModel? channelPlaylistModel;
  List<PlayListsOfChannel>? channelPlayList;

  /// Fresh list (on every visit, and after a change).
  int _generation = 0; // a reload drops answers to older requests

  Future<void> reload() async {
    _generation++;
    channelPlayList = null;
    ChannelPlayListApi.startPagination = 0;
    update(["onGetPlayList"]);
    await onGetPlayList();
  }

  // Playlists belong to the signed-in user's own profile (channel id = user
  // id); users without a channel have playlists too.
  String get _ownerId => (Database.channelId ?? "").isNotEmpty ? Database.channelId! : (Database.loginUserId ?? "");

  Future<void> onGetPlayList() async {
    final generation = _generation;
    final model = await ChannelPlayListApi.callApi(_ownerId);
    if (generation != _generation) return;
    channelPlaylistModel = model;

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
    if (playListScrollController.position.pixels == playListScrollController.position.maxScrollExtent) {
      isPaginationLoading.value = true;
      await onGetPlayList();
      isPaginationLoading.value = false;
    }
  }

  void onClear() async {
    print("9999999999999999");
    selectedTab = 0;
    channelPlayList = null; // Clear All Data...

    GetChannelVideoApiClass.startPagination[0] = 0; // Restart Pagination
    GetChannelVideoApiClass.startPagination[1] = 0; // Restart Pagination
  }

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
      await getPlayListApi(loginUserId, playListId);
      isPlayListPaginationLoading.value = false;
    }
  }
}
