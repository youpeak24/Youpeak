import 'package:youpeak/shared/dialogs/app_sheet.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'dart:core';

import 'package:flutter/material.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/ads/google_large_native_ad.dart';
import 'package:youpeak/core/ads/google_small_native_ad.dart';
import 'package:youpeak/core/utils/custom_check_internet.dart';
import 'package:youpeak/core/utils/custom_format_timer.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/shared/widgets/normal_video_ui.dart';
import 'package:youpeak/shared/widgets/short_video_ui.dart';
import 'package:youpeak/shared/widgets/small_video_widget.dart';
import 'package:youpeak/shared/shimmer/normal_video_shimmer_ui.dart';
import 'package:youpeak/shared/shimmer/shorts_list_shimmer_ui.dart';
import 'package:youpeak/shared/shimmer/video_list_shimmer_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/shared/views/network_issue_view.dart';
import 'package:youpeak/features/live/api/get_live_users_api.dart';
import 'package:youpeak/features/live/view/live_view.dart';
import 'package:youpeak/features/live/controller/socket_manager_controller.dart';
import 'package:youpeak/features/subscriptions/api/get_subscribed_channel_api.dart';
import 'package:youpeak/features/subscriptions/controller/nav_subscription_controller.dart';
import 'package:youpeak/features/home/widget/nav_home_widget.dart';
import 'package:youpeak/features/subscriptions/model/get_subscribed_channel_video_model.dart';
import 'package:youpeak/features/subscriptions/view/subscribed_channel_view.dart';
import 'package:youpeak/features/notifications/view/notification_view.dart';
import 'package:youpeak/features/profile/view/profile_view.dart';
import 'package:youpeak/features/search/view/search_view.dart';
import 'package:youpeak/features/video/view/normal_video_details_view.dart';
import 'package:youpeak/features/video/view/shorts_video_details_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/shared/widgets/video_card_parts.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';

class NavSubscriptionView extends GetView<NavSubscriptionPageController> {
  const NavSubscriptionView({super.key});

