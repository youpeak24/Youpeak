import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/coins/model/get_coin_history_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class GetCoinHistoryApi {
  static Future<GetCoinHistoryModel?> callApi({
    required String loginUserId,
    required String startDate,
    required String endDate,
  }) async {
    AppSettings.showLog("Get Coin History Api Calling...");

    final uri = Uri.parse("${Constant.baseURL}${Constant.coinHistory}?userId=$loginUserId&startDate=$startDate&endDate=$endDate");

    final headers = await AppSession.authHeaders();

    AppSettings.showLog("Get Coin History Api Url => $uri");

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Get Coin History Api Response => ${response.body}");

        return GetCoinHistoryModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Get Coin History Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get Coin History Api Error => $error");
    }
    return null;
  }
}
