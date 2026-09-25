import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:youpeak/core/ads/google_ad_helper.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class LoadMultipleAds {
  bool isLoaded = false;
  static bool isShowAd = AppSettings.isShowAds;
  static List<NativeAd> shortsAds = [];

  static Future<void> init() async {
    if (isShowAd) {
      if (shortsAds.length < 10) {
        final totalLoad = 10 - shortsAds.length;
        debugPrint("Ads Length => ${shortsAds.length} Next Loading => $totalLoad");

        for (int i = 0; i < totalLoad; i++) {
          debugPrint("Ads Index => $i");
          NativeAd? nativeAd = await loadAd();

          if (nativeAd != null) {
            shortsAds.add(nativeAd);
          } else {
            debugPrint("Ads Loading Failed => $i");
          }
        }
      }
      debugPrint("Ads Loaded Length=> ${shortsAds.length}");
    }
  }

  static Widget showAd() {
    Widget? widget;
    if (shortsAds.isNotEmpty) {
      widget = Container(
        width: Get.width,
        height: Get.height,
        margin: const EdgeInsets.only(bottom: 10, left: 5, right: 5),
        color: Colors.transparent,
        child: AdWidget(ad: shortsAds.removeAt(0)),
      );

      debugPrint("Remove After Loaded Google Large Native Ads => ${shortsAds.length}");

      init();
    }
    return widget ??
        Container(
          height: Get.height,
          width: Get.width,
          color: AppColor.grey_50,
          padding: const EdgeInsets.all(20),
          child: Center(child: Image.asset(AppIcons.adsImage)),
        );
  }

  static Future<NativeAd?> loadAd() async {
    bool isLoaded = false;

    NativeAd ads = NativeAd(
      adUnitId: GoogleAdHelper.nativeAdUnitId,
      factoryId: 'full',
      request: const AdRequest(),
      listener: NativeAdListener(
        onAdLoaded: (Ad ad) async {
          isLoaded = true;
          debugPrint("Google Full Native Ads Loaded Success");
        },
        onAdWillDismissScreen: (ad) {
          debugPrint("Google Full Native Ads Dismiss");
        },
        onAdFailedToLoad: (Ad ad, LoadAdError error) {
          debugPrint("Google Full Native Ads Loading Failed");
          ad.dispose();
        },
      ),
    );
    await ads.load();
    await 2.seconds.delay();
    return isLoaded ? ads : null;
  }
}
