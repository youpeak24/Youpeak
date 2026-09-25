import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:get/get.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:cross_file/cross_file.dart';

class ShareCardGenerator {
  static Future<void> shareAsPreviewCard({
    required String title,
    required String websiteName,
    String? imageUrl,
    String? deepLink,
    String? sellerName,
    Color brandColor = Colors.blue,
    Function()? onComplete,
  }) async {
    try {
      Get.dialog(SpinKitCircle(color: AppColor.lightPink, size: 60), barrierDismissible: false); // Start Loading...

      final previewCard = PreviewCardWidget(title: title, websiteName: websiteName, imageUrl: imageUrl, brandColor: brandColor, sellerName: sellerName);

      // Convert widget to image
      final imageFile = await _widgetToImage(previewCard);

      if (imageFile != null) {
        final shareText = deepLink ?? '';

        await Share.shareXFiles([imageFile], text: shareText, subject: title).whenComplete(() => onComplete?.call());
      }

      Get.back();
    } catch (e) {
      Get.back();
      debugPrint("❌ Share Card Failed => $e");
    }
  }

  static Future<XFile?> _widgetToImage(Widget widget) async {
    try {
      final repaintBoundary = RepaintBoundary(
        child: Container(color: Colors.white, child: widget),
      );

      final renderObject = createRenderObject(repaintBoundary);
      final image = await renderObject.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);

      if (byteData != null) {
        final tempDir = await getTemporaryDirectory();
        final file = File('${tempDir.path}/share_card_${DateTime.now().millisecondsSinceEpoch}.png');
        await file.writeAsBytes(byteData.buffer.asUint8List());

        return XFile(file.path);
      }

      return null;
    } catch (e) {
      print("Error creating image: $e");
      return null;
    }
  }

  static RenderRepaintBoundary createRenderObject(Widget widget) {
    final renderView = RenderRepaintBoundary();

    final pipelineOwner = PipelineOwner();
    final buildOwner = BuildOwner(focusManager: FocusManager());

    final renderObjectElement = RenderObjectToWidgetAdapter<RenderBox>(
      container: renderView,
      child: Directionality(textDirection: TextDirection.ltr, child: widget),
    ).attachToRenderTree(buildOwner);

    buildOwner.buildScope(renderObjectElement);
    pipelineOwner.rootNode = renderView;
    pipelineOwner.flushLayout();
    pipelineOwner.flushCompositingBits();
    pipelineOwner.flushPaint();

    return renderView;
  }
}

/// Preview Card Widget (mimics Open Graph card)
class PreviewCardWidget extends StatelessWidget {
  final String title;
  final String websiteName;
  final String? imageUrl;
  final Color brandColor;
  final String? sellerName;

  const PreviewCardWidget({Key? key, required this.title, required this.websiteName, this.imageUrl, this.brandColor = Colors.blue, this.sellerName}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 500,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image section
          if (imageUrl != null)
            Container(
              height: 260,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              ),
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                child: Image.network(
                  imageUrl!,
                  fit: BoxFit.cover,
                  width: double.infinity,
                  errorBuilder: (_, __, ___) => Container(
                    color: brandColor.withOpacity(0.1),
                    child: Icon(Icons.image, size: 60, color: brandColor),
                  ),
                ),
              ),
            ),

          // Content section
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Website name
                Row(
                  children: [
                    Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(color: brandColor, borderRadius: BorderRadius.circular(4)),
                      child: const Icon(Icons.link, size: 12, color: Colors.white),
                    ),
                    const SizedBox(width: 8),
                    Text(websiteName.toUpperCase(), style: TextStyle(fontSize: 12, color: Colors.grey.shade600, letterSpacing: 0.5)),
                  ],
                ),
                const SizedBox(height: 8),

                // Title
                Text(
                  title,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),

                // Description
              ],
            ),
          ),
        ],
      ),
    );
  }
}
