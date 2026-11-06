import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';

import 'package:youpeak/core/ads/google_ad_helper.dart';

class GoogleFullNativeAd extends StatefulWidget {
  const GoogleFullNativeAd({super.key});

  @override
  State<GoogleFullNativeAd> createState() => _GoogleFullNativeAdState();
}

class _GoogleFullNativeAdState extends State<GoogleFullNativeAd> {
  bool get isShowAds => AppSettings.isShowAds;
  NativeAd? nativeAd;
  RxString isLoading = "loading".obs;

  @override
  void initState() {
    isShowAds ? loadAd() : null;
    super.initState();
  }

  @override
  void dispose() {
    isShowAds ? nativeAd?.dispose() : null;
    super.dispose();
  }

  Future<void> loadAd() {
    debugPrint("Google Full Native Ads Loading...");
    nativeAd = NativeAd(
      adUnitId: GoogleAdHelper.nativeVideoAdUnitId,
      factoryId: 'full',
      request: const AdRequest(),
      listener: NativeAdListener(
        onAdLoaded: (Ad ad) {
          nativeAd = ad as NativeAd;
          isLoading.value = "success";
          debugPrint("Google Full Native Ads Loaded Success");
        },
        onAdWillDismissScreen: (ad) {
          debugPrint("Google Full Native Ads Dismiss");
        },
        onAdFailedToLoad: (Ad ad, LoadAdError error) {
          debugPrint("Google Full Native Ads Failed");
          isLoading.value = "failed";
          ad.dispose();
        },
      ),
    );
    return nativeAd!.load();
  }

  @override
  Widget build(BuildContext context) {
    return isShowAds
        ? Obx(
            () => (isLoading.value == "loading")
                ? const LoaderUi()
                : (isLoading.value == "success")
                    ? Container(
                        width: MediaQuery.of(context).size.width,
                        height: MediaQuery.of(context).size.height,
                        color: Colors.transparent,
                        child: AdWidget(ad: nativeAd!),
                      )
                    : Container(
                        height: Get.height,
                        width: AppLayout.width,
                        color: AppColor.grey_50,
                        padding: const EdgeInsets.all(20),
                        child: Center(
                          child: Image.asset(AppIcons.adsImage),
                        ),
                      ),
          )
        : const Offstage();
  }
}
