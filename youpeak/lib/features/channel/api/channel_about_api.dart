import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/channel/model/channel_about_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class ChannelAboutApi {
  static Future<ChannelAboutModel?> callApi(String channelId) async {
    AppSettings.showLog("Channel About Api Calling...");

    final uri = Uri.parse("${Constant.baseURL + Constant.channelAbout}?channelId=$channelId");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Channel About Api Response => ${response.body}");

        return ChannelAboutModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Channel About Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Channel About Api Error => $error");
    }
    return null;
  }
}
