import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/features/rewards/model/get_daily_reward_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class GetDailyRewardApi {
  static Future<GetDailyRewardModel?> callApi({required String loginUserId}) async {
    AppSettings.showLog("Get Daily Reward Api Calling...");

    final uri = Uri.parse("${Constant.baseURL}${Constant.dailyRewardCoin}?userId=$loginUserId");

    AppSettings.showLog("Get Daily Reward Api Uri => $uri");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Get Daily Reward Api Response => ${response.body}");

        return GetDailyRewardModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Get Daily Reward Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get Daily Reward Api Error => $error");
    }
    return null;
  }
}
