import 'dart:async';
import 'dart:developer';
import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:chewie/chewie.dart';
import 'package:floating/floating.dart';
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
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
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
import 'package:youpeak/features/comments/api/create_comment_api.dart';
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
import 'package:path_provider/path_provider.dart';
import 'package:video_thumbnail/video_thumbnail.dart';

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
    return PopScope(
      onPopInvoked: (didPop) async {
        // SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: [SystemUiOverlay.top, SystemUiOverlay.bottom]);
        // SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp, DeviceOrientation.portraitDown]);
        //
        // _controller.onDisposeVideoPlayer();

        SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual,
            overlays: [SystemUiOverlay.top, SystemUiOverlay.bottom]);
        await SystemChrome.setPreferredOrientations([
          DeviceOrientation.portraitUp,
          DeviceOrientation.portraitDown,
        ]);
      },
      canPop: MediaQuery.of(context).orientation != Orientation.landscape,
      child: PiPSwitcher(
        childWhenEnabled: GetBuilder<NormalVideoDetailsController>(
          id: "onVideoInitialize",
          builder: (controller) => (_controller.chewieController != null &&
                  (_controller.videoPlayerController?.value.isInitialized ??
                      false))
              ? SizedBox.expand(
                  child: FittedBox(
                    fit: BoxFit.cover,
                    child: SizedBox(
                      width:
                          _controller.videoPlayerController?.value.size.width ??
                              0,
                      height: _controller
                              .videoPlayerController?.value.size.height ??
                          0,
                      child: Chewie(controller: _controller.chewieController!),
                    ),
                  ),
                )
              : const Offstage(),
        ),
        childWhenDisabled: Scaffold(
          body: OrientationBuilder(builder: (context, orientation) {
            AppSettings.showLog("Current Orientation => $orientation");
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
                              GetBuilder<NormalVideoDetailsController>(
                                id: "onGetRelatedVideos",
                                builder: (controller) => controller
                                            .mainRelatedVideos ==
                                        null
                                    ? const NormalVideoShimmerUi()
                                        .paddingOnly(top: 10)
                                    : controller.mainRelatedVideos!.isEmpty
                                        ? const DataNotFoundUi(type: EmptyStateType.videos)
                                            .paddingSymmetric(vertical: 50)
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
                              ),
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
  }
}

class PreviewVideoUi extends StatelessWidget {
  const PreviewVideoUi({super.key, required this.orientation});

  final Orientation orientation;

  @override
  Widget build(BuildContext context) {
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
              height: orientation == Orientation.landscape
                  ? Get.height
                  : Get.height / 3.5,
              width: Get.width,
              color: AppColor.black,
            )
          : (controller.chewieController != null &&
                  (controller.videoPlayerController?.value.isInitialized ??
                      false))
              ? GestureDetector(
                  onTap: () => controller.showVideoControls(),
                  child: Container(
                    height: orientation == Orientation.landscape
                        ? Get.height
                        : Get.height / 3.5,
                    width: Get.width,
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
                                  height: orientation == Orientation.landscape
                                      ? Get.height
                                      : Get.height / 3.5,
                                  width: Get.width,
                                  child: Container(
                                    color: Colors.black,
                                    child: SizedBox.expand(
                                      child: FittedBox(
                                        fit: BoxFit.cover,
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
                                  top: Platform.isAndroid ? 30 : 40,
                                  child: SizedBox(
                                    width: Get.width,
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
                                                    width: Get.width / 2,
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
                                                    ? Get.bottomSheet(
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
                                                                      Get.bottomSheet(
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
                                      width: Get.width,
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
                                          width: Get.width,
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
                                          width: Get.width,
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
                                          width: Get.width,
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
                  height: orientation == Orientation.landscape
                      ? Get.height
                      : Get.height / 3.5,
                  width: Get.width,
                  color: AppColor.black,
                  child: Stack(
                    children: [
                      Positioned(
                        top: 30,
                        child: SizedBox(
                          width: Get.width,
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
                      const Center(
                          child: SpinKitCircle(
                              color: AppColor.primaryColor, size: 60)),
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

  @override
  Widget build(BuildContext context) {
    return Obx(
      () => controller.isVideoDetailsLoading.value
          ? const VideoDetailsShimmerUi()
          : Column(
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          controller.videoDetailsModel!.detailsOfVideo!.title!,
                          style: profileTitleStyle,
                          overflow: TextOverflow.ellipsis,
                          maxLines: 2,
                        ),
                      ),
                      IconButton(
                        padding: const EdgeInsets.only(left: 8),
                        onPressed: () {
                          controller.chewieController?.pause();
                          DescriptionBottomSheet.show(
                              controller.videoDetailsModel!.detailsOfVideo!
                                  .channelId!,
                              controller
                                  .videoDetailsModel!.detailsOfVideo!.title!,
                              controller.videoDetailsModel!.detailsOfVideo!
                                  .channelImage!,
                              controller.videoDetailsModel!.detailsOfVideo!
                                  .channelName!,
                              controller
                                  .videoDetailsModel!.detailsOfVideo!.like!,
                              controller
                                  .videoDetailsModel!.detailsOfVideo!.dislike!,
                              controller
                                  .videoDetailsModel!.detailsOfVideo!.views!,
                              controller.videoDetailsModel!.detailsOfVideo!
                                  .createdAt!,
                              controller
                                  .videoDetailsModel!.detailsOfVideo!.hashTag!
                                  .join(','),
                              controller.videoDetailsModel!.detailsOfVideo!
                                  .description!);
                        },
                        icon: const ImageIcon(AssetImage(AppIcons.arrowDown),
                            size: 20),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Text(
                      "${CustomFormatNumber.convert(controller.videoDetailsModel!.detailsOfVideo!.views!)} ${AppStrings.views.tr} - ${controller.videoDetailsModel!.detailsOfVideo!.time!}",
                      style: fillYourProfileStyle),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 15),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      NormalVideoDetailsIconUi(
                        title: CustomFormatNumber.convert(
                            controller.customChanges["like"]),
                        icon: controller.isLike.value
                            ? AppIcons.likeBold
                            : AppIcons.like,
                        callback: () async {
                          // if (!controller.isLike.value) {
                          //   if (controller.isDisLike.value) {
                          //     controller.isDisLike.value = false;
                          //     controller.customChanges["disLike"]--;
                          //   }
                          //   controller.isLike.value = true;
                          //   controller.customChanges["like"]++;
                          //   await LikeDisLikeVideoApi.callApi(controller.videoId, true);
                          // }

                          String videoId = controller.videoId;

                          // CASE 1: Already Liked → Remove Like
                          if (controller.isLike.value) {
                            controller.isLike.value = false;
                            controller.customChanges["like"]--;

                            await LikeDisLikeVideoApi.callApi(
                                videoId, "likeremove");
                            return;
                          }

                          // CASE 2: Disliked → Remove Dislike First
                          if (controller.isDisLike.value) {
                            controller.isDisLike.value = false;
                            controller.customChanges["disLike"]--;

                            await LikeDisLikeVideoApi.callApi(
                                videoId, "dislikeremove");
                          }

                          // CASE 3: Add Like
                          controller.isLike.value = true;
                          controller.customChanges["like"]++;

                          await LikeDisLikeVideoApi.callApi(videoId, "like");
                        },
                      ).paddingOnly(bottom: 2),
                      NormalVideoDetailsIconUi(
                        title: CustomFormatNumber.convert(
                            controller.customChanges["disLike"]),
                        icon: controller.isDisLike.value
                            ? AppIcons.disLikeBold
                            : AppIcons.disLike,
                        callback: () async {
                          // if (!controller.isDisLike.value) {
                          //   if (controller.isLike.value) {
                          //     controller.isLike.value = false;
                          //     controller.customChanges["like"]--;
                          //   }
                          //   controller.isDisLike.value = true;
                          //   controller.customChanges["disLike"]++;
                          //   await LikeDisLikeVideoApi.callApi(controller.videoId, false);
                          // }

                          String videoId = controller.videoId;

                          // CASE 1: Already Disliked → Remove Dislike
                          if (controller.isDisLike.value) {
                            controller.isDisLike.value = false;
                            controller.customChanges["disLike"]--;

                            await LikeDisLikeVideoApi.callApi(
                                videoId, "dislikeremove");
                            return;
                          }

                          // CASE 2: Liked → Remove Like First
                          if (controller.isLike.value) {
                            controller.isLike.value = false;
                            controller.customChanges["like"]--;

                            await LikeDisLikeVideoApi.callApi(
                                videoId, "likeremove");
                          }

                          // CASE 3: Add Dislike
                          controller.isDisLike.value = true;
                          controller.customChanges["disLike"]++;

                          await LikeDisLikeVideoApi.callApi(videoId, "dislike");
                        },
                      ).paddingOnly(top: 2),
                      NormalVideoDetailsIconUi(
                        title: AppStrings.comments.tr,
                        icon: AppIcons.boldChat,
                        callback: () async {
                          controller.chewieController?.pause();
                          controller.customChanges["comment"] =
                              await CommentBottomSheet.show(
                            context,
                            controller.videoId,
                            controller
                                .videoDetailsModel!.detailsOfVideo!.channelId!,
                            controller.customChanges["comment"],
                          );
                        },
                      ),
                      NormalVideoDetailsIconUi(
                        title: AppStrings.share.tr,
                        icon: AppIcons.share,
                        callback: () async {
                          controller.chewieController?.pause();

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
                                .videoDetailsModel!.detailsOfVideo!.title!,
                            url: controller
                                .videoDetailsModel!.detailsOfVideo!.videoUrl!,
                            channelId: controller
                                .videoDetailsModel!.detailsOfVideo!.channelId!,
                            id: controller
                                .videoDetailsModel!.detailsOfVideo!.id!,
                            image: controller
                                .videoDetailsModel!.detailsOfVideo!.videoImage!,
                            pageRoutes: "NormalVideo",
                          );

                          await ShareCountApiClass.callApi(
                              Database.loginUserId ?? "", controller.videoId);
                        },
                      ),
                      Obx(() => controller.isDownloading.value
                          ? Center(
                              child: SpinKitCircle(
                                  color: isDarkMode.value
                                      ? AppColor.white
                                      : (AppColor.primaryColor),
                                  size: 40))
                          : NormalVideoDetailsIconUi(
                              title: AppStrings.download.tr,
                              icon: DownloadHistory.mainDownloadHistory.any(
                                      (map) =>
                                          map['videoId'] == controller.videoId)
                                  ? AppIcons.accept
                                  : AppIcons.videoDownload,
                              callback: () async {
                                if (DownloadHistory.mainDownloadHistory.any(
                                    (map) =>
                                        map['videoId'] == controller.videoId)) {
                                  CustomToast.show("Video Already Downloaded");
                                } else if ((GetProfileApi
                                        .profileModel?.user?.isPremiumPlan ??
                                    false)) {
                                  CustomToast.show("Downloading....");
                                  controller.isDownloading.value = true;
                                  AppSettings.isDownloading.value = true;
                                  final downloadPath =
                                      await CustomDownload.download(
                                          Database.onGetVideoUrl(controller
                                                  .videoDetailsModel!
                                                  .detailsOfVideo!
                                                  .id!) ??
                                              await ConvertToNetwork.convert(
                                                  controller
                                                      .videoDetailsModel!
                                                      .detailsOfVideo!
                                                      .videoUrl!),
                                          controller.videoDetailsModel!
                                              .detailsOfVideo!.id!);

                                  if (downloadPath != null) {
                                      final downloadThumbnail =
                                          await VideoThumbnail.thumbnailFile(
                                        video: downloadPath,
                                        thumbnailPath:
                                            (await getTemporaryDirectory()).path,
                                        imageFormat: ImageFormat.JPEG,
                                        timeMs: 2000,
                                        maxHeight: 400,
                                        quality: 100,
                                      );
                                    if (downloadThumbnail != null) {
                                      DateTime now = DateTime.now();
                                      String formattedDate = now.toString();

                                      DownloadHistory.mainDownloadHistory
                                          .insert(
                                        0,
                                        {
                                          "videoId": controller
                                              .videoDetailsModel!
                                              .detailsOfVideo!
                                              .id!,
                                          "videoTitle": controller
                                              .videoDetailsModel!
                                              .detailsOfVideo!
                                              .title!,
                                          "videoType": controller
                                              .videoDetailsModel!
                                              .detailsOfVideo!
                                              .videoType!,
                                          "videoTime": controller
                                              .videoDetailsModel!
                                              .detailsOfVideo!
                                              .videoTime!,
                                          "videoUrl": downloadPath,
                                          "videoImage": downloadThumbnail,
                                          "views": controller.videoDetailsModel!
                                              .detailsOfVideo!.views!,
                                          "channelId": controller
                                              .videoDetailsModel!
                                              .detailsOfVideo!
                                              .channelId!,
                                          "channelName": controller
                                              .videoDetailsModel!
                                              .detailsOfVideo!
                                              .channelName!,
                                          "time": formattedDate
                                        },
                                      );
                                      DownloadHistory.onSet();
                                    }
                                    LocalNotificationServices
                                        .onSendNotification(
                                      "Download Complete",
                                      controller.videoDetailsModel!
                                          .detailsOfVideo!.title!,
                                      () {
                                        AppSettings.showLog(
                                            "Go To Download Routes");
                                        if (DownloadHistory
                                            .mainDownloadHistory.isEmpty) {
                                          DownloadHistory.onGet();
                                        }
                                        Get.to(() => const DownloadView());
                                      },
                                    );
                                    CustomToast.show("Video download complete");
                                    controller.isDownloading.value = false;
                                    AppSettings.isDownloading.value = false;
                                  } else {
                                    controller.isDownloading.value = false;
                                    AppSettings.isDownloading.value = false;
                                  }
                                } else {
                                  PremiumPlanDialog().show(context);
                                }
                              },
                            )),
                      // Obx(
                      //   () => NormalVideoDetailsIconUi(
                      //     title: controller.isSave.value ? AppStrings.saved.tr : AppStrings.save.tr,
                      //     icon: controller.isSave.value ? AppIcons.saveDone1 : AppIcons.addToSave,
                      //     callback: () {
                      //       if (controller.isSave.value == false) {
                      //         controller.isSave.value = true;
                      //         CustomToast.show(AppStrings.addToWatchLater.tr);
                      //         CreateWatchLater.callApi(Database.loginUserId!, controller.videoId);
                      //       }
                      //     },
                      //   ),
                      // ),
                      Obx(
                        () => NormalVideoDetailsIconUi(
                          title: controller.isSave.value
                              ? AppStrings.saved.tr
                              : AppStrings.save.tr,
                          icon: controller.isSave.value
                              ? AppIcons.saveDone1
                              : AppIcons.addToSave,
                          callback: () async {
                            if (Database.loginUserId == null || Database.loginUserId!.isEmpty) {
                              CustomToast.show("Please login first");
                              return;
                            }
                            if (controller.isSave.value) {
                              // 🔴 Unsave
                              controller.isSave.value = false;
                              CustomToast.show(
                                  AppStrings.removeFromWatchLater.tr);

                              await RemoveWatchLater.callApi(
                                Database.loginUserId!,
                                controller.videoId,
                              );
                            } else {
                              // 🟢 Save
                              controller.isSave.value = true;
                              CustomToast.show(AppStrings.addToWatchLater.tr);

                              await CreateWatchLater.callApi(
                                Database.loginUserId!,
                                controller.videoId,
                              );
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: SizeConfig.blockSizeVertical * 1),
                const Divider(indent: 5, endIndent: 5, height: 5),
                GestureDetector(
                  onTap: () => Get.to(
                    () => YourChannelView(
                      loginUserId: Database.loginUserId ?? "",
                      channelId: controller
                              .videoDetailsModel?.detailsOfVideo?.channelId ??
                          "",
                    ),
                  ),
                  child: ListTile(
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
                    dense: true,
                    leading: PreviewProfileImage(
                      size: 45,
                      id: controller
                              .videoDetailsModel?.detailsOfVideo?.channelId ??
                          "",
                      image: controller.videoDetailsModel?.detailsOfVideo
                              ?.channelImage ??
                          "",
                      fit: BoxFit.cover,
                    ),
                    title: Text(
                      controller
                          .videoDetailsModel!.detailsOfVideo!.channelName!,
                      style: GoogleFonts.urbanist(
                          fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    subtitle: Obx(
                      () => Text(
                        "${CustomFormatNumber.convert(controller.customChanges["subscribe"])} ${AppStrings.subscribes.tr}",
                        style: GoogleFonts.urbanist(),
                      ),
                    ),
                    trailing: Visibility(
                      visible: Database.channelId !=
                          controller
                              .videoDetailsModel?.detailsOfVideo?.channelId,
                      child: controller.videoDetailsModel?.detailsOfVideo
                                  ?.channelType ==
                              2
                          ? GestureDetector(
                              onTap: () async {
                                if (controller.isSubscribe.value == false) {
                                  SubscribePremiumChannelBottomSheet.onShow(
                                    coin: (controller
                                                .videoDetailsModel
                                                ?.detailsOfVideo
                                                ?.subscriptionCost ??
                                            0)
                                        .toString(),
                                    callback: () async {
                                      Get.dialog(const LoaderUi(),
                                          barrierDismissible: false);
                                      final bool isSuccess =
                                          await SubscribeChannelApiClass
                                              .callApi(controller
                                                      .videoDetailsModel
                                                      ?.detailsOfVideo
                                                      ?.channelId ??
                                                  "");

                                      Get.close(2);

                                      if (isSuccess) {
                                        if (controller.isSubscribe.value) {
                                          controller.isSubscribe.value = false;
                                          controller
                                              .customChanges["subscribe"]--;
                                        } else {
                                          controller.isSubscribe.value = true;
                                          controller
                                              .customChanges["subscribe"]++;
                                        }
                                      }
                                    },
                                  );
                                } else {
                                  if (controller.isSubscribe.value) {
                                    controller.isSubscribe.value = false;
                                    controller.customChanges["subscribe"]--;
                                  } else {
                                    controller.isSubscribe.value = true;
                                    controller.customChanges["subscribe"]++;
                                  }
                                  await SubscribeChannelApiClass.callApi(
                                      controller.videoDetailsModel!
                                          .detailsOfVideo!.channelId!);
                                }
                              },
                              child: Obx(
                                () => Container(
                                  height: 40,
                                  width:
                                      controller.isSubscribe.value ? 100 : 150,
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: controller.isSubscribe.value
                                        ? Colors.transparent
                                        : AppColor.primaryColor,
                                    border: controller.isSubscribe.value
                                        ? Border.all(
                                            color: AppColor.primaryColor,
                                            width: 1.5)
                                        : null,
                                    borderRadius: BorderRadius.circular(100),
                                  ),
                                  child: controller.isSubscribe.value
                                      ? Text(
                                          "Subscribed",
                                          textAlign: TextAlign.center,
                                          style: GoogleFonts.urbanist(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 14,
                                            color: AppColor.primaryColor,
                                          ),
                                        )
                                      : Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              "Subscribe",
                                              textAlign: TextAlign.center,
                                              style: GoogleFonts.urbanist(
                                                fontWeight: FontWeight.w600,
                                                fontSize: 14,
                                                color: AppColor.white,
                                              ),
                                            ),
                                            8.width,
                                            Image.asset(AppIcons.coin,
                                                width: 15),

                                            ///TODO subscription cost show 0
                                            Text(
                                              " ${cost}/m",
                                              // " ${CustomFormatNumber.convert(0)}/m",
                                              textAlign: TextAlign.center,
                                              style: GoogleFonts.urbanist(
                                                fontWeight: FontWeight.w600,
                                                fontSize: 14,
                                                color: AppColor.white,
                                              ),
                                            ),
                                          ],
                                        ),
                                ),
                              ),
                            )
                          : GestureDetector(
                              onTap: () async {
                                if (controller.isSubscribe.value) {
                                  controller.isSubscribe.value = false;
                                  controller.customChanges["subscribe"]--;
                                } else {
                                  controller.isSubscribe.value = true;
                                  controller.customChanges["subscribe"]++;
                                }
                                await SubscribeChannelApiClass.callApi(
                                    controller.videoDetailsModel!
                                        .detailsOfVideo!.channelId!);
                              },
                              child: Obx(
                                () => Container(
                                  height: 40,
                                  width: SizeConfig.screenWidth / 3.8,
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(25),
                                    border: Border.all(
                                        color: AppColor.primaryColor, width: 2),
                                    color: controller.isSubscribe.value
                                        ? Colors.transparent
                                        : AppColor.primaryColor,
                                  ),
                                  child: Text(
                                    controller.isSubscribe.value
                                        ? AppStrings.subscribed.tr
                                        : AppStrings.subscribe.tr,
                                    style: GoogleFonts.urbanist(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: controller.isSubscribe.value
                                          ? AppColor.primaryColor
                                          : AppColor.white,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                    ),
                  ),
                ),
                const Divider(indent: 5, endIndent: 5, height: 5),
                Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: GestureDetector(
                    onTap: () async {
                      controller.chewieController?.pause();
                      controller.customChanges["comment"] =
                          await CommentBottomSheet.show(
                        context,
                        controller.videoId,
                        controller
                            .videoDetailsModel!.detailsOfVideo!.channelId!,
                        controller.customChanges["comment"],
                      );
                    },
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text.rich(
                          TextSpan(
                            children: [
                              TextSpan(
                                text: "${AppStrings.comments.tr} ",
                                style: GoogleFonts.urbanist(
                                    fontSize: 15, fontWeight: FontWeight.w500),
                              ),
                              TextSpan(
                                text: CustomFormatNumber.convert(
                                    controller.customChanges["comment"]),
                                style: GoogleFonts.urbanist(
                                    fontSize: 15, fontWeight: FontWeight.w500),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          padding: const EdgeInsets.symmetric(horizontal: 0),
                          onPressed: () async {
                            controller.chewieController?.pause();
                            controller.customChanges["comment"] =
                                await CommentBottomSheet.show(
                              context,
                              controller.videoId,
                              controller.videoDetailsModel!.detailsOfVideo!
                                  .channelId!,
                              controller.customChanges["comment"],
                            );
                          },
                          icon: const ImageIcon(AssetImage(AppIcons.swap),
                              size: 20),
                        ),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      GestureDetector(
                        child: Obx(
                          () => PreviewProfileImage(
                            size: 40,
                            id: Database.channelId ?? "",
                            image: AppSettings.profileImage.value,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextFormField(
                          controller: controller.commentController,
                          keyboardType: TextInputType.multiline,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: isDarkMode.value
                                ? AppColor.secondDarkMode
                                : AppColor.grey_200,
                            contentPadding: const EdgeInsets.only(left: 10),
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide.none),
                            hintText: AppStrings.addComments.tr,
                            hintStyle: GoogleFonts.urbanist(
                                color: Colors.grey, fontSize: 14),
                            suffixIcon: IconButton(
                              onPressed: () async {
                                if (controller
                                    .commentController.text.isNotEmpty) {
                                  final commentText =
                                      controller.commentController.text;
                                  controller.commentController.clear();
                                  controller.customChanges["comment"]++;
                                  FocusScope.of(context)
                                      .requestFocus(FocusNode());
                                  await CreateCommentApiClass.callApi(
                                      controller.videoId, commentText);
                                }
                              },
                              icon: const Icon(Icons.send_rounded,
                                  color: Colors.grey),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: SizeConfig.blockSizeVertical * 1),
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
              child: Image(
                image: AssetImage(icon),
                height: 22,
                width: 22,
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
