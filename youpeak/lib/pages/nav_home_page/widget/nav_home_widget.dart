import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/ads/google_ads/google_large_native_ad.dart';
import 'package:youpeak/custom/custom_method/custom_format_number.dart';
import 'package:youpeak/custom/custom_ui/data_not_found_ui.dart';
import 'package:youpeak/custom/custom_ui/normal_video_ui.dart';
import 'package:youpeak/custom/custom_ui/short_video_ui.dart';
import 'package:youpeak/custom/shimmer/normal_video_shimmer_ui.dart';
import 'package:youpeak/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/pages/nav_add_page/live_page/view/live_view.dart';
import 'package:youpeak/pages/nav_home_page/controller/nav_home_controller.dart';
import 'package:youpeak/pages/nav_shorts_page/get_shorts_video_model.dart';
import 'package:youpeak/pages/preview_shorts/preview_shorts_view.dart';
import 'package:youpeak/pages/profile_page/your_channel_page/main_page/your_channel_view.dart';
import 'package:youpeak/pages/video_details_page/normal_video_details_view.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/config/size_config.dart';
import 'package:youpeak/utils/icons/app_icons.dart';
import 'package:youpeak/utils/services/preview_image.dart';
import 'package:youpeak/utils/settings/app_settings.dart';
import 'package:youpeak/utils/string/app_string.dart';

