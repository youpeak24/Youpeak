import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/channel/model/channel_playlist_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class ChannelPlayListApi {
  static int startPagination = 0;
  static int limitPagination = 20;

  static Future<ChannelPlaylistModel?> callApi(String channelId) async {
    startPagination += 1;
    AppSettings.showLog("Channel PlayList Api Calling... **** $channelId");
    AppSettings.showLog("Pagination Page Index => $startPagination");

    final uri = Uri.parse(
        "${Constant.baseURL + Constant.channelPlayList}?userId=${Database.loginUserId ?? ""}&channelId=$channelId&start=$startPagination&limit=$limitPagination");

    final headers = await AppSession.authHeaders();

    AppSettings.showLog("uri Channel PlayList >>>>>>>>>>>>>>>>>>>$uri");

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Channel PlayList Api Response => ${response.body}");

        return ChannelPlaylistModel.fromJson(jsonResponse);
      } else {
        AppSettings.showLog("Channel PlayList Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Channel PlayList Api Error => $error");
    }
    return null;
  }
}
