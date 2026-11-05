import 'package:intl/intl.dart';

class CustomFormatDate {
  static String convert(String date) {
    DateTime convertToDate = DateTime.parse(date);
    return DateFormat('dd-MM-yy').format(convertToDate);
  }
}
