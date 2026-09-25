import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/features/wallet/model/withdraw_setting_model.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_constant.dart';

class WithdrawSettingApi {
  static WithdrawSettingModel? withdrawSettingModel;
  static Future<void> callApi({required String loginUserId}) async {
    AppSettings.showLog("Withdraw Setting Api Calling...");

    final uri = Uri.parse("${Constant.baseURL}${Constant.withdrawSetting}?userId=$loginUserId");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Withdraw Setting Api Response => ${response.body}");

        withdrawSettingModel = WithdrawSettingModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Withdraw Setting Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Withdraw Setting Api Error => $error");
    }
  }
}
