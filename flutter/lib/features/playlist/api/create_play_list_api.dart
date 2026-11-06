import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class CreatePlayListApiClass {
  static Future<void> callApi(int playListType, List videoId) async {
    AppSettings.showLog("Create PlayList Api Calling...");

    final uri = Uri.parse(Constant.baseURL + Constant.createPlayList);

    final headers = await AppSession.authHeaders({"Content-Type": "application/json; charset=UTF-8",});

    final body = json.encode({
      "channelId": Database.channelId,
      "userId": Database.loginUserId!,
      "videoId": videoId,
      "playListName": AppSettings.playListNameController.text,
      "playListType": playListType // >>> Note :- Private = 1 , Public = 2
    });

    try {
      final response = await http.post(uri, headers: headers, body: body);

      if (response.statusCode == 200) {
        AppSettings.showLog("Create PlayList Api Response => ${response.body}");
      } else {
        AppSettings.showLog("Create PlayList Api StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Create PlayList Api Error => $error");
    }
  }
}
