// ignore_for_file: deprecated_member_use

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';

/// App-wide Material 3 theme.
///
/// Colours come from the YouPeak v3.0 palette (REQ-0139). Everything a screen
/// does not style itself - switches, progress bars, dialogs, sheets, buttons,
/// snackbars, tabs - is themed here, so a new screen looks right by default.
///
/// Note: input decoration is intentionally NOT themed with fills or focus
/// borders. Many existing fields draw their own rounded container and use
/// `InputBorder.none`; a theme-level border would draw a second outline.
class Themes {
  static final light = _build(Brightness.light);
  static final dark = _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;

    final scheme = ColorScheme.fromSeed(
      seedColor: AppColor.primaryColor,
      brightness: brightness,
    ).copyWith(
      primary: isDark ? AppColor.brightGreen : AppColor.primaryColor,
      onPrimary: AppColor.white,
      primaryContainer: isDark ? AppColor.darkForestAccent : AppColor.secondaryMintGreen,
      onPrimaryContainer: isDark ? AppColor.secondaryMintGreen : const Color(0xFF0F3B20),
      secondary: AppColor.darkForestAccent,
      onSecondary: AppColor.white,
      secondaryContainer: isDark ? AppColor.darkForestAccent : AppColor.secondaryMintGreen,
      onSecondaryContainer: isDark ? AppColor.secondaryMintGreen : AppColor.darkForestAccent,
      tertiary: AppColor.goldVipAccent,
      onTertiary: AppColor.black,
      error: AppColor.notificationAccent,
      surface: isDark ? AppColor.mainDark : AppColor.white,
      onSurface: isDark ? AppColor.white : AppColor.primaryTextIcons,
      onSurfaceVariant: isDark ? AppColor.mutedTextDark : AppColor.mutedText,
      surfaceContainerLowest: isDark ? const Color(0xFF151517) : AppColor.white,
      surfaceContainerLow: isDark ? const Color(0xFF212123) : AppColor.lightGreyBG,
      surfaceContainer: isDark ? AppColor.darkElevated : AppColor.searchContainerBg,
      surfaceContainerHigh: isDark ? const Color(0xFF333436) : const Color(0xFFE9EFEB),
      surfaceContainerHighest: isDark ? const Color(0xFF3B3C3F) : const Color(0xFFE2E9E4),
      outline: isDark ? const Color(0xFF5A5D5B) : const Color(0xFF9AA39D),
      outlineVariant: isDark ? AppColor.white.withValues(alpha: 0.12) : AppColor.hairlineLight,
    );

    final baseText = ThemeData(brightness: brightness).textTheme;
    final textTheme = GoogleFonts.urbanistTextTheme(baseText).apply(
      bodyColor: scheme.onSurface,
      displayColor: scheme.onSurface,
    );

