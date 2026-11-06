import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class CreateChannelApi {
  static bool? status;
  static String? message;

  /// Machine-readable reason from the server (CHANNEL_NAME_TAKEN,
  /// CHANNEL_NAME_INVALID, ...), empty when there was none.
  static String code = "";

  /// The created (or already existing) channel's id.
  static String channelId = "";

  /// True when the account already had a channel (a retry, a second tab).
  static bool alreadyExisted = false;

  static Future<void>? _running;

  /// One request at a time: a second tap while the first is running waits for
  /// the same request instead of sending another.
  static Future<void> callApi() => _running ??= _call().whenComplete(() => _running = null);

  static Future<void> _call() async {
    status = null;
    message = "";
    code = "";
    channelId = "";
    alreadyExisted = false;
    AppSettings.showLog("Create Channel Api Calling...");

    final uri = Uri.parse('${Constant.baseURL + Constant.createChannel}?userId=${Database.loginUserId}');

    final headers = await AppSession.authHeaders({"Content-Type": 'application/json'});
    if (!headers.containsKey("Authorization")) {
      message = "Your session has ended. Please sign in again.";
      return;
    }

    // isChannel must travel in the body — the backend's allowedFields whitelist
    // (client/user/update) only ever reads req.body, never req.query.
    final body = json.encode({
      "fullName": AppSettings.nameController.text.trim(),
      "channelType": AppSettings.channelType.value,
      "descriptionOfChannel": AppSettings.channelDescriptionController.text.trim(),
      "isChannel": true,
    });

    try {
      final response = await http.patch(uri, headers: headers, body: body).timeout(const Duration(seconds: 30));

      Map<String, dynamic> jsonResponse = const {};
      try {
        final decoded = json.decode(response.body);
        if (decoded is Map<String, dynamic>) jsonResponse = decoded;
      } catch (_) {}

      code = (jsonResponse["code"] ?? "").toString();
      if (response.statusCode == 200) {
        status = jsonResponse["status"] is bool ? jsonResponse["status"] : null;
        message = (jsonResponse["message"] ?? "").toString();
        channelId = (jsonResponse["channelId"] ?? "").toString();
        alreadyExisted = jsonResponse["alreadyExists"] == true;
        AppSettings.showLog("Create Channel Api Response => ${response.body}");
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        status = false;
        message = "Your session has ended. Please sign in again.";
      } else {
        status = false;
        message = (jsonResponse["message"] ?? "").toString();
        AppSettings.showLog("Create Channel Api Error => ${response.statusCode} $code");
      }
    } on TimeoutException {
      message = "The server took too long to answer. Please try again.";
      AppSettings.showLog("Create Channel Api timed out");
    } catch (error) {
      message = "Could not reach the server. Check your connection and try again.";
      AppSettings.showLog("Create Channel Api Error => $error");
    }
  }
}
