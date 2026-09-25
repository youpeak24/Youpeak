import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_format_date.dart';
import 'package:youpeak/core/utils/custom_format_number.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/shared/widgets/preview_image.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';

class     DescriptionBottomSheet {
  static void show(
    String channelId,
    String title,
    String channelImage,
    String channelName,
    int likes,
    int disLikes,
    int views,
    String date,
    String hashtag,
    String description,
  ) {
    Get.bottomSheet(
      isScrollControlled: true,
      backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(25),
          topRight: Radius.circular(25),
        ),
      ),
      Container(
        padding: EdgeInsets.only(left: SizeConfig.blockSizeHorizontal * 4, right: SizeConfig.blockSizeHorizontal * 3),
        height: SizeConfig.screenHeight / 1.2,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: SizeConfig.blockSizeVertical * 1),
            Container(
              margin: EdgeInsets.only(left: SizeConfig.screenWidth / 2.7),
              width: SizeConfig.blockSizeHorizontal * 12,
              height: 3,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(60),
                color: AppColor.grey_100,
              ),
            ),
            SizedBox(height: SizeConfig.blockSizeVertical * 1),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(AppStrings.description.tr, style: profileTitleStyle),
                IconButton(
                  icon: const ImageIcon(AssetImage(AppIcons.remove), size: 30),
                  onPressed: () => Get.back(),
                ),
              ],
            ),
            const Divider(indent: 5, endIndent: 5),
            SizedBox(height: SizeConfig.blockSizeVertical * 1),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: SizeConfig.screenWidth / 1.27,
                  child: Text(title, style: profileTitleStyle, overflow: TextOverflow.ellipsis, maxLines: 2),
                ),
              ],
            ),
            SizedBox(height: SizeConfig.blockSizeVertical * 1),
            Row(
              children: [
                PreviewProfileImage(id: channelId, image: channelImage, size: 35, fit: BoxFit.cover),
                SizedBox(width: SizeConfig.blockSizeHorizontal * 2),
                Text(channelName, style: optMethodStyle),
              ],
            ),
            SizedBox(height: SizeConfig.blockSizeVertical * 2),
            Padding(
              padding: EdgeInsets.only(right: SizeConfig.blockSizeHorizontal * 4, left: SizeConfig.blockSizeHorizontal * 3),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    children: [
                      Text(CustomFormatNumber.convert(likes), style: profileTitleStyle),
                      SizedBox(height: SizeConfig.blockSizeVertical * 0.5),
                      Text(
                        AppStrings.likes.tr,
                        style: GoogleFonts.urbanist(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: isDarkMode.value ? AppColor.white : const Color(0xFF424242),
                        ),
                      ),
                    ],
                  ),
                  Column(
                    children: [
                      Text(CustomFormatNumber.convert(disLikes), style: profileTitleStyle),
                      SizedBox(height: SizeConfig.blockSizeVertical * 0.5),
                      Text(
                        AppStrings.disLikes.tr,
                        style: GoogleFonts.urbanist(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: isDarkMode.value ? AppColor.white : const Color(0xFF424242),
                        ),
                      ),
                    ],
                  ),
                  Column(
                    children: [
                      Text(CustomFormatNumber.convert(views), style: profileTitleStyle),
                      SizedBox(height: SizeConfig.blockSizeVertical * 0.5),
                      Text(
                        AppStrings.views.tr,
                        style: GoogleFonts.urbanist(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: isDarkMode.value ? AppColor.white : const Color(0xFF424242),
                        ),
                      ),
                    ],
                  ),
                  Column(
                    children: [
                      Text(CustomFormatDate.convert(date), style: profileTitleStyle),
                      SizedBox(height: SizeConfig.blockSizeVertical * 0.5),
                      Text(
                        AppStrings.createAt.tr,
                        style: GoogleFonts.urbanist(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: isDarkMode.value ? AppColor.white : const Color(0xFF424242),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            SizedBox(height: SizeConfig.blockSizeVertical * 1),
            const Divider(indent: 5, endIndent: 5),
            SizedBox(height: SizeConfig.blockSizeVertical * 1),
            Text(hashtag, style: GoogleFonts.urbanist(color: const Color(0xFF246BFD)), textAlign: TextAlign.left),
            SizedBox(height: SizeConfig.blockSizeVertical * 2),
            Text(description, style: GoogleFonts.urbanist(fontSize: 15)),
          ],
        ),
      ),
    );
  }
}
