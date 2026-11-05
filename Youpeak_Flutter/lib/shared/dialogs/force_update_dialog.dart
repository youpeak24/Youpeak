import 'package:flutter/material.dart';
import 'package:youpeak/shared/widgets/app_artwork.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/settings/admin_settings_api.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:youpeak/core/platform/platform_info.dart';


class ForceUpdateDialog extends StatefulWidget {
  const ForceUpdateDialog({super.key});

  @override
  State<ForceUpdateDialog> createState() => _ForceUpdateDialogState();
}

class _ForceUpdateDialogState extends State<ForceUpdateDialog> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    _scaleAnimation = CurvedAnimation(parent: _controller, curve: Curves.elasticOut);
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async => false,
      child: Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 24),
        backgroundColor: Colors.transparent,
        child: ScaleTransition(
          scale: _scaleAnimation,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              color: isDarkMode.value ? AppColor.darkElevated : Colors.white,
              boxShadow: [
                BoxShadow(
                  color: AppColor.primaryColor.withOpacity(0.3),
                  blurRadius: 30,
                  offset: const Offset(0, 15),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Animated Icon
                  TweenAnimationBuilder(
                    duration: const Duration(seconds: 2),
                    tween: Tween<double>(begin: 0, end: 1),
                    builder: (context, double value, child) {
                      return Transform.scale(
                        scale: 1 + (0.08 * (1 - (value - 0.5).abs() * 2)),
                        child: const AppArtwork(asset: AppVisuals.update, height: 132),
                      );
                    },
                  ),

                  const SizedBox(height: 24),

                  // Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColor.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.auto_awesome, color: AppColor.primaryColor, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          "New Version",
                          style: GoogleFonts.urbanist(
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                            color: AppColor.primaryColor,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Title
                  Text(
                    "Update Required",
                    style: GoogleFonts.urbanist(
                      fontWeight: FontWeight.w700,
                      fontSize: 24,
                      color: isDarkMode.value ? AppColor.white : AppColor.black,
                    ),
                    textAlign: TextAlign.center,
                  ),

                  const SizedBox(height: 12),

                  // Description
                  Text(
                    "Please update to the latest version to continue using the app with new features and improvements.",
                    style: GoogleFonts.urbanist(
                      fontWeight: FontWeight.w400,
                      fontSize: 14,
                      color: isDarkMode.value ? AppColor.mutedTextDark : AppColor.black.withValues(alpha: 0.65),

                    ),
                    textAlign: TextAlign.center,
                    maxLines: 3,
                  ),

                  const SizedBox(height: 28),

                  // Update Button
                  InkWell(
                    onTap: _openStore,
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      width: double.infinity,
                      height: 56,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        gradient: LinearGradient(
                          colors: [
                            AppColor.primaryColor,
                            AppColor.primaryColor.withOpacity(0.8),
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColor.primaryColor.withOpacity(0.4),
                            blurRadius: 16,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.download_rounded, color: Colors.white, size: 22),
                          const SizedBox(width: 10),
                          Text(
                            "Update Now",
                            style: GoogleFonts.urbanist(color:Colors.white, fontSize: 16,fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 20),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 14),

                  // Footer
                  Text(
                    "This update is required to continue",
                    style: GoogleFonts.urbanist(
                        fontWeight: FontWeight.w400,
                      color:
                    AppColor.black.withOpacity(0.5),
                      fontSize: 12,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _openStore() async {
    final url = PlatformInfo.isAndroid
        ? AdminSettingsApi.adminSettingsModel?.setting?.androidAppLink ?? ""
        : AdminSettingsApi.adminSettingsModel?.setting?.iosAppLink ?? "";

    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }
}