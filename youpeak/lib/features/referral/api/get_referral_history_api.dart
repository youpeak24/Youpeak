import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/features/referral/model/get_referral_history_model.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_constant.dart';

class ReferralHistoryApi {
  static Future<GetReferralHistoryModel?> callApi({
    required String loginUserId,
    required String startDate,
    required String endDate,
  }) async {
    AppSettings.showLog("Referral History Api Calling...");

    final uri = Uri.parse("${Constant.baseURL}${Constant.referralHistory}?userId=$loginUserId&startDate=$startDate&endDate=$endDate");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Referral History Api Response => ${response.body}");

        return GetReferralHistoryModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Referral History Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Referral History Api Error => $error");
    }
    return null;
  }
}
