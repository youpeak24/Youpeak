import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class SubscribeChannelApiClass {
  static Future<bool> callApi(String channelId) async {
    AppSettings.showLog("Subscribe Channel Api Calling...");

    final uri = Uri.parse("${Constant.baseURL + Constant.subscribeChannel}?userId=${Database.loginUserId}&channelId=$channelId");

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.post(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Subscribe Channel Api Response => ${response.body}");
        AppSettings.showLog("jsonResponse => ${jsonResponse["isSubscribed"]}");
        return jsonResponse["isSubscribed"] ?? false;
      } else {
        AppSettings.showLog("Subscribe Channel Api StateCode Error");
        throw "Error";
      }
    } catch (error) {
      AppSettings.showLog("Subscribe Channel Api Error => $error");
      throw "Error";
    }
  }
}
