import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_format_timer.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/download_history_database.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:video_player/video_player.dart';
import 'package:youpeak/core/platform/local_media.dart';

class PreviewNormalVideo extends StatefulWidget {
  const PreviewNormalVideo({super.key, required this.index});

  final int index;

  @override
  State<PreviewNormalVideo> createState() => _PreviewNormalVideoState();
}

class _PreviewNormalVideoState extends State<PreviewNormalVideo> {
  late VideoPlayerController videoPlayerController;
  ChewieController? chewieController;
  RxInt videoPosition = 0.obs;
  bool isFullScreen = false;

  Future<void> initializeVideoPlayer(String videoUrl) async {
    200.milliseconds.delay();

    videoPlayerController = LocalMedia.videoController(videoUrl);
    try {
      await videoPlayerController.initialize();

      await videoPlayerController.play();

      chewieController = ChewieController(
        videoPlayerController: videoPlayerController,
        aspectRatio: Get.width / (Get.height / 3),
        autoPlay: false,
        looping: true,
        allowedScreenSleep: false,
        allowMuting: false,
        showControlsOnInitialize: false,
        showControls: false,
      );
      if (videoPlayerController.value.isInitialized) {
        setState(() {});
      }

      videoPlayerController.addListener(() async {
        if (videoPlayerController.value.isInitialized) {
          videoPosition.value = videoPlayerController.value.position.inMilliseconds;

          // if (AppSettings.isAutoPlayVideo.value &&
          //     videoPlayerController.value.position >= videoPlayerController.value.duration) {
          //   AppSettings.showLog("Video Complete");
          // }
          //
          // if (videoPlayerController.value.isBuffering) {
          // } else {}
        }
      });
    } catch (e) {
      chewieController?.dispose();
      AppSettings.showLog("Video Loading Failed");
      await initializeVideoPlayer(videoUrl);
    }
  }

  Future<void> onRotate(double aspectRatio) async {
    chewieController = null;
    chewieController = ChewieController(
      videoPlayerController: videoPlayerController,
      aspectRatio: aspectRatio,
      autoPlay: true,
      looping: true,
      allowedScreenSleep: false,
      allowMuting: false,
      showControlsOnInitialize: false,
      showControls: false,
    );
    setState(() {});
  }

  Future<void> forwardSkipVideo() async {
    final currentPosition = videoPlayerController.value.position;
    final maxDuration = videoPlayerController.value.duration;
    final targetPosition = currentPosition + const Duration(seconds: 10);

    if (targetPosition > maxDuration) {
      await videoPlayerController.seekTo(maxDuration);
    } else {
      await videoPlayerController.seekTo(targetPosition);
    }
  }

  Future<void> backwardSkipVideo() async {
    final currentPosition = videoPlayerController.value.position;
    final targetPosition = currentPosition - const Duration(seconds: 10);

    if (targetPosition < Duration.zero) {
      await videoPlayerController.seekTo(Duration.zero);
    } else {
      await videoPlayerController.seekTo(targetPosition);
    }
  }

  @override
  void initState() {
    initializeVideoPlayer(DownloadHistory.mainDownloadHistory[widget.index]["videoUrl"]);
    super.initState();
  }

