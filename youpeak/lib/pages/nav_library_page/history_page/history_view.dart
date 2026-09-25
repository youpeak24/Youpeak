import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/custom/custom_method/custom_format_timer.dart';
import 'package:youpeak/custom/custom_ui/data_not_found_ui.dart';
import 'package:youpeak/database/database.dart';
import 'package:youpeak/database/watch_history_database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/pages/video_details_page/normal_video_details_view.dart';
import 'package:youpeak/pages/video_details_page/shorts_video_details_view.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/config/size_config.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/services/preview_image.dart';
import 'package:youpeak/utils/settings/app_settings.dart';
import 'package:youpeak/utils/string/app_string.dart';

class HistoryPageView extends StatelessWidget {
  const HistoryPageView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      appBar: AppBar(
        systemOverlayStyle: const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarBrightness: Brightness.dark),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: GestureDetector(
            child: Image.asset(AppIcons.arrowBack, color: isDarkMode.value ? AppColor.white : AppColor.black).paddingOnly(left: 15),
            onTap: () => Get.back()),
        leadingWidth: 33,
        centerTitle: AppSettings.isCenterTitle,
        title: Text(AppStrings.history.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 20),
            child: GestureDetector(
              onTap: () => showMenu(
                context: context,
                position: const RelativeRect.fromLTRB(100, 40, 0, 0),
                items: [
                  PopupMenuItem(
                    value: 1,
                    child: Obx(() => Text(AppSettings.isCreateHistory.value ? AppStrings.pauseWatchHistory.tr : AppStrings.resumeWatchHistory.tr)),
                    onTap: () {
                      AppSettings.isCreateHistory.value = !AppSettings.isCreateHistory.value;
                      Database.onSetCreateHistory(AppSettings.isCreateHistory.value);
                    },
                  ),
                  PopupMenuItem(
                    value: 2,
                    child: Text(AppStrings.clearAllWatchHistory.tr),
                    onTap: () {
                      WatchHistory.mainWatchHistory.clear();
                      WatchHistory.onSet();
                    },
                  ),
                  // PopupMenuItem(
                  //   value: 3,
                  //   child: const Text('Manage all history'),
                  //   onTap: () {},
                  // ),
                  // PopupMenuItem(
                  //   value: 3,
                  //   child: const Text('Help & feedback'),
                  //   onTap: () => Get.to(const HelpCenterView()),
                  // ),
                ],
              ),
              child: Obx(
                () => Image.asset(
                  AppIcons.moreCircle,
                  height: 25,
                  width: 25,
                  color: isDarkMode.value ? AppColor.white : AppColor.black,
                ),
              ),
            ),
          ),
        ],
      ),
      body: Obx(
        () => WatchHistory.mainWatchHistory.isEmpty
            ? const DataNotFoundUi(type: EmptyStateType.history)
            : SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: ListView.builder(
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: WatchHistory.mainWatchHistory.length,
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(horizontal: 15),
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: GestureDetector(
                        onTap: () {
                          if (WatchHistory.mainWatchHistory[index]["videoType"] == 1) {
                            Get.to(
                              NormalVideoDetailsView(
                                videoId: WatchHistory.mainWatchHistory[index]["videoId"],
                                videoUrl: WatchHistory.mainWatchHistory[index]["videoUrl"],
                                cost: WatchHistory.mainWatchHistory[index]["subscriptionCost"],
                              ),
                            );
                          } else {
                            Get.to(
                              ShortsVideoDetailsView(
                                videoId: WatchHistory.mainWatchHistory[index]["videoId"],
                                videoUrl: WatchHistory.mainWatchHistory[index]["videoUrl"],
                              ),
                            );
                          }
                        },
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: [
                            Stack(
                              children: [
                                Container(
                                  margin: EdgeInsets.zero,
                                  clipBehavior: Clip.hardEdge,
                                  height: SizeConfig.smallVideoImageHeight,
                                  width: SizeConfig.smallVideoImageWidth,
                                  decoration: BoxDecoration(
                                    color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_400,
                                    borderRadius: BorderRadius.circular(19),
                                  ),
                                  child: PreviewVideoImage(
                                    videoId: WatchHistory.mainWatchHistory[index]["videoId"],
                                    videoImage: WatchHistory.mainWatchHistory[index]["videoImage"],
                                  ),
                                  // child: ConvertedPathView(
                                  //     imageVideoPath: WatchHistory.mainWatchHistory[index]["videoImage"].toString()),
                                ),
                                Positioned(
                                  bottom: 10,
                                  right: 10,
                                  child: Container(
                                    alignment: Alignment.center,
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(7),
                                      color: AppColor.black,
                                    ),
                                    child: Text(
                                      CustomFormatTime.convertSecond(int.parse(WatchHistory.mainWatchHistory[index]["videoTime"].toString())),
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
                                    WatchHistory.mainWatchHistory[index]["videoTitle"].toString(),
                                    maxLines: 3,
                                    style: GoogleFonts.urbanist(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  SizedBox(height: SizeConfig.blockSizeVertical * 1),
                                  Text(
                                    "${WatchHistory.mainWatchHistory[index]["channelName"]} • ${WatchHistory.mainWatchHistory[index]["views"]} Views",
                                    style: GoogleFonts.urbanist(
                                      fontSize: 12,
                                      color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black.withOpacity(0.7),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(width: Get.width * 0.01),
                            // GestureDetector(
                            //   child: const Icon(Icons.more_vert),
                            //   onTap: () {},
                            // ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
      ),
    );
  }
}
