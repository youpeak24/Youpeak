import 'dart:async';
import 'dart:ui';

import 'package:blurrycontainer/blurrycontainer.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/features/video/api/like_dislike_api.dart';
import 'package:youpeak/core/utils/custom_format_number.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/comments/widget/comment_bottom_sheet.dart';
import 'package:youpeak/features/report/view/custom_report_view.dart';
import 'package:youpeak/features/video/api/share_count_api.dart';
import 'package:youpeak/features/bites/view/create_short_view.dart';
import 'package:youpeak/features/library/api/create_watch_history_api.dart';
import 'package:youpeak/features/bites/controller/nav_shorts_controller.dart';
import 'package:youpeak/features/subscriptions/api/subscribe_channel_api.dart';
import 'package:youpeak/features/watch_tracking/presentation/watch_heartbeat_tracker.dart';
import 'package:youpeak/features/channel/view/your_channel_view.dart';
import 'package:youpeak/features/search/view/search_view.dart';
import 'package:youpeak/features/video/api/unlock_private_video_api.dart';
import 'package:youpeak/features/video/widget/video_description_bottom_sheet.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/services/convert_to_network.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';
import 'package:youpeak/core/utils/utils.dart';
import 'package:youpeak/shared/widgets/common_share.dart';
import 'package:youpeak/shared/widgets/subscribe_premium_channel_bottom_sheet.dart';
import 'package:youpeak/shared/widgets/subscribed_success_dialog.dart';
import 'package:youpeak/shared/widgets/unlock_premium_video_bottom_sheet.dart';
import 'package:video_player/video_player.dart';
import 'package:youpeak/core/platform/local_media.dart';

class NavShortsDetailView extends StatefulWidget {
  const NavShortsDetailView(
      {super.key, required this.index, required this.currentPageIndex});

  final int index;
  final int currentPageIndex;

  @override
  State<NavShortsDetailView> createState() => _NavShortsDetailViewState();
}

class _NavShortsDetailViewState extends State<NavShortsDetailView> {
  final controller = Get.find<NavShortsController>();

  ChewieController? chewieController;
  VideoPlayerController? videoPlayerController;

  // Reports genuine viewing to the server's watch-time ledger. Preloaded,
  // paused pages accumulate nothing.
  WatchHeartbeatTracker? watchTracker;

  RxBool isPrivateContent = false.obs;

  RxBool isLike = false.obs;
  RxBool isDisLike = false.obs;
  RxBool isSubscribe = false.obs;

  RxBool isPlaying = true.obs;
  RxBool isShowIcon = false.obs;

  RxBool isBuffering = false.obs;
  RxBool isVideoLoading = true.obs;

  RxBool isShortsPage = true.obs; // This is Use to Stop Auto Playing..

  RxMap customChanges = {"like": 0, "disLike": 0, "share": 0, "comment": 0}.obs;

  bool isCreateHistory = false;
  bool isProcessingLikeDislike = false;

  @override
  void initState() {
    AppSettings.showLog("Nav Shorts initState call>>>>>>>>>>>>>>>>>");

    initializeVideoPlayer();
    customSetting();
    super.initState();
  }

