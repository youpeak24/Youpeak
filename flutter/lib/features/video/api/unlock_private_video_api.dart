import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/features/video/model/unlock_private_video_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class UnlockPrivateVideoApi {
  static UnlockPrivateVideoModel? unlockPrivateVideoModel;
  static Future<void> callApi({required String loginUserId, required String videoId}) async {
    unlockPrivateVideoModel = null;
    AppSettings.showLog("Unlock Private Video Api Calling...");

    final uri = Uri.parse("${Constant.baseURL}${Constant.unlockPrivateVideo}?userId=$loginUserId&videoId=$videoId");
    final headers = await AppSession.authHeaders();

    AppSettings.showLog("Unlock Private Video Api Uri => $uri");

    try {
      final response = await http.post(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Unlock Private Video Api Response => ${response.body}");

        unlockPrivateVideoModel = UnlockPrivateVideoModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Unlock Private Video Api StateCode Error => ${response.statusCode} :: ${response.body}");
      }
    } catch (error) {
      AppSettings.showLog("Unlock Private Video Api Error => $error");
    }
  }
}
