import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/subscriptions/model/get_subscribed_channel_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class GetSubScribedChannelApiClass {
  static int startPagination = 0;
  static int limitPagination = 10;

  static GetSubscribedChannelModel? _getSubscribedChannelModel;

  static Future<List<SubscribedChannel>?> callApi() async {
    AppSettings.showLog("Get Subscribed Channel Api Calling...");

    startPagination += 1;

    final loginUserId = Database.loginUserId;

    AppSettings.showLog("Get Subscribed Channel Api : User Id => $loginUserId");

    final uri = Uri.parse("${Constant.baseURL + Constant.getSubscribedChannel}?userId=$loginUserId&start=$startPagination&limit=$limitPagination");

    AppSettings.showLog("Get Subscribed Channel Api url => $uri");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        _getSubscribedChannelModel = GetSubscribedChannelModel.fromJson(jsonResponse);
        AppSettings.showLog("Get Subscribed Channel Api Response => ${response.body}");
        return _getSubscribedChannelModel?.subscribedChannel;
      } else {
        AppSettings.showLog("Get Subscribed Channel Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get Subscribed Channel Api Error => $error");
    }
    return null;
  }
}
