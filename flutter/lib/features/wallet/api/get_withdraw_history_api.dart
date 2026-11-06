import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/wallet/model/get_withdraw_history_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class GetWithdrawHistoryApi {
  static int startPagination = 0;
  static int limitPagination = 10;

  static Future<GetWithdrawHistoryModel?> callApi({
    required String loginUserId,
    required String startDate,
    required String endDate,
  }) async {
    AppSettings.showLog("Get Withdraw History Api Calling...");
    startPagination += 1;
    final uri = Uri.parse(
        "${Constant.baseURL}${Constant.withdrawHistory}?userId=$loginUserId&startDate=$startDate&endDate=$endDate&start=$startPagination&limit=$limitPagination");
    AppSettings.showLog("Get Withdraw History Api url => ${uri}");

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Get Withdraw History Api Response => ${response.body}");

        return GetWithdrawHistoryModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Get Withdraw History Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get Withdraw History Api Error => $error");
    }
    return null;
  }
}
