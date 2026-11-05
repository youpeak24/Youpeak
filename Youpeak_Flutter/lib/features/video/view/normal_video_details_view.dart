import 'package:youpeak/shared/dialogs/app_sheet.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:youpeak/features/peak_boost/presentation/peak_boost_button.dart';
import 'dart:async';
import 'dart:math' as math;
import 'dart:developer';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:chewie/chewie.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/ads/google_large_native_ad.dart';
import 'package:youpeak/features/video/api/like_dislike_api.dart';
import 'package:youpeak/core/utils/custom_download.dart';
import 'package:youpeak/core/utils/custom_format_number.dart';
import 'package:youpeak/core/utils/custom_format_timer.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/shared/widgets/normal_video_ui.dart';
import 'package:youpeak/shared/widgets/premium_plan_dialog.dart';
import 'package:youpeak/shared/shimmer/normal_video_shimmer_ui.dart';
import 'package:youpeak/features/video/widget/video_details_shimmer_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/storage/database/download_history_database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/notification/local_notification_services.dart';
import 'package:youpeak/features/comments/widget/comment_bottom_sheet.dart';
import 'package:youpeak/features/report/view/custom_report_view.dart';
import 'package:youpeak/features/video/api/share_count_api.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/home/controller/nav_home_controller.dart';
import 'package:youpeak/features/library/view/download_view.dart';
import 'package:youpeak/features/library/api/create_watch_later_api.dart';
import 'package:youpeak/features/subscriptions/api/subscribe_channel_api.dart';
import 'package:youpeak/features/channel/view/your_channel_view.dart';
import 'package:youpeak/features/video/api/unlock_private_video_api.dart';
import 'package:youpeak/features/video/controller/normal_video_details_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/services/convert_to_network.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/shared/widgets/common_share.dart';
import 'package:youpeak/shared/widgets/subscribe_premium_channel_bottom_sheet.dart';
import 'package:youpeak/shared/widgets/subscribed_success_dialog.dart';
import 'package:youpeak/shared/widgets/unlock_premium_video_bottom_sheet.dart';
import 'package:path_provider/path_provider.dart';
import 'package:video_thumbnail/video_thumbnail.dart';
import 'package:youpeak/core/platform/platform_info.dart';
import 'package:youpeak/core/platform/web_video_fullscreen.dart';
import 'package:youpeak/features/video/widget/web_video_controls.dart';
import 'package:youpeak/features/video/api/video_engagement_api.dart';
import 'package:youpeak/features/video/model/video_details_model.dart';
import 'package:youpeak/features/edit_video/view/edit_video_view.dart';
import 'package:youpeak/core/platform/platform_pip_switcher.dart';

class NormalVideoDetailsView extends StatefulWidget {
  const NormalVideoDetailsView(
      {super.key,
      required this.videoId,
      required this.videoUrl,
      this.isPlayList,
      this.cost});

  final String videoId;
  final String videoUrl;
  final bool? isPlayList;
  final num? cost;

  @override
  State<NormalVideoDetailsView> createState() => _NormalVideoDetailsViewState();
}

class _NormalVideoDetailsViewState extends State<NormalVideoDetailsView> {
  final navHomeController = Get.find<NavHomeController>();

  final _controller = Get.put(NormalVideoDetailsController());

  @override
  void initState() {
    print("widget.videoUrl${widget.videoUrl}");
    _controller.mainRelatedVideos = null;
    _controller.mainWatchedVideos.clear();

    _controller.init(widget.videoId, widget.videoUrl);

    _controller.selectedWatchedVideo = 0;
    _controller.mainWatchedVideos.add(
        WatchedVideoModel(videoId: widget.videoId, videoUrl: widget.videoUrl));

    _controller.isDisablePrevious(true);

    if (widget.isPlayList ?? false) {
      _controller.isDisableNext(false);
      _controller.onGetPlayListVideos();
    } else {}
    super.initState();
  }

  @override
  void dispose() {
    _controller.onCreateHistory();
    _controller.onDisposeVideoPlayer();
    super.dispose();
  }

  void onSubscribePrivateChannel({required int index}) {
    SubscribePremiumChannelBottomSheet.onShow(
      coin: (_controller.mainRelatedVideos?[index].user?.subscriptionCost ?? 0)
          .toString(),
      callback: () async {
        Get.dialog(const LoaderUi(), barrierDismissible: false);
        final bool isSuccess = await SubscribeChannelApiClass.callApi(
            _controller.mainRelatedVideos?[index].channelId ?? "");

        Get.close(2);

        if (isSuccess) {
          _controller.mainRelatedVideos =
              _controller.mainRelatedVideos?.map((e) {
            if (e.id == _controller.mainRelatedVideos?[index].id) {
              e.videoPrivacyType = 1;
            }
            return e;
          }).toList();

          _controller.update(["onGetRelatedVideos"]);
          SubscribedSuccessDialog.show(context);
        }
      },
    );
  }

  void onUnlockPrivateVideo({required int index}) {
    UnlockPremiumVideoBottomSheet.onShow(
      coin: (_controller.mainRelatedVideos?[index].user?.videoUnlockCost ?? 0)
          .toString(),
      callback: () async {
        Get.dialog(const LoaderUi(), barrierDismissible: false);
        await UnlockPrivateVideoApi.callApi(
            loginUserId: Database.loginUserId ?? "",
            videoId: _controller.mainRelatedVideos?[index].id ?? "");

        /// 🔹 ALWAYS close loader first
        if (Get.isDialogOpen ?? false) {
          Get.back();
        }
        if (UnlockPrivateVideoApi.unlockPrivateVideoModel?.isUnlocked == true) {
          _controller.mainRelatedVideos =
              _controller.mainRelatedVideos?.map((e) {
            if (e.id == _controller.mainRelatedVideos?[index].id) {
              e.videoPrivacyType = 1;
            }
            return e;
          }).toList();

          /// 🔹 ALWAYS close loader first
          if (Get.isBottomSheetOpen ?? false) {
            Get.back();
          }
          _controller.update(["onGetRelatedVideos"]);
          SubscribedSuccessDialog.show(context);
        }
        // if (Get.isBottomSheetOpen ?? false) {
        //   Get.back();
        // }

        CustomToast.show(
            UnlockPrivateVideoApi.unlockPrivateVideoModel?.message ?? "");
      },
    );
  }

  // Which player layout to show: landscape is the fullscreen player. In the
  // web app fullscreen is a mode the viewer turns on (a desktop window is
  // wider than tall, and must not open the fullscreen player); phones in a
  // browser still go fullscreen when rotated.
  Orientation _playerOrientation(Orientation physical, {required bool webFullscreen}) {
    if (!PlatformInfo.isWeb) return physical;
    if (webFullscreen) return Orientation.landscape;
    return !AppLayout.isWideWeb && physical == Orientation.landscape ? Orientation.landscape : Orientation.portrait;
  }

