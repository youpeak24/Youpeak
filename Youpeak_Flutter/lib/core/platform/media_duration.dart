import 'package:ffmpeg_kit_flutter_new_min/ffprobe_kit.dart';
import 'package:flutter/foundation.dart';

/// Length of the video at [path] in whole seconds, read from the file itself
/// with FFprobe (it doesn't depend on the phone's video decoder, so it works
/// when the preview player can't start). Null when it can't be read or the
/// platform has no FFprobe (the browser).
Future<int?> probeDurationSeconds(String path) async {
  if (kIsWeb) return null;
  try {
    final session = await FFprobeKit.getMediaInformation(path).timeout(const Duration(seconds: 15));
    final seconds = double.tryParse(session.getMediaInformation()?.getDuration() ?? "");
    if (seconds == null || !seconds.isFinite || seconds <= 0) return null;
    return seconds.ceil();
  } catch (_) {
    return null;
  }
}
