import 'package:flutter/widgets.dart';
import 'package:youpeak/core/platform/app_layout.dart';

// Screen-relative sizes for the phone layouts. They read AppLayout on every
// access (not once at startup), so in the web app they follow the page
// column and the current window size.
class SizeConfig {
  static double get screenWidth => AppLayout.width;
  static double get screenHeight => AppLayout.height;
  static double get blockSizeHorizontal => screenWidth / 100;
  static double get blockSizeVertical => screenHeight / 100;

  static double get largeVideoImageHeight => (AppLayout.height / 4 > 200) ? AppLayout.height / 4 : 200;

  static double get smallVideoImageHeight => (AppLayout.height / 4 > 200) ? AppLayout.height / 7.5 : 110;
  static double get smallVideoImageWidth => AppLayout.width / 2.2;

  // Kept for existing callers; the sizes above are computed on demand.
  void init(BuildContext context) {}
}
