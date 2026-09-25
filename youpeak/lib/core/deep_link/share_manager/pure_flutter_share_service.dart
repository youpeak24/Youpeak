import 'dart:io';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:youpeak/core/theme/app_color.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:cross_file/cross_file.dart';

class PureFlutterShareService {
  /// Share with image + formatted text (appears as image + caption)
  static Future<void> shareRichContent({required String title, String? imageUrl, String? deepLink, Function()? onComplete}) async {
    try {
      Get.dialog(SpinKitCircle(color: AppColor.lightPink, size: 60), barrierDismissible: false); // Start Loading...

      // Format the text nicely
      final shareText = '''
${deepLink != null ? '🔗 $deepLink' : ''}
      '''
          .trim();

      // If there's an image, download and share with it
      if (imageUrl != null) {
        final imageFile = await _downloadImage(imageUrl);

        if (imageFile != null) {
          // This will show image with your text as caption
          await Share.shareXFiles([imageFile], text: shareText, subject: title).whenComplete(() => onComplete?.call());
        } else {
          // Fallback to text only
          await Share.share(shareText, subject: title).whenComplete(() => onComplete?.call());
        }
      } else {
        // Text only share
        await Share.share(shareText, subject: title).whenComplete(() => onComplete?.call());
      }

      Get.back();
    } catch (e) {
      Get.back();
      print("Share failed: $e");
    }
  }

  /// Share a bundled image with [text] as its caption; falls back to text only.
  static Future<void> shareAsset({required String assetPath, required String text}) async {
    try {
      final bytes = await rootBundle.load(assetPath);
      final file = File('${(await getTemporaryDirectory()).path}/${assetPath.split('/').last}');
      await file.writeAsBytes(bytes.buffer.asUint8List(), flush: true);
      await Share.shareXFiles([XFile(file.path)], text: text);
    } catch (e) {
      debugPrint("Asset share failed, sharing text only: $e");
      await Share.share(text);
    }
  }

  static Future<XFile?> _downloadImage(String imageUrl) async {
    try {
      final response = await http.get(Uri.parse(imageUrl));

      if (response.statusCode == 200) {
        final tempDir = await getTemporaryDirectory();
        final fileName = 'share_${DateTime.now().millisecondsSinceEpoch}.jpg';
        final file = File('${tempDir.path}/$fileName');

        await file.writeAsBytes(response.bodyBytes);
        return XFile(file.path);
      }
      return null;
    } catch (e) {
      print("Error downloading image: $e");
      return null;
    }
  }
}
