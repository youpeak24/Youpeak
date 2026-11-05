import 'package:flutter/material.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/main.dart';

/// Skeleton-loader colours. Light mode sweeps a soft white across pale grey;
/// dark mode sweeps a slightly lighter neutral across the dark card colour, so
/// the highlight is a gentle pulse instead of a white flash.
abstract final class ShimmerPalette {
  static Color get base => isDarkMode.value ? AppColor.darkElevated : const Color(0xFFE9EEEB);
  static Color get highlight => isDarkMode.value ? const Color(0xFF3A3B3E) : const Color(0xFFF7FAF8);
}
