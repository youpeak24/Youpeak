import 'package:youpeak/core/settings/app_settings.dart';
import 'package:video_player/video_player.dart';
import 'package:youpeak/core/platform/local_media.dart';

class CustomVideoTime {
  static VideoPlayerController? _videoPlayerController;

  static Future<int?> onGet(String videoPath) async {
    try {
      _videoPlayerController = LocalMedia.videoController(videoPath);
      await _videoPlayerController?.initialize();
      if (_videoPlayerController!.value.isInitialized) {
        final videoTime = _videoPlayerController?.value.duration.inMilliseconds;
        AppSettings.showLog("Get Video Time => $videoTime");
        return videoTime;
      } else {
        AppSettings.showLog("Get Video Time Error => Video Not Initialize");
        return null;
      }
    } catch (e) {
      AppSettings.showLog("Get Video Time Error => $e");
      return null;
    }
  }
}
