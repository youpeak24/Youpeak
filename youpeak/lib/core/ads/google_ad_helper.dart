import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/core/platform/platform_info.dart';

class GoogleAdHelper {
  static String get nativeAdUnitId {
    if (PlatformInfo.isAndroid) {
      return AdminSettingsApi.adminSettingsModel?.setting?.android?.google?.native ?? "";
    } else if (PlatformInfo.isIOS) {
      return AdminSettingsApi.adminSettingsModel?.setting?.ios?.google?.native ?? "";
    } else {
      throw UnsupportedError("Unsupported platform");
    }
  }

  static String get nativeVideoAdUnitId {
    if (PlatformInfo.isAndroid) {
      return AdminSettingsApi.adminSettingsModel?.setting?.android?.google?.nativeAdVideo ?? "";
    } else if (PlatformInfo.isIOS) {
      return AdminSettingsApi.adminSettingsModel?.setting?.ios?.google?.nativeAdVideo ?? "";
    } else {
      throw UnsupportedError("Unsupported platform");
    }
  }

  static String get interstitialAdUnitId {
    if (PlatformInfo.isAndroid) {
      return AdminSettingsApi.adminSettingsModel?.setting?.android?.google?.interstitial ?? "";
    } else if (PlatformInfo.isIOS) {
      return AdminSettingsApi.adminSettingsModel?.setting?.ios?.google?.interstitial ?? "";
    } else {
      throw UnsupportedError("Unsupported platform");
    }
  }

  static String get rewardedAd => PlatformInfo.isAndroid
      ? (AdminSettingsApi.adminSettingsModel?.setting?.android?.google?.reward ?? "")
      : PlatformInfo.isIOS
          ? (AdminSettingsApi.adminSettingsModel?.setting?.ios?.google?.reward ?? "")
          : "Platform Not Support !!";

  // static String get googleVideoAd => PlatformInfo.isAndroid
  //     ? ("https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=")
  //     : PlatformInfo.isIOS
  //         ? ("https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=")
  //         : "Platform Not Support !!";

  static String get googleVideoAd => PlatformInfo.isAndroid
      ? (AdminSettingsApi.adminSettingsModel?.setting?.android?.google?.videoAdUrl ?? "")
      : PlatformInfo.isIOS
          ? (AdminSettingsApi.adminSettingsModel?.setting?.android?.google?.videoAdUrl ?? "")
          : "Platform Not Support !!";
}
