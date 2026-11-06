import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/app_artwork.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/core/constants/app_string.dart';

enum EmptyStateType {
  general(AppVisuals.empty),
  videos(AppVisuals.emptyVideos),
  comments(AppVisuals.emptyComments),
  notifications(AppVisuals.emptyNotifications),
  downloads(AppVisuals.emptyDownloads),
  history(AppVisuals.emptyHistory),
  playlist(AppVisuals.emptyPlaylist),
  subscriptions(AppVisuals.emptySubscriptions),
  search(AppVisuals.emptySearch);

  const EmptyStateType(this.asset);
  final String asset;
}

class DataNotFoundUi extends StatelessWidget {
  const DataNotFoundUi({super.key, this.title, this.message, this.actionLabel, this.onAction, this.type = EmptyStateType.general});

  final String? title;

  /// A second, quieter line that says what to do or why it is empty.
  final String? message;

  /// An optional single next step ("Retry", "Upload a video", ...).
  final String? actionLabel;
  final VoidCallback? onAction;
  final EmptyStateType type;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final artHeight = constraints.hasBoundedHeight
            ? (constraints.maxHeight * 0.48).clamp(64.0, 172.0)
            : 172.0;
        return Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AppArtwork(asset: type.asset, height: artHeight),
                const SizedBox(height: 16),
                // Callers pass either a translation key or translated text;
                // .tr maps a key and leaves translated text unchanged.
                Text(
                  (title ?? AppStrings.dataNotFound).tr,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.urbanist(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    height: 1.4,
                    color: isDarkMode.value ? AppColor.white : AppColor.primaryTextIcons,
                  ),
                ),
                if (message != null && message!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    message!.tr,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.urbanist(
                      fontSize: 14,
                      height: 1.4,
                      fontWeight: FontWeight.w500,
                      color: isDarkMode.value ? AppColor.mutedTextDark : AppColor.mutedText,
                    ),
                  ),
                ],
                if (actionLabel != null && onAction != null) ...[
                  const SizedBox(height: 18),
                  AppPressable(
                    onTap: onAction,
                    haptic: true,
                    semanticLabel: actionLabel,
                    child: Container(
                      height: 48,
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(color: AppColor.primaryColor, borderRadius: BorderRadius.circular(100)),
                      child: Text(actionLabel!, style: GoogleFonts.urbanist(fontSize: 15, fontWeight: FontWeight.w800, color: AppColor.white)),
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}
