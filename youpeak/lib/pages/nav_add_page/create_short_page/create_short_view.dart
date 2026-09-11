import 'dart:async';
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/custom/custom_method/custom_toast.dart';
import 'package:youpeak/custom/custom_method/custom_video_picker.dart';
import 'package:youpeak/custom/custom_ui/loader_ui.dart';
import 'package:youpeak/database/database.dart';
import 'package:youpeak/pages/admin_settings/admin_settings_api.dart';
import 'package:youpeak/pages/nav_add_page/create_short_page/add_sound_bottom_sheet.dart';
import 'package:youpeak/pages/nav_add_page/create_short_page/create_short_controller.dart';
import 'package:youpeak/pages/nav_add_page/upload_video_page/upload_video_view.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/settings/app_settings.dart';
import 'package:youpeak/utils/string/app_string.dart';
import 'package:video_player/video_player.dart';

class CreateShortView extends StatelessWidget {
  CreateShortView({super.key});

  final controller = Get.find<CreateShortController>();

  @override
  Widget build(BuildContext context) {
    Timer(const Duration(milliseconds: 300), () {
      SystemChrome.setSystemUIOverlayStyle(
        const SystemUiOverlayStyle(
          statusBarIconBrightness: Brightness.light,
          statusBarColor: Colors.transparent,
          systemNavigationBarDividerColor: Colors.black,
          systemNavigationBarColor: Colors.black,
        ),
      );
    });
    controller.init();
    return PopScope(
      onPopInvoked: (didPop) => controller.onCloseEvent(),
      child: Scaffold(
        backgroundColor: AppColor.black,
        body: SizedBox(
          height: Get.height,
          width: Get.width,
          child: Stack(
            children: [
              // GetBuilder<CreateShortController>(
              //   id: "onInitializeCamera",
              //   builder: (controller) => controller.cameraController != null && controller.cameraController!.value.isInitialized
              //       ? SizedBox(
              //           height: Get.height,
              //           width: Get.width,
              //           child: CameraPreview(controller.cameraController!),
              //         )
              //       : Container(
              //           height: Get.height,
              //           width: Get.width,
              //           color: AppColors.black,
              //           child: const LoaderUi(),
              //         ),
              // ),

              GetBuilder<CreateShortController>(
                id: "onInitializeCamera",
                builder: (controller) {
                  if (controller.cameraController != null && (controller.cameraController?.value.isInitialized ?? false)) {
                    final mediaSize = MediaQuery.of(context).size;
                    final scale = 1 / (controller.cameraController!.value.aspectRatio * mediaSize.aspectRatio);
                    return ClipRect(
                      clipper: _MediaSizeClipper(mediaSize),
                      child: Transform.scale(
                        scale: scale,
                        alignment: Alignment.topCenter,
                        child: CameraPreview(
                          controller.cameraController!,
                        ),
                      ),
                    );
                  } else {
                    return Container(height: Get.height, width: Get.width, color: AppColor.black, child: const LoaderUi());
                  }
                },
              ),
              Positioned(
                top: Platform.isAndroid ? 30 : 45,
                left: 20,
                child: SizedBox(
                  width: Get.width / 1.2,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Image(
                          image: AssetImage(AppIcons.arrowBack),
                          height: 18,
                          width: 18,
                          color: AppColor.white,
                        ),
                        onPressed: () {
                          controller.onCloseEvent();
                          Get.back();
                        },
                      ),
                      GestureDetector(
                        onTap: () {
                          controller.onGetSoundList();

                          AddSoundBottomSheet.show();
                        },
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColor.black.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            children: [
                              const ImageIcon(AssetImage(AppIcons.sound), size: 15, color: AppColor.white),
                              const SizedBox(width: 10),
                              GetBuilder<CreateShortController>(
                                id: "onChangeSound",
                                builder: (controller) => Text(
                                  controller.selectedSound == null ? AppStrings.addSound.tr : controller.mainSoundList![controller.selectedSound!].singerName!,
                                  style: GoogleFonts.urbanist(color: AppColor.white),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      GetBuilder<CreateShortController>(
                        id: "onChangeFlashMode",
                        builder: (controller) => GestureDetector(
                          onTap: () => controller.onChangeFlashMode(),
                          child: ImageIcon(const AssetImage(AppIcons.flash), color: controller.isFlashModeOn ? AppColor.primaryColor : AppColor.white, size: 20),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                top: 100,
                child: GetBuilder<CreateShortController>(
                  id: "onChangeTimer",
                  builder: (controller) => controller.recordingDuration != controller.minDuration
                      ? Container(
                          height: 3,
                          width: 300,
                          // width: AdminSettingsApi.adminSettingsModel?.setting?.durationOfShorts != null ? (AdminSettingsApi.adminSettingsModel!.setting!.durationOfShorts! / 1000) : 300,
                          alignment: Alignment.centerLeft,
                          decoration: BoxDecoration(
                            color: AppColor.grey_200,
                            borderRadius: BorderRadius.circular(5),
                          ),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 100),
                            curve: Curves.linear,
                            height: 3,
                            width: controller.recordingDuration * 10,
                            // (300 / (AdminSettingsApi.adminSettingsModel?.setting?.durationOfShorts != null ? (AdminSettingsApi.adminSettingsModel!.setting!.durationOfShorts! / 1000) : 30)),
                            decoration: BoxDecoration(
                              color: AppColor.primaryColor,
                              borderRadius: BorderRadius.circular(5),
                            ),
                          ),
                        )
                      : const Offstage(),
                ),
              ),
              Positioned(
                top: 120,
                child: GetBuilder<CreateShortController>(
                  id: "onChangeTimer",
                  builder: (controller) => Text(
                    controller.recordingDuration == controller.minDuration ? "" : "00 : ${controller.recordingDuration}",
                    style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ),
              ),
              Positioned(
                bottom: 50,
                child: SizedBox(
                  width: Get.width,
                  child: SizedBox(
                    width: Get.width / 1.2,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        Column(
                          children: [
                            GestureDetector(
                              onTap: () => controller.onSwitchCamera(),
                              child: const ImageIcon(AssetImage(AppIcons.flipCamera), color: AppColor.white, size: 25),
                            ),
                            const SizedBox(height: 8),
                            Text(AppStrings.flip.tr, style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 12)),
                          ],
                        ),
                        GetBuilder<CreateShortController>(
                          id: "onPressRecordingButton",
                          builder: (controller) => GestureDetector(
                            onTap: () => controller.onPressRecordingButton(),
                            child: Container(
                              height: 55,
                              width: 55,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColor.primaryColor,
                                border: Border.all(color: AppColor.white, width: 3),
                              ),
                              child: controller.isRecordingOn
                                  ? const Padding(
                                      padding: EdgeInsets.only(top: 2),
                                      child: Icon(Icons.stop, color: AppColor.white, size: 33),
                                    )
                                  : Padding(
                                      padding: const EdgeInsets.all(12),
                                      child: Image.asset(AppIcons.boldVideo, color: AppColor.white),
                                    ),
                            ),
                          ),
                        ),
                        Column(
                          children: [
                            GestureDetector(
                                onTap: () async {
                                  await controller.cameraController!.setFlashMode(FlashMode.off);
                                  controller.isFlashModeOn = false;
                                  Timer(const Duration(milliseconds: 200), () => controller.cameraController?.dispose());

                                  Get.back();

                                  final pickedVideo = await CustomVideoPicker.pickVideo();

                                  if (pickedVideo != null) {
                                    final response = await isSupport(pickedVideo);

                                    AppSettings.showLog("Picked Video Url => $pickedVideo");
                                    if (response != null) {
                                      final adminDuration = AdminSettingsApi.adminSettingsModel?.setting?.durationOfShorts;
                                      final int durationLimitMs;
                                      if (adminDuration == null || adminDuration == 0) {
                                        durationLimitMs = 30000; // Default to 30 seconds
                                      } else if (adminDuration <= 300) {
                                        durationLimitMs = (adminDuration * 1000).toInt(); // Convert from seconds to milliseconds
                                      } else {
                                        durationLimitMs = adminDuration.toInt(); // Already in milliseconds
                                      }

                                      AppSettings.showLog("Admin Limit Milli Seconds=> $durationLimitMs");
                                      AppSettings.showLog("Shorts Time => ${response / 1000}");
                                      if (response <= durationLimitMs) {
                                        Get.to(
                                          UploadVideoView(
                                            videoPath: pickedVideo,
                                            loginUserId: Database.loginUserId ?? "",
                                            loginUserChannelId: Database.channelId ?? "",
                                            videoType: 2,
                                          ),
                                        );
                                      } else {
                                        CustomToast.show("${AppStrings.maximumShortsDurationIs.tr} ${durationLimitMs ~/ 1000}s");
                                      }
                                    } else {
                                      CustomToast.show(AppStrings.videoNotSupport.tr);
                                    }
                                  }
                                },
                                child: const ImageIcon(AssetImage(AppIcons.boldUpload), color: AppColor.white, size: 25)),
                            const SizedBox(height: 8),
                            Text(
                              AppStrings.upload.tr,
                              style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 12),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Future<int?> isSupport(String path) async {
  VideoPlayerController? controller;
  try {
    controller = VideoPlayerController.file(File(path));
    await controller.initialize();

    return controller.value.isInitialized ? controller.value.duration.inMilliseconds : null;
  } catch (e) {
    AppSettings.showLog("isSupport (shorts) failed for $path => $e");
    return null;
  } finally {
    controller?.dispose();
  }
}

class _MediaSizeClipper extends CustomClipper<Rect> {
  final Size mediaSize;
  const _MediaSizeClipper(this.mediaSize);
  @override
  Rect getClip(Size size) {
    return Rect.fromLTWH(0, 0, mediaSize.width, mediaSize.height);
  }

  @override
  bool shouldReclip(CustomClipper<Rect> oldClipper) {
    return true;
  }
}
