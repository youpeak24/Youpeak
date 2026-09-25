import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/library/model/watch_later_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class GetWatchLaterApiClass {
  static WatchLaterModel? _watchLaterModel;

  static Future<List<GetSaveToWatchLater>?> callApi() async {
    AppSettings.showLog("Get Watch Later Api Calling...");

    final uri = Uri.parse("${Constant.baseURL + Constant.watchLater}?userId=${Database.loginUserId}");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        _watchLaterModel = WatchLaterModel.fromJson(jsonResponse);

        AppSettings.showLog("Get Watch Later Api Response => ${response.body}");

        return _watchLaterModel?.getSaveToWatchLater;
      } else {
        AppSettings.showLog("Get Watch Later Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Get Watch Later Api Error => $error");
    }
    return null;
  }
}
