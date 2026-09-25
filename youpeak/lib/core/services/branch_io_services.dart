import 'dart:async';
import 'dart:developer';
import 'package:flutter_branch_sdk/flutter_branch_sdk.dart';
import 'package:youpeak/core/deep_link/services/deep_link_services.dart';
import 'package:get/get.dart';

class BranchIoServices {
  static BranchContentMetaData branchContentMetaData = BranchContentMetaData();
  static BranchUniversalObject? branchUniversalObject;
  static BranchLinkProperties branchLinkProperties = BranchLinkProperties();

  static String userId = "";
  static String videoId = "";
  static String channelId = "";

  static String name = "";
  static String image = "";
  static String url = "";

  static String pageRoutes = "";
  static String referralCode = "";

  // This is Use to Splash Screen...
  static void onListenBranchIoLinks() async {
    StreamController<String> streamController = StreamController<String>();
    StreamSubscription<Map>? streamSubscription = FlutterBranchSdk.listSession().listen(
      (data) {
        log('Click To Branch Io Link => $data');
        streamController.sink.add((data.toString()));

        if (data.containsKey('+clicked_branch_link') && data['+clicked_branch_link'] == true) {
          log("Click To Branch Io Link Page Routes => ${data['id']}");

          userId = data["userId"] ?? "";
          videoId = data["videoId"] ?? "";
          channelId = data["channelId"] ?? "";

          name = data["name"] ?? "";
          image = data["image"] ?? "";
          url = data["url"] ?? "";

          pageRoutes = data["pageRoutes"] ?? "";
          referralCode = data['referralCode'] ?? "";

          log("Link Referral Code => $referralCode");

          // Populate DeepLinkServices to unify navigation logic
          DeepLinkServices.eventId = videoId.isNotEmpty ? videoId : channelId;
          DeepLinkServices.eventType = pageRoutes;
          DeepLinkServices.videoUrl = url;
          DeepLinkServices.id = videoId.isNotEmpty ? videoId : channelId;

          // If app is not on splash screen, navigate immediately
          if (Get.currentRoute != "/SplashScreenView") {
            DeepLinkServices.onChangeRoutes(isBottomBarRoutes: false);
          }
        }
      },
      onError: (error) {
        log('Branch Io Listen Error => ${error.toString()}');
      },
    );
    log("Stream Subscription => $streamSubscription");
  }

  static Future<void> onCreateBranchIoLink({
    required String userId,
    required String videoId,
    required String channelId,
    required String name,
    required String image,
    required String url,
    required String pageRoutes,
    required String referralCode,
  }) async {
    branchContentMetaData = BranchContentMetaData()
      ..addCustomMetadata("userId", userId)
      ..addCustomMetadata("videoId", videoId)
      ..addCustomMetadata("channelId", channelId)
      ..addCustomMetadata("name", name)
      ..addCustomMetadata("image", image)
      ..addCustomMetadata("url", url)
      ..addCustomMetadata("pageRoutes", pageRoutes)
      ..addCustomMetadata("referralCode", referralCode);

    branchUniversalObject = BranchUniversalObject(
      canonicalIdentifier: 'flutter/branch',
      canonicalUrl: 'https://flutter.dev',
      title: name,
      imageUrl: image,
      contentDescription: name,
      contentMetadata: branchContentMetaData,
      keywords: ['Plugin', 'Branch', 'Flutter'],
      publiclyIndex: true,
      locallyIndex: true,
      expirationDateInMilliSec: DateTime.now().add(const Duration(days: 365)).millisecondsSinceEpoch,
    );

    branchLinkProperties =
        BranchLinkProperties(channel: 'facebook', feature: 'sharing', stage: 'new share', campaign: 'campaign', tags: ['one', 'two', 'three'])
          ..addControlParam('\$uri_redirect_mode', '1')
          ..addControlParam('\$ios_nativelink', true)
          ..addControlParam('\$match_duration', 7200)
          ..addControlParam('\$always_deeplink', true)
          ..addControlParam('\$android_redirect_timeout', 750)
          ..addControlParam('referring_user_id', 'user_id');
  }

  static Future<String?> onGenerateLink() async {
    BranchResponse response = await FlutterBranchSdk.getShortUrl(buo: branchUniversalObject!, linkProperties: branchLinkProperties);
    if (response.success) {
      log("Generated Branch Io Link => ${response.result}");

      return response.result.toString();
    } else {
      log("Generating Branch Io Link Failed !! => ${response.errorCode} - ${response.errorMessage}");
      return null;
    }
  }
}