    final pill = const StadiumBorder();
    final buttonText = GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: 0.1);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: isDark ? AppColor.mainDark : AppColor.white,
      canvasColor: isDark ? AppColor.mainDark : AppColor.white,
      textTheme: textTheme,
      primaryTextTheme: textTheme,
      iconTheme: IconThemeData(color: isDark ? AppColor.white : AppColor.black),
      splashFactory: InkRipple.splashFactory,
      splashColor: scheme.primary.withValues(alpha: 0.10),
      highlightColor: Colors.transparent,
      hoverColor: scheme.primary.withValues(alpha: 0.06),
      dividerColor: scheme.outlineVariant,
      dividerTheme: DividerThemeData(color: scheme.outlineVariant, thickness: 1),
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: AppColor.transparent,
        iconTheme: IconThemeData(color: isDark ? AppColor.white : AppColor.black),
        systemOverlayStyle: isDark
            ? const SystemUiOverlayStyle(
                statusBarIconBrightness: Brightness.light,
                statusBarColor: Colors.transparent,
                systemNavigationBarIconBrightness: Brightness.light,
                systemNavigationBarDividerColor: AppColor.mainDark,
                systemNavigationBarColor: AppColor.mainDark,
              )
            : const SystemUiOverlayStyle(
                statusBarIconBrightness: Brightness.dark,
                statusBarColor: Colors.white,
                systemNavigationBarIconBrightness: Brightness.dark,
                systemNavigationBarDividerColor: Colors.white,
                systemNavigationBarColor: AppColor.white,
              ),
        backgroundColor: isDark ? AppColor.mainDark : const Color(0XFFFEFEFE),
        titleTextStyle: GoogleFonts.urbanist(
          color: isDark ? AppColor.white : AppColor.black,
          fontSize: 19,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.1,
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: isDark ? AppColor.mainDark : AppColor.white,
        selectedItemColor: AppColor.primaryColor,
        unselectedItemColor: AppColor.grey,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        margin: EdgeInsets.zero,
        color: isDark ? AppColor.darkElevated : AppColor.white,
        surfaceTintColor: AppColor.transparent,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.cardBorder,
          side: BorderSide(color: AppElevation.hairline(isDark)),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: isDark ? AppColor.darkElevated : AppColor.white,
        surfaceTintColor: AppColor.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.sheet)),
        titleTextStyle: GoogleFonts.urbanist(
          fontSize: 20,
          fontWeight: FontWeight.w800,
          color: isDark ? AppColor.white : AppColor.primaryTextIcons,
        ),
        contentTextStyle: GoogleFonts.urbanist(
          fontSize: 15,
          height: 1.4,
          color: isDark ? AppColor.mutedTextDark : AppColor.mutedText,
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: isDark ? AppColor.darkElevated : AppColor.white,
        surfaceTintColor: AppColor.transparent,
        modalBackgroundColor: isDark ? AppColor.darkElevated : AppColor.white,
        elevation: 0,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.sheetBorder),
        clipBehavior: Clip.antiAlias,
        // On a wide window a sheet is a centred panel, not a window-wide bar.
        constraints: const BoxConstraints(maxWidth: 640),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColor.primaryColor,
          foregroundColor: AppColor.white,
          elevation: 0,
          minimumSize: const Size(64, 48),
          padding: const EdgeInsets.symmetric(horizontal: 22),
          shape: pill,
          textStyle: buttonText,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColor.primaryColor,
          foregroundColor: AppColor.white,
          minimumSize: const Size(64, 48),
          padding: const EdgeInsets.symmetric(horizontal: 22),
          shape: pill,
          textStyle: buttonText,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: isDark ? AppColor.white : AppColor.primaryColor,
          minimumSize: const Size(64, 48),
          padding: const EdgeInsets.symmetric(horizontal: 22),
          shape: pill,
          side: BorderSide(color: isDark ? AppColor.white.withValues(alpha: 0.28) : AppColor.primaryColor, width: 1.2),
          textStyle: buttonText,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: isDark ? AppColor.brightGreen : AppColor.primaryColor,
          shape: pill,
          textStyle: buttonText,
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(highlightColor: Colors.transparent),
      ),
      chipTheme: ChipThemeData(
        shape: pill,
        side: BorderSide.none,
        backgroundColor: isDark ? AppColor.darkElevated : AppColor.secondaryMintGreen,
        selectedColor: AppColor.primaryColor,
        checkmarkColor: AppColor.white,
        labelStyle: GoogleFonts.urbanist(fontSize: 13, fontWeight: FontWeight.w700),
        secondaryLabelStyle: GoogleFonts.urbanist(fontSize: 13, fontWeight: FontWeight.w700, color: AppColor.white),
        padding: const EdgeInsets.symmetric(horizontal: 6),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: isDark ? AppColor.darkElevated : AppColor.primaryTextIcons,
        contentTextStyle: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600, color: AppColor.white),
        actionTextColor: AppColor.brightGreen,
        shape: RoundedRectangleBorder(borderRadius: AppRadius.controlBorder),
        elevation: 0,
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: scheme.primary,
        linearTrackColor: isDark ? AppColor.white.withValues(alpha: 0.12) : AppColor.secondaryMintGreen,
        circularTrackColor: Colors.transparent,
        linearMinHeight: 4,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? AppColor.white : (isDark ? AppColor.mutedTextDark : AppColor.white),
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? scheme.primary : (isDark ? AppColor.white.withValues(alpha: 0.18) : const Color(0xFFD5DBD7)),
        ),
        trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) => states.contains(WidgetState.selected) ? scheme.primary : null),
        checkColor: WidgetStateProperty.all(AppColor.white),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
      ),
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) => states.contains(WidgetState.selected) ? scheme.primary : null),
      ),
      sliderTheme: SliderThemeData(
        activeTrackColor: scheme.primary,
        thumbColor: scheme.primary,
        inactiveTrackColor: scheme.primary.withValues(alpha: 0.2),
        overlayColor: scheme.primary.withValues(alpha: 0.12),
      ),
      tabBarTheme: TabBarThemeData(
        labelColor: scheme.primary,
        unselectedLabelColor: isDark ? AppColor.mutedTextDark : AppColor.mutedText,
        indicatorColor: scheme.primary,
        dividerColor: scheme.outlineVariant,
        labelStyle: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w800),
        unselectedLabelStyle: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: isDark ? AppColor.white : AppColor.primaryTextIcons,
        titleTextStyle: GoogleFonts.urbanist(
          fontSize: 15,
          fontWeight: FontWeight.w700,
          color: isDark ? AppColor.white : AppColor.primaryTextIcons,
        ),
        subtitleTextStyle: GoogleFonts.urbanist(
          fontSize: 13,
          color: isDark ? AppColor.mutedTextDark : AppColor.mutedText,
        ),
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: isDark ? AppColor.darkElevated : AppColor.white,
        surfaceTintColor: AppColor.transparent,
        elevation: 6,
        shape: RoundedRectangleBorder(borderRadius: AppRadius.controlBorder),
        textStyle: GoogleFonts.urbanist(fontSize: 14, fontWeight: FontWeight.w600),
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: isDark ? AppColor.darkElevated : AppColor.primaryTextIcons,
          borderRadius: BorderRadius.circular(8),
        ),
        textStyle: GoogleFonts.urbanist(fontSize: 12, fontWeight: FontWeight.w600, color: AppColor.white),
      ),
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: scheme.primary,
        selectionColor: scheme.primary.withValues(alpha: 0.28),
        selectionHandleColor: scheme.primary,
      ),
      scrollbarTheme: ScrollbarThemeData(
        thickness: WidgetStateProperty.all(4),
        radius: const Radius.circular(8),
        thumbColor: WidgetStateProperty.all(scheme.primary.withValues(alpha: 0.35)),
      ),
    );
  }
}
