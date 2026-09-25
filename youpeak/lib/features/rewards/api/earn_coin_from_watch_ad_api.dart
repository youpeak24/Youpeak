import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/rewards/model/earn_coin_from_watch_ad_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class EarnCoinFromWatchAdApi {
  static Future<EarnCoinFromWatchAdModel?> callApi({required String loginUserId, required int coinEarnedFromAd, required String adId}) async {
    AppSettings.showLog("Earn Coin From Watch Ad Api Calling...");

    try {
      final headers = {"key": Constant.secretKey, "Content-Type": 'application/json'};

      final uri =
          Uri.parse('${Constant.baseURL + Constant.createAdWatchRewardHistory}?userId=$loginUserId&coinEarnedFromAd=$coinEarnedFromAd&adId=$adId');

      AppSettings.showLog("Earn Coin From Watch Ad Api Uri => $uri");

      final response = await http.patch(uri, headers: headers);

      final jsonResponse = jsonDecode(response.body);

      AppSettings.showLog("Earn Coin From Watch Ad Api Response => $jsonResponse");

      return EarnCoinFromWatchAdModel.fromJson(jsonResponse);
    } catch (e) {
      AppSettings.showLog("Earn Coin From Watch Ad Api Error => $e");

      return null;
    }
  }
}
