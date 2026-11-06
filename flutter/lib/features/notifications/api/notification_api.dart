import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/features/notifications/model/notification_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/network/app_session.dart';

class NotificationApiClass {
  static int startPagination = 1; // 1 થી શરૂ
  static int limitPagination = 10;
  static bool hasMoreData = true; // નવું
  static NotificationModel? _notificationModal;

  // Why the last call returned null; null after a successful call.
  static NotificationLoadError? lastError;

  // Unread count reported with the last page (server-side read state).
  static int unreadCount = 0;

  /// Mark one notification read, or all of them when [notificationId] is null.
  static Future<bool> markRead({String? notificationId}) async {
    try {
      final uri = Uri.parse("${Constant.baseURL}client/notification/markRead").replace(
        queryParameters: notificationId == null ? null : {"notificationId": notificationId},
      );
      final headers = await AppSession.authHeaders();
      final response = await http.patch(uri, headers: headers).timeout(const Duration(seconds: 15));
      return response.statusCode == 200 && (json.decode(response.body)["status"] == true);
    } catch (error) {
      AppSettings.showLog("Notification markRead Error => $error");
      return false;
    }
  }

  static Future<List<Notification>?> callApi() async {
    AppSettings.showLog("Notification Api Calling... Page: $startPagination");
    lastError = null;

    // Without a signed-in user there is nothing to ask for (and the old
    // `loginUserId!` here threw outside the try, leaving the page loading).
    final userId = Database.loginUserId;
    if (userId == null || !AppSession.isEstablished) {
      lastError = NotificationLoadError.signInRequired;
      return null;
    }

    try {
      final uri = Uri.parse("${Constant.baseURL + Constant.notification}?userId=$userId&start=$startPagination&limit=$limitPagination");
      AppSettings.showLog("Notification Api uri => $uri");
      final headers = await AppSession.authHeaders();
      final response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 15));

      if (response.statusCode == 401) {
        lastError = NotificationLoadError.signInRequired;
      } else if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        AppSettings.showLog("Notification Api response ==>${jsonResponse}");

        _notificationModal = NotificationModel.fromJson(jsonResponse);

        final notifications = _notificationModal?.notification ?? [];

        unreadCount = jsonResponse["unreadCount"] is num ? (jsonResponse["unreadCount"] as num).toInt() : unreadCount;
        hasMoreData = jsonResponse["hasMore"] is bool ? jsonResponse["hasMore"] as bool : notifications.length >= limitPagination;

        AppSettings.showLog("Page: $startPagination | Got: ${notifications.length} | hasMore: $hasMoreData");
        return notifications;
      } else {
        AppSettings.showLog("Notification Api StatusCode Error");
        lastError = NotificationLoadError.failed;
      }
    } catch (error) {
      AppSettings.showLog("Notification Api Error => $error");
      lastError = NotificationLoadError.failed;
    }
    return null;
  }
}

enum NotificationLoadError { signInRequired, failed }
