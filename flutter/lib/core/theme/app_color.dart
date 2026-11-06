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
  static const Color darkSurface = Color(0xFF0F172A); // Dark Surface / Modal BG (Peak Boost sheet, player overlay)
  static const Color darkCard = Color(0xFF1E293B); // Card background (dark state)
  static const Color darkCardBorder = Color(0xFF475569); // Card border (dark state)
  static const Color darkCardSelected = Color(0xFF312E81); // Selected card (dark state)
  static const Color coinGold = Color(0xFFFACC15); // Coin accent
  static const LinearGradient peakBoostGradient = LinearGradient(colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)]);

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

  // Extensions of the v3.0 palette (the tokens above are spec-pinned and must
  // keep their values). Neutral surfaces for separation, never new brand hues.
  static const Color hairlineLight = Color(0xFFE6ECE8); // 1px dividers / card borders on white
  static const Color mutedText = Color(0xFF6B7280); // secondary text on light (AA on white)
  static const Color mutedTextDark = Color(0xFFA3A8A5); // secondary text on dark surfaces
  static const Color darkElevated = Color(0xFF2A2B2D); // raised neutral surface on mainDark
  static const Color brightGreen = Color(0xFF16A35A); // primary, lifted for dark backgrounds
  // Logo identity: green -> teal/cyan -> blue (sampled from the canonical logo,
  // deepened a little so white glyphs and text stay readable on top).
  static const Color brandTeal = Color(0xFF08AFA6);
  static const Color brandBlue = Color(0xFF1560F0);
  // Reserved for brand moments (Create, avatar rings, premium banner, splash).
  // Buttons, links and chips use the solid [primaryColor].
  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1FBF52), brandTeal, brandBlue],
  );
  // The same three hues, deep enough for a full-screen background.
  static const LinearGradient brandDeepGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF063D2A), Color(0xFF0A6F6B), Color(0xFF0B4CC4)],
    stops: [0.0, 0.55, 1.0],
  );
  static const LinearGradient goldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFFE259), Color(0xFFFFD700), Color(0xFFF2B600)],
  );

  static const Color mainDark = Color(0xFF1C1C1E); // Dark Charcoal
  static const Color secondDarkMode = Color(0xFF1E4D2B); // Dark Forest Card Background
  static const Color purpleCardBg = Color(0xFF1E4D2B);
  static const Color purplePillBg = Color(0xFFE8F5E9);
}
