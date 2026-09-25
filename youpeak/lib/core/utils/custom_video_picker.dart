import 'dart:io';

import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';

class CustomVideoPicker {
  // Best-effort permission request only — never blocks the picker. On
  // Android 11+ (and pre-11 with Play services), image_picker uses the
  // system Photo Picker, which grants scoped per-file access regardless of
  // these app permissions, so a "denied" result here must not stop the
  // user from picking a video. This just makes sure the OS dialog is shown
  // (and covers the older/legacy picker fallback some OEMs still use).
  static Future<void> _requestMediaPermission() async {
    if (!Platform.isAndroid) return;
    try {
      final videosStatus = await Permission.videos.status;
      if (!videosStatus.isGranted && !videosStatus.isLimited) {
        await Permission.videos.request();
      }
    } catch (e) {
      AppSettings.showLog("Permission.videos request failed: $e");
    }
    try {
      final storageStatus = await Permission.storage.status;
      if (!storageStatus.isGranted && !storageStatus.isLimited) {
        await Permission.storage.request();
      }
    } catch (e) {
      AppSettings.showLog("Permission.storage request failed: $e");
    }
  }

  static Future<String?> pickVideo() async {
    try {
      await _requestMediaPermission();

      Get.dialog(barrierDismissible: false, const LoaderUi());
      final videoPath = await ImagePicker().pickVideo(source: ImageSource.gallery);
      if (videoPath != null) {
        Get.back();
        return videoPath.path;
      } else {
        Get.back();
        CustomToast.show(AppStrings.pleaseSelectVideo.tr);
        return null;
      }
    } catch (e) {
      if (Get.isDialogOpen ?? false) Get.back();
      AppSettings.showLog("Error => Video Picker Error: $e");
      return null;
    }
  }
}
