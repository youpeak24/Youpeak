import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

class PermissionHandler {
  static Future<void> requestPermission() async {
    try {
      debugPrint("Get Notification Request...");
      PermissionStatus notificationStatus = await Permission.notification.request();
      if (notificationStatus != PermissionStatus.granted) {
        debugPrint('Error: Notification permission not granted!!!');
      }
    } on Exception catch (error) {
      debugPrint("[ERROR], request Notification permission exception, $error");
    }
  }
}
