import 'package:date_picker_plus/date_picker_plus.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/theme/app_color.dart';

class CustomRangePicker {
  static Future<DateTimeRange?> onPick(BuildContext context, {DateTimeRange? initialRange}) async {
    return await showRangePickerDialog(
      padding: const EdgeInsets.all(40),
      contentPadding: const EdgeInsets.symmetric(vertical: 25, horizontal: 20),
      context: context,
      slidersColor: AppColor.primaryColor,
      maxDate: DateTime.now(),
      selectedCellsDecoration: BoxDecoration(color: AppColor.primaryColor.withOpacity(0.15)),
      selectedCellsTextStyle: GoogleFonts.urbanist(fontSize: 16, color: AppColor.primaryColor, fontWeight: FontWeight.bold),
      initialDate: initialRange?.start ?? DateTime.now(),
      selectedRange: initialRange,
      minDate: DateTime(1900, 1, 1),
      barrierColor: AppColor.black.withOpacity(0.6),
      enabledCellsTextStyle: GoogleFonts.urbanist(fontSize: 16),
      disabledCellsTextStyle: GoogleFonts.urbanist(fontSize: 16),
      singelSelectedCellTextStyle: GoogleFonts.urbanist(fontSize: 16, color: AppColor.white),
      singelSelectedCellDecoration: const BoxDecoration(color: AppColor.primaryColor, shape: BoxShape.circle),
      currentDateTextStyle: GoogleFonts.urbanist(color: AppColor.white, fontSize: 16),
      currentDateDecoration: const BoxDecoration(color: AppColor.grey, shape: BoxShape.circle),
      daysOfTheWeekTextStyle: GoogleFonts.urbanist(color: AppColor.black, fontWeight: FontWeight.bold, fontSize: 14),
      leadingDateTextStyle: GoogleFonts.urbanist(color: AppColor.primaryColor, fontSize: 20, fontWeight: FontWeight.bold),
      centerLeadingDate: true,
    );
  }
}