  Future<void> initializeVideoPlayer() async {
    try {
      String videoId = controller.mainShortsVideos[widget.index].id ?? "";
      String rawUrl = controller.mainShortsVideos[widget.index].videoUrl ?? "";
      String? cachedPath = Database.onGetVideoUrl(videoId);
      String videoPath = "";

      if (ConvertToNetwork.isValidVideoUrl(cachedPath)) {
        videoPath = cachedPath!;
      } else {
        videoPath = await ConvertToNetwork.convert(rawUrl);
      }

      if (videoPath.isEmpty) return;

      if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
        videoPlayerController = VideoPlayerController.networkUrl(
            Uri.parse(videoPath),
            videoPlayerOptions: VideoPlayerOptions(mixWithOthers: true));
      } else {
        videoPlayerController = LocalMedia.videoController(videoPath);
      }

      await videoPlayerController?.initialize();

      AppSettings.showLog(
          "nav video initialize call>>>>>>>>>>>>>>>>>${widget.index}");

      if (videoPlayerController != null &&
          (videoPlayerController?.value.isInitialized ?? false)) {
        chewieController = ChewieController(
          videoPlayerController: videoPlayerController!,
          // aspectRatio: Get.width / (Get.height - 66),
          // aspectRatio: 10 / 18,
          looping: false,
          allowedScreenSleep: false,
          allowMuting: false,
          showControlsOnInitialize: false,
          showControls: false,
          maxScale: 1,
        );
        watchTracker?.detach();
        watchTracker = WatchHeartbeatTracker(videoId: controller.mainShortsVideos[widget.index].id ?? "")..attach(videoPlayerController!);
        if (chewieController != null) {
          isVideoLoading.value = false;
          // If First Time Video Playing...
          (widget.index == widget.currentPageIndex &&
                  isPrivateContent.value == false)
              ? onPlayVideo()
              : null;
        } else {
          isVideoLoading.value = true;
        }
        videoPlayerController?.addListener(
          () {
            if (videoPlayerController != null &&
                (videoPlayerController?.value.isInitialized ?? false)) {
              // If Video Buffering then show loading....
              videoPlayerController!.value.isBuffering
                  ? isBuffering.value = true
                  : isBuffering.value = false;

              if (Get.currentRoute != "/MainHomePageView") {
                isShortsPage.value = false;
                onStopVideo();
              }

              if (videoPlayerController!.value.position >=
                  videoPlayerController!.value.duration) {
                // Loop. Watch time comes from watchTracker, which skips the
                // restart jump (this used to report the short's full length
                // as watch time on every loop).
                videoPlayerController?.seekTo(Duration.zero);
                onPlayVideo();
              }
            }
          },
        );
      }
    } catch (e) {
      onDisposeVideoPlayer();
      AppSettings.showLog(
          "Shorts Video Initialization Failed !!! ${widget.index} => $e");
    }
  }

  void onStopVideo() {
    isPlaying.value = false;
    videoPlayerController?.pause();
  }

  void onPlayVideo() {
    isPlaying.value = true;
    videoPlayerController?.play();
  }

  void onDisposeVideoPlayer() {
    try {
      onStopVideo();
      watchTracker?.detach();
      watchTracker = null;
      videoPlayerController?.dispose();
      chewieController?.dispose();
      chewieController = null;
      videoPlayerController = null;
      isVideoLoading.value = true;
    } catch (e) {
      AppSettings.showLog(">>>> On Dispose VideoPlayer Error => $e");
    }
  }

  @override
  void dispose() {
    onDisposeVideoPlayer();
    AppSettings.showLog("Dispose Method Called Success");
    super.dispose();
  }

  void customSetting() {
    isPrivateContent.value =
        (controller.mainShortsVideos[widget.index].videoPrivacyType == 2 &&
            controller.mainShortsVideos[widget.index].isSubscribed == false &&
            controller.mainShortsVideos[widget.index].userId != Database.loginUserId);

    isLike.value = controller.mainShortsVideos[widget.index].isLike!;
    isDisLike.value = controller.mainShortsVideos[widget.index].isDislike!;
    isSubscribe.value = controller.mainShortsVideos[widget.index].isSubscribed!;

    customChanges["like"] =
        int.parse(controller.mainShortsVideos[widget.index].like.toString());
    customChanges["disLike"] =
        int.parse(controller.mainShortsVideos[widget.index].dislike.toString());
    customChanges["share"] = int.parse(
        controller.mainShortsVideos[widget.index].shareCount.toString());
    customChanges["comment"] = int.parse(
        controller.mainShortsVideos[widget.index].totalComments.toString());
  }

  Future<void> onCreateHistory() async {
    if (videoPlayerController != null &&
        (videoPlayerController?.value.isInitialized ?? false) &&
        Database.loginUserId != null &&
        Database.loginUserId!.isNotEmpty) {
      final watchTime = videoPlayerController!.value.position.inSeconds;
      AppSettings.showLog("Video Watch Time ${widget.index} => $watchTime");
      await CreateWatchHistoryApi.callApi(
        loginUserId: Database.loginUserId!,
        videoId: controller.mainShortsVideos[widget.index].id ?? "",
        videoChannelId: controller.mainShortsVideos[widget.index].channelId ?? "",
        videoUserId: controller.mainShortsVideos[widget.index].userId ?? "",
        watchTimeInMinute: watchTime.toDouble(),
      );
    }
  }

  // void onClickLike() async {
  //   if (!isLike.value) {
  //     if (isDisLike.value) {
  //       isDisLike.value = false;
  //       customChanges["disLike"]--;
  //     }
  //     isLike.value = true;
  //     customChanges["like"]++;
  //     await LikeDisLikeVideoApi.callApi(controller.mainShortsVideos[widget.index].id.toString(), true);
  //   } else {
  //     AppSettings.showLog("This Video Already Liked");
  //   }
  // }

  void onClickLike() async {
    if (isProcessingLikeDislike) return;
    isProcessingLikeDislike = true;

    try {
      String videoId = controller.mainShortsVideos[widget.index].id.toString();
      var videoModel = controller.mainShortsVideos[widget.index];

      // CASE 1: Already Liked → Remove Like
      if (isLike.value) {
        // Optimistic UI Update
        isLike.value = false;
        customChanges["like"]--;

        // Sync with Controller Model
        videoModel.isLike = false;
        videoModel.like = (videoModel.like ?? 0) - 1;

        await LikeDisLikeVideoApi.callApi(videoId, "likeremove");
      }
      // CASE 2: Not Liked
      else {
        bool wasDisliked = isDisLike.value;

        // Optimistic UI Update: Remove Dislike if exists
        if (wasDisliked) {
          isDisLike.value = false;
          customChanges["disLike"]--;

          // Sync with Controller Model
          videoModel.isDislike = false;
          videoModel.dislike = (videoModel.dislike ?? 0) - 1;
        }

        // Optimistic UI Update: Add Like
        isLike.value = true;
        customChanges["like"]++;

        // Sync with Controller Model
        videoModel.isLike = true;
        videoModel.like = (videoModel.like ?? 0) + 1;

        // Run sequential API calls
        if (wasDisliked) {
          await LikeDisLikeVideoApi.callApi(videoId, "dislikeremove");
        }
        await LikeDisLikeVideoApi.callApi(videoId, "like");
      }
    } catch (e) {
      AppSettings.showLog("Error in onClickLike: $e");
    } finally {
      isProcessingLikeDislike = false;
    }
  }

  // void onClickDisLike() async {
  //   if (!isDisLike.value) {
  //     if (isLike.value) {
  //       isLike.value = false;
  //       customChanges["like"]--;
  //     }
  //     isDisLike.value = true;
  //     customChanges["disLike"]++;
  //     await LikeDisLikeVideoApi.callApi(controller.mainShortsVideos[widget.index].id.toString(), false);
  //   } else {
  //     AppSettings.showLog("This Video Already DisLiked");
  //   }
  // }

  void onClickDisLike() async {
    if (isProcessingLikeDislike) return;
    isProcessingLikeDislike = true;

    try {
      String videoId = controller.mainShortsVideos[widget.index].id.toString();
      var videoModel = controller.mainShortsVideos[widget.index];

      // CASE 1: Already Disliked → Remove Dislike
      if (isDisLike.value) {
        // Optimistic UI Update
        isDisLike.value = false;
        customChanges["disLike"]--;

        // Sync with Controller Model
        videoModel.isDislike = false;
        videoModel.dislike = (videoModel.dislike ?? 0) - 1;

        await LikeDisLikeVideoApi.callApi(videoId, "dislikeremove");
      }
      // CASE 2: Not Disliked
      else {
        bool wasLiked = isLike.value;

        // Optimistic UI Update: Remove Like if exists
        if (wasLiked) {
          isLike.value = false;
          customChanges["like"]--;

          // Sync with Controller Model
          videoModel.isLike = false;
          videoModel.like = (videoModel.like ?? 0) - 1;
        }

        // Optimistic UI Update: Add Dislike
        isDisLike.value = true;
        customChanges["disLike"]++;

        // Sync with Controller Model
        videoModel.isDislike = true;
        videoModel.dislike = (videoModel.dislike ?? 0) + 1;

        // Run sequential API calls
        if (wasLiked) {
          await LikeDisLikeVideoApi.callApi(videoId, "likeremove");
        }
        await LikeDisLikeVideoApi.callApi(videoId, "dislike");
      }
    } catch (e) {
      AppSettings.showLog("Error in onClickDisLike: $e");
    } finally {
      isProcessingLikeDislike = false;
    }
  }

  void onClickComment() async {
    isShortsPage.value = false;
    onStopVideo();

    customChanges["comment"] = await CommentBottomSheet.show(
      context,
      controller.mainShortsVideos[widget.index].id!,
      controller.mainShortsVideos[widget.index].channelId!,
      customChanges["comment"],
      callback: () {
        onPlayVideo();
      },
    );
  }

  void onClickShare() async {
    onStopVideo();
    // CustomShare.share(
    //   videoId: controller.mainShortsVideos[widget.index].id ?? "",
    //   pageRoutes: "ShortsVideo",
    //   image: controller.mainShortsVideos[widget.index].videoImage!,
    //   channelId: controller.mainShortsVideos[widget.index].channelId ?? "",
    //   name: controller.mainShortsVideos[widget.index].title!,
    //   url: controller.mainShortsVideos[widget.index].title,
    // );

    await CommonShare.onShare(
      url: controller.mainShortsVideos[widget.index].videoUrl,
      channelId: controller.mainShortsVideos[widget.index].channelId ?? "",
      id: controller.mainShortsVideos[widget.index].id ?? "",
      image: controller.mainShortsVideos[widget.index].videoImage!,
      title: controller.mainShortsVideos[widget.index].title,
      pageRoutes: "ShortsVideo",
    );

    // Resume video after share dialog is closed
    onPlayVideo();

    await ShareCountApiClass.callApi(Database.loginUserId ?? "",
        controller.mainShortsVideos[widget.index].id?.toString() ?? "");

    customChanges["share"] += 1;
  }

  void onClickMoreOption() async {
    onStopVideo();
    Get.bottomSheet(
      backgroundColor:
          isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
      SizedBox(
        height: SizeConfig.screenHeight / 5,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            children: [
              const SizedBox(height: 5),
              Container(
                width: SizeConfig.blockSizeHorizontal * 12,
                height: 3,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(60),
                  color: AppColor.grey_100,
                ),
              ),
              const SizedBox(height: 10),
              Text(AppStrings.moreOption.tr, style: titalstyle1),
              const SizedBox(height: 10),
              const Divider(indent: 25, endIndent: 25, color: AppColor.grey),
              const SizedBox(height: 10),
              BottomShitButton(
                widget:
                    const ImageIcon(AssetImage(AppIcons.document), size: 23),
                name: AppStrings.description.tr,
                onTap: () {
                  Get.back();
                  DescriptionBottomSheet.show(
                    controller.mainShortsVideos[widget.index].channelId!,
                    controller.mainShortsVideos[widget.index].title!,
                    controller.mainShortsVideos[widget.index].channelImage!,
                    controller.mainShortsVideos[widget.index].channelName!,
                    customChanges["like"],
                    customChanges["disLike"],
                    controller.mainShortsVideos[widget.index].views!,
                    controller.mainShortsVideos[widget.index].createdAt!,
                    controller.mainShortsVideos[widget.index].hashTag!
                        .join(','),
                    controller.mainShortsVideos[widget.index].description!,
                  );
                },
              ),
              const SizedBox(height: 15),
              BottomShitButton(
                widget:
                    const ImageIcon(AssetImage(AppIcons.closeSquare), size: 23),
                name: "${AppStrings.report.tr}-${AppStrings.block.tr}",
                onTap: () {
                  Get.back();
                  CustomReportView.show(
                      controller.mainShortsVideos[widget.index].id!);
                },
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(30),
          topLeft: Radius.circular(30),
        ),
      ),
    );
  }

  void onClickProfile() async {
    isShortsPage.value = false;
    onStopVideo();
    // Get.to(PreviewShortsChannelView(channelId: controller.mainShortsVideos[widget.index].channelId!));
    Get.to(() => YourChannelView(
        loginUserId: Database.loginUserId ?? "",
        channelId: controller.mainShortsVideos[widget.index].channelId ?? ""));
  }

  void onClickSearch() async {
    onStopVideo();
    isShortsPage.value = false;
    Get.to(const SearchView(isSearchShorts: true));
  }

  void onClickSubscribe() async {
    if (isPrivateContent.value && isSubscribe.value == false) {
      onSubscribePrivateChannel(index: widget.index);
    } else {
      isSubscribe.value = !isSubscribe.value;
      await SubscribeChannelApiClass.callApi(
          controller.mainShortsVideos[widget.index].channelId.toString());
    }
  }

  void onClickCamera() async {
    onStopVideo();
    isShortsPage.value = false;
    Get.to(() => CreateShortView());
  }

  void onClickVideo() async {
    videoPlayerController!.value.isPlaying ? onStopVideo() : onPlayVideo();
    isShowIcon.value = true;
    await 2.seconds.delay();
    isShowIcon.value = false;
  }

  void onClickPlayPause() async {
    videoPlayerController!.value.isPlaying ? onStopVideo() : onPlayVideo();
    if (isShortsPage.value == false) {
      isShortsPage.value = true;
    }
  }

  void onUnlockPrivateVideo({required int index}) async {
    UnlockPremiumVideoBottomSheet.onShow(
      coin:
          (controller.mainShortsVideos[index].videoUnlockCost ?? 0).toString(),
      callback: () async {
        Get.dialog(const LoaderUi(), barrierDismissible: false);
        await UnlockPrivateVideoApi.callApi(
            loginUserId: Database.loginUserId ?? "",
            videoId: controller.mainShortsVideos[index].id ?? "");

        /// 🔹 ALWAYS close loader first
        if (Get.isDialogOpen ?? false) {
          Get.back();
        }
        if (UnlockPrivateVideoApi.unlockPrivateVideoModel?.isUnlocked == true) {
          isPrivateContent.value = false;

          /// 🔹 ALWAYS close loader first
          if (Get.isBottomSheetOpen ?? false) {
            Get.back();
          }
          SubscribedSuccessDialog.show(context);
        }

        CustomToast.show(
            UnlockPrivateVideoApi.unlockPrivateVideoModel?.message ?? "");
      },
    );
  }

  void onSubscribePrivateChannel({required int index}) async {
    Get.dialog(const LoaderUi(), barrierDismissible: false);
    final bool isSuccess = await SubscribeChannelApiClass.callApi(
        controller.mainShortsVideos[index].channelId ?? "");
    if (Get.isDialogOpen ?? false) {
      Get.back();
    }
    if (isSuccess) {
      isPrivateContent.value = false;
      SubscribedSuccessDialog.show(context);
      isSubscribe.value = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarIconBrightness: Brightness.light,
        statusBarColor: Colors.transparent,
      ),
    );

    if (widget.index == widget.currentPageIndex &&
        isPrivateContent.value == false) {
      // Play Current Video On Scrolling...
      isCreateHistory = true;
      isVideoLoading.value == false && isShortsPage.value
          ? onPlayVideo()
          : null;
    } else {
      // Restart Previous Video On Scrolling...
      isVideoLoading.value == false
          ? videoPlayerController?.seekTo(Duration.zero)
          : null;
      // Stop Previous Video On Scrolling...
      onStopVideo();
      if (isCreateHistory) {
        isCreateHistory = false;
        if (controller.mainShortsVideos[widget.index] != null) {
          onCreateHistory();
        }
      }
    }

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Obx(
          () => isPrivateContent.value
              ? ShortsPrivateContentWidget(
                  id: controller.mainShortsVideos[widget.index].id,
                  image: controller.mainShortsVideos[widget.index].videoImage,
                  subscribeCoin: controller
                          .mainShortsVideos[widget.index].subscriptionCost ??
                      0,
                  unlockCoin: controller
                          .mainShortsVideos[widget.index].videoUnlockCost ??
                      0,
                  subscribe: () {
                    onSubscribePrivateChannel(index: widget.index);
                  },
                  unlock: () {
                    onUnlockPrivateVideo(index: widget.index);
                  },
                )
              : Stack(
                  children: [
                    Container(
                      color: Colors.black,
                      height: (Get.height - 60),
                      width: Get.width,
                      child: Obx(
                        () => isVideoLoading.value
                            ? Stack(
                                children: [
                                  SizedBox.expand(
                                    child: CachedNetworkImage(
                                      imageUrl: controller.mainShortsVideos[widget.index].videoImage ?? "",
                                      fit: BoxFit.cover,
                                      placeholder: (context, url) => const LoaderUi(color: Colors.white),
                                      errorWidget: (context, url, error) => const Offstage(),
                                    ),
                                  ),
                                  const Center(child: LoaderUi(color: Colors.white)),
                                ],
                              )
                            : SizedBox.expand(
                                child: FittedBox(
                                  fit: BoxFit.cover,
                                  child: SizedBox(
                                    width: videoPlayerController
                                            ?.value.size.width ??
                                        0,
                                    height: videoPlayerController
                                            ?.value.size.height ??
                                        0,
                                    child:
                                        Chewie(controller: chewieController!),
                                  ),
                                ),
                              ),
                        // Chewie(controller: chewieController!)
                      ),
                    ),
                    Positioned(
                      // Logo Water Mark Code
                      top: MediaQuery.of(context).viewPadding.top + 25,
                      left: 20,
                      child: Visibility(
                          visible: AppStrings.isShowWaterMark,
                          child: CachedNetworkImage(
                            imageUrl: AppStrings.waterMarkIcon,
                            fit: BoxFit.contain,
                            imageBuilder: (context, imageProvider) => Image(
                              image: ResizeImage(imageProvider,
                                  width: AppStrings.waterMarkSize,
                                  height: AppStrings.waterMarkSize),
                              fit: BoxFit.contain,
                            ),
                            placeholder: (context, url) => const Offstage(),
                            errorWidget: (context, url, error) =>
                                const Offstage(),
                          )),
                    ),
                    GestureDetector(
                      onTap: onClickVideo,
                      child: Container(
                        height: Get.height,
                        width: Get.width,
                        color: Colors.black.withOpacity(0.2),
                      ),
                    ),
                    Obx(
                      () => isShowIcon.value
                          ? Align(
                              alignment: Alignment.center,
                              child: GestureDetector(
                                onTap: onClickPlayPause,
                                child: Container(
                                  height: 60,
                                  width: 60,
                                  padding: EdgeInsets.only(
                                      left: isPlaying.value ? 0 : 5),
                                  decoration: BoxDecoration(
                                      color: AppColor.black.withOpacity(0.2),
                                      shape: BoxShape.circle),
                                  child: Center(
                                    child: Image.asset(
                                        isPlaying.value
                                            ? AppIcons.pause
                                            : AppIcons.videoPlay,
                                        width: 25,
                                        height: 25,
                                        color: AppColor.white),
                                  ),
                                ),
                              ),
                            )
                          : const Offstage(),
                    ),
                  ],
                ),
        ),
        Obx(() =>
            Visibility(visible: isBuffering.value, child: const LoaderUi())),
        Padding(
          padding: EdgeInsets.only(
              left: 15, right: 15, top: SizeConfig.screenHeight / 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              IconButtonUi(
                callback: onClickSearch,
                icon: const ImageIcon(AssetImage(AppIcons.search),
                    color: AppColor.white, size: 22),
              ),
              const SizedBox(width: 15),
              IconButtonUi(
                callback: onClickCamera,
                icon: const ImageIcon(AssetImage(AppIcons.camera),
                    color: AppColor.white, size: 30),
              ),
            ],
          ),
        ),
        Positioned(
          bottom: 5,
          right: 15,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Obx(() => IconButtonUi(
                  callback: onClickLike,
                  icon: ImageIcon(const AssetImage(AppIcons.likeBold),
                      color:
                          isLike.value ? AppColor.primaryColor : AppColor.white,
                      size: 25))),
              Obx(() => Text(CustomFormatNumber.convert(customChanges["like"]),
                  style: GoogleFonts.urbanist(color: AppColor.white))),
              const SizedBox(height: 15),
              Obx(() => IconButtonUi(
                  callback: onClickDisLike,
                  icon: ImageIcon(const AssetImage(AppIcons.disLikeBold),
                      color: isDisLike.value
                          ? AppColor.primaryColor
                          : AppColor.white,
                      size: 25))),
              Obx(() => Text(
                  CustomFormatNumber.convert(customChanges["disLike"]),
                  style: GoogleFonts.urbanist(color: AppColor.white))),
              const SizedBox(height: 15),
              IconButtonUi(
                  callback: onClickComment,
                  icon: const ImageIcon(AssetImage(AppIcons.comments),
                      color: AppColor.white, size: 30)),
              Obx(() => Text(
                  CustomFormatNumber.convert(customChanges["comment"]),
                  style: GoogleFonts.urbanist(color: AppColor.white))),
              const SizedBox(height: 15),
              IconButtonUi(
                  callback: onClickShare,
                  icon: const ImageIcon(AssetImage(AppIcons.boldShare),
                      color: AppColor.white, size: 30)),
              Obx(() => Text(CustomFormatNumber.convert(customChanges["share"]),
                  style: GoogleFonts.urbanist(color: AppColor.white))),
              const SizedBox(height: 15),
              IconButtonUi(
                  callback: onClickMoreOption,
                  icon: const ImageIcon(AssetImage(AppIcons.moreCircle),
                      color: AppColor.white, size: 30)),
              const SizedBox(height: 25),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 15),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  SizedBox(
                    width: SizeConfig.screenWidth / 1.8,
                    child: Text(controller.mainShortsVideos[widget.index].title,
                        style: GoogleFonts.urbanist(
                            fontSize: 15, color: AppColor.white),
                        maxLines: 3),
                  ),
                  SizedBox(
                    width: SizeConfig.screenWidth / 1.8,
                    child: Text(
                        controller.mainShortsVideos[widget.index].hashTag
                            ?.join(','),
                        style: GoogleFonts.urbanist(
                            fontSize: 14, color: AppColor.white),
                        maxLines: 3),
                  ),
                ],
              ),
              SizedBox(height: SizeConfig.blockSizeVertical * 2),
              Row(
                children: [
                  IconButtonUi(
                    callback: onClickProfile,
                    icon: PreviewProfileImage(
                      size: 30,
                      id: controller.mainShortsVideos[widget.index].channelId ??
                          "",
                      image: controller
                              .mainShortsVideos[widget.index].channelImage ??
                          "",
                      fit: BoxFit.cover,
                    ),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    controller.mainShortsVideos[widget.index].channelName ?? "",
                    style: GoogleFonts.urbanist(
                        color: AppColor.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(width: 10),
                  Visibility(
                    visible: Database.channelId !=
                        controller.mainShortsVideos[widget.index].channelId,
                    child: GestureDetector(
                      onTap: onClickSubscribe,
                      child: Obx(
                        () => Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: isSubscribe.value
                                ? Colors.transparent
                                : AppColor.primaryColor,
                            borderRadius: BorderRadius.circular(25),
                            border: Border.all(color: AppColor.primaryColor),
                          ),
                          child: Text(
                            isSubscribe.value
                                ? AppStrings.subscribed.tr
                                : AppStrings.subscribe.tr,
                            style: GoogleFonts.urbanist(
                              color: isSubscribe.value
                                  ? AppColor.primaryColor
                                  : AppColor.white,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 15),
                ],
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
        Obx(
          () => Visibility(
            visible: controller.isPaginationLoading.value,
            child: Align(
              alignment: Alignment.bottomCenter,
              child: LinearProgressIndicator(
                color: AppColor.primaryColor,
                backgroundColor: AppColor.grey_300,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class IconButtonUi extends StatelessWidget {
  const IconButtonUi({super.key, required this.icon, required this.callback});

  final Widget icon;
  final Callback callback;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: callback,
      child: Container(
        height: 35,
        width: 35,
        decoration: const BoxDecoration(
          color: Colors.transparent,
          shape: BoxShape.circle,
        ),
        child: Center(child: icon),
      ),
    );
  }
}

class ShortsPrivateContentWidget extends StatelessWidget {
  const ShortsPrivateContentWidget(
      {super.key,
      required this.id,
      required this.image,
      required this.subscribe,
      required this.unlock,
      required this.subscribeCoin,
      required this.unlockCoin});

  final String id;
  final String image;
  final num subscribeCoin;
  final num unlockCoin;
  final Callback subscribe;
  final Callback unlock;

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        PreviewVideoImage(videoId: id, videoImage: image),
        Positioned.fill(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              color: Colors.black.withOpacity(0),
            ),
          ),
        ),
        Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            5.height,
            Image.asset(AppIcons.lock, width: 45),
            15.height,
            Text(
              AppStrings.thisVideoIsPrivateContent.tr,
              style: GoogleFonts.urbanist(
                  fontSize: 16,
                  color: AppColor.white,
                  fontWeight: FontWeight.w900),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            15.height,
            Column(
              children: [
                GestureDetector(
                  onTap: subscribe,
                  child: BlurryContainer(
                    height: 42,
                    width: 190,
                    blur: 5,
                    borderRadius: BorderRadius.circular(30),
                    color: AppColor.white.withOpacity(0.4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          AppStrings.subscribe.tr,
                          style: GoogleFonts.urbanist(
                              color: AppColor.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16),
                        ),
                        5.width,
                        Image.asset(AppIcons.coin, width: 18),
                        2.width,
                        Text(
                          "$subscribeCoin/m",
                          style: GoogleFonts.urbanist(
                              color: AppColor.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 16),
                        ),
                      ],
                    ),
                  ),
                ),
                15.height,
                GestureDetector(
                  onTap: unlock,
                  child: Container(
                    height: 42,
                    width: 190,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(30),
                      color: AppColor.primaryColor,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          AppStrings.unlockVideo.tr,
                          style: GoogleFonts.urbanist(
                              color: AppColor.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16),
                        ),
                        5.width,
                        Image.asset(AppIcons.coin, width: 18),
                        2.width,
                        Text(
                          "$unlockCoin",
                          style: GoogleFonts.urbanist(
                              color: AppColor.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 16),
                        ),
                      ],
                    ),
                  ),
                ),
                12.width,
              ],
            ),
          ],
        ),
      ],
    );
  }
}
