// ignore_for_file: deprecated_member_use

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/theme/app_color.dart';

class Themes {
  static final light = ThemeData(
    scaffoldBackgroundColor: AppColor.white,
    brightness: Brightness.light,
    splashColor: Colors.transparent,
    highlightColor: Colors.transparent,
    iconTheme: const IconThemeData(color: AppColor.black),
    appBarTheme: AppBarTheme(
      surfaceTintColor: AppColor.transparent,
      iconTheme: const IconThemeData(color: AppColor.black),
      systemOverlayStyle: const SystemUiOverlayStyle(
        statusBarIconBrightness: Brightness.dark,
        statusBarColor: Colors.white,
        systemNavigationBarIconBrightness: Brightness.dark,
        systemNavigationBarDividerColor: Colors.white,
        systemNavigationBarColor: AppColor.white,
      ),
      backgroundColor: const Color(0XFFFEFEFE),
      titleTextStyle: GoogleFonts.urbanist(
        color: AppColor.black,
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
    ),
  );

  static final dark = ThemeData.dark().copyWith(
    scaffoldBackgroundColor: AppColor.mainDark,
    // backgroundColor: AppColors.mainDark,
    brightness: Brightness.dark,
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Colors.transparent,
    ),
    appBarTheme: AppBarTheme(
      iconTheme: const IconThemeData(color: AppColor.white),
      systemOverlayStyle: const SystemUiOverlayStyle(
        statusBarIconBrightness: Brightness.light,
        statusBarColor: Colors.transparent,
        systemNavigationBarIconBrightness: Brightness.light,
        systemNavigationBarDividerColor: AppColor.mainDark,
        systemNavigationBarColor: AppColor.mainDark,
      ),
      backgroundColor: AppColor.mainDark,
      surfaceTintColor: AppColor.transparent,
      titleTextStyle: GoogleFonts.urbanist(
        color: AppColor.white,
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
    ),
    iconTheme: const IconThemeData(color: AppColor.white),
  );
}
