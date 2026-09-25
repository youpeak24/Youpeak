import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/monetization/model/monetization_request_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class MonetizationRequestApi {
  static Future<MonetizationRequestModel?> callApi(String loginUserId) async {
    AppSettings.showLog("Monetization Request Api Calling...");

    final uri = Uri.parse("${Constant.baseURL + Constant.monetizationRequest}?userId=$loginUserId");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.post(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Monetization Request Api Response => ${response.body}");
        return MonetizationRequestModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Monetization Request Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Monetization Request Api Error => $error");
    }
    return null;
  }
}
