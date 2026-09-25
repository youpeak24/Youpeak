import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:get/get.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';

class LoaderUi extends StatelessWidget {
  const LoaderUi({super.key, this.color});

  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Obx(() => Center(child: SpinKitCircle(color: isDarkMode.value ? AppColor.white : (color ?? AppColor.primaryColor), size: 60)));
  }
}
