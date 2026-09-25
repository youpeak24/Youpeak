import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/premium/view/premium_plan_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/constants/app_string.dart';

class PremiumPlanDialog {
  void show(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 30),
        contentPadding: EdgeInsets.zero,
        titlePadding: EdgeInsets.zero,
        buttonPadding: EdgeInsets.zero,
        actionsPadding: EdgeInsets.zero,
        title: Container(
          height: 490,
          width: Get.width,
          decoration: BoxDecoration(
            color: isDarkMode.value ? AppColor.mainDark : Colors.white,
            borderRadius: BorderRadius.circular(30),
          ),
          child: Center(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    const SizedBox(height: 5),
                    Center(child: SizedBox(height: 180, width: 180, child: Image.asset(AppIcons.premiumDownload))),
                    const SizedBox(height: 15),
                    Center(
                      child: Text(
                        AppStrings.getPremiumPlanEnjoyAdFreeDownload.tr.replaceAll('\\n', '\n'),
                        textAlign: TextAlign.center,
                        style: GoogleFonts.urbanist(
                          color: AppColor.primaryColor.withOpacity(0.9),
                          fontWeight: FontWeight.w800,
                          fontSize: 22,
                        ),
                      ),
                    ),
                    const SizedBox(height: 15),
                    Column(
                      children: [
                        Row(
                          children: [
                            const ImageIcon(AssetImage(AppIcons.done), color: AppColor.lightPink, size: 18),
                            const SizedBox(width: 20),
                            Expanded(
                              child: Text(
                                AppStrings.watchAllYouWantAdFree.tr,
                                overflow: TextOverflow.fade,
                                maxLines: 1,
                                style: GoogleFonts.urbanist(fontSize: 13, fontWeight: FontWeight.w600, color: isDarkMode.value ? AppColor.white : AppColor.black),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const ImageIcon(AssetImage(AppIcons.done), color: AppColor.lightPink, size: 18),
                            const SizedBox(width: 20),
                            Expanded(
                              child: Text(
                                AppStrings.downloadUnlimitedVideoInFullHd.tr,
                                maxLines: 1,
                                overflow: TextOverflow.fade,
                                // controller.mainPremiumPlans![index].planBenefit![i].toString(),
                                style: GoogleFonts.urbanist(fontSize: 13, fontWeight: FontWeight.w600, color: isDarkMode.value ? AppColor.white : AppColor.black),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ).paddingOnly(left: 10),
                    const SizedBox(height: 15),
                    Text(
                      AppStrings.downloadDialogParagraph.tr,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.urbanist(
                        fontWeight: FontWeight.w500,
                        fontSize: 11,
                        color: AppColor.grey,
                      ),
                    ),
                    const SizedBox(height: 15),
                    GestureDetector(
                      onTap: () {
                        Get.back();
                        Get.to(PremiumPlanView());
                      },
                      child: Container(
                        height: 48,
                        width: Get.width,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: AppColor.primaryColor,
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(
                          AppStrings.purchaseNow.tr,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.urbanist(
                            fontWeight: FontWeight.w600,
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
