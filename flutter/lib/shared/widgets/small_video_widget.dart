import 'package:youpeak/core/platform/app_layout.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_format_timer.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/shared/widgets/video_card_parts.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/utils/utils.dart';

class SmallVideoWidget extends StatelessWidget {
  const SmallVideoWidget(
      {super.key,
      required this.id,
      required this.image,
      required this.videoTime,
      required this.title,
      required this.views,
      required this.uploadTime,
      this.channelName});

  final String id;
  final String image;
  final String videoTime;
  final String title;
  final int views;
  final String uploadTime;
  final String? channelName;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Stack(
            children: [
              Container(
                clipBehavior: Clip.hardEdge,
                height: SizeConfig.smallVideoImageHeight,
                width: SizeConfig.smallVideoImageWidth,
                decoration: BoxDecoration(
                  color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_400,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Stack(
                  children: [
                    PreviewVideoImage(videoId: id, videoImage: image),
                    Positioned.fill(
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                        child: Container(
                          color: Colors.black.withOpacity(0),
                        ),
                      ),
                    ),
                    Positioned.fill(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Image.asset(AppIcons.lock, width: 20),
                          3.height,
                          SizedBox(
                            width: SizeConfig.smallVideoImageWidth / 1.5,
                            child: Text(
                              textAlign: TextAlign.center,
                              AppStrings.thisVideoIsPrivateContent.tr,
                              style: GoogleFonts.urbanist(fontSize: 10, color: AppColor.white, fontWeight: FontWeight.w900),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          5.height,
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Positioned(
                bottom: 10,
                right: 10,
                child: DurationBadge(text: CustomFormatTime.convertSecond(int.parse(videoTime)), fontSize: 11),
              ),
            ],
          ),
          SizedBox(width: AppLayout.width * 0.03),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 3,
                  style: GoogleFonts.urbanist(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: SizeConfig.blockSizeVertical * 1),
                channelName == null
                    ? Text(
                        "$views views • $uploadTime",
                        style: GoogleFonts.urbanist(
                            fontSize: 10, color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black.withOpacity(0.7)),
                      )
                    : Text(
                        channelName ?? "",
                        style: GoogleFonts.urbanist(
                            fontSize: 10, color: isDarkMode.value ? AppColor.white.withOpacity(0.7) : AppColor.black.withOpacity(0.7)),
                      ),
                5.height,
                Row(
                  children: [
                    Image.asset(AppIcons.password, width: 12, color: AppColor.primaryColor),
                    5.width,
                    Text(
                      AppStrings.thisVideoIsPrivateContent.tr,
                      style: GoogleFonts.urbanist(fontSize: 10, fontWeight: FontWeight.w500, color: AppColor.primaryColor),
                    ),
                  ],
                ),
              ],
            ),
          ),
          SizedBox(width: AppLayout.width * 0.01),
        ],
      ),
    );
  }
}
