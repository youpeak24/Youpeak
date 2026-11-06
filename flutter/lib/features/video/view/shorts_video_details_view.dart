import 'package:youpeak/shared/dialogs/app_sheet.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
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
import 'package:youpeak/features/live/widget/device_orientation.dart';
import 'package:youpeak/features/library/api/create_watch_history_api.dart';
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart';
import 'package:youpeak/features/subscriptions/api/subscribe_channel_api.dart';
import 'package:youpeak/features/watch_tracking/presentation/watch_heartbeat_tracker.dart';
import 'package:youpeak/features/channel/view/your_channel_view.dart';
import 'package:youpeak/features/search/view/search_view.dart';
import 'package:youpeak/features/video/api/unlock_private_video_api.dart';
import 'package:youpeak/features/video/widget/video_description_bottom_sheet.dart';
import 'package:youpeak/features/video/api/video_details_api.dart';
import 'package:youpeak/features/video/model/video_details_model.dart';
import 'package:youpeak/core/theme/app_color.dart';
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

class ShortsVideoDetailsView extends StatefulWidget {
  const ShortsVideoDetailsView({super.key, required this.videoId, required this.videoUrl, this.previousPageIsSearch});

  final bool? previousPageIsSearch;
  final String videoId;
  final String videoUrl;

  @override
  State<ShortsVideoDetailsView> createState() => _ShortsVideoDetailsViewState();
}

class _ShortsVideoDetailsViewState extends State<ShortsVideoDetailsView> {
  ChewieController? chewieController;
  VideoDetailsModel? videoDetailsModel;

  RxBool isPrivateContent = false.obs;
  // Set by a successful unlock: feeds no longer carry a locked video's URL.
  String? _unlockedVideoUrl;

  VideoPlayerController? videoPlayerController;

  // Reports genuine viewing (loops, mute and background excluded) to the
  // server's watch-time ledger.
  WatchHeartbeatTracker? watchTracker;

  RxBool isVideoDetailsLoading = true.obs;
  RxBool isVideoLoading = true.obs;

  RxBool isPlaying = false.obs;
  RxBool isBuffering = false.obs;
  RxBool isShowIcon = false.obs;

  RxBool isLike = false.obs;
  RxBool isDisLike = false.obs;
  RxBool isSubscribe = false.obs;

  RxMap customChanges = {"like": 0, "disLike": 0, "comment": 0, "share": 0}.obs;

  @override
  void initState() {
    AppSettings.showLog("Video Id => ${widget.videoId}");
    getVideoDetails();
    initializeVideoPlayer();
    super.initState();
  }

  void getVideoDetails() async {
    videoDetailsModel = await VideoDetailsApi.callApi(Database.loginUserId ?? "", widget.videoId, 2);
    if (videoDetailsModel != null) {
      isSubscribe.value = videoDetailsModel?.detailsOfVideo?.isSubscribed ?? false;
      isLike.value = videoDetailsModel?.detailsOfVideo?.isLike ?? false;
      isDisLike.value = videoDetailsModel?.detailsOfVideo?.isDislike ?? false;

      customChanges["like"] = videoDetailsModel?.detailsOfVideo?.like ?? 0;
      customChanges["disLike"] = videoDetailsModel?.detailsOfVideo?.dislike ?? 0;
      customChanges["comment"] = videoDetailsModel?.detailsOfVideo?.totalComments ?? 0;
      customChanges["share"] = videoDetailsModel?.detailsOfVideo?.shareCount ?? 0;

      isPrivateContent.value = (videoDetailsModel?.detailsOfVideo?.videoPrivacyType == 2 && videoDetailsModel?.detailsOfVideo?.isSubscribed == false && videoDetailsModel?.detailsOfVideo?.userId != Database.loginUserId);

      isVideoDetailsLoading.value = false;
    }
  }