  @override
  Widget build(BuildContext context) {
    Timer(const Duration(milliseconds: 300), () {
      SystemChrome.setSystemUIOverlayStyle(
        const SystemUiOverlayStyle(
          statusBarIconBrightness: Brightness.light,
          statusBarColor: Colors.transparent,
        ),
      );
    });
    return Obx(() {
      final webFullscreen = WebVideoFullscreen.active.value;
      final pageOrientation = _playerOrientation(MediaQuery.of(context).orientation, webFullscreen: webFullscreen);

      return PopScope(
        onPopInvoked: (didPop) async {
          // Back in web fullscreen leaves fullscreen instead of the page.
          if (!didPop && WebVideoFullscreen.active.value) {
            WebVideoFullscreen.exit();
            return;
          }

          SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: [SystemUiOverlay.top, SystemUiOverlay.bottom]);
          await SystemChrome.setPreferredOrientations([
            DeviceOrientation.portraitUp,
            DeviceOrientation.portraitDown,
          ]);
        },
        canPop: pageOrientation != Orientation.landscape,
        child: PlatformPiPSwitcher(
          childWhenEnabled: GetBuilder<NormalVideoDetailsController>(
            id: "onVideoInitialize",
            builder: (controller) => (_controller.chewieController != null && (_controller.videoPlayerController?.value.isInitialized ?? false))
                ? SizedBox.expand(
                    child: FittedBox(
                      fit: BoxFit.cover,
                      child: SizedBox(
                        width: _controller.videoPlayerController?.value.size.width ?? 0,
                        height: _controller.videoPlayerController?.value.size.height ?? 0,
                        child: Chewie(controller: _controller.chewieController!),
                      ),
                    ),
                  )
                : const Offstage(),
          ),
          childWhenDisabled: Scaffold(
            body: OrientationBuilder(builder: (context, physicalOrientation) {
              final orientation = _playerOrientation(physicalOrientation, webFullscreen: webFullscreen);
              AppSettings.showLog("Current Orientation => $orientation");

              if (orientation == Orientation.portrait && AppLayout.isWideWeb) return _buildWide();

              return Column(
                children: [
                  PreviewVideoUi(orientation: orientation),
                  orientation == Orientation.landscape
                      ? const Offstage()
                      : Expanded(
                          child: SingleChildScrollView(
                            controller: _controller.scrollController,
                            child: Column(
                              children: [
                                VideoDetailsUi(cost: widget.cost ?? 0),
                                _relatedVideos(),
                              ],
                            ),
                          ),
                        ),
                ],
              );
            }),
          ),
        ),
      );
    });
  }

  // Desktop browser layout: the player and details, with the related videos
  // in a column beside them (below them in a medium window).
  Widget _buildWide() {
    return LayoutBuilder(
      builder: (context, constraints) {
        const gap = 24.0;
        const sideWidth = 402.0;
        final twoColumns = constraints.maxWidth >= 1100;
        final available = constraints.maxWidth - 2 * gap;
        final mainWidth = twoColumns ? math.min(available - gap - sideWidth, 1280.0) : math.min(available, 960.0);
        final playerHeight = math.min(mainWidth * 9 / 16, constraints.maxHeight * 0.75);

        final main = Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: PreviewVideoUi(orientation: Orientation.portrait, width: mainWidth, height: playerHeight),
            ),
            const SizedBox(height: 8),
            VideoDetailsUi(cost: widget.cost ?? 0),
            if (!twoColumns) _relatedVideos(tileWidth: mainWidth),
          ],
        );

        return SingleChildScrollView(
          controller: _controller.scrollController,
          padding: const EdgeInsets.all(gap),
          child: twoColumns
              ? Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(width: mainWidth, child: main),
                    const SizedBox(width: gap),
                    SizedBox(width: sideWidth, child: _relatedVideos(tileWidth: sideWidth)),
                  ],
                )
              : Center(child: SizedBox(width: mainWidth, child: main)),
        );
      },
    );
  }

  // Related videos under the details (phone), or in the wide layout's side
  // column, where [tileWidth] gives the cards 16:9 thumbnails.
  Widget _relatedVideos({double? tileWidth}) {
    final list = GetBuilder<NormalVideoDetailsController>(
                                id: "onGetRelatedVideos",
                                builder: (controller) => controller.relatedVideosFailed
                                    ? _RelatedNote(
                                        text: "Related videos couldn't load.",
                                        action: TextButton.icon(
                                          onPressed: () => controller.onGetRelatedVideos(controller.videoId),
                                          icon: const AppIcon(AppIcons.extraRetry, size: 20),
                                          label: const Text("Retry"),
                                        ),
                                      )
                                    : controller
                                            .mainRelatedVideos ==
                                        null
                                    ? const NormalVideoShimmerUi()
                                        .paddingOnly(top: 10)
                                    : controller.mainRelatedVideos!.isEmpty
                                        ? const _RelatedNote(text: "No related videos yet.")
                                        : ListView.builder(
                                            shrinkWrap: true,
                                            physics:
                                                const NeverScrollableScrollPhysics(),
                                            itemCount: controller
                                                    .mainRelatedVideos
                                                    ?.length ??
                                                0,
                                            itemBuilder: (context, index) {
                                              final indexData = controller
                                                  .mainRelatedVideos![index];

                                              return (indexData.channelId != Database.channelId &&
                                                      ((indexData.videoPrivacyType == 2 && indexData.user?.channelType == 1) ||
                                                      (indexData.videoPrivacyType == 2 && indexData.user?.channelType == 2 && indexData.isSubscribedChannel == false)))
                                                  ? PrivateContentNormalVideoUi(
                                                      videoId:
                                                          indexData.id ?? "",
                                                      title:
                                                          indexData.title ?? "",
                                                      videoImage: indexData
                                                              .videoImage ??
                                                          "",
                                                      videoUrl:
                                                          indexData.videoUrl ??
                                                              "",
                                                      videoTime: indexData
                                                              .videoTime
                                                              ?.toInt() ??
                                                          0,
                                                      channelId:
                                                          indexData.channelId ??
                                                              "",
                                                      channelImage: indexData
                                                              .user?.image ??
                                                          "",
                                                      channelName: indexData
                                                              .user?.fullName ??
                                                          "",
                                                      views: indexData
                                                              .totalViews ??
                                                          0,
                                                      uploadTime:
                                                          indexData.time ?? "",
                                                      isSave: controller
                                                              .mainRelatedVideos?[
                                                                  index]
                                                              .isSavedToWatchLater ??
                                                          false,
                                                      subscribeCallback: () =>
                                                          onSubscribePrivateChannel(
                                                              index: index),
                                                      videoCallback: () =>
                                                          onUnlockPrivateVideo(
                                                              index: index),
                                                      videoCost: indexData.user
                                                              ?.videoUnlockCost
                                                              ?.toInt() ??
                                                          0,
                                                      subscribeCost: indexData
                                                              .user
                                                              ?.subscriptionCost
                                                              ?.toInt() ??
                                                          0,
                                                      channelType: indexData
                                                              .user
                                                              ?.channelType ??
                                                          1,
                                                    )
                                                  : GestureDetector(
                                                      onTap: () {
                                                        controller
                                                            .onCreateHistory();
                                                        controller
                                                            .onDisposeVideoPlayer();
                                                        controller
                                                            .isDisablePrevious(
                                                                false);
                                                        controller
                                                            .selectedWatchedVideo++;
                                                        controller
                                                            .mainWatchedVideos
                                                            .insert(
                                                          controller
                                                              .selectedWatchedVideo,
                                                          WatchedVideoModel(
                                                              videoId: controller
                                                                  .mainRelatedVideos![
                                                                      index]
                                                                  .id!,
                                                              videoUrl: controller
                                                                  .mainRelatedVideos![
                                                                      index]
                                                                  .videoUrl!),
                                                        );
                                                        controller.init(
                                                            controller
                                                                .mainRelatedVideos![
                                                                    index]
                                                                .id!,
                                                            controller
                                                                .mainRelatedVideos![
                                                                    index]
                                                                .videoUrl!);
                                                        controller
                                                                .mainRelatedVideos =
                                                            null;
                                                        controller.update([
                                                          "onGetRelatedVideos"
                                                        ]);
                                                      },
                                                      child: Column(
                                                        children: [
                                                          NormalVideoUi(
                                                            videoId: controller
                                                                .mainRelatedVideos![
                                                                    index]
                                                                .id!,
                                                            title: controller
                                                                .mainRelatedVideos![
                                                                    index]
                                                                .title!,
                                                            videoImage: controller
                                                                .mainRelatedVideos![
                                                                    index]
                                                                .videoImage!,
                                                            videoUrl: controller
                                                                .mainRelatedVideos![
                                                                    index]
                                                                .videoUrl!,
                                                            videoTime: controller
                                                                .mainRelatedVideos![
                                                                    index]
                                                                .videoTime!
                                                                .toInt(),
                                                            channelId: controller
                                                                .mainRelatedVideos![
                                                                    index]
                                                                .channelId!,
                                                            channelImage: controller
                                                                .mainRelatedVideos![
                                                                    index]
                                                                .user!
                                                                .image!,
                                                            channelName: controller
                                                                .mainRelatedVideos![
                                                                    index]
                                                                .user!
                                                                .fullName!,
                                                            views: controller
                                                                .mainRelatedVideos![
                                                                    index]
                                                                .totalViews!,
                                                            isSave: controller
                                                                    .mainRelatedVideos![
                                                                        index]
                                                                    .isSavedToWatchLater ??
                                                                false,
                                                          ),
                                                          index != 0 &&
                                                                  index %
                                                                          AppSettings
                                                                              .showAdsIndex ==
                                                                      0
                                                              ? const GoogleLargeNativeAd()
                                                              : const Offstage()
                                                        ],
                                                      ),
                                                    );
                                            },
                                          ),
                              );
    return tileWidth == null ? list : VideoGridScope(tileWidth: tileWidth, child: list);
  }
}

// Compact empty / failed state for the related videos list.
class _RelatedNote extends StatelessWidget {
  const _RelatedNote({required this.text, this.action});

  final String text;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Related videos", style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(text, style: GoogleFonts.urbanist(fontSize: 14, color: Colors.grey)),
          if (action != null) action!,
        ],
      ),
    );
  }
}

class PreviewVideoUi extends StatelessWidget {
  const PreviewVideoUi({super.key, required this.orientation, this.width, this.height});

  // Landscape is the fullscreen player (a rotated phone, or fullscreen in
  // the web app).
  final Orientation orientation;

  // Size of the inline player; the phone layout's full-width strip if null.
  final double? width;
  final double? height;

