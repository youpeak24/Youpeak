import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/network/app_session.dart';
import 'package:youpeak/core/file_upload/file_upload_model.dart';
import 'package:youpeak/core/file_upload/upload_models.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/platform/local_media.dart';

/// Uploads a thumbnail/poster image through the API (images go to Firebase
/// Storage; they are small enough for a function request, which Vercel limits
/// to 4.5 MB).
class ConvertVideoImageApi {
  static const maxImageBytes = 4 * 1024 * 1024;
  static const retryDelays = [Duration(seconds: 2), Duration(seconds: 5)];

  /// Returns the stored image URL. Throws [UploadFailure].
  static Future<String> upload(
    String thumbnailPath,
    bool isNormalVideo, {
    UploadCancelToken? cancel,
    http.Client? client,
    Future<void> Function(Duration)? delay,
  }) async {
    AppSettings.showLog("Convert Video Image Api Calling...");
    final token = cancel ?? UploadCancelToken();
    final wait = delay ?? (d) => Future<void>.delayed(d);

    final int size;
    try {
      size = await LocalMedia.length(thumbnailPath);
    } catch (_) {
      throw const UploadFailure("THUMBNAIL_UNREADABLE", "Couldn't read the thumbnail. Choose it again.");
    }
    if (size <= 0) throw const UploadFailure("THUMBNAIL_EMPTY", "The thumbnail is empty. Choose another image.");
    if (size > maxImageBytes) throw const UploadFailure("THUMBNAIL_TOO_LARGE", "The thumbnail is larger than 4 MB. Choose a smaller image.");

    for (var attempt = 0;; attempt++) {
      token.throwIfCancelled();
      try {
        return await _once(thumbnailPath, isNormalVideo, client);
      } on UploadFailure catch (failure) {
        AppSettings.showLog("Thumbnail upload attempt ${attempt + 1} failed => $failure");
        if (!failure.retryable || attempt >= retryDelays.length) rethrow;
        await wait(retryDelays[attempt]);
      }
    }
  }

  static Future<String> _once(String thumbnailPath, bool isNormalVideo, http.Client? client) async {
    final session = await AppSession.idToken();
    if (session == null) throw const UploadFailure("AUTH_REQUIRED", "Your session has ended. Please sign in again.");
    final headers = {'key': Constant.secretKey, 'Authorization': 'Bearer $session'};

    final request = http.MultipartRequest('PUT', Uri.parse(Constant.baseURL + Constant.fileUpload));
    request.fields.addAll({
      'folderStructure': isNormalVideo ? Constant.normalVideoImage : Constant.shortsVideoImage,
      'keyName': '${DateTime.now().millisecondsSinceEpoch}.jpg',
    });
    request.files.add(await LocalMedia.multipartFile('content', thumbnailPath));
    request.headers.addAll(headers);

    final http.Response response;
    try {
      final streamed = await (client != null ? client.send(request) : request.send()).timeout(const Duration(minutes: 2));
      response = await http.Response.fromStream(streamed);
    } catch (e) {
      throw UploadFailure("THUMBNAIL_NETWORK", "Couldn't upload the thumbnail. Check your connection and try again.", retryable: true, diagnostic: e is TimeoutException ? "timeout" : "no response");
    }

    Map<String, dynamic> body = const {};
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) body = decoded;
    } catch (_) {}

    if (response.statusCode == 200) {
      final model = FileUploadModel.fromJson(body);
      if (model.status == true && (model.url ?? "").isNotEmpty) {
        AppSettings.showLog("Convert Video Image Api Response => ok");
        return model.url!;
      }
      throw UploadFailure("THUMBNAIL_REJECTED", model.message?.isNotEmpty == true ? model.message! : "The thumbnail couldn't be saved. Please try again.", diagnostic: "status:false");
    }
    final code = (body["code"] ?? "").toString();
    final detail = "HTTP ${response.statusCode} $code".trim();
    if (response.statusCode == 401 || response.statusCode == 403) {
      throw UploadFailure("AUTH_REQUIRED", "Your session has ended. Please sign in again.", diagnostic: detail);
    }
    if (response.statusCode == 413) {
      throw UploadFailure("THUMBNAIL_TOO_LARGE", "The thumbnail is too large. Choose a smaller image.", diagnostic: detail);
    }
    if (response.statusCode >= 500 || response.statusCode == 429 || response.statusCode == 408) {
      throw UploadFailure("THUMBNAIL_SERVER", "YouPeak couldn't save the thumbnail. Please try again in a moment.", retryable: true, diagnostic: detail);
    }
    throw UploadFailure("THUMBNAIL_REJECTED", (body["message"] ?? "The thumbnail couldn't be saved.").toString(), diagnostic: detail);
  }

  /// The old contract: the image URL, or null on any failure.
  static Future<String?> callApi(String thumbnailPath, bool isNormalVideo) async {
    try {
      return await upload(thumbnailPath, isNormalVideo);
    } on UploadFailure {
      return null;
    }
  }
}
