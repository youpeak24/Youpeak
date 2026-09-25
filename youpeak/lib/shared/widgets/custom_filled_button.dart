import 'package:flutter/material.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/theme/app_color.dart';

class CustomFilledButton extends StatelessWidget {
  const CustomFilledButton({super.key, required this.title, this.buttonColor, this.titleColor, this.callback});

  final String title;
  final Color? buttonColor;
  final Color? titleColor;
  final Callback? callback;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: callback,
      child: Container(
        height: 48,
        width: MediaQuery.of(context).size.width,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: buttonColor ?? AppColor.primaryColor,
          borderRadius: BorderRadius.circular(100),
        ),
        child: Text(
          title,
          textAlign: TextAlign.center,
          style: GoogleFonts.urbanist(
            fontWeight: FontWeight.w600,
            fontSize: 16,
            color: titleColor ?? AppColor.white,
          ),
        ),
      ),
    );
  }
}
