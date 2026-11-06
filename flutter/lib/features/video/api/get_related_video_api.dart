import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/video/model/get_related_video_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class GetRelatedVideoApi {
  static Future<GetRelatedVideoModel?> callApi({required String videoId, required String loginUserId}) async {
    AppSettings.showLog("Get Related Video Api Calling...");

    final uri = Uri.parse("${Constant.baseURL + Constant.getRelatedVideo}?userId=$loginUserId&videoId=$videoId");

    AppSettings.showLog("Get Related Video Api => $uri");

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Get Related Video Api Response => ${response.body}");

        return GetRelatedVideoModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Get Related Video Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get Related Video Api Error => $error");
    }
    return null;
  }
}
