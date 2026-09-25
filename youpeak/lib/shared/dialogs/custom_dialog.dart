import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/shared/widgets/loader_ui.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/theme/app_style.dart';

class CustomDialog {
  static void show(String image, String title, String subTitle) {
    Get.defaultDialog(
      title: "",
      barrierDismissible: false,
      backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
      content: Container(
        height: Get.height / 2.15,
        padding: EdgeInsets.only(left: SizeConfig.blockSizeHorizontal * 2, right: SizeConfig.blockSizeHorizontal * 2),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(20)),
        child: Column(
          children: [
            Container(
              height: Get.height / 5.6,
              width: Get.width / 1.9,
              decoration: BoxDecoration(image: DecorationImage(image: AssetImage(image))),
            ),
            const SizedBox(height: 10),
            Text(title, style: congratulationsStyle, textAlign: TextAlign.center),
            const SizedBox(height: 20),
            Text(subTitle, style: createPinNoteStyle, textAlign: TextAlign.center),
            const SizedBox(height: 20),
            const LoaderUi(),
          ],
        ),
      ),
    );
  }
}
