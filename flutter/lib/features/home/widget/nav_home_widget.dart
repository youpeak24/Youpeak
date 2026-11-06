import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/ads/google_large_native_ad.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/shared/widgets/video_card_parts.dart';
import 'package:youpeak/core/utils/custom_format_number.dart';
import 'package:youpeak/features/bites/model/get_shorts_video_model.dart';
import 'package:youpeak/features/bites/view/preview_shorts_view.dart';
import 'package:youpeak/features/channel/view/your_channel_view.dart';
import 'package:youpeak/features/home/controller/nav_home_controller.dart';
import 'package:youpeak/features/home/model/fetch_all_video_model.dart';
import 'package:youpeak/features/home/model/fetch_new_video_model.dart';
import 'package:youpeak/features/home/model/fetch_popular_video_model.dart';
import 'package:youpeak/features/home/model/fetch_public_live_model.dart';
import 'package:youpeak/features/live/view/live_view.dart';
import 'package:youpeak/features/video/view/normal_video_details_view.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/shared/shimmer/normal_video_shimmer_ui.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/shared/widgets/normal_video_ui.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/shared/widgets/short_video_ui.dart';
import 'package:youpeak/shared/widgets/youpeak_play_icon.dart';

// The All / Popular / New tabs show the same feed built from three API
// models; each is mapped to HomeFeedVideo / HomeFeedShort first. Phones get
// a single-column list, wide browser windows a grid.

class AllTabWidget extends StatelessWidget {
  const AllTabWidget({super.key});

  @override
  Widget build(BuildContext context) => _HomeFeedTab(
        builderId: "onGetAllTabVideo",
        tabType: 0,
        isLoading: (controller) => controller.isLoadingAllTab,
        scrollController: (controller) => controller.allTabScrollController,
        videos: (controller) => [
          for (var i = 0; i < controller.allVideos.length; i++) HomeFeedVideo.fromAll(i, controller.allVideos[i]),
        ],
        shorts: (controller) => [
          for (var i = 0; i < controller.allShorts.length; i++) HomeFeedShort.fromAll(i, controller.allShorts[i]),
        ],
      );
}

class PopularTabWidget extends StatelessWidget {
  const PopularTabWidget({super.key});

  @override
  Widget build(BuildContext context) => _HomeFeedTab(
        builderId: "onGetPopularTabVideo",
        tabType: 1,
        isLoading: (controller) => controller.isLoadingPopularTab,
        scrollController: (controller) => controller.popularTabScrollController,
        videos: (controller) => [
          for (var i = 0; i < controller.popularVideos.length; i++) HomeFeedVideo.fromPopular(i, controller.popularVideos[i]),
        ],
        shorts: (controller) => [
          for (var i = 0; i < controller.popularShorts.length; i++) HomeFeedShort.fromPopular(i, controller.popularShorts[i]),
        ],
      );
}

class NewTabWidget extends StatelessWidget {
  const NewTabWidget({super.key});

  @override
  Widget build(BuildContext context) => _HomeFeedTab(
        builderId: "onGetNewTabVideo",
        tabType: 2,
        isLoading: (controller) => controller.isLoadingNewTab,
        scrollController: (controller) => controller.newTabScrollController,
        videos: (controller) => [
          for (var i = 0; i < controller.newVideos.length; i++) HomeFeedVideo.fromNew(i, controller.newVideos[i]),
        ],
        shorts: (controller) => [
          for (var i = 0; i < controller.newShorts.length; i++) HomeFeedShort.fromNew(i, controller.newShorts[i]),
        ],
      );
}

// Paid content the viewer hasn't unlocked: a private video on a free
// channel, or on a premium channel they don't subscribe to.
bool _isLockedContent({required String? channelId, required num? videoPrivacyType, required num? channelType, required bool? isSubscribed}) =>
    Database.channelId != channelId && videoPrivacyType == 2 && (channelType == 1 || (channelType == 2 && isSubscribed == false));

