import 'package:youpeak/shared/dialogs/app_sheet.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:get/get.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/core/utils/custom_download.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/premium_plan_dialog.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/storage/database/download_history_database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/notification/local_notification_services.dart';
import 'package:youpeak/features/report/view/custom_report_view.dart';
import 'package:youpeak/features/video/api/share_count_api.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/playlist/widget/add_into_playlist.dart';
import 'package:youpeak/features/library/view/download_view.dart';
import 'package:youpeak/features/library/api/create_watch_later_api.dart';
import 'package:youpeak/features/video/model/more_information_model.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/services/convert_to_network.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/shared/widgets/common_share.dart';
import 'package:path_provider/path_provider.dart';
import 'package:video_thumbnail/video_thumbnail.dart';

class MoreInfoBottomSheet {
  static void show(BuildContext context, MoreInformationModel element, bool isShorts) async {
    AppSettings.showLog("Selected Video => ${element.title}");
    AppSheet.show(
      backgroundColor: isDarkMode.value ? AppColor.darkElevated : AppColor.white,
      isScrollControlled: true,
      SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              const SizedBox(height: 10),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(60),
                  color: isDarkMode.value ? AppColor.white.withValues(alpha: 0.24) : AppColor.grey_300,
                ),
              ),
              Text(AppStrings.moreOption.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: -0.2)),
              const SizedBox(height: 10),
              BottomShitButton(
                widget: ImageIcon(AssetImage(element.isSave ? AppIcons.saveDone2 : AppIcons.timeCircle), size: 23),
                name: element.isSave ? AppStrings.saved.tr : AppStrings.saveToWatchLater.tr,
                onTap: () {
                  if (Database.loginUserId == null || Database.loginUserId!.isEmpty) {
                    CustomToast.show("Please login first");
                    return;
                  }
                  if (element.isSave == false) {
                    CustomToast.show(AppStrings.addToWatchLater.tr);
                    CreateWatchLater.callApi(Database.loginUserId!, element.videoId);
                    Get.back();
                  } else {
                    AppSettings.showLog("Video Already Saved");
                  }
                },
              ),
              isShorts
                  ? const Offstage()
                  : Column(
                      children: [
                        BottomShitButton(
                          widget: ImageIcon(
                            const AssetImage(AppIcons.libraryLogo),
                            size: 23,
                            color: isShorts || Database.channelId == null ? AppColor.grey : null,
                          ),
                          name: AppStrings.saveToPlaylist.tr,
                          color: isShorts || Database.channelId == null ? AppColor.grey : null,
                          onTap: isShorts || Database.channelId == null
                              ? () {}
                              : () {
                                  Get.back();
                                  AddIntoPlayList.onAddToPlayList(Database.channelId!, element.videoId);
                                },
                        ),
                                  BottomShitButton(
                          widget: ImageIcon(
                            const AssetImage(AppIcons.download),
                            size: 23,
                            color: isShorts || DownloadHistory.mainDownloadHistory.any((map) => map['videoId'] == element.videoId) ? AppColor.grey : null,
                          ),
                          name: AppStrings.download.tr,
                          color: isShorts || DownloadHistory.mainDownloadHistory.any((map) => map['videoId'] == element.videoId) ? AppColor.grey : null,
                          onTap: isShorts || DownloadHistory.mainDownloadHistory.any((map) => map['videoId'] == element.videoId)
                              ? () {}
                              : () async {
                                  if ((GetProfileApi.profileModel?.user?.isPremiumPlan ?? false)) {
                                    Get.back(); // Close Bottom Sheet

                                    CustomToast.show("Downloading....");
                                    AppSettings.isDownloading.value = true;
                                    // final downloadPath = await CustomDownload.download(Database.onGetVideoUrl(element.videoId) ?? await ConvertToNetwork.normalVideo(element.videoUrl), element.videoId);
                                    final downloadPath = await CustomDownload.download(
                                        Database.onGetVideoUrl(element.videoId) ?? await ConvertToNetwork.convert(element.videoUrl), element.videoId);

                                    if (downloadPath != null) {
                                      final downloadThumbnail = await VideoThumbnail.thumbnailFile(
                                        video: downloadPath,
                                        thumbnailPath: (await getTemporaryDirectory()).path,
                                        imageFormat: ImageFormat.JPEG,
                                        maxHeight: 400,
                                        quality: 100,
                                      );
                                      if (downloadThumbnail != null) {
                                        DateTime now = DateTime.now();
                                        String formattedDate = now.toString();

                                        DownloadHistory.mainDownloadHistory.insert(
                                          0,
                                          {
                                            "videoId": element.videoId,
                                            "videoTitle": element.title,
                                            "videoType": element.videoType,
                                            "videoTime": element.videoTime,
                                            "videoUrl": downloadPath,
                                            "videoImage": downloadThumbnail,
                                            "views": element.views,
                                            "channelName": element.channelName,
                                            "time": formattedDate
                                          },
                                        );
                                        DownloadHistory.onSet();
                                      }
                                      LocalNotificationServices.onSendNotification(
                                        "Download Complete",
                                        element.title,
                                        () {
                                          AppSettings.showLog("Go To Download Routes");
                                          if (DownloadHistory.mainDownloadHistory.isEmpty) {
                                            DownloadHistory.onGet();
                                          }
                                          Get.to(() => const DownloadView());
                                        },
                                      );
                                      AppSettings.isDownloading.value = false;
                                      CustomToast.show("Video download complete");
                                    } else {
                                      AppSettings.isDownloading.value = false;
                                      CustomToast.show("Video download failed !!");
                                    }
                                  } else {
                                    PremiumPlanDialog().show(context);
                                  }
                                },
                        ),
                                ],
                    ),
              BottomShitButton(
                widget: const ImageIcon(AssetImage(AppIcons.send), size: 23),
                name: AppStrings.share.tr,
                onTap: () async {
                  Get.back();
                  isShorts
                      ? await CommonShare.onShare(
                          url: element.videoUrl,
                          channelId: element.channelId,
                          id: element.videoId,
                          image: element.videoImage,
                          title: element.title,
                          pageRoutes: "ShortsVideo",
                        )
                      : await CommonShare.onShare(
                          url: element.videoUrl,
                          channelId: element.channelId,
                          id: element.videoId,
                          image: element.videoImage,
                          title: element.title,
                          pageRoutes: "NormalVideo",
                        );
                  await ShareCountApiClass.callApi(Database.loginUserId ?? "", element.videoId);
                },
              ),
              BottomShitButton(
                widget: const ImageIcon(AssetImage(AppIcons.closeSquare), size: 23),
                name: "${AppStrings.report.tr}-${AppStrings.block.tr}",
                onTap: () {
                  Get.back();
                  CustomReportView.show(element.videoId);
                },
              ),
              const SizedBox(height: 14),
            ],
          ),
        ),
      ),
      shape: const RoundedRectangleBorder(borderRadius: AppRadius.sheetBorder),
    );
  }
}