  @override
  Widget build(BuildContext context) {
    final fullscreen = orientation == Orientation.landscape;
    // Browser: the page's real width at 16:9 (tablets got a 600-px player
    // with black bars). The phone app keeps its sizing.
    final pageWidth = MediaQuery.sizeOf(context).width;
    final playerWidth = fullscreen ? AppLayout.windowWidth : (width ?? (PlatformInfo.isWeb ? pageWidth : AppLayout.width));
    final playerHeight = fullscreen
        ? Get.height
        : (height ?? (PlatformInfo.isWeb ? math.min(pageWidth * 9 / 16, Get.height * 0.6) : Get.height / 3.5));

    return GetBuilder<NormalVideoDetailsController>(
      id: "onVideoInitialize",
      builder: (controller) => Database.channelId !=
                  controller.videoDetailsModel?.detailsOfVideo?.channelId &&
              ((controller.videoDetailsModel?.detailsOfVideo
                              ?.videoPrivacyType ==
                          2 &&
                      controller
                              .videoDetailsModel?.detailsOfVideo?.channelType ==
                          1) ||
                  (controller.videoDetailsModel?.detailsOfVideo
                              ?.videoPrivacyType ==
                          2 &&
                      controller
                              .videoDetailsModel?.detailsOfVideo?.channelType ==
                          2 &&
                      controller.isSubscribe.value == false))
          ? Container(
              height: playerHeight,
              width: playerWidth,
              color: AppColor.black,
              alignment: Alignment.center,
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.lock_rounded, color: AppColor.white, size: 36),
                  const SizedBox(height: 10),
                  Text(
                    controller.videoDetailsModel?.detailsOfVideo?.channelType == 2
                        ? "This video is for the channel's subscribers. Subscribe below to watch it."
                        : "This is a premium video. Unlock it below to watch it.",
                    textAlign: TextAlign.center,
                    style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 15, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            )
          : (controller.chewieController != null &&
                  (controller.videoPlayerController?.value.isInitialized ??
                      false))
              ? GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  // The web controls handle their own pointer input.
                  onTap: PlatformInfo.isWeb ? null : () => controller.showVideoControls(),
                  child: Container(
                    height: playerHeight,
                    width: playerWidth,
                    clipBehavior: Clip.antiAlias,
                    decoration: const BoxDecoration(color: AppColor.black),
                    child: Stack(
                      clipBehavior: Clip.antiAlias,
                      children: [
                        GetBuilder<NormalVideoDetailsController>(
                          id: "adComplete",
                          builder: (controller) {
                            return Stack(
                              children: [
                                // Main video container
                                SizedBox(
                                  height: playerHeight,
                                  width: playerWidth,
                                  child: Container(
                                    color: Colors.black,
                                    child: SizedBox.expand(
                                      child: FittedBox(
                                        // Whole picture, letterboxed: cover
                                        // cropped the sides of wide videos
                                        // and most of a portrait one.
                                        fit: BoxFit.contain,
                                        child: Visibility(
                                          visible: !controller.showAd,
                                          // Hide video during ad
                                          child: SizedBox(
                                            width: controller
                                                    .videoPlayerController
                                                    ?.value
                                                    .size
                                                    .width ??
                                                0,
                                            height: controller
                                                    .videoPlayerController
                                                    ?.value
                                                    .size
                                                    .height ??
                                                0,
                                            child: controller
                                                        .chewieController !=
                                                    null
                                                ? Chewie(
                                                    controller: controller
                                                        .chewieController!)
                                                : const CircularProgressIndicator(
                                                    color:
                                                        AppColor.primaryColor,
                                                  ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),

                                ///ad show
                                if (controller.showAd)
                                  Positioned.fill(
                                    child: Offstage(
                                      offstage: !controller.showAd,
                                      child: controller.adShowCount == 0
                                          ? controller
                                              .preRollAdWidget // Pre-roll ad
                                          : controller
                                              .midRollAdWidget, // Mid-roll ad
                                    ),
                                  ),
                              ],
                            );
                          },
                        ),
                        Positioned(
                          // Logo Water Mark Code
                          top: MediaQuery.of(context).viewPadding.top + 40,
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
                        // Browser: mouse/touch/keyboard controls of their own.
                        if (PlatformInfo.isWeb)
                          Positioned.fill(
                            child: GetBuilder<NormalVideoDetailsController>(
                              id: "onShowControls",
                              builder: (controller) => WebVideoControls(
                                controller: controller,
                                fullscreen: orientation == Orientation.landscape,
                                title: controller.videoDetailsModel?.detailsOfVideo?.title,
                                onBack: orientation == Orientation.landscape
                                    ? WebVideoFullscreen.exit
                                    : (AppLayout.isWideWeb ? null : () => Get.back()),
                              ),
                            ),
                          ),
                        if (!PlatformInfo.isWeb)
                        GetBuilder<NormalVideoDetailsController>(
                          id: "onShowControls",
                          builder: (controller) => Visibility(
                            visible: controller.isShowVideoControls &&
                                !controller.showAd,
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                Align(
                                  alignment: Alignment.center,
                                  child:
                                      GetBuilder<NormalVideoDetailsController>(
                                    id: "onLoading",
                                    builder: (controller) =>
                                        controller.isVideoLoading
                                            ? const SpinKitCircle(
                                                color: AppColor.transparent,
                                                size: 60)
                                            : const Offstage(),
                                  ),
                                ),
                                Positioned(
                                  top: PlatformInfo.isAndroidOrWeb ? 30 : 40,
                                  child: SizedBox(
                                    width: playerWidth,
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            orientation == Orientation.portrait
                                                ? IconButton(
                                                    icon: const ImageIcon(
                                                        AssetImage(
                                                            AppIcons.arrowBack),
                                                        size: 18,
                                                        color: AppColor.white),
                                                    onPressed: () async {
                                                      controller
                                                          .videoPlayerController
                                                          ?.pause();
                                                      Get.back();
                                                    },
                                                  ).paddingOnly(left: 10)
                                                : const Offstage(),
                                            orientation == Orientation.landscape
                                                ? IconButton(
                                                    icon: const ImageIcon(
                                                        AssetImage(
                                                            AppIcons.arrowBack),
                                                        size: 18,
                                                        color: AppColor.white),
                                                    onPressed: () async {
                                                      if (PlatformInfo.isWeb) {
                                                        WebVideoFullscreen.exit();
                                                        return;
                                                      }
                                                      SystemChrome
                                                          .setEnabledSystemUIMode(
                                                              SystemUiMode
                                                                  .manual,
                                                              overlays: [
                                                            SystemUiOverlay.top,
                                                            SystemUiOverlay
                                                                .bottom
                                                          ]);
                                                      await SystemChrome
                                                          .setPreferredOrientations([
                                                        DeviceOrientation
                                                            .portraitUp,
                                                        DeviceOrientation
                                                            .portraitDown,
                                                      ]);
                                                    },
                                                  )
                                                : const Offstage(),
                                            orientation == Orientation.landscape
                                                ? SizedBox(
                                                    width: playerWidth / 2,
                                                    child: Obx(
                                                      () => Text(
                                                        controller
                                                                .isVideoDetailsLoading
                                                                .value
                                                            ? ""
                                                            : controller
                                                                    .videoDetailsModel
                                                                    ?.detailsOfVideo
                                                                    ?.title ??
                                                                "",
                                                        style: GoogleFonts
                                                            .urbanist(
                                                                fontSize: 18,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .bold,
                                                                color: AppColor
                                                                    .white),
                                                        overflow: TextOverflow
                                                            .ellipsis,
                                                        maxLines: 1,
                                                      ),
                                                    ),
                                                  )
                                                : const Offstage(),
                                          ],
                                        ),
                                        Row(
                                          children: [
                                            orientation == Orientation.landscape
                                                ? IconButton(
                                                    icon: const ImageIcon(
                                                      AssetImage(
                                                          AppIcons.share),
                                                      size: 22,
                                                      color: AppColor.white,
                                                    ),
                                                    onPressed: () async {
                                                      // CustomShare.share(
                                                      //   name: controller.videoDetailsModel!.detailsOfVideo!.title!,
                                                      //   url: controller.videoDetailsModel!.detailsOfVideo!.videoUrl!,
                                                      //   channelId: controller.videoDetailsModel!.detailsOfVideo!.channelId!,
                                                      //   videoId: controller.videoDetailsModel!.detailsOfVideo!.id!,
                                                      //   image: controller.videoDetailsModel!.detailsOfVideo!.videoImage!,
                                                      //   pageRoutes: "NormalVideo",
                                                      // );

                                                      await CommonShare.onShare(
                                                        title: controller
                                                            .videoDetailsModel!
                                                            .detailsOfVideo!
                                                            .title!,
                                                        url: controller
                                                            .videoDetailsModel!
                                                            .detailsOfVideo!
                                                            .videoUrl!,
                                                        channelId: controller
                                                            .videoDetailsModel!
                                                            .detailsOfVideo!
                                                            .channelId!,
                                                        id: controller
                                                            .videoDetailsModel!
                                                            .detailsOfVideo!
                                                            .id!,
                                                        image: controller
                                                            .videoDetailsModel!
                                                            .detailsOfVideo!
                                                            .videoImage!,
                                                        pageRoutes:
                                                            "NormalVideo",
                                                      );

                                                      await ShareCountApiClass
                                                          .callApi(
                                                              Database
                                                                  .loginUserId!,
                                                              controller
                                                                  .videoId);
                                                    },
                                                  )
                                                : const Offstage(),
                                            Obx(
                                              () => IconButton(
                                                onPressed: () =>
                                                    controller.onToggleVolume(),
                                                icon: Icon(
                                                  controller.isSpeaker.value
                                                      ? Icons.volume_up_rounded
                                                      : Icons
                                                          .volume_off_rounded,
                                                  color: AppColor.white,
                                                ),
                                              ),
                                            ),
                                            IconButton(
                                              icon: const Icon(
                                                Icons.more_vert,
                                                color: AppColor.white,
                                                size: 25,
                                              ),
                                              onPressed: () {
                                                orientation ==
                                                        Orientation.portrait
                                                    ? AppSheet.show(
                                                        backgroundColor: isDarkMode
                                                                .value
                                                            ? AppColor
                                                                .secondDarkMode
                                                            : AppColor.white,
                                                        isScrollControlled:
                                                            true,
                                                        shape:
                                                            const RoundedRectangleBorder(
                                                          borderRadius:
                                                              BorderRadius.only(
                                                            topLeft:
                                                                Radius.circular(
                                                                    25),
                                                            topRight:
                                                                Radius.circular(
                                                                    25),
                                                          ),
                                                        ),
                                                        SizedBox(
                                                          height: 200,
                                                          child:
                                                              SingleChildScrollView(
                                                            child: Padding(
                                                              padding:
                                                                  const EdgeInsets
                                                                      .symmetric(
                                                                      horizontal:
                                                                          15),
                                                              child: Column(
                                                                crossAxisAlignment:
                                                                    CrossAxisAlignment
                                                                        .start,
                                                                children: [
                                                                  const SizedBox(
                                                                      height:
                                                                          8),
                                                                  Center(
                                                                    child:
                                                                        Container(
                                                                      width: 30,
                                                                      height: 3,
                                                                      decoration:
                                                                          BoxDecoration(
                                                                        borderRadius:
                                                                            BorderRadius.circular(60),
                                                                        color: AppColor
                                                                            .grey_300,
                                                                      ),
                                                                    ),
                                                                  ),
                                                                  const SizedBox(
                                                                      height:
                                                                          4),
                                                                  Center(
                                                                    child: Text(
                                                                      AppStrings
                                                                          .moreOption
                                                                          .tr,
                                                                      style: GoogleFonts
                                                                          .urbanist(
                                                                        textStyle:
                                                                            const TextStyle(
                                                                          fontWeight:
                                                                              FontWeight.bold,
                                                                          fontSize:
                                                                              20,
                                                                        ),
                                                                      ),
                                                                    ),
                                                                  ),
                                                                  Divider(
                                                                      indent:
                                                                          20,
                                                                      endIndent:
                                                                          20,
                                                                      color: AppColor
                                                                          .grey_200),
                                                                  const SizedBox(
                                                                      height:
                                                                          5),
                                                                  Row(
                                                                      children: [
                                                                        const ImageIcon(
                                                                            AssetImage(AppIcons.loopVideo)),
                                                                        const SizedBox(
                                                                            width:
                                                                                10),
                                                                        Text(
                                                                          AppStrings
                                                                              .loopVideo
                                                                              .tr,
                                                                          style:
                                                                              GoogleFonts.urbanist(
                                                                            textStyle:
                                                                                const TextStyle(
                                                                              fontWeight: FontWeight.bold,
                                                                              fontSize: 15,
                                                                            ),
                                                                          ),
                                                                        ),
                                                                        const Spacer(),
                                                                        SizedBox(
                                                                          height:
                                                                              20,
                                                                          width:
                                                                              25,
                                                                          child:
                                                                              Transform.scale(
                                                                            scale:
                                                                                0.7,
                                                                            child:
                                                                                Obx(
                                                                              () => CupertinoSwitch(
                                                                                activeColor: AppColor.primaryColor,
                                                                                value: controller.isLoop.value,
                                                                                onChanged: (value) {
                                                                                  controller.isLoop.value = value;

                                                                                  controller.onChangeLoop();
                                                                                },
                                                                              ),
                                                                            ),
                                                                          ),
                                                                        ).paddingOnly(
                                                                            right:
                                                                                10),
                                                                      ]),
                                                                  const SizedBox(
                                                                      height:
                                                                          20),
                                                                  GestureDetector(
                                                                    onTap: () {
                                                                      Get.back();
                                                                      AppSheet.show(
                                                                        backgroundColor: isDarkMode.value
                                                                            ? AppColor.secondDarkMode
                                                                            : AppColor.white,
                                                                        isScrollControlled:
                                                                            true,
                                                                        shape:
                                                                            const RoundedRectangleBorder(
                                                                          borderRadius:
                                                                              BorderRadius.only(
                                                                            topLeft:
                                                                                Radius.circular(25),
                                                                            topRight:
                                                                                Radius.circular(25),
                                                                          ),
                                                                        ),
                                                                        SizedBox(
                                                                          height:
                                                                              250,
                                                                          child:
                                                                              SingleChildScrollView(
                                                                            child:
                                                                                Column(
                                                                              crossAxisAlignment: CrossAxisAlignment.start,
                                                                              mainAxisAlignment: MainAxisAlignment.start,
                                                                              children: [
                                                                                const SizedBox(height: 10),
                                                                                Center(
                                                                                  child: Container(
                                                                                    width: SizeConfig.blockSizeHorizontal * 12,
                                                                                    height: 3,
                                                                                    decoration: BoxDecoration(
                                                                                      borderRadius: BorderRadius.circular(60),
                                                                                      color: AppColor.grey_300,
                                                                                    ),
                                                                                  ),
                                                                                ),
                                                                                const SizedBox(height: 10),
                                                                                Center(
                                                                                  child: Text(
                                                                                    AppStrings.playbackSpeed.tr,
                                                                                    style: GoogleFonts.urbanist(
                                                                                      textStyle: const TextStyle(
                                                                                        fontWeight: FontWeight.bold,
                                                                                        fontSize: 15,
                                                                                      ),
                                                                                    ),
                                                                                  ),
                                                                                ),
                                                                                const SizedBox(height: 5),
                                                                                const Divider(),
                                                                                for (int i = 0; i < controller.speedOptions.length; i++)
                                                                                  Padding(
                                                                                    padding: const EdgeInsets.only(left: 20, bottom: 8),
                                                                                    child: GestureDetector(
                                                                                      onTap: () {
                                                                                        controller.currentSpeedIndex.value = i;
                                                                                        controller.videoPlayerController?.setPlaybackSpeed(controller.speedOptions[controller.currentSpeedIndex.value]);
                                                                                      },
                                                                                      child: Obx(
                                                                                        () => Row(
                                                                                          children: [
                                                                                            controller.currentSpeedIndex.value == i ? Image.asset(AppIcons.done, height: 15, width: 15) : const SizedBox(width: 15),
                                                                                            const SizedBox(width: 10),
                                                                                            Text(
                                                                                              "${controller.speedOptions[i]}x",
                                                                                              style: GoogleFonts.urbanist(
                                                                                                textStyle: const TextStyle(
                                                                                                  fontWeight: FontWeight.bold,
                                                                                                  fontSize: 15,
                                                                                                ),
                                                                                              ),
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
                                                                    },
                                                                    child: Row(
                                                                      children: [
                                                                        const ImageIcon(
                                                                          AssetImage(
                                                                              AppIcons.playSpeed),
                                                                          size:
                                                                              22,
                                                                        ),
                                                                        const SizedBox(
                                                                            width:
                                                                                10),
                                                                        Text(
                                                                          AppStrings
                                                                              .playbackSpeed
                                                                              .tr,
                                                                          style:
                                                                              GoogleFonts.urbanist(
                                                                            textStyle:
                                                                                const TextStyle(
                                                                              fontWeight: FontWeight.bold,
                                                                              fontSize: 15,
                                                                            ),
                                                                          ),
                                                                        ),
                                                                        const Spacer(),
                                                                        Obx(
                                                                          () =>
                                                                              Text(
                                                                            controller.currentSpeedIndex.value == 2
                                                                                ? AppStrings.normal.tr
                                                                                : "${controller.speedOptions[controller.currentSpeedIndex.value]}x",
                                                                            style:
                                                                                GoogleFonts.urbanist(
                                                                              textStyle: const TextStyle(
                                                                                fontWeight: FontWeight.bold,
                                                                                fontSize: 15,
                                                                              ),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                        const SizedBox(
                                                                            width:
                                                                                3),
                                                                        const ImageIcon(
                                                                          AssetImage(
                                                                              AppIcons.arrowDown),
                                                                          size:
                                                                              18,
                                                                        ),
                                                                      ],
                                                                    ),
                                                                  ),
                                                                  const SizedBox(
                                                                      height:
                                                                          20),
                                                                  GestureDetector(
                                                                    onTap: () {
                                                                      Get.back();
                                                                      CustomReportView.show(
                                                                          controller
                                                                              .videoId);
                                                                    },
                                                                    child: Row(
                                                                      children: [
                                                                        const ImageIcon(
                                                                            AssetImage(AppIcons.report)),
                                                                        const SizedBox(
                                                                            width:
                                                                                10),
                                                                        Text(
                                                                          "${AppStrings.report.tr}-${AppStrings.block.tr}",
                                                                          style:
                                                                              GoogleFonts.urbanist(textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                                                        ),
                                                                      ],
                                                                    ),
                                                                  ),
                                                                  const SizedBox(
                                                                      height:
                                                                          20),
                                                                ],
                                                              ),
                                                            ),
                                                          ),
                                                        ),
                                                      )
                                                    : Get.defaultDialog(
                                                        title: AppStrings
                                                            .moreOption.tr,
                                                        titlePadding:
                                                            const EdgeInsets
                                                                .only(top: 10),
                                                        titleStyle: GoogleFonts
                                                            .urbanist(
                                                          textStyle:
                                                              const TextStyle(
                                                            fontWeight:
                                                                FontWeight.bold,
                                                            fontSize: 20,
                                                          ),
                                                        ),
                                                        backgroundColor: isDarkMode
                                                                .value
                                                            ? AppColor
                                                                .secondDarkMode
                                                            : AppColor.white,
                                                        contentPadding:
                                                            const EdgeInsets
                                                                .symmetric(
                                                                horizontal: 10),
                                                        content: Container(
                                                          height: 130,
                                                          padding:
                                                              EdgeInsets.only(
                                                            left: SizeConfig
                                                                    .blockSizeHorizontal *
                                                                2,
                                                            right: SizeConfig
                                                                    .blockSizeHorizontal *
                                                                2,
                                                          ),
                                                          decoration:
                                                              BoxDecoration(
                                                            borderRadius:
                                                                BorderRadius
                                                                    .circular(
                                                                        20),
                                                            color: Colors
                                                                .transparent,
                                                          ),
                                                          child:
                                                              SingleChildScrollView(
                                                            child: Column(
                                                              crossAxisAlignment:
                                                                  CrossAxisAlignment
                                                                      .start,
                                                              children: [
                                                                Divider(
                                                                    indent: 25,
                                                                    endIndent:
                                                                        25,
                                                                    color: AppColor
                                                                        .grey_300),
                                                                const SizedBox(
                                                                    height: 5),
                                                                Row(children: [
                                                                  const ImageIcon(
                                                                      AssetImage(
                                                                          AppIcons
                                                                              .loopVideo)),
                                                                  const SizedBox(
                                                                      width:
                                                                          10),
                                                                  Text(
                                                                    AppStrings
                                                                        .loopVideo
                                                                        .tr,
                                                                    style: GoogleFonts.urbanist(
                                                                        textStyle: const TextStyle(
                                                                            fontWeight:
                                                                                FontWeight.bold,
                                                                            fontSize: 15)),
                                                                  ),
                                                                  const Spacer(),
                                                                  SizedBox(
                                                                    height: 20,
                                                                    width: 25,
                                                                    child: Transform
                                                                        .scale(
                                                                      scale:
                                                                          0.7,
                                                                      child:
                                                                          Obx(
                                                                        () =>
                                                                            CupertinoSwitch(
                                                                          activeColor:
                                                                              AppColor.primaryColor,
                                                                          value: controller
                                                                              .isLoop
                                                                              .value,
                                                                          onChanged:
                                                                              (value) {
                                                                            controller.isLoop.value =
                                                                                value;

                                                                            controller.onChangeLoop();
                                                                          },
                                                                        ),
                                                                      ),
                                                                    ),
                                                                  ).paddingOnly(
                                                                      right:
                                                                          10),
                                                                ]),
                                                                const SizedBox(
                                                                    height: 15),
                                                                GestureDetector(
                                                                  onTap: () {
                                                                    Get.back();
                                                                    Get.defaultDialog(
                                                                      title: AppStrings
                                                                          .playbackSpeed
                                                                          .tr,
                                                                      titlePadding: const EdgeInsets
                                                                          .only(
                                                                          top:
                                                                              20),
                                                                      titleStyle:
                                                                          GoogleFonts
                                                                              .urbanist(
                                                                        textStyle: const TextStyle(
                                                                            fontWeight:
                                                                                FontWeight.bold,
                                                                            fontSize: 16),
                                                                      ),
                                                                      backgroundColor: isDarkMode.value
                                                                          ? AppColor
                                                                              .secondDarkMode
                                                                          : AppColor
                                                                              .white,
                                                                      content:
                                                                          Container(
                                                                        height:
                                                                            170,
                                                                        padding:
                                                                            EdgeInsets.only(
                                                                          left: SizeConfig.blockSizeHorizontal *
                                                                              2,
                                                                          right:
                                                                              SizeConfig.blockSizeHorizontal * 2,
                                                                        ),
                                                                        decoration:
                                                                            BoxDecoration(
                                                                          borderRadius:
                                                                              BorderRadius.circular(20),
                                                                          color:
                                                                              AppColor.transparent,
                                                                        ),
                                                                        child:
                                                                            Column(
                                                                          children: [
                                                                            const Divider(),
                                                                            Expanded(
                                                                              child: SingleChildScrollView(
                                                                                child: Column(
                                                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                                                  mainAxisAlignment: MainAxisAlignment.start,
                                                                                  children: [
                                                                                    for (int i = 0; i < controller.speedOptions.length; i++)
                                                                                      Padding(
                                                                                        padding: const EdgeInsets.only(left: 10, top: 10),
                                                                                        child: GestureDetector(
                                                                                          onTap: () {
                                                                                            controller.currentSpeedIndex.value = i;
                                                                                            controller.videoPlayerController?.setPlaybackSpeed(controller.speedOptions[controller.currentSpeedIndex.value]);
                                                                                          },
                                                                                          child: Obx(
                                                                                            () => Row(
                                                                                              children: [
                                                                                                controller.currentSpeedIndex.value == i ? Image.asset(AppIcons.done, height: 15, width: 15) : const SizedBox(width: 15),
                                                                                                const SizedBox(width: 10),
                                                                                                Text("${controller.speedOptions[i]}x"),
                                                                                              ],
                                                                                            ),
                                                                                          ),
                                                                                        ),
                                                                                      ),
                                                                                  ],
                                                                                ),
                                                                              ),
                                                                            ),
                                                                          ],
                                                                        ),
                                                                      ),
                                                                    );
                                                                  },
                                                                  child: Row(
                                                                    children: [
                                                                      const ImageIcon(
                                                                          AssetImage(
                                                                              AppIcons.playSpeed)),
                                                                      const SizedBox(
                                                                          width:
                                                                              10),
                                                                      Text(
                                                                          AppStrings
                                                                              .playbackSpeed
                                                                              .tr,
                                                                          style:
                                                                              GoogleFonts.urbanist(textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15))),
                                                                      const Spacer(),
                                                                      Obx(
                                                                        () =>
                                                                            Text(
                                                                          controller.currentSpeedIndex.value == 2
                                                                              ? AppStrings.normal.tr
                                                                              : "${controller.speedOptions[controller.currentSpeedIndex.value]}x",
                                                                          style:
                                                                              GoogleFonts.urbanist(
                                                                            textStyle:
                                                                                const TextStyle(
                                                                              fontWeight: FontWeight.bold,
                                                                              fontSize: 15,
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                      const SizedBox(
                                                                          width:
                                                                              3),
                                                                      const ImageIcon(
                                                                        AssetImage(
                                                                            AppIcons.arrowDown),
                                                                        size:
                                                                            18,
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                                const SizedBox(
                                                                    height: 15),
                                                                GestureDetector(
                                                                  onTap: () {
                                                                    Get.back();
                                                                    CustomReportView.show(
                                                                        controller
                                                                            .videoId);
                                                                  },
                                                                  child: Row(
                                                                    children: [
                                                                      const ImageIcon(
                                                                          AssetImage(
                                                                              AppIcons.report)),
                                                                      const SizedBox(
                                                                          width:
                                                                              10),
                                                                      Text(
                                                                        "${AppStrings.report.tr}-${AppStrings.block.tr}",
                                                                        style: GoogleFonts.urbanist(
                                                                            textStyle:
                                                                                const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                                const SizedBox(
                                                                    height: 10),
                                                              ],
                                                            ),
                                                          ),
                                                        ),
                                                      );
                                              },
                                            ),
                                            const SizedBox(width: 10),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),

                                // >>>>> Both Mode Progress Line <<<<<<<
                                Positioned(
                                  bottom: orientation == Orientation.portrait
                                      ? 25
                                      : 50,
                                  child:
                                      GetBuilder<NormalVideoDetailsController>(
                                    id: "onProgressLine",
                                    builder: (controller) => SizedBox(
                                      width: playerWidth,
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 20),
                                        child: Row(
                                          children: [
                                            orientation == Orientation.landscape
                                                ? GetBuilder<
                                                    NormalVideoDetailsController>(
                                                    id: "onVideoTime",
                                                    builder: (controller) =>
                                                        Text(
                                                      CustomFormatTime
                                                          .convertSecond(controller
                                                                  .videoPlayerController
                                                                  ?.value
                                                                  .position
                                                                  .inSeconds ??
                                                              0),
                                                      style: const TextStyle(
                                                          color: AppColor.white,
                                                          fontSize: 12),
                                                    ),
                                                  )
                                                : const Offstage(),
                                            Expanded(
                                              child: Stack(
                                                children: [
                                                  // Ad markers overlay
                                                  Positioned.fill(
                                                    child: CustomPaint(
                                                      painter: AdMarkersPainter(
                                                        adTimings: controller
                                                            .adTimings,
                                                        videoDuration: controller
                                                                .videoPlayerController
                                                                ?.value
                                                                .duration ??
                                                            Duration.zero,
                                                        adShowCount: controller
                                                            .adShowCount,
                                                        currentPosition: controller
                                                                    .videoPlayerController !=
                                                                null
                                                            ? controller
                                                                .videoPlayerController!
                                                                .value
                                                                .position
                                                            : Duration.zero,
                                                      ),
                                                    ),
                                                  ),
                                                  // Main Slider
                                                  SliderTheme(
                                                    data:
                                                        SliderTheme.of(context)
                                                            .copyWith(
                                                      trackHeight: 5,
                                                      trackShape:
                                                          const RoundedRectSliderTrackShape(),
                                                      inactiveTrackColor:
                                                          Colors.white60,
                                                      thumbColor:
                                                          AppColor.white,
                                                      activeTrackColor:
                                                          AppColor.primaryColor,
                                                      thumbShape:
                                                          const RoundSliderThumbShape(
                                                              enabledThumbRadius:
                                                                  12.0),
                                                      overlayShape:
                                                          const RoundSliderOverlayShape(
                                                              overlayRadius:
                                                                  24.0),
                                                    ),
                                                    child: Slider(
                                                      value: controller
                                                              .videoPlayerController
                                                              ?.value
                                                              .position
                                                              .inSeconds
                                                              .toDouble() ??
                                                          0,
                                                      onChanged:
                                                          (double value) {
                                                        // Don't allow seeking during ad
                                                        if (controller.showAd)
                                                          return;

                                                        Duration?
                                                            currentPosition =
                                                            controller
                                                                .videoPlayerController
                                                                ?.value
                                                                .position;
                                                        Duration newPosition =
                                                            Duration(
                                                                seconds:
                                                                    value
                                                                        .toInt());

                                                        if (currentPosition !=
                                                            null) {
                                                          if (currentPosition <
                                                              newPosition) {
                                                            controller
                                                                    .isVideoSkip =
                                                                true;
                                                          }
                                                        }
                                                        controller
                                                            .videoPlayerController
                                                            ?.seekTo(
                                                                newPosition);
                                                      },
                                                      min: 0.0,
                                                      max: controller
                                                              .videoPlayerController
                                                              ?.value
                                                              .duration
                                                              .inSeconds
                                                              .toDouble() ??
                                                          0,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            orientation == Orientation.landscape
                                                ? Text(
                                                    CustomFormatTime
                                                        .convertSecond(controller
                                                                .videoPlayerController
                                                                ?.value
                                                                .duration
                                                                .inSeconds ??
                                                            0),
                                                    style: const TextStyle(
                                                        color: AppColor.white,
                                                        fontSize: 12),
                                                  )
                                                : const Offstage(),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                orientation == Orientation.portrait
                                    ? Positioned(
                                        bottom: 0,
                                        child: SizedBox(
                                          width: playerWidth,
                                          child: Row(
                                            children: [
                                              const SizedBox(width: 10),
                                              GetBuilder<
                                                  NormalVideoDetailsController>(
                                                id: "onVideoTime",
                                                builder: (controller) => Text(
                                                  CustomFormatTime
                                                      .convertSecond(controller
                                                              .videoPlayerController
                                                              ?.value
                                                              .position
                                                              .inSeconds ??
                                                          0),
                                                  style: const TextStyle(
                                                      color: AppColor.white,
                                                      fontSize: 12),
                                                ),
                                              ),
                                              Text(
                                                " / ${CustomFormatTime.convertSecond(controller.videoPlayerController?.value.duration.inSeconds ?? 0)}",
                                                style: const TextStyle(
                                                    color: AppColor.white,
                                                    fontSize: 12),
                                              ),
                                              const Spacer(),
                                              IconButton(
                                                icon: const ImageIcon(
                                                  AssetImage(AppIcons.expand),
                                                  size: 20,
                                                  color: AppColor.white,
                                                ),
                                                onPressed: () async {
                                                  // A browser window cannot rotate: use browser fullscreen.
                                                  if (PlatformInfo.isWeb) {
                                                    WebVideoFullscreen.enter();
                                                    return;
                                                  }
                                                  SystemChrome
                                                      .setEnabledSystemUIMode(
                                                          SystemUiMode.manual,
                                                          overlays: [
                                                        SystemUiOverlay.top
                                                      ]);
                                                  Timer(
                                                      const Duration(
                                                          milliseconds: 300),
                                                      () {
                                                    SystemChrome
                                                        .setSystemUIOverlayStyle(
                                                      const SystemUiOverlayStyle(
                                                        statusBarIconBrightness:
                                                            Brightness.light,
                                                        statusBarColor:
                                                            Colors.transparent,
                                                      ),
                                                    );
                                                  });

                                                  await SystemChrome
                                                      .setPreferredOrientations([
                                                    DeviceOrientation
                                                        .landscapeLeft,
                                                    DeviceOrientation
                                                        .landscapeRight,
                                                  ]);
                                                },
                                              ),
                                              const SizedBox(width: 10),
                                            ],
                                          ),
                                        ),
                                      )
                                    : const Offstage(),
                                orientation == Orientation.portrait
                                    ? Align(
                                        alignment: Alignment.center,
                                        child: SizedBox(
                                          width: playerWidth,
                                          child: Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceAround,
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              IconButton(
                                                icon: const ImageIcon(
                                                    AssetImage(
                                                        AppIcons.backward10s),
                                                    size: 20,
                                                    color: AppColor.white),
                                                onPressed: () async =>
                                                    await controller
                                                        .backwardSkipVideo(),
                                              ),
                                              Obx(
                                                () => IconButton(
                                                  icon: ImageIcon(
                                                      const AssetImage(
                                                          AppIcons.previous),
                                                      size: 25,
                                                      color: controller
                                                              .isDisablePrevious
                                                              .value
                                                          ? AppColor.white
                                                              .withOpacity(0.6)
                                                          : AppColor.white),
                                                  onPressed: controller
                                                          .isDisablePrevious
                                                          .value
                                                      ? () {}
                                                      : () {
                                                          AppSettings.showLog(
                                                              "Previous Video Playing....");
                                                          controller
                                                              .onPreviousVideo();
                                                        },
                                                ),
                                              ),
                                              GetBuilder<
                                                  NormalVideoDetailsController>(
                                                id: "onVideoPlayPause",
                                                builder: (controller) =>
                                                    IconButton(
                                                  icon: ImageIcon(
                                                    AssetImage(
                                                      (controller
                                                                  .videoPlayerController
                                                                  ?.value
                                                                  .isPlaying ??
                                                              false)
                                                          ? AppIcons.pause
                                                          : AppIcons.videoPlay,
                                                    ),
                                                    size: 28,
                                                    color: AppColor.white,
                                                  ),
                                                  onPressed: () {
                                                    if (controller
                                                            .videoPlayerController
                                                            ?.value
                                                            .isPlaying ??
                                                        false) {
                                                      controller
                                                          .videoPlayerController
                                                          ?.pause();
                                                    } else {
                                                      controller
                                                          .videoPlayerController
                                                          ?.play();
                                                    }
                                                  },
                                                ),
                                              ),
                                              Obx(
                                                () => IconButton(
                                                  icon: ImageIcon(
                                                      const AssetImage(
                                                          AppIcons.next),
                                                      size: 25,
                                                      color: controller
                                                              .isDisableNext
                                                              .value
                                                          ? AppColor.white
                                                              .withOpacity(0.6)
                                                          : AppColor.white),
                                                  onPressed: controller
                                                          .isDisableNext.value
                                                      ? () {}
                                                      : () {
                                                          AppSettings.showLog(
                                                              "Next Video Playing....");
                                                          controller
                                                              .onNextVideo();
                                                        },
                                                ),
                                              ),
                                              IconButton(
                                                icon: const ImageIcon(
                                                  AssetImage(
                                                      AppIcons.forward10s),
                                                  size: 20,
                                                  color: AppColor.white,
                                                ),
                                                onPressed: () async =>
                                                    await controller
                                                        .forwardSkipVideo(),
                                              ),
                                            ],
                                          ),
                                        ),
                                      )
                                    : const Offstage(),
                                orientation == Orientation.landscape
                                    ? Positioned(
                                        bottom: 5,
                                        child: SizedBox(
                                          width: playerWidth,
                                          child: Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            children: [
                                              Row(
                                                children: [
                                                  Obx(
                                                    () => IconButton(
                                                      onPressed: () async {
                                                        // if (!controller.isLike.value) {
                                                        //   if (controller.isDisLike.value) {
                                                        //     controller.isDisLike.value = false;
                                                        //     controller.customChanges["disLike"]--;
                                                        //   }
                                                        //   controller.isLike.value = true;
                                                        //   controller.customChanges["like"]++;
                                                        //   await LikeDisLikeVideoApi.callApi(controller.videoId, true);
                                                        // }

                                                        String videoId =
                                                            controller.videoId;

                                                        // CASE 1: Already Liked → Remove Like
                                                        if (controller
                                                            .isLike.value) {
                                                          controller.isLike
                                                              .value = false;
                                                          controller
                                                                  .customChanges[
                                                              "like"]--;

                                                          await LikeDisLikeVideoApi
                                                              .callApi(videoId,
                                                                  "likeremove");
                                                          return;
                                                        }

                                                        // CASE 2: Disliked → Remove Dislike First
                                                        if (controller
                                                            .isDisLike.value) {
                                                          controller.isDisLike
                                                              .value = false;
                                                          controller
                                                                  .customChanges[
                                                              "disLike"]--;

                                                          await LikeDisLikeVideoApi
                                                              .callApi(videoId,
                                                                  "dislikeremove");
                                                        }

                                                        // CASE 3: Add Like
                                                        controller.isLike
                                                            .value = true;
                                                        controller
                                                                .customChanges[
                                                            "like"]++;

                                                        await LikeDisLikeVideoApi
                                                            .callApi(videoId,
                                                                "like");
                                                      },
                                                      icon: ImageIcon(
                                                        AssetImage(controller
                                                                .isLike.value
                                                            ? AppIcons.likeBold
                                                            : AppIcons.like),
                                                        size: 25,
                                                        color: AppColor.white,
                                                      ).paddingOnly(bottom: 2),
                                                    ),
                                                  ),
                                                  const SizedBox(width: 10),
                                                  Obx(
                                                    () => IconButton(
                                                      onPressed: () async {
                                                        // if (!controller.isDisLike.value) {
                                                        //   if (controller.isLike.value) {
                                                        //     controller.isLike.value = false;
                                                        //     controller.customChanges["like"]--;
                                                        //   }
                                                        //   controller.isDisLike.value = true;
                                                        //   controller.customChanges["disLike"]++;
                                                        //   await LikeDisLikeVideoApi.callApi(controller.videoId, false);
                                                        // }

                                                        String videoId =
                                                            controller.videoId;

                                                        // CASE 1: Already Disliked → Remove Dislike
                                                        if (controller
                                                            .isDisLike.value) {
                                                          controller.isDisLike
                                                              .value = false;
                                                          controller
                                                                  .customChanges[
                                                              "disLike"]--;

                                                          await LikeDisLikeVideoApi
                                                              .callApi(videoId,
                                                                  "dislikeremove");
                                                          return;
                                                        }

                                                        // CASE 2: Liked → Remove Like First
                                                        if (controller
                                                            .isLike.value) {
                                                          controller.isLike
                                                              .value = false;
                                                          controller
                                                                  .customChanges[
                                                              "like"]--;

                                                          await LikeDisLikeVideoApi
                                                              .callApi(videoId,
                                                                  "likeremove");
                                                        }

                                                        // CASE 3: Add Dislike
                                                        controller.isDisLike
                                                            .value = true;
                                                        controller
                                                                .customChanges[
                                                            "disLike"]++;

                                                        await LikeDisLikeVideoApi
                                                            .callApi(videoId,
                                                                "dislike");
                                                      },
                                                      icon: ImageIcon(
                                                              AssetImage(controller
                                                                      .isDisLike
                                                                      .value
                                                                  ? AppIcons
                                                                      .disLikeBold
                                                                  : AppIcons
                                                                      .disLike),
                                                              size: 25,
                                                              color: AppColor
                                                                  .white)
                                                          .paddingOnly(top: 2),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              Row(
                                                children: [
                                                  IconButton(
                                                    icon: const ImageIcon(
                                                        AssetImage(AppIcons
                                                            .backward10s),
                                                        size: 28,
                                                        color: AppColor.white),
                                                    onPressed: () async =>
                                                        await controller
                                                            .backwardSkipVideo(),
                                                  ),
                                                  const SizedBox(width: 10),
                                                  Obx(
                                                    () => IconButton(
                                                      icon: ImageIcon(
                                                          const AssetImage(
                                                              AppIcons
                                                                  .previous),
                                                          size: 28,
                                                          color: controller
                                                                  .isDisablePrevious
                                                                  .value
                                                              ? AppColor.white
                                                                  .withOpacity(
                                                                      0.6)
                                                              : AppColor.white),
                                                      onPressed: controller
                                                              .isDisablePrevious
                                                              .value
                                                          ? () {}
                                                          : () {
                                                              AppSettings.showLog(
                                                                  "Previous Video Playing....");
                                                              controller
                                                                  .onPreviousVideo();
                                                            },
                                                    ),
                                                  ),
                                                  const SizedBox(width: 10),
                                                  GetBuilder<
                                                      NormalVideoDetailsController>(
                                                    id: "onVideoPlayPause",
                                                    builder: (controller) =>
                                                        IconButton(
                                                      icon: ImageIcon(
                                                          AssetImage(
                                                            (controller
                                                                        .videoPlayerController
                                                                        ?.value
                                                                        .isPlaying ??
                                                                    false)
                                                                ? AppIcons.pause
                                                                : AppIcons
                                                                    .videoPlay,
                                                          ),
                                                          size: 35,
                                                          color:
                                                              AppColor.white),
                                                      onPressed: () {
                                                        if (controller
                                                                .videoPlayerController
                                                                ?.value
                                                                .isPlaying ??
                                                            false) {
                                                          controller
                                                              .videoPlayerController
                                                              ?.pause();
                                                        } else {
                                                          controller
                                                              .videoPlayerController
                                                              ?.play();
                                                        }
                                                      },
                                                    ),
                                                  ),
                                                  const SizedBox(width: 10),
                                                  Obx(
                                                    () => IconButton(
                                                      icon: ImageIcon(
                                                          const AssetImage(
                                                              AppIcons.next),
                                                          size: 28,
                                                          color: controller
                                                                  .isDisableNext
                                                                  .value
                                                              ? AppColor.white
                                                                  .withOpacity(
                                                                      0.6)
                                                              : AppColor.white),
                                                      onPressed: controller
                                                              .isDisableNext
                                                              .value
                                                          ? () {}
                                                          : () {
                                                              AppSettings.showLog(
                                                                  "Next Video Playing....");
                                                              controller
                                                                  .onNextVideo();
                                                            },
                                                    ),
                                                  ),
                                                  const SizedBox(width: 10),
                                                  IconButton(
                                                    icon: const ImageIcon(
                                                        AssetImage(AppIcons
                                                            .forward10s),
                                                        size: 28,
                                                        color: AppColor.white),
                                                    onPressed: () async =>
                                                        await controller
                                                            .forwardSkipVideo(),
                                                  ),
                                                ],
                                              ),
                                              Row(
                                                children: [
                                                  IconButton(
                                                    onPressed: () {
                                                      if (controller
                                                              .isSave.value ==
                                                          false) {
                                                        controller.isSave
                                                            .value = true;
                                                        CustomToast.show(
                                                            AppStrings
                                                                .addToWatchLater
                                                                .tr);
                                                        CreateWatchLater.callApi(
                                                            Database
                                                                .loginUserId!,
                                                            controller.videoId);
                                                      }
                                                    },
                                                    icon: Obx(
                                                      () => ImageIcon(
                                                          AssetImage(controller
                                                                  .isSave.value
                                                              ? AppIcons
                                                                  .saveDone1
                                                              : AppIcons
                                                                  .addToSave),
                                                          size: 22,
                                                          color:
                                                              AppColor.white),
                                                    ),
                                                  ),
                                                  const SizedBox(width: 10),
                                                  IconButton(
                                                    icon: const ImageIcon(
                                                        AssetImage(
                                                            AppIcons.collapse),
                                                        size: 25,
                                                        color: AppColor.white),
                                                    onPressed: () async {
                                                      if (PlatformInfo.isWeb) {
                                                        WebVideoFullscreen.exit();
                                                        return;
                                                      }
                                                      SystemChrome
                                                          .setEnabledSystemUIMode(
                                                              SystemUiMode
                                                                  .manual,
                                                              overlays: [
                                                            SystemUiOverlay.top,
                                                            SystemUiOverlay
                                                                .bottom
                                                          ]);
                                                      await SystemChrome
                                                          .setPreferredOrientations([
                                                        DeviceOrientation
                                                            .portraitUp,
                                                        DeviceOrientation
                                                            .portraitDown,
                                                      ]);
                                                    },
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ).paddingSymmetric(horizontal: 10),
                                        ))
                                    : const Offstage(),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : Container(
                  height: playerHeight,
                  width: playerWidth,
                  color: AppColor.black,
                  child: Stack(
                    children: [
                      Positioned(
                        top: 30,
                        child: SizedBox(
                          width: playerWidth,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.start,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              IconButton(
                                icon: const ImageIcon(
                                    AssetImage(AppIcons.arrowBack),
                                    size: 18,
                                    color: AppColor.white),
                                onPressed: () async {
                                  try {
                                    controller.videoPlayerController?.pause();
                                    Get.back();
                                  } catch (e) {
                                    log("Back Error");
                                  }
                                },
                              )
                            ],
                          ),
                        ),
                      ),
                      // Loading, or why it can't play with a Retry.
                      Center(
                        child: controller.playbackError == null
                            ? const SpinKitCircle(color: AppColor.primaryColor, size: 60)
                            : Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 24),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.error_outline_rounded, color: AppColor.white, size: 40),
                                    const SizedBox(height: 10),
                                    Text(controller.playbackError!,
                                        textAlign: TextAlign.center,
                                        style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 15, fontWeight: FontWeight.w600)),
                                    const SizedBox(height: 14),
                                    FilledButton.icon(
                                      style: FilledButton.styleFrom(backgroundColor: AppColor.primaryColor, foregroundColor: AppColor.white),
                                      onPressed: controller.retryPlayback,
                                      icon: const AppIcon(AppIcons.extraRetry, size: 20),
                                      label: const Text("Retry"),
                                    ),
                                  ],
                                ),
                              ),
                      ),
                    ],
                  ),
                ),
    );
  }
}

class AdMarkersPainter extends CustomPainter {
  final List<int> adTimings;
  final Duration videoDuration;
  final int adShowCount;
  final Duration currentPosition;

  AdMarkersPainter({
    required this.adTimings,
    required this.videoDuration,
    required this.adShowCount,
    required this.currentPosition,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (videoDuration.inSeconds == 0 || adTimings.isEmpty) return;

    final paint = Paint()..style = PaintingStyle.fill;

    // Draw ad markers on progress bar
    for (int i = 0; i < adTimings.length; i++) {
      final adTime = adTimings[i];

      // Skip if ad time is beyond video duration
      if (adTime > videoDuration.inSeconds) continue;

      // Calculate position on slider
      final position = (adTime / videoDuration.inSeconds) * size.width;

      // Choose color based on ad status
      Color dotColor;
      if (i < adShowCount) {
        // Ad already shown - green color
        dotColor = Colors.green;
      } else if (currentPosition.inSeconds >= adTime - 10 &&
          currentPosition.inSeconds < adTime) {
        // Ad coming soon (within 10 seconds) - yellow color
        dotColor = Colors.yellow;
      } else {
        // Future ad - red color
        dotColor = Colors.yellow;
      }

      paint.color = dotColor;

      // Draw ad marker dot
      canvas.drawCircle(
        Offset(position, size.height / 2),
        2.5, // Dot radius
        paint,
      );

      // Draw white border around dot for better visibility
      final borderPaint = Paint()
        ..color = Colors.transparent
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.0;

      canvas.drawCircle(
        Offset(position, size.height / 2),
        2.5,
        borderPaint,
      );

      // Add ad number text above dot (optional)
      final textPainter = TextPainter(
        text: TextSpan(
          text: '${i + 1}',
          style: const TextStyle(
            color: Colors.transparent,
            fontSize: 10,
            fontWeight: FontWeight.bold,
          ),
        ),
        textDirection: TextDirection.ltr,
      );

      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(position - textPainter.width / 2, -textPainter.height - 2),
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    if (oldDelegate is AdMarkersPainter) {
      return oldDelegate.adTimings != adTimings ||
          oldDelegate.videoDuration != videoDuration ||
          oldDelegate.adShowCount != adShowCount ||
          oldDelegate.currentPosition != currentPosition;
    }
    return true;
  }
}

class VideoDetailsUi extends GetView<NormalVideoDetailsController> {
  const VideoDetailsUi({super.key, required this.cost});

  final num cost;

  // Commenting state for the inline box: one request id per draft, so a
  // retried send of the same comment can't post it twice.
  static String _draftRequestId = VideoEngagementApi.newRequestId();
  static final RxBool _posting = false.obs;

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final error = controller.videoDetailsError.value;
      if (error != null) return _DetailsError(message: error, onRetry: () => controller.onGetVideoDetails(controller.videoId));
      if (controller.isVideoDetailsLoading.value || controller.videoDetailsModel?.detailsOfVideo == null) {
        return const VideoDetailsShimmerUi();
      }
      return LayoutBuilder(builder: (context, box) {
        final wide = box.maxWidth >= 700;
        final d = controller.videoDetailsModel!.detailsOfVideo!;
        final isOwn = (d.userId ?? "") == (Database.loginUserId ?? "-") || Database.channelId == d.channelId;
        final commentsOff = d.commentType == 2;
        final titleStyle = GoogleFonts.urbanist(fontSize: wide ? 22 : 18.5, fontWeight: FontWeight.w800, height: 1.25, letterSpacing: -0.2);
        final metaStyle = GoogleFonts.urbanist(fontSize: wide ? 15 : 13, fontWeight: FontWeight.w500, color: isDarkMode.value ? AppColor.mutedTextDark : AppColor.mutedText);

        return Padding(
          padding: EdgeInsets.symmetric(horizontal: wide ? 4 : 8, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SelectableText(d.title ?? "", style: titleStyle),
              const SizedBox(height: 6),
              Text(
                "${CustomFormatNumber.convert(d.views ?? 0)} ${AppStrings.views.tr}${(d.time ?? "").isNotEmpty && (d.createdAt ?? "").isNotEmpty ? " · ${d.time}" : ""}",
                style: metaStyle,
              ),
              const SizedBox(height: 12),
              _channelRow(context, d, isOwn, wide),
              const SizedBox(height: 12),
              _actions(context, d, isOwn, wide),
              const SizedBox(height: 12),
              _DescriptionCard(description: d.description ?? "", hashTags: d.hashTag ?? const [], wide: wide),
              if (_isLocked(d, isOwn)) ...[
                const SizedBox(height: 12),
                _unlockCard(context, d),
              ],
              const SizedBox(height: 12),
              _commentsSection(context, d, commentsOff, wide),
              const SizedBox(height: 8),
            ],
          ),
        );
      });
    });
  }

  bool _isLocked(DetailsOfVideo d, bool isOwn) =>
      !isOwn && d.videoPrivacyType == 2 && (d.channelType == 1 || (d.channelType == 2 && !controller.isSubscribe.value));

  Widget _channelRow(BuildContext context, DetailsOfVideo d, bool isOwn, bool wide) {
    final paid = d.channelType == 2 && (d.subscriptionCost ?? 0) > 0;
    return Row(
      children: [
        Expanded(
          child: Align(
            alignment: Alignment.centerLeft,
            child: InkWell(
          borderRadius: BorderRadius.circular(40),
          onTap: () => Get.to(() => YourChannelView(loginUserId: Database.loginUserId ?? "", channelId: d.channelId ?? "")),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              PreviewProfileImage(size: wide ? 48 : 42, id: d.channelId ?? "", image: d.channelImage ?? "", fit: BoxFit.cover),
              const SizedBox(width: 10),
              Flexible(
                child: ConstrainedBox(
                constraints: BoxConstraints(maxWidth: wide ? 320 : 220),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(d.channelName ?? "", maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.urbanist(fontWeight: FontWeight.w700, fontSize: wide ? 17 : 15)),
                    Obx(() => Text(
                          "${CustomFormatNumber.convert(controller.customChanges["subscribe"] ?? 0)} ${AppStrings.subscribes.tr}",
                          style: GoogleFonts.urbanist(fontSize: wide ? 14 : 12, color: Colors.grey),
                        )),
                  ],
                ),
              ),
              ),
            ],
          ),
        ),
          ),
        ),
        const SizedBox(width: 12),
        if (isOwn)
          OutlinedButton.icon(
            onPressed: () => Get.to(() => EditVideoView(videoId: controller.videoId, videoType: d.videoType ?? 1)),
            icon: const Icon(Icons.edit_outlined, size: 18),
            label: const Text("Edit video"),
          )
        else
          Obx(() {
            final subscribed = controller.isSubscribe.value;
            final busy = controller.isSubscribeBusy.value;
            final label = subscribed ? AppStrings.subscribed.tr : (paid ? "Subscribe · ${d.subscriptionCost} coins/mo" : AppStrings.subscribe.tr);
            final onPressed = busy
                ? null
                : () {
                    if (!subscribed && paid) {
                      SubscribePremiumChannelBottomSheet.onShow(
                        coin: "${d.subscriptionCost ?? 0}",
                        callback: () async {
                          Get.back();
                          final ok = await controller.setSubscribed(true);
                          if (ok) {
                            SubscribedSuccessDialog.show(context);
                            // The subscription unlocks this channel's videos.
                            controller.onGetVideoDetails(controller.videoId);
                          }
                        },
                      );
                    } else {
                      controller.setSubscribed(!subscribed);
                    }
                  };
            return subscribed
                ? OutlinedButton(onPressed: onPressed, style: OutlinedButton.styleFrom(foregroundColor: AppColor.primaryColor, side: const BorderSide(color: AppColor.primaryColor), shape: const StadiumBorder()), child: Text(label))
                : FilledButton(onPressed: onPressed, style: FilledButton.styleFrom(backgroundColor: AppColor.primaryColor, shape: const StadiumBorder()), child: Text(label));
          }),
      ],
    );
  }

  Widget _actions(BuildContext context, DetailsOfVideo d, bool isOwn, bool wide) {
    final chips = <Widget>[
        Obx(() => _ActionChip(
              icon: controller.isLike.value ? AppIcons.likeBold : AppIcons.like,
              label: CustomFormatNumber.convert(controller.customChanges["like"] ?? 0),
              tooltip: controller.isLike.value ? "Remove like" : "Like",
              selected: controller.isLike.value,
              onTap: controller.toggleLike,
            )),
        Obx(() => _ActionChip(
              icon: controller.isDisLike.value ? AppIcons.disLikeBold : AppIcons.disLike,
              label: CustomFormatNumber.convert(controller.customChanges["disLike"] ?? 0),
              tooltip: controller.isDisLike.value ? "Remove dislike" : "Dislike",
              selected: controller.isDisLike.value,
              onTap: controller.toggleDislike,
            )),
        _ActionChip(
          icon: AppIcons.share,
          label: AppStrings.share.tr,
          tooltip: "Share a link to this video",
          onTap: () async {
            controller.videoPlayerController?.pause();
            await CommonShare.shareVideoLink(videoId: controller.videoId, title: d.title ?? "", image: d.videoImage, channelId: d.channelId);
            ShareCountApiClass.callApi(Database.loginUserId ?? "", controller.videoId);
          },
        ),
        Obx(() => _ActionChip(
              icon: controller.isSave.value ? AppIcons.saveDone1 : AppIcons.addToSave,
              label: controller.isSave.value ? AppStrings.saved.tr : AppStrings.save.tr,
              tooltip: controller.isSave.value ? "Remove from Watch Later" : "Save to Watch Later",
              selected: controller.isSave.value,
              onTap: controller.toggleSave,
            )),
        _downloadChip(context, d),
        if (!isOwn)
          PeakBoostButton(
            videoId: controller.videoId,
            creatorName: d.channelName,
            isOwnVideo: isOwn,
          ),
        _ActionChip(
          icon: AppIcons.report,
          label: AppStrings.report.tr,
          tooltip: "Report this video",
          onTap: () => CustomReportView.show(controller.videoId),
        ),
    ];
    if (wide) return Wrap(spacing: 8, runSpacing: 8, children: chips);
    // Phone: one swipeable row, as video apps do, instead of three wrapped rows.
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: [
          for (var i = 0; i < chips.length; i++) ...[
            if (i > 0) const SizedBox(width: 8),
            chips[i],
          ],
        ],
      ),
    );
  }

  Widget _downloadChip(BuildContext context, DetailsOfVideo d) {
    // A browser can't keep videos for offline viewing in the app; downloads
    // are a phone-app feature (and need a premium plan there).
    if (PlatformInfo.isWeb) {
      return _ActionChip(
        icon: AppIcons.videoDownload,
        label: AppStrings.download.tr,
        tooltip: "Downloads are available in the YouPeak Android app",
        dimmed: true,
        onTap: () => CustomToast.show("Offline downloads are available in the YouPeak Android app."),
      );
    }
    return Obx(() {
      if (controller.isDownloading.value) {
        return SizedBox(width: 48, height: 40, child: Center(child: SpinKitCircle(color: isDarkMode.value ? AppColor.white : AppColor.primaryColor, size: 28)));
      }
      final downloaded = DownloadHistory.mainDownloadHistory.any((m) => m['videoId'] == controller.videoId);
      return _ActionChip(
        icon: downloaded ? AppIcons.accept : AppIcons.videoDownload,
        label: downloaded ? "Downloaded" : AppStrings.download.tr,
        tooltip: "Download for offline viewing",
        onTap: () => _downloadOnPhone(context, d, downloaded),
      );
    });
  }

  Future<void> _downloadOnPhone(BuildContext context, DetailsOfVideo d, bool downloaded) async {
    if (downloaded) {
      CustomToast.show("Video Already Downloaded");
      return;
    }
    if (!(GetProfileApi.profileModel?.user?.isPremiumPlan ?? false)) {
      PremiumPlanDialog().show(context);
      return;
    }
    final source = Database.onGetVideoUrl(d.id ?? "") ?? await ConvertToNetwork.convert(d.videoUrl ?? "");
    if (source.isEmpty) {
      CustomToast.show("This video can't be downloaded.");
      return;
    }
    CustomToast.show("Downloading....");
    controller.isDownloading.value = true;
    AppSettings.isDownloading.value = true;
    try {
      final downloadPath = await CustomDownload.download(source, d.id ?? "");
      if (downloadPath == null) {
        CustomToast.show("Download failed. Please try again.");
        return;
      }
      final thumb = await VideoThumbnail.thumbnailFile(
        video: downloadPath,
        thumbnailPath: (await getTemporaryDirectory()).path,
        imageFormat: ImageFormat.JPEG,
        timeMs: 2000,
        maxHeight: 400,
        quality: 100,
      );
      DownloadHistory.mainDownloadHistory.insert(0, {
        "videoId": d.id,
        "videoTitle": d.title,
        "videoType": d.videoType,
        "videoTime": d.videoTime,
        "videoUrl": downloadPath,
        "videoImage": thumb ?? d.videoImage,
        "views": d.views,
        "channelId": d.channelId,
        "channelName": d.channelName,
        "time": DateTime.now().toString(),
      });
      DownloadHistory.onSet();
      LocalNotificationServices.onSendNotification("Download Complete", d.title ?? "", () {
        if (DownloadHistory.mainDownloadHistory.isEmpty) DownloadHistory.onGet();
        Get.to(() => const DownloadView());
      });
      CustomToast.show("Video download complete");
    } catch (e) {
      CustomToast.show("Download failed. Please try again.");
    } finally {
      controller.isDownloading.value = false;
      AppSettings.isDownloading.value = false;
    }
  }

  Widget _unlockCard(BuildContext context, DetailsOfVideo d) {
    final subscribers = d.channelType == 2;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColor.goldVipAccent.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColor.goldVipAccent.withValues(alpha: 0.6)),
      ),
      child: Row(
        children: [
          const Icon(Icons.lock_rounded),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              subscribers ? "Subscribe to this channel to watch its premium videos." : "Unlock this premium video for ${d.videoUnlockCost ?? 0} coins.",
              style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w600),
            ),
          ),
          if (!subscribers)
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: AppColor.primaryColor),
              onPressed: () => UnlockPremiumVideoBottomSheet.onShow(
                coin: "${d.videoUnlockCost ?? 0}",
                callback: () async {
                  Get.dialog(const LoaderUi(), barrierDismissible: false);
                  await UnlockPrivateVideoApi.callApi(loginUserId: Database.loginUserId ?? "", videoId: controller.videoId);
                  if (Get.isDialogOpen ?? false) Get.back();
                  final m = UnlockPrivateVideoApi.unlockPrivateVideoModel;
                  if (m?.isUnlocked == true) {
                    if (Get.isBottomSheetOpen ?? false) Get.back();
                    controller.onDisposeVideoPlayer();
                    await controller.init(controller.videoId, m?.videoUrl ?? "");
                    SubscribedSuccessDialog.show(context);
                  }
                  CustomToast.show(m?.message ?? "Couldn't unlock the video. Please try again.");
                },
              ),
              child: const Text("Unlock"),
            ),
        ],
      ),
    );
  }

  Widget _commentsSection(BuildContext context, DetailsOfVideo d, bool commentsOff, bool wide) {
    Future<void> openComments() async {
      controller.videoPlayerController?.pause();
      controller.customChanges["comment"] = await CommentBottomSheet.show(context, controller.videoId, d.channelId ?? "", (controller.customChanges["comment"] as num? ?? 0).toInt());
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDarkMode.value ? AppColor.white.withValues(alpha: 0.07) : const Color(0xFFF4F7F5),
        borderRadius: BorderRadius.circular(AppRadius.card),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Obx(() => Text("${AppStrings.comments.tr} · ${CustomFormatNumber.convert(controller.customChanges["comment"] ?? 0)}",
                  style: GoogleFonts.urbanist(fontSize: wide ? 17 : 15, fontWeight: FontWeight.w700))),
              const Spacer(),
              if (!commentsOff) TextButton(onPressed: openComments, child: const Text("View all")),
            ],
          ),
          if (commentsOff)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text("Comments are turned off for this video.", style: GoogleFonts.urbanist(color: Colors.grey, fontSize: 14)),
            )
          else
            Row(
              children: [
                Obx(() => PreviewProfileImage(size: 36, id: Database.channelId ?? "", image: AppSettings.profileImage.value, fit: BoxFit.cover)),
                const SizedBox(width: 8),
                Expanded(
                  child: Obx(() => TextField(
                        controller: controller.commentController,
                        enabled: !_posting.value,
                        maxLength: 1000,
                        minLines: 1,
                        maxLines: 4,
                        textInputAction: TextInputAction.send,
                        onChanged: (_) {},
                        onSubmitted: (_) => _send(context),
                        decoration: InputDecoration(
                          counterText: "",
                          isDense: true,
                          filled: true,
                          fillColor: isDarkMode.value ? AppColor.mainDark : AppColor.white,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                          hintText: AppStrings.addComments.tr,
                          hintStyle: GoogleFonts.urbanist(color: Colors.grey, fontSize: 14),
                          suffixIcon: _posting.value
                              ? const Padding(padding: EdgeInsets.all(12), child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)))
                              : IconButton(tooltip: "Post comment", onPressed: () => _send(context), icon: const Icon(Icons.send_rounded, color: AppColor.primaryColor)),
                        ),
                      )),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Future<void> _send(BuildContext context) async {
    final text = controller.commentController.text.trim();
    if (text.isEmpty || _posting.value) return;
    _posting.value = true;
    try {
      final ok = await controller.postComment(text, requestId: _draftRequestId);
      if (ok) {
        controller.commentController.clear();
        _draftRequestId = VideoEngagementApi.newRequestId();
        if (context.mounted) FocusScope.of(context).unfocus();
      }
    } finally {
      _posting.value = false;
    }
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({required this.icon, required this.label, required this.tooltip, required this.onTap, this.selected = false, this.dimmed = false});

  final String icon;
  final String label;
  final String tooltip;
  final VoidCallback onTap;
  final bool selected;
  final bool dimmed;

  @override
  Widget build(BuildContext context) {
    final dark = isDarkMode.value;
    final accent = dark ? AppColor.brightGreen : AppColor.primaryColor;
    final fg = selected ? accent : (dark ? AppColor.white : const Color(0xFF303030));
    return Tooltip(
      message: tooltip,
      child: Opacity(
        opacity: dimmed ? 0.55 : 1,
        child: AppPressable(
          onTap: onTap,
          haptic: true,
          pressedScale: 0.95,
          semanticLabel: tooltip,
          child: AnimatedContainer(
            duration: AppMotion.of(context),
            curve: AppMotion.curve,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: ShapeDecoration(
              color: selected ? accent.withValues(alpha: dark ? 0.20 : 0.12) : (dark ? AppColor.white.withValues(alpha: 0.08) : const Color(0xFFF0F4F1)),
              shape: StadiumBorder(side: BorderSide(color: selected ? accent.withValues(alpha: 0.4) : Colors.transparent)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                AppIcon(icon, size: 20, color: fg),
                const SizedBox(width: 8),
                Text(label, style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w700, color: fg)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DescriptionCard extends StatefulWidget {
  const _DescriptionCard({required this.description, required this.hashTags, required this.wide});

  final String description;
  final List<String> hashTags;
  final bool wide;

  @override
  State<_DescriptionCard> createState() => _DescriptionCardState();
}

class _DescriptionCardState extends State<_DescriptionCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final text = widget.description.trim();
    final tags = widget.hashTags.where((t) => t.trim().isNotEmpty).map((t) => t.startsWith("#") ? t : "#$t").join("  ");
    if (text.isEmpty && tags.isEmpty) return const SizedBox.shrink();
    final style = GoogleFonts.urbanist(fontSize: widget.wide ? 15 : 14, height: 1.45);
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => setState(() => _expanded = !_expanded),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDarkMode.value ? AppColor.white.withValues(alpha: 0.07) : const Color(0xFFF4F7F5),
          borderRadius: BorderRadius.circular(AppRadius.card),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (tags.isNotEmpty) Text(tags, style: style.copyWith(color: AppColor.primaryColor, fontWeight: FontWeight.w600)),
            if (text.isNotEmpty)
              _expanded
                  ? SelectableText(text, style: style)
                  : Text(text, style: style, maxLines: 3, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text(_expanded ? "Show less" : "Show more", style: style.copyWith(fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}

class _DetailsError extends StatelessWidget {
  const _DetailsError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const Icon(Icons.info_outline_rounded, size: 36, color: Colors.grey),
          const SizedBox(height: 8),
          Text(message, textAlign: TextAlign.center, style: GoogleFonts.urbanist(fontSize: 15)),
          const SizedBox(height: 12),
          OutlinedButton.icon(onPressed: onRetry, icon: const AppIcon(AppIcons.extraRetry, size: 20), label: const Text("Retry")),
        ],
      ),
    );
  }
}

class NormalVideoDetailsIconUi extends StatelessWidget {
  const NormalVideoDetailsIconUi(
      {super.key,
      required this.title,
      required this.icon,
      required this.callback});

  final String title;
  final String icon;
  final Callback callback;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        InkWell(
          onTap: callback,
          child: Container(
            height: 35,
            width: 35,
            color: AppColor.transparent,
            child: Center(
              child: AppIcon(
                icon,
                size: 22,
                color:
                    isDarkMode.value ? AppColor.white : const Color(0xFF424242),
              ),
            ),
          ),
        ),
        Text(
          title,
          style: GoogleFonts.urbanist(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: isDarkMode.value ? AppColor.white : const Color(0xFF424242),
          ),
        ),
      ],
    );
  }
}
