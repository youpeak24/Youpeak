import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class CreateCommentApiClass {
  static Future<void> callApi(String videoId, String messageText) async {
    AppSettings.showLog("Create Comment Api Calling...");

    final uri = Uri.parse(Constant.baseURL + Constant.createComment);

    final headers = await AppSession.authHeaders({"Content-Type": "application/json"});

    final body = json.encode({
      "userId": Database.loginUserId,
      "videoId": videoId,
      "commentText": messageText,
    });
    try {
      final response = await http.post(uri, body: body, headers: headers);

      if (response.statusCode == 200) {
        AppSettings.showLog("Create Comment Api Response => ${response.body}");
      } else {
        AppSettings.showLog("Create Comment StateCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Create Comment Api Error => $error");
    }
  }
}
