import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/ads/google_full_native_ad.dart';
import 'package:youpeak/shared/shimmer/shorts_video_shimmer_ui.dart';
import 'package:youpeak/features/bites/model/get_shorts_video_model.dart';
import 'package:youpeak/features/bites/controller/preview_shorts_controller.dart';
import 'package:youpeak/features/bites/view/preview_shorts_video.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:preload_page_view/preload_page_view.dart';
import 'package:youpeak/core/platform/wheel_page_turner.dart';

class PreviewShortsView extends StatefulWidget {
  const PreviewShortsView({super.key, required this.firstVideoData});

  final Shorts firstVideoData;

  @override
  State<PreviewShortsView> createState() => _PreviewShortsViewState();
}

class _PreviewShortsViewState extends State<PreviewShortsView> {
  final controller = Get.put(PreviewShortsController());

  // Own controller (see NavShortsView); also drives wheel / arrow-key paging
  // in the browser.
  final _pageController = PreloadPageController();

  // Keeps the rest of a trackpad swipe from cancelling the turn it started.
  final _turnGuard = PageTurnGuard();

  void _nextPage() => _turnGuard.run(() => _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeOut));

  void _previousPage() => _turnGuard.run(() => _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeOut));

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

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
              ? PageKeyTurner(
                  onNext: _nextPage,
                  onPrevious: _previousPage,
                  child: PreloadPageView.builder(
                    controller: _pageController,
                    physics: TurnAwareScrollPhysics(isTurning: () => _turnGuard.isTurning),
                    itemCount: controller.mainShortsVideos.length,
                    preloadPagesCount: 1,
                    scrollDirection: Axis.vertical,
                    onPageChanged: (value) async {
                      controller.onPagination(value: value, firstVideo: widget.firstVideoData);
                      controller.currentPageIndex.value = value;
                    },
                    itemBuilder: (context, index) {
                      return WheelPageTurner(
                        onNext: _nextPage,
                        onPrevious: _previousPage,
                        child: Obx(
                          () => controller.mainShortsVideos[index] == null
                              ? const GoogleFullNativeAd()
                              : PreviewShortsVideo(
                                  index: index,
                                  currentPageIndex: controller.currentPageIndex.value,
                                ),
                        ),
                      );
                    },
                  ),
                )
              : const ShortVideoShimmerUi(),
        ),
      ),
    );
  }
}