class HomeFeedVideo {
  HomeFeedVideo({
    required this.index,
    required this.id,
    required this.title,
    required this.videoImage,
    required this.videoUrl,
    required this.videoTime,
    required this.channelId,
    required this.channelImage,
    required this.channelName,
    required this.views,
    required this.time,
    required this.isSave,
    required this.isNormalVideo,
    required this.isLocked,
    required this.videoUnlockCost,
    required this.subscriptionCost,
    required this.channelType,
  });

  // Position in the tab's list; the unlock/subscribe actions address it.
  final int index;
  final String id;
  final String title;
  final String videoImage;
  final String videoUrl;
  final num videoTime;
  final String channelId;
  final String channelImage;
  final String channelName;
  final num views;
  final String time;
  final bool isSave;
  final bool isNormalVideo;
  final bool isLocked;
  final num videoUnlockCost;
  final num? subscriptionCost;
  final num channelType;

  factory HomeFeedVideo.fromAll(int index, AllVideo v) => HomeFeedVideo(
        index: index,
        id: v.id ?? "",
        title: v.title ?? "",
        videoImage: v.videoImage ?? "",
        videoUrl: v.videoUrl ?? "",
        videoTime: v.videoTime ?? 0,
        channelId: v.channelId ?? "",
        channelImage: v.channelImage ?? "",
        channelName: v.channelName ?? "",
        views: v.views ?? 0,
        time: v.time ?? "",
        isSave: v.isSaveToWatchLater ?? false,
        isNormalVideo: v.videoType == 1,
        isLocked: _isLockedContent(channelId: v.channelId, videoPrivacyType: v.videoPrivacyType, channelType: v.channelType, isSubscribed: v.isSubscribed),
        videoUnlockCost: v.videoUnlockCost ?? 0,
        subscriptionCost: v.subscriptionCost,
        channelType: v.channelType ?? 1,
      );

  factory HomeFeedVideo.fromPopular(int index, PopularVideos v) => HomeFeedVideo(
        index: index,
        id: v.id ?? "",
        title: v.title ?? "",
        videoImage: v.videoImage ?? "",
        videoUrl: v.videoUrl ?? "",
        videoTime: v.videoTime ?? 0,
        channelId: v.channelId ?? "",
        channelImage: v.channelImage ?? "",
        channelName: v.channelName ?? "",
        views: v.views ?? 0,
        time: v.time ?? "",
        isSave: v.isSaveToWatchLater ?? false,
        isNormalVideo: v.videoType == 1,
        isLocked: _isLockedContent(channelId: v.channelId, videoPrivacyType: v.videoPrivacyType, channelType: v.channelType, isSubscribed: v.isSubscribed),
        videoUnlockCost: v.videoUnlockCost ?? 0,
        subscriptionCost: v.subscriptionCost,
        channelType: v.channelType ?? 1,
      );

  factory HomeFeedVideo.fromNew(int index, Video v) => HomeFeedVideo(
        index: index,
        id: v.id,
        title: v.title,
        videoImage: v.videoImage,
        videoUrl: v.videoUrl,
        videoTime: v.videoTime,
        channelId: v.channelId,
        channelImage: v.channelImage ?? "",
        channelName: v.channelName,
        views: v.views,
        time: v.time,
        isSave: v.isSaveToWatchLater,
        isNormalVideo: v.videoType == 1,
        isLocked: _isLockedContent(channelId: v.channelId, videoPrivacyType: v.videoPrivacyType, channelType: v.channelType, isSubscribed: v.isSubscribed),
        videoUnlockCost: v.videoUnlockCost,
        subscriptionCost: v.subscriptionCost,
        channelType: v.channelType,
      );
}

class HomeFeedShort {
  HomeFeedShort({
    required this.index,
    required this.isLocked,
    required this.subscriptionCost,
    required this.videoUnlockCost,
    required this.channelType,
    required this.data,
  });

  final int index;
  final bool isLocked;
  final num subscriptionCost;
  final num videoUnlockCost;
  final num channelType;

  // The short as the Bites player takes it.
  final Shorts data;

