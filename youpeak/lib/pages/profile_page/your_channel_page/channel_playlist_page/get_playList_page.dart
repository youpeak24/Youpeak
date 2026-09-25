import 'package:flutter/material.dart';
import 'package:get/get_core/src/get_main.dart';
import 'package:get/get_instance/src/extension_instance.dart';
import 'package:get/get_navigation/src/extension_navigation.dart';
import 'package:get/get_state_manager/src/rx_flutter/rx_obx_widget.dart';
import 'package:get/get_state_manager/src/simple/get_state.dart';
import 'package:get/get_utils/src/extensions/internacionalization.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/custom/custom_ui/data_not_found_ui.dart';
import 'package:youpeak/custom/shimmer/video_list_shimmer_ui.dart';
import 'package:youpeak/pages/nav_shorts_page/nav_shorts_details_view.dart';
import 'package:youpeak/pages/profile_page/your_channel_page/channel_playlist_page/preview_playlist_view.dart';
import 'package:youpeak/pages/profile_page/your_channel_page/main_page/get_play_list_controller.dart';
import 'package:youpeak/utils/string/app_string.dart';

import '../../../../ads/google_ads/google_small_native_ad.dart';
import '../../../../database/database.dart';
import '../../../../main.dart';
import '../../../../utils/colors/app_color.dart';
import '../../../../utils/config/size_config.dart';
import '../../../../utils/icons/app_icons.dart';
import '../../../../utils/services/preview_image.dart';
import '../../../../utils/settings/app_settings.dart';

class GetPlaylistPage extends StatefulWidget {
  const GetPlaylistPage({super.key});

  @override
  State<GetPlaylistPage> createState() => _GetPlaylistPageState();
}

class _GetPlaylistPageState extends State<GetPlaylistPage> {
  @override
  void initState() {
    // TODO: implement initState
    super.initState();
  }

  // final _controller = Get.put(GetPlayListController());

  GetPlayListController getPlayListController = Get.put(GetPlayListController());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        leadingWidth: 60,
        leading: IconButtonUi(
          callback: () => Get.back(),
          icon: Obx(
            () => Image.asset(AppIcons.arrowBack, height: 20, width: 20, color: isDarkMode.value ? AppColor.white : AppColor.black),
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
                  : (controller.channelPlayList!.where((element) => element.playListType == 2 || element.channelId == Database.channelId).isNotEmpty)
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
                                                SizedBox(width: Get.width * 0.03),
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
                                                        controller.channelPlayList![index].channelName!,
                                                        style: GoogleFonts.urbanist(
                                                          fontSize: 12,
                                                          color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black.withOpacity(0.7),
                                                        ),
                                                      ),
                                                      SizedBox(height: SizeConfig.blockSizeVertical * 1),
                                                      Text(
                                                        "${controller.channelPlayList![index].totalVideo!} videos",
                                                        style: GoogleFonts.urbanist(
                                                          fontSize: 10,
                                                          color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black.withOpacity(0.7),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                const Offstage()
                                                // GestureDetector(child: const Icon(Icons.more_vert), onTap: () {}),
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
