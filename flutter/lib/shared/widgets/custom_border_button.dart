import 'package:flutter/material.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';

class CustomBorderButton extends StatelessWidget {
  const CustomBorderButton({super.key, required this.title, this.borderColor, this.titleColor, this.callback});

  final String title;
  final Color? borderColor;
  final Color? titleColor;
  final Callback? callback;

  @override
  Widget build(BuildContext context) {
    // The brand green is too dark to read as a hairline/label on dark surfaces.
    final accent = isDarkMode.value ? AppColor.brightGreen : AppColor.primaryColor;
    return AppPressable(
      onTap: callback,
      haptic: true,
      semanticLabel: title,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        decoration: BoxDecoration(
          border: Border.all(color: borderColor ?? accent, width: 1.4),
          borderRadius: BorderRadius.circular(100),
        ),
        child: Text(
          title,
          textAlign: TextAlign.center,
          style: GoogleFonts.urbanist(
            fontWeight: FontWeight.w700,
            fontSize: 15,
            color: titleColor ?? accent,
          ),
        ),
      ),
    );
  }
}
