import 'package:youpeak/core/platform/app_layout.dart';
import 'dart:async';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/utils/custom_video_picker.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/features/bites/widget/add_sound_bottom_sheet.dart';
import 'package:youpeak/features/bites/controller/create_short_controller.dart';
import 'package:youpeak/features/upload/view/upload_video_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:video_player/video_player.dart';
import 'package:youpeak/core/platform/platform_info.dart';
import 'package:youpeak/core/platform/local_media.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';

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
          width: AppLayout.width,
          child: Stack(
            children: [
              // GetBuilder<CreateShortController>(
              //   id: "onInitializeCamera",
              //   builder: (controller) => controller.cameraController != null && controller.cameraController!.value.isInitialized
              //       ? SizedBox(
              //           height: Get.height,
              //           width: AppLayout.width,
              //           child: CameraPreview(controller.cameraController!),
              //         )
              //       : Container(
              //           height: Get.height,
              //           width: AppLayout.width,
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
                    return Container(height: Get.height, width: AppLayout.width, color: AppColor.black, child: const LoaderUi());
                  }
                },
              ),
              Positioned(
                top: PlatformInfo.isAndroidOrWeb ? 30 : 45,
                left: 20,
                child: SizedBox(
                  width: AppLayout.width / 1.2,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      AppPressable(
                        onTap: () {
                          controller.onCloseEvent();
                          Get.back();
                        },
                        semanticLabel: "Back",
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColor.black.withValues(alpha: 0.35),
                          ),
                          alignment: Alignment.center,
                          child: const AppIcon(
                            AppIcons.arrowBack,
                            size: 20,
                            color: AppColor.white,
                          ),
                        ),
                      ),
                      // Adding music needs FFmpeg to merge the audio, which the
                      // browser build doesn't have.
                      if (PlatformInfo.isWeb) const SizedBox(width: 20) else AppPressable(
                        onTap: () {
                          controller.onGetSoundList();
                          AddSoundBottomSheet.show();
                        },
                        semanticLabel: AppStrings.addSound.tr,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppColor.black.withValues(alpha: 0.35),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColor.white.withValues(alpha: 0.2)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const AppIcon(AppIcons.sound, size: 16, color: AppColor.white),
                              const SizedBox(width: 8),
                              GetBuilder<CreateShortController>(
                                id: "onChangeSound",
                                builder: (controller) => Text(
                                  controller.selectedSound == null ? AppStrings.addSound.tr : controller.mainSoundList![controller.selectedSound!].singerName!,
                                  style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 13, fontWeight: FontWeight.w600),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      GetBuilder<CreateShortController>(
                        id: "onChangeFlashMode",
                        builder: (controller) => PlatformInfo.isWeb ? const SizedBox(width: 44) : AppPressable(
                          onTap: () => controller.onChangeFlashMode(),
                          semanticLabel: "Flash",
                          child: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColor.black.withValues(alpha: 0.35),
                            ),
                            alignment: Alignment.center,
                            child: AppIcon(
                              AppIcons.flash,
                              color: controller.isFlashModeOn ? AppColor.primaryColor : AppColor.white,
                              size: 20,
                            ),
                          ),
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
                  width: AppLayout.width,
                  child: SizedBox(
                    width: AppLayout.width / 1.2,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            AppPressable(
                              onTap: () => controller.onSwitchCamera(),
                              semanticLabel: AppStrings.flip.tr,
                              child: Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: AppColor.black.withValues(alpha: 0.35),
                                ),
                                alignment: Alignment.center,
                                child: const AppIcon(AppIcons.flipCamera, color: AppColor.white, size: 24),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(AppStrings.flip.tr, style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 12, fontWeight: FontWeight.w600)),
                          ],
                        ),
                        GetBuilder<CreateShortController>(
                          id: "onPressRecordingButton",
                          builder: (controller) => AppPressable(
                            onTap: () => controller.onPressRecordingButton(),
                            semanticLabel: controller.isRecordingOn ? "Stop recording" : "Start recording",
                            pressedScale: 0.94,
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              height: 68,
                              width: 68,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: controller.isRecordingOn ? Colors.red : AppColor.primaryColor,
                                border: Border.all(color: AppColor.white, width: 4),
                                boxShadow: [
                                  BoxShadow(
                                    color: (controller.isRecordingOn ? Colors.red : AppColor.primaryColor).withValues(alpha: 0.4),
                                    blurRadius: 12,
                                  ),
                                ],
                              ),
                              child: Center(
                                child: controller.isRecordingOn
                                    ? Container(
                                        width: 22,
                                        height: 22,
                                        decoration: BoxDecoration(
                                          color: AppColor.white,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                      )
                                    : const AppIcon(AppIcons.boldVideo, size: 26, color: AppColor.white),
                              ),
                            ),
                          ),
                        ),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            AppPressable(
                                onTap: () async {
                                  // Throws where there is no torch (laptop webcams) or no camera
                                  // permission; that must not block picking from the gallery.
                                  try {
                                    await controller.cameraController?.setFlashMode(FlashMode.off);
                                  } catch (_) {}
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
                                semanticLabel: AppStrings.upload.tr,
                                child: Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: AppColor.black.withValues(alpha: 0.35),
                                  ),
                                  alignment: Alignment.center,
                                  child: const AppIcon(AppIcons.boldUpload, color: AppColor.white, size: 24),
                                )),
                            const SizedBox(height: 6),
                            Text(
                              AppStrings.upload.tr,
                              style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 12, fontWeight: FontWeight.w600),
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

// File-level check mirrors main_home_view.dart's isSupport() — see the
// comment there for why this no longer gates on VideoPlayerController
// successfully decoding the file.
const _supportedShortsExtensions = {
  'mp4', 'mov', 'm4v', '3gp', '3g2', 'mkv', 'webm', 'avi', 'flv', 'wmv',
};

Future<int?> isSupport(String path) async {
  try {
    // LocalMedia: a device path on the phone, a blob: URL in the browser.
    if (!LocalMedia.exists(path) || await LocalMedia.length(path) <= 0) {
      AppSettings.showLog("isSupport (shorts): missing/empty file => $path");
      return null;
    }
    final ext = LocalMedia.fileName(path).split('.').last.toLowerCase();
    if (!_supportedShortsExtensions.contains(ext)) {
      AppSettings.showLog("isSupport (shorts): unsupported extension .$ext => $path");
      return null;
    }
  } catch (e) {
    AppSettings.showLog("isSupport (shorts) file check failed for $path => $e");
    return null;
  }

  // Best-effort duration probe for the client-side max-duration UX check.
  // If the native decoder can't probe it in time (large file, HEVC, etc.),
  // don't block the upload — fall back to 0 (treated as within any admin
  // duration limit) and let the file go through; the server can still
  // enforce limits after transcoding if needed.
  VideoPlayerController? controller;
  try {
    controller = LocalMedia.videoController(path);
    await controller.initialize().timeout(const Duration(seconds: 8));
    return controller.value.isInitialized ? controller.value.duration.inMilliseconds : 0;
  } catch (e) {
    AppSettings.showLog("isSupport (shorts) duration probe failed, allowing anyway for $path => $e");
    return 0;
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
