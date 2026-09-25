import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/coins/model/fetch_buy_coin_history_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class FetchBuyCoinHistoryApi {
  static int startPagination = 0;
  static int limitPagination = 10;

  static Future<FetchBuyCoinHistoryModel?> callApi({
    required String loginUserId,
    required String startDate,
    required String endDate,
  }) async {
    AppSettings.showLog("Fetch Buy Coin History Api Calling...");
    startPagination += 1;

    final uri = Uri.parse(
        "${Constant.baseURL}${Constant.buyCoinHistory}?userId=$loginUserId&startDate=$startDate&endDate=$endDate&start=$startPagination&limit=$limitPagination");
    final headers = {"key": Constant.secretKey};

    AppSettings.showLog("Fetch Buy Coin History Api Uri => $uri");

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Fetch Buy Coin History Api Response => ${response.body}");

        return FetchBuyCoinHistoryModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Fetch Buy Coin History Api StateCode Error => ${response.statusCode} :: ${response.body}");
      }
    } catch (error) {
      AppSettings.showLog("Fetch Buy Coin History Api Error => $error");
    }
    return null;
  }
}
