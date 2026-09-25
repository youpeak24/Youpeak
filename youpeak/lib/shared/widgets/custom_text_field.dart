import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';

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
    return Container(
      height: Get.height / 14.5,
      width: width ?? Get.width / 1.15,
      alignment: Alignment.center,
      padding: const EdgeInsets.only(left: 10),
      decoration: BoxDecoration(
        color: isDarkMode.value
            ? (focusNode.hasFocus)
                ? const Color(0xFF2A1E26)
                : AppColor.secondDarkMode
            : AppColor.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: focusNode.hasFocus ? AppColor.primaryColor : Colors.black12),
      ),
      child: TextFormField(
        keyboardType: keyboardType,
        obscureText: obscureText ?? false,
        cursorColor: AppColor.primaryColor,
        focusNode: focusNode,
        controller: controller,
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
                  color: focusNode.hasFocus ? AppColor.primaryColor : AppColor.grey,
                )
              : null,
          hintText: hintText,
          hintStyle: GoogleFonts.urbanist(textStyle: TextStyle(color: focusNode.hasFocus ? AppColor.primaryColor : AppColor.grey, fontSize: 14)),
          suffixIcon: suffixIconPath != null
              ? GestureDetector(
                  onTap: suffixIconCallback,
                  child: Padding(
                    padding: const EdgeInsets.only(right: 10),
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
