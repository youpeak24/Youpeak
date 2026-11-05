import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/main.dart' show isDarkMode;
import 'package:youpeak/shared/widgets/app_artwork.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';

/// Shown in place of a page while the device is offline.
///
/// With a [callback] it offers a Retry; without one it says it is waiting for
/// the connection (the app re-checks every few seconds on its own).
class NetworkIssueView extends StatelessWidget {
  const NetworkIssueView({super.key, this.callback});

  final Callback? callback;

  @override
  Widget build(BuildContext context) {
    final dark = isDarkMode.value;
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const AppArtwork(asset: AppVisuals.offline, height: 150),
              const SizedBox(height: 20),
              Text(
                AppStrings.noInternetConnection.tr,
                textAlign: TextAlign.center,
                style: GoogleFonts.urbanist(fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.3),
              ),
              const SizedBox(height: 8),
              Text(
                AppStrings.pleaseCheckYourInternetAndTryAgain.tr,
                textAlign: TextAlign.center,
                style: GoogleFonts.urbanist(
                  fontSize: 15,
                  height: 1.4,
                  fontWeight: FontWeight.w500,
                  color: dark ? AppColor.mutedTextDark : AppColor.mutedText,
                ),
              ),
              const SizedBox(height: 24),
              if (callback != null)
                AppPressable(
                  onTap: callback,
                  haptic: true,
                  semanticLabel: AppStrings.retry.tr,
                  child: Container(
                    height: 48,
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    decoration: BoxDecoration(color: AppColor.primaryColor, borderRadius: BorderRadius.circular(100)),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const AppIcon(AppIcons.extraRetry, size: 20, color: AppColor.white),
                        const SizedBox(width: 8),
                        Text(AppStrings.retry.tr, style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w800, color: AppColor.white)),
                      ],
                    ),
                  ),
                )
              else
                const SizedBox(
                  height: 22,
                  width: 22,
                  child: CircularProgressIndicator(strokeWidth: 2.6, strokeCap: StrokeCap.round, color: AppColor.primaryColor),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
