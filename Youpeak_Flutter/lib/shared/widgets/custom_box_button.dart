import 'package:flutter/material.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';

class CustomBoxButton extends StatelessWidget {
  const CustomBoxButton({super.key, required this.child, required this.callback});

  final Widget child;
  final Callback callback;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: callback,
      child: Container(
        height: 55,
        width: 90,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isDarkMode.value ? const Color(0xff35383F) : const Color(0xffeeeeee)),
          color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
        ),
        child: Center(child: child),
      ),
    );
  }
}
