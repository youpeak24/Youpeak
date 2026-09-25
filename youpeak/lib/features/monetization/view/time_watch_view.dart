import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:youpeak/core/utils/custom_watch_time.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/bites/view/nav_shorts_details_view.dart';
import 'package:youpeak/core/theme/app_color.dart';
import 'package:youpeak/core/assets/app_icons.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/constants/app_string.dart';
import 'package:syncfusion_flutter_charts/charts.dart';

class TimeWatchView extends StatelessWidget {
  const TimeWatchView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        systemOverlayStyle: const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarBrightness: Brightness.dark),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leadingWidth: 60,
        leading: IconButtonUi(
          callback: () => Get.back(),
          icon: Obx(
            () => Image.asset(AppIcons.arrowBack, height: 20, width: 20, color: isDarkMode.value ? AppColor.white : AppColor.black),
          ),
        ),
        centerTitle: AppSettings.isCenterTitle,
        title: Text(AppStrings.timeWatched.tr, style: GoogleFonts.urbanist(fontSize: 18, fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          const SizedBox(height: 30),
          Container(
            height: 90,
            width: Get.width,
            padding: const EdgeInsets.only(left: 15),
            margin: const EdgeInsets.symmetric(horizontal: 20),
            decoration: BoxDecoration(
              color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.grey_100,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.transparent, blurRadius: 1.5),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  "${CustomWatchTime.onGetAverage()} ${AppStrings.minuteDailyAverage.tr}",
                  style: GoogleFonts.urbanist(fontSize: 18, color: AppColor.primaryColor, fontWeight: FontWeight.bold),
                ),
                Row(
                  children: [
                    Image.asset(CustomWatchTime.isDown ? AppIcons.downArrowBold : AppIcons.upArrowBold, height: 25, width: 25),
                    Text(
                      "${CustomWatchTime.percentage.toStringAsFixed(2).tr}% ${AppStrings.fromLastWeek.tr}",
                      style: GoogleFonts.urbanist(fontSize: 14, color: isDarkMode.value ? AppColor.white.withOpacity(0.8) : AppColor.grey, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Center(
            child: SizedBox(
              height: 300,
              child: SfCartesianChart(
                primaryXAxis:
                    const CategoryAxis(majorTickLines: MajorTickLines(color: AppColor.primaryColor), axisLine: AxisLine(color: AppColor.transparent), majorGridLines: MajorGridLines(width: 0)),
                series: <CartesianSeries<ChartData, String>>[
                  ColumnSeries<ChartData, String>(
                    color: AppColor.primaryColor.withOpacity(0.8),
                    borderRadius: BorderRadius.circular(8),
                    dataSource: <ChartData>[
                      ChartData('Mon', ((Database.dayWiseWatchTime(1) / 1000) / 60)),
                      ChartData('Tue', ((Database.dayWiseWatchTime(2) / 1000) / 60)),
                      ChartData('Wed', ((Database.dayWiseWatchTime(3) / 1000) / 60)),
                      ChartData('Thu', ((Database.dayWiseWatchTime(4) / 1000) / 60)), // Fixed: was 'Thu' for day 4
                      ChartData('Fri', ((Database.dayWiseWatchTime(5) / 1000) / 60)), // Fixed: was 'Fri' for day 5
                      ChartData('Sat', ((Database.dayWiseWatchTime(6) / 1000) / 60)), // Fixed: was 'Sat' for day 6
                      ChartData('Sun', ((Database.dayWiseWatchTime(7) / 1000) / 60)), // Added: missing Saturday
                    ],
                    xValueMapper: (ChartData sales, _) => sales.day,
                    yValueMapper: (ChartData sales, _) => sales.sales,
                    markerSettings: const MarkerSettings(isVisible: true),
                    dataLabelSettings: const DataLabelSettings(isVisible: true),
                  )
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            height: 200,
            width: Get.width,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            margin: const EdgeInsets.symmetric(horizontal: 20),
            decoration: BoxDecoration(
              color: isDarkMode.value ? AppColor.secondDarkMode : AppColor.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(color: isDarkMode.value ? AppColor.transparent : AppColor.grey_300, blurRadius: 1.5),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Row(
                  children: [
                    Text(
                      AppStrings.today.tr,
                      style: GoogleFonts.urbanist(fontSize: 18, color: isDarkMode.value ? AppColor.white : AppColor.black, fontWeight: FontWeight.w600),
                    ),
                    const Spacer(),
                    Text(
                      "${(Database.dayWiseWatchTime(DateTime.now().weekday) / 1000) ~/ 60} min",
                      style: GoogleFonts.urbanist(fontSize: 18, color: AppColor.primaryColor, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                Divider(indent: 10, endIndent: 10, color: AppColor.grey_200),
                Row(
                  children: [
                    Text(
                      AppStrings.lastSevenDays.tr,
                      style: GoogleFonts.urbanist(fontSize: 18, color: isDarkMode.value ? AppColor.white : AppColor.black, fontWeight: FontWeight.w600),
                    ),
                    const Spacer(),
                    Text(
                      "${(Database.lastWeekWatchTime / 1000) ~/ 60} min",
                      style: GoogleFonts.urbanist(fontSize: 18, color: AppColor.primaryColor, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                Divider(indent: 10, endIndent: 10, color: AppColor.grey_200),
                Row(
                  children: [
                    Text(
                      AppStrings.dailyAverage.tr,
                      style: GoogleFonts.urbanist(fontSize: 18, color: isDarkMode.value ? AppColor.white : AppColor.black, fontWeight: FontWeight.w600),
                    ),
                    const Spacer(),
                    Text(
                      "${CustomWatchTime.onGetAverage()} min",
                      style: GoogleFonts.urbanist(fontSize: 18, color: AppColor.primaryColor, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}

class ChartData {
  ChartData(this.day, this.sales);
  final String day;
  final double sales;
}
