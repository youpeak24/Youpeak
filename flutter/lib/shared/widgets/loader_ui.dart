import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';

/// Centered brand-coloured spinner used for page and dialog loading states.
class LoaderUi extends StatelessWidget {
  const LoaderUi({super.key, this.color});

  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Obx(
      () => Center(
        child: SizedBox(
          height: 44,
          width: 44,
          child: CircularProgressIndicator(
            strokeWidth: 3.6,
            strokeCap: StrokeCap.round,
            color: isDarkMode.value ? AppColor.white : (color ?? AppColor.primaryColor),
          ),
        ),
      ),
    );
  }
}
