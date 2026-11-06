import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:youpeak/core/theme/app_color.dart';

/// Layout and motion constants shared by every screen, so spacing, corner
/// radii and animation timing stay consistent instead of drifting per file.
abstract final class AppSpace {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;

  /// Left/right margin of full-width content on phones.
  static const double gutter = 16;
}

abstract final class AppRadius {
  static const double chip = 20;
  static const double control = 14;
  static const double card = 18;
  static const double sheet = 28;

  static BorderRadius get cardBorder => BorderRadius.circular(card);
  static BorderRadius get controlBorder => BorderRadius.circular(control);
  static const BorderRadius sheetBorder = BorderRadius.vertical(top: Radius.circular(sheet));
}

abstract final class AppMotion {
  static const Duration fast = Duration(milliseconds: 140);
  static const Duration base = Duration(milliseconds: 220);
  static const Duration slow = Duration(milliseconds: 360);
  static const Curve curve = Curves.easeOutCubic;

  /// [d], or no animation when the system asks for reduced motion
  /// (Android "Remove animations", iOS "Reduce Motion").
  static Duration of(BuildContext context, [Duration d = base]) => MediaQuery.disableAnimationsOf(context) ? Duration.zero : d;
}

/// Shadows and hairlines. Light surfaces separate with a soft, low shadow;
/// dark surfaces have no visible shadow, so they separate with a hairline.
abstract final class AppElevation {
  static List<BoxShadow> card(bool dark) => dark
      ? const []
      : [
          BoxShadow(color: const Color(0xFF0A2A18).withValues(alpha: 0.08), blurRadius: 18, offset: const Offset(0, 6)),
          BoxShadow(color: const Color(0xFF0A2A18).withValues(alpha: 0.04), blurRadius: 3, offset: const Offset(0, 1)),
        ];

  static List<BoxShadow> glow(Color color, {double strength = 0.38}) => [
        BoxShadow(color: color.withValues(alpha: strength), blurRadius: 22, offset: const Offset(0, 8)),
      ];

  static Color hairline(bool dark) => dark ? AppColor.white.withValues(alpha: 0.10) : AppColor.hairlineLight;
}

/// Light taps that make controls feel physical. Safe on every platform; the
/// web build ignores haptics.
abstract final class AppHaptics {
  static void tap() => HapticFeedback.selectionClick();
  static void press() => HapticFeedback.lightImpact();
}