  Future<void> onCreateHistory() async {
    if (videoDetailsModel?.detailsOfVideo != null && videoPlayerController != null && Database.loginUserId != null && Database.loginUserId!.isNotEmpty) {
      final watchTime = videoPlayerController!.value.position.inSeconds;
      AppSettings.showLog("Video Watch Time => $watchTime");
      await CreateWatchHistoryApi.callApi(
        loginUserId: Database.loginUserId!,
        videoId: videoDetailsModel?.detailsOfVideo?.id ?? "",
        videoChannelId: videoDetailsModel?.detailsOfVideo?.channelId ?? "",
        videoUserId: videoDetailsModel?.detailsOfVideo?.userId ?? "",
        watchTimeInMinute: watchTime.toDouble(),
      );
    }
  }

  Future<void> initializeVideoPlayer() async {
    try {
      String? cachedPath = Database.onGetVideoUrl(widget.videoId);
      String videoPath = "";
      if (ConvertToNetwork.isValidVideoUrl(cachedPath)) {
        videoPath = cachedPath!;
      } else {
        videoPath = await ConvertToNetwork.convert(_unlockedVideoUrl ?? widget.videoUrl);
      }

      if (videoPath.isEmpty) return;

      if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
        videoPlayerController = VideoPlayerController.networkUrl(Uri.parse(videoPath));
      } else {
        videoPlayerController = LocalMedia.videoController(videoPath);
      }

      await videoPlayerController?.initialize();

      if (videoPlayerController != null && (videoPlayerController?.value.isInitialized ?? false)) {
        if (Database.onGetVideoUrl(widget.videoId) == null) {
          Database.onSetVideoUrl(widget.videoId, videoPath);
        }

        chewieController = ChewieController(
          videoPlayerController: videoPlayerController!,
          aspectRatio: AppLayout.width / Get.height,
          looping: false,
          allowedScreenSleep: false,
          allowMuting: false,
          showControlsOnInitialize: false,
          showControls: false,
        );
        watchTracker?.detach();
        watchTracker = WatchHeartbeatTracker(videoId: widget.videoId)..attach(videoPlayerController!);
        if (chewieController != null && (videoPlayerController?.value.isInitialized ?? false)) {
          isVideoLoading.value = false;
          if (isPrivateContent.value == false) onPlayVideo();
        }

        videoPlayerController?.addListener(
          () {
            if ((videoPlayerController?.value.isInitialized ?? false)) {
              videoPlayerController!.value.isBuffering ? isBuffering.value = true : isBuffering.value = false;

              if (isPrivateContent.value && isPlaying.value) onStopVideo();
            }

            AppSettings.showLog("Video Engagement Duration => ${videoPlayerController!.value.position} -- ${videoPlayerController!.value.duration}");

            if (videoPlayerController!.value.position >= videoPlayerController!.value.duration) {
              // Loop. Watch time comes from watchTracker, which skips the
              // restart jump (this used to report the short's full length as
              // watch time on every loop).
              videoPlayerController?.seekTo(Duration.zero);
              onPlayVideo();
            }
          },
        );
      }
    } catch (e) {
      onStopVideo();
      onClose();
      AppSettings.showLog("Shorts Video Initialization Failed...");
    }
  }

  // Future<void> initializeVideoPlayer() async {
  //   try {
  //     String videoPath = Database.onGetVideoUrl(widget.videoId) ?? await ConvertToNetwork.convert(widget.videoUrl);
  //     videoPlayerController = VideoPlayerController.networkUrl(Uri.parse(videoPath));
  //
  //     await videoPlayerController?.initialize();
  //
  //     if (videoPlayerController != null && (videoPlayerController?.value.isInitialized ?? false)) {
  //       chewieController = ChewieController(
  //         videoPlayerController: videoPlayerController!,
  //         aspectRatio: AppLayout.width / Get.height,
  //         autoPlay: false,
  //         looping: true,
  //         allowedScreenSleep: false,
  //         allowMuting: false,
  //         showControlsOnInitialize: false,
  //         showControls: false,
  //       );
  //       if (chewieController != null && (videoPlayerController?.value.isInitialized ?? false)) {
  //         isVideoLoading.value = false;
  //         videoPlayerController?.play();
  //         isPlaying.value = true;
  //       }
  //     }
  //   } catch (e) {
  //     onStopVideo();
  //     onClose();
  //     AppSettings.showLog("Shorts Video Initialization Failed...");
  //   }
  // }

  // void onClickLike() async {
  //   if (!isLike.value) {
  //     if (isDisLike.value) {
  //       isDisLike.value = false;
  //       customChanges["disLike"]--;
  //     }
  //     isLike.value = true;
  //     customChanges["like"]++;
  //     await LikeDisLikeVideoApi.callApi(videoDetailsModel!.detailsOfVideo!.id.toString(), true);
  //   } else {
  //     AppSettings.showLog("This Video Already Liked");
  //   }
  // }
  //
  // void onClickDisLike() async {
  //   if (!isDisLike.value) {
  //     if (isLike.value) {
  //       isLike.value = false;
  //       customChanges["like"]--;
  //     }
  //     isDisLike.value = true;
  //     customChanges["disLike"]++;
  //     await LikeDisLikeVideoApi.callApi(videoDetailsModel!.detailsOfVideo!.id.toString(), false);
  //   } else {
  //     AppSettings.showLog("This Video Already DisLiked");
  //   }
  // }

  void onClickLike() async {
    String videoId = videoDetailsModel!.detailsOfVideo!.id.toString();

    // CASE 1: Already Liked → Remove Like
    if (isLike.value) {
      isLike.value = false;
      customChanges["like"]--;

      await LikeDisLikeVideoApi.callApi(videoId, "likeremove");
      return;
    }

    // CASE 2: Disliked → Remove Dislike First
    if (isDisLike.value) {
      isDisLike.value = false;
      customChanges["disLike"]--;

      await LikeDisLikeVideoApi.callApi(videoId, "dislikeremove");
    }

    // CASE 3: Add Like
    isLike.value = true;
    customChanges["like"]++;

    await LikeDisLikeVideoApi.callApi(videoId, "like");
  }

  void onClickDisLike() async {
    String videoId = videoDetailsModel!.detailsOfVideo!.id.toString();

    // CASE 1: Already Disliked → Remove Dislike
    if (isDisLike.value) {
      isDisLike.value = false;
      customChanges["disLike"]--;

      await LikeDisLikeVideoApi.callApi(videoId, "dislikeremove");
      return;
    }

    // CASE 2: Liked → Remove Like First
    if (isLike.value) {
      isLike.value = false;
      customChanges["like"]--;

      await LikeDisLikeVideoApi.callApi(videoId, "likeremove");
    }

    // CASE 3: Add Dislike
    isDisLike.value = true;
    customChanges["disLike"]++;

    await LikeDisLikeVideoApi.callApi(videoId, "dislike");
  }

  void onClickComment() async {
    onStopVideo();

    customChanges["comment"] = await CommentBottomSheet.show(
      context,
      videoDetailsModel!.detailsOfVideo!.id!,
      videoDetailsModel!.detailsOfVideo!.channelId!,
      customChanges["comment"],
      callback: () {
        onResumeVideo();
      },
    );
  }

  void onClickShare() async {
    onStopVideo();

    // CustomShare.share(
    //   name: videoDetailsModel!.detailsOfVideo!.title!,
    //   url: videoDetailsModel!.detailsOfVideo!.videoUrl!,
    //   channelId: videoDetailsModel!.detailsOfVideo!.channelId!,
    //   videoId: videoDetailsModel!.detailsOfVideo!.id!,
    //   image: videoDetailsModel!.detailsOfVideo!.videoImage!,
    //   pageRoutes: "ShortsVideo",
    // );

    await CommonShare.onShare(
      url: videoDetailsModel?.detailsOfVideo?.videoUrl ?? "",
      channelId: videoDetailsModel?.detailsOfVideo?.channelId ?? "",
      id: videoDetailsModel?.detailsOfVideo?.id ?? "",
      image: videoDetailsModel?.detailsOfVideo?.videoImage ?? "",
      title: videoDetailsModel?.detailsOfVideo?.title ?? "",
      pageRoutes: "ShortsVideo",
    );

    if (videoDetailsModel?.detailsOfVideo?.id != null) {
      await ShareCountApiClass.callApi(Database.loginUserId ?? "", videoDetailsModel!.detailsOfVideo!.id.toString());
    }

    customChanges["share"] = (customChanges["share"] ?? 0) + 1;
  }

  void onClickMoreOption() async {
    onStopVideo();
    AppSheet.show(
      backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
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
                widget: const ImageIcon(AssetImage(AppIcons.document), size: 23),
                name: AppStrings.description.tr,
                onTap: () {
                  Get.back();
                  DescriptionBottomSheet.show(
                    videoDetailsModel!.detailsOfVideo!.channelId!,
                    videoDetailsModel!.detailsOfVideo!.title!,
                    videoDetailsModel!.detailsOfVideo!.channelImage!,
                    videoDetailsModel!.detailsOfVideo!.channelName!,
                    customChanges["like"],
                    customChanges["disLike"],
                    videoDetailsModel!.detailsOfVideo!.views!.toInt(),
                    videoDetailsModel!.detailsOfVideo!.createdAt!,
                    videoDetailsModel!.detailsOfVideo!.hashTag!.join(','),
                    videoDetailsModel!.detailsOfVideo!.description!,
                  );
                },
              ),
              const SizedBox(height: 15),
              BottomShitButton(
                widget: const ImageIcon(AssetImage(AppIcons.closeSquare), size: 23),
                name: "${AppStrings.report.tr}-${AppStrings.block.tr}",
                onTap: () {
                  Get.back();
                  CustomReportView.show(videoDetailsModel!.detailsOfVideo!.id!);
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
    // Get.to(PreviewShortsChannelView(channelId: videoDetailsModel!.detailsOfVideo!.channelId!));
    Get.to(() => YourChannelView(loginUserId: Database.loginUserId ?? "", channelId: videoDetailsModel?.detailsOfVideo?.channelId ?? ""));
  }

  void onClickSearch() async {
    onStopVideo();
    if (widget.previousPageIsSearch == true) {
      Get.back();
    } else {
      Get.to(const SearchView(isSearchShorts: true));
    }
  }

  void onClickSubscribe() async {
    if (isPrivateContent.value && isSubscribe.value == false) {
      onSubscribePrivateChannel();
    } else {
      isSubscribe.value = !isSubscribe.value;
      await SubscribeChannelApiClass.callApi(videoDetailsModel!.detailsOfVideo!.channelId.toString());
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
    onCreateHistory();
    onClose();
    super.dispose();
  }

  void onStopVideo() {
    isPlaying.value = false;
    chewieController?.pause();
  }

  void onResumeVideo() {
    isPlaying.value = false;
    chewieController?.play();
  }

  void onPlayVideo() {
    isPlaying.value = true;
    videoPlayerController?.play();
  }

  void onClose() {
    try {
      watchTracker?.detach();
      watchTracker = null;
      videoPlayerController?.dispose();
      chewieController?.dispose();
      chewieController = null;
      videoPlayerController = null;
      isVideoLoading.value = true;
    } catch (e) {
      AppSettings.showLog(">>>> On Close Method Error => $e");
    }
  }

  void onUnlockPrivateVideo() async {
    UnlockPremiumVideoBottomSheet.onShow(
      coin: (videoDetailsModel?.detailsOfVideo?.videoUnlockCost ?? 0).toString(),
      callback: () async {
        Get.dialog(const LoaderUi(), barrierDismissible: false);
        await UnlockPrivateVideoApi.callApi(loginUserId: Database.loginUserId ?? "", videoId: videoDetailsModel?.detailsOfVideo?.id ?? "");

        /// 🔹 ALWAYS close loader first
        if (Get.isDialogOpen ?? false) {
          Get.back();
        }
        if (UnlockPrivateVideoApi.unlockPrivateVideoModel?.isUnlocked == true) {
          isPrivateContent.value = false;
          final unlockedUrl = UnlockPrivateVideoApi.unlockPrivateVideoModel?.videoUrl;
          if (unlockedUrl != null && unlockedUrl.isNotEmpty && videoPlayerController == null) {
            _unlockedVideoUrl = unlockedUrl;
            await initializeVideoPlayer();
          }

          /// 🔹 ALWAYS close loader first
          if (Get.isBottomSheetOpen ?? false) {
            Get.back();
          }
          SubscribedSuccessDialog.show(context);
        }

        CustomToast.show(UnlockPrivateVideoApi.unlockPrivateVideoModel?.message ?? "");
      },
    );
  }

  void onSubscribePrivateChannel() async {
    SubscribePremiumChannelBottomSheet.onShow(
      coin: (videoDetailsModel?.detailsOfVideo?.subscriptionCost ?? 0).toString(),
      callback: () async {
        Get.dialog(const LoaderUi(), barrierDismissible: false);
        final bool isSuccess = await SubscribeChannelApiClass.callApi(videoDetailsModel?.detailsOfVideo?.channelId ?? "");
        Get.close(2);
        if (isSuccess) {
          isPrivateContent.value = false;
          isSubscribe.value = true;
          SubscribedSuccessDialog.show(context);
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Obx(
        () => isVideoLoading.value || isVideoDetailsLoading.value || videoPlayerController == null
            ? const ShortVideoShimmerUi()
            : isPrivateContent.value
                ? ShortsPrivateContentWidget(
                    id: videoDetailsModel?.detailsOfVideo?.id ?? "",
                    image: videoDetailsModel?.detailsOfVideo?.videoImage ?? "",
                    subscribeCoin: videoDetailsModel?.detailsOfVideo?.subscriptionCost ?? 0,
                    unlockCoin: videoDetailsModel?.detailsOfVideo?.videoUnlockCost ?? 0,
                    subscribe: () {
                      onSubscribePrivateChannel();
                    },
                    unlock: () {
                      onUnlockPrivateVideo();
                    },
                  )
                : ShortsDetailsUi(
                    isBack: true,
                    isShowIcon: isShowIcon.value,
                    isBuffering: isBuffering.value,
                    isInitialize: isVideoLoading.value,
                    isPlaying: isPlaying.value,
                    isLike: isLike.value,
                    isDislike: isDisLike.value,
                    isSubscribe: isSubscribe.value,
                    channelId: videoDetailsModel?.detailsOfVideo?.channelId ?? "",

                    video: SizedBox(
                      height: Get.height,
                      width: AppLayout.width,
                      child: Obx(
                        () => isVideoLoading.value
                            ? const LoaderUi(color: Colors.white)
                            : SizedBox.expand(
                                child: FittedBox(
                                  fit: BoxFit.cover,
                                  child: SizedBox(
                                    width: videoPlayerController?.value.size.width ?? 0,
                                    height: videoPlayerController?.value.size.height ?? 0,
                                    child: Chewie(controller: chewieController!),
                                  ),
                                ),
                              ),
                        // Chewie(controller: chewieController!)
                      ),
                    ),

                    // Container(
                    //   height: Get.height,
                    //   width: AppLayout.width,
                    //   color: AppColors.black,
                    //   child: isVideoLoading.value ? const LoaderUi(color: Colors.white) : Chewie(controller: chewieController!),
                    // ),
                    isPaginationLoading: false,
                    like: CustomFormatNumber.convert(customChanges["like"]),
                    disLike: CustomFormatNumber.convert(customChanges["disLike"]),
                    comment: CustomFormatNumber.convert(customChanges["comment"]),
                    share: CustomFormatNumber.convert(customChanges["share"]),
                    title: videoDetailsModel!.detailsOfVideo!.title!,
                    hasTag: videoDetailsModel!.detailsOfVideo!.hashTag!.join(','),
                    channelName: videoDetailsModel!.detailsOfVideo!.channelName!,
                    channelImage: PreviewProfileImage(
                      size: 30,
                      id: videoDetailsModel?.detailsOfVideo?.channelId ?? "",
                      image: videoDetailsModel?.detailsOfVideo?.channelImage ?? "",
                      fit: BoxFit.cover,
                    ),

                    onClickVideo: onClickVideo,
                    onClickLike: onClickLike,
                    onClickDisLike: onClickDisLike,
                    onClickShare: onClickShare,
                    onClickProfile: onClickProfile,
                    onClickMoreOption: onClickMoreOption,
                    onClickSearch: onClickSearch,
                    onClickCamera: onClickCamera,
                    onClickComment: onClickComment,
                    onClickSubscribe: onClickSubscribe,
                    onClickPlayPause: onClickPlayPause,
                  ),
      ),
    );
  }
}

class ShortsDetailsUi extends StatelessWidget {
  const ShortsDetailsUi({
    super.key,
    required this.isShowIcon,
    required this.isBuffering,
    required this.isInitialize,
    required this.isPlaying,
    required this.isLike,
    required this.isDislike,
    required this.isSubscribe,
    required this.video,
    required this.onClickVideo,
    required this.onClickLike,
    required this.onClickDisLike,
    required this.onClickShare,
    required this.onClickProfile,
    required this.onClickMoreOption,
    required this.onClickSearch,
    required this.onClickCamera,
    required this.onClickComment,
    required this.isPaginationLoading,
    required this.title,
    required this.hasTag,
    required this.channelName,
    required this.channelImage,
    required this.like,
    required this.disLike,
    required this.comment,
    required this.share,
    required this.onClickSubscribe,
    required this.onClickPlayPause,
    required this.isBack,
    required this.channelId,
  });

  final bool isShowIcon;
  final bool isBuffering;
  final bool isInitialize;
  final bool isPlaying;
  final bool isLike;
  final bool isDislike;
  final bool isSubscribe;
  final bool isPaginationLoading;

  final String title;
  final String hasTag;
  final String channelName;
  final String channelId;
  final String like;
  final String disLike;
  final String comment;
  final String share;

  final Widget video;
  final Widget channelImage;

  final Callback onClickVideo;
  final Callback onClickLike;
  final Callback onClickDisLike;
  final Callback onClickShare;
  final Callback onClickProfile;
  final Callback onClickMoreOption;
  final Callback onClickSearch;
  final Callback onClickCamera;
  final Callback onClickComment;
  final Callback onClickSubscribe;
  final Callback onClickPlayPause;

  final bool isBack;

  @override
  Widget build(BuildContext context) {
    Timer(const Duration(milliseconds: 300), () {
      SystemChrome.setSystemUIOverlayStyle(
        const SystemUiOverlayStyle(
          statusBarIconBrightness: Brightness.light,
          statusBarColor: Colors.transparent,
          systemNavigationBarDividerColor: AppColor.black,
          systemNavigationBarColor: AppColor.black,
        ),
      );
    });
    return Stack(
      children: [
        video,
        Positioned(
          // Logo Water Mark Code
          top: MediaQuery.of(context).viewPadding.top + 55,
          left: 15,
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
        GestureDetector(
          onTap: onClickVideo,
          child: Container(
            height: Get.height,
            width: AppLayout.width,
            color: Colors.black.withOpacity(0.2),
          ),
        ),
        isShowIcon
            ? Align(
                alignment: Alignment.center,
                child: GestureDetector(
                  onTap: onClickPlayPause,
                  child: Container(
                    height: 60,
                    width: 60,
                    padding: EdgeInsets.only(left: isPlaying ? 0 : 5),
                    decoration: BoxDecoration(color: AppColor.black.withOpacity(0.2), shape: BoxShape.circle),
                    child: Center(
                      child: Image.asset(isPlaying ? AppIcons.pause : AppIcons.videoPlay, width: 25, height: 25, color: AppColor.white),
                    ),
                  ),
                ),
              )
            : const Offstage(),
        Visibility(visible: isBuffering, child: const LoaderUi()),
        Padding(
          padding: EdgeInsets.only(left: 15, right: 15, top: SizeConfig.screenHeight / 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              isBack
                  ? GestureDetector(
                      onTap: () => Get.back(),
                      child: Image.asset(
                        AppIcons.arrowBack,
                        color: AppColor.white,
                        width: 20,
                      ),
                    )
                  : const Offstage(),
              const Spacer(),
              IconButtonUi(
                callback: onClickSearch,
                icon: const ImageIcon(AssetImage(AppIcons.search), color: AppColor.white, size: 22),
              ),
              const SizedBox(width: 15),
              IconButtonUi(
                callback: onClickCamera,
                icon: const ImageIcon(AssetImage(AppIcons.camera), color: AppColor.white, size: 30),
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
              IconButtonUi(callback: onClickLike, icon: ImageIcon(const AssetImage(AppIcons.likeBold), color: isLike ? AppColor.primaryColor : AppColor.white, size: 25)),
              Text(like, style: GoogleFonts.urbanist(color: AppColor.white)),
              const SizedBox(height: 15),
              IconButtonUi(callback: onClickDisLike, icon: ImageIcon(const AssetImage(AppIcons.disLikeBold), color: isDislike ? AppColor.primaryColor : AppColor.white, size: 25)),
              Text(disLike, style: GoogleFonts.urbanist(color: AppColor.white)),
              const SizedBox(height: 15),
              IconButtonUi(callback: onClickComment, icon: const ImageIcon(AssetImage(AppIcons.comments), color: AppColor.white, size: 30)),
              Text(comment, style: GoogleFonts.urbanist(color: AppColor.white)),
              const SizedBox(height: 15),
              IconButtonUi(callback: onClickShare, icon: const ImageIcon(AssetImage(AppIcons.boldShare), color: AppColor.white, size: 30)),
              Text(share, style: GoogleFonts.urbanist(color: AppColor.white)),
              const SizedBox(height: 15),
              IconButtonUi(callback: onClickMoreOption, icon: const ImageIcon(AssetImage(AppIcons.moreCircle), color: AppColor.white, size: 30)),
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
              SizedBox(
                width: SizeConfig.screenWidth / 1.8,
                child: Text(title, style: GoogleFonts.urbanist(fontSize: 15, color: AppColor.white), maxLines: 3),
              ),
              SizedBox(
                width: SizeConfig.screenWidth / 1.8,
                child: Text(hasTag, style: GoogleFonts.urbanist(fontSize: 14, color: AppColor.white), maxLines: 3),
              ),
              SizedBox(height: SizeConfig.blockSizeVertical * 2),
              Row(
                children: [
                  IconButtonUi(
                    callback: onClickProfile,
                    icon: Container(
                      height: 30,
                      width: 30,
                      clipBehavior: Clip.antiAlias,
                      decoration: const BoxDecoration(shape: BoxShape.circle),
                      child: channelImage,
                    ),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    channelName,
                    style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(width: 10),
                  Visibility(
                    visible: Database.channelId != channelId,
                    child: GestureDetector(
                      onTap: onClickSubscribe,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isSubscribe ? Colors.transparent : AppColor.primaryColor,
                          borderRadius: BorderRadius.circular(25),
                          border: Border.all(color: AppColor.primaryColor),
                        ),
                        child: Text(
                          isSubscribe ? AppStrings.subscribed.tr : AppStrings.subscribe.tr,
                          style: GoogleFonts.urbanist(
                            color: isSubscribe ? AppColor.primaryColor : AppColor.white,
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
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
        Visibility(
          visible: isPaginationLoading,
          child: Align(
            alignment: Alignment.bottomCenter,
            child: LinearProgressIndicator(
              color: AppColor.primaryColor,
              backgroundColor: AppColor.grey_300,
            ),
          ),
        ),
      ],
    );
  }
}
