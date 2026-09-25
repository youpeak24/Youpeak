import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:youpeak/core/settings/app_settings.dart';

import 'package:youpeak/core/ads/google_ad_helper.dart';

class GoogleLargeNativeAd extends StatefulWidget {
  const GoogleLargeNativeAd({super.key});

  @override
  State<GoogleLargeNativeAd> createState() => _GoogleLargeNativeAdState();
}

class _GoogleLargeNativeAdState extends State<GoogleLargeNativeAd> {
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
    debugPrint("Google Large Native Ads Loading...");
    nativeAd = NativeAd(
      adUnitId: GoogleAdHelper.nativeAdUnitId,
      factoryId: 'large',
      request: const AdRequest(),
      listener: NativeAdListener(
        onAdLoaded: (Ad ad) {
          nativeAd = ad as NativeAd;
          isLoading.value = "success";
          debugPrint("Google Large Native Ads Loaded Success");
        },
        onAdWillDismissScreen: (ad) {
          debugPrint("Google Large Native Ads Dismiss");
        },
        onAdFailedToLoad: (Ad ad, LoadAdError error) {
          debugPrint("Google Large Native Ads Loading Failed");
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
                ? const Offstage()
                : (isLoading.value == "success")
                    ? Container(
                        width: MediaQuery.of(context).size.width,
                        height: 280,
                        color: Colors.transparent,
                        margin: const EdgeInsets.only(bottom: 15, left: 10, right: 10),
                        child: AdWidget(ad: nativeAd!),
                      )
                    : const Offstage(),
          )
        : const Offstage();
  }
}
