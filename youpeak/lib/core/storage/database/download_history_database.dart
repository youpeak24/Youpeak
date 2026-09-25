import 'dart:convert';

import 'package:get/get_rx/src/rx_types/rx_types.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:shared_preferences/shared_preferences.dart';

class DownloadHistory {
  static RxList<Map<String, dynamic>> mainDownloadHistory = <Map<String, dynamic>>[].obs;

  static Future<void> onGet() async {
    // This Method Call Open App...

    final SharedPreferences preferences = await SharedPreferences.getInstance();

    AppSettings.showLog("Download History Database OnGet Method Called...");

    final jsonData = preferences.getString("downloadHistory");

    if (jsonData != null) {
      List<dynamic> jsonDecodeData = json.decode(jsonData);

      mainDownloadHistory.value = List<Map<String, dynamic>>.from(
        jsonDecodeData.map((item) => Map<String, dynamic>.from(item)),
      );
    } else {
      mainDownloadHistory.value = [];
    }

    AppSettings.showLog("Download History Length => ${mainDownloadHistory.length}");

    AppSettings.showLog("Download History  => $mainDownloadHistory");
  }

  static Future<void> onSet() async {
    // This Method Call Download Video Time...

    final SharedPreferences preferences = await SharedPreferences.getInstance();

    String jsonData = json.encode(mainDownloadHistory);

    final isSuccess = await preferences.setString("downloadHistory", jsonData);
    isSuccess
        ? AppSettings.showLog("Download History Database OnSet Method Called Success")
        : AppSettings.showLog("Download History Database OnSet Method Called Error");
  }
}
