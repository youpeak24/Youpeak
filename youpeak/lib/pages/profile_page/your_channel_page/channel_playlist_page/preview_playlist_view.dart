import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/custom/custom_method/custom_format_timer.dart';
import 'package:youpeak/custom/shimmer/video_list_shimmer_ui.dart';
import 'package:youpeak/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/pages/nav_library_page/create_playlist_page/add_into_play_list_api.dart';
import 'package:youpeak/pages/profile_page/your_channel_page/channel_home_page/channel_home_api.dart';
import 'package:youpeak/pages/profile_page/your_channel_page/channel_playlist_page/preview_play_list_controller.dart';
import 'package:youpeak/pages/profile_page/your_channel_page/main_page/your_channel_controller.dart';
import 'package:youpeak/pages/video_details_page/normal_video_details_view.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/config/size_config.dart';
import 'package:youpeak/utils/constant/app_constant.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/services/preview_image.dart';
import 'package:youpeak/utils/string/app_string.dart';

class PreviewPlaylistView extends StatefulWidget {
  const PreviewPlaylistView({
    super.key,
    required this.channelName,
    required this.playListName,
    required this.playListId,
  });

  final String channelName;
  final String playListName;
  final String playListId;

  @override
  State<PreviewPlaylistView> createState() => _PreviewPlaylistViewState();
}

class _PreviewPlaylistViewState extends State<PreviewPlaylistView> {
  final controller = Get.put(PreviewPlayListController());

  @override
  void initState() {
    super.initState();

    GetPlayListOnlyApi.startPagination = 0;
    controller.getPlayListVideo = [];
    controller.playListId = widget.playListId;

    controller.getPlayListApi(
      Database.loginUserId ?? "",
      widget.playListId,
    );
  }