  factory HomeFeedShort.fromAll(int index, AllShorts s) => HomeFeedShort(
        index: index,
        isLocked: _isLockedContent(channelId: s.channelId, videoPrivacyType: s.videoPrivacyType, channelType: s.channelType, isSubscribed: s.isSubscribed),
        subscriptionCost: s.subscriptionCost ?? 0,
        videoUnlockCost: s.videoUnlockCost ?? 0,
        channelType: s.channelType ?? 1,
        data: Shorts(
          id: s.id,
          userId: s.userId,
          channelId: s.channelId,
          title: s.title,
          videoImage: s.videoImage,
          hashTag: s.hashTag,
          videoUrl: s.videoUrl,
          channelImage: s.channelImage,
          createdAt: s.createdAt,
          channelName: s.channelName,
          description: s.description,
          dislike: s.dislike,
          isDislike: s.isDislike,
          isLike: s.isLike,
          isSubscribed: s.isSubscribed,
          like: s.like,
          shareCount: s.shareCount,
          totalComments: s.totalComments,
          videoTime: s.videoTime,
          videoType: s.videoType,
          views: s.views,
          isSaveToWatchLater: s.isSaveToWatchLater ?? false,
        ),
      );

  factory HomeFeedShort.fromPopular(int index, PopularShorts s) => HomeFeedShort(
        index: index,
        isLocked: _isLockedContent(channelId: s.channelId, videoPrivacyType: s.videoPrivacyType, channelType: s.channelType, isSubscribed: s.isSubscribed),
        subscriptionCost: s.subscriptionCost ?? 0,
        videoUnlockCost: s.videoUnlockCost ?? 0,
        channelType: s.channelType ?? 1,
        data: Shorts(
          id: s.id,
          userId: s.userId,
          channelId: s.channelId,
          title: s.title,
          videoImage: s.videoImage,
          hashTag: s.hashTag,
          videoUrl: s.videoUrl,
          channelImage: s.channelImage,
          createdAt: s.createdAt,
          channelName: s.channelName,
          description: s.description,
          dislike: s.dislike,
          isDislike: s.isDislike,
          isLike: s.isLike,
          isSubscribed: s.isSubscribed,
          like: s.like,
          shareCount: s.shareCount,
          totalComments: s.totalComments,
          videoTime: s.videoTime,
          videoType: s.videoType,
          views: s.views,
          isSaveToWatchLater: s.isSaveToWatchLater ?? false,
        ),
      );

  factory HomeFeedShort.fromNew(int index, Short s) => HomeFeedShort(
        index: index,
        isLocked: _isLockedContent(channelId: s.channelId, videoPrivacyType: s.videoPrivacyType, channelType: s.channelType, isSubscribed: s.isSubscribed),
        subscriptionCost: s.subscriptionCost,
        videoUnlockCost: s.videoUnlockCost,
        channelType: s.channelType,
        data: Shorts(
          id: s.id,
          userId: s.userId,
          channelId: s.channelId,
          title: s.title,
          videoImage: s.videoImage,
          hashTag: s.hashTag,
          videoUrl: s.videoUrl,
          channelImage: s.channelImage,
          createdAt: s.createdAt.toString(),
          channelName: s.channelName,
          description: s.description,
          dislike: s.dislike,
          isDislike: s.isDislike,
          isLike: s.isLike,
          isSubscribed: s.isSubscribed,
          like: s.like,
          shareCount: s.shareCount,
          totalComments: s.totalComments.length,
          videoTime: s.videoTime,
          videoType: s.videoType,
          views: s.views,
          isSaveToWatchLater: s.isSaveToWatchLater,
        ),
      );
}

class _HomeFeedTab extends StatelessWidget {
  const _HomeFeedTab({
    required this.builderId,
    required this.tabType,
    required this.isLoading,
    required this.scrollController,
    required this.videos,
    required this.shorts,
  });

