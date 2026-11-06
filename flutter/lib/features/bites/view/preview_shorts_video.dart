import 'package:youpeak/shared/dialogs/app_sheet.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/basic_button.dart';
import 'package:youpeak/features/video/api/like_dislike_api.dart';
import 'package:youpeak/core/utils/custom_format_number.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/shared/shimmer/shorts_video_shimmer_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/comments/widget/comment_bottom_sheet.dart';
import 'package:youpeak/features/report/view/custom_report_view.dart';
import 'package:youpeak/features/video/api/share_count_api.dart';
import 'package:youpeak/features/bites/view/create_short_view.dart';
import 'package:youpeak/features/library/api/create_watch_history_api.dart';
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart';
import 'package:youpeak/features/subscriptions/api/subscribe_channel_api.dart';
import 'package:youpeak/features/bites/controller/preview_shorts_controller.dart';
import 'package:youpeak/features/channel/view/your_channel_view.dart';
import 'package:youpeak/features/search/view/search_view.dart';
import 'package:youpeak/features/video/api/unlock_private_video_api.dart';
import 'package:youpeak/features/video/widget/video_description_bottom_sheet.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/services/convert_to_network.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';
import 'package:youpeak/shared/widgets/common_share.dart';
import 'package:youpeak/shared/widgets/subscribe_premium_channel_bottom_sheet.dart';
import 'package:youpeak/shared/widgets/subscribed_success_dialog.dart';
import 'package:youpeak/shared/widgets/unlock_premium_video_bottom_sheet.dart';
import 'package:video_player/video_player.dart';
import 'package:youpeak/core/platform/local_media.dart';

class PreviewShortsVideo extends StatefulWidget {
  const PreviewShortsVideo(
      {super.key, required this.index, required this.currentPageIndex});

  final int index;
  final int currentPageIndex;

  @override
  State<PreviewShortsVideo> createState() => _PreviewShortsVideoState();
}

class _PreviewShortsVideoState extends State<PreviewShortsVideo> {
  final controller = Get.find<PreviewShortsController>();

  ChewieController? chewieController;
  VideoPlayerController? videoPlayerController;

  RxBool isPrivateContent = false.obs;

  RxBool isLike = false.obs;
  RxBool isDisLike = false.obs;
  RxBool isSubscribe = false.obs;

  RxBool isPlaying = true.obs;
  RxBool isShowIcon = false.obs;

  RxBool isBuffering = false.obs;
  RxBool isVideoLoading = true.obs;

  RxMap customChanges = {"like": 0, "disLike": 0, "share": 0, "comment": 0}.obs;

  String networkImage = "";

  bool isCreateHistory = false;
  bool isProcessingLikeDislike = false;

  @override
  void initState() {
    // SystemChrome.setSystemUIOverlayStyle(
    //     const SystemUiOverlayStyle(statusBarIconBrightness: Brightness.light));

    AppSettings.showLog("short detail initState call>>>>>>>>>>>>>>>>>");
    initializeVideoPlayer();

    customSetting();

    // SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: [SystemUiOverlay.top]);

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

      networkImage = videoPath;

      if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
        videoPlayerController =
            VideoPlayerController.networkUrl(Uri.parse(videoPath));
      } else {
        videoPlayerController = LocalMedia.videoController(videoPath);
      }

      await videoPlayerController?.initialize();

      AppSettings.showLog("video initialize call>>>>>>>>>>>>>>>>>");

