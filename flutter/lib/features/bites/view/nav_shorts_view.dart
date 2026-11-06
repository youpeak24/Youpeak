import 'package:youpeak/core/platform/wheel_page_turner.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/platform/app_layout.dart';
import 'package:youpeak/features/bites/view/bites_desktop.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/ads/google_ad_helper.dart';
import 'package:youpeak/core/ads/google_full_native_ad.dart';
import 'package:youpeak/shared/widgets/data_not_found_ui.dart';
import 'package:youpeak/shared/shimmer/shorts_video_shimmer_ui.dart';
import 'package:youpeak/features/bites/controller/nav_shorts_controller.dart';
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/utils/utils.dart';
import 'package:preload_page_view/preload_page_view.dart';

class NavShortsView extends StatefulWidget {
  const NavShortsView({super.key});

  @override
  State<NavShortsView> createState() => _NavShortsViewState();
}

class _NavShortsViewState extends State<NavShortsView> {
  final controller = Get.put(NavShortsController());

  // Own controller: without one every PreloadPageView shares the package's
  // global default controller. Also lets the mouse wheel / arrow keys turn
  // pages in the browser.
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
    Utils.showLog("GoogleAdHelper.nativeVideoAdUnitId ::  ${GoogleAdHelper.nativeVideoAdUnitId}");
    controller.init();
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) async {
        AppSettings.navigationIndex.value = 0;
        AppSettings.showLog("Will Pop Scope Called...back");
      },
      child: Scaffold(
        body: Obx(
          () => controller.isApiLoading.value
              ? (AppLayout.isWideWeb ? const BitesDesktopLoading() : const ShortVideoShimmerUi())
              : controller.mainShortsVideos.isNotEmpty
                  ? RefreshIndicator(
                      color: AppColor.primaryColor,
                      onRefresh: () async {
                        controller.init();
                      },
                      child: PageKeyTurner(
                        onNext: _nextPage,
                        onPrevious: _previousPage,
                        child: PreloadPageView.builder(
                          controller: _pageController,
                          physics: TurnAwareScrollPhysics(isTurning: () => _turnGuard.isTurning),
                          itemCount: controller.mainShortsVideos.length,
                          preloadPagesCount: 1,
                          scrollDirection: Axis.vertical,
                          onPageChanged: (value) async {
                            controller.onPagination(value);
                            controller.currentPageIndex.value = value;
                          },
                          itemBuilder: (context, index) {
                            return WheelPageTurner(
                              onNext: _nextPage,
                              onPrevious: _previousPage,
                              child: Obx(
                                () => controller.mainShortsVideos[index] == null
                                    ? const GoogleFullNativeAd()
                                    : NavShortsDetailView(
                                        index: index,
                                        currentPageIndex: controller.currentPageIndex.value,
                                      ),
                              ),
                            );
                          },
                        ),
                      ),
                    )
                  : controller.loadFailed.value
                      ? _BitesLoadError(onRetry: controller.init)
                      : DataNotFoundUi(type: EmptyStateType.videos, title: AppStrings.shortsNotAvailable),
        ),
      ),
    );
  }
}

// Bites couldn't be loaded (network/server error), as opposed to there being
// none yet.
class _BitesLoadError extends StatelessWidget {
  const _BitesLoadError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded, size: 48, color: AppColor.grey),
            const SizedBox(height: 14),
            Text(AppStrings.bitesLoadFailed.tr, textAlign: TextAlign.center, style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w600, height: 1.4)),
            const SizedBox(height: 18),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: AppColor.primaryColor),
              onPressed: onRetry,
              child: Text(AppStrings.retry.tr, style: GoogleFonts.urbanist(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