  @override
  Widget build(BuildContext context) {
    List videoTypes = ['video'.tr, 'shorts'.tr];
    List subscribeType = ["all".tr, "today".tr, "continueWatching".tr];

    GetLiveUsersApi.callApi(loginUserId: Database.loginUserId ?? "");
    GetSubScribedChannelApiClass.startPagination = 0;
    controller.onGetSubscribedChannels();
    controller.selectedChannel = null;

    controller.selectedSubscribeType = 0;
    controller.selectedVideoType = 0;

    controller.mainAllChannelVideos[0] = null;
    controller.mainAllChannelVideos[1] = null;
    controller.mainAllChannelVideos[2] = null;

    controller.particularChannelVideos[0] = null;
    controller.particularChannelVideos[1] = null;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        AppSettings.navigationIndex.value = 0;
      },
      child: Scaffold(
        appBar: AppBar(
          elevation: 0,
          leading: const Padding(
            padding: EdgeInsets.only(left: 15),
            child: Icon(
              Icons.play_arrow_rounded,
              color: AppColor.primaryColor,
              size: 30,
            ),
          ),
          leadingWidth: 45,
          titleSpacing: 10,
          title: Text(
            AppStrings.subscriptions.tr,
            style: GoogleFonts.urbanist(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.3,
            ),
          ),
          actions: [
            AppPressable(
              onTap: () => Get.to(() => const SearchView(isSearchShorts: false)),
              semanticLabel: "Search",
              child: SizedBox(
                width: 48,
                height: 48,
                child: Center(
                  child: AppIcon(
                    AppIcons.search,
                    size: 21,
                    color: isDarkMode.value ? AppColor.white : AppColor.black,
                  ),
                ),
              ),
            ),
            AppPressable(
              onTap: () => Get.to(() => const NotificationPageView()),
              semanticLabel: "Notifications",
              child: SizedBox(
                width: 48,
                height: 48,
                child: Center(
                  child: AppIcon(
                    AppIcons.notification,
                    size: 21,
                    color: isDarkMode.value ? AppColor.white : AppColor.black,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 6),
            AppPressable(
              onTap: () => Get.to(() => const ProfileView()),
              semanticLabel: "Profile",
              child: SizedBox(
                width: 48,
                height: 48,
                child: Center(
                  child: Obx(
                    () => PreviewProfileImage(
                      size: 35,
                      id: Database.channelId ?? "",
                      image: AppSettings.profileImage.value,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 15),
          ],
        ),
        body: !CustomCheckInternet.isConnect.value
            ? const NetworkIssueView()
            : GetBuilder<NavSubscriptionPageController>(
                id: "onGetSubscribedChannels",
                builder: (controller) => controller.mainSubscribedChannels == null
                    ? const LoaderUi()
                    : controller.mainSubscribedChannels!.isEmpty
                        ? DataNotFoundUi(type: EmptyStateType.subscriptions, title: AppStrings.noSubscribedChannel.tr)
                        : GetBuilder<NavSubscriptionPageController>(
                            id: "onChangeVideoType",
                            builder: (controller) => NestedScrollView(
                                  controller: controller.selectedChannel == null
                                      ? controller.allVideoScrollController
                                      : controller.selectedVideoType == 0
                                          ? controller.normalVideoController
                                          : controller.shortsVideoController,
                                  floatHeaderSlivers: true,
                                  headerSliverBuilder: (BuildContext context, bool innerBoxIsScrolled) {
                                    return <Widget>[
                                      SliverList(
                                        delegate: SliverChildListDelegate(
                                          [
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Text(
                                                  "${AppStrings.subscriptionsChannel.tr} (${controller.mainSubscribedChannels!.length})",
                                                  style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: -0.2),
                                                ),
                                                AppPressable(
                                                  onTap: () => Get.to(() => SubscribedChannelView(loginUserId: Database.loginUserId ?? "")),
                                                  semanticLabel: AppStrings.viewAll.tr,
                                                  child: Padding(
                                                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                                                    child: Text(
                                                      AppStrings.viewAll.tr,
                                                      style: GoogleFonts.urbanist(color: AppColor.primaryColor, fontWeight: FontWeight.w800, fontSize: 14.5),
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ).paddingSymmetric(horizontal: 15, vertical: 5),
                                            Stack(
                                              children: [
                                                SizedBox(
                                                    height: 90,
                                                    width: double.infinity,
                                                    child: SingleChildScrollView(
                                                      scrollDirection: Axis.horizontal,
                                                      child: ListView.builder(
                                                        shrinkWrap: true,
                                                        itemCount: controller.mainSubscribedChannels?.length ?? 0,
                                                        padding: const EdgeInsets.only(left: 10, right: 10),
                                                        scrollDirection: Axis.horizontal,
                                                        itemBuilder: (context, index) {
                                                          return GestureDetector(
                                                            onDoubleTap: () => controller.onChangeParticularChannel(index),
                                                            onTap: () {
                                                              if (GetLiveUsersApi.isLive(controller.mainSubscribedChannels![index].channelId!) && (socket?.connected ?? false)) {
                                                                Get.to(
                                                                  () => LivePage(
                                                                    isHost: false,
                                                                    localUserID: Database.loginUserId ?? "",
                                                                    localUserName: AppSettings.channelName.value,
                                                                    roomID: GetLiveUsersApi.roomId(controller.mainSubscribedChannels![index].channelId!),
                                                                  ),
                                                                )?.then((value) => AppSettings.navigationIndex(0));
                                                              } else {
                                                                controller.onChangeParticularChannel(index);
                                                              }
                                                            },
                                                            child: Container(
                                                              margin: const EdgeInsets.only(right: 5),
                                                              width: 70,
                                                              child: Column(
                                                                crossAxisAlignment: CrossAxisAlignment.center,
                                                                children: [
                                                                  SizedBox(
                                                                    height: 65,
                                                                    child: Stack(
                                                                      children: [
                                                                        GetBuilder<NavSubscriptionPageController>(
                                                                          id: "onChangeParticularChannel",
                                                                          builder: (controller) => Container(
                                                                            height: 60,
                                                                            width: 60,
                                                                            padding: const EdgeInsets.all(3),
                                                                            decoration: BoxDecoration(
                                                                              shape: BoxShape.circle,
                                                                              border: Border.all(
                                                                                color: controller.selectedChannel == index ? AppColor.primaryColor : Colors.transparent,
                                                                                width: 2.5,
                                                                              ),
                                                                            ),
                                                                            child: PreviewProfileImage(
                                                                              size: 30,
                                                                              id: controller.mainSubscribedChannels![index].channelId ?? "",
                                                                              image: controller.mainSubscribedChannels![index].channelImage ?? "",
                                                                              fit: BoxFit.cover,
                                                                            ),
                                                                          ),
                                                                        ),
                                                                        GetLiveUsersApi.isLive(controller.mainSubscribedChannels![index].channelId!)
                                                                            ? Positioned(
                                                                                bottom: 0,
                                                                                left: 15,
                                                                                child: Container(
                                                                                  padding: const EdgeInsets.only(left: 5, right: 5, bottom: 2),
                                                                                  decoration: BoxDecoration(
                                                                                    color: AppColor.notificationAccent,
                                                                                    borderRadius: BorderRadius.circular(5),
                                                                                    border: Border.all(color: AppColor.white),
                                                                                  ),
                                                                                  child: Row(
                                                                                    mainAxisSize: MainAxisSize.min,
                                                                                    children: [
                                                                                      Image.asset(AppVisuals.liveBadge, width: 9, height: 9),
                                                                                      const SizedBox(width: 2),
                                                                                      Text(
                                                                                      "Live",
                                                                                      style: GoogleFonts.urbanist(
                                                                                        color: AppColor.white,
                                                                                        fontSize: 10,
                                                                                        fontWeight: FontWeight.bold,
                                                                                      ),
                                                                                    ),
                                                                                    ],
                                                                                  ),
                                                                                ),
                                                                              )
                                                                            : const Offstage(),
                                                                      ],
                                                                    ),
                                                                  ),
                                                                  const SizedBox(height: 5),
                                                                  Text(
                                                                    controller.mainSubscribedChannels![index].channelName.toString(),
                                                                    textAlign: TextAlign.center,
                                                                    overflow: TextOverflow.ellipsis,
                                                                    style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600),
                                                                  ),
                                                                ],
                                                              ),
                                                            ),
                                                          );
                                                        },
                                                      ),
                                                    )),
                                                Positioned(
                                                  right: 10,
                                                  top: 12,
                                                  child: Obx(
                                                    () => Visibility(
                                                        visible: controller.isChannelPaginationLoading.value,
                                                        child: const CircularProgressIndicator(
                                                          color: AppColor.primaryColor,
                                                        )),
                                                  ),
                                                )
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      PreferredSize(
                                        preferredSize: const Size.fromHeight(50),
                                        child: SliverAppBar(
                                          toolbarHeight: 0,
                                          pinned: true,
                                          floating: true,
                                          bottom: PreferredSize(
                                            preferredSize: const Size.fromHeight(50),
                                            child: GetBuilder<NavSubscriptionPageController>(
                                              id: "onChangeParticularChannel",
                                              builder: (controller) => controller.selectedChannel == null
                                                  ? SizedBox(
                                                      height: 50,
                                                      width: double.infinity,
                                                      child: Center(
                                                        child: ListView.builder(
                                                          scrollDirection: Axis.horizontal,
                                                          padding: const EdgeInsets.only(left: 15, right: 15, bottom: 8, top: 8),
                                                          itemCount: subscribeType.length,
                                                          itemBuilder: (context, index) {
                                                            return GestureDetector(
                                                              onTap: () => controller.onChangeSubscribeType(index),
                                                              child: GetBuilder<NavSubscriptionPageController>(
                                                                id: "onChangeSubscribeType",
                                                                builder: (controller) => Container(
                                                                  padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 2),
                                                                  margin: const EdgeInsets.only(right: 10),
                                                                  decoration: BoxDecoration(
                                                                    color: controller.selectedSubscribeType == index
                                                                        ? AppColor.primaryColor
                                                                        : (isDarkMode.value ? AppColor.white.withValues(alpha: 0.09) : AppColor.secondaryMintGreen),
                                                                    borderRadius: BorderRadius.circular(AppRadius.chip),
                                                                  ),
                                                                  child: Center(
                                                                    child: Text(
                                                                      subscribeType[index],
                                                                      textAlign: TextAlign.center,
                                                                      style: GoogleFonts.urbanist(
                                                                        fontWeight: controller.selectedSubscribeType == index ? FontWeight.w800 : FontWeight.w600,
                                                                        fontSize: 14,
                                                                        color: controller.selectedSubscribeType == index
                                                                            ? AppColor.white
                                                                            : (isDarkMode.value ? AppColor.white : AppColor.primaryTextIcons),
                                                                      ),
                                                                    ),
                                                                  ),
                                                                ),
                                                              ),
                                                            );
                                                          },
                                                        ),
                                                      ),
                                                    )
                                                  : SizedBox(
                                                      height: 50,
                                                      width: double.infinity,
                                                      child: ListView.builder(
                                                        scrollDirection: Axis.horizontal,
                                                        padding: const EdgeInsets.only(left: 15, right: 15, bottom: 8, top: 8),
                                                        itemCount: videoTypes.length,
                                                        itemBuilder: (context, index) {
                                                          return GestureDetector(
                                                            onTap: () => controller.onChangeVideoType(index),
                                                            child: GetBuilder<NavSubscriptionPageController>(
                                                              id: "onChangeVideoType",
                                                              builder: (controller) => Container(
                                                                padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 2),
                                                                margin: const EdgeInsets.only(right: 8),
                                                                decoration: BoxDecoration(
                                                                  color: controller.selectedVideoType == index
                                                                      ? AppColor.primaryColor
                                                                      : (isDarkMode.value ? AppColor.white.withValues(alpha: 0.09) : AppColor.secondaryMintGreen),
                                                                  borderRadius: BorderRadius.circular(AppRadius.chip),
                                                                ),
                                                                child: Center(
                                                                  child: Text(
                                                                    videoTypes[index],
                                                                    textAlign: TextAlign.center,
                                                                    style: GoogleFonts.urbanist(
                                                                      fontWeight: controller.selectedVideoType == index ? FontWeight.w800 : FontWeight.w600,
                                                                      fontSize: 14,
                                                                      color: controller.selectedVideoType == index
                                                                          ? AppColor.white
                                                                          : (isDarkMode.value ? AppColor.white : AppColor.primaryTextIcons),
                                                                    ),
                                                                  ),
                                                                ),
                                                              ),
                                                            ),
                                                          );
                                                        },
                                                      ),
                                                    ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ];
                                  },
                                  body: GetBuilder<NavSubscriptionPageController>(
                                    id: "onChangeParticularChannel",
                                    builder: (controller) => controller.selectedChannel == null
                                        ? const TypeWiseSubscribedVideo()
                                        : GetBuilder<NavSubscriptionPageController>(
                                            id: "onChangeVideoType",
                                            builder: (controller) => controller.selectedVideoType == 0 ? const SubscribeChannelNormalVideo() : const SubscribeChannelShortsVideo(),
                                          ),
                                  ),
                                )),
              ),
      ),
    );
  }
}

class TypeWiseSubscribedVideo extends StatelessWidget {
  const TypeWiseSubscribedVideo({super.key});

  static bool _isLocked(VideoOfSubscribedChannel video) => video.videoPrivacyType == 2 && video.channelType == 1;

  Widget _videoCard(BuildContext context, NavSubscriptionPageController controller, List<VideoOfSubscribedChannel> videos, int index) {
    final indexData = videos[index];
    if (_isLocked(indexData)) {
      return PrivateContentNormalVideoUi(
        videoId: indexData.id ?? "",
        title: indexData.videoTitle ?? "",
        videoImage: indexData.videoImage ?? "",
        videoUrl: indexData.videoUrl ?? "",
        videoTime: indexData.videoTime?.toInt() ?? 0,
        channelId: indexData.channelId ?? "",
        channelImage: indexData.channelImage ?? "",
        channelName: indexData.channelName ?? "",
        views: indexData.views?.toInt() ?? 0,
        uploadTime: (indexData.videoTime ?? 0).toString(),
        isSave: indexData.isSaveToWatchLater ?? false,
        subscribeCallback: () {},
        videoCallback: () => controller.onUnlockPrivateVideo(index: index, context: context, isAllChannel: true),
        videoCost: indexData.videoUnlockCost?.toInt() ?? 0,
        subscribeCost: indexData.subscriptionCost?.toInt() ?? 0,
        channelType: indexData.channelType?.toInt() ?? 1,
      );
    }
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: () => Get.to(NormalVideoDetailsView(
          videoId: indexData.videoId ?? "",
          videoUrl: indexData.videoUrl ?? "",
          cost: indexData.subscriptionCost,
        )),
        child: NormalVideoUi(
          videoId: indexData.videoId ?? "",
          title: indexData.videoTitle ?? "",
          videoImage: indexData.videoImage ?? "",
          videoUrl: indexData.videoUrl ?? "",
          videoTime: indexData.videoTime?.toInt() ?? 0,
          channelId: indexData.channelId ?? "",
          channelImage: indexData.channelImage ?? "",
          channelName: indexData.channelName ?? "",
          views: indexData.views?.toInt() ?? 0,
          isSave: indexData.isSaveToWatchLater ?? false,
        ),
      ),
    );
  }

  // Horizontal row of the Bites among the videos.
  Widget _shortsShelf(NavSubscriptionPageController controller, List<VideoOfSubscribedChannel> videos) {
    final shortIndexes = [for (var i = 0; i < videos.length; i++) if (videos[i].videoType == 2) i];
    return SizedBox(
      height: 280,
      child: ListView.builder(
        itemCount: shortIndexes.length,
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.only(left: 10, bottom: 10),
        itemBuilder: (BuildContext context, int position) {
          final index = shortIndexes[position];
          final indexData = videos[index];
          if (_isLocked(indexData)) {
            return ShortsPrivateContentWidget(
              id: indexData.id ?? "",
              image: indexData.videoImage ?? "",
              subscribe: () {},
              unlock: () => controller.onUnlockPrivateVideo(index: index, context: context, isAllChannel: true),
              subscribeCoin: indexData.subscriptionCost?.toInt() ?? 0,
              unlockCoin: indexData.videoUnlockCost?.toInt() ?? 0,
              title: indexData.videoTitle ?? "",
              views: indexData.views?.toInt() ?? 0,
              channelType: indexData.channelType?.toInt() ?? 1,
            );
          }
          return MouseRegion(
            cursor: SystemMouseCursors.click,
            child: GestureDetector(
              onTap: () => Get.to(ShortsVideoDetailsView(videoId: indexData.videoId ?? "", videoUrl: indexData.videoUrl ?? "")),
              child: ShortVideoUi(
                videoId: indexData.videoId ?? "",
                title: indexData.videoTitle ?? "",
                videoImage: indexData.videoImage ?? "",
                videoUrl: indexData.videoUrl ?? "",
                channelId: indexData.channelId ?? "",
                views: indexData.views?.toInt() ?? 0,
                videoTime: indexData.videoTime?.toInt() ?? 0,
                channelName: indexData.channelName ?? "",
                isSave: indexData.isSaveToWatchLater ?? false,
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<NavSubscriptionPageController>(
      id: "onChangeSubscribeType",
      builder: (controller) => GetBuilder<NavSubscriptionPageController>(
        id: "typeWiseGetSubScribedVideo",
        builder: (controller) {
          final videos = controller.mainAllChannelVideos[controller.selectedSubscribeType];
          if (videos == null) return AppLayout.isWideWeb ? const WideVideoGridShimmer() : const NormalVideoShimmerUi();
          if (videos.isEmpty) return const DataNotFoundUi(type: EmptyStateType.subscriptions);

          final hasShorts = videos.any((video) => video.videoType == 2);

          if (AppLayout.isWideWeb) {
            final videoIndexes = [for (var i = 0; i < videos.length; i++) if (videos[i].videoType == 1) i];
            return SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              child: VideoGrid(
                itemCount: videoIndexes.length,
                itemBuilder: (context, position) => _videoCard(context, controller, videos, videoIndexes[position]),
                firstRowTrailer: hasShorts ? Padding(padding: const EdgeInsets.only(bottom: 16), child: _shortsShelf(controller, videos)) : null,
              ),
            );
          }

          return SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: ListView.separated(
              shrinkWrap: true,
              padding: const EdgeInsets.symmetric(horizontal: 5),
              physics: const NeverScrollableScrollPhysics(),
              itemCount: videos.length,
              itemBuilder: (context, index) {
                if (videos[index].videoType != 1) return const Offstage();
                return Column(
                  children: [
                    _videoCard(context, controller, videos, index),
                    index != 0 && index % AppSettings.showAdsIndex == 0 ? const GoogleLargeNativeAd() : const Offstage()
                  ],
                );
              },
              separatorBuilder: (context, index) => hasShorts && index == 0 ? _shortsShelf(controller, videos) : const Offstage(),
            ),
          );
        },
      ),
    );
  }
}

class SubscribeChannelNormalVideo extends StatelessWidget {
  const SubscribeChannelNormalVideo({super.key});

  Widget _item(BuildContext context, NavSubscriptionPageController controller, int index, {required bool withAd}) {
                      final indexData = controller.particularChannelVideos[0]![index];
                      return ((indexData.videoPrivacyType == 2 && indexData.channelType == 1) || (indexData.videoPrivacyType == 2 && indexData.channelType == 2 && indexData.isSubscribed == false))
                          ? GestureDetector(
                              onTap: () => controller.onUnlockPrivateVideo(index: index, context: context, isShorts: false, isAllChannel: false),
                              child: SmallVideoWidget(
                                id: indexData.id ?? "",
                                image: indexData.videoImage ?? "",
                                videoTime: (indexData.videoTime ?? 0).toString(),
                                title: indexData.title ?? "",
                                views: indexData.views ?? 0,
                                uploadTime: indexData.time ?? "",
                              ),
                            )
                          : Column(
                              children: [
                                GestureDetector(
                                  onTap: () => Get.to(
                                    NormalVideoDetailsView(
                                      videoId: controller.particularChannelVideos[0]![index].id!,
                                      videoUrl: controller.particularChannelVideos[0]![index].videoUrl!,
                                      cost: controller.particularChannelVideos[0]![index].subscriptionCost!,
                                    ),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.start,
                                    children: [
                                      Stack(
                                        children: [
                                          Container(
                                            clipBehavior: Clip.hardEdge,
                                            height: SizeConfig.smallVideoImageHeight,
                                            width: SizeConfig.smallVideoImageWidth,
                                            decoration: BoxDecoration(color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_300, borderRadius: BorderRadius.circular(20)),
                                            child: PreviewVideoImage(
                                              videoId: controller.particularChannelVideos[0]![index].id!,
                                              videoImage: controller.particularChannelVideos[0]![index].videoImage!,
                                            ),
                                          ),
                                          Positioned(
                                            bottom: 10,
                                            right: 10,
                                            child: DurationBadge(text: CustomFormatTime.convertSecond(int.parse(controller.particularChannelVideos[0]![index].videoTime.toString())), fontSize: 11),
                                          ),
                                        ],
                                      ),
                                      SizedBox(width: AppLayout.width * 0.03),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              controller.particularChannelVideos[0]![index].title.toString(),
                                              maxLines: 3,
                                              style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold),
                                            ),
                                            const SizedBox(height: 10),
                                            Obx(
                                              () => Text(
                                                "${controller.particularChannelVideos[0]![index].views.toString()} • ${controller.particularChannelVideos[0]![index].time.toString()}",
                                                style: GoogleFonts.urbanist(fontSize: 12, color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black.withOpacity(0.7)),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      SizedBox(width: AppLayout.width * 0.01),
                                    ],
                                  ).paddingOnly(bottom: 10),
                                ),
                                withAd && index != 0 && index % AppSettings.showAdsIndex == 0 ? const GoogleSmallNativeAd() : const Offstage()
                              ],
                            );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<NavSubscriptionPageController>(
      id: "onChangeNormalVideo",
      builder: (controller) => controller.particularChannelVideos[0] == null
          ? const VideoListShimmerUi()
          : controller.particularChannelVideos[0]!.isEmpty
              ? DataNotFoundUi(type: EmptyStateType.videos, title: AppStrings.videosNotAvailable)
              : AppLayout.isWideWeb
                  ? SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                      child: VideoGrid(
                        itemCount: controller.particularChannelVideos[0]!.length,
                        minTileWidth: 520,
                        maxColumns: 3,
                        spacing: 16,
                        itemBuilder: (context, index) => _item(context, controller, index, withAd: false),
                      ),
                    )
                  : SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      child: ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: controller.particularChannelVideos[0]?.length ?? 0,
                        padding: const EdgeInsets.symmetric(horizontal: 15),
                        itemBuilder: (context, index) => _item(context, controller, index, withAd: true),
                      ),
                    ),
    );
  }
}

class SubscribeChannelShortsVideo extends StatelessWidget {
  const SubscribeChannelShortsVideo({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<NavSubscriptionPageController>(
      id: "onChangeShortsVideo",
      builder: (controller) => controller.particularChannelVideos[1] == null
          ? const ShortsListShimmerUi()
          : controller.particularChannelVideos[1]!.isEmpty
              ? DataNotFoundUi(type: EmptyStateType.videos, title: AppStrings.shortsNotAvailable)
              : SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: controller.particularChannelVideos[1]?.length ?? 0,
                    padding: const EdgeInsets.symmetric(horizontal: 15),
                    // Wide browser windows fit as many 200px-wide columns as they can.
                    gridDelegate: AppLayout.isWideWeb
                        ? const SliverGridDelegateWithMaxCrossAxisExtent(maxCrossAxisExtent: 200, mainAxisSpacing: 10, crossAxisSpacing: 10, mainAxisExtent: 280)
                        : const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 10, crossAxisSpacing: 10, mainAxisExtent: 280),
                    itemBuilder: (context, index) {
                      final indexData = controller.particularChannelVideos[1]![index];
                      return (indexData.videoPrivacyType == 2 && indexData.channelType == 1)
                          ? ShortsPrivateContentWidget(
                              id: indexData.id ?? "",
                              image: indexData.videoImage ?? "",
                              subscribe: () {},
                              unlock: () => controller.onUnlockPrivateVideo(index: index, context: context, isShorts: true, isAllChannel: false),
                              subscribeCoin: indexData.subscriptionCost ?? 0,
                              unlockCoin: indexData.videoUnlockCost ?? 0,
                              title: indexData.title ?? "",
                              views: indexData.views ?? 0,
                              channelType: indexData.channelType ?? 1,
                            )
                          : GestureDetector(
                              onTap: () => Get.to(
                                ShortsVideoDetailsView(
                                  videoId: controller.particularChannelVideos[1]![index].id!,
                                  videoUrl: controller.particularChannelVideos[1]![index].videoUrl!,
                                ),
                              ),
                              child: Container(
                                height: 280,
                                width: 165,
                                clipBehavior: Clip.antiAlias,
                                decoration: BoxDecoration(color: AppColor.grey_400, borderRadius: BorderRadius.circular(20)),
                                child: Stack(
                                  children: [
                                    PreviewVideoImage(videoId: controller.particularChannelVideos[1]![index].id!, videoImage: controller.particularChannelVideos[1]![index].videoImage!),
                                    Positioned(
                                      bottom: 0,
                                      left: 10,
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          SizedBox(
                                            width: 145,
                                            child: Text(
                                              controller.particularChannelVideos[1]![index].title.toString(),
                                              maxLines: 3,
                                              style: shortsStyle,
                                            ),
                                          ),
                                          const SizedBox(height: 10),
                                          Text(
                                            "${controller.particularChannelVideos[1]![index].views.toString()} Views",
                                            style: shortsStyle,
                                          ),
                                          const SizedBox(height: 10),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                    },
                  ),
                ),
    );
  }
}

// !CustomCheckInternet.isConnect.value
//     ? const NetworkIssueView()
//     : Center(
//         child: SingleChildScrollView(
//           controller: controller.mainScrollController,
//           physics: const NeverScrollableScrollPhysics(),
//           child: GetBuilder<NavSubscriptionPageController>(
//             id: "onGetSubscribedChannels",
//             builder: (controller) => controller.mainSubscribedChannels == null
//                 ? const LoaderUi()
//                 : (controller.mainSubscribedChannels?.isEmpty ?? true)
//                     ? const DataNotFoundUi(type: EmptyStateType.subscriptions, title: "No Subscribed Channel !!!")
//                     : Column(children: [
//                         SizedBox(
//                           height: 190,
//                           // height: (Get.height / 4 > 200) ? Get.height / 3.8 : Get.height / 3.2,
//                           child: Column(
//                             mainAxisAlignment: MainAxisAlignment.start,
//                             children: [
//                               SizedBox(
//                                 height: 45,
//                                 child: Row(
//                                   mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                                   children: [
//                                     Text(
//                                       "${AppStrings.subscriptionsChannel.tr} (${controller.mainSubscribedChannels!.length})",
//                                       style: GoogleFonts.urbanist(fontSize: 17, fontWeight: FontWeight.bold),
//                                     ),
//                                     TextButton(
//                                       onPressed: () => Get.to(() => SubscribedChannelView(loginUserId: Database.loginUserId!)),
//                                       child: Text(
//                                         AppStrings.viewAll.tr,
//                                         style: GoogleFonts.urbanist(color: AppColors.primaryColor, fontWeight: FontWeight.bold),
//                                       ),
//                                     ),
//                                   ],
//                                 ).paddingSymmetric(horizontal: 15),
//                               ),
//                               SizedBox(
//                                   height: 90,
//                                   child: ListView.builder(
//                                     itemCount: controller.mainSubscribedChannels?.length ?? 0,
//                                     padding: const EdgeInsets.only(left: 10),
//                                     scrollDirection: Axis.horizontal,
//                                     itemBuilder: (context, index) {
//                                       return GestureDetector(
//                                         onTap: () {
//                                           controller.onChangeParticularChannel(index);
//                                           if (GetLiveUsersApi.isLive(controller.mainSubscribedChannels![index].channelId!)) {
//                                             Get.to(
//                                               () => LivePage(
//                                                 isHost: false,
//                                                 localUserID: Database.loginUserId!,
//                                                 localUserName: Database.loginUserName!,
//                                                 roomID: GetLiveUsersApi.roomId(controller.mainSubscribedChannels![index].channelId!),
//                                               ),
//                                             )?.then((value) => AppSettings.navigationIndex(0));
//                                           }
//                                         },
//                                         child: Container(
//                                           margin: const EdgeInsets.only(right: 5),
//                                           width: 70,
//                                           child: Column(
//                                             crossAxisAlignment: CrossAxisAlignment.center,
//                                             children: [
//                                               SizedBox(
//                                                 height: 65,
//                                                 child: Stack(
//                                                   children: [
//                                                     GetBuilder<NavSubscriptionPageController>(
//                                                       id: "onChangeParticularChannel",
//                                                       builder: (controller) => Container(
//                                                         height: 60,
//                                                         width: 60,
//                                                         decoration: BoxDecoration(
//                                                           shape: BoxShape.circle,
//                                                           border: Border.all(
//                                                             color: controller.selectedChannel == index ? AppColors.primaryColor : Colors.transparent,
//                                                             width: 2,
//                                                           ),
//                                                         ),
//                                                         child: ClipOval(
//                                                           child: PreviewChannelImage(
//                                                             channelId: controller.mainSubscribedChannels![index].channelId!,
//                                                             channelImage: controller.mainSubscribedChannels![index].channelImage!,
//                                                           ),
//                                                         ),
//                                                       ),
//                                                     ),
//                                                     GetLiveUsersApi.isLive(controller.mainSubscribedChannels![index].channelId!)
//                                                         ? Positioned(
//                                                             bottom: 0,
//                                                             left: 15,
//                                                             child: Container(
//                                                               padding: const EdgeInsets.only(left: 5, right: 5, bottom: 2),
//                                                               decoration: BoxDecoration(
//                                                                 color: AppColors.primaryColor,
//                                                                 borderRadius: BorderRadius.circular(5),
//                                                                 border: Border.all(color: AppColors.white),
//                                                               ),
//                                                               child: Center(
//                                                                 child: Text(
//                                                                   "Live1",
//                                                                   style: GoogleFonts.urbanist(
//                                                                     color: AppColors.white,
//                                                                     fontSize: 10,
//                                                                     fontWeight: FontWeight.bold,
//                                                                   ),
//                                                                 ),
//                                                               ),
//                                                             ),
//                                                           )
//                                                         : const Offstage(),
//                                                   ],
//                                                 ),
//                                               ),
//                                               const SizedBox(height: 5),
//                                               Text(
//                                                 controller.mainSubscribedChannels![index].channelName.toString(),
//                                                 textAlign: TextAlign.center,
//                                                 overflow: TextOverflow.ellipsis,
//                                                 style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600),
//                                               ),
//                                             ],
//                                           ),
//                                         ),
//                                       );
//                                     },
//                                   )),
//                               const SizedBox(height: 10),
//                               GetBuilder<NavSubscriptionPageController>(
//                                 id: "onChangeParticularChannel",
//                                 builder: (controller) => controller.selectedChannel == null
//                                     ? SizedBox(
//                                         height: 45,
//                                         child: ListView.builder(
//                                           scrollDirection: Axis.horizontal,
//                                           padding: const EdgeInsets.only(left: 10, bottom: 10),
//                                           itemCount: subscribeType.length,
//                                           itemBuilder: (context, index) {
//                                             return GestureDetector(
//                                               onTap: () => controller.onChangeSubscribeType(index),
//                                               child: GetBuilder<NavSubscriptionPageController>(
//                                                 id: "onChangeSubscribeType",
//                                                 builder: (controller) => Container(
//                                                   padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 2),
//                                                   margin: const EdgeInsets.only(right: 10),
//                                                   decoration: BoxDecoration(
//                                                     color: controller.selectedSubscribeType != index ? Colors.transparent : AppColors.primaryColor,
//                                                     border: Border.all(color: AppColors.primaryColor),
//                                                     borderRadius: BorderRadius.circular(28),
//                                                   ),
//                                                   child: Center(
//                                                     child: Text(
//                                                       subscribeType[index],
//                                                       textAlign: TextAlign.center,
//                                                       style: GoogleFonts.urbanist(
//                                                         fontWeight: FontWeight.w600,
//                                                         fontSize: 16,
//                                                         color: controller.selectedSubscribeType == index ? AppColors.white : AppColors.primaryColor,
//                                                       ),
//                                                     ),
//                                                   ),
//                                                 ),
//                                               ),
//                                             );
//                                           },
//                                         ),
//                                       )
//                                     : SizedBox(
//                                         height: 45,
//                                         child: ListView.builder(
//                                           scrollDirection: Axis.horizontal,
//                                           padding: const EdgeInsets.only(left: 10, bottom: 10),
//                                           itemCount: videoTypes.length,
//                                           itemBuilder: (context, index) {
//                                             return GestureDetector(
//                                               onTap: () => controller.onChangeVideoType(index),
//                                               child: GetBuilder<NavSubscriptionPageController>(
//                                                 id: "onChangeVideoType",
//                                                 builder: (controller) => Container(
//                                                   padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 2),
//                                                   margin: const EdgeInsets.only(right: 10),
//                                                   decoration: BoxDecoration(
//                                                     color: controller.selectedVideoType != index ? Colors.transparent : AppColors.primaryColor,
//                                                     border: Border.all(color: AppColors.primaryColor),
//                                                     borderRadius: BorderRadius.circular(28),
//                                                   ),
//                                                   child: Center(
//                                                     child: Text(
//                                                       videoTypes[index],
//                                                       textAlign: TextAlign.center,
//                                                       style: GoogleFonts.urbanist(
//                                                         fontWeight: FontWeight.w600,
//                                                         fontSize: 16,
//                                                         color: controller.selectedVideoType == index ? AppColors.white : AppColors.primaryColor,
//                                                       ),
//                                                     ),
//                                                   ),
//                                                 ),
//                                               ),
//                                             );
//                                           },
//                                         ),
//                                       ),
//                               ),
//                             ],
//                           ),
//                         ),
//                         SizedBox(
//                           height: Get.height - 50,
//                           child: GetBuilder<NavSubscriptionPageController>(
//                             id: "onChangeParticularChannel",
//                             builder: (controller) => controller.selectedChannel == null
//                                 ? const TypeWiseSubscribedVideo()
//                                 : GetBuilder<NavSubscriptionPageController>(
//                                     id: "onChangeVideoType",
//                                     builder: (controller) => controller.selectedVideoType == 0 ? const SubscribeChannelNormalVideo() : const SubscribeChannelShortsVideo(),
//                                   ),
//                           ),
//                         )
//                       ]),
//           ),
//         ),
//       ),

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// 04-12-23 Working Code.....

// 04-12-23 Working Code.....

// : Column(
//     crossAxisAlignment: CrossAxisAlignment.start,
//     children: [
//       GestureDetector(
//         onTap: () {
//           Get.to(() => const VideoDetailsScreen());
//         },
//         child: Stack(
//           children: [
//             Padding(
//               padding:
//                   EdgeInsets.only(left: SizeConfig.blockSizeHorizontal * 2),
//               child: Image(
//                 image: AssetImage(homeTabVideoData2[i].image),
//                 fit: BoxFit.fill,
//                 height: SizeConfig.screenHeight / 3.5,
//                 width: SizeConfig.screenWidth / 1.1,
//               ),
//             ),
//             Positioned(
//               left: SizeConfig.screenWidth / 1.35,
//               top: SizeConfig.screenHeight / 4.5,
//               child: Container(
//                 alignment: Alignment.center,
//                 padding: const EdgeInsets.only(
//                     left: 13, right: 13, top: 8, bottom: 8),
//                 decoration: BoxDecoration(
//                   borderRadius: BorderRadius.circular(10),
//                   color: AppColors.black,
//                 ),
//                 child: Text(
//                   homeTabVideoData2[i].videoTime,
//                   style: GoogleFonts.urbanist(
//                       color: AppColors.white, fontSize: 11),
//                 ),
//               ),
//             ),
//           ],
//         ),
//       ),
//       SizedBox(height: SizeConfig.blockSizeVertical * 2),
//       Row(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         mainAxisAlignment: MainAxisAlignment.spaceAround,
//         children: [
//           Image(
//             image: AssetImage(homeTabVideoData2[i].channelLogo),
//             height: 30,
//             width: 30,
//             fit: BoxFit.contain,
//           ),
//           SizedBox(
//             width: SizeConfig.screenWidth / 1.4,
//             child: Text(
//               homeTabVideoData2[i].videoTitle,
//               style: GoogleFonts.urbanist(
//                 fontSize: 18,
//                 fontWeight: FontWeight.bold,
//               ),
//               maxLines: 2,
//               overflow: TextOverflow.ellipsis,
//             ),
//           ),
//           GestureDetector(
//             onTap: () {
//               AppSheet.show(
//                 backgroundColor: isDarkMode.value
//                     ? AppColors.secondDarkMode
//                     : AppColors.white,
//                 SizedBox(
//                   height: SizeConfig.screenHeight / 2,
//                   child: Column(
//                     mainAxisAlignment: MainAxisAlignment.spaceEvenly,
//                     children: [
//                       Container(
//                         width: SizeConfig.blockSizeHorizontal * 12,
//                         height: 3,
//                         decoration: BoxDecoration(
//                           borderRadius: BorderRadius.circular(60),
//                           color: AppColors.grey_100,
//                         ),
//                       ),
//                       Text(
//                         AppStrings.moreOption.tr,
//                         style: titalstyle1,
//                       ),
//                       const Divider(
//                         indent: 25,
//                         endIndent: 25,
//                         color: AppColors.grey,
//                       ),
//                       BottomShitButton(
//                         widget: const ImageIcon(
//                           AssetImage(AppIcons.timeCircle),
//                           size: 23,
//                         ),
//                         name: AppStrings.saveToWatchLater,
//                         onTap: () {},
//                       ),
//                       BottomShitButton(
//                         widget: const ImageIcon(
//                           AssetImage(AppIcons.libraryLogo),
//                           size: 23,
//                         ),
//                         name: AppStrings.saveToPlaylist,
//                         onTap: () {},
//                       ),
//                       BottomShitButton(
//                         widget: const ImageIcon(
//                           AssetImage(AppIcons.download),
//                           size: 23,
//                         ),
//                         name: AppStrings.download.trVideo,
//                         onTap: () {},
//                       ),
//                       BottomShitButton(
//                         widget: const ImageIcon(
//                           AssetImage(AppIcons.send),
//                           size: 23,
//                         ),
//                         name: AppStrings.share,
//                         onTap: () {},
//                       ),
//                       BottomShitButton(
//                         widget: const ImageIcon(
//                           AssetImage(AppIcons.moreThreeCircle),
//                           size: 23,
//                         ),
//                         name: AppStrings.notInterested,
//                         onTap: () {},
//                       ),
//                       BottomShitButton(
//                         widget: const ImageIcon(
//                           AssetImage(AppIcons.dangerSquare),
//                           size: 23,
//                         ),
//                         name: AppStrings.dontRecommendChannel,
//                         onTap: () {},
//                       ),
//                       BottomShitButton(
//                         widget: const ImageIcon(
//                           AssetImage(AppIcons.closeSquare),
//                           size: 23,
//                         ),
//                         name: AppStrings.report.tr,
//                         onTap: () {
//                           Get.back();
//                           AppSheet.show(
//                             isScrollControlled: true,
//                             StatefulBuilder(
//                               builder: (BuildContext context,
//                                   void Function(void Function()) setState1) {
//                                 return SizedBox(
//                                   height: SizeConfig.screenHeight / 1.2,
//                                   child: Column(
//                                     mainAxisAlignment:
//                                         MainAxisAlignment.spaceEvenly,
//                                     children: [
//                                       Container(
//                                         width:
//                                             SizeConfig.blockSizeHorizontal *
//                                                 12,
//                                         height: 3,
//                                         decoration: BoxDecoration(
//                                           borderRadius:
//                                               BorderRadius.circular(60),
//                                           color: AppColors.grey_100,
//                                         ),
//                                       ),
//                                       Text(
//                                         AppStrings.report.tr,
//                                         style: titalstyle1,
//                                       ),
//                                       const Divider(
//                                         indent: 25,
//                                         endIndent: 25,
//                                         color: AppColors.grey,
//                                       ),
//                                       BottomShitButton(
//                                         widget: Radio(
//                                           fillColor:
//                                               MaterialStateColor.resolveWith(
//                                             (states) => AppColors.primaryColor,
//                                           ),
//                                           activeColor: AppColors.primaryColor,
//                                           value: "1",
//                                           groupValue: payments,
//                                           onChanged: (value) {
//                                             setState1(() {
//                                               payments = value.toString();
//                                             });
//                                           },
//                                         ),
//                                         name: AppStrings.sexualContent,
//                                         onTap: () {},
//                                       ),
//                                       BottomShitButton(
//                                         widget: Radio(
//                                           fillColor:
//                                               MaterialStateColor.resolveWith(
//                                             (states) => AppColors.primaryColor,
//                                           ),
//                                           activeColor: AppColors.primaryColor,
//                                           value: "2",
//                                           groupValue: payments,
//                                           onChanged: (value) {
//                                             setState1(() {
//                                               payments = value.toString();
//                                             });
//                                           },
//                                         ),
//                                         name: AppStrings
//                                             .violentOrRepulsiveContent,
//                                         onTap: () {},
//                                       ),
//                                       BottomShitButton(
//                                         widget: Radio(
//                                           fillColor:
//                                               MaterialStateColor.resolveWith(
//                                             (states) => AppColors.primaryColor,
//                                           ),
//                                           activeColor: AppColors.primaryColor,
//                                           value: "3",
//                                           groupValue: payments,
//                                           onChanged: (value) {
//                                             setState1(() {
//                                               payments = value.toString();
//                                             });
//                                           },
//                                         ),
//                                         name: AppStrings
//                                             .hatefulOrAbusiveContent,
//                                         onTap: () {},
//                                       ),
//                                       BottomShitButton(
//                                         widget: Radio(
//                                           fillColor:
//                                               MaterialStateColor.resolveWith(
//                                             (states) => AppColors.primaryColor,
//                                           ),
//                                           activeColor: AppColors.primaryColor,
//                                           value: "4",
//                                           groupValue: payments,
//                                           onChanged: (value) {
//                                             setState1(() {
//                                               payments = value.toString();
//                                             });
//                                           },
//                                         ),
//                                         name:
//                                             AppStrings.harmfulOrDangerousActs,
//                                         onTap: () {},
//                                       ),
//                                       BottomShitButton(
//                                         widget: Radio(
//                                           fillColor:
//                                               MaterialStateColor.resolveWith(
//                                             (states) => AppColors.primaryColor,
//                                           ),
//                                           activeColor: AppColors.primaryColor,
//                                           value: "5",
//                                           groupValue: payments,
//                                           onChanged: (value) {
//                                             setState1(() {
//                                               payments = value.toString();
//                                             });
//                                           },
//                                         ),
//                                         name: AppStrings.spamOrMisleading,
//                                         onTap: () {},
//                                       ),
//                                       BottomShitButton(
//                                         widget: Radio(
//                                           fillColor:
//                                               MaterialStateColor.resolveWith(
//                                             (states) => AppColors.primaryColor,
//                                           ),
//                                           activeColor: AppColors.primaryColor,
//                                           value: "6",
//                                           groupValue: payments,
//                                           onChanged: (value) {
//                                             setState1(() {
//                                               payments = value.toString();
//                                             });
//                                           },
//                                         ),
//                                         name: AppStrings.childAbuse,
//                                         onTap: () {},
//                                       ),
//                                       BottomShitButton(
//                                         widget: Radio(
//                                           fillColor:
//                                               MaterialStateColor.resolveWith(
//                                             (states) => AppColors.primaryColor,
//                                           ),
//                                           activeColor: AppColors.primaryColor,
//                                           value: "7",
//                                           groupValue: payments,
//                                           onChanged: (value) {
//                                             setState1(() {
//                                               payments = value.toString();
//                                             });
//                                           },
//                                         ),
//                                         name: AppStrings.others,
//                                         onTap: () {},
//                                       ),
//                                       const Divider(
//                                         indent: 25,
//                                         endIndent: 25,
//                                         color: AppColors.grey,
//                                       ),
//                                       TwoButton(
//                                         button1: AppStrings.cancel,
//                                         button2: AppStrings.report.tr,
//                                         button1OnTap: () {},
//                                         button2OnTap: () {},
//                                       ),
//                                     ],
//                                   ),
//                                 );
//                               },
//                             ),
//                             backgroundColor:
//                                 isDarkMode.value
//                                     ? AppColors.secondDarkMode
//                                     : AppColors.white,
//                             shape: const RoundedRectangleBorder(
//                               borderRadius: BorderRadius.only(
//                                 topRight: Radius.circular(30),
//                                 topLeft: Radius.circular(30),
//                               ),
//                             ),
//                           );
//                         },
//                       ),
//                     ],
//                   ),
//                 ),
//                 shape: const RoundedRectangleBorder(
//                   borderRadius: BorderRadius.only(
//                     topRight: Radius.circular(30),
//                     topLeft: Radius.circular(30),
//                   ),
//                 ),
//               );
//             },
//             child: const Icon(
//               Icons.more_vert,
//             ),
//           ),
//         ],
//       ),
//       SizedBox(
//         height: SizeConfig.blockSizeVertical * 0.5,
//       ),
//       Padding(
//         padding: EdgeInsets.only(
//           left: SizeConfig.blockSizeHorizontal * 11,
//         ),
//         child: Text(
//           "${homeTabVideoData2[i].channelName} • ${homeTabVideoData2[i].videoView} • ${homeTabVideoData2[i].uploadTime}",
//           style:
//               GoogleFonts.urbanist(fontSize: 12, color: AppColors.grey),
//         ),
//       ),
//       SizedBox(
//         height: SizeConfig.blockSizeVertical * 3,
//       ),
//     ],
//   ),

// Wrap(
//   children: [
//     FilterChip(
//       label: Text(subscriptionsVideoType[i].label),
//       onSelected: (bool value) {
//         setState(() {
//           subscriptionsVideoType[i].isSelected = value;
//         });
//       },
//       showCheckmark: false,
//       side: const BorderSide(
//         color: AppColors.primaryColor,
//       ),
//       selected: subscriptionsVideoType[i].isSelected,
//       selectedColor: AppColors.primaryColor,
//       backgroundColor: isDarkMode.value
//           ? AppColors.secondDarkMode
//           : AppColors.white,
//       labelStyle: GoogleFonts.urbanist(
//         fontSize: 13,
//         color: (subscriptionsVideoType[i].isSelected == true)
//             ? AppColors.white
//             : AppColors.primaryColor,
//         fontWeight: FontWeight.w800,
//       ),
//     ),
//     SizedBox(
//       width: SizeConfig.blockSizeHorizontal * 3,
//     ),
//   ],
// );

/// 33333333333333333333333333333333
///
///     // : GestureDetector(
//                         //     onTap: () => Get.to(
//                         //       NormalVideoDetailsView(
//                         //         videoId: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].videoId!,
//                         //         videoUrl: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].videoUrl!,
//                         //       ),
//                         //     ),
//                         //     // : Get.to(
//                         //     //     ShortsVideoDetailsView(
//                         //     //       videoId: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].videoId!,
//                         //     //       videoUrl: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].videoUrl!,
//                         //     //     ),
//                         //     //   ),
//                         //     child: Column(
//                         //       crossAxisAlignment: CrossAxisAlignment.start,
//                         //       children: [
//                         //         GestureDetector(
//                         //           child: Container(
//                         //             clipBehavior: Clip.antiAlias,
//                         //             height: SizeConfig.largeVideoImageHeight,
//                         //             width: AppLayout.width,
//                         //             margin: const EdgeInsets.symmetric(horizontal: 10),
//                         //             decoration: BoxDecoration(
//                         //               color: isDarkMode.value ? AppColors.secondDarkMode : AppColors.grey_400,
//                         //               borderRadius: BorderRadius.circular(20),
//                         //             ),
//                         //             child: Stack(
//                         //               children: [
//                         //                 PreviewVideoImage(
//                         //                     videoId: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].videoId!,
//                         //                     videoImage: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].videoImage!),
//                         //                 // ConvertedPathView(
//                         //                 //     imageVideoPath: controller
//                         //                 //         .mainAllChannelVideos[controller
//                         //                 //                 .selectedSubscribeType]![
//                         //                 //             index]
//                         //                 //         .videoImage
//                         //                 //         .toString()),
//                         //                 Positioned(
//                         //                   right: 20,
//                         //                   bottom: 15,
//                         //                   child: Container(
//                         //                     padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
//                         //                     decoration: BoxDecoration(borderRadius: BorderRadius.circular(10), color: AppColors.black),
//                         //                     child: Text(
//                         //                       CustomFormatTime.convert(controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].videoTime!),
//                         //                       style: GoogleFonts.urbanist(color: AppColors.white, fontSize: 11),
//                         //                     ),
//                         //                   ),
//                         //                 ),
//                         //               ],
//                         //             ),
//                         //           ),
//                         //         ),
//                         //         const SizedBox(height: 10),
//                         //         GestureDetector(
//                         //           onTap: () =>
//                         //               Get.to(YourChannelView(loginUserId: Database.loginUserId!, channelId: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].channelId!)),
//                         //           child: Row(
//                         //             crossAxisAlignment: CrossAxisAlignment.start,
//                         //             children: [
//                         //               const SizedBox(width: 10),
//                         //               Container(
//                         //                 height: 32,
//                         //                 width: 32,
//                         //                 clipBehavior: Clip.antiAlias,
//                         //                 decoration: const BoxDecoration(shape: BoxShape.circle),
//                         //                 child: PreviewChannelImage(
//                         //                     channelId: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].channelId!,
//                         //                     channelImage: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].channelImage!),
//                         //                 // ConvertedChannelImageView(
//                         //                 //     imagePath: controller
//                         //                 //         .mainAllChannelVideos[controller
//                         //                 //                 .selectedSubscribeType]![
//                         //                 //             index]
//                         //                 //         .c!),
//                         //               ),
//                         //               const SizedBox(width: 10),
//                         //               Expanded(
//                         //                 child: Column(
//                         //                   crossAxisAlignment: CrossAxisAlignment.start,
//                         //                   children: [
//                         //                     Text(
//                         //                       controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].videoTitle.toString(),
//                         //                       style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
//                         //                       maxLines: 2,
//                         //                       overflow: TextOverflow.ellipsis,
//                         //                     ),
//                         //                     Text(
//                         //                       "${controller.mainAllChannelVideos[controller.selectedSubscribeType]?[index].channelName} - ${controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].views} Views - ${controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].videoTime}",
//                         //                       style: GoogleFonts.urbanist(fontSize: 12, color: AppColors.grey),
//                         //                     ),
//                         //                   ],
//                         //                 ),
//                         //               ),
//                         //               const SizedBox(width: 5),
//                         //               GestureDetector(
//                         //                   onTap: () => MoreInfoBottomSheet.show(
//                         //                         MoreInformationModel(
//                         //                           videoId: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].id!,
//                         //                           title: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].videoTitle!,
//                         //                           videoType: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].videoType!,
//                         //                           videoTime: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].videoTime!,
//                         //                           videoUrl: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].videoUrl!,
//                         //                           channelId: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].channelId!,
//                         //                           channelName: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].channelName!,
//                         //                           views: controller.mainAllChannelVideos[controller.selectedSubscribeType]![index].views!,
//                         //                         ),
//                         //                         false,
//                         //                       ),
//                         //                   child: const Icon(Icons.more_vert)),
//                         //               const SizedBox(width: 10),
//                         //             ],
//                         //           ),
//                         //         ),
//                         //         const SizedBox(height: 10),
//                         //       ],
//                         //     ),
//                         //   );
