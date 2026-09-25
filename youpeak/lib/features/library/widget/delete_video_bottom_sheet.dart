import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get/get_rx/src/rx_typedefs/rx_typedefs.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/constants/app_string.dart';

class DeleteVideoBottomSheet {
  static void onShow({required Callback callBack}) {
    Get.bottomSheet(
      backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(40),
          topLeft: Radius.circular(40),
        ),
      ),
      Container(
        padding: EdgeInsets.only(
          left: SizeConfig.blockSizeHorizontal * 3,
          right: SizeConfig.blockSizeHorizontal * 3,
        ),
        height: 180,
        decoration: BoxDecoration(
          color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
          borderRadius: const BorderRadius.only(topRight: Radius.circular(40), topLeft: Radius.circular(40)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            const SizedBox(height: 10),
            Container(
              width: 30,
              height: 3,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(60),
                color: isDarkMode.value ? AppColor.white.withOpacity(0.2) : AppColor.grey_200,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              AppStrings.deleteVideo.tr,
              style: GoogleFonts.urbanist(
                fontSize: 22,
                color: isDarkMode.value ? AppColor.white : AppColor.logOutColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 5),
            Divider(indent: 30, color: AppColor.grey_200, endIndent: 30),
            const SizedBox(height: 5),
            Text(
              AppStrings.deleteVideoText.tr,
              style: GoogleFonts.urbanist(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 15),
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                GestureDetector(
                  onTap: () => Get.back(),
                  child: Container(
                    height: 45,
                    width: 130,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(30),
                      color: AppColor.primaryColor.withOpacity(0.2),
                    ),
                    child: Text(
                      AppStrings.cancel.tr,
                      style: GoogleFonts.urbanist(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: AppColor.primaryColor,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: callBack,
                  child: Container(
                    height: 45,
                    width: 130,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(borderRadius: BorderRadius.circular(100), color: AppColor.primaryColor),
                    child: Text(
                      AppStrings.delete.tr,
                      style: GoogleFonts.urbanist(color: AppColor.white, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
