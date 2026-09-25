import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/subscriptions/model/get_subscribed_channel_video_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class GetSubScribedVideoApiClass {
  static int startPagination = 0;
  static int limitPagination = 10;

  static GetSubscribedChannelVideoModel? _getSubscribedChannelVideoModel;
  static const List types = ["all", "today", "continueWatching"];

  static Future<List<VideoOfSubscribedChannel>?> callApi(int index) async {
    AppSettings.showLog("Get Subscribed Video Api Calling...");

    startPagination += 1;
    final uri = Uri.parse(
        "${Constant.baseURL + Constant.getSubscribedChannelVideo}?userId=${Database.loginUserId}&type=${types[index]}&start=$startPagination&limit=$limitPagination");

    AppSettings.showLog("Get Subscribed Video Api $uri");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        _getSubscribedChannelVideoModel = GetSubscribedChannelVideoModel.fromJson(jsonResponse);

        AppSettings.showLog("Get Subscribed Video Api Response => ${response.body}");

        return _getSubscribedChannelVideoModel?.videoOfSubscribedChannel;
      } else {
        AppSettings.showLog("Get Subscribed Video Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get Subscribed Video Api Error => $error");
    }
    return null;
  }
}
