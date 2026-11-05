import 'package:youpeak/core/platform/app_layout.dart';
import 'dart:ui';

import 'package:blurrycontainer/blurrycontainer.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_format_number.dart';
import 'package:youpeak/core/utils/custom_format_timer.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/channel/view/your_channel_view.dart';
import 'package:youpeak/features/video/widget/more_information_bottom_sheet.dart';
import 'package:youpeak/features/video/model/more_information_model.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/shared/widgets/video_card_parts.dart';
import 'package:youpeak/core/constants/app_string.dart';

const double _cardMargin = 12;

/// The thumbnail frame: rounded, softly raised on light surfaces, hairline on
/// dark ones. [child] fills it.
class _ThumbnailFrame extends StatelessWidget {
  const _ThumbnailFrame({required this.height, required this.child});

  final double height;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    // The Obx reads isDarkMode itself: GetX tracks observables read inside the
    // Obx closure, not ones read by a child's build.
    return Obx(() {
      final dark = isDarkMode.value;
      return Container(
        height: height,
        width: double.infinity,
        margin: const EdgeInsets.symmetric(horizontal: _cardMargin),
        decoration: BoxDecoration(
          color: dark ? AppColor.secondDarkMode : AppColor.grey_200,
          borderRadius: BorderRadius.circular(AppRadius.card + 2),
          boxShadow: AppElevation.card(dark),
          border: dark ? Border.all(color: AppElevation.hairline(true)) : null,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.card + 2),
          child: child,
        ),
      );
    });
  }
}

class _VideoInfoRow extends StatelessWidget {
  const _VideoInfoRow({
    required this.channelId,
    required this.channelImage,
    required this.title,
    required this.channelName,
    required this.views,
    required this.uploadTime,
    required this.onMore,
  });

  final String channelId;
  final String channelImage;
  final String title;
  final String channelName;
  final num views;
  final String? uploadTime;
  final VoidCallback onMore;

  @override
  Widget build(BuildContext context) {
    final dark = isDarkMode.value;
    return Padding(
      padding: const EdgeInsets.fromLTRB(_cardMargin, 12, 2, 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppPressable(
            onTap: () => Get.to(() => YourChannelView(loginUserId: Database.loginUserId!, channelId: channelId)),
            pressedScale: 0.94,
            child: Container(
              padding: const EdgeInsets.all(1.5),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppElevation.hairline(dark), width: 1.2),
              ),
              child: PreviewProfileImage(id: channelId, image: channelImage, size: 38, fit: BoxFit.cover),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.w800, height: 1.25, letterSpacing: -0.1),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                VideoMetaText(
                  channel: channelName,
                  views: "${CustomFormatNumber.convert(views)} views",
                  age: uploadTime,
                  dark: dark,
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onMore,
            tooltip: "More",
            visualDensity: VisualDensity.compact,
            icon: Icon(Icons.more_vert_rounded, color: dark ? AppColor.mutedTextDark : AppColor.mutedText),
          ),
        ],
      ),
    );
  }
}

class NormalVideoUi extends StatelessWidget {
  const NormalVideoUi({
    super.key,
    required this.videoId,
    required this.title,
    required this.videoImage,
    required this.videoUrl,
    required this.videoTime,
    required this.channelId,
    required this.channelImage,
    required this.channelName,
    required this.views,
    this.uploadTime,
    required this.isSave,
  });

  final String videoId;
  final String title;
  final String videoImage;
  final String videoUrl;
  final num videoTime;
  final String channelId;
  final String channelImage;
  final String channelName;
  final num views;
  final String? uploadTime;
  final bool isSave;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _ThumbnailFrame(
            height: VideoGridScope.thumbnailHeight(context, phoneHeight: SizeConfig.largeVideoImageHeight, horizontalMargin: _cardMargin),
            child: Stack(
              fit: StackFit.expand,
              children: [
                PreviewVideoImage(videoId: videoId, videoImage: videoImage),
                const ThumbnailScrim(height: 72, strength: 0.45),
                Positioned(
                  right: 10,
                  bottom: 10,
                  child: DurationBadge(text: CustomFormatTime.convertSecond(videoTime)),
                ),
              ],
            ),
          ),
          _VideoInfoRow(
            channelId: channelId,
            channelImage: channelImage,
            title: title,
            channelName: channelName,
            views: views,
            uploadTime: uploadTime,
            onMore: () => MoreInfoBottomSheet.show(
              context,
              MoreInformationModel(
                channelId: channelId,
                videoImage: videoImage,
                videoId: videoId,
                title: title,
                videoType: 1,
                videoTime: videoTime,
                videoUrl: videoUrl,
                channelName: channelName,
                views: views,
                isSave: isSave,
              ),
              false,
            ),
          ),
        ],
      ),
    );
  }
}

