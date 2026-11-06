import 'dart:async';

import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/file_upload/storage_put.dart';
import 'package:youpeak/core/file_upload/upload_models.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/platform/local_media.dart';
import 'package:youpeak/core/platform/platform_info.dart';
import 'package:youpeak/core/settings/app_settings.dart';

typedef StoragePut = Future<StoragePutResult> Function({
  required String url,
  required String path,
  required String contentType,
  required void Function(double fraction) onProgress,
  required UploadCancelToken cancel,
});

/// Uploads video/Bites files straight to Cloudflare R2 with a short-lived
/// presigned URL, bypassing our own backend: a Vercel function cannot accept a
/// request body larger than 4.5 MB, which every real video exceeds.
///
/// The flow is: ask the API for a presigned URL (it records who the upload
/// belongs to), PUT the file to storage, then the caller publishes the video
/// with the returned public URL. Failures are reported as [UploadFailure]s with
/// a message the user can act on; transient ones (network, a busy storage
/// server, an expired URL) are retried with a fresh URL when needed.
class DirectUploadVideoApi {
  static const _videoContentType = "video/mp4";

  /// Largest video accepted. The server enforces the same limit.
  static const maxVideoBytes = 2 * 1024 * 1024 * 1024;

  /// Waits between attempts (so 3 attempts in total).
  static const retryDelays = [Duration(seconds: 2), Duration(seconds: 5)];

  /// A presigned URL is valid for 15 minutes; ask for a new one before a retry
  /// that comes later than this.
  static const _urlFreshFor = Duration(minutes: 10);

  static String contentTypeFor(String videoPath) {
    // The phone app always uploads MP4. In the browser the picked or recorded
    // file can also be WebM/MOV; the R2 object must carry its real type (it is
    // part of the presigned signature and what players rely on).
    return (LocalMedia.mimeType(videoPath) ?? _videoContentType).split(';').first.trim().toLowerCase();
  }

  static String extensionFor(String contentType) => const {"video/webm": "webm", "video/quicktime": "mov"}[contentType] ?? "mp4";

  /// Uploads [videoPath] and returns the public URL of the stored video.
  /// Throws [UploadFailure].
  static Future<String> upload(
    String videoPath,
    bool isNormalVideo, {
    UploadCancelToken? cancel,
    void Function(double fraction)? onProgress,
    void Function(String status)? onStatus,
    AppApiClient? api,
    StoragePut put = putFileToStorage,
    Future<void> Function(Duration)? delay,
    DateTime Function()? clock,
  }) async {
    final token = cancel ?? UploadCancelToken();
    final client = api ?? AppApiClient();
    final wait = delay ?? (d) => Future<void>.delayed(d);
    final now = clock ?? DateTime.now;
    final contentType = contentTypeFor(videoPath);

    int size;
    try {
      size = await LocalMedia.length(videoPath);
    } catch (_) {
      throw const UploadFailure("FILE_UNREADABLE", "Couldn't read the selected video. Pick it again and retry.");
    }
    if (size <= 0) throw const UploadFailure("EMPTY_FILE", "The selected video is empty. Pick another one.");
    if (size > maxVideoBytes) throw UploadFailure("FILE_TOO_LARGE", "This video is larger than ${maxVideoBytes ~/ (1024 * 1024 * 1024)} GB, the most YouPeak accepts.");

    String? uploadUrl;
    String? publicUrl;
    DateTime? issuedAt;

    for (var attempt = 0;; attempt++) {
      token.throwIfCancelled();
      try {
        if (uploadUrl == null || issuedAt == null || now().difference(issuedAt) > _urlFreshFor) {
          onStatus?.call("Preparing upload…");
          final grant = await _requestUrl(client, isNormalVideo, contentType, size);
          uploadUrl = grant.$1;
          publicUrl = grant.$2;
          issuedAt = now();
        }
        token.throwIfCancelled();
        onStatus?.call(attempt == 0 ? "Uploading video…" : "Uploading video (retry $attempt)…");
        final result = await put(url: uploadUrl, path: videoPath, contentType: contentType, onProgress: onProgress ?? (_) {}, cancel: token);
        if (result.ok) return publicUrl!;
        final failure = failureForStoragePut(result, isWeb: PlatformInfo.isWeb);
        if (failure.code == "UPLOAD_AUTH_EXPIRED") uploadUrl = null; // sign a new URL for the next try
        throw failure;
      } on UploadFailure catch (failure) {
        AppSettings.showLog("Video upload attempt ${attempt + 1} failed => $failure");
        if (failure.code == "CANCELLED" || !failure.retryable || attempt >= retryDelays.length) {
          // After the last attempt a "trying again" message would be a lie.
          if (failure.retryable && failure.code == "UPLOAD_AUTH_EXPIRED") {
            throw UploadFailure(failure.code, "The upload permission expired. Please try again.", diagnostic: failure.diagnostic);
          }
          if (failure.retryable && failure.code == "STORAGE_BUSY") {
            throw UploadFailure(failure.code, "The video storage is busy right now. Please try again in a few minutes.", diagnostic: failure.diagnostic);
          }
          rethrow;
        }
        onStatus?.call(failure.userMessage);
        await wait(retryDelays[attempt]);
      }
    }
  }

  static Future<(String, String)> _requestUrl(AppApiClient api, bool isNormalVideo, String contentType, int size) async {
    final Map<String, dynamic> response;
    try {
      response = await api.post(Constant.directUploadUrl, {
        "folderStructure": isNormalVideo ? Constant.normalVideo : Constant.shortsVideo,
        "keyName": "${DateTime.now().millisecondsSinceEpoch}.${extensionFor(contentType)}",
        "contentType": contentType,
        "fileSize": size,
      });
    } on ApiException catch (e) {
      throw failureForApi(e);
    }
    final uploadUrl = response["uploadURL"];
    final publicUrl = response["publicUrl"];
    if (uploadUrl is! String || publicUrl is! String || uploadUrl.isEmpty || publicUrl.isEmpty) {
      throw const UploadFailure("BAD_UPLOAD_GRANT", "YouPeak couldn't prepare the upload. Please try again.", retryable: true, diagnostic: "response without uploadURL/publicUrl");
    }
    return (uploadUrl, publicUrl);
  }

  /// Same contract as the old ConvertVideoApi: the public URL, or null on any
  /// failure. New code should call [upload] to learn why.
  static Future<String?> callApi(String videoPath, bool isNormalVideo) async {
    try {
      return await upload(videoPath, isNormalVideo);
    } on UploadFailure {
      return null;
    }
  }
}
