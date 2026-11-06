// Non-web builds never call this: they use the video_thumbnail plugin.
Future<String?> captureVideoFrame(String videoUrl, {Duration at = const Duration(seconds: 1)}) async => null;
