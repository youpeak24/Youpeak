import 'package:flutter/material.dart';
import 'package:get/get.dart';

/// Bottom sheets that stay a sheet on a desktop window.
///
/// `Get.bottomSheet` always stretches to the whole window, which on a wide
/// browser is a bar thousands of pixels across. [AppSheet.show] takes the same
/// arguments but draws the sheet as a centred panel of at most [maxWidth];
/// on a phone (narrower than [maxWidth]) it looks exactly as before.
abstract final class AppSheet {
  static const double maxWidth = 640;

  static Future<T?> show<T>(
    Widget content, {
    Color? backgroundColor,
    double? elevation,
    ShapeBorder? shape,
    bool isScrollControlled = false,
  }) {
    return Get.bottomSheet<T>(
      Builder(
        builder: (context) {
          final theme = Theme.of(context).bottomSheetTheme;
          return Align(
            alignment: Alignment.bottomCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: maxWidth),
              // The route's own sheet is transparent; this Material is the
              // visible panel, with the colour, shape and elevation asked for
              // (or the theme's, as Get.bottomSheet would have used).
              child: Material(
                color: backgroundColor ?? theme.modalBackgroundColor ?? theme.backgroundColor,
                elevation: elevation ?? theme.modalElevation ?? theme.elevation ?? 0,
                shape: shape ?? theme.shape,
                clipBehavior: shape != null || theme.shape != null ? Clip.antiAlias : Clip.none,
                child: content,
              ),
            ),
          );
        },
      ),
      backgroundColor: Colors.transparent,
      elevation: 0,
      isScrollControlled: isScrollControlled,
    );
  }
}
