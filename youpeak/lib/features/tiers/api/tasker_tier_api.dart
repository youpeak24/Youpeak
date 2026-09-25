import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

// Tasker Starter Pass — pay-to-skip ladder that raises daily engagement
// limits and the daily earning cap.
class TaskerTierApi {
  static Future<Map<String, dynamic>> getAvailableTiers() async {
    AppSettings.showLog("Tasker Tier Api Calling...");

    final uri = Uri.parse("${Constant.baseURL}${Constant.getTaskerTiers}?userId=${Database.loginUserId ?? ''}");
    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);
      AppSettings.showLog("Tasker Tier Api Response => ${response.body}");
      if (response.statusCode == 200) {
        return Map<String, dynamic>.from(json.decode(response.body));
      }
    } catch (error) {
      AppSettings.showLog("Tasker Tier Api Error => $error");
    }
    return {"status": false, "message": "Something went wrong."};
  }
}
