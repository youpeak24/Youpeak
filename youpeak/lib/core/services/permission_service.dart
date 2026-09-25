import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:permission_handler/permission_handler.dart';

class PermissionService {
  static Future<bool> requestMicPermission() async {
    var status = await Permission.microphone.status;

    if (status.isGranted) {
      return true; // Already granted
    } else if (status.isDenied) {
      // Request permission
      status = await Permission.microphone.request();
      return status.isGranted;
    } else if (status.isPermanentlyDenied) {
      // Show settings dialog
      Get.dialog(
        AlertDialog(
          title: const Text("Microphone Permission"),
          content: const Text("Microphone access is required for voice search.\nPlease enable it in settings."),
          actions: [
            TextButton(
              onPressed: () => Get.back(),
              child: const Text("Cancel"),
            ),
            TextButton(
              onPressed: () {
                openAppSettings(); // Open phone settings
                Get.back();
              },
              child: const Text("Open Settings"),
            ),
          ],
        ),
      );
      return false;
    }
    return false;
  }
}
