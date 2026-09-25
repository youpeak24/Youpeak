import 'dart:io';

class CustomVideoSize {
  static Future<double?> onGet(String videoPath) async {
    File videoFile = File(videoPath);
    int fileSizeInBytes = videoFile.lengthSync();
    double fileSizeInMB = fileSizeInBytes / (1024 * 1024);
    return fileSizeInMB;
  }
}
