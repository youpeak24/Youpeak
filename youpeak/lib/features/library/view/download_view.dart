import 'dart:io';

import 'package:flutter/material.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_format_date_to_day.dart';
import 'package:youpeak/core/utils/custom_format_timer.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/download_history_database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/library/view/preview_normal_video.dart';
import 'package:youpeak/features/video/view/normal_video_details_view.dart';
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/utils/utils.dart';

RxBool isRefreshing = false.obs;

class DownloadView extends StatelessWidget {
  const DownloadView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        centerTitle: AppSettings.isCenterTitle,
        systemOverlayStyle:
            SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarIconBrightness: isDarkMode.value ? Brightness.light : Brightness.dark),
        leading: IconButtonUi(
            callback: () {
              Get.back();
              Utils.showLog("isAvailableProfileData ==> ${AppSettings.isAvailableProfileData.value}");
              if (AppSettings.isAvailableProfileData.value == false) {
                Get.defaultDialog(
                  // barrierDismissible: false,
                  title: "",
                  titlePadding: EdgeInsets.zero,
                  titleStyle: GoogleFonts.urbanist(
                    textStyle: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                    ),
                  ),
                  backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.transparent,
                  // contentPadding: const EdgeInsets.symmetric(horizontal: 10),
                  content: PopScope(
                    canPop: true,
                    child: Container(
                      height: 375,
                      width: Get.width / 1.4,
                      // padding: EdgeInsets.only(
                      //   left: SizeConfig.blockSizeHorizontal * 2,
                      //   right: SizeConfig.blockSizeHorizontal * 2,
                      // ),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        color: isDarkMode.value ? AppColor.transparent : Colors.white,
                      ),
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Container(
                              height: 200,
                              width: 200,
                              clipBehavior: Clip.antiAlias,
                              padding: const EdgeInsets.all(0),
                              decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.white),
                              child: Image.asset(AppVisuals.noInternet, width: 200),
                            ),
                            isDarkMode.value ? const SizedBox(height: 10) : const Offstage(),
                            Text("Lost Connection", style: GoogleFonts.urbanist(fontSize: 25, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 5),
                            Text("No internet connection found\nCheck your connection",
                                textAlign: TextAlign.center, style: GoogleFonts.urbanist(fontSize: 15)),
                            const SizedBox(height: 15),
                            Obx(
                              () => isRefreshing.value
                                  ? const LoaderUi()
                                  : GestureDetector(
                                      onTap: () async {
                                        isRefreshing.value = true;
                                        await onConnectInternet();
                                        isRefreshing.value = false;
                                      },
                                      child: Container(
                                        height: 45,
                                        width: 120,
                                        decoration: BoxDecoration(
                                          color: AppColor.grey_200,
                                          borderRadius: BorderRadius.circular(30),
                                        ),
                                        child: Center(
                                            child: Text("Refresh",
                                                style: GoogleFonts.urbanist(fontSize: 16, color: AppColor.black, fontWeight: FontWeight.bold))),
                                      ),
                                    ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }
            },
            icon: Image.asset(AppIcons.arrowBack, color: isDarkMode.value ? AppColor.white : AppColor.black).paddingOnly(left: 15, right: 20)),
        leadingWidth: 55,
        title: Text(
          AppStrings.download.tr,
          style: GoogleFonts.urbanist(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: PopScope(
        canPop: AppSettings.isAvailableProfileData.value,
        onPopInvoked: (didPop) async {
          if (AppSettings.isAvailableProfileData.value == false) {
            Get.defaultDialog(
              barrierDismissible: false,
              title: "",
              titlePadding: EdgeInsets.zero,
              titleStyle: GoogleFonts.urbanist(
                textStyle: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                ),
              ),
              backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.transparent,
              // contentPadding: const EdgeInsets.symmetric(horizontal: 10),
              content: PopScope(
                canPop: true,
                child: Container(
                  height: 375,
                  width: Get.width / 1.4,
                  // padding: EdgeInsets.only(
                  //   left: SizeConfig.blockSizeHorizontal * 2,
                  //   right: SizeConfig.blockSizeHorizontal * 2,
                  // ),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    color: isDarkMode.value ? AppColor.transparent : Colors.white,
                  ),
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Container(
                          height: 200,
                          width: 200,
                          clipBehavior: Clip.antiAlias,
                          padding: const EdgeInsets.all(0),
                          decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.white),
                          child: Image.asset(AppVisuals.noInternet, width: 200),
                        ),
                        isDarkMode.value ? const SizedBox(height: 10) : const Offstage(),
                        Text("Lost Connection", style: GoogleFonts.urbanist(fontSize: 25, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 5),
                        Text("No internet connection found\nCheck your connection",
                            textAlign: TextAlign.center, style: GoogleFonts.urbanist(fontSize: 15)),
                        const SizedBox(height: 15),
                        Obx(
                          () => isRefreshing.value
                              ? const LoaderUi()
                              : GestureDetector(
                                  onTap: () async {
                                    isRefreshing.value = true;
                                    await onConnectInternet();
                                    isRefreshing.value = false;
                                  },
                                  child: Container(
                                    height: 45,
                                    width: 120,
                                    decoration: BoxDecoration(
                                      color: AppColor.grey_200,
                                      borderRadius: BorderRadius.circular(30),
                                    ),
                                    child: Center(
                                        child: Text("Refresh",
                                            style: GoogleFonts.urbanist(fontSize: 16, color: AppColor.black, fontWeight: FontWeight.bold))),
                                  ),
                                ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }
        },
        child: Obx(
          () => DownloadHistory.mainDownloadHistory.isEmpty
              ? DataNotFoundUi(type: EmptyStateType.downloads, title: AppStrings.downloadNotAvailable.tr)
              : SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: ListView.builder(
                    itemCount: DownloadHistory.mainDownloadHistory.length,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: GestureDetector(
                          onTap: () {
                            Get.to(() => NormalVideoDetailsView(
                              videoId: DownloadHistory.mainDownloadHistory[index]["videoId"]?.toString() ?? "",
                              videoUrl: DownloadHistory.mainDownloadHistory[index]["videoUrl"]?.toString() ?? "",
                            ));
                          },
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
                                    decoration: BoxDecoration(color: AppColor.grey_400, borderRadius: BorderRadius.circular(20)),
                                    child: Image.file(
                                      File(DownloadHistory.mainDownloadHistory[index]["videoImage"]),
                                      fit: BoxFit.cover,
                                      errorBuilder: (context, error, stackTrace) {
                                        return Container(
                                          color: AppColor.black,
                                          alignment: Alignment.center,
                                          child: const Icon(Icons.video_file, color: AppColor.white, size: 30),
                                        );
                                      },
                                    ),
                                  ),
                                  Positioned(
                                    right: 10,
                                    bottom: 10,
                                    child: Container(
                                      alignment: Alignment.center,
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                      decoration: BoxDecoration(borderRadius: BorderRadius.circular(7), color: AppColor.black),
                                      child: Text(
                                        CustomFormatTime.convertSecond(int.parse(DownloadHistory.mainDownloadHistory[index]["videoTime"].toString())),
                                        style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 11),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(width: 15),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                  children: [
                                    Text(
                                      DownloadHistory.mainDownloadHistory[index]["videoTitle"].toString(),
                                      maxLines: 3,
                                      style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold),
                                    ),
                                    Text(
                                      DownloadHistory.mainDownloadHistory[index]["channelName"].toString(),
                                      style: GoogleFonts.urbanist(
                                        fontSize: 12,
                                        color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black.withOpacity(0.7),
                                      ),
                                    ),
                                    Text(
                                      "${DownloadHistory.mainDownloadHistory[index]["views"]} Views • ${CustomFormatDateToDay.convert(DateTime.parse(DownloadHistory.mainDownloadHistory[index]["time"]))}",
                                      style: GoogleFonts.urbanist(
                                          fontSize: 10, color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black.withOpacity(0.7)),
                                    ),
                                  ],
                                ),
                              ),
                              GestureDetector(
                                child: Container(
                                  color: Colors.transparent,
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 10),
                                  child: Obx(() => Icon(
                                    Icons.delete_outline_outlined,
                                    size: 22,
                                    color: isDarkMode.value ? AppColor.white : AppColor.black,
                                  )),
                                ),
                                onTap: () {
                                  showRemoveDownloadDialog(() async {
                                    final videoFile = DownloadHistory.mainDownloadHistory[index]["videoUrl"];
                                    final videoImage = DownloadHistory.mainDownloadHistory[index]["videoImage"];
                                    
                                    if (videoFile != null && await File(videoFile).exists()) {
                                      await File(videoFile).delete();
                                    }
                                    if (videoImage != null && await File(videoImage).exists()) {
                                      await File(videoImage).delete();
                                    }
                                    
                                    DownloadHistory.mainDownloadHistory.removeAt(index);
                                    await DownloadHistory.onSet();
                                    Get.back();
                                  });
                                },
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
        ),
      ),
    );
  }
}

void showRemoveDownloadDialog(void Function()? remove) {
  Get.dialog(
    Dialog(
      backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
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
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 30,
              height: 3,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(60),
                color: isDarkMode.value ? AppColor.white.withAlpha(51) : AppColor.grey_200,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              "Remove Download",
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
                "Are you sure you want to remove this downloaded video?",
                textAlign: TextAlign.center,
                style: GoogleFonts.urbanist(
                  fontSize: 18,
                  color: isDarkMode.value ? AppColor.white : AppColor.logOutColor,
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

// Old Code Download Working

//import 'package:flutter/material.dart';

// import 'package:get/get.dart';
// import 'package:google_fonts/google_fonts.dart';
// import 'package:Live1/custom/custom_method/custom_format_timer.dart';
// import 'package:Live1/custom/custom_ui/loader_ui.dart';
// import 'package:Live1/custom/file_path_to_url.dart';
// import 'package:Live1/main.dart';
// import 'package:Live1/pages/nav_library_page/main_page/nav_library_controller.dart';
// import 'package:Live1/utils/colors/app_color.dart';
// import 'package:Live1/utils/config/size_config.dart';
// import 'package:Live1/utils/icons/app_icons.dart';
//
// import 'package:Live1/widgets/basic_button.dart';
//
// class DownloadPageView extends StatelessWidget {
//   const DownloadPageView({super.key});
//
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         elevation: 0,
//         leading: GestureDetector(
//           child: Icon(Icons.arrow_back,
//               size: 25, color: isDarkMode.value ? AppColors.white : AppColors.black),
//           onTap: () => Get.back(),
//         ),
//         leadingWidth: 50,
//         title: Text(
//           AppStrings.download.tr,
//           style: GoogleFonts.urbanist(
//             fontSize: 18,
//             fontWeight: FontWeight.bold,
//           ),
//         ),
//         actions: [
//           Padding(
//             padding: const EdgeInsets.only(right: 20),
//             child: GestureDetector(
//               onTap: () => buildShowMenu(context),
//               child: Image(
//                 image: const AssetImage(AppIcons.moreCircle),
//                 height: 25,
//                 width: 25,
//                 color: isDarkMode.value ? AppColors.white : AppColors.black,
//               ),
//             ),
//           ),
//         ],
//       ),
//       body: GetBuilder<NavLibraryPageController>(
//         id: "getDownloadVideos",
//         builder: (controller) => controller.downloadCollection == null
//             ? const LoaderUi()
//             : controller.downloadCollection!.isEmpty
//                 ? const Center(child: Text("No Download Available"))
//                 : SingleChildScrollView(
//                     physics: const BouncingScrollPhysics(),
//                     child: ListView.builder(
//                       itemCount: controller.downloadCollection!.length,
//                       shrinkWrap: true,
//                       padding: const EdgeInsets.all(10),
//                       itemBuilder: (context, index) {
//                         return Padding(
//                           padding: const EdgeInsets.only(bottom: 10),
//                           child: GestureDetector(
//                             child: Row(
//                               crossAxisAlignment: CrossAxisAlignment.start,
//                               mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                               children: [
//                                 Stack(
//                                   children: [
//                                     Container(
//                                         clipBehavior: Clip.hardEdge,
//                                         height: SizeConfig.screenHeight / 7,
//                                         width: SizeConfig.screenWidth / 2.2,
//                                         decoration: BoxDecoration(
//                                             color: AppColors.grey_400, borderRadius: BorderRadius.circular(20)),
//                                         child: ConvertedPathView(
//                                             imageVideoPath:
//                                                 controller.downloadCollection![index].videoImage.toString())),
//                                     Positioned(
//                                       right: 10,
//                                       bottom: 10,
//                                       child: Container(
//                                         alignment: Alignment.center,
//                                         padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
//                                         decoration: BoxDecoration(
//                                             borderRadius: BorderRadius.circular(7), color: AppColors.black),
//                                         child: Text(
//                                           CustomFormatTime.convert(
//                                               int.parse(controller.downloadCollection![index].videoTime.toString())),
//                                           style: GoogleFonts.urbanist(color: AppColors.white, fontSize: 11),
//                                         ),
//                                       ),
//                                     ),
//                                   ],
//                                 ),
//                                 Column(
//                                   crossAxisAlignment: CrossAxisAlignment.start,
//                                   children: [
//                                     SizedBox(
//                                       width: SizeConfig.screenWidth / 2.8,
//                                       child: Text(
//                                         controller.downloadCollection![index].videoTitle.toString(),
//                                         maxLines: 3,
//                                         style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold),
//                                       ),
//                                     ),
//                                     SizedBox(height: SizeConfig.blockSizeVertical * 1),
//                                     Text(
//                                       controller.downloadCollection![index].channelName.toString(),
//                                       style:
//                                           GoogleFonts.urbanist(fontSize: 12, color: AppColors.black.withOpacity(0.7)),
//                                     ),
//                                     SizedBox(height: SizeConfig.blockSizeVertical * 1),
//                                     Text(
//                                       "${controller.downloadCollection![index].views.toString()} • ${controller.downloadCollection![index].time.toString()}",
//                                       style:
//                                           GoogleFonts.urbanist(fontSize: 10, color: AppColors.black.withOpacity(0.7)),
//                                     ),
//                                   ],
//                                 ),
//                                 const Offstage(),
//                               ],
//                             ),
//                           ),
//                         );
//                       },
//                     ),
//                   ),
//       ),
//     );
//   }
// }
