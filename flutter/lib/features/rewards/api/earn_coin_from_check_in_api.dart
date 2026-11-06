import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/features/rewards/model/earn_coin_from_check_in_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class EarnCoinFromCheckInApi {
  static Future<EarnCoinFromCheckInModel?> callApi({required String loginUserId, required int dailyRewardCoin}) async {
    AppSettings.showLog("Earn Coin From Check In Api Calling...");

    try {
      final headers = await AppSession.authHeaders({"Content-Type": 'application/json'});

      final uri = Uri.parse('${Constant.baseURL + Constant.createDailyCheckInRewardHistory}?userId=$loginUserId&dailyRewardCoin=$dailyRewardCoin');

      AppSettings.showLog("Earn Coin From Check In Api Uri => $uri");

      final response = await http.patch(uri, headers: headers);

      final jsonResponse = jsonDecode(response.body);

      AppSettings.showLog("Earn Coin From Check In Api Response => $jsonResponse");

      return EarnCoinFromCheckInModel.fromJson(jsonResponse);
    } catch (e) {
      AppSettings.showLog("Earn Coin From Check In Api Error => $e");

      return null;
    }
  }
}
