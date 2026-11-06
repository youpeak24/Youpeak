import 'package:youpeak/core/platform/app_layout.dart';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/ads/google_small_native_ad.dart';
import 'package:youpeak/core/utils/custom_format_timer.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/shared/widgets/short_video_ui.dart';
import 'package:youpeak/shared/widgets/small_video_widget.dart';
import 'package:youpeak/shared/shimmer/shorts_list_shimmer_ui.dart';
import 'package:youpeak/shared/shimmer/video_list_shimmer_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/channel/controller/your_channel_controller.dart';
import 'package:youpeak/features/video/view/normal_video_details_view.dart';
import 'package:youpeak/features/video/view/shorts_video_details_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/shared/widgets/video_card_parts.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';
import 'package:youpeak/core/utils/utils.dart';

class ChannelVideoTabView extends GetView<YourChannelController> {
  const ChannelVideoTabView({super.key});

  @override
  Widget build(BuildContext context) {
    List videoTypes = ['video'.tr, 'shorts'.tr];
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 10, bottom: 10),
          child: SizedBox(
            height: 32,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.only(left: 10),
              itemCount: videoTypes.length,
              itemBuilder: (context, index) {
                return GestureDetector(
                  onTap: () => controller.onChangeVideoType(index),
                  child: GetBuilder<YourChannelController>(
                    id: "onChangeVideoType",
                    builder: (controller) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 2),
                      margin: const EdgeInsets.only(right: 5),
                      decoration: BoxDecoration(
                        color: controller.selectedVideoType != index ? Colors.transparent : AppColor.primaryColor,
                        border: Border.all(color: AppColor.primaryColor),
                        borderRadius: BorderRadius.circular(28),
                      ),
                      child: Center(
                        child: Text(
                          videoTypes[index],
                          textAlign: TextAlign.center,
                          style: GoogleFonts.urbanist(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                            color: controller.selectedVideoType == index ? AppColor.white : AppColor.primaryColor,
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
        GetBuilder<YourChannelController>(
          id: "onChangeVideoType",
          builder: (controller) => Expanded(child: controller.selectedVideoType == 0 ? const ChannelNormalVideo() : const ChannelShortsVideo()),
        )
      ],
    );
  }
}

class ChannelNormalVideo extends StatelessWidget {
  const ChannelNormalVideo({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<YourChannelController>(
      id: "onChangeNormalVideo",
      builder: (controller) => controller.channelVideos[0] == null
          ? const VideoListShimmerUi()
          : controller.channelVideos[0]!.isEmpty
              ? DataNotFoundUi(type: EmptyStateType.videos, title: AppStrings.videosNotAvailable.tr)
              : SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: controller.channelVideos[0]!.length,
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    itemBuilder: (context, index) {
                      final indexData = controller.channelVideos[0]![index];
                      return Database.channelId != indexData.channelId &&
                              ((indexData.videoPrivacyType == 2 && indexData.channelType == 1) ||
                                  (indexData.videoPrivacyType == 2 && indexData.channelType == 2 && indexData.isSubscribed == false))
                          ? GestureDetector(
                              onTap: () => controller.onUnlockPrivateVideo(tabType: 2, index: index, context: context),
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
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 10),
                                  child: GestureDetector(
                                    onTap: () =>
                                        Get.to(NormalVideoDetailsView(videoId: controller.channelVideos[0]![index].id!, videoUrl: controller.channelVideos[0]![index].videoUrl!)),
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
                                              decoration: BoxDecoration(
                                                color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_400,
                                                borderRadius: BorderRadius.circular(20),
                                              ),
                                              child: PreviewVideoImage(
                                                videoId: controller.channelVideos[0]![index].id!,
                                                videoImage: controller.channelVideos[0]![index].videoImage!,
                                              ),
                                            ),
                                            Positioned(
                                              bottom: 10,
                                              right: 10,
                                              child: DurationBadge(text: CustomFormatTime.convertSecond(int.parse(controller.channelVideos[0]![index].videoTime.toString())), fontSize: 11),
                                            ),
                                          ],
                                        ),
                                        SizedBox(width: AppLayout.width * 0.03),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                controller.channelVideos[0]![index].title.toString(),
                                                maxLines: 3,
                                                style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold),
                                              ),
                                              SizedBox(height: SizeConfig.blockSizeVertical * 1),
                                              Text(
                                                "${controller.channelVideos[0]![index].views.toString()} • ${controller.channelVideos[0]![index].time.toString()}",
                                                style:
                                                    GoogleFonts.urbanist(fontSize: 10, color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black.withOpacity(0.7)),
                                              ),
                                            ],
                                          ),
                                        ),
                                        SizedBox(width: AppLayout.width * 0.01),
                                      ],
                                    ),
                                  ),
                                ),
                                index != 0 && index % AppSettings.showAdsIndex == 0 ? const GoogleSmallNativeAd() : const Offstage()
                              ],
                            );
                    },
                  ),
                ),
    );
  }
}

