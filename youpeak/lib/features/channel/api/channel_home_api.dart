import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/features/channel/model/channel_home_model.dart';
import 'package:youpeak/features/channel/model/get_play_list_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class ChannelHomeApi {
  static int startPagination = 0;
  static int limitPagination = 20;

  static Future<ChannelHomeModel?> callApi(String userId, String channelId) async {
    AppSettings.showLog("Channel Home Api Calling...$userId **** $channelId");

    startPagination += 1;
    AppSettings.showLog("Pagination Page Index => $startPagination");

    final uri =
        Uri.parse("${Constant.baseURL + Constant.channelHome}?channelId=$channelId&userId=$userId&start=$startPagination&limit=$limitPagination");

    AppSettings.showLog("Channel Home Api => $uri");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Channel Home Api Response => ${response.body}");

        return ChannelHomeModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Channel Home Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Channel Home Api Error => $error");
    }
    return null;
  }
}

class GetPlayListOnlyApi {
  static int startPagination = 0;
  static int limitPagination = 20;

  static Future<GetPlayListModel?> callApi(String userId, String playListId) async {
    AppSettings.showLog("get play list Api Calling...$userId **** $playListId");

    startPagination += 1;
    AppSettings.showLog("Pagination Page Index => $startPagination");

    final uri = Uri.parse(
        "${Constant.baseURL + Constant.getPlayListVideos}?playListId=$playListId&userId=$userId&start=$startPagination&limit=$limitPagination");

    AppSettings.showLog("get play list Api => $uri");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("get play list Api Response => ${response.body}");

        return GetPlayListModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("get play list Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("get play list Api Error => $error");
    }
    return null;
  }
}
