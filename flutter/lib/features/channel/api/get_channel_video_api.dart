import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/channel/model/get_channel_video_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class GetChannelVideoApiClass {
  static GetChannelVideoModel? _getChannelVideoModel;

  static List<int> startPagination = [0, 0];
  static List<int> limitPagination = [20, 20];

  static Future<List<VideosTypeWiseOfChannel>?> callApi(int videoType, String channelId) async {
    // 1 => NormalVideo , 2 => Shorts Videos
    startPagination[videoType]++;
    AppSettings.showLog("Pagination => Video Type => $videoType : Page Index => ${GetChannelVideoApiClass.startPagination[videoType]}");
    AppSettings.showLog("Get Channel [${Database.channelId}] Video Api Calling...");

    final uri = Uri.parse(
        "${Constant.baseURL + Constant.channelVideos}?userId=${Database.loginUserId ?? ""}&channelId=$channelId&start=${startPagination[videoType]}&limit=${limitPagination[videoType]}&videoType=${videoType + 1}");

    print("************ ${uri}");

    final headers = await AppSession.authHeaders();

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        _getChannelVideoModel = GetChannelVideoModel.fromJson(jsonResponse);

        AppSettings.showLog("Get Channel Video Api Response Video Length => ${_getChannelVideoModel?.videosTypeWiseOfChannel?.length}");

        AppSettings.showLog("Get Channel Video Api Response => ${response.body}");

        return _getChannelVideoModel?.videosTypeWiseOfChannel;
      } else {
        AppSettings.showLog("Get Channel Video Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get Channel Video Api Error => $error");
    }
    return null;
  }
}
