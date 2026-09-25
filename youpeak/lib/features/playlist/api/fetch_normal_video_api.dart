import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/features/playlist/model/fetch_normal_video_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class FetchNormalVideoApi {
  static int startPagination = 0;
  static int limitPagination = 20;

  static Future<FetchNormalVideoModel?> callApi({required String loginUserId}) async {
    AppSettings.showLog("Fetch Normal Video Api Calling...");

    startPagination += 1;

    AppSettings.showLog("Pagination Page => $startPagination");

    final uri = Uri.parse("${Constant.baseURL + Constant.getNormalVideo}?start=$startPagination&limit=$limitPagination&userId=$loginUserId");

    AppSettings.showLog("Uri => $uri");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Fetch Normal Video Api Response => ${response.body}");

        return FetchNormalVideoModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Fetch Normal Video Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Fetch Normal Video Api Error => $error");
    }
    return null;
  }
}
