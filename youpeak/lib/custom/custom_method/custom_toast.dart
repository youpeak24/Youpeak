import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/utils/colors/app_color.dart';

class CustomToast {
  static void show(String title) {
    Fluttertoast.showToast(
      msg: title,
      backgroundColor: AppColor.grey.withOpacity(0.9),
      textColor: AppColor.white,
      gravity: ToastGravity.BOTTOM,
    );
  }

  /// Milestone toast with a sticker (upload done, tier upgraded...). Native
  /// toasts cannot show images, so this uses an in-app snackbar instead.
  static void celebrate(String title, String sticker) {
    if (Get.context == null) return show(title);
    Get.rawSnackbar(
      messageText: Text(title, style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 15, fontWeight: FontWeight.w700)),
      icon: Padding(padding: const EdgeInsets.only(left: 8), child: Image.asset(sticker, width: 40, height: 40)),
      shouldIconPulse: false,
      backgroundColor: AppColor.darkForestAccent,
      borderRadius: 16,
      margin: const EdgeInsets.all(12),
      snackPosition: SnackPosition.BOTTOM,
      duration: const Duration(seconds: 3),
    );
  }
}
