import 'package:youpeak/core/assets/app_visuals.dart';
import 'dart:convert';

import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/features/upload/model/upload_video_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';

class UploadVideoApi {
  static UploadVideoModel? _uploadVideoModel;

  static Future<bool> callApi({
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
  }) async {
    AppSettings.showLog("Upload Video Api Calling...$scheduleType");

    try {
      final uri = Uri.parse(Constant.baseURL + Constant.uploadVideo);

      var headers = {
        'key': Constant.secretKey,
        'Content-Type': 'application/json'
      };

      final body = json.encode(scheduleType == 1 // SCHEDULED
          ? {
              "title": title,
              "description": description,
              "hashTag": hashTag,
              "videoType": videoType,
              "videoTime": videoTime,
              "visibilityType": visibilityType + 1,
              "audienceType": audienceType + 1,
              "commentType": commentType + 1,
              "scheduleType": scheduleType,
              "scheduleTime": scheduleTime,
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
            }
          : {
              "title": title,
              "description": description,
              "hashTag": hashTag,
              "videoType": videoType,
              "videoTime": videoTime,
              "visibilityType": visibilityType + 1,
              "audienceType": audienceType + 1,
              "commentType": commentType + 1,
              "scheduleType": scheduleType,
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
            });

      final response = await http.post(uri, body: body, headers: headers);

      AppSettings.showLog("body>>>>>>>>>>>>>>>>>>>>>>${body}");

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        AppSettings.showLog("Upload Video Api Response => $jsonResponse");
        _uploadVideoModel = UploadVideoModel.fromJson(jsonResponse);

        if (_uploadVideoModel?.status ?? false) {
          CustomToast.celebrate(AppStrings.videoUploadSuccessfully.tr, AppVisuals.uploadDone);
          return true;
        }
        AppSettings.showLog(
            "Upload Video Api Response => ${_uploadVideoModel?.status}");
      } else {
        AppSettings.showLog("Upload Video Api Status Code Error");
      }
    } catch (e) {
      AppSettings.showLog("Upload Video Api Error => $e");
    }
    return false;
  }
}
