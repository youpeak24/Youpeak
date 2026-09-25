import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/ads/google_full_native_ad.dart';
import 'package:youpeak/shared/shimmer/shorts_video_shimmer_ui.dart';
import 'package:youpeak/features/bites/model/get_shorts_video_model.dart';
import 'package:youpeak/features/bites/controller/preview_shorts_controller.dart';
import 'package:youpeak/features/bites/view/preview_shorts_video.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:preload_page_view/preload_page_view.dart';

class PreviewShortsView extends StatefulWidget {
  const PreviewShortsView({super.key, required this.firstVideoData});

  final Shorts firstVideoData;

  @override
  State<PreviewShortsView> createState() => _PreviewShortsViewState();
}

class _PreviewShortsViewState extends State<PreviewShortsView> {
  final controller = Get.put(PreviewShortsController());

  @override
  void initState() {
    controller.init(widget.firstVideoData);
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: true,
      onPopInvoked: (didPop) async {
        AppSettings.showLog("Back To Preview Shorts Page => $didPop");
      },
      child: Scaffold(
        body: Obx(
          () => controller.mainShortsVideos.isNotEmpty
              ? PreloadPageView.builder(
                  itemCount: controller.mainShortsVideos.length,
                  preloadPagesCount: 1,
                  scrollDirection: Axis.vertical,
                  onPageChanged: (value) async {
                    controller.onPagination(
                        value: value, firstVideo: widget.firstVideoData);
                    controller.currentPageIndex.value = value;
                  },
                  itemBuilder: (context, index) {
                    return Obx(
                      () => controller.mainShortsVideos[index] == null
                          // ? LoadMultipleAds.showAd()
                          ? const GoogleFullNativeAd()
                          : PreviewShortsVideo(
                              index: index,
                              currentPageIndex:
                                  controller.currentPageIndex.value,
                            ),
                    );
                  },
                )
              : const ShortVideoShimmerUi(),
        ),
      ),
    );
  }
}