      if (videoPlayerController != null &&
          (videoPlayerController?.value.isInitialized ?? false)) {
        chewieController = ChewieController(
          videoPlayerController: videoPlayerController!,

          // aspectRatio: AppLayout.width / Get.height,
          looping: true,
          allowedScreenSleep: false,
          allowMuting: false,
          showControlsOnInitialize: false,
          showControls: false,
        );
        if (chewieController != null &&
            (videoPlayerController?.value.isInitialized ?? false)) {
          isVideoLoading.value = false;

          if (widget.index == widget.currentPageIndex &&
              isPrivateContent.value == false) {
            isPlaying.value = true;
            videoPlayerController?.play();
          }
        }
        videoPlayerController?.addListener(
          () {
            if ((videoPlayerController?.value.isInitialized ?? false)) {
              videoPlayerController!.value.isBuffering
                  ? isBuffering.value = true
                  : isBuffering.value = false;
            }
          },
        );
      }
    } catch (e) {
      AppSettings.showLog(
          ">>>> ${widget.index} Video Loading Failed => $networkImage Error => $e");
      onClose();
    }
  }

  void customSetting() {
    isPrivateContent.value =
        (controller.mainShortsVideos[widget.index].videoPrivacyType == 2 &&
            controller.mainShortsVideos[widget.index].isSubscribed == false &&
            controller.mainShortsVideos[widget.index].channelId != Database.channelId);

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
    onStopVideo();

    customChanges["comment"] = await CommentBottomSheet.show(
      context,
      controller.mainShortsVideos[widget.index].id!,
      controller.mainShortsVideos[widget.index].channelId!,
      customChanges["comment"],
    );
  }

  void onClickShare() async {
    onStopVideo();
    // CustomShare.share(
    //   name: controller.mainShortsVideos[widget.index].title!,
    //   image: controller.mainShortsVideos[widget.index].videoImage!,
    //   pageRoutes: "ShortsVideo",
    //   videoId: controller.mainShortsVideos[widget.index].id!,
    //   channelId: controller.mainShortsVideos[widget.index].channelId!,
    //   url: controller.mainShortsVideos[widget.index].videoUrl!,
    // );

    await CommonShare.onShare(
      title: controller.mainShortsVideos[widget.index].title!,
      image: controller.mainShortsVideos[widget.index].videoImage!,
      pageRoutes: "ShortsVideo",
      id: controller.mainShortsVideos[widget.index].id!,
      channelId: controller.mainShortsVideos[widget.index].channelId!,
      url: controller.mainShortsVideos[widget.index].videoUrl!,
    );

    await ShareCountApiClass.callApi(Database.loginUserId ?? "",
        controller.mainShortsVideos[widget.index].id?.toString() ?? "");

    customChanges["share"] += 1;
  }

  void onClickMoreOption() async {
    onStopVideo();
    AppSheet.show(
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
    onStopVideo();
    // Get.to(PreviewShortsChannelView(channelId: controller.mainShortsVideos[widget.index].channelId!));
    Get.to(() => YourChannelView(
        loginUserId: Database.loginUserId ?? "",
        channelId: controller.mainShortsVideos[widget.index].channelId ?? ""));
  }

  void onClickSearch() async {
    onStopVideo();
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
  }

  @override
  void dispose() {
    onStopVideo();
    onClose();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual,
        overlays: [SystemUiOverlay.top, SystemUiOverlay.bottom]);
    super.dispose();
  }

  void onClose() {
    try {
      videoPlayerController?.dispose();
      chewieController?.dispose();
      chewieController = null;
      videoPlayerController = null;
      isVideoLoading.value = true;
      AppSettings.showLog(">>>> Preview Page Dispose Method Called");
    } catch (e) {
      AppSettings.showLog(">>>> On Close Method Error => $e");
    }
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

  void onStopVideo() {
    isPlaying.value = false;
    chewieController?.pause();
  }

  void onPlayVideo() {
    isPlaying.value = true;
    videoPlayerController?.play();
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
          // Feeds no longer carry a locked video's URL; the unlock returns it.
          final unlockedUrl = UnlockPrivateVideoApi.unlockPrivateVideoModel?.videoUrl;
          if (unlockedUrl != null && unlockedUrl.isNotEmpty && videoPlayerController == null) {
            controller.mainShortsVideos[index].videoUrl = unlockedUrl;
            await initializeVideoPlayer();
          }

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
      isSubscribe.value = true;
      SubscribedSuccessDialog.show(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarIconBrightness: Brightness.light,
        statusBarColor: Colors.transparent,
        systemNavigationBarDividerColor: AppColor.black,
        systemNavigationBarColor: AppColor.black,
      ),
    );
    if (widget.index == widget.currentPageIndex &&
        isPrivateContent.value == false) {
      isCreateHistory = true;
      if (isVideoLoading.value == false) {
        onPlayVideo();
      }
    } else {
      onStopVideo();
      if (isCreateHistory) {
        isCreateHistory = false;
        onCreateHistory();
      }
    }

    return Obx(
      () => isVideoLoading.value
          ? const ShortVideoShimmerUi()
          : Stack(
              children: [
                isPrivateContent.value
                    ? ShortsPrivateContentWidget(
                        id: controller.mainShortsVideos[widget.index].id,
                        image: controller
                            .mainShortsVideos[widget.index].videoImage,
                        subscribeCoin: controller.mainShortsVideos[widget.index]
                                .subscriptionCost ??
                            0,
                        unlockCoin: controller.mainShortsVideos[widget.index]
                                .videoUnlockCost ??
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
                            height: Get.height,
                            width: AppLayout.width,
                            color: AppColor.black,
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
                                          child: Chewie(
                                              controller: chewieController!),
                                        ),
                                      ),
                                    ),
                              // Chewie(controller: chewieController!)
                            ),
                          ),
                          Positioned(
                            // Logo Water Mark Code
                            top: MediaQuery.of(context).viewPadding.top + 55,
                            left: 20,
                            child: Visibility(
                                visible: AppStrings.isShowWaterMark,
                                child: CachedNetworkImage(
                                  imageUrl: AppStrings.waterMarkIcon,
                                  fit: BoxFit.contain,
                                  imageBuilder: (context, imageProvider) =>
                                      Image(
                                    image: ResizeImage(imageProvider,
                                        width: AppStrings.waterMarkSize,
                                        height: AppStrings.waterMarkSize),
                                    fit: BoxFit.contain,
                                  ),
                                  placeholder: (context, url) =>
                                      const Offstage(),
                                  errorWidget: (context, url, error) =>
                                      const Offstage(),
                                )),
                          ),
                          GestureDetector(
                            onTap: onClickVideo,
                            child: Container(
                              height: Get.height,
                              width: AppLayout.width,
                              color: Colors.black.withAlpha(51),
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
                                            color:
                                                AppColor.black.withOpacity(0.2),
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
        // Legibility scrims: the caption and rail sit over arbitrary video.
        Positioned(
          left: 0,
          right: 0,
          top: 0,
          height: 130,
          child: IgnorePointer(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.black.withValues(alpha: 0.45), Colors.transparent],
                ),
              ),
            ),
          ),
        ),
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          height: 280,
          child: IgnorePointer(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [Colors.black.withValues(alpha: 0.62), Colors.transparent],
                ),
              ),
            ),
          ),
        ),
                Padding(
                  padding: EdgeInsets.only(
                      left: 15, right: 15, top: SizeConfig.screenHeight / 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      IconButtonUi(
                        icon: Image.asset(
                          AppIcons.arrowBack,
                          color: AppColor.white,
                          width: 20,
                        ),
                        callback: () => Get.back(),
                      ),
                      const Spacer(),
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
          bottom: 12,
          right: 12,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Obx(() => BitesRailAction(
                    icon: AppIcons.likeBold,
                    label: AppStrings.bitesLike.tr,
                    active: isLike.value,
                    count: CustomFormatNumber.convert(customChanges["like"]),
                    onTap: onClickLike,
                  )),
              const SizedBox(height: 14),
              Obx(() => BitesRailAction(
                    icon: AppIcons.disLikeBold,
                    label: AppStrings.bitesDislike.tr,
                    active: isDisLike.value,
                    count: CustomFormatNumber.convert(customChanges["disLike"]),
                    onTap: onClickDisLike,
                  )),
              const SizedBox(height: 14),
              Obx(() => BitesRailAction(
                    icon: AppIcons.comments,
                    label: AppStrings.comments.tr,
                    count: CustomFormatNumber.convert(customChanges["comment"]),
                    onTap: onClickComment,
                    size: 27,
                  )),
              const SizedBox(height: 14),
              Obx(() => BitesRailAction(
                    icon: AppIcons.boldShare,
                    label: AppStrings.share.tr,
                    count: CustomFormatNumber.convert(customChanges["share"]),
                    onTap: onClickShare,
                    size: 27,
                  )),
              const SizedBox(height: 14),
              BitesRailAction(
                icon: AppIcons.moreCircle,
                label: AppStrings.moreOption.tr,
                onTap: onClickMoreOption,
                size: 27,
              ),
              const SizedBox(height: 14),
            ],
          ),
        ),
        Padding(
          padding: EdgeInsets.only(left: 15, right: SizeConfig.screenWidth * 0.2),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  GestureDetector(
                    onTap: onClickProfile,
                    child: Container(
                      padding: const EdgeInsets.all(1.5),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColor.white, width: 1.5),
                      ),
                      child: PreviewProfileImage(
                        size: 34,
                        id: controller.mainShortsVideos[widget.index].channelId ?? "",
                        image: controller.mainShortsVideos[widget.index].channelImage ?? "",
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Flexible(
                    child: Text(
                      controller.mainShortsVideos[widget.index].channelName ?? "",
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.urbanist(
                        color: AppColor.white,
                        fontSize: 15.5,
                        fontWeight: FontWeight.w800,
                        shadows: const [Shadow(blurRadius: 8, color: Color(0x99000000))],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Visibility(
                    visible: Database.channelId != controller.mainShortsVideos[widget.index].channelId,
                    child: AppPressable(
                      onTap: onClickSubscribe,
                      haptic: true,
                      child: Obx(
                        () => AnimatedContainer(
                          duration: AppMotion.of(context),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                          decoration: BoxDecoration(
                            color: isSubscribe.value ? Colors.black.withValues(alpha: 0.25) : AppColor.primaryColor,
                            borderRadius: BorderRadius.circular(25),
                            border: Border.all(color: isSubscribe.value ? AppColor.white.withValues(alpha: 0.7) : AppColor.primaryColor),
                          ),
                          child: Text(
                            isSubscribe.value ? AppStrings.subscribed.tr : AppStrings.subscribe.tr,
                            style: GoogleFonts.urbanist(
                              color: AppColor.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                controller.mainShortsVideos[widget.index].title ?? "",
                style: GoogleFonts.urbanist(
                  fontSize: 14.5,
                  height: 1.3,
                  fontWeight: FontWeight.w600,
                  color: AppColor.white,
                  shadows: const [Shadow(blurRadius: 8, color: Color(0x99000000))],
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if ((controller.mainShortsVideos[widget.index].hashTag ?? const []).isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  (controller.mainShortsVideos[widget.index].hashTag as List).join(" "),
                  style: GoogleFonts.urbanist(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: AppColor.white.withValues(alpha: 0.9),
                    shadows: const [Shadow(blurRadius: 8, color: Color(0x99000000))],
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              const SizedBox(height: 22),
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
            ),
    );
  }
}
