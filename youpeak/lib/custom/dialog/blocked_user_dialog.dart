import 'package:flutter/material.dart';
import 'package:youpeak/custom/custom_ui/app_artwork.dart';
import 'package:youpeak/utils/icons/app_visuals.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/utils/colors/app_color.dart';
import 'package:youpeak/utils/string/app_string.dart';

class BlockedUserDialog extends StatefulWidget {
  const BlockedUserDialog({super.key});

  @override
  State<BlockedUserDialog> createState() => _BlockedUserDialogState();
}

class _BlockedUserDialogState extends State<BlockedUserDialog> with SingleTickerProviderStateMixin {
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
              color: AppColor.white,
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
                  // Warning Icon with Animation
                  TweenAnimationBuilder(
                    duration: const Duration(seconds: 2),
                    tween: Tween<double>(begin: 0, end: 1),
                    builder: (context, double value, child) {
                      return Transform.scale(
                        scale: 1 + (0.05 * (1 - (value - 0.5).abs() * 2)),
                        child: const AppArtwork(asset: AppVisuals.accountBlocked, height: 132),
                      );
                    },
                  ),

                  const SizedBox(height: 24),

                  // Title
                  Text(
                    AppStrings.accountBlocked.tr,
                    style: GoogleFonts.urbanist(
                      fontWeight: FontWeight.w700,
                      fontSize: 22,
                      color: AppColor.black,
                    ),
                    textAlign: TextAlign.center,
                  ),

                  const SizedBox(height: 12),

                  // Description
                  Text(
                    AppStrings.youAreBlockedByTheAdmin.tr,
                    style: GoogleFonts.urbanist(
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                      color: AppColor.black.withOpacity(0.6),
                    ),
                    textAlign: TextAlign.center,
                  ),

                  const SizedBox(height: 32),

                  // Dismiss Button
                  InkWell(
                    onTap: () {
                      SystemNavigator.pop();
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      height: 52,
                      width: double.infinity,
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
                          AppStrings.dismiss.tr,
                          style: GoogleFonts.urbanist(
                            color: AppColor.white,
                            // color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
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
