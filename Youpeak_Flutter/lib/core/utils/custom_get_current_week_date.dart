import 'dart:developer';

import 'package:intl/intl.dart';

class CustomGetCurrentWeekDate {
  static List<DateTime> onGet() {
    List<DateTime> weekDates = [];

    DateTime now = DateTime.now();

    int currentWeekday = now.weekday;

    DateTime startOfWeek = now.subtract(Duration(days: currentWeekday - 1));

    for (int i = 0; i < 7; i++) {
      DateTime weekDay = startOfWeek.add(Duration(days: i));
      weekDates.add(weekDay);
    }

    return weekDates;
  }

  static String onShow(DateTime date) {
    DateFormat formatter = DateFormat('dd/MM');
    String formattedDay = formatter.format(date);
    log("Format Date => $formattedDay");
    return formattedDay;
  }
}