  @override
  void dispose() {
    controller.scrollController.dispose();
    Get.delete<PreviewPlayListController>();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // final previewPlayListController = Get.put(PreviewPlayListController());
    final yourChannelController = Get.find<YourChannelController>();
    yourChannelController.scrollController
        .addListener(yourChannelController.onGetPlayListScrolling);

    return Scaffold(
        bottomNavigationBar: Obx(
          () => Visibility(
            visible: yourChannelController.isPlayListPaginationLoading.value,
            child: LinearProgressIndicator(
                color: AppColor.primaryColor,
                backgroundColor: AppColor.grey_300),
          ),
        ),
        appBar: AppBar(
          systemOverlayStyle: const SystemUiOverlayStyle(
              statusBarColor: Colors.transparent,
              statusBarBrightness: Brightness.dark),
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: GestureDetector(
              child: Image.asset(AppIcons.arrowBack,
                      color: isDarkMode.value ? AppColor.white : AppColor.black)
                  .paddingOnly(left: 15),
              onTap: () => Get.back()),
          leadingWidth: 33,
          title: Text(AppStrings.yourPlayList.tr,
              style: GoogleFonts.urbanist(
                  fontSize: 18, fontWeight: FontWeight.bold)),
        ),
        body: GetBuilder<PreviewPlayListController>(
            id: "onGetChannelHomeVideo",
            builder: (controller) {
              if (controller.getPlayListVideo == null ||
                  controller.getPlayListVideo!.isEmpty) {
                return const VideoListShimmerUi();
              }
              return ListView.builder(
                shrinkWrap: true,
                controller: controller.scrollController,
                physics: const AlwaysScrollableScrollPhysics(),
                itemCount: controller.getPlayListVideo?.length ?? 0,
                padding: const EdgeInsets.only(
                    top: 0, bottom: 50, left: 10, right: 10),
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: GestureDetector(
                      onTap: () {
                        controller.selectedPlayListVideo = index;
                        print(
                            "controller.getPlayListVideo?[index].videoUrl${Constant.baseURL}${controller.getPlayListVideo?[index].videoUrl}");
                        print(
                            "controller.getPlayListVideo?[index].id${Constant.baseURL}${controller.getPlayListVideo?[index].id}");
                        Get.to(NormalVideoDetailsView(
                          videoId: controller.getPlayListVideo![index].videoId!,
                          videoUrl: controller.getPlayListVideo?[index].videoUrl
                                  .toString() ??
                              "",
                          cost: controller
                              .getPlayListVideo?[index].subscriptionCost,
                          isPlayList: true,
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
                                  decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(20),
                                      color: isDarkMode.value
                                          ? AppColor.secondDarkMode
                                          : AppColor.grey_400),
                                  child: PreviewVideoImage(
                                    videoId: controller
                                        .getPlayListVideo![index].videoId!,
                                    videoImage: controller
                                        .getPlayListVideo![index].videoImage!,
                                  ),
                                  // child: ConvertedPathView(
                                  //     imageVideoPath: controller.channelPlayList![index].videos![0].videoImage!),
                                ),
                              ),
                              Positioned(
                                bottom: 10,
                                right: 10,
                                child: Container(
                                  alignment: Alignment.center,
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(7),
                                      color: AppColor.black),
                                  child: Text(
                                    CustomFormatTime.convertSecond(controller
                                            .getPlayListVideo![index]
                                            .videoTime ??
                                        0),
                                    style: GoogleFonts.urbanist(
                                        color: AppColor.white, fontSize: 11),
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
                                  controller
                                      .getPlayListVideo![index].videoName!,
                                  maxLines: 3,
                                  style: GoogleFonts.urbanist(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold),
                                ),
                                SizedBox(
                                    height: SizeConfig.blockSizeVertical * 1),
                                Text(
                                  widget.channelName ?? "",
                                  style: GoogleFonts.urbanist(
                                    fontSize: 12,
                                    color: isDarkMode.value
                                        ? AppColor.white.withOpacity(0.7)
                                        : AppColor.black.withOpacity(0.7),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          GestureDetector(
                            child: Container(
                              color: Colors.transparent,
                              child: const Icon(
                                Icons.delete_outline_outlined,
                                size: 18,
                              ),
                            ),
                            onTap: () async {
                              showRemovePlatListDialog(
                                () async {
                                  await RemoveIntoPlayListApi.callApi(
                                    Database.loginUserId ?? "",
                                    controller.getPlayListVideo?[index]
                                            .channelId ??
                                        "",
                                    controller.getPlayListVideo?[index].id ??
                                        "",
                                    controller
                                            .getPlayListVideo?[index].videoId ??
                                        "",
                                    controller.getPlayListVideo?[index]
                                            .playListName ??
                                        "",
                                    controller.getPlayListVideo?[index]
                                            .playListType ??
                                        0,
                                  );

                                  Get.close(3);
                                },
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            }));
  }
}

void showRemovePlatListDialog(void Function()? remove) {
  Get.dialog(
    Dialog(
      backgroundColor:
          isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(40),
      ),
      child: Container(
        padding: EdgeInsets.only(
          left: SizeConfig.blockSizeHorizontal * 2,
          right: SizeConfig.blockSizeHorizontal * 2,
          top: 5,
          bottom: 10,
        ),
        decoration: BoxDecoration(
          color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min, // 👈 important for dialog size
          children: [
            Container(
              width: 30,
              height: 3,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(60),
                color: isDarkMode.value
                    ? AppColor.white.withAlpha(51)
                    : AppColor.grey_200,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              AppStrings.removePlayList.tr,
              style: GoogleFonts.urbanist(
                fontSize: 22,
                color: isDarkMode.value ? AppColor.white : AppColor.logOutColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            Divider(indent: 30, color: AppColor.grey_200, endIndent: 30),
            const SizedBox(height: 5),
            Align(
              alignment: Alignment.center,
              child: Text(
                AppStrings.removePlayListTxt.tr,
                textAlign: TextAlign.center,
                style: GoogleFonts.urbanist(
                  fontSize: 18,
                  color:
                      isDarkMode.value ? AppColor.white : AppColor.logOutColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () async {
                      Get.back();
                    },
                    child: Container(
                      height: 45,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColor.primaryColor),
                        color: AppColor.white,
                      ),
                      child: Text(
                        AppStrings.cancel.tr,
                        style: GoogleFonts.urbanist(
                          color: AppColor.primaryColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: GestureDetector(
                    onTap: remove,
                    child: Container(
                      height: 45,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        color: AppColor.primaryColor,
                      ),
                      child: Text(
                        AppStrings.remove.tr,
                        style: GoogleFonts.urbanist(
                          color: AppColor.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    ),
  );
}
