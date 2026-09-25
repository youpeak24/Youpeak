import 'package:flutter/foundation.dart';

// Platform checks that are safe on every target. dart:io's Platform.isAndroid
// / Platform.isIOS throw UnsupportedError in the browser, so all platform
// branching goes through here instead.
class PlatformInfo {
  PlatformInfo._();

  static bool get isWeb => kIsWeb;

  static bool get isAndroid => !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  static bool get isIOS => !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;

  static bool get isMobileApp => isAndroid || isIOS;

  // The web app is the Android app served in a browser: it uses the Android
  // layout metrics (no iOS home-indicator padding) and the Android-side admin
  // switches, e.g. which payment gateways are enabled.
  static bool get isAndroidOrWeb => kIsWeb || isAndroid;
}
