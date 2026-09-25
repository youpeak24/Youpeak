import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class CreateChannelApi {
  static bool? status;
  static String? message;

  static Future<void> callApi() async {
    status = null;
    message = "";
    AppSettings.showLog("Create Channel Api Calling...");

    final uri = Uri.parse('${Constant.baseURL + Constant.createChannel}?userId=${Database.loginUserId}');

    final headers = {"key": Constant.secretKey, "Content-Type": 'application/json'};

    // isChannel must travel in the body — the backend's allowedFields whitelist
    // (client/user/update) only ever reads req.body, never req.query, so a
    // query-string isChannel was silently ignored and the channel flag never
    // actually flipped to true no matter how many times this was called.
    final body = json.encode({
      "fullName": AppSettings.nameController.text,
      "channelType": AppSettings.channelType.value.toString(),
      "descriptionOfChannel": AppSettings.channelDescriptionController.text,
      "isChannel": true,
    });

    try {
      final response = await http.patch(uri, headers: headers, body: body);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        status = jsonResponse["status"];
        message = jsonResponse["message"];

        AppSettings.showLog("Create Channel Api Response => ${response.body}");
      } else {
        AppSettings.showLog("Create Channel Api Error => ${response.reasonPhrase.toString()}");
      }
    } catch (error) {
      AppSettings.showLog("Create Channel Api Error => $error");
    }
  }
}
