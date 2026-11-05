import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:youpeak/core/settings/app_settings.dart';

import 'package:youpeak/core/ads/google_ad_helper.dart';

class GoogleSmallNativeAd extends StatefulWidget {
  const GoogleSmallNativeAd({super.key});

  @override
  State<GoogleSmallNativeAd> createState() => _GoogleSmallNativeAdState();
}

class _GoogleSmallNativeAdState extends State<GoogleSmallNativeAd> {
  bool get isShowAds => AppSettings.isShowAds;
  NativeAd? nativeAd;
  RxString isLoading = "loading".obs;

  @override
  void initState() {
    isShowAds ? loadAd() : null;
    super.initState();
  }

  Future<void> loadAd() {
    debugPrint("Google Small Native Ads Loading...");
    nativeAd = NativeAd(
      adUnitId: GoogleAdHelper.nativeAdUnitId,
      factoryId: 'medium',
      request: const AdRequest(),
      listener: NativeAdListener(
        onAdLoaded: (Ad ad) {
          nativeAd = ad as NativeAd;
          isLoading.value = "success";
          debugPrint("Google Small Native Ads Loaded Success");
        },
        onAdWillDismissScreen: (ad) {
          debugPrint("Google Small Native Ads Dismiss");
        },
        onAdFailedToLoad: (Ad ad, LoadAdError error) {
          debugPrint("Google Small Native Ads Loading Failed");
          isLoading.value = "failed";
          ad.dispose();
        },
      ),
    );
    return nativeAd!.load();
  }

  @override
  void dispose() {
    isShowAds ? nativeAd?.dispose() : null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return isShowAds
        ? Obx(
            () => (isLoading.value == "loading")
                ? const Offstage()
                : (isLoading.value == "success")
                    ? Container(
                        width: MediaQuery.of(context).size.width,
                        height: 110,
                        margin: const EdgeInsets.only(bottom: 10, right: 5),
                        color: Colors.transparent,
                        child: AdWidget(ad: nativeAd!),
                      )
                    : const Offstage(),
          )
        : const Offstage();
  }
}
