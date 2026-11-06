import 'package:youpeak/core/platform/app_layout.dart';
import 'package:youpeak/features/playlist/api/playlist_manage_api.dart';
import 'package:youpeak/features/channel/model/channel_playlist_model.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:flutter/material.dart';
import 'package:get/get_core/src/get_main.dart';
import 'package:get/get_instance/src/extension_instance.dart';
import 'package:get/get_navigation/src/extension_navigation.dart';
import 'package:get/get_state_manager/src/rx_flutter/rx_obx_widget.dart';
import 'package:get/get_state_manager/src/simple/get_state.dart';
import 'package:get/get_utils/src/extensions/internacionalization.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/shared/shimmer/video_list_shimmer_ui.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/features/channel/view/preview_playlist_view.dart';
import 'package:youpeak/features/channel/controller/get_play_list_controller.dart';
import 'package:youpeak/core/constants/app_string.dart';

import 'package:youpeak/core/ads/google_small_native_ad.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class GetPlaylistPage extends StatefulWidget {
  const GetPlaylistPage({super.key});

  @override
  State<GetPlaylistPage> createState() => _GetPlaylistPageState();
}

class _GetPlaylistPageState extends State<GetPlaylistPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => getPlayListController.reload());
  }

  Future<void> _rename(PlayListsOfChannel p) async {
    final ctl = TextEditingController(text: p.playListName ?? "");
    final name = await Get.dialog<String>(AlertDialog(
      title: const Text("Rename playlist"),
      content: TextField(controller: ctl, autofocus: true, maxLength: 100, decoration: const InputDecoration(hintText: "Playlist name")),
      actions: [
        TextButton(onPressed: () => Get.back(), child: const Text("Cancel")),
        FilledButton(onPressed: () => Get.back(result: ctl.text.trim()), child: const Text("Save")),
      ],
    ));
    if (name == null || name.isEmpty || name == p.playListName) return;
    final r = await PlaylistManageApi.update(playListId: p.id ?? "", name: name);
    CustomToast.show(r.ok ? "Playlist renamed" : r.message);
    if (r.ok) await getPlayListController.reload();
  }

  Future<void> _togglePrivacy(PlayListsOfChannel p) async {
    final next = p.playListType == 2 ? 1 : 2;
    final r = await PlaylistManageApi.update(playListId: p.id ?? "", playListType: next);
    CustomToast.show(r.ok ? (next == 2 ? "Playlist is public" : "Playlist is private") : r.message);
    if (r.ok) await getPlayListController.reload();
  }

  Future<void> _delete(PlayListsOfChannel p) async {
    final sure = await Get.dialog<bool>(AlertDialog(
      title: const Text("Delete playlist?"),
      content: Text("\"${p.playListName ?? ""}\" will be deleted. The videos themselves aren't affected."),
      actions: [
        TextButton(onPressed: () => Get.back(result: false), child: const Text("Cancel")),
        FilledButton(style: FilledButton.styleFrom(backgroundColor: Colors.red), onPressed: () => Get.back(result: true), child: const Text("Delete")),
      ],
    ));
    if (sure != true) return;
    final r = await PlaylistManageApi.delete(p.id ?? "");
    CustomToast.show(r.ok ? "Playlist deleted" : r.message);
    if (r.ok) await getPlayListController.reload();
  }

  // final _controller = Get.put(GetPlayListController());

  GetPlayListController getPlayListController = Get.put(GetPlayListController());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        leadingWidth: 54,
        leading: AppPressable(
          onTap: () => Get.back(),
          semanticLabel: "Back",
          child: SizedBox(
            width: 48,
            height: 48,
            child: Center(
              child: Obx(
                () => AppIcon(
                  AppIcons.arrowBack,
                  size: 22,
                  color: isDarkMode.value ? AppColor.white : AppColor.black,
                ),
              ),
            ),
          ),
        ),
        centerTitle: AppSettings.isCenterTitle,
        title: Text(AppStrings.myPlayList.tr),
      ),
      body: GetBuilder<GetPlayListController>(
        id: "onGetPlayList",
        builder: (controller) {
          return controller.channelPlayList == null
              ? const VideoListShimmerUi()
              : (controller.channelPlayList!.isEmpty)
                  ? DataNotFoundUi(type: EmptyStateType.playlist, title: AppStrings.playlistNotAvailable.tr)
                  : controller.channelPlayList!.isNotEmpty
                      ? SingleChildScrollView(
                          // controller: controller.playListScrollController,
                          physics: const BouncingScrollPhysics(),
                          child: ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: controller.channelPlayList?.length,
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            itemBuilder: (context, index) {
                              return controller.channelPlayList![index].playListType == 1 && controller.channelPlayList![index].channelId != Database.channelId
                                  ? const Offstage()
                                  : Column(
                                      children: [
                                        Padding(
                                          padding: const EdgeInsets.only(bottom: 10),
                                          child: GestureDetector(
                                            onTap: () {
                                              Get.to(() => PreviewPlaylistView(
                                                    channelName: controller.channelPlayList![index].channelName!,
                                                    playListName: controller.channelPlayList![index].playListName!,
                                                    playListId: controller.channelPlayList![index].id!,
                                                  ));
                                            },
                                            child: Row(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              mainAxisAlignment: MainAxisAlignment.start,
                                              children: [
                                                Stack(
                                                  children: [
                                                    Obx(
                                                      () => Container(
                                                        clipBehavior: Clip.hardEdge,
                                                        height: SizeConfig.smallVideoImageHeight,
                                                        width: SizeConfig.smallVideoImageWidth,
                                                        decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_400),
                                                        child: PreviewVideoImage(
                                                          videoId: controller.channelPlayList![index].id!,
                                                          videoImage: controller.channelPlayList![index].videoImage!,
                                                        ),
                                                        // child: ConvertedPathView(
                                                        //     imageVideoPath: controller.channelPlayList![index].videos![0].videoImage!),
                                                      ),
                                                    ),
                                                    Positioned(
                                                      right: 0,
                                                      child: Container(
                                                        height: (Get.height / 4 > 200) ? Get.height / 7.5 : 110,
                                                        width: SizeConfig.screenWidth / 5,
                                                        decoration: BoxDecoration(
                                                          color: AppColor.black.withOpacity(0.4),
                                                          borderRadius: const BorderRadius.only(
                                                            topRight: Radius.circular(20),
                                                            bottomRight: Radius.circular(20),
                                                          ),
                                                        ),
                                                        child: Column(
                                                          mainAxisAlignment: MainAxisAlignment.center,
                                                          children: [
                                                            Text(
                                                              controller.channelPlayList![index].totalVideo!.toString(),
                                                              style: GoogleFonts.urbanist(fontSize: 14, color: AppColor.white),
                                                            ),
                                                            SizedBox(height: SizeConfig.blockSizeVertical * 1),
                                                            const ImageIcon(AssetImage(AppIcons.boldPlay), color: AppColor.white, size: 18),
                                                          ],
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                SizedBox(width: AppLayout.width * 0.03),
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Text(
                                                        controller.channelPlayList![index].playListName.toString(),
                                                        maxLines: 3,
                                                        style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold),
                                                      ),
                                                      SizedBox(height: SizeConfig.blockSizeVertical * 1),
                                                      Text(
                                                        controller.channelPlayList![index].playListType == 2 ? "Public" : "Private",
                                                        style: GoogleFonts.urbanist(
                                                          fontSize: 12,
                                                          color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black.withOpacity(0.7),
                                                        ),
                                                      ),
                                                      SizedBox(height: SizeConfig.blockSizeVertical * 1),
                                                      Text(
                                                        "${controller.channelPlayList![index].totalVideo ?? 0} videos",
                                                        style: GoogleFonts.urbanist(
                                                          fontSize: 12,
                                                          color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black.withOpacity(0.7),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                PopupMenuButton<String>(
                                                  tooltip: "Playlist options",
                                                  icon: const Icon(Icons.more_vert),
                                                  onSelected: (v) {
                                                    final p = controller.channelPlayList![index];
                                                    if (v == "rename") _rename(p);
                                                    if (v == "privacy") _togglePrivacy(p);
                                                    if (v == "delete") _delete(p);
                                                  },
                                                  itemBuilder: (_) => [
                                                    const PopupMenuItem(value: "rename", child: Text("Rename")),
                                                    PopupMenuItem(value: "privacy", child: Text(controller.channelPlayList![index].playListType == 2 ? "Make private" : "Make public")),
                                                    const PopupMenuItem(value: "delete", child: Text("Delete")),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                        index != 0 && index % AppSettings.showAdsIndex == 0 ? const GoogleSmallNativeAd() : const Offstage(),
                                      ],
                                    );
                            },
                          ),
                        )
                      : DataNotFoundUi(type: EmptyStateType.playlist, title: AppStrings.playlistNotAvailable.tr);
        },
      ),
    );
  }
}