  @override
  void dispose() {
    chewieController?.dispose();
    chewieController = null;
    videoPlayerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      systemNavigationBarDividerColor: Colors.black,
      systemNavigationBarColor: Colors.black,
    ));
    return PopScope(
      onPopInvoked: (didPop) async {
        await SystemChrome.setPreferredOrientations([
          DeviceOrientation.portraitUp,
          DeviceOrientation.portraitDown,
        ]);
        300.milliseconds.delay();
      },
      child: Scaffold(
        backgroundColor: AppColor.black,
        body: OrientationBuilder(
            builder: (context, orientation) => Stack(
                  alignment: Alignment.center,
                  children: [
                    Center(
                      child: chewieController != null && videoPlayerController.value.isInitialized
                          ? GestureDetector(
                              child: Container(
                                height: orientation == Orientation.landscape ? Get.height : Get.height / 3,
                                width: Get.width,
                                color: AppColor.black,
                                child: Stack(
                                  children: [
                                    SizedBox(
                                        height: orientation == Orientation.landscape ? Get.height : Get.height / 3,
                                        width: Get.width,
                                        child: Chewie(controller: chewieController!)),
                                  ],
                                ),
                              ),
                            )
                          : Container(
                              height: orientation == Orientation.landscape ? Get.height : Get.height / 3.5,
                              width: Get.width,
                              color: AppColor.black,
                              child: const LoaderUi()),
                    ),
                    Positioned(
                      top: orientation == Orientation.landscape ? 35 : 55,
                      child: SizedBox(
                        width: Get.width,
                        child: Row(
                          children: [
                            SizedBox(width: Get.width * 0.02),
                            GestureDetector(
                              child: Image.asset(
                                AppIcons.arrowBack,
                                color: AppColor.white,
                                width: 20,
                              ).paddingOnly(left: 15),
                              onTap: () async {
                                await SystemChrome.setPreferredOrientations([
                                  DeviceOrientation.portraitUp,
                                  DeviceOrientation.portraitDown,
                                ]);
                                Timer(const Duration(milliseconds: 400), () async {
                                  Get.back();
                                });
                              },
                            ),
                            SizedBox(width: Get.width * 0.05),
                            SizedBox(
                              width: Get.width / 1.2,
                              child: Text(
                                DownloadHistory.mainDownloadHistory[widget.index]["videoTitle"],
                                style: GoogleFonts.urbanist(fontSize: 18, color: AppColor.white, fontWeight: FontWeight.bold),
                                maxLines: 1,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Positioned(
                      // Logo Water Mark Code
                      top: MediaQuery.of(context).viewPadding.top + 55,
                      left: 35,
                      child: Visibility(
                          visible: AppStrings.isShowWaterMark,
                          child: CachedNetworkImage(
                            imageUrl: AppStrings.waterMarkIcon,
                            fit: BoxFit.contain,
                            imageBuilder: (context, imageProvider) => Image(
                              image: ResizeImage(imageProvider, width: AppStrings.waterMarkSize, height: AppStrings.waterMarkSize),
                              fit: BoxFit.contain,
                            ),
                            placeholder: (context, url) => const Offstage(),
                            errorWidget: (context, url, error) => const Offstage(),
                          )),
                    ),
                    Center(
                      child: SizedBox(
                        width: Get.width / 1.5,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            IconButton(
                              icon: const ImageIcon(AssetImage(AppIcons.backward10s), size: 30, color: AppColor.white),
                              onPressed: () async => await backwardSkipVideo(),
                            ),
                            SizedBox(width: Get.width * 0.1),
                            IconButton(
                              icon: ImageIcon(
                                AssetImage(
                                  videoPlayerController.value.isPlaying ? AppIcons.pause : AppIcons.videoPlay,
                                ),
                                size: 35,
                                color: AppColor.white,
                              ),
                              onPressed: () {
                                if (videoPlayerController.value.isPlaying) {
                                  videoPlayerController.pause();
                                } else {
                                  videoPlayerController.play();
                                }
                                setState(() {});
                              },
                            ),
                            SizedBox(width: Get.width * 0.1),
                            IconButton(
                              icon: const ImageIcon(AssetImage(AppIcons.forward10s), size: 30, color: AppColor.white),
                              onPressed: () async => await forwardSkipVideo(),
                            ),
                          ],
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 15,
                      child: SizedBox(
                        width: Get.width,
                        child: Row(
                          children: [
                            const SizedBox(width: 10),
                            Obx(
                              () => Text(
                                CustomFormatTime.convert(videoPosition.value),
                                style: const TextStyle(color: AppColor.white, fontSize: 12),
                              ),
                            ),
                            Expanded(
                              child: SliderTheme(
                                data: SliderTheme.of(context).copyWith(
                                  trackHeight: 6,
                                  trackShape: const RoundedRectSliderTrackShape(),
                                  inactiveTrackColor: Colors.white60,
                                  thumbColor: AppColor.white,
                                  activeTrackColor: AppColor.primaryColor,
                                  thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 12.0),
                                  overlayShape: const RoundSliderOverlayShape(overlayRadius: 24.0),
                                ),
                                child: Obx(
                                  () => Slider(
                                    value: videoPosition.value.toDouble(),
                                    onChanged: (double value) {
                                      final newPosition = Duration(milliseconds: value.toInt());
                                      videoPlayerController.seekTo(newPosition);
                                    },
                                    min: 0.0,
                                    max: videoPlayerController.value.duration.inMilliseconds.toDouble(),
                                  ),
                                ),
                              ),
                            ),
                            Text(
                              CustomFormatTime.convert(videoPlayerController.value.duration.inMilliseconds),
                              style: const TextStyle(color: AppColor.white, fontSize: 12),
                            ),
                            const SizedBox(width: 5),
                            StatefulBuilder(builder: (context, setIconState) {
                              bool isFullScreen = orientation == Orientation.landscape;
                              return IconButton(
                                icon: ImageIcon(
                                  AssetImage(isFullScreen ? AppIcons.expand : AppIcons.collapse),
                                  size: 20,
                                  color: AppColor.white,
                                ),
                                onPressed: () async {
                                  if (isFullScreen) {
                                    await SystemChrome.setPreferredOrientations([
                                      DeviceOrientation.portraitUp,
                                      DeviceOrientation.portraitDown,
                                    ]);

                                    Timer(const Duration(milliseconds: 200), () async {
                                      await onRotate(Get.width / (Get.height / 3));
                                    });

                                    isFullScreen = false;
                                  } else {
                                    await SystemChrome.setPreferredOrientations([
                                      DeviceOrientation.landscapeLeft,
                                      DeviceOrientation.landscapeRight,
                                    ]);

                                    Timer(const Duration(milliseconds: 400), () async {
                                      await onRotate(Get.width / Get.height);
                                    });

                                    isFullScreen = true;
                                  }

                                  setState(() {});
                                },
                              );
                            }),
                            const SizedBox(width: 5),
                          ],
                        ),
                      ),
                    )
                  ],
                )),
      ),
    );
  }
}

//  IconButton(
//                                   icon: ImageIcon(
//                                     AssetImage(
//                                         orientation == Orientation.portrait ? AppIcons.expand : AppIcons.collapse),
//                                     size: 20,
//                                     color: AppColors.white,
//                                   ),
//                                   onPressed: () async {
//                                     if (orientation == Orientation.landscape) {
//                                       await SystemChrome.setPreferredOrientations([
//                                         DeviceOrientation.portraitUp,
//                                         DeviceOrientation.portraitDown,
//                                       ]);
//                                       Timer(const Duration(milliseconds: 200), () async {
//                                         await onRotate(Get.width / (Get.height / 3));
//                                       });
//                                     } else {
//                                       await SystemChrome.setPreferredOrientations([
//                                         DeviceOrientation.landscapeLeft,
//                                         DeviceOrientation.landscapeRight,
//                                       ]);
//                                       Timer(const Duration(milliseconds: 400), () async {
//                                         await onRotate(Get.width / Get.height);
//                                       });
//                                     }
//                                   },
//                                 ),
