import 'dart:async';

import 'package:get/get.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/utils/utils.dart';

class CustomWatchTime {
  static RxInt countMilliSecond = 0.obs;
  static bool isAppOn = true;

  static double percentage = 0.0;

  static bool isDown = false;

  static Future<void> onCount() async {
    countMilliSecond.value = Database.dayWiseWatchTime(DateTime.now().weekday); // Get Today Watch Time
    Timer.periodic(
      const Duration(milliseconds: 1),
      (timer) {
        if (isAppOn) {
          countMilliSecond++;
        } else {
          timer.cancel();

          Database.onSetDayWiseWatchTime(DateTime.now().weekday, countMilliSecond.value);
        }
      },
    );
  }

  static Future<void> init() async {
    Utils.showLog("Build Manage Time =>   ${DateTime.now().weekday}");
    if (DateTime.now().weekday != Database.lastOpenWeekDay) {
      AppSettings.showLog("New Day Counting...");
      if (DateTime.now().weekday == 1) {
        onWeekChange();
        for (int i = 2; i <= 7; i++) {
          AppSettings.showLog("Day => $i");
          Database.onSetDayWiseWatchTime(i, 0);
        }
      }
      Database.onSetLastOpenWeekDay(DateTime.now().weekday);
      Database.onSetDayWiseWatchTime(DateTime.now().weekday, 0);
      onCount();
    } else {
      AppSettings.showLog("Previous Day Counting...");
      onCount();
    }
    onGetPercentage();
  }

  static void onWeekChange() {
    int totalWatchTime = 0;
    for (int i = 1; i <= 7; i++) {
      totalWatchTime = totalWatchTime + Database.dayWiseWatchTime(i);
    }
    Database.onSetLastWeekWatchTime(totalWatchTime);
  }

  static void onGetPercentage() {
    int totalWatchTime = 0;

    num lastWeek = 0;

    if (Database.lastWeekWatchTime == 0) {
      lastWeek = 1;
    } else {
      lastWeek = ((Database.lastWeekWatchTime / 1000) / 60);
    }

    for (int i = 1; i <= 7; i++) {
      totalWatchTime = totalWatchTime + Database.dayWiseWatchTime(i);
    }

    final currentWeek = (totalWatchTime / 1000) / 60;

    if (lastWeek < currentWeek) {
      // up
      percentage = lastWeek / currentWeek * 100;
      isDown = false;
    } else {
      // down
      percentage = currentWeek / lastWeek * 100;
      isDown = true;
    }
  }

  static int onGetAverage() {
    int totalWatchTime = 0;
    for (int i = 1; i <= 7; i++) {
      totalWatchTime = totalWatchTime + Database.dayWiseWatchTime(i);
    }
    double inMinute = ((totalWatchTime / 1000) / 60);
    int average = inMinute ~/ 7;
    return average;
  }
}
