import 'package:country_picker/country_picker.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_address_to_code_converter.dart';
import 'package:youpeak/features/upload/controller/upload_video_controller.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/settings/app_settings.dart';

class CustomCountryPicker {
  static final uploadVideoController = Get.find<UploadVideoController>();

  static void pickCountry(BuildContext context) {
    showCountryPicker(
      context: context,
      moveAlongWithKeyboard: true,
      countryListTheme: CountryListThemeData(
        flagSize: 25,
        backgroundColor: AppColor.white,
        textStyle: GoogleFonts.urbanist(fontSize: 16, color: Colors.blueGrey),
        bottomSheetHeight: Get.height / 2,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(30.0),
          topRight: Radius.circular(30.0),
        ),
        inputDecoration: InputDecoration(
          contentPadding: EdgeInsets.zero,
          labelText: 'Search',
          hintText: 'Start typing to search',
          prefixIcon: const Icon(Icons.search),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(25),
            borderSide: BorderSide(color: AppColor.grey_400),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(25),
            borderSide: BorderSide(color: AppColor.grey_400),
          ),
        ),
      ),
      onSelect: (Country country) async {
        uploadVideoController.selectCounty.value = country.name;
        AppSettings.showLog("Selected County => ${uploadVideoController.selectCounty.value}");
        CustomAddressToCode.convert(uploadVideoController.selectCounty.value);
      },
    );
  }
}
