import 'package:flutter/widgets.dart';
import 'package:get/get.dart';

class SizeConfig {
  static late double screenWidth;
  static late double screenHeight;
  static late double blockSizeHorizontal;
  static late double blockSizeVertical;

  static double largeVideoImageHeight = (Get.height / 4 > 200) ? Get.height / 4 : 200;

  static double smallVideoImageHeight = (Get.height / 4 > 200) ? Get.height / 7.5 : 110;
  static double smallVideoImageWidth = Get.width / 2.2;

  void init(BuildContext context) {
    screenWidth = MediaQuery.of(context).size.width;
    screenHeight = MediaQuery.of(context).size.height;
    blockSizeHorizontal = screenWidth / 100;
    blockSizeVertical = screenHeight / 100;
  }
}
