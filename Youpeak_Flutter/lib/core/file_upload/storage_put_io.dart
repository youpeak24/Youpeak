import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;

import 'package:youpeak/core/file_upload/upload_models.dart';
import 'package:youpeak/core/platform/local_media.dart';

/// PUTs the file at [path] to [url], streaming it from disk in chunks.
///
/// The whole file is never held in memory: reading a large video into one
/// buffer used to exhaust a low-RAM phone's heap, and that failure was then
/// reported as "no connection". [onProgress] gets 0..1 as the bytes go out
/// (throttled to whole-percent steps).
Future<StoragePutResult> putFileToStorage({
  required String url,
  required String path,
  required String contentType,
  required void Function(double fraction) onProgress,
  required UploadCancelToken cancel,
}) async {
  final file = File(path);
  // Not a plain file path (a content URI, a platform-provided handle):
  // read it through the picker's file API instead.
  if (!await file.exists()) return _putBuffered(url, path, contentType, onProgress, cancel);
  final int length;
  try {
    length = await file.length();
  } catch (_) {
    return const StoragePutResult(status: 0, readError: true);
  }
  if (length <= 0) return const StoragePutResult(status: 0, readError: true);

  final client = HttpClient()..connectionTimeout = const Duration(seconds: 30);
  cancel.attach(() => client.close(force: true));
  try {
    onProgress(0);
    final request = await client.putUrl(Uri.parse(url));
    request.headers.set(HttpHeaders.contentTypeHeader, contentType);
    request.contentLength = length;

    var sent = 0;
    var reported = 0.0;
    final body = file.openRead().map((chunk) {
      sent += chunk.length;
      final fraction = math.min(1.0, sent / length);
      if (fraction - reported >= 0.01 || fraction >= 1) {
        reported = fraction;
        onProgress(fraction);
      }
      return chunk;
    });

    // A generous ceiling that grows with the file (slow mobile uplinks).
    final ceiling = Duration(minutes: 30 + length ~/ (20 * 1024 * 1024));
    try {
      await request.addStream(body).timeout(ceiling);
    } on FileSystemException {
      client.close(force: true);
      return const StoragePutResult(status: 0, readError: true);
    }
    final response = await request.close().timeout(const Duration(minutes: 5));
    final text = await response.transform(utf8.decoder).join().timeout(const Duration(seconds: 30));
    onProgress(1);
    return StoragePutResult(status: response.statusCode, body: text);
  } catch (_) {
    if (cancel.isCancelled) return const StoragePutResult(status: 0, aborted: true);
    return const StoragePutResult(status: 0, networkError: true);
  } finally {
    cancel.detach();
    client.close(force: true);
  }
}

/// Fallback for sources that aren't a readable file path: one buffered request
/// (small files only in practice).
Future<StoragePutResult> _putBuffered(
  String url,
  String path,
  String contentType,
  void Function(double fraction) onProgress,
  UploadCancelToken cancel,
) async {
  final client = HttpClient()..connectionTimeout = const Duration(seconds: 30);
  cancel.attach(() => client.close(force: true));
  try {
    final bytes = await LocalMedia.readBytes(path);
    onProgress(0);
    final request = await client.putUrl(Uri.parse(url));
    request.headers.set(HttpHeaders.contentTypeHeader, contentType);
    request.contentLength = bytes.length;
    request.add(bytes);
    final response = await request.close().timeout(const Duration(minutes: 30));
    final text = await response.transform(utf8.decoder).join().timeout(const Duration(seconds: 30));
    onProgress(1);
    return StoragePutResult(status: response.statusCode, body: text);
  } catch (_) {
    if (cancel.isCancelled) return const StoragePutResult(status: 0, aborted: true);
    return const StoragePutResult(status: 0, networkError: true);
  } finally {
    cancel.detach();
    client.close(force: true);
  }
}
