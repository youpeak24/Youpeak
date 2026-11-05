import 'package:youpeak/core/platform/local_media.dart';
class CustomVideoSize {
  static Future<double?> onGet(String videoPath) async {
    int fileSizeInBytes = await LocalMedia.length(videoPath);
    double fileSizeInMB = fileSizeInBytes / (1024 * 1024);
    return fileSizeInMB;
  }
}
