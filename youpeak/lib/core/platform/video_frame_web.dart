import 'dart:async';
import 'dart:js_interop';

import 'package:web/web.dart' as web;

// Returns a blob: URL of a JPEG frame taken [at] into the video (clamped to
// the first half of short clips), or null if the browser can't decode it.
Future<String?> captureVideoFrame(String videoUrl, {Duration at = const Duration(seconds: 1)}) async {
  final video = web.HTMLVideoElement()
    ..muted = true
    ..preload = "auto"
    ..playsInline = true;

  try {
    video.src = videoUrl;
    await _nextEvent(video, "loadeddata");

    final duration = video.duration;
    final wanted = at.inMilliseconds / 1000;
    video.currentTime = duration.isFinite && duration > 0 ? (wanted < duration / 2 ? wanted : duration / 2) : 0;
    await _nextEvent(video, "seeked");

    final width = video.videoWidth, height = video.videoHeight;
    if (width == 0 || height == 0) return null;

    final canvas = web.HTMLCanvasElement()
      ..width = width
      ..height = height;
    (canvas.getContext("2d") as web.CanvasRenderingContext2D).drawImage(video, 0, 0);

    final blob = Completer<web.Blob?>();
    canvas.toBlob(((web.Blob? b) => blob.complete(b)).toJS, "image/jpeg", 0.85.toJS);
    final jpeg = await blob.future;
    return jpeg == null ? null : web.URL.createObjectURL(jpeg);
  } catch (_) {
    return null;
  } finally {
    video.removeAttribute("src");
    video.load();
  }
}

// Completes on the first [type] event, or throws on a media error / timeout.
Future<void> _nextEvent(web.HTMLVideoElement video, String type) {
  final done = Completer<void>();
  late final JSFunction onEvent, onError;
  void cleanUp() {
    video.removeEventListener(type, onEvent);
    video.removeEventListener("error", onError);
  }

  onEvent = ((web.Event _) {
    cleanUp();
    if (!done.isCompleted) done.complete();
  }).toJS;
  onError = ((web.Event _) {
    cleanUp();
    if (!done.isCompleted) done.completeError(StateError("video could not be decoded"));
  }).toJS;

  video.addEventListener(type, onEvent);
  video.addEventListener("error", onError);
  return done.future.timeout(const Duration(seconds: 20), onTimeout: () {
    cleanUp();
    throw TimeoutException("video $type");
  });
}
