import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/features/coins/model/get_my_coin_model.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/network/app_session.dart';

class GetMyCoinApi {
  static GetMyCoinModel? getMyCoinModel;

  static Future<GetMyCoinModel?> callApi({required String loginUserId}) async {
    AppSettings.showLog("Get My Coin Api Calling...");

    final uri = Uri.parse("${Constant.baseURL}${Constant.getMyCoin}?userId=$loginUserId");

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Get My Coin Api Response => ${response.body}");
        getMyCoinModel = GetMyCoinModel.fromJson(jsonResponse);
        return getMyCoinModel;
      } else {
        AppSettings.showLog("Get My Coin Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get My Coin Api Error => $error");
    }
    return null;
  }
}
