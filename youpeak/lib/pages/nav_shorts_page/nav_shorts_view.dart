import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/ads/google_ads/google_ad_helper.dart';
import 'package:youpeak/ads/google_ads/google_full_native_ad.dart';
import 'package:youpeak/custom/custom_ui/data_not_found_ui.dart';
import 'package:youpeak/custom/shimmer/shorts_video_shimmer_ui.dart';
import 'package:youpeak/pages/nav_shorts_page/nav_shorts_controller.dart';
import 'package:youpeak/pages/nav_shorts_page/nav_shorts_details_view.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/settings/app_settings.dart';
import 'package:youpeak/utils/string/app_string.dart';
import 'package:youpeak/utils/utils.dart';
import 'package:preload_page_view/preload_page_view.dart';

class NavShortsView extends StatefulWidget {
  const NavShortsView({super.key});

  @override
  State<NavShortsView> createState() => _NavShortsViewState();
}

class _NavShortsViewState extends State<NavShortsView> {
  final controller = Get.put(NavShortsController());

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
              ? const ShortVideoShimmerUi()
              : controller.mainShortsVideos.isNotEmpty
                  ? RefreshIndicator(
                      color: AppColor.primaryColor,
                      onRefresh: () async {
                        controller.init();
                      },
                      child: PreloadPageView.builder(
                        itemCount: controller.mainShortsVideos.length,
                        preloadPagesCount: 1,
                        scrollDirection: Axis.vertical,
                        onPageChanged: (value) async {
                          controller.onPagination(value);
                          controller.currentPageIndex.value = value;
                        },
                        itemBuilder: (context, index) {
                          return Obx(
                            () => controller.mainShortsVideos[index] == null
                                ? const GoogleFullNativeAd()
                                : NavShortsDetailView(
                                    index: index,
                                    currentPageIndex: controller.currentPageIndex.value,
                                  ),
                          );
                        },
                      ),
                    )
                  : DataNotFoundUi(type: EmptyStateType.videos, title: AppStrings.shortsNotAvailable),
        ),
      ),
    );
  }
}
