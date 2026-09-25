import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';

TextStyle get titleStyle {
  return GoogleFonts.urbanist(fontSize: 30, fontWeight: FontWeight.bold);
}

TextStyle get splashTitleStyle {
  return GoogleFonts.urbanist(
      fontSize: 48, fontWeight: FontWeight.bold, color: AppColor.white);
}

TextStyle get onBoardingTextStyle {
  return GoogleFonts.urbanist(fontSize: 26, fontWeight: FontWeight.bold);
}

TextStyle get onBoardingButtonTextStyle {
  return GoogleFonts.urbanist(
      fontWeight: FontWeight.bold, fontSize: 16, color: AppColor.white);
}

TextStyle get cardButtonStyle {
  return GoogleFonts.urbanist(
      fontWeight: FontWeight.w600,
      fontSize: 16,
      color: isDarkMode.value ? AppColor.white : AppColor.primaryColor);
}

TextStyle get letsInStyle {
  return GoogleFonts.urbanist(fontSize: 35, fontWeight: FontWeight.bold);
}

TextStyle get loginMethodStyle {
  return GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600);
}

TextStyle get orStyle {
  return GoogleFonts.urbanist(
      fontSize: 16, color: Colors.grey, fontWeight: FontWeight.bold);
}

TextStyle get createAccountStyle {
  return GoogleFonts.urbanist(fontSize: 25, fontWeight: FontWeight.bold);
}

TextStyle get rememberStyle {
  return GoogleFonts.urbanist(
    fontSize: 14,
    fontWeight: FontWeight.w600,
  );
}

TextStyle get shortsStyle {
  return GoogleFonts.urbanist(
    textStyle: const TextStyle(
      color: AppColor.white,
      fontSize: 14,
      fontWeight: FontWeight.w600,
    ),
  );
}

TextStyle get titalstyle5 {
  return GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w500);
}

TextStyle get forGetPasswordStyle {
  return GoogleFonts.urbanist(
      color: AppColor.primaryColor, fontWeight: FontWeight.w500, fontSize: 15);
}

TextStyle get profileTitleStyle {
  return GoogleFonts.urbanist(fontSize: 19, fontWeight: FontWeight.bold);
}

TextStyle get answerStyle {
  return GoogleFonts.urbanist(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: isDarkMode.value
        ? AppColor.white.withOpacity(0.5)
        : const Color(0xff424242),
  );
}

TextStyle get fillYourProfileStyle {
  return GoogleFonts.urbanist(
    textStyle: const TextStyle(
      color: AppColor.grey,
      fontSize: 14,
    ),
  );
}

TextStyle get skipStyle {
  return GoogleFonts.urbanist(
    fontWeight: FontWeight.bold,
    fontSize: 15,
    color: isDarkMode.value ? AppColor.white : AppColor.primaryColor,
  );
}

TextStyle get getStartStyle {
  return GoogleFonts.urbanist(
      fontWeight: FontWeight.w600, fontSize: 16, color: AppColor.white);
}

TextStyle get createPinNoteStyle {
  return GoogleFonts.urbanist(fontSize: 15);
}

TextStyle get congratulationsStyle {
  return GoogleFonts.urbanist(
    color: AppColor.primaryColor,
    fontWeight: FontWeight.bold,
    fontSize: 20,
  );
}

TextStyle get optMethodStyle {
  return GoogleFonts.urbanist(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: AppColor.grey,
  );
}

TextStyle get titalstyle1 {
  return GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w900);
}

TextStyle get paymentNameStyle {
  return GoogleFonts.urbanist(
    fontSize: 16,
    fontWeight: FontWeight.bold,
  );
}

TextStyle get settingsStyle {
  return GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w600);
}

TextStyle get labelStyle {
  return GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold);
}

TextStyle get titalstyle6 {
  return GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold);
}

TextStyle get bottomstyle {
  return GoogleFonts.urbanist(
    fontSize: 15,
    fontWeight: FontWeight.w600,
    color: isDarkMode.value
        ? AppColor.white.withOpacity(0.5)
        : const Color(0xff424242),
  );
}
