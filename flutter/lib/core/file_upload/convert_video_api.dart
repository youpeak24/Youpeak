import 'package:youpeak/core/file_upload/direct_upload_video_api.dart';

/// Compatibility entry point: videos must bypass Vercel's request-body limit.
class ConvertVideoApi {
  static Future<String?> callApi(String videoPath, bool isNormalVideo) =>
      DirectUploadVideoApi.callApi(videoPath, isNormalVideo);
}
