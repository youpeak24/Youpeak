import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class CheckChannelNameApi {
  static Future<bool?> callApi(String channelName) async {
    AppSettings.showLog("Check Channel Api Calling...");

    try {
      final uri = Uri.parse(Constant.baseURL + Constant.checkChannelName);

      final headers = {"key": Constant.secretKey, "Content-Type": "application/json"};

      var request = http.Request('GET', uri);

      request.body = json.encode({"fullName": channelName});

      AppSettings.showLog("Check Channel Api Body => ${request.body}");

      request.headers.addAll(headers);

      http.StreamedResponse response = await request.send();

      if (response.statusCode == 200) {
        String responseBody = await http.Response.fromStream(response).then((res) => res.body);

        AppSettings.showLog("Check Channel Api Response => $responseBody");

        final jsonResponse = json.decode(responseBody);

        AppSettings.showLog("Check Channel Api Response => ${jsonResponse["status"]}");

        return jsonResponse["status"];
      } else {
        AppSettings.showLog(">>>>> Check Channel Api  StateCode Error <<<<<");
      }
    } catch (error) {
      AppSettings.showLog("Check Channel Api  Error => $error");
    }
    return null;
  }
}
