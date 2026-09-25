import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_format_timer.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/shared/shimmer/shorts_list_shimmer_ui.dart';
import 'package:youpeak/shared/shimmer/video_list_shimmer_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/edit_video/view/edit_video_view.dart';
import 'package:youpeak/features/library/controller/nav_library_controller.dart';
import 'package:youpeak/features/library/api/delete_video_api.dart';
import 'package:youpeak/features/library/widget/delete_video_bottom_sheet.dart';
import 'package:youpeak/features/library/widget/more_option_bottom_sheet.dart';
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart';
import 'package:youpeak/features/settings/view/settings_view.dart';
import 'package:youpeak/features/video/view/normal_video_details_view.dart';
import 'package:youpeak/features/video/view/shorts_video_details_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';
import 'package:youpeak/core/utils/utils.dart';

class YourVideoPageView extends GetView<NavLibraryPageController> {
  const YourVideoPageView({super.key});

  @override
  Widget build(BuildContext context) {
    List videoTypes = ['video'.tr, 'shorts'.tr];

    controller.selectedVideoType = 0;

    return Scaffold(
      bottomNavigationBar: Obx(
        () => Visibility(
          visible: controller.isPaginationLoaded.value,
          child: LinearProgressIndicator(color: AppColor.primaryColor, backgroundColor: AppColor.grey_300),
        ),
      ),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        systemOverlayStyle:
            SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarIconBrightness: isDarkMode.value ? Brightness.light : Brightness.dark),
        leading: IconButtonUi(
            callback: () => Get.back(),
            icon: Image.asset(AppIcons.arrowBack, color: isDarkMode.value ? AppColor.white : AppColor.black).paddingOnly(left: 15, right: 20)),
        leadingWidth: 55,
        centerTitle: AppSettings.isCenterTitle,
        title: Text(AppStrings.yourVideos.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: IconButtonUi(
              callback: () => Get.to(const SettingsView()),
              icon: Obx(
                () => Image.asset(
                  AppIcons.setting,
                  height: 25,
                  width: 25,
                  color: isDarkMode.value ? AppColor.white : AppColor.black,
                ),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: SizedBox(
              height: 40,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.only(left: 15, bottom: 8),
                itemCount: videoTypes.length,
                itemBuilder: (context, index) {
                  return GetBuilder<NavLibraryPageController>(
                    id: "onChangeVideoType",
                    builder: (controller) => GestureDetector(
                      onTap: () => controller.onChangeVideoType(index),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 2),
                        margin: const EdgeInsets.only(right: 5),
                        decoration: BoxDecoration(
                          color: controller.selectedVideoType != index ? Colors.transparent : AppColor.primaryColor,
                          border: Border.all(color: AppColor.primaryColor),
                          borderRadius: BorderRadius.circular(28),
                        ),
                        child: Center(
                          child: Text(
                            videoTypes[index],
                            textAlign: TextAlign.center,
                            style: GoogleFonts.urbanist(
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                              color: controller.selectedVideoType == index ? AppColor.white : AppColor.primaryColor,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          GetBuilder<NavLibraryPageController>(
            id: "onChangeVideoType",
            builder: (controller) => controller.selectedVideoType == 0 ? const ChannelNormalVideo() : const ChannelShortsVideo(),
          ),
        ],
      ),
    );
  }
}

class ChannelNormalVideo extends StatelessWidget {
  const ChannelNormalVideo({super.key});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GetBuilder<NavLibraryPageController>(
        id: "updateChannelNormalVideo",
        builder: (controller) => controller.mainChannelVideos[0] == null
            ? const VideoListShimmerUi()
            : controller.mainChannelVideos[0]!.isEmpty
                ? DataNotFoundUi(type: EmptyStateType.videos, title: AppStrings.videosNotAvailable)
                : SingleChildScrollView(
                    controller: controller.channelNormalVideo,
                    physics: const BouncingScrollPhysics(),
                    child: ListView.builder(
                      itemCount: controller.mainChannelVideos[0]?.length,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 15),
                      itemBuilder: (context, index) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.start,
                            children: [
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => Get.to(
                                    NormalVideoDetailsView(
                                      videoId: controller.mainChannelVideos[0]![index].id!,
                                      videoUrl: controller.mainChannelVideos[0]![index].videoUrl!,
                                      cost: controller.mainChannelVideos[0]![index].subscriptionCost!,
                                    ),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.start,
                                    children: [
                                      Stack(
                                        children: [
                                          Container(
                                            clipBehavior: Clip.hardEdge,
                                            height: SizeConfig.smallVideoImageHeight,
                                            width: SizeConfig.smallVideoImageWidth,
                                            decoration: BoxDecoration(
                                              color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_400,
                                              borderRadius: BorderRadius.circular(20),
                                            ),
                                            child: PreviewVideoImage(
                                              videoId: controller.mainChannelVideos[0]![index].id!,
                                              videoImage: controller.mainChannelVideos[0]![index].videoImage!,
                                            ),
                                          ),
                                          Positioned(
                                            bottom: 10,
                                            right: 10,
                                            child: Container(
                                              alignment: Alignment.center,
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                              decoration: BoxDecoration(borderRadius: BorderRadius.circular(7), color: AppColor.black),
                                              child: Text(
                                                CustomFormatTime.convertSecond(
                                                    int.parse(controller.mainChannelVideos[0]![index].videoTime.toString())),
                                                style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 11),
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
                                              controller.mainChannelVideos[0]![index].title.toString(),
                                              maxLines: 3,
                                              style: GoogleFonts.urbanist(
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            SizedBox(height: Get.height * 0.005),
                                            Text(
                                              "${controller.mainChannelVideos[0]![index].views.toString()} • ${controller.mainChannelVideos[0]![index].time.toString()}",
                                              style: GoogleFonts.urbanist(
                                                fontSize: 10,
                                                color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black.withOpacity(0.7),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      SizedBox(width: Get.width * 0.01),
                                    ],
                                  ),
                                ),
                              ),
                              GestureDetector(
                                onTap: () {
                                  MoreOptionBottomSheet.show(
                                    context: context,
                                    editCallBack: () {
                                      Get.back();
                                      Get.to(
                                        EditVideoView(
                                          videoId: controller.mainChannelVideos[0]![index].id ?? "",
                                          videoType: controller.mainChannelVideos[0]![index].videoType ?? 0,
                                        ),
                                      );
                                    },
                                    deleteCallback: () {
                                      Get.back();
                                      DeleteVideoBottomSheet.onShow(
                                        callBack: () async {
                                          Utils.showLog("Delete Video => ${controller.mainChannelVideos[0]![index].title}");
                                          Utils.showLog("Delete Video => ${controller.mainChannelVideos[0]![index].id}");
                                          Get.back();

                                          Get.dialog(const LoaderUi(), barrierDismissible: false);
                                          final bool status = await DeleteVideoApi.callApi(videoId: controller.mainChannelVideos[0]![index].id ?? "");
                                          if (status) {
                                            CustomToast.show(AppStrings.deleteVideoSuccess.tr);
                                            Get.close(2);
                                          } else {
                                            CustomToast.show(AppStrings.someThingWentWrong.tr);
                                            Get.back();
                                          }
                                        },
                                      );
                                    },
                                  );
                                },
                                child: Container(
                                  height: 30,
                                  width: 30,
                                  decoration: const BoxDecoration(
                                    color: AppColor.transparent,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.more_vert, size: 25),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
      ),
    );
  }
}

class ChannelShortsVideo extends StatelessWidget {
  const ChannelShortsVideo({super.key});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GetBuilder<NavLibraryPageController>(
        id: "updateChannelShortsVideo",
        builder: (controller) => controller.mainChannelVideos[1] == null
            ? const ShortsListShimmerUi()
            : controller.mainChannelVideos[1]!.isEmpty
                ? DataNotFoundUi(type: EmptyStateType.videos, title: AppStrings.shortsNotAvailable)
                : SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    controller: controller.channelShortVideo,
                    child: GridView.builder(
                      itemCount: controller.mainChannelVideos[1]?.length,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      padding: const EdgeInsets.only(left: 15, right: 15, bottom: 10),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2, mainAxisSpacing: 10, crossAxisSpacing: 10, mainAxisExtent: 250),
                      itemBuilder: (context, index) => GestureDetector(
                        onTap: () => Get.to(
                          () => ShortsVideoDetailsView(
                            videoId: controller.mainChannelVideos[1]![index].id!,
                            videoUrl: controller.mainChannelVideos[1]![index].videoUrl!,
                          ),
                        ),
                        child: Container(
                          height: 300,
                          width: 165,
                          clipBehavior: Clip.antiAlias,
                          decoration: BoxDecoration(
                              color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_300, borderRadius: BorderRadius.circular(20)),
                          child: Stack(
                            children: [
                              PreviewVideoImage(
                                videoId: controller.mainChannelVideos[1]![index].id!,
                                videoImage: controller.mainChannelVideos[1]![index].videoImage!,
                              ),
                              // ConvertedPathView(
                              //   imageVideoPath: controller.mainChannelVideos[1]![index].videoImage.toString(),
                              // ),
                              Positioned(
                                bottom: 0,
                                left: 10,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    SizedBox(
                                      width: 145,
                                      child: Text(
                                        controller.mainChannelVideos[1]![index].title.toString(),
                                        maxLines: 3,
                                        style: shortsStyle,
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    Text(
                                      "${controller.mainChannelVideos[1]![index].views.toString()} Views",
                                      style: shortsStyle,
                                    ),
                                    const SizedBox(height: 10),
                                  ],
                                ),
                              ),
                              Positioned(
                                right: 10,
                                top: 10,
                                child: GestureDetector(
                                  onTap: () {
                                    MoreOptionBottomSheet.show(
                                      context: context,
                                      editCallBack: () {
                                        Get.back();
                                        Get.to(
                                          EditVideoView(
                                            videoId: controller.mainChannelVideos[1]![index].id ?? "",
                                            videoType: controller.mainChannelVideos[1]![index].videoType ?? 0,
                                          ),
                                        );
                                      },
                                      deleteCallback: () {
                                        Get.back();
                                        DeleteVideoBottomSheet.onShow(
                                          callBack: () async {
                                            Utils.showLog("Delete Video => ${controller.mainChannelVideos[1]![index].title}");
                                            Utils.showLog("Delete Video => ${controller.mainChannelVideos[1]![index].id}");
                                            Get.back();

                                            Get.dialog(const LoaderUi(), barrierDismissible: false);
                                            final bool status =
                                                await DeleteVideoApi.callApi(videoId: controller.mainChannelVideos[1]![index].id ?? "");
                                            if (status) {
                                              CustomToast.show(AppStrings.deleteVideoSuccess.tr);
                                              Get.close(2);
                                            } else {
                                              CustomToast.show(AppStrings.someThingWentWrong.tr);
                                              Get.back();
                                            }
                                          },
                                        );
                                      },
                                    );
                                  },
                                  child: Container(
                                    height: 30,
                                    width: 30,
                                    decoration: const BoxDecoration(
                                      color: AppColor.transparent,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.more_vert, color: AppColor.white, size: 25),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
      ),
    );
  }
}

//
// actions: [
// GestureDetector(
// onTap: () => Get.to(() => const SearchScreen()),
// child: Image(
// image: const AssetImage(AppIcons.search),
// height: 20,
// width: 20,
// color: isDarkMode.value ? AppColors.white : AppColors.black,
// ),
// ),
// const SizedBox(width: 20),
// GestureDetector(
// onTap: () {},
// child: Image(
// image: const AssetImage(AppIcons.moreCircle),
// height: 25,
// width: 25,
// color: isDarkMode.value ? AppColors.white : AppColors.black,
// ),
// ),
//
// ],
// ****

// FilterChip(
//   label: const Text("Sort by"),
//   showCheckmark: false,
//   selected: isSelected,
//   selectedColor: AppColors.primaryColor,
//   backgroundColor: isDarkMode.value
//       ? AppColors.secondDarkMode
//       : AppColors.white,
//   labelStyle: GoogleFonts.urbanist(
//     fontSize: 13,
//     color: (isSelected == true) ? AppColors.white : AppColors.primaryColor,
//     fontWeight: FontWeight.w800,
//   ),
//   side: const BorderSide(color: AppColors.primaryColor),
//   onSelected: (bool value) {
//     setState(() {
//       isSelected = value;
//     });
//   },
//   avatar: ImageIcon(
//     const AssetImage(AppIcons.filter),
//     size: 20,
//     color: (isSelected == true) ? AppColors.white : AppColors.primaryColor,
//   ),
// ),

// .............
//   Wrap(
//   children: [
//     FilterChip(
//       label: Text(controller. videoTypes[index]),
//       onSelected: (bool value) {
//
//           yourVideoFilterButton[index].isSelected = value;
//
//       },
//       showCheckmark: false,
//       side: const BorderSide(color: AppColors.primaryColor),
//       selected: yourVideoFilterButton[i].isSelected,
//       selectedColor: AppColors.primaryColor,
//       backgroundColor: isDarkMode.value
//           ? AppColors.secondDarkMode
//           : AppColors.white,
//       labelStyle: GoogleFonts.urbanist(
//         fontSize: 13,
//         color: (yourVideoFilterButton[i].isSelected == true)
//             ? AppColors.white
//             : AppColors.primaryColor,
//         fontWeight: FontWeight.w800,
//       ),
//     ),
//     SizedBox(width: SizeConfig.blockSizeHorizontal * 3),
//   ],
// ),
