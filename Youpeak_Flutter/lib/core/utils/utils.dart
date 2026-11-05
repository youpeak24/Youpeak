import 'package:flutter/material.dart';

class Utils {
  static showLog(String text) => true == true ? print(text) : null;
}

extension HeightExtension on num {
  SizedBox get height => SizedBox(height: toDouble());
}

extension WidthExtension on num {
  SizedBox get width => SizedBox(width: toDouble());
}
