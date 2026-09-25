import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class DeleteUserApi {
  static Future<bool> callApi({required String loginUserId}) async {
    AppSettings.showLog("Delete User Api Calling... ");

    final uri = Uri.parse("${Constant.baseURL + Constant.deleteAccount}?userId=$loginUserId");

    final headers = {"key": Constant.secretKey};

    try {
      var response = await http.delete(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Delete User Api Response => ${response.body}");

        return jsonResponse["status"];
      } else {
        AppSettings.showLog("Delete User Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Delete User Api Error => $error");
    }
    return false;
  }
}
