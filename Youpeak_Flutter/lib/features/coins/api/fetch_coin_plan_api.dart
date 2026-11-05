import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/features/coins/model/fetch_coin_plan_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class FetchCoinPlanApi {
  static Future<FetchCoinPlanModel?> callApi() async {
    AppSettings.showLog("Fetch Coin Plan Api Calling...");

    final uri = Uri.parse("${Constant.baseURL}${Constant.fetchCoinPlan}");
    final headers = await AppSession.authHeaders();

    AppSettings.showLog("Fetch Coin Plan Api Uri => $uri");

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Fetch Coin Plan Api Response => ${response.body}");

        return FetchCoinPlanModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Fetch Coin Plan Api StateCode Error => ${response.statusCode} :: ${response.body}");
      }
    } catch (error) {
      AppSettings.showLog("Fetch Coin Plan Api Error => $error");
    }
    return null;
  }
}
