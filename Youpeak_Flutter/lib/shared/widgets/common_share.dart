import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:youpeak/core/deep_link/services/deep_link_services.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:get/get_core/src/get_main.dart';
import 'package:get/get_navigation/src/extension_navigation.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:youpeak/core/deep_link/share_manager/share_manager.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/utils/utils.dart';
import 'package:share_plus/share_plus.dart';

class CommonShare {
  static Future onShare({
    String? id,
    String? userId,
    String? title,
    String? image,
    String? pageRoutes,
    String? filePath,
    String? referralCode,
    Callback? onComplete,
    String? sellerName,
    String? url,
    String? channelId,
  }) async {
    try {
      Utils.showLog("SHARE ITEM ID => $image");

      Get.dialog(SpinKitCircle(color: AppColor.lightPink, size: 60), barrierDismissible: false); // Start Loading...0

      await ShareManager.shareContent(
        id: id ?? "",
        title: title ?? "",
        imageUrl: (image?.startsWith("https") ?? false) ? (image ?? "") : (Constant.baseURL + (image ?? "")),
        shareType: ShareType.withImage,
        // Choose your preferred type
        pageRoutes: pageRoutes,
        referralCode: referralCode,
        sellerName: sellerName,
        videoUrl: url,
        channelId: channelId,
        onComplete: onComplete,
      );

      Get.back(); // Stop Loading...

      Utils.showLog("Share Method Called Success...");
    } catch (e) {
      Get.back(); // Stop Loading...
      Utils.showLog("Share Method Called Failed => $e");
    }
  }

  /// Share a normal video by its canonical link (https://youpeak.app/share?pageRoutes=NormalVideo&id=…).
  /// In a browser the link is copied (the system share sheet isn't available everywhere).
  static Future<void> shareVideoLink({required String videoId, required String title, String? image, String? channelId}) async {
    final link = DeepLinkServices.onGenerateLink(id: videoId, pageRoutes: "NormalVideo", channelId: channelId);
    if (kIsWeb) {
      await Clipboard.setData(ClipboardData(text: link));
      CustomToast.show("Link copied to clipboard");
      return;
    }
    await onShare(id: videoId, title: title, image: image, pageRoutes: "NormalVideo", channelId: channelId);
  }

  static Future onShareText({required String text}) async {
    try {
      Utils.showLog("SHARE TEXT => $text");

      Get.dialog(const Center(child: CircularProgressIndicator()), barrierDismissible: false); // Start Loading...

      await Share.share(text);

      Get.back(); // Stop Loading...

      Utils.showLog("Share Text Method Called Success...");
    } catch (e) {
      Get.back(); // Stop Loading...
      Utils.showLog("Share Text Method Called Failed => $e");
    }
  }
}
