import 'package:youpeak/shared/dialogs/app_sheet.dart';
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

/// One choice in the report sheet. [reportType] is the backend's
/// REPORT_TYPE code (functions/backend/types/constant.js); null means
/// "block this video", which stays on the device.
class ReportReason {
  const ReportReason(this.label, this.reportType, {this.statutory = false});

  final String label;
  final int? reportType;

  /// A ground listed in IT Rules 2021, Rule 3(1)(b).
  final bool statutory;
}

class CustomReportView {
  /// Index into [reasons]; -1 = nothing chosen.
  static RxInt selectedReport = (-1).obs;

  // Codes are explicit: this list used to send its own index, one higher
  // than the backend's code, so every report landed in the wrong category.
  static List<ReportReason> get reasons => [
        ReportReason(AppStrings.reportVideo.tr, null),
        ReportReason(AppStrings.sexualContent.tr, 1),
        ReportReason(AppStrings.violentOrRepulsiveContent.tr, 2),
        ReportReason(AppStrings.hatefulOrAbusiveContent.tr, 3),
        ReportReason(AppStrings.harmfulOrDangerousActs.tr, 4),
        ReportReason(AppStrings.spamOrMisleading.tr, 5),
        ReportReason(AppStrings.childAbuse.tr, 6),
        ReportReason(AppStrings.others.tr, 7),
        const ReportReason("Anti-national content", 8, statutory: true),
        const ReportReason("Hate speech", 9, statutory: true),
        const ReportReason("Defamation", 10, statutory: true),
        const ReportReason("Threatens India's sovereignty or integrity", 11, statutory: true),
      ];

  static void show(String videoId) {
    selectedReport.value = -1;
    final items = reasons;
    AppSheet.show(
      backgroundColor: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
      isScrollControlled: true,
      SizedBox(
        height: Get.height * 0.75,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            const SizedBox(height: 10),
            Container(
                height: 3,
                width: SizeConfig.blockSizeHorizontal * 12,
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(60), color: AppColor.grey_300)),
            const SizedBox(height: 10),
            Text("${AppStrings.report.tr}-${AppStrings.block.tr}", style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.w900)),
            Divider(indent: 25, endIndent: 25, color: AppColor.grey_200),
            Obx(
              () => Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: RadioGroup<int>(
                    groupValue: selectedReport.value,
                    onChanged: (value) {
                      if (value != null) selectedReport.value = value;
                    },
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        for (int i = 0; i < items.length; i++) ...[
                          if (items[i].statutory && (i == 0 || !items[i - 1].statutory))
                            Padding(
                              padding: const EdgeInsets.fromLTRB(20, 14, 20, 4),
                              child: Text(
                                "IT Rules 2021 — statutory grounds",
                                style: GoogleFonts.urbanist(fontSize: 13, fontWeight: FontWeight.w800, color: AppColor.greyColor, letterSpacing: 0.3),
                              ),
                            ),
                          InkWell(
                            onTap: () => selectedReport.value = i,
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(minHeight: 44),
                              child: Row(
                                children: [
                                  const SizedBox(width: 10),
                                  Radio<int>(value: i, activeColor: AppColor.primaryColor),
                                  Expanded(child: Text(items[i].label, style: settingsStyle)),
                                ],
                              ),
                            ),
                          ),
                        ],
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            GestureDetector(
                              onTap: () => Get.back(),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                                decoration: BoxDecoration(
                                  color: AppColor.lightPink.withValues(alpha: 0.3),
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
                                final index = selectedReport.value;
                                if (videoId == "" || index < 0) return;
                                Get.back();
                                final reportType = items[index].reportType;
                                if (reportType == null) {
                                  CustomToast.show(AppStrings.videoBlockToast.tr);
                                } else {
                                  CustomToast.show(AppStrings.reportSending.tr);
                                  await ReportVideoApi.callApi(Database.loginUserId!, videoId, reportType);
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
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
                        SizedBox(height: 10 + MediaQuery.paddingOf(Get.context!).bottom),
                      ],
                    ),
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
