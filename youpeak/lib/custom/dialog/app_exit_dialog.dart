import 'dart:io';
import 'package:flutter/material.dart';
import 'package:youpeak/custom/custom_ui/app_artwork.dart';
import 'package:youpeak/utils/icons/app_visuals.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/utils/colors/app_color.dart';

class AppExitDialog extends StatefulWidget {
  const AppExitDialog({super.key});

  @override
  State<AppExitDialog> createState() => _AppExitDialogState();
}

class _AppExitDialogState extends State<AppExitDialog>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    _scaleAnimation =
        CurvedAnimation(parent: _controller, curve: Curves.elasticOut);
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 40),
      backgroundColor: Colors.transparent,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 340),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: AppColor.primaryColor.withOpacity(0.15),
                  blurRadius: 30,
                  offset: const Offset(0, 15),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Animated Icon
                  TweenAnimationBuilder(
                    duration: const Duration(seconds: 2),
                    tween: Tween<double>(begin: 0, end: 1),
                    builder: (context, double value, child) {
                      return Transform.scale(
                        scale: 1 + (0.05 * (1 - (value - 0.5).abs() * 2)),
                        child: const AppArtwork(asset: AppVisuals.exit, height: 132),
                      );
                    },
                  ),

                  const SizedBox(height: 20),

                  // Title
                  Text(
                    "Exit App",
                    style: GoogleFonts.urbanist(
                      fontWeight: FontWeight.w700,
                      fontSize: 22,
                      color: AppColor.black,
                    ),
                    textAlign: TextAlign.center,
                  ),

                  const SizedBox(height: 10),

                  // Description
                  Text(
                    "Are you sure you want to exit the application?",
                    style: GoogleFonts.urbanist(
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                      color: AppColor.black.withOpacity(0.6),
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                  ),

                  const SizedBox(height: 26),

                  // Buttons
                  Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () => Navigator.of(context).pop(false),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            height: 48,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: AppColor.primaryColor.withOpacity(0.3),
                              ),
                            ),
                            child: Center(
                              child: Text(
                                "Cancel",
                                style: GoogleFonts.urbanist(
                                  color: AppColor.primaryColor,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: InkWell(
                          onTap: () => Navigator.of(context).pop(true),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            height: 48,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              gradient: LinearGradient(
                                colors: [
                                  AppColor.primaryColor,
                                  AppColor.primaryColor.withOpacity(0.8),
                                ],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColor.primaryColor.withOpacity(0.3),
                                  blurRadius: 12,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Text(
                                "Exit",
                                style: GoogleFonts.urbanist(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