class AllTabWidget extends StatelessWidget {
  const AllTabWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GetBuilder<NavHomeController>(
        id: "onGetAllTabVideo",
        builder: (controller) => RefreshIndicator(
          color: AppColor.primaryColor,
          onRefresh: () async => await controller.refreshInit(),
          child: controller.isLoadingAllTab
              ? const SingleChildScrollView(child: NormalVideoShimmerUi())
              : controller.allVideos.isEmpty
                  ? const DataNotFoundUi(type: EmptyStateType.videos, title: "Video Not Found !!")
                  : SingleChildScrollView(
                      controller: controller.allTabScrollController,
                      child: ListView.separated(
                        itemCount: controller.allVideos.length,
                        physics: const BouncingScrollPhysics(),
                        shrinkWrap: true,
                        scrollDirection: Axis.vertical,
                        padding: const EdgeInsets.symmetric(
                            vertical: 10, horizontal: 5),
                        itemBuilder: (context, index) {
                          final indexData = controller.allVideos[index];
                          return controller.allVideos[index].videoType == 1
                              ? Column(
                                  children: [
                                    Database.channelId != indexData.channelId &&
                                            ((indexData.videoPrivacyType == 2 &&
                                                    indexData.channelType ==
                                                        1) ||
                                                (indexData.videoPrivacyType ==
                                                        2 &&
                                                    indexData.channelType ==
                                                        2 &&
                                                    indexData.isSubscribed ==
                                                        false))
                                        ? PrivateContentNormalVideoUi(
                                            videoId: indexData.id ?? "",
                                            title: indexData.title ?? "",
                                            videoImage:
                                                indexData.videoImage ?? "",
                                            videoUrl: indexData.videoUrl ?? "",
                                            videoTime: indexData.videoTime ?? 0,
                                            channelId:
                                                indexData.channelId ?? "",
                                            channelImage:
                                                indexData.channelImage ?? "",
                                            channelName:
                                                indexData.channelName ?? "",
                                            views: indexData.views ?? 0,
                                            uploadTime: indexData.time ?? "",
                                            isSave:
                                                indexData.isSaveToWatchLater ??
                                                    false,
                                            subscribeCallback: () => controller
                                                .onSubscribePrivateChannel(
                                                    tabType: 0,
                                                    index: index,
                                                    context: context,
                                                    isShorts: false),
                                            videoCallback: () =>
                                                controller.onUnlockPrivateVideo(
                                                    tabType: 0,
                                                    index: index,
                                                    context: context,
                                                    isShorts: false),
                                            videoCost:
                                                indexData.videoUnlockCost ?? 0,
                                            subscribeCost:
                                                indexData.subscriptionCost ?? 0,
                                            channelType:
                                                indexData.channelType ?? 1,
                                          )
                                        : GestureDetector(
                                            onTap: () async {
                                              Get.to(NormalVideoDetailsView(
                                                videoId: indexData.id ?? "",
                                                videoUrl:
                                                    indexData.videoUrl ?? "",
                                                cost:
                                                    indexData.subscriptionCost,
                                              ));
                                            },
                                            child: NormalVideoUi(
                                              videoId: indexData.id ?? "",
                                              title: indexData.title ?? "",
                                              videoImage:
                                                  indexData.videoImage ?? "",
                                              videoUrl:
                                                  indexData.videoUrl ?? "",
                                              videoTime:
                                                  indexData.videoTime ?? 0,
                                              channelId:
                                                  indexData.channelId ?? "",
                                              channelImage:
                                                  indexData.channelImage ?? "",
                                              channelName:
                                                  indexData.channelName ?? "",
                                              views: indexData.views ?? 0,
                                              uploadTime: indexData.time ?? "",
                                              isSave: indexData
                                                      .isSaveToWatchLater ??
                                                  false,
                                            ),
                                          ),
                                    index != 0 &&
                                            index % AppSettings.showAdsIndex ==
                                                0
                                        ? const GoogleLargeNativeAd()
                                        : const Offstage()
                                  ],
                                )
                              : const Offstage();
                        },
                        separatorBuilder: (context, index) {
                          return controller.allShorts.isNotEmpty && index == 1
                              ? SizedBox(
                                  height: 325,
                                  child: Column(
                                    children: [
                                      Row(
                                        children: [
                                          const SizedBox(width: 10),
                                          Image.asset(
                                            AppIcons.boldVideo,
                                            width: 28,
                                            color: AppColor.primaryColor
                                                .withOpacity(0.8),
                                          ),
                                          const SizedBox(width: 12),
                                          Text(AppStrings.shorts.tr,
                                              style: GoogleFonts.urbanist(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold)),
                                          const Spacer(),
                                          InkWell(
                                              onTap: () => AppSettings
                                                  .navigationIndex.value = 1,
                                              child: Text(AppStrings.viewAll.tr,
                                                  style: GoogleFonts.urbanist(
                                                      fontSize: 14,
                                                      fontWeight:
                                                          FontWeight.bold))),
                                          Image.asset(
                                            AppIcons.arrowRight,
                                            width: 16,
                                            color: AppColor.primaryColor,
                                          ).paddingOnly(right: 5),
                                        ],
                                      ).paddingOnly(bottom: 10),
                                      SizedBox(
                                        height: 280,
                                        child: SingleChildScrollView(
                                          scrollDirection: Axis.horizontal,
                                          child: ListView.builder(
                                            itemCount:
                                                controller.allShorts.length,
                                            scrollDirection: Axis.horizontal,
                                            shrinkWrap: true,
                                            physics:
                                                const BouncingScrollPhysics(),
                                            padding: const EdgeInsets.only(
                                                left: 10, bottom: 10),
                                            itemBuilder: (BuildContext context,
                                                int index) {
                                              final indexData =
                                                  controller.allShorts[index];

                                              return Database.channelId !=
                                                          indexData.channelId &&
                                                      ((indexData.videoPrivacyType ==
                                                                  2 &&
                                                              indexData
                                                                      .channelType ==
                                                                  1) ||
                                                          (indexData.videoPrivacyType ==
                                                                  2 &&
                                                              indexData
                                                                      .channelType ==
                                                                  2 &&
                                                              indexData
                                                                      .isSubscribed ==
                                                                  false))
                                                  ? ShortsPrivateContentWidget(
                                                      id: indexData.id ?? "",
                                                      image: indexData
                                                              .videoImage ??
                                                          "",
                                                      subscribe: () => controller
                                                          .onSubscribePrivateChannel(
                                                              tabType: 0,
                                                              index: index,
                                                              context: context,
                                                              isShorts: true),
                                                      unlock: () => controller
                                                          .onUnlockPrivateVideo(
                                                              tabType: 0,
                                                              index: index,
                                                              context: context,
                                                              isShorts: true),
                                                      subscribeCoin: indexData
                                                              .subscriptionCost ??
                                                          0,
                                                      unlockCoin: indexData
                                                              .videoUnlockCost ??
                                                          0,
                                                      title:
                                                          indexData.title ?? "",
                                                      views:
                                                          indexData.views ?? 0,
                                                      channelType: indexData
                                                              .channelType ??
                                                          1,
                                                    )
                                                  : GestureDetector(
                                                      onTap: () async {
                                                        Get.to(
                                                          PreviewShortsView(
                                                            firstVideoData:
                                                                Shorts(
                                                              id: indexData.id,
                                                              userId: indexData
                                                                  .userId,
                                                              channelId:
                                                                  indexData
                                                                      .channelId,
                                                              title: indexData
                                                                  .title,
                                                              videoImage:
                                                                  indexData
                                                                      .videoImage,
                                                              hashTag: indexData
                                                                  .hashTag,
                                                              videoUrl:
                                                                  indexData
                                                                      .videoUrl,
                                                              channelImage:
                                                                  indexData
                                                                      .channelImage,
                                                              createdAt:
                                                                  indexData
                                                                      .createdAt,
                                                              channelName:
                                                                  indexData
                                                                      .channelName,
                                                              description:
                                                                  indexData
                                                                      .description,
                                                              dislike: indexData
                                                                  .dislike,
                                                              isDislike:
                                                                  indexData
                                                                      .isDislike,
                                                              isLike: indexData
                                                                  .isLike,
                                                              isSubscribed:
                                                                  indexData
                                                                      .isSubscribed,
                                                              like: indexData
                                                                  .like,
                                                              shareCount:
                                                                  indexData
                                                                      .shareCount,
                                                              totalComments:
                                                                  indexData
                                                                      .totalComments,
                                                              videoTime:
                                                                  indexData
                                                                      .videoTime,
                                                              videoType:
                                                                  indexData
                                                                      .videoType,
                                                              views: indexData
                                                                  .views,
                                                              isSaveToWatchLater:
                                                                  indexData
                                                                          .isSaveToWatchLater ??
                                                                      false,
                                                            ),
                                                          ),
                                                        );
                                                      },
                                                      child: ShortVideoUi(
                                                          videoId: indexData.id ??
                                                              "",
                                                          title: indexData.title ??
                                                              "",
                                                          videoImage: indexData
                                                                  .videoImage ??
                                                              "",
                                                          videoUrl: indexData
                                                                  .videoUrl ??
                                                              "",
                                                          channelId: indexData
                                                                  .channelId ??
                                                              "",
                                                          views:
                                                              indexData.views ??
                                                                  0,
                                                          videoTime: indexData
                                                                  .videoTime ??
                                                              0,
                                                          channelName: indexData
                                                                  .channelName ??
                                                              "",
                                                          isSave: indexData
                                                                  .isSaveToWatchLater ??
                                                              false),
                                                    );
                                            },
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              : const Offstage();
                        },
                      ),
                    ),
        ),
      ),
    );
  }
}

class PopularTabWidget extends StatelessWidget {
  const PopularTabWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GetBuilder<NavHomeController>(
        id: "onGetPopularTabVideo",
        builder: (controller) => RefreshIndicator(
          color: AppColor.primaryColor,
          onRefresh: () async => await controller.refreshInit(),
          child: controller.isLoadingPopularTab
              ? const SingleChildScrollView(child: NormalVideoShimmerUi())
              : controller.popularVideos.isEmpty
                  ? const DataNotFoundUi(type: EmptyStateType.videos, title: "Video Not Found !!")
                  : SingleChildScrollView(
                      controller: controller.popularTabScrollController,
                      child: ListView.separated(
                        itemCount: controller.popularVideos.length,
                        physics: const BouncingScrollPhysics(),
                        shrinkWrap: true,
                        scrollDirection: Axis.vertical,
                        padding: const EdgeInsets.symmetric(
                            vertical: 10, horizontal: 5),
                        itemBuilder: (context, index) {
                          final indexData = controller.popularVideos[index];
                          return controller.popularVideos[index].videoType == 1
                              ? Column(
                                  children: [
                                    Database.channelId != indexData.channelId &&
                                            ((indexData.videoPrivacyType == 2 &&
                                                    indexData.channelType ==
                                                        1) ||
                                                (indexData.videoPrivacyType ==
                                                        2 &&
                                                    indexData.channelType ==
                                                        2 &&
                                                    indexData.isSubscribed ==
                                                        false))
                                        ? PrivateContentNormalVideoUi(
                                            videoId: indexData.id ?? "",
                                            title: indexData.title ?? "",
                                            videoImage:
                                                indexData.videoImage ?? "",
                                            videoUrl: indexData.videoUrl ?? "",
                                            videoTime: indexData.videoTime ?? 0,
                                            channelId:
                                                indexData.channelId ?? "",
                                            channelImage:
                                                indexData.channelImage ?? "",
                                            channelName:
                                                indexData.channelName ?? "",
                                            views: indexData.views ?? 0,
                                            uploadTime: indexData.time ?? "",
                                            isSave:
                                                indexData.isSaveToWatchLater ??
                                                    false,
                                            subscribeCallback: () => controller
                                                .onSubscribePrivateChannel(
                                                    tabType: 1,
                                                    index: index,
                                                    context: context,
                                                    isShorts: false),
                                            videoCallback: () =>
                                                controller.onUnlockPrivateVideo(
                                                    tabType: 1,
                                                    index: index,
                                                    context: context,
                                                    isShorts: false),
                                            videoCost:
                                                indexData.videoUnlockCost ?? 0,
                                            subscribeCost:
                                                indexData.subscriptionCost ?? 0,
                                            channelType:
                                                indexData.channelType ?? 1,
                                          )
                                        : GestureDetector(
                                            onTap: () async {
                                              Get.to(NormalVideoDetailsView(
                                                  videoId: indexData.id ?? "",
                                                  videoUrl:
                                                      indexData.videoUrl ?? "",
                                                  cost: indexData
                                                      .subscriptionCost));
                                            },
                                            child: NormalVideoUi(
                                              videoId: indexData.id ?? "",
                                              title: indexData.title ?? "",
                                              videoImage:
                                                  indexData.videoImage ?? "",
                                              videoUrl:
                                                  indexData.videoUrl ?? "",
                                              videoTime:
                                                  indexData.videoTime ?? 0,
                                              channelId:
                                                  indexData.channelId ?? "",
                                              channelImage:
                                                  indexData.channelImage ?? "",
                                              channelName:
                                                  indexData.channelName ?? "",
                                              views: indexData.views ?? 0,
                                              uploadTime: indexData.time ?? "",
                                              isSave: indexData
                                                      .isSaveToWatchLater ??
                                                  false,
                                            ),
                                          ),
                                    index != 0 &&
                                            index % AppSettings.showAdsIndex ==
                                                0
                                        ? const GoogleLargeNativeAd()
                                        : const Offstage()
                                  ],
                                )
                              : const Offstage();
                        },
                        separatorBuilder: (context, index) {
                          return controller.popularShorts.isNotEmpty &&
                                  index == 1
                              ? SizedBox(
                                  height: 325,
                                  child: Column(
                                    children: [
                                      Row(
                                        children: [
                                          const SizedBox(width: 10),
                                          Image.asset(
                                            AppIcons.boldVideo,
                                            width: 28,
                                            color: AppColor.primaryColor
                                                .withOpacity(0.8),
                                          ),
                                          const SizedBox(width: 12),
                                          Text(AppStrings.shorts.tr,
                                              style: GoogleFonts.urbanist(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold)),
                                          const Spacer(),
                                          InkWell(
                                              onTap: () => AppSettings
                                                  .navigationIndex.value = 1,
                                              child: Text(AppStrings.viewAll.tr,
                                                  style: GoogleFonts.urbanist(
                                                      fontSize: 14,
                                                      fontWeight:
                                                          FontWeight.bold))),
                                          Image.asset(
                                            AppIcons.arrowRight,
                                            width: 16,
                                            color: AppColor.primaryColor,
                                          ).paddingOnly(right: 5),
                                        ],
                                      ).paddingOnly(bottom: 10),
                                      SizedBox(
                                        height: 280,
                                        child: SingleChildScrollView(
                                          scrollDirection: Axis.horizontal,
                                          child: ListView.builder(
                                            itemCount:
                                                controller.popularShorts.length,
                                            scrollDirection: Axis.horizontal,
                                            shrinkWrap: true,
                                            physics:
                                                const BouncingScrollPhysics(),
                                            padding: const EdgeInsets.only(
                                                left: 10, bottom: 10),
                                            itemBuilder: (BuildContext context,
                                                int index) {
                                              final indexData = controller
                                                  .popularShorts[index];

                                              return Database.channelId !=
                                                          indexData.channelId &&
                                                      ((indexData.videoPrivacyType ==
                                                                  2 &&
                                                              indexData
                                                                      .channelType ==
                                                                  1) ||
                                                          (indexData.videoPrivacyType ==
                                                                  2 &&
                                                              indexData
                                                                      .channelType ==
                                                                  2 &&
                                                              indexData
                                                                      .isSubscribed ==
                                                                  false))
                                                  ? ShortsPrivateContentWidget(
                                                      id: indexData.id ?? "",
                                                      image: indexData
                                                              .videoImage ??
                                                          "",
                                                      subscribe: () => controller
                                                          .onSubscribePrivateChannel(
                                                              tabType: 1,
                                                              index: index,
                                                              context: context,
                                                              isShorts: true),
                                                      unlock: () => controller
                                                          .onUnlockPrivateVideo(
                                                              tabType: 1,
                                                              index: index,
                                                              context: context,
                                                              isShorts: true),
                                                      subscribeCoin: indexData
                                                              .subscriptionCost ??
                                                          0,
                                                      unlockCoin: indexData
                                                              .videoUnlockCost ??
                                                          0,
                                                      title:
                                                          indexData.title ?? "",
                                                      views:
                                                          indexData.views ?? 0,
                                                      channelType: indexData
                                                              .channelType ??
                                                          1,
                                                    )
                                                  : GestureDetector(
                                                      onTap: () async {
                                                        Get.to(
                                                          PreviewShortsView(
                                                            firstVideoData:
                                                                Shorts(
                                                              id: indexData.id,
                                                              userId: indexData
                                                                  .userId,
                                                              channelId:
                                                                  indexData
                                                                      .channelId,
                                                              title: indexData
                                                                  .title,
                                                              videoImage:
                                                                  indexData
                                                                      .videoImage,
                                                              hashTag: indexData
                                                                  .hashTag,
                                                              videoUrl:
                                                                  indexData
                                                                      .videoUrl,
                                                              channelImage:
                                                                  indexData
                                                                      .channelImage,
                                                              createdAt:
                                                                  indexData
                                                                      .createdAt,
                                                              channelName:
                                                                  indexData
                                                                      .channelName,
                                                              description:
                                                                  indexData
                                                                      .description,
                                                              dislike: indexData
                                                                  .dislike,
                                                              isDislike:
                                                                  indexData
                                                                      .isDislike,
                                                              isLike: indexData
                                                                  .isLike,
                                                              isSubscribed:
                                                                  indexData
                                                                      .isSubscribed,
                                                              like: indexData
                                                                  .like,
                                                              shareCount:
                                                                  indexData
                                                                      .shareCount,
                                                              totalComments:
                                                                  indexData
                                                                      .totalComments,
                                                              videoTime:
                                                                  indexData
                                                                      .videoTime,
                                                              videoType:
                                                                  indexData
                                                                      .videoType,
                                                              views: indexData
                                                                  .views,
                                                              isSaveToWatchLater:
                                                                  indexData
                                                                          .isSaveToWatchLater ??
                                                                      false,
                                                            ),
                                                          ),
                                                        );
                                                      },
                                                      child: ShortVideoUi(
                                                        videoId:
                                                            indexData.id ?? "",
                                                        title:
                                                            indexData.title ??
                                                                "",
                                                        videoImage: indexData
                                                                .videoImage ??
                                                            "",
                                                        channelId: indexData
                                                                .channelId ??
                                                            "",
                                                        videoUrl: indexData
                                                                .videoUrl ??
                                                            "",
                                                        views:
                                                            indexData.views ??
                                                                0,
                                                        videoTime: indexData
                                                                .videoTime ??
                                                            0,
                                                        channelName: indexData
                                                                .channelName ??
                                                            "",
                                                        isSave: indexData
                                                                .isSaveToWatchLater ??
                                                            false,
                                                      ),
                                                    );
                                            },
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              : const Offstage();
                        },
                      ),
                    ),
        ),
      ),
    );
  }
}

class NewTabWidget extends StatelessWidget {
  const NewTabWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GetBuilder<NavHomeController>(
        id: "onGetNewTabVideo",
        builder: (controller) => RefreshIndicator(
          color: AppColor.primaryColor,
          onRefresh: () async => await controller.refreshInit(),
          child: controller.isLoadingNewTab
              ? const SingleChildScrollView(child: NormalVideoShimmerUi())
              : controller.newVideos.isEmpty
                  ? const DataNotFoundUi(type: EmptyStateType.videos, title: "Video Not Found !!")
                  : SingleChildScrollView(
                      controller: controller.newTabScrollController,
                      child: ListView.separated(
                        itemCount: controller.newVideos.length,
                        physics: const BouncingScrollPhysics(),
                        shrinkWrap: true,
                        scrollDirection: Axis.vertical,
                        padding: const EdgeInsets.symmetric(
                            vertical: 10, horizontal: 5),
                        itemBuilder: (context, index) {
                          final indexData = controller.newVideos[index];
                          print(
                              "$index******* ${indexData.videoPrivacyType} *** ********* ********${indexData.channelType} ** ${indexData.isSubscribed}");

                          return controller.newVideos[index].videoType == 1
                              ? Column(
                                  children: [
                                    Database.channelId != indexData.channelId &&
                                            ((indexData.videoPrivacyType == 2 &&
                                                    indexData.channelType ==
                                                        1) ||
                                                (indexData.videoPrivacyType ==
                                                        2 &&
                                                    indexData.channelType ==
                                                        2 &&
                                                    indexData.isSubscribed ==
                                                        false))
                                        ? PrivateContentNormalVideoUi(
                                            videoId: indexData.id ?? "",
                                            title: indexData.title ?? "",
                                            videoImage:
                                                indexData.videoImage ?? "",
                                            videoUrl: indexData.videoUrl ?? "",
                                            videoTime: indexData.videoTime ?? 0,
                                            channelId:
                                                indexData.channelId ?? "",
                                            channelImage:
                                                indexData.channelImage ?? "",
                                            channelName:
                                                indexData.channelName ?? "",
                                            views: indexData.views ?? 0,
                                            uploadTime: indexData.time ?? "",
                                            isSave:
                                                indexData.isSaveToWatchLater ??
                                                    false,
                                            subscribeCallback: () => controller
                                                .onSubscribePrivateChannel(
                                                    tabType: 2,
                                                    index: index,
                                                    context: context,
                                                    isShorts: false),
                                            videoCallback: () =>
                                                controller.onUnlockPrivateVideo(
                                                    tabType: 2,
                                                    index: index,
                                                    context: context,
                                                    isShorts: false),
                                            videoCost:
                                                indexData.videoUnlockCost ?? 0,
                                            subscribeCost:
                                                indexData.subscriptionCost ?? 0,
                                            channelType:
                                                indexData.channelType ?? 1,
                                          )
                                        : GestureDetector(
                                            onTap: () async {
                                              Get.to(NormalVideoDetailsView(
                                                  videoId: indexData.id ?? "",
                                                  videoUrl:
                                                      indexData.videoUrl ?? "",
                                                  cost: indexData
                                                      .subscriptionCost));
                                            },
                                            child: NormalVideoUi(
                                              videoId: indexData.id ?? "",
                                              title: indexData.title ?? "",
                                              videoImage:
                                                  indexData.videoImage ?? "",
                                              videoUrl:
                                                  indexData.videoUrl ?? "",
                                              videoTime:
                                                  indexData.videoTime ?? 0,
                                              channelId:
                                                  indexData.channelId ?? "",
                                              channelImage:
                                                  indexData.channelImage ?? "",
                                              channelName:
                                                  indexData.channelName ?? "",
                                              views: indexData.views ?? 0,
                                              uploadTime: indexData.time ?? "",
                                              isSave: indexData
                                                      .isSaveToWatchLater ??
                                                  false,
                                            ),
                                          ),
                                    index != 0 &&
                                            index % AppSettings.showAdsIndex ==
                                                0
                                        ? const GoogleLargeNativeAd()
                                        : const Offstage()
                                  ],
                                )
                              : const Offstage();
                        },
                        separatorBuilder: (context, index) {
                          return controller.newShorts.isNotEmpty && index == 1
                              ? SizedBox(
                                  height: 325,
                                  child: Column(
                                    children: [
                                      Row(
                                        children: [
                                          const SizedBox(width: 10),
                                          Image.asset(
                                            AppIcons.boldVideo,
                                            width: 28,
                                            color: AppColor.primaryColor
                                                .withOpacity(0.8),
                                          ),
                                          const SizedBox(width: 12),
                                          Text(AppStrings.shorts.tr,
                                              style: GoogleFonts.urbanist(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold)),
                                          const Spacer(),
                                          InkWell(
                                              onTap: () => AppSettings
                                                  .navigationIndex.value = 1,
                                              child: Text(AppStrings.viewAll.tr,
                                                  style: GoogleFonts.urbanist(
                                                      fontSize: 14,
                                                      fontWeight:
                                                          FontWeight.bold))),
                                          Image.asset(
                                            AppIcons.arrowRight,
                                            width: 16,
                                            color: AppColor.primaryColor,
                                          ).paddingOnly(right: 5),
                                        ],
                                      ).paddingOnly(bottom: 10),
                                      SizedBox(
                                        height: 280,
                                        child: SingleChildScrollView(
                                          scrollDirection: Axis.horizontal,
                                          child: ListView.builder(
                                            itemCount:
                                                controller.newShorts.length,
                                            scrollDirection: Axis.horizontal,
                                            shrinkWrap: true,
                                            physics:
                                                const BouncingScrollPhysics(),
                                            padding: const EdgeInsets.only(
                                                left: 10, bottom: 10),
                                            itemBuilder: (BuildContext context,
                                                int index) {
                                              final indexData =
                                                  controller.newShorts[index];
                                              return Database.channelId !=
                                                          indexData.channelId &&
                                                      ((indexData.videoPrivacyType ==
                                                                  2 &&
                                                              indexData
                                                                      .channelType ==
                                                                  1) ||
                                                          (indexData.videoPrivacyType ==
                                                                  2 &&
                                                              indexData
                                                                      .channelType ==
                                                                  2 &&
                                                              indexData
                                                                      .isSubscribed ==
                                                                  false))
                                                  ? ShortsPrivateContentWidget(
                                                      id: indexData.id ?? "",
                                                      image: indexData
                                                              .videoImage ??
                                                          "",
                                                      subscribe: () => controller
                                                          .onSubscribePrivateChannel(
                                                              tabType: 2,
                                                              index: index,
                                                              context: context,
                                                              isShorts: true),
                                                      unlock: () => controller
                                                          .onUnlockPrivateVideo(
                                                              tabType: 2,
                                                              index: index,
                                                              context: context,
                                                              isShorts: true),
                                                      subscribeCoin: indexData
                                                              .subscriptionCost ??
                                                          0,
                                                      unlockCoin: indexData
                                                              .videoUnlockCost ??
                                                          0,
                                                      title:
                                                          indexData.title ?? "",
                                                      views:
                                                          indexData.views ?? 0,
                                                      channelType: indexData
                                                              .channelType ??
                                                          1,
                                                    )
                                                  : GestureDetector(
                                                      onTap: () async {
                                                        Get.to(
                                                          PreviewShortsView(
                                                            firstVideoData:
                                                                Shorts(
                                                              id: indexData.id,
                                                              userId: indexData
                                                                  .userId,
                                                              channelId:
                                                                  indexData
                                                                      .channelId,
                                                              title: indexData
                                                                  .title,
                                                              videoImage:
                                                                  indexData
                                                                      .videoImage,
                                                              hashTag: indexData
                                                                  .hashTag,
                                                              videoUrl:
                                                                  indexData
                                                                      .videoUrl,
                                                              channelImage:
                                                                  indexData
                                                                      .channelImage,
                                                              createdAt: indexData
                                                                  .createdAt
                                                                  .toString(),
                                                              channelName:
                                                                  indexData
                                                                      .channelName,
                                                              description:
                                                                  indexData
                                                                      .description,
                                                              dislike: indexData
                                                                  .dislike,
                                                              isDislike:
                                                                  indexData
                                                                      .isDislike,
                                                              isLike: indexData
                                                                  .isLike,
                                                              isSubscribed:
                                                                  indexData
                                                                      .isSubscribed,
                                                              like: indexData
                                                                  .like,
                                                              shareCount:
                                                                  indexData
                                                                      .shareCount,
                                                              totalComments:
                                                                  indexData
                                                                      .totalComments
                                                                      .length,
                                                              videoTime:
                                                                  indexData
                                                                      .videoTime,
                                                              videoType:
                                                                  indexData
                                                                      .videoType,
                                                              views: indexData
                                                                  .views,
                                                              isSaveToWatchLater:
                                                                  indexData
                                                                      .isSaveToWatchLater,
                                                            ),
                                                          ),
                                                        );
                                                      },
                                                      child: ShortVideoUi(
                                                        videoId:
                                                            indexData.id ?? "",
                                                        title:
                                                            indexData.title ??
                                                                "",
                                                        views:
                                                            indexData.views ??
                                                                0,
                                                        videoImage: indexData
                                                                .videoImage ??
                                                            "",
                                                        channelId: indexData
                                                                .channelId ??
                                                            "",
                                                        videoUrl: indexData
                                                                .videoUrl ??
                                                            "",
                                                        videoTime: indexData
                                                                .videoTime ??
                                                            0,
                                                        channelName: indexData
                                                                .channelName ??
                                                            "",
                                                        isSave: indexData
                                                                .isSaveToWatchLater ??
                                                            false,
                                                      ),
                                                    );
                                            },
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              : const Offstage();
                        },
                      ),
                    ),
        ),
      ),
    );
  }
}

class LiveTabWidget extends StatelessWidget {
  const LiveTabWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GetBuilder<NavHomeController>(
        id: "onGetPublicLiveTabVideo",
        builder: (controller) => RefreshIndicator(
          color: AppColor.primaryColor,
          onRefresh: () async => await controller.refreshInit(),
          child: controller.isLoadingPublicLiveTab
              ? const SingleChildScrollView(child: NormalVideoShimmerUi())
              : controller.publicLive.isEmpty
                  ? SingleChildScrollView(
                      child: SizedBox(
                        height: Get.height + 1,
                        child: const Padding(
                          padding: EdgeInsets.only(bottom: 200),
                          child: DataNotFoundUi(type: EmptyStateType.videos, title: "Live Not Found !!"),
                        ),
                      ),
                    )
                  : SingleChildScrollView(
                      controller: controller.publicLiveTabScrollController,
                      child: ListView.builder(
                        itemCount: controller.publicLive.length,
                        physics: const BouncingScrollPhysics(),
                        shrinkWrap: true,
                        scrollDirection: Axis.vertical,
                        padding: const EdgeInsets.symmetric(
                            vertical: 10, horizontal: 5),
                        itemBuilder: (context, index) {
                          final indexData = controller.publicLive[index];
                          return GestureDetector(
                            onTap: () async {
                              Get.to(
                                () => LivePage(
                                  isHost: false,
                                  localUserID: Database.loginUserId!,
                                  localUserName: AppSettings.channelName.value,
                                  roomID: indexData?.liveHistoryId ?? "",
                                ),
                              )?.then(
                                (value) {
                                  controller.onChangeTab(0);
                                  controller.init();
                                },
                              );
                            },
                            child: Column(
                              children: [
                                PublicLiveUi(
                                  title: indexData?.title ?? "",
                                  liveId: indexData?.liveHistoryId ?? "",
                                  liveImage: indexData?.thumbnail ?? "",
                                  channelId: indexData?.channelId ?? "",
                                  channelImage: indexData?.image ?? "",
                                  channelName: indexData?.fullName ?? "",
                                  views: indexData?.view ?? 0,
                                ),
                                index != 0 &&
                                        index % AppSettings.showAdsIndex == 0
                                    ? const GoogleLargeNativeAd()
                                    : const Offstage()
                              ],
                            ),
                          );
                        },
                      ),
                    ),
        ),
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
            height: SizeConfig.largeVideoImageHeight,
            width: Get.width,
            clipBehavior: Clip.antiAlias,
            margin: const EdgeInsets.symmetric(horizontal: 10),
            decoration: BoxDecoration(
              color: isDarkMode.value
                  ? AppColor.secondDarkMode
                  : AppColor.grey_400,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Stack(
              children: [
                PreviewVideoImage(videoId: liveId, videoImage: liveImage),

                // ConvertedPathView(imageVideoPath: videoImage),

                Positioned(
                  right: 20,
                  bottom: 15,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 13, vertical: 5),
                    decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(7),
                        color: AppColor.primaryColor),
                    child: Text(
                      "Live",
                      style: GoogleFonts.urbanist(
                          color: AppColor.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold),
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
              onTap: () => Get.to(() => YourChannelView(
                  loginUserId: Database.loginUserId!, channelId: channelId)),
              child: SizedBox(
                height: 45,
                width: 45,
                child: Center(
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      PreviewProfileImage(
                          id: channelId,
                          image: channelImage,
                          size: 40,
                          fit: BoxFit.cover),
                      Positioned(
                        bottom: -4,
                        left: 7,
                        child: Container(
                          padding: const EdgeInsets.only(
                              left: 5, right: 5, bottom: 2),
                          decoration: BoxDecoration(
                            color: AppColor.primaryColor,
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
                    style: GoogleFonts.urbanist(
                        fontSize: 18, fontWeight: FontWeight.bold),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    "$channelName - ${CustomFormatNumber.convert(views)} views",
                    style: GoogleFonts.urbanist(
                        fontSize: 12, color: AppColor.grey),
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
