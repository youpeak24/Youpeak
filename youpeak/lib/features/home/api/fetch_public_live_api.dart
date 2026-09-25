import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/home/model/fetch_public_live_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class FetchPublicLiveApi {
  static int startPagination = 0;
  static int limitPagination = 20;

  static Future<FetchPublicLiveModel?> callApi({required String loginUserId}) async {
    AppSettings.showLog("Fetch Public Live1 Api Calling...");

    startPagination += 1;

    final uri =
        Uri.parse("${Constant.baseURL + Constant.homeVideo}?start=$startPagination&type=publiclive&limit=$limitPagination&userId=$loginUserId");

    AppSettings.showLog("Uri => $uri");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Fetch Public Live1 Api Response => ${response.body}");
        return FetchPublicLiveModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Fetch Public Live1 Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Fetch Public Live1 Api Error => $error");
    }
    return null;
  }
}
