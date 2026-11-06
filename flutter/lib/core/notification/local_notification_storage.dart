import 'package:get_storage/get_storage.dart';
import 'package:youpeak/features/notifications/model/notification_model.dart';
import 'dart:convert';

class LocalNotificationStorage {
  static final _storage = GetStorage();
  static const _key = 'local_notifications';

  static Future<void> saveNotification(Notification notification) async {
    try {
      List<Notification> currentList = getNotifications();
      currentList.insert(0, notification); // Add to top
      final jsonString = json.encode(currentList.map((n) => n.toJson()).toList());
      await _storage.write(_key, jsonString);
    } catch (e) {
      print("Error saving local notification: $e");
    }
  }

  static List<Notification> getNotifications() {
    try {
      final jsonString = _storage.read<String>(_key);
      if (jsonString == null || jsonString.isEmpty) return [];

      final List<dynamic> decodedList = json.decode(jsonString);
      return decodedList.map((item) => Notification.fromJson(item)).toList();
    } catch (e) {
      print("Error getting local notifications: $e");
      return [];
    }
  }

  static Future<void> clearAll() async {
    try {
      await _storage.remove(_key);
    } catch (e) {
      print("Error clearing local notifications: $e");
    }
  }
}
