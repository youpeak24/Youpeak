import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/home/model/fetch_all_video_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class FetchAllVideoApi {
  static int startPagination = 0;
  static int limitPagination = 20;

  static Future<FetchAllVideoModel?> callApi({required String loginUserId}) async {
    AppSettings.showLog("Fetch All Video Api Calling...");

    startPagination += 1;

    final uri = Uri.parse("${Constant.baseURL + Constant.homeVideo}?start=$startPagination&type=all&limit=$limitPagination&userId=$loginUserId");

    AppSettings.showLog("Uri => $uri");

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Fetch All Video Api Response => ${response.body}");
        return FetchAllVideoModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Fetch All Video Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Fetch All Video Api Error => $error");
    }
    return null;
  }
}
