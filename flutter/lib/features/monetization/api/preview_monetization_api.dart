import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/monetization/model/preview_monetization_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class PreviewMonetizationApi {
  static Future<PreviewMonetizationModel?> callApi({required String loginUserId, required String startDate, required String endDate}) async {
    AppSettings.showLog("Get Preview Monetization Api Calling...");
    final uri = Uri.parse("${Constant.baseURL + Constant.previewMonetization}?userId=$loginUserId&startDate=$startDate&endDate=$endDate");
    final headers = await AppSession.authHeaders();
    try {
      final response = await http.get(uri, headers: headers);
      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        AppSettings.showLog("Get Preview Monetization Response => ${response.body}");
        return PreviewMonetizationModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Get Preview Monetization StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get Preview Monetization Error => $error");
    }
    return null;
  }
}
