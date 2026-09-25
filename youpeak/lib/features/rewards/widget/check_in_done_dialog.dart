import 'package:flutter/material.dart';
import 'package:youpeak/shared/widgets/app_artwork.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';

class CheckInDoneDialog {
  static void show(BuildContext context, String coin) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 50),
        contentPadding: EdgeInsets.zero,
        titlePadding: EdgeInsets.zero,
        buttonPadding: EdgeInsets.zero,
        actionsPadding: EdgeInsets.zero,
        title: Container(
          height: 415,
          width: Get.width,
          decoration: BoxDecoration(
            color: isDarkMode.value ? AppColor.mainDark : Colors.white,
            borderRadius: BorderRadius.circular(50),
          ),
          child: Center(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    const SizedBox(height: 25),
                    const Center(child: SuccessArtwork(asset: AppIcons.congratulationIcon)),
                    const SizedBox(height: 15),
                    Center(
                      child: Text(
                        AppStrings.congratulations.tr,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.urbanist(
                          color: AppColor.darkGreen,
                          fontWeight: FontWeight.w700,
                          fontSize: 24,
                        ),
                      ),
                    ),
                    const SizedBox(height: 15),
                    Obx(
                      () => Text(
                        "You have successfully Check-in. You got $coin coins.",
                        textAlign: TextAlign.center,
                        style: GoogleFonts.urbanist(
                          fontWeight: FontWeight.w400,
                          fontSize: 16,
                          color: isDarkMode.value ? AppColor.white : AppColor.black,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    GestureDetector(
                      onTap: () => Get.close(2),
                      child: Container(
                        height: 55,
                        width: Get.width,
                        alignment: Alignment.center,
                        margin: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          color: AppColor.darkGreen,
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(
                          AppStrings.oKGreat.tr,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.urbanist(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                            color: AppColor.white,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 15),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
