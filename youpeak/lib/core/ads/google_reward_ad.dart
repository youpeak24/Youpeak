import 'package:flutter/material.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:youpeak/core/ads/google_ad_helper.dart';

class GoogleRewardAd {
  static bool _isLoaded = false; // This Variable Use to Check Ads Is Loaded or Not
  static Callback function = () {}; // This Function Use to Navigation...

  static RewardedAd? rewardedAd;

  static void loadAd() {
    debugPrint("Google Rewarded Ads Loading...");
    _isLoaded = false;

    RewardedAd.load(
      adUnitId: GoogleAdHelper.rewardedAd,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _isLoaded = true;
          ad.fullScreenContentCallback = FullScreenContentCallback(onAdShowedFullScreenContent: (ad) {
            debugPrint("Rewarded Ad Showed");
          }, onAdImpression: (ad) {
            debugPrint("Rewarded Ad Impression");
          }, onAdFailedToShowFullScreenContent: (ad, error) {
            debugPrint("Rewarded Ad Loading Failed =>$error");
            ad.dispose();
          }, onAdDismissedFullScreenContent: (ad) {
            loadAd();
            function.call();
            debugPrint("Rewarded Ad Closed");
            ad.dispose();
          }, onAdClicked: (ad) {
            debugPrint("Rewarded Ad On Clicked");
          });
          debugPrint("Rewarded Ad Loaded Success");
          rewardedAd = ad;
        },
        onAdFailedToLoad: (LoadAdError error) {
          debugPrint('Rewarded Ad Loading Failed => $error');
        },
      ),
    );
  }

  static showAd({required Callback fun}) {
    function = fun;
    if (_isLoaded) {
      debugPrint("Rewarded Ad Show Success");
      rewardedAd?.show(onUserEarnedReward: (ad, reward) {});
    } else {
      debugPrint("Rewarded Ad Not Show !!");
    }
    loadAd();
  }
}
