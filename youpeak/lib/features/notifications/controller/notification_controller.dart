import 'package:get/get.dart';
import 'package:youpeak/features/notifications/api/notification_api.dart';
import 'package:youpeak/features/notifications/model/notification_model.dart';
import 'package:youpeak/core/notification/local_notification_storage.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class NotificationController extends GetxController {
  List<Notification>? mainNotifications;
  bool isLoadingMore = false;

  Future<void> onGetNotification() async {
    mainNotifications = null;
    update(["onGetNotification"]);

    NotificationApiClass.startPagination = 1; // Reset
    NotificationApiClass.hasMoreData = true;

    final apiNotifications = (await NotificationApiClass.callApi()) ?? [];
    final localNotifications = LocalNotificationStorage.getNotifications();
    
    // Merge them and avoid duplicates if they share IDs. We'll simply combine them here.
    mainNotifications = [...localNotifications, ...apiNotifications];
    
    AppSettings.showLog("Notification Length => ${mainNotifications!.length}");
    update(["onGetNotification"]);
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
