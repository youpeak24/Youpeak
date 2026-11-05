import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/bites/model/get_shorts_video_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class GetShortsVideoApi {
  static GetShortsVideoModel? getShortsVideoModel;
  static int startPagination = 0;
  static int limitPagination = 30;

  static Future<GetShortsVideoModel?> callApi(String loginUserId) async {
    AppSettings.showLog("Get Shorts Video Api Calling... ");

    startPagination += 1;

    AppSettings.showLog("Get Shorts Pagination Page => $startPagination");

    final uri = Uri.parse("${Constant.baseURL + Constant.getShortsVideo}?userId=$loginUserId&start=$startPagination&limit=$limitPagination");

    AppSettings.showLog("Get Shorts Uri => $uri");

    final headers = await AppSession.authHeaders();

    try {
      var response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        AppSettings.showLog("Get Shorts Pagination Page => ${response.body}");
        return GetShortsVideoModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Get Shorts Video Api Video StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get Shorts Video Api Video Error => $error");
    }
    return null;
  }
}
