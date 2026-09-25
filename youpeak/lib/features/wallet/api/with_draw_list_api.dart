import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/wallet/model/with_draw_list_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class WithDrawListApi {
  static Future<WithDrawListModel?> callApi() async {
    AppSettings.showLog("Get All Video Api Calling...");

    final uri = Uri.parse(Constant.baseURL + Constant.withdrawMethod);

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Get WithDraw Payments Response => ${response.body}");
        return WithDrawListModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Get WithDraw Payments StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get WithDraw Payments Error => $error");
    }
    return null;
  }
}
