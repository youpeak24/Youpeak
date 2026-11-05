import 'package:geocoding/geocoding.dart';
import 'package:get/get.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class CustomAddressToCode {
  static final uploadVideoController = Get.find<UploadVideoController>();

  static Future<void> convert(String city) async {
    try {
      List<Location> locations = await locationFromAddress(city);

      if (locations.isNotEmpty) {
        Location location = locations[0];
        uploadVideoController.latitude = location.latitude;
        uploadVideoController.longitude = location.longitude;

        AppSettings.showLog('Latitude => ${uploadVideoController.latitude}, Longitude => ${uploadVideoController.longitude}');
      } else {
        AppSettings.showLog('No coordinates found for the given address.');
      }
    } catch (e) {
      AppSettings.showLog('Error: $e');
    }
  }
}
