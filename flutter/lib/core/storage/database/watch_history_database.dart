import 'dart:convert';

import 'package:get/get_rx/src/rx_types/rx_types.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:shared_preferences/shared_preferences.dart';

class WatchHistory {
  static RxList<Map<String, dynamic>> mainWatchHistory = <Map<String, dynamic>>[].obs;

  static Future<void> onGet() async {
    // This Method Call Open App...
  
    final SharedPreferences preferences = await SharedPreferences.getInstance();

    AppSettings.showLog("Watch History Database OnGet Method Called...");

    final jsonData = preferences.getString("watchHistory");

    if (jsonData != null) {
      List<dynamic> jsonDecodeData = json.decode(jsonData);

      mainWatchHistory.value = List<Map<String, dynamic>>.from(
        jsonDecodeData.map((item) => Map<String, dynamic>.from(item)),
      );
    } else {
      mainWatchHistory.value = [];
    }

    AppSettings.showLog("Watch History Length => ${mainWatchHistory.length}");

    AppSettings.showLog("Watch History  => $mainWatchHistory");
  }

  static Future<void> onSet() async {
    // This Method Call Video Watch Time...

    final SharedPreferences preferences = await SharedPreferences.getInstance();

    String jsonData = json.encode(mainWatchHistory);

    final isSuccess = await preferences.setString("watchHistory", jsonData);
    isSuccess
        ? AppSettings.showLog("Watch History Database OnSet Method Called Success")
        : AppSettings.showLog("Watch History Database OnSet Method Called Error");
  }
}
