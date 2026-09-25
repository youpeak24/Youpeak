import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class EditVideoApi {
  static Future<bool?> callApi({
    required String loginUserId,
    required String videoId,
    required String channelId,
    required int videoType,
    required String title,
    required String description,
  }) async {
    AppSettings.showLog("Edit Video Api Calling...");

    try {
      final headers = {"key": Constant.secretKey, "Content-Type": 'application/json'};

      final uri = Uri.parse('${Constant.baseURL + Constant.editVideo}?userId=$loginUserId&videoId=$videoId&channelId=$channelId&videoType=$videoType');

      final body = json.encode({"title": title, "description": description});

      final response = await http.patch(uri, body: body, headers: headers);

      final jsonResponse = jsonDecode(response.body);

      AppSettings.showLog("Edit Video Api Response => ${response.body}");

      return jsonResponse["status"];
    } catch (e) {
      AppSettings.showLog("Edit Video Api Error => $e");
      return null;
    }
  }
}