  final String builderId;
  final int tabType;
  final bool Function(NavHomeController controller) isLoading;
  final ScrollController Function(NavHomeController controller) scrollController;
  final List<HomeFeedVideo> Function(NavHomeController controller) videos;
  final List<HomeFeedShort> Function(NavHomeController controller) shorts;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GetBuilder<NavHomeController>(
        id: builderId,
        builder: (controller) {
          final wide = AppLayout.isWideWeb;
          final videoList = videos(controller);
          final shortList = shorts(controller);

          final Widget body;
          if (isLoading(controller)) {
            body = SingleChildScrollView(child: wide ? const WideVideoGridShimmer() : const NormalVideoShimmerUi());
          } else if (videoList.isEmpty) {
            body = const DataNotFoundUi(type: EmptyStateType.videos, title: "Video Not Found !!");
          } else if (wide) {
            final gridVideos = videoList.where((video) => video.isNormalVideo).toList();
            body = SingleChildScrollView(
              controller: scrollController(controller),
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              child: VideoGrid(
                itemCount: gridVideos.length,
                itemBuilder: (context, index) => _videoCard(context, controller, gridVideos[index]),
                firstRowTrailer: shortList.isEmpty
                    ? null
                    : Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _ShortsShelf(controller: controller, tabType: tabType, shorts: shortList),
                      ),
              ),
            );
          } else {
            body = SingleChildScrollView(
              controller: scrollController(controller),
              child: ListView.separated(
                itemCount: videoList.length,
                physics: const BouncingScrollPhysics(),
                shrinkWrap: true,
                scrollDirection: Axis.vertical,
                padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 5),
                itemBuilder: (context, index) {
                  final video = videoList[index];
                  if (!video.isNormalVideo) return const Offstage();
                  return Column(
                    children: [
                      _videoCard(context, controller, video),
                      index != 0 && index % AppSettings.showAdsIndex == 0 ? const GoogleLargeNativeAd() : const Offstage(),
                    ],
                  );
                },
                separatorBuilder: (context, index) => shortList.isNotEmpty && index == 1
                    ? _ShortsShelf(controller: controller, tabType: tabType, shorts: shortList)
                    : const Offstage(),
              ),
            );
          }

          return RefreshIndicator(
            color: AppColor.primaryColor,
            onRefresh: () async => await controller.refreshInit(),
            child: body,
          );
        },
      ),
    );
  }

  Widget _videoCard(BuildContext context, NavHomeController controller, HomeFeedVideo video) {
    if (video.isLocked) {
      return PrivateContentNormalVideoUi(
        videoId: video.id,
        title: video.title,
        videoImage: video.videoImage,
        videoUrl: video.videoUrl,
        videoTime: video.videoTime,
        channelId: video.channelId,
        channelImage: video.channelImage,
        channelName: video.channelName,
        views: video.views,
        uploadTime: video.time,
        isSave: video.isSave,
        subscribeCallback: () => controller.onSubscribePrivateChannel(tabType: tabType, index: video.index, context: context, isShorts: false),
        videoCallback: () => controller.onUnlockPrivateVideo(tabType: tabType, index: video.index, context: context, isShorts: false),
        videoCost: video.videoUnlockCost,
        subscribeCost: video.subscriptionCost ?? 0,
        channelType: video.channelType,
      );
    }

    return AppPressable(
      onTap: () => Get.to(NormalVideoDetailsView(videoId: video.id, videoUrl: video.videoUrl, cost: video.subscriptionCost)),
      pressedScale: 0.985,
      behavior: HitTestBehavior.deferToChild,
      child: NormalVideoUi(
          videoId: video.id,
          title: video.title,
          videoImage: video.videoImage,
          videoUrl: video.videoUrl,
          videoTime: video.videoTime,
          channelId: video.channelId,
          channelImage: video.channelImage,
          channelName: video.channelName,
          views: video.views,
          uploadTime: video.time,
          isSave: video.isSave,
      ),
    );
  }
}

// "Bites" row inside the feed.
class _ShortsShelf extends StatelessWidget {
  const _ShortsShelf({required this.controller, required this.tabType, required this.shorts});