class PrivateContentNormalVideoUi extends StatelessWidget {
  const PrivateContentNormalVideoUi({
    super.key,
    required this.videoId,
    required this.title,
    required this.videoImage,
    required this.videoUrl,
    required this.videoTime,
    required this.channelId,
    required this.channelImage,
    required this.channelName,
    required this.views,
    this.uploadTime,
    required this.isSave,
    required this.subscribeCallback,
    required this.videoCallback,
    required this.videoCost,
    required this.subscribeCost,
    required this.channelType,
  });

  final Callback subscribeCallback;
  final Callback videoCallback;
  final String videoId;
  final String title;
  final String videoImage;
  final String videoUrl;
  final num videoTime;
  final String channelId;
  final String channelImage;
  final String channelName;
  final num views;
  final String? uploadTime;
  final bool isSave;
  final num videoCost;
  final num subscribeCost;
  final num channelType;

  Widget _unlockButton({double? width}) {
    return AppPressable(
      onTap: videoCallback,
      haptic: true,
      child: Container(
        height: 44,
        width: width,
        padding: const EdgeInsets.symmetric(horizontal: 18),
        decoration: BoxDecoration(
          color: AppColor.primaryColor,
          borderRadius: BorderRadius.circular(30),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              AppStrings.unlockVideo.tr,
              style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.w700, fontSize: 14.5),
            ),
            const SizedBox(width: 6),
            const AppIcon.colored(AppIcons.coin, size: 18),
            const SizedBox(width: 3),
            Text(
              CustomFormatNumber.convert(videoCost),
              style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.w800, fontSize: 14.5),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _ThumbnailFrame(
            height: VideoGridScope.thumbnailHeight(context, phoneHeight: SizeConfig.largeVideoImageHeight, minGridHeight: 180, horizontalMargin: _cardMargin),
            child: Stack(
              alignment: Alignment.center,
              fit: StackFit.expand,
              children: [
                PreviewVideoImage(videoId: videoId, videoImage: videoImage),
                Positioned.fill(
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
                    child: Container(color: Colors.black.withValues(alpha: 0.38)),
                  ),
                ),
                Positioned(top: 12, right: 14, child: const AppIcon.colored(AppVisuals.paidVideoBadge, size: 40)),
                Positioned.fill(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const AppIcon(AppIcons.lock, size: 34, color: AppColor.white),
                      const SizedBox(height: 8),
                      Text(
                        AppStrings.thisVideoIsPrivateContent.tr,
                        style: GoogleFonts.urbanist(fontSize: 16, color: AppColor.white, fontWeight: FontWeight.w900),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        AppStrings.ifYouWantToSeeThisVideoBuyPrivateContentPremium.tr.replaceAll('\\n', '\n'),
                        textAlign: TextAlign.center,
                        style: GoogleFonts.urbanist(fontSize: 12, color: AppColor.white.withValues(alpha: 0.9), fontWeight: FontWeight.w600),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 12),
                      channelType == 1
                          ? _unlockButton(width: 190)
                          : Row(
                              children: [
                                const SizedBox(width: 14),
                                Expanded(
                                  child: AppPressable(
                                    onTap: subscribeCallback,
                                    haptic: true,
                                    child: BlurryContainer(
                                      height: 44,
                                      blur: 6,
                                      borderRadius: BorderRadius.circular(30),
                                      color: AppColor.white.withValues(alpha: 0.28),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            AppStrings.subscribe.tr,
                                            style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.w700, fontSize: 14.5),
                                          ),
                                          const SizedBox(width: 6),
                                          const AppIcon.colored(AppIcons.coin, size: 18),
                                          const SizedBox(width: 3),
                                          Text(
                                            "$subscribeCost/m",
                                            style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.w800, fontSize: 14.5),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(child: _unlockButton()),
                                const SizedBox(width: 14),
                              ],
                            ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          _VideoInfoRow(
            channelId: channelId,
            channelImage: channelImage,
            title: title,
            channelName: channelName,
            views: views,
            uploadTime: uploadTime,
            onMore: videoCallback,
          ),
        ],
      ),
    );
  }
}
