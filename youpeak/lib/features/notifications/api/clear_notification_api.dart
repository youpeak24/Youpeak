import 'dart:convert';

import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';

class ClearNotificationApi {
  static Future<bool> callApi({required String loginUserId}) async {
    AppSettings.showLog("Clear Notification Api Calling...");

    final uri = Uri.parse("${Constant.baseURL + Constant.clearNotification}?userId=$loginUserId");

    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.delete(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);

        AppSettings.showLog("Clear Notification Api Response => ${response.body}");

        return jsonResponse["status"];
      } else {
        AppSettings.showLog("Clear Notification Api StateCode Error");
        CustomToast.show(AppStrings.someThingWentWrong.tr);
      }
    } catch (error) {
      AppSettings.showLog("Clear Notification Api Error => $error");
      CustomToast.show(AppStrings.someThingWentWrong.tr);
    }
    return false;
  }
}
