import 'package:get/get.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SearchHistory {
  static RxList<String> mainSearchHistory = <String>[].obs;

  static Future<void> onGet() async {
    // This Method Call Go to Search Page...

    final SharedPreferences preferences = await SharedPreferences.getInstance();

    AppSettings.showLog("Search History Database OnGet Method Called...");

    final data = preferences.getStringList("searchHistory");

    mainSearchHistory.value = data ?? [];
    AppSettings.showLog("Search History Length => ${mainSearchHistory.length}");
  }

  static Future<void> onSet() async {
    // This Method Call Leave to Search Page...

    final SharedPreferences preferences = await SharedPreferences.getInstance();

    final isSuccess = await preferences.setStringList("searchHistory", mainSearchHistory);
    isSuccess
        ? AppSettings.showLog("Search History Database OnSet Method Called Success")
        : AppSettings.showLog("Search History Database OnSet Method Called Error");
  }
}
