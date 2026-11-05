import 'package:youpeak/core/platform/app_layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';

class CustomTextFieldView extends StatelessWidget {
  const CustomTextFieldView({
    super.key,
    this.hintText,
    this.obscureText,
    this.prefixIconPath,
    this.suffixIconPath,
    this.suffixIconCallback,
    required this.focusNode,
    required this.controller,
    this.keyboardType,
    this.width,
  });

  final String? hintText;
  final bool? obscureText;
  final FocusNode focusNode;
  final String? prefixIconPath;
  final String? suffixIconPath;
  final Callback? suffixIconCallback;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  final double? width;

  @override
  Widget build(BuildContext context) {
    final dark = isDarkMode.value;
    final focused = focusNode.hasFocus;
    return AnimatedContainer(
      duration: AppMotion.of(context),
      curve: AppMotion.curve,
      height: 56,
      width: width ?? AppLayout.width / 1.15,
      alignment: Alignment.center,
      padding: const EdgeInsets.only(left: 14),
      decoration: BoxDecoration(
        color: dark
            ? (focused ? AppColor.darkElevated : AppColor.secondDarkMode)
            : (focused ? AppColor.white : AppColor.lightGreyBG),
        borderRadius: BorderRadius.circular(AppRadius.control),
        border: Border.all(
          color: focused ? AppColor.primaryColor : AppElevation.hairline(dark),
          width: focused ? 1.6 : 1,
        ),
      ),
      child: TextFormField(
        keyboardType: keyboardType,
        obscureText: obscureText ?? false,
        cursorColor: AppColor.primaryColor,
        focusNode: focusNode,
        controller: controller,
        style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w600),
        decoration: InputDecoration(
          isDense: true,
          suffixIconConstraints: const BoxConstraints(
            minWidth: 2,
            minHeight: 2,
          ),
          prefixIconConstraints: const BoxConstraints(
            minWidth: 2,
            minHeight: 2,
          ),
          border: InputBorder.none,
          icon: prefixIconPath != null
              ? Image(
                  image: AssetImage(prefixIconPath!),
                  height: 22,
                  width: 22,
                  color: focused ? AppColor.primaryColor : AppColor.grey,
                )
              : null,
          hintText: hintText,
          hintStyle: GoogleFonts.urbanist(textStyle: TextStyle(color: dark ? AppColor.mutedTextDark : AppColor.mutedText, fontSize: 15, fontWeight: FontWeight.w500)),
          suffixIcon: suffixIconPath != null
              ? GestureDetector(
                  onTap: suffixIconCallback,
                  child: Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: Image.asset(
                      suffixIconPath!,
                      color: Colors.grey,
                      width: 24,
                      height: 24,
                    ),
                  ),
                )
              : null,
        ),
      ),
    );
  }
}
