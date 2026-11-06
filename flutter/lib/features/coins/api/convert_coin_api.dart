import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/features/coins/model/convert_coin_model.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/network/app_session.dart';

class ConvertCoinApi {
  static Future<ConvertCoinModel?> callApi({required String loginUserId, required int coin}) async {
    AppSettings.showLog("Convert Coin Api Calling...");

    final uri = Uri.parse("${Constant.baseURL}${Constant.convertCoin}?userId=$loginUserId&coin=$coin");

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Convert Coin Api Response => ${response.body}");

        return ConvertCoinModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Convert Coin Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Convert Coin Api Error => $error");
    }
    return null;
  }
}
