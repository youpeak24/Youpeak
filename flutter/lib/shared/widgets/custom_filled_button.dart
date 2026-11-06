import 'package:flutter/material.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';

class CustomFilledButton extends StatelessWidget {
  const CustomFilledButton({super.key, required this.title, this.buttonColor, this.titleColor, this.callback});

  final String title;
  final Color? buttonColor;
  final Color? titleColor;
  final Callback? callback;

  @override
  Widget build(BuildContext context) {
    final disabled = callback == null;
    return AppPressable(
      onTap: callback,
      haptic: true,
      semanticLabel: title,
      child: Opacity(
        opacity: disabled ? 0.5 : 1,
        child: Container(
          height: 52,
          width: MediaQuery.of(context).size.width,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            // A caller-chosen colour stays flat; the default brand button
            // carries the brand gradient.
            color: buttonColor ?? AppColor.primaryColor,
            borderRadius: BorderRadius.circular(100),
          ),
          child: Text(
            title,
            textAlign: TextAlign.center,
            style: GoogleFonts.urbanist(
              fontWeight: FontWeight.w700,
              fontSize: 16,
              color: titleColor ?? AppColor.white,
            ),
          ),
        ),
      ),
    );
  }
}
