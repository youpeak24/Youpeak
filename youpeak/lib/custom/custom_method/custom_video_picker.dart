import 'dart:io';

import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:youpeak/custom/custom_method/custom_toast.dart';
import 'package:youpeak/custom/custom_ui/loader_ui.dart';
import 'package:youpeak/utils/settings/app_settings.dart';
import 'package:youpeak/utils/string/app_string.dart';

class CustomVideoPicker {
  // Android 13+ needs READ_MEDIA_VIDEO (older Android: READ_EXTERNAL_STORAGE /
  // no-op on the modern Photo Picker). Without this, the gallery pick can
  // return a path the app isn't actually allowed to read, so
  // VideoPlayerController.initialize() fails later and the picked video gets
  // wrongly reported as "not supported".
  static Future<bool> _ensureMediaPermission() async {
    if (!Platform.isAndroid) return true;
    final status = await Permission.videos.status;
    if (status.isGranted) return true;
    final result = await Permission.videos.request();
    return result.isGranted;
  }

  static Future<String?> pickVideo() async {
    try {
      final granted = await _ensureMediaPermission();
      if (!granted) {
        CustomToast.show(AppStrings.pleaseSelectVideo.tr);
        return null;
      }

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
