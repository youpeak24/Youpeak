import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/platform/local_media.dart';

class CustomImagePicker {
  static Future<void> pickImage(ImageSource imageSource) async {
    try {
      Get.dialog(const LoaderUi(color: AppColor.white), barrierDismissible: false);
      final image = await ImagePicker().pickImage(source: imageSource);
      if (image != null) {
        AppSettings.showLog("Pick Image Path => ${image.path}");
        AppSettings.pickImagePath.value = LocalMedia.remember(image);
        Get.close(2);
      } else {
        Get.close(2);
      }
    } catch (e) {
      Get.close(2);
      AppSettings.showLog("Image Picker Error => $e");
    }
  }
}
