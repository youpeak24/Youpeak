import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/ads/google_large_native_ad.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/shared/widgets/normal_video_ui.dart';
import 'package:youpeak/shared/widgets/short_video_ui.dart';
import 'package:youpeak/shared/shimmer/normal_video_shimmer_ui.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/channel/controller/your_channel_controller.dart';
import 'package:youpeak/features/video/view/normal_video_details_view.dart';
import 'package:youpeak/features/video/view/shorts_video_details_view.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class ChannelHomeTabView extends StatelessWidget {
  const ChannelHomeTabView({super.key});

  @override
  Widget build(BuildContext context) {
    return GetBuilder<YourChannelController>(
      id: "onGetChannelHomeVideo",
      builder: (controller) {
        return controller.channelHomeVideos == null
            ? const SingleChildScrollView(child: NormalVideoShimmerUi())
            : controller.channelHomeVideos!.isEmpty
                ? const DataNotFoundUi(type: EmptyStateType.videos)
                // : NotificationListener<ScrollNotification>(
                //     onNotification: (notification) {
                //       if (notification is UserScrollNotification) {
                //         if (notification.direction == ScrollDirection.forward) {
                //           controller.mainScrollController.animateTo(0, duration: const Duration(milliseconds: 500), curve: Curves.linear);
                //         } else if (notification.direction == ScrollDirection.reverse) {
                //           controller.mainScrollController.animateTo(250, duration: const Duration(milliseconds: 500), curve: Curves.linear);
                //         }
                //       }
                //       return true;
                //     },
                //     child:
                : SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    child: (controller.channelHomeVideos!.where((element) => element.videoType == 1).isEmpty)
                        ? SizedBox(
                            height: 280,
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: ListView.builder(
                                itemCount: controller.channelHomeVideos?.length ?? 0,
                                scrollDirection: Axis.horizontal,
                                shrinkWrap: true,
                                physics: const BouncingScrollPhysics(),
                                padding: const EdgeInsets.only(left: 10, bottom: 10),
                                itemBuilder: (BuildContext context, int index) {
                                  final indexData = controller.channelHomeVideos![index];
                                  return Visibility(
                                    visible: controller.channelHomeVideos?[index].videoType == 2,
                                    child: Database.channelId != indexData.channelId &&
                                            ((indexData.videoPrivacyType == 2 && indexData.channelType == 1) ||
                                                (indexData.videoPrivacyType == 2 && indexData.channelType == 2 && indexData.isSubscribed == false))
                                        ? ShortsPrivateContentWidget(
                                            id: indexData.id ?? "",
                                            image: indexData.videoImage ?? "",
                                            subscribe: () => controller.onSubscribePrivateChannel(tabType: 0, index: index, context: context),
                                            unlock: () => controller.onUnlockPrivateVideo(tabType: 0, index: index, context: context),
                                            subscribeCoin: indexData.subscriptionCost ?? 0,
                                            unlockCoin: indexData.videoUnlockCost ?? 0,
                                            title: indexData.title ?? "",
                                            views: indexData.views ?? 0,
                                            channelType: indexData.channelType ?? 1,
                                          )
                                        : GestureDetector(
                                            onTap: () => Get.to(
                                              ShortsVideoDetailsView(
                                                videoId: controller.channelHomeVideos![index].id!,
                                                videoUrl: controller.channelHomeVideos![index].videoUrl!,
                                              ),
                                            ),
                                            child: ShortVideoUi(
                                              videoId: controller.channelHomeVideos![index].id!,
                                              title: controller.channelHomeVideos![index].title!,
                                              videoImage: controller.channelHomeVideos![index].videoImage!,
                                              videoUrl: controller.channelHomeVideos![index].videoUrl!,
                                              views: controller.channelHomeVideos![index].views!,
                                              channelId: controller.channelHomeVideos![index].channelId!,
                                              videoTime: controller.channelHomeVideos![index].videoTime!,
                                              channelName: controller.channelHomeModel!.channelName!,
                                              isSave: controller.channelHomeVideos![index].isSaveToWatchLater!,
                                            ),
                                          ),
                                  );
                                },
                              ),
                            ),
                          )
                        : ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: controller.channelHomeVideos?.length ?? 0,
                            padding: EdgeInsets.zero,
                            itemBuilder: (context, index) {
                              final indexData = controller.channelHomeVideos![index];
                              return controller.channelHomeVideos![index].videoType == 1
                                  ? Column(
                                      children: [
                                        Database.channelId != indexData.channelId &&
                                                ((indexData.videoPrivacyType == 2 && indexData.channelType == 1) ||
                                                    (indexData.videoPrivacyType == 2 &&
                                                        indexData.channelType == 2 &&
                                                        indexData.isSubscribed == false))
                                            ? PrivateContentNormalVideoUi(
                                                videoId: indexData?.id ?? "",
                                                title: indexData?.title ?? "",
                                                videoImage: indexData?.videoImage ?? "",
                                                videoUrl: indexData?.videoUrl ?? "",
                                                videoTime: indexData?.videoTime ?? 0,
                                                channelId: indexData?.channelId ?? "",
                                                channelImage: controller.channelHomeModel?.channelImage ?? "",
                                                channelName: controller.channelHomeModel?.channelName ?? "",
                                                views: indexData?.views ?? 0,
                                                uploadTime: indexData?.time ?? "",
                                                isSave: indexData?.isSaveToWatchLater ?? false,
                                                subscribeCallback: () =>
                                                    controller.onSubscribePrivateChannel(tabType: 0, index: index, context: context),
                                                videoCallback: () => controller.onUnlockPrivateVideo(tabType: 0, index: index, context: context),
                                                videoCost: indexData?.videoUnlockCost ?? 0,
                                                subscribeCost: indexData?.subscriptionCost ?? 0,
                                                channelType: indexData?.channelType ?? 1,
                                              )
                                            : GestureDetector(
                                                onTap: () => Get.to(
                                                  NormalVideoDetailsView(
                                                    videoId: controller.channelHomeVideos![index].id!,
                                                    videoUrl: controller.channelHomeVideos![index].videoUrl!,
                                                  ),
                                                ),
                                                child: NormalVideoUi(
                                                  videoId: controller.channelHomeVideos![index].id ?? "",
                                                  title: controller.channelHomeVideos![index].title ?? "",
                                                  videoImage: controller.channelHomeVideos![index].videoImage ?? "",
                                                  videoUrl: controller.channelHomeVideos![index].videoUrl ?? "",
                                                  videoTime: controller.channelHomeVideos![index].videoTime ?? 0,
                                                  channelId: controller.channelHomeVideos![index].channelId ?? "",
                                                  channelImage: controller.channelHomeModel!.channelImage ?? "",
                                                  channelName: controller.channelHomeModel!.channelName ?? "",
                                                  views: controller.channelHomeVideos![index].views ?? 0,
                                                  uploadTime: controller.channelHomeVideos![index].time ?? "",
                                                  isSave: controller.channelHomeVideos![index].isSaveToWatchLater ?? false,
                                                ),
                                              ),
                                        index != 0 && index % AppSettings.showAdsIndex == 0 ? const GoogleLargeNativeAd() : const Offstage(),
                                      ],
                                    )
                                  : const Offstage();
                            },
                            separatorBuilder: (context, index) {
                              return (controller.channelHomeVideos!.where((element) => element.videoType == 2).isNotEmpty) && index == 0
                                  ? SizedBox(
                                      height: 280,
                                      child: SingleChildScrollView(
                                        scrollDirection: Axis.horizontal,
                                        child: ListView.builder(
                                          itemCount: controller.channelHomeVideos?.length ?? 0,
                                          scrollDirection: Axis.horizontal,
                                          shrinkWrap: true,
                                          physics: const BouncingScrollPhysics(),
                                          padding: const EdgeInsets.only(left: 10, bottom: 10),
                                          itemBuilder: (BuildContext context, int index) {
                                            final indexData = controller.channelHomeVideos![index];
                                            return Visibility(
                                              visible: controller.channelHomeVideos?[index].videoType == 2,
                                              child: Database.channelId != indexData.channelId &&
                                                      ((indexData.videoPrivacyType == 2 && indexData.channelType == 1) ||
                                                          (indexData.videoPrivacyType == 2 &&
                                                              indexData.channelType == 2 &&
                                                              indexData.isSubscribed == false))
                                                  ? ShortsPrivateContentWidget(
                                                      id: indexData.id ?? "",
                                                      image: indexData.videoImage ?? "",
                                                      subscribe: () =>
                                                          controller.onSubscribePrivateChannel(tabType: 0, index: index, context: context),
                                                      unlock: () => controller.onUnlockPrivateVideo(tabType: 0, index: index, context: context),
                                                      subscribeCoin: indexData.subscriptionCost ?? 0,
                                                      unlockCoin: indexData.videoUnlockCost ?? 0,
                                                      title: indexData.title ?? "",
                                                      views: indexData.views ?? 0,
                                                      channelType: indexData.channelType ?? 1,
                                                    )
                                                  : GestureDetector(
                                                      onTap: () => Get.to(
                                                        ShortsVideoDetailsView(
                                                          videoId: controller.channelHomeVideos![index].id!,
                                                          videoUrl: controller.channelHomeVideos![index].videoUrl!,
                                                        ),
                                                      ),
                                                      child: ShortVideoUi(
                                                        videoId: controller.channelHomeVideos![index].id!,
                                                        title: controller.channelHomeVideos![index].title!,
                                                        videoImage: controller.channelHomeVideos![index].videoImage!,
                                                        videoUrl: controller.channelHomeVideos![index].videoUrl!,
                                                        views: controller.channelHomeVideos![index].views!,
                                                        channelId: controller.channelHomeVideos![index].channelId!,
                                                        videoTime: controller.channelHomeVideos![index].videoTime!,
                                                        channelName: controller.channelHomeModel!.channelName!,
                                                        isSave: controller.channelHomeVideos![index].isSaveToWatchLater!,
                                                      ),
                                                    ),
                                            );
                                          },
                                        ),
                                      ),
                                    )
                                  : const Offstage();
                            },
                          ),
                  );
      },
    );
  }
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           GestureDetector(
//             onTap: () {
//               Get.to(
//                 ShortsVideoDetailsView(
//                   videoId: controller.channelHomeVideos![index].id!,
//                   videoUrl: controller.channelHomeVideos![index].videoUrl!,
//                 ),
//               );
//             },
//             child: Container(
//               height: Get.height / 4,
//               width: AppLayout.width,
//               margin: const EdgeInsets.symmetric(horizontal: 10),
//               clipBehavior: Clip.antiAlias,
//               decoration: BoxDecoration(
//                 color: isDarkMode.value ? AppColors.secondDarkMode : AppColors.grey_400,
//                 borderRadius: BorderRadius.circular(20),
//               ),
//               child: Stack(
//                 children: [
//                   PreviewVideoImage(
//                     videoId: controller.channelHomeVideos![index].id!,
//                     videoImage: controller.channelHomeVideos![index].videoImage!,
//                   ),
//                   // ConvertedPathView(
//                   //     imageVideoPath:
//                   //         controller.channelHomeVideos![index].videoImage.toString()),
//                   Positioned(
//                     right: 20,
//                     bottom: 15,
//                     child: Container(
//                       padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
//                       decoration: BoxDecoration(
//                           borderRadius: BorderRadius.circular(10), color: AppColors.black),
//                       child: Text(
//                         CustomFormatTime.convert(
//                             controller.channelHomeVideos![index].videoTime!),
//                         style: GoogleFonts.urbanist(color: AppColors.white, fontSize: 11),
//                       ),
//                     ),
//                   ),
//                 ],
//               ),
//             ),
//           ),
//           const SizedBox(height: 10),
//           Row(
//             crossAxisAlignment: CrossAxisAlignment.start,
//             children: [
//               const SizedBox(width: 10),
//               Container(
//                   clipBehavior: Clip.hardEdge,
//                   height: 35,
//                   width: 35,
//                   decoration: const BoxDecoration(shape: BoxShape.circle),
//                   child: PreviewChannelImage(
//                     channelId: controller.channelId,
//                     channelImage: controller.channelHomeModel!.channelImage!,
//                   )
//
//                   // ConvertedPathView(
//                   //    imageVideoPath: controller.channelHomeModel!.channelImage!)
//
//                   ),
//               const SizedBox(width: 10),
//               Expanded(
//                 child: Column(
//                   crossAxisAlignment: CrossAxisAlignment.start,
//                   children: [
//                     Text(
//                       controller.channelHomeVideos![index].title.toString(),
//                       style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
//                       maxLines: 2,
//                       overflow: TextOverflow.ellipsis,
//                     ),
//                     Text(
//                       "${controller.channelHomeModel!.channelName} - ${controller.channelHomeVideos![index].views} Views - ${controller.channelHomeVideos![index].time}",
//                       style: GoogleFonts.urbanist(fontSize: 12, color: AppColors.grey),
//                     ),
//                   ],
//                 ),
//               ),
//               const SizedBox(width: 5),
//               GestureDetector(
//                   onTap: () => MoreInfoBottomSheet.show(
//                         MoreInformationModel(
//                           videoId: controller.channelHomeVideos![index].id!,
//                           title: controller.channelHomeVideos![index].title!,
//                           videoType: controller.channelHomeVideos![index].videoType!,
//                           videoTime: controller.channelHomeVideos![index].videoTime!,
//                           videoUrl: controller.channelHomeVideos![index].videoUrl!,
//                           channelId: controller.channelHomeVideos![index].channelId!,
//                           channelName: controller.channelHomeModel!.channelName!,
//                           views: controller.channelHomeVideos![index].views!,
//                         ),
//                         true,
//                       ),
//                   child: const Icon(Icons.more_vert)),
//               const SizedBox(width: 10),
//             ],
//           ),
//           const SizedBox(height: 10),
//         ],
//       )

// &&
//     ((controller.channelHomeVideos!.where((element) => element.videoType == 1).isNotEmpty)
//         ? shortIndex != 0 && shortIndex % 3 == 0
//         : true)
// ? SizedBox(
//     height: 250,
//     child: ListView.builder(
//       itemCount: controller.channelHomeVideos?.length,
//       scrollDirection: Axis.horizontal,
//       padding: const EdgeInsets.only(left: 10, bottom: 10),
//       itemBuilder: (BuildContext context, int index) {
//         // final randomIndex =
//         //     Random().nextInt(controller.channelHomeVideos.length);
//         return controller.channelHomeVideos![index].videoType != 2
//             ? const Offstage()
//             : GestureDetector(
//                 // onTap: () => Get.to(() => NormalVideoDetailsView()),
//                 child: Container(
//                   alignment: Alignment.center,
//                   margin: const EdgeInsets.only(right: 10),
//                   height: 250,
//                   width: 165,
//                   decoration: BoxDecoration(
//                       color: AppColors.grey_400, borderRadius: BorderRadius.circular(20)),
//                   child: Stack(
//                     children: [
//                       ConvertedPathView(
//                           imageVideoPath:
//                               controller.channelHomeVideos![index].videoImage.toString()),
//                       const Positioned(
//                           top: 10,
//                           right: 10,
//                           child: Icon(Icons.more_vert, color: AppColors.white)),
//                       Positioned(
//                         bottom: 0,
//                         left: 10,
//                         child: Column(
//                           crossAxisAlignment: CrossAxisAlignment.start,
//                           children: [
//                             SizedBox(
//                               width: 145,
//                               child: Text(
//                                   controller.channelHomeVideos![index].title.toString(),
//                                   maxLines: 3,
//                                   style: shortsStyle),
//                             ),
//                             const SizedBox(height: 10),
//                             Text(
//                                 "${controller.channelHomeVideos![index].views.toString()} Views",
//                                 style: shortsStyle),
//                             const SizedBox(height: 10),
//                           ],
//                         ),
//                       )
//                     ],
//                   ),
//                 ),
//               );
//       },
//     ),
//   )

// : Column(
//     crossAxisAlignment: CrossAxisAlignment.start,
//     children: [
//       GestureDetector(
//         onTap: () {
//           Get.to(
//             NormalVideoDetailsView(
//               videoId: controller.channelHomeVideos![index].id!,
//               videoUrl: controller.channelHomeVideos![index].videoUrl!,
//             ),
//           );
//         },
//         child: Container(
//           height: (Get.height / 4 > 200) ? Get.height / 4 : 200,
//           width: AppLayout.width,
//           clipBehavior: Clip.antiAlias,
//           margin: const EdgeInsets.symmetric(horizontal: 10),
//           decoration: BoxDecoration(
//             color: isDarkMode.value ? AppColors.secondDarkMode : AppColors.grey_400,
//             borderRadius: BorderRadius.circular(20),
//           ),
//           child: Stack(
//             children: [
//               PreviewVideoImage(
//                 videoId: controller.channelHomeVideos![index].id!,
//                 videoImage: controller.channelHomeVideos![index].videoImage!,
//               ),
//               // ConvertedPathView(
//               //     imageVideoPath:
//               //         controller.channelHomeVideos![index].videoImage.toString()),
//               Positioned(
//                 right: 20,
//                 bottom: 15,
//                 child: Container(
//                   padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
//                   decoration: BoxDecoration(borderRadius: BorderRadius.circular(10), color: AppColors.black),
//                   child: Text(
//                     CustomFormatTime.convert(controller.channelHomeVideos![index].videoTime!),
//                     style: GoogleFonts.urbanist(color: AppColors.white, fontSize: 11),
//                   ),
//                 ),
//               ),
//             ],
//           ),
//         ),
//       ),
//       const SizedBox(height: 10),
//       Row(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           const SizedBox(width: 10),
//           GestureDetector(
//             // onTap: () => Get.to(() => const ChannelDetailsScreen()),
//             child: Container(
//                 clipBehavior: Clip.hardEdge,
//                 height: 35,
//                 width: 35,
//                 decoration: const BoxDecoration(shape: BoxShape.circle),
//                 child: PreviewChannelImage(
//                   channelId: controller.channelId,
//                   channelImage: controller.channelHomeModel!.channelImage!,
//                 )
//                 // ConvertedChannelImageView(
//                 //     imagePath: controller.channelHomeModel!.channelImage!),
//                 ),
//           ),
//           const SizedBox(width: 10),
//           Expanded(
//             child: Column(
//               crossAxisAlignment: CrossAxisAlignment.start,
//               children: [
//                 Text(
//                   controller.channelHomeVideos![index].title.toString(),
//                   style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold),
//                   maxLines: 2,
//                   overflow: TextOverflow.ellipsis,
//                 ),
//                 Text(
//                   "${controller.channelHomeModel!.channelName} - ${controller.channelHomeVideos![index].views} Views - ${controller.channelHomeVideos![index].time}",
//                   style: GoogleFonts.urbanist(fontSize: 12, color: AppColors.grey),
//                 ),
//               ],
//             ),
//           ),
//           const SizedBox(width: 5),
//           GestureDetector(
//               onTap: () => MoreInfoBottomSheet.show(
//                     MoreInformationModel(
//                       videoId: controller.channelHomeVideos![index].id!,
//                       title: controller.channelHomeVideos![index].title!,
//                       videoType: controller.channelHomeVideos![index].videoType!,
//                       videoTime: controller.channelHomeVideos![index].videoTime!,
//                       videoUrl: controller.channelHomeVideos![index].videoUrl!,
//                       channelId: controller.channelHomeVideos![index].channelId!,
//                       channelName: controller.channelHomeModel!.channelName!,
//                       views: controller.channelHomeVideos![index].views!,
//                     ),
//                     false,
//                   ),
//               child: const Icon(Icons.more_vert)),
//           const SizedBox(width: 10),
//         ],
//       ),
//       const SizedBox(height: 10),
//     ],
//   );