class ChannelShortsVideo extends StatelessWidget {
  const ChannelShortsVideo({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<YourChannelController>(
      id: "onChangeShortsVideo",
      builder: (controller) => controller.channelVideos[1] == null
          ? const ShortsListShimmerUi()
          : controller.channelVideos[1]!.isEmpty
              ? DataNotFoundUi(type: EmptyStateType.videos, title: AppStrings.shortsNotAvailable.tr)
              : SingleChildScrollView(
                  // controller: controller.channelShortVideoController,
                  physics: const BouncingScrollPhysics(),
                  child: GridView.builder(
                    physics: const NeverScrollableScrollPhysics(),
                    shrinkWrap: true,
                    itemCount: controller.channelVideos[1]?.length,
                    padding: const EdgeInsets.only(top: 10, left: 10, right: 10, bottom: 40),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 10, crossAxisSpacing: 10, mainAxisExtent: 280),
                    itemBuilder: (context, index) {
                      final indexData = controller.channelVideos[1]![index];
                      return Database.channelId != indexData.channelId &&
                              ((indexData.videoPrivacyType == 2 && indexData.channelType == 1) ||
                                  (indexData.videoPrivacyType == 2 && indexData.channelType == 2 && indexData.isSubscribed == false))
                          ? ShortsPrivateContentWidget(
                              id: indexData.id ?? "",
                              image: indexData.videoImage ?? "",
                              subscribe: () => controller.onSubscribePrivateChannel(tabType: 2, index: index, context: context),
                              unlock: () => controller.onUnlockPrivateVideo(tabType: 2, index: index, context: context),
                              subscribeCoin: indexData.subscriptionCost ?? 0,
                              unlockCoin: indexData.videoUnlockCost ?? 0,
                              title: indexData.title ?? "",
                              views: indexData.views ?? 0,
                              channelType: indexData.channelType ?? 1,
                            )
                          : GestureDetector(
                              onTap: () =>
                                  Get.to(() => ShortsVideoDetailsView(videoId: controller.channelVideos[1]![index].id!, videoUrl: controller.channelVideos[1]![index].videoUrl!)),
                              child: Container(
                                height: 280,
                                width: 165,
                                clipBehavior: Clip.antiAlias,
                                decoration: BoxDecoration(color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_400, borderRadius: BorderRadius.circular(20)),
                                child: Stack(
                                  children: [
                                    PreviewVideoImage(
                                      videoId: controller.channelVideos[1]![index].id!,
                                      videoImage: controller.channelVideos[1]![index].videoImage!,
                                    ),
                                    Positioned(
                                      bottom: 0,
                                      left: 10,
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          SizedBox(
                                            width: 145,
                                            child: Text(
                                              controller.channelVideos[1]![index].title.toString(),
                                              maxLines: 3,
                                              style: shortsStyle,
                                            ),
                                          ),
                                          const SizedBox(height: 10),
                                          Text("${controller.channelVideos[1]![index].views.toString()} Views", style: shortsStyle),
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
