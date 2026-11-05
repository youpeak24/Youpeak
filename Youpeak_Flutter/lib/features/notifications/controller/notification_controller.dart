import 'package:get/get.dart';
import 'package:youpeak/features/notifications/api/notification_api.dart';
import 'package:youpeak/features/notifications/model/notification_model.dart';
import 'package:youpeak/core/notification/local_notification_storage.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class NotificationController extends GetxController {
  List<Notification>? mainNotifications;
  bool isLoadingMore = false;

  // Why the server's notifications couldn't be loaded (null when they were),
  // so the page can tell "nothing yet" from "couldn't load".
  NotificationLoadError? loadError;

  Future<void> onGetNotification() async {
    mainNotifications = null;
    loadError = null;
    update(["onGetNotification"]);

    NotificationApiClass.startPagination = 1; // Reset
    NotificationApiClass.hasMoreData = true;

    List<Notification>? apiNotifications;
    try {
      apiNotifications = await NotificationApiClass.callApi();
      if (apiNotifications == null) loadError = NotificationApiClass.lastError ?? NotificationLoadError.failed;
    } catch (e) {
      AppSettings.showLog("Notification load failed => $e");
      loadError = NotificationLoadError.failed;
    }
    List<Notification> localNotifications = [];
    try {
      localNotifications = LocalNotificationStorage.getNotifications();
      for (final n in localNotifications) {
        n.isRead = true; // device-only copies have no server read state
      }
    } catch (e) {
      AppSettings.showLog("Local notifications unreadable => $e");
    }

    // Merge them and avoid duplicates if they share IDs. We'll simply combine them here.
    mainNotifications = [...localNotifications, ...?apiNotifications];

    AppSettings.showLog("Notification Length => ${mainNotifications!.length}");
    update(["onGetNotification"]);
  }

  int get unreadCount => NotificationApiClass.unreadCount;

  /// Mark one read (on open). The dot goes at once; if the server didn't
  /// store it, it comes back on the next refresh.
  Future<void> markRead(Notification n) async {
    if (n.isRead || (n.id ?? "").isEmpty) return;
    n.isRead = true;
    if (NotificationApiClass.unreadCount > 0) NotificationApiClass.unreadCount--;
    update(["onGetNotification"]);
    final ok = await NotificationApiClass.markRead(notificationId: n.id);
    if (!ok) {
      n.isRead = false;
      NotificationApiClass.unreadCount++;
      update(["onGetNotification"]);
    }
  }

  Future<void> markAllRead() async {
    final ok = await NotificationApiClass.markRead();
    if (ok) {
      for (final n in mainNotifications ?? <Notification>[]) {
        n.isRead = true;
      }
      NotificationApiClass.unreadCount = 0;
      update(["onGetNotification"]);
    }
  }

  Future<void> loadMoreNotifications() async {
    if (isLoadingMore || !NotificationApiClass.hasMoreData) return;

    isLoadingMore = true;
    update(["onChangeLoadMore"]);

    NotificationApiClass.startPagination += 1;
    AppSettings.showLog("Loading notification page: ${NotificationApiClass.startPagination}");

    final newNotifications = await NotificationApiClass.callApi();

    if (newNotifications != null && newNotifications.isNotEmpty) {
      mainNotifications?.addAll(newNotifications);
      update(["onGetNotification"]);
    }

    isLoadingMore = false;
    update(["onChangeLoadMore"]);
  }
}
