import 'dart:ui';

import 'package:blurrycontainer/blurrycontainer.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_format_number.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/video/widget/more_information_bottom_sheet.dart';
import 'package:youpeak/features/video/model/more_information_model.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/theme/app_tokens.dart';
import 'package:youpeak/shared/widgets/app_pressable.dart';
import 'package:youpeak/shared/widgets/app_icon.dart';
import 'package:youpeak/shared/widgets/video_card_parts.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/assets/app_visuals.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/utils/utils.dart';

class ShortVideoUi extends StatelessWidget {
  const ShortVideoUi({
    super.key,
    required this.videoId,
    required this.title,
    required this.videoImage,
    this.views,
    required this.videoUrl,
    required this.videoTime,
    required this.channelName,
    required this.channelId,
    required this.isSave,
  });

  final String videoId;
  final String channelId;
  final String title;
  final String videoImage;
  final String videoUrl;
  final num? views;
  final num videoTime;
  final bool isSave;

  final String channelName;

  @override
  Widget build(BuildContext context) {
    return Obx(
      () {
        final dark = isDarkMode.value;
        return Container(
          margin: const EdgeInsets.only(right: 12, bottom: 4),
          height: 280,
          width: 170,
          decoration: BoxDecoration(
            color: dark ? AppColor.darkForestAccent : AppColor.grey_300,
            borderRadius: BorderRadius.circular(AppRadius.card),
            boxShadow: AppElevation.card(dark),
            border: dark ? Border.all(color: AppElevation.hairline(true)) : null,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.card),
            child: Stack(
              fit: StackFit.expand,
              children: [
                PreviewVideoImage(videoId: videoId, videoImage: videoImage),
                const ThumbnailScrim(height: 150, strength: 0.72),
                // Top-left Youpeak Green Play Icon badge per Spec 2.D
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: AppColor.primaryColor,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColor.white.withValues(alpha: 0.85), width: 1.2),
                    ),
                    child: const Icon(Icons.play_arrow_rounded, color: AppColor.white, size: 14),
                  ),
                ),
                Positioned(
                  top: 6,
                  right: 6,
                  child: AppPressable(
                    onTap: () => MoreInfoBottomSheet.show(
                      context,
                      MoreInformationModel(
                        videoId: videoId,
                        title: title,
                        videoImage: videoImage,
                        channelId: channelId,
                        videoType: 2,
                        videoTime: videoTime,
                        videoUrl: videoUrl,
                        channelName: channelName,
                        views: views ?? 0,
                        isSave: isSave,
                      ),
                      true,
                    ),
                    pressedScale: 0.9,
                    child: Container(
                      height: 32,
                      width: 32,
                      decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.black.withValues(alpha: 0.32)),
                      child: const Icon(Icons.more_vert_rounded, color: AppColor.white, size: 20),
                    ),
                  ),
                ),
                Positioned(
                  left: 12,
                  right: 12,
                  bottom: 12,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.urbanist(color: AppColor.white, fontSize: 14, fontWeight: FontWeight.w800, height: 1.2),
                      ),
                      if (views != null) ...[
                        const SizedBox(height: 6),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.play_arrow_rounded, color: AppColor.white, size: 15),
                            const SizedBox(width: 2),
                            Text(
                              "${CustomFormatNumber.convert(views!)} views",
                              style: GoogleFonts.urbanist(color: AppColor.white.withValues(alpha: 0.92), fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ],
                    ],
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

class ShortsPrivateContentWidget extends StatelessWidget {
  const ShortsPrivateContentWidget({
    super.key,
    required this.id,
    required this.image,
    required this.subscribe,
    required this.unlock,
    required this.subscribeCoin,
    required this.unlockCoin,
    required this.title,
    required this.views,
    required this.channelType,
  });

  final String id;
  final String image;
  final String title;
  final num views;
  final num subscribeCoin;
  final num unlockCoin;
  final num channelType;
  final Callback subscribe;
  final Callback unlock;

  @override
  Widget build(BuildContext context) {
    return Container(
      alignment: Alignment.center,
      margin: const EdgeInsets.only(right: 10),
      height: 280,
      width: 170,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
          color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_400,
          borderRadius: BorderRadius.circular(AppRadius.card)),
      child: Stack(
        alignment: Alignment.center,
        children: [
          PreviewVideoImage(videoId: id, videoImage: image),
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: Container(
                color: Colors.black.withValues(alpha: 0.38),
              ),
            ),
          ),
          Positioned(top: 8, right: 8, child: const AppIcon.colored(AppVisuals.paidVideoBadge, size: 32)),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const AppIcon(AppIcons.lock, size: 30, color: AppColor.white),
              10.height,
              Text(
                AppStrings.thisVideoIsPrivateContent.tr,
                style: GoogleFonts.urbanist(
                    fontSize: 14,
                    color: AppColor.white,
                    fontWeight: FontWeight.w900),
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
              ),
              10.height,
              Column(
                children: [
                  Visibility(
                    visible: channelType == 2,
                    child: AppPressable(
                      onTap: subscribe,
                      haptic: true,
                      child: BlurryContainer(
                        height: 42,
                        width: 140,
                        blur: 5,
                        borderRadius: BorderRadius.circular(30),
                        color: AppColor.white.withValues(alpha: 0.28),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              AppStrings.subscribe.tr,
                              style: GoogleFonts.urbanist(
                                  color: AppColor.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12),
                            ),
                            5.width,
                            const AppIcon.colored(AppIcons.coin, size: 15),
                            2.width,
                            Text(
                              "$subscribeCoin/m",
                              style: GoogleFonts.urbanist(
                                  color: AppColor.white,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  10.height,
                  AppPressable(
                    onTap: unlock,
                    haptic: true,
                    child: Container(
                      height: 42,
                      width: 140,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(30),
                        color: AppColor.primaryColor,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            AppStrings.unlockVideo.tr,
                            style: GoogleFonts.urbanist(
                                color: AppColor.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12),
                          ),
                          5.width,
                          const AppIcon.colored(AppIcons.coin, size: 15),
                          2.width,
                          Text(
                            "$unlockCoin",
                            style: GoogleFonts.urbanist(
                                color: AppColor.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          // Positioned(
          //   bottom: 0,
          //   left: 10,
          //   child: Column(
          //     crossAxisAlignment: CrossAxisAlignment.start,
          //     children: [
          //       SizedBox(width: 145, child: Text(title, maxLines: 2, style: shortsStyle)),
          //       const SizedBox(height: 5),
          //       Text("${CustomFormatNumber.convert(views)} views", style: shortsStyle),
          //       const SizedBox(height: 10),
          //     ],
          //   ),
          // ),
        ],
      ),
    );
  }
}
