import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/shared/widgets/app_artwork.dart';
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
  const DataNotFoundUi({super.key, this.title, this.type = EmptyStateType.general});

  final String? title;
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
                Text(
                  title ?? AppStrings.dataNotFound.tr,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.urbanist(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    height: 1.4,
                    color: isDarkMode.value ? AppColor.white : AppColor.primaryTextIcons,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
