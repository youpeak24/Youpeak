import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class CheckChannelNameApi {
  /// The server's explanation for the last answer (why a name was refused).
  static String lastMessage = "";

  /// true: the name is free · false: it is taken or invalid (see [lastMessage])
  /// · null: the check itself failed (network or server error).
  static Future<bool?> callApi(String channelName) async {
    AppSettings.showLog("Check Channel Api Calling...");
    lastMessage = "";

    try {
      // The name travels in the query string: a browser silently drops the
      // body of a GET request, which made every name look unavailable on web.
      final uri = Uri.parse(Constant.baseURL + Constant.checkChannelName).replace(queryParameters: {"fullName": channelName});
      final headers = await AppSession.authHeaders();

      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 20));

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        AppSettings.showLog("Check Channel Api Response => ${jsonResponse["status"]}");
        lastMessage = (jsonResponse["message"] ?? "").toString();
        final status = jsonResponse["status"];
        return status is bool ? status : null;
      }
      AppSettings.showLog(">>>>> Check Channel Api StateCode Error ${response.statusCode} <<<<<");
    } catch (error) {
      AppSettings.showLog("Check Channel Api Error => $error");
    }
    return null;
  }
}
