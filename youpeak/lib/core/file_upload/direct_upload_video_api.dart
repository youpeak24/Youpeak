import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

// Uploads video/shorts files straight to R2, bypassing our own backend.
// The legacy ConvertVideoApi PUTs the whole file through client/file/upload-file,
// which is a Vercel serverless function — Vercel hard-caps a function's request
// body at 4.5MB (not configurable), so any real phone-recorded video failed
// there with a platform-level 413 before our own code ever ran, always
// surfacing to the user as a generic "Something went wrong". This instead asks
// the backend for a short-lived presigned R2 URL, then uploads directly to R2.
// Same return contract as ConvertVideoApi.callApi so callers don't change.
class DirectUploadVideoApi {
  static const _videoContentType = "video/mp4";

  static Future<String?> callApi(String videoPath, bool isNormalVideo) async {
    AppSettings.showLog("Direct Upload Video Api Calling...");

    try {
      final urlUri = Uri.parse(Constant.baseURL + Constant.directUploadUrl);
      final headers = {"key": Constant.secretKey, "Content-Type": "application/json"};
      final body = json.encode({
        "folderStructure": isNormalVideo ? Constant.normalVideo : Constant.shortsVideo,
        "keyName": "${DateTime.now().millisecondsSinceEpoch}.mp4",
        "contentType": _videoContentType,
      });

      final urlResponse = await http.post(urlUri, headers: headers, body: body);
      if (urlResponse.statusCode != 200) {
        AppSettings.showLog("Direct Upload Video Api: could not get upload URL (${urlResponse.statusCode})");
        return null;
      }

      final urlJson = jsonDecode(urlResponse.body);
      if (urlJson["status"] != true || urlJson["uploadURL"] == null || urlJson["publicUrl"] == null) {
        AppSettings.showLog("Direct Upload Video Api: upload URL response invalid => ${urlResponse.body}");
        return null;
      }

      final uploadURL = urlJson["uploadURL"] as String;
      final publicUrl = urlJson["publicUrl"] as String;

      final fileBytes = await File(videoPath).readAsBytes();
      final putResponse = await http.put(
        Uri.parse(uploadURL),
        headers: {"Content-Type": _videoContentType},
        body: fileBytes,
      );

      if (putResponse.statusCode != 200) {
        AppSettings.showLog("Direct Upload Video Api: R2 PUT failed (${putResponse.statusCode}) => ${putResponse.body}");
        return null;
      }

      AppSettings.showLog("Direct Upload Video Api Response => $publicUrl");
      return publicUrl;
    } catch (e) {
      AppSettings.showLog("Direct Upload Video Api Error => $e");
      return null;
    }
  }
}
