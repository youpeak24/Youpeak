import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/notifications/model/notification_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class NotificationApiClass {
  static int startPagination = 1; // 1 થી શરૂ
  static int limitPagination = 10;
  static bool hasMoreData = true; // નવું
  static NotificationModel? _notificationModal;

  static Future<List<Notification>?> callApi() async {
    AppSettings.showLog("Notification Api Calling... Page: $startPagination");

    final uri =
        Uri.parse("${Constant.baseURL + Constant.notification}?userId=${Database.loginUserId!}&start=$startPagination&limit=$limitPagination");

    AppSettings.showLog("Notification Api uri => $uri");
    final headers = {"key": Constant.secretKey};

    try {
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        AppSettings.showLog("Notification Api response ==>${jsonResponse}");

        _notificationModal = NotificationModel.fromJson(jsonResponse);

        final notifications = _notificationModal?.notification ?? [];

        hasMoreData = notifications.length >= limitPagination;

        AppSettings.showLog("Page: $startPagination | Got: ${notifications.length} | hasMore: $hasMoreData");
        return notifications;
      } else {
        AppSettings.showLog("Notification Api StatusCode Error");
      }
    } catch (error) {
      AppSettings.showLog("Notification Api Error => $error");
    }
    return null;
  }
}
