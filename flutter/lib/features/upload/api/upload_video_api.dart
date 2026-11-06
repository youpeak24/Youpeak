import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/file_upload/upload_models.dart';
import 'package:youpeak/core/network/app_session.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class UploadVideoApi {
  static const retryDelays = [Duration(seconds: 2), Duration(seconds: 5)];

  /// Publishes an uploaded video. The server treats the upload as the
  /// idempotency key: repeating this call for the same upload (after a lost
  /// reply, a timeout, a retry) returns the video that already exists instead
  /// of creating a second one, so it is safe to retry.
  ///
  /// Returns the id of the published video. Throws [UploadFailure].
  static Future<String> publish({
    required String title,
    required String description,
    required List hashTag,
    required int videoType,
    required int videoTime,
    required int visibilityType,
    required int audienceType,
    required int commentType,
    required int scheduleType,
    required String scheduleTime,
    required String location,
    required String latitude,
    required String longitude,
    required String loginUserId,
    required String loginChannelId,
    required String videoUrl,
    required String videoImage,
    required String channelName,
    required String channelDescription,
    required int videoPrivacyType,
    UploadCancelToken? cancel,
    http.Client? client,
    Future<void> Function(Duration)? delay,
  }) async {
    AppSettings.showLog("Upload Video Api Calling...");
    final token = cancel ?? UploadCancelToken();
    final wait = delay ?? (d) => Future<void>.delayed(d);
    final uri = Uri.parse(Constant.baseURL + Constant.uploadVideo);

    final payload = <String, dynamic>{
      "title": title,
      "description": description,
      "hashTag": hashTag,
      "videoType": videoType,
      "videoTime": videoTime,
      "visibilityType": visibilityType + 1,
      "audienceType": audienceType + 1,
      "commentType": commentType + 1,
      "scheduleType": scheduleType,
      if (scheduleType == 1) "scheduleTime": scheduleTime, // SCHEDULED
      "location": location,
      "latitude": latitude,
      "longitude": longitude,
      "userId": loginUserId,
      "channelId": loginChannelId,
      "fullName": channelName,
      "descriptionOfChannel": channelDescription,
      "videoUrl": videoUrl,
      "videoImage": videoImage,
      "videoPrivacyType": videoPrivacyType,
      "channelType": AppSettings.channelType.value.toString(),
    };
    final body = json.encode(payload);

    for (var attempt = 0;; attempt++) {
      token.throwIfCancelled();
      try {
        return await _once(uri, body, client);
      } on UploadFailure catch (failure) {
        AppSettings.showLog("Publish video attempt ${attempt + 1} failed => $failure");
        if (failure.code == "CANCELLED" || !failure.retryable || attempt >= retryDelays.length) rethrow;
        await wait(retryDelays[attempt]);
      }
    }
  }

  static Future<String> _once(Uri uri, String body, http.Client? client) async {
    final session = await AppSession.idToken();
    if (session == null) throw const UploadFailure("AUTH_REQUIRED", "Your session has ended. Please sign in again.");
    final headers = {'Authorization': 'Bearer $session', 'key': Constant.secretKey, 'Content-Type': 'application/json'};

    final http.Response response;
    try {
      final send = client != null ? client.post(uri, body: body, headers: headers) : http.post(uri, body: body, headers: headers);
      response = await send.timeout(const Duration(seconds: 60));
    } catch (e) {
      throw UploadFailure("PUBLISH_NETWORK", "Your video uploaded, but YouPeak couldn't be reached to publish it. Check your connection and try again.",
          retryable: true, diagnostic: e is TimeoutException ? "timeout" : "no response");
    }

    Map<String, dynamic> result = const {};
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) result = decoded;
    } catch (_) {}
    final code = (result["code"] ?? "").toString();
    final serverMessage = (result["message"] ?? result["error"] ?? "").toString();

    if (response.statusCode == 200 && result["status"] == true) {
      final video = result["video"];
      final id = video is Map ? (video["_id"] ?? video["id"] ?? "").toString() : "";
      AppSettings.showLog("Upload Video Api Response => published");
      return id;
    }

    final detail = "HTTP ${response.statusCode} $code".trim();
    if (response.statusCode == 401) throw UploadFailure("AUTH_REQUIRED", "Your session has ended. Please sign in again.", diagnostic: detail);
    if (response.statusCode >= 500 || response.statusCode == 429 || response.statusCode == 408) {
      throw UploadFailure("PUBLISH_SERVER", "YouPeak couldn't publish the video right now. Please try again in a moment.", retryable: true, diagnostic: detail);
    }
    switch (code) {
      case "UPLOAD_IN_PROGRESS":
        // A previous attempt is still publishing this upload; try again shortly.
        throw UploadFailure("PUBLISH_BUSY", "YouPeak is still publishing your video. One moment…", retryable: true, diagnostic: detail);
      case "UPLOAD_INCOMPLETE":
      case "UPLOAD_EXPIRED":
      case "UPLOAD_NOT_FOUND":
        throw UploadFailure("UPLOAD_LOST", "The video didn't finish uploading. Please upload it again.", diagnostic: detail);
      case "UPLOAD_NOT_OWNED":
      case "UPLOAD_ALREADY_USED":
        throw UploadFailure("UPLOAD_CONFLICT", serverMessage.isNotEmpty ? serverMessage : "This upload can't be published.", diagnostic: detail);
      case "CHANNEL_NOT_OWNED":
        throw UploadFailure("PERMISSION_DENIED", "This account can't upload to that channel. Open your own channel and try again.", diagnostic: detail);
      case "CHANNEL_NOT_FOUND":
        throw UploadFailure("CHANNEL_MISSING", "YouPeak couldn't find your channel. Set up your channel, then upload again.", diagnostic: detail);
      case "INVALID_VIDEO_PROVIDER":
        throw UploadFailure("UPLOAD_UNAVAILABLE", "Video uploads are temporarily unavailable. Please try again later.", diagnostic: detail);
      case "UPLOAD_TOO_LARGE":
        throw UploadFailure("FILE_TOO_LARGE", "This video is too large to publish.", diagnostic: detail);
    }
    throw UploadFailure("PUBLISH_REFUSED", serverMessage.isNotEmpty ? serverMessage : "YouPeak couldn't publish this video. Please check the details and try again.", diagnostic: detail);
  }
}
