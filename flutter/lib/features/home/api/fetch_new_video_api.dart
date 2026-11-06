import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/features/home/model/fetch_new_video_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class FetchNewVideoApi {
  static int startPagination = 0;
  static int limitPagination = 20;

  static Future<FetchNewVideoModel?> callApi({required String loginUserId}) async {
    AppSettings.showLog("Fetch New Video Api Calling...");

    startPagination += 1;

    final uri = Uri.parse("${Constant.baseURL + Constant.homeVideo}?start=$startPagination&type=new&limit=$limitPagination&userId=$loginUserId");

    AppSettings.showLog("Uri => $uri");

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Fetch New Video Api Response => ${response.body}");
        return FetchNewVideoModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Fetch New Video Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Fetch New Video Api Error => $error");
    }
    return null;
  }
}
