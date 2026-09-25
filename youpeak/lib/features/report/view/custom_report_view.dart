import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_toast.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/report/api/report_video_api.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/config/size_config.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:youpeak/core/theme/app_style.dart';

class CustomReportView {
  static RxInt selectedReport = 0.obs;
  static List reportTypes = [
    "NULL",
    AppStrings.reportVideo.tr,
    AppStrings.sexualContent.tr,
    AppStrings.violentOrRepulsiveContent.tr,
    AppStrings.hatefulOrAbusiveContent.tr,
    AppStrings.harmfulOrDangerousActs.tr,
    AppStrings.spamOrMisleading.tr,
    AppStrings.childAbuse.tr,
    AppStrings.others.tr,
  ];
  static void show(String videoId) {
    Get.bottomSheet(
      backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
      SizedBox(
        height: 450,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            const SizedBox(height: 10),
            Container(height: 3, width: SizeConfig.blockSizeHorizontal * 12, decoration: BoxDecoration(borderRadius: BorderRadius.circular(60), color: AppColor.grey_300)),
            const SizedBox(height: 10),
            Text("${AppStrings.report.tr}-${AppStrings.block.tr}", style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.w900)),
            Divider(indent: 25, endIndent: 25, color: AppColor.grey_200),
            Obx(
              () => Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      for (int i = 1; i < reportTypes.length; i++)
                        Padding(
                          padding: const EdgeInsets.only(left: 10, bottom: 0),
                          child: Row(
                            children: [
                              Radio(
                                  value: i,
                                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  activeColor: AppColor.primaryColor,
                                  groupValue: selectedReport.value,
                                  onChanged: (value) => selectedReport.value = value!),
                              Text(reportTypes[i], style: settingsStyle),
                            ],
                          ),
                        ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          GestureDetector(
                            onTap: () => Get.back(),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 10),
                              decoration: BoxDecoration(
                                color: AppColor.lightPink.withOpacity(0.3),
                                borderRadius: BorderRadius.circular(25),
                              ),
                              child: Text(
                                AppStrings.cancel.tr,
                                style: GoogleFonts.urbanist(
                                  color: AppColor.primaryColor,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          GestureDetector(
                            onTap: () async {
                              if (videoId != "" && selectedReport.value != 0) {
                                Get.back();
                                if (selectedReport.value == 1) {
                                  CustomToast.show(AppStrings.videoBlockToast.tr);
                                } else {
                                  CustomToast.show(AppStrings.reportSending.tr);
                                  await ReportVideoApi.callApi(Database.loginUserId!, videoId, selectedReport.value);
                                }
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 10),
                              decoration: BoxDecoration(
                                color: AppColor.primaryColor,
                                borderRadius: BorderRadius.circular(25),
                              ),
                              child: Text(
                                AppStrings.report.tr,
                                style: GoogleFonts.urbanist(
                                  color: AppColor.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(30),
          topLeft: Radius.circular(30),
        ),
      ),
    );
  }
}
