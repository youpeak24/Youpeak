import 'package:flutter/material.dart';

abstract class AppColor {
  // ************** YouPeak UI/UX Spec v3.0 Color Palette System ***************

  static const Color primaryColor = Color(0xFF0A7A44); // Primary Accent (Forest Green)
  static const Color darkForestAccent = Color(0xFF1E4D2B); // Dark Forest Accent
  static const Color secondaryMintGreen = Color(0xFFE8F5E9); // Secondary / Pill BG (Mint Green)
  static const Color goldVipAccent = Color(0xFFFFD700); // Gold VIP Accent [NEW]
  static const Color screenBackground = Color(0xFFFFFFFF); // Screen Background
  static const Color primaryTextIcons = Color(0xFF1C1C1E); // Primary Text & Icons (Dark Charcoal)
  static const Color notificationAccent = Color(0xFFD32F2F); // Notification Accent (Crimson Red)
  static const Color searchContainerBg = Color(0xFFF0F4F1); // Search Bar Container BG

  static const Color white = Colors.white;
  static const Color black = Colors.black; 
  static const Color transparent = Colors.transparent; 

  static const Color lightPink = Color(0xFFE8F5E9);
  static const Color lightPinkBG = Color(0xFF1E4D2B);
  static const Color lightGreyBG = Color(0xFFFAFAFA);

  static const Color orangeColor = Color(0xFFFF981F);
  static const Color orangeTextColor = Color(0xFFF99300);
  static const Color lightOrangeBG = Color(0xFFFFF2D4);

  static const greenLinearGradient = LinearGradient(colors: [Color(0xFF1E4D2B), Color(0xFF0A7A44)]); 
  static const pinkLinearGradient = LinearGradient(colors: [Color(0xFF1E4D2B), Color(0xFF0A7A44)]); 

  static const Color grey = Color(0xff9e9e9e);
  static const Color greyColor = Color(0xFF757575);

  static Color grey_50 = Colors.grey.shade50;
  static Color grey_100 = Colors.grey.shade100; 
  static Color grey_200 = Colors.grey.shade200;
  static Color grey_300 = Colors.grey.shade300;
  static Color grey_400 = Colors.grey.shade400;

  static const Color dotColor = Color(0xFFE0E0E0);

  static const Color lightGreen = Color(0xFFE8F5E9);
  static const Color lightGreen1 = Color(0xFF85FF97);
  static const Color darkGreen = Color(0xFF0A7A44);

  static const Color lightRed = Color(0xFFFFD7D7);
  static const Color lightRed1 = Color(0xFFFF8585);
  static const Color darkRed = Color(0xFFD32F2F);

  static const Color darkGrey = Color(0xFF4C4B4B);

  static const Color green = Colors.green;
  static const Color yellow = Color(0xFFFFD700);

  static const Color logOutColor = Color(0xffF75555);
  static const Color validityColor = Color(0xff616161);
  static const Color cardButtonColor = Color(0xFF0A7A44); 

  static const Color mainDark = Color(0xFF1C1C1E); // Dark Charcoal
  static const Color secondDarkMode = Color(0xFF1E4D2B); // Dark Forest Card Background
  static const Color purpleCardBg = Color(0xFF1E4D2B);
  static const Color purplePillBg = Color(0xFFE8F5E9);
}
