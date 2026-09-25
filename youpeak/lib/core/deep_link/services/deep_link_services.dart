import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/deep_link/config/easy_deep_links.dart';
import 'package:youpeak/features/video/view/normal_video_details_view.dart';
import 'package:youpeak/features/video/view/shorts_video_details_view.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/utils/utils.dart';

class DeepLinkServices {
  static const String videoKey = "video";
  static const String postKey = "post";
  static const String profileKey = "profile";
  static const String referralKey = "referral";
  static const String pageRoutesKey = "pageRoutes";
  static const String idKey = "id";
  static const String sellerNameKey = "sellerName";
  static const String videoUrlKey = "videoUrl";
  static const String referralCodeKey = "referralCode";
  static const String channelIdKey = "channelId";

  static String eventId = "";
  static String eventType = "";
  static String referralCode = "";
  static String sellerName = "";
  static String videoUrl = "";
  static String id = "";

  static bool isNavigationComplete = false;

  // Call In Main...
  static Future<void> onInitDeepLinks() async {
    try {
      EasyDeepLinks.linkStream.listen((linkInfo) {
        Utils.showLog("✅ DEEP LINK LISTEN => ${linkInfo.queryParams[pageRoutesKey]} => isInitialLink => ${linkInfo.isInitialLink}");

        isNavigationComplete = false;

        eventId = linkInfo.queryParams[idKey] ?? "";
        eventType = linkInfo.queryParams[pageRoutesKey] ?? "";
        referralCode = linkInfo.queryParams[referralCodeKey] ?? "";
        sellerName = linkInfo.queryParams[sellerNameKey] ?? "";
        videoUrl = linkInfo.queryParams[videoUrlKey] ?? "";
        id = linkInfo.queryParams[idKey] ?? "";

        // Only trigger foreground navigation if it's NOT the initial link and not on splash screen
        // Initial links are handled by MainHomePageView after app is fully loaded to avoid contextless navigation crash.
        if (!linkInfo.isInitialLink && Get.currentRoute != "/SplashScreenView") {
          onChangeRoutes(isBottomBarRoutes: false);
        }
      });

      // domain must be a bare host: incoming links are matched against
      // uri.host and outgoing ones built with Uri.https(domain, ...). This
      // used to pass Constant.domain ("https://…"), so every incoming link
      // was ignored and generating a share link threw a FormatException.
      await EasyDeepLinks.initialize(
          EasyDeepLinkConfig(domain: Constant.appDomain, customScheme: Constant.appUrlScheme, debug: kDebugMode));

      Utils.showLog("✅ DEEP LINK INITIALIZE SUCCESS");
    } catch (e) {
      Utils.showLog("❌ DEEP LINK INITIALIZE FAILED => $e");
    }
  }

  static String onGenerateLink({String? id, String? pageRoutes, String? referralCode, String? sellerName, String? channelId, String? videoUrl}) {
    final link = EasyDeepLinks.generateLink("/share", {
      pageRoutesKey: pageRoutes ?? "",
      idKey: id ?? "",
      referralCodeKey: referralCode ?? "",
      sellerNameKey: sellerName ?? "",
      videoUrlKey: videoUrl ?? "",
      channelIdKey: channelId ?? "",
    });

    return link;
  }

  static Future<void> onChangeRoutes({required bool isBottomBarRoutes}) async {
    Utils.showLog(
        "Deep Link => EventType => $eventType => EventId => $eventId => IsBottomBar => $isBottomBarRoutes => CurrentRoute => ${Get.currentRoute}");

    if (eventType.isEmpty || eventId.isEmpty) return;

    isBottomBarRoutes ? await 500.milliseconds.delay() : await 0.milliseconds.delay();

    if (Get.currentRoute == "/SplashScreenView" || Get.currentRoute == "" || Get.currentRoute == "/") {
      Utils.showLog("Deep Link => App not ready (Route: ${Get.currentRoute}), skipping immediate navigation.");
      return;
    }

    if (Get.key.currentState == null) {
      Utils.showLog("Deep Link => Navigator not ready yet, skipping.");
      return;
    }

    if (!isNavigationComplete) {
      Utils.showLog(
          "Deep Link Navigation => EventType => $eventType => EventId => $eventId => IsBottomBar => $isBottomBarRoutes sellerName => $sellerName");

      isNavigationComplete = true;

      if (eventType == "ShortsVideo") {
        // await Future.delayed(Duration(milliseconds: 800));
        // bottomBarController.onChangeBottomBar(1);

        Get.to(() => ShortsVideoDetailsView(videoId: id, videoUrl: videoUrl));
      } else if (eventType == "NormalVideo") {
        await 300.milliseconds.delay();
        // productId = eventId;
        Get.to(NormalVideoDetailsView(videoId: id, videoUrl: videoUrl));
      }

      // Clear after navigation
      eventType = "";
      eventId = "";
    }
  }
}
