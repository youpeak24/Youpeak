import 'package:flutter/material.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/theme/app_color.dart';

class CustomBorderButton extends StatelessWidget {
  const CustomBorderButton({super.key, required this.title, this.borderColor, this.titleColor, this.callback});

  final String title;
  final Color? borderColor;
  final Color? titleColor;
  final Callback? callback;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: callback,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 5),
        decoration: BoxDecoration(
          border: Border.all(color: borderColor ?? AppColor.primaryColor),
          borderRadius: BorderRadius.circular(100),
        ),
        child: Text(
          title,
          textAlign: TextAlign.center,
          style: GoogleFonts.urbanist(
            fontWeight: FontWeight.w600,
            fontSize: 16,
            color: titleColor ?? AppColor.primaryColor,
          ),
        ),
      ),
    );
  }
}