  final NavHomeController controller;
  final int tabType;
  final List<HomeFeedShort> shorts;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 325,
      child: Column(
        children: [
          Row(
            children: [
              const SizedBox(width: 12),
              const YoupeakPlayIcon(size: 28),
              const SizedBox(width: 10),
              Text(AppStrings.shorts.tr, style: GoogleFonts.urbanist(fontSize: 19, fontWeight: FontWeight.w800, letterSpacing: -0.2)),
              const Spacer(),
              AppPressable(
                onTap: () => AppSettings.navigationIndex.value = 1,
                pressedScale: 0.94,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        AppStrings.viewAll.tr,
                        style: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w800, color: AppColor.primaryColor),
                      ),
                      const SizedBox(width: 4),
                      Image.asset(AppIcons.arrowRight, width: 14, color: AppColor.primaryColor),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 4),
            ],
          ).paddingOnly(bottom: 8),
          SizedBox(
            height: 280,
            child: ListView.builder(
              itemCount: shorts.length,
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.only(left: 12, right: 4, bottom: 10),
              itemBuilder: (context, index) {
                final short = shorts[index];
                final data = short.data;

                if (short.isLocked) {
                  return ShortsPrivateContentWidget(
                    id: data.id ?? "",
                    image: data.videoImage ?? "",
                    subscribe: () => controller.onSubscribePrivateChannel(tabType: tabType, index: short.index, context: context, isShorts: true),
                    unlock: () => controller.onUnlockPrivateVideo(tabType: tabType, index: short.index, context: context, isShorts: true),
                    subscribeCoin: short.subscriptionCost,
                    unlockCoin: short.videoUnlockCost,
                    title: data.title ?? "",
                    views: data.views ?? 0,
                    channelType: short.channelType,
                  );
                }

                return AppPressable(
                    onTap: () => Get.to(PreviewShortsView(firstVideoData: data)),
                    pressedScale: 0.97,
                    behavior: HitTestBehavior.deferToChild,
                    child: ShortVideoUi(
                      videoId: data.id ?? "",
                      title: data.title ?? "",
                      videoImage: data.videoImage ?? "",
                      videoUrl: data.videoUrl ?? "",
                      channelId: data.channelId ?? "",
                      views: data.views ?? 0,
                      videoTime: data.videoTime ?? 0,
                      channelName: data.channelName ?? "",
                      isSave: data.isSaveToWatchLater ?? false,
                    ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// Loading placeholder for the wide video grids.
class WideVideoGridShimmer extends StatelessWidget {
  const WideVideoGridShimmer({super.key, this.itemCount = 10});

  final int itemCount;

  @override
  Widget build(BuildContext context) {
    final base = isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_200;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      child: VideoGrid(
        itemCount: itemCount,
        itemBuilder: (context, index) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: VideoGridScope.thumbnailHeight(context, phoneHeight: 200),
              margin: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(color: base, borderRadius: BorderRadius.circular(20)),
            ),
            const SizedBox(height: 10),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(width: 10),
                CircleAvatar(radius: 18, backgroundColor: base),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(height: 14, decoration: BoxDecoration(color: base, borderRadius: BorderRadius.circular(7))),
                      const SizedBox(height: 8),
                      FractionallySizedBox(
                        widthFactor: 0.6,
                        child: Container(height: 12, decoration: BoxDecoration(color: base, borderRadius: BorderRadius.circular(6))),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class LiveTabWidget extends StatelessWidget {
  const LiveTabWidget({super.key});

  void _openLive(NavHomeController controller, LiveData? live) {
    Get.to(
      () => LivePage(
        isHost: false,
        localUserID: Database.loginUserId!,
        localUserName: AppSettings.channelName.value,
        roomID: live?.liveHistoryId ?? "",
      ),
    )?.then(
      (value) {
        controller.onChangeTab(0);
        controller.init();
      },
    );
  }

  Widget _liveCard(NavHomeController controller, int index, {required bool showAd}) {
    final live = controller.publicLive[index];
    return AppPressable(
        onTap: () => _openLive(controller, live),
        pressedScale: 0.985,
        behavior: HitTestBehavior.deferToChild,
        child: Column(
          children: [
            PublicLiveUi(
              title: live?.title ?? "",
              liveId: live?.liveHistoryId ?? "",
              liveImage: live?.thumbnail ?? "",
              channelId: live?.channelId ?? "",
              channelImage: live?.image ?? "",
              channelName: live?.fullName ?? "",
              views: live?.view ?? 0,
            ),
            showAd && index != 0 && index % AppSettings.showAdsIndex == 0 ? const GoogleLargeNativeAd() : const Offstage()
          ],
        ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GetBuilder<NavHomeController>(
        id: "onGetPublicLiveTabVideo",
        builder: (controller) {
          final wide = AppLayout.isWideWeb;
          final Widget body;
          if (controller.isLoadingPublicLiveTab) {
            body = SingleChildScrollView(child: wide ? const WideVideoGridShimmer() : const NormalVideoShimmerUi());
          } else if (controller.publicLive.isEmpty) {
            body = SingleChildScrollView(
              child: SizedBox(
                height: Get.height + 1,
                child: const Padding(
                  padding: EdgeInsets.only(bottom: 200),
                  child: DataNotFoundUi(type: EmptyStateType.videos, title: "Live Not Found !!"),
                ),
              ),
            );
          } else if (wide) {
            body = SingleChildScrollView(
              controller: controller.publicLiveTabScrollController,
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              child: VideoGrid(
                itemCount: controller.publicLive.length,
                itemBuilder: (context, index) => _liveCard(controller, index, showAd: false),
              ),
            );
          } else {
            body = SingleChildScrollView(
              controller: controller.publicLiveTabScrollController,
              child: ListView.builder(
                itemCount: controller.publicLive.length,
                physics: const BouncingScrollPhysics(),
                shrinkWrap: true,
                scrollDirection: Axis.vertical,
                padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 5),
                itemBuilder: (context, index) => _liveCard(controller, index, showAd: true),
              ),
            );
          }

          return RefreshIndicator(
            color: AppColor.primaryColor,
            onRefresh: () async => await controller.refreshInit(),
            child: body,
          );
        },
      ),
    );
  }
}

class PublicLiveUi extends StatelessWidget {
  const PublicLiveUi({
    super.key,
    required this.title,
    required this.liveId,
    required this.liveImage,
    required this.channelId,
    required this.channelImage,
    required this.channelName,
    required this.views,
  });

  final String title;
  final String liveId;
  final String liveImage;
  final String channelId;
  final String channelImage;
  final String channelName;
  final int views;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Obx(
          () => Container(
            height: VideoGridScope.thumbnailHeight(context, phoneHeight: SizeConfig.largeVideoImageHeight),
            width: double.infinity,
            clipBehavior: Clip.antiAlias,
            margin: const EdgeInsets.symmetric(horizontal: 10),
            decoration: BoxDecoration(
              color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_200,
              borderRadius: BorderRadius.circular(20),
              boxShadow: AppElevation.card(isDarkMode.value),
            ),
            child: Stack(
              children: [
                PreviewVideoImage(videoId: liveId, videoImage: liveImage),
                const ThumbnailScrim(height: 72, strength: 0.45),
                Positioned(
                  right: 12,
                  bottom: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), color: AppColor.notificationAccent),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(height: 6, width: 6, decoration: const BoxDecoration(color: AppColor.white, shape: BoxShape.circle)),
                        const SizedBox(width: 5),
                        Text(
                          "LIVE",
                          style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 11.5, fontWeight: FontWeight.w900, letterSpacing: 0.6),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 5),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(width: 10),
            GestureDetector(
              onTap: () => Get.to(() => YourChannelView(loginUserId: Database.loginUserId!, channelId: channelId)),
              child: SizedBox(
                height: 45,
                width: 45,
                child: Center(
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      PreviewProfileImage(id: channelId, image: channelImage, size: 40, fit: BoxFit.cover),
                      Positioned(
                        bottom: -4,
                        left: 7,
                        child: Container(
                          padding: const EdgeInsets.only(left: 5, right: 5, bottom: 2),
                          decoration: BoxDecoration(
                            color: AppColor.notificationAccent,
                            borderRadius: BorderRadius.circular(5),
                            border: Border.all(color: AppColor.white),
                          ),
                          child: Center(
                            child: Text(
                              "Live",
                              style: GoogleFonts.urbanist(
                                color: AppColor.white,
                                fontSize: 8,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      )
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w800, height: 1.25, letterSpacing: -0.1),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  VideoMetaText(
                    channel: channelName,
                    views: "${CustomFormatNumber.convert(views)} views",
                    dark: isDarkMode.value,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 5),
          ],
        ),
        const SizedBox(height: 15),
      ],
    );
  }
}
