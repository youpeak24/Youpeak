import 'dart:io';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:youpeak/core/localization/localization_service.dart';
import 'package:youpeak/main.dart';
import 'package:youpeak/features/profile/api/get_profile_api.dart';
import 'package:youpeak/features/auth/view/lets_you_in_view.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/utils/utils.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class Database {
  static final localStorage = GetStorage();

  Future<void> init(String deviceId, String fcmToken) async {
    AppSettings.showLog("Local Database Initialize....");

    localStorage.write("deviceId", deviceId);
    localStorage.write("fcmToken", fcmToken);

    AppSettings.showLog("isNewUser => $isNewUser");

    if (isNewUser == false) {
      AppSettings.showLog("LoginUserId => $loginUserId");

      AppSettings.isIncognitoMode.value = Database.isIncognitoMode;
      AppSettings.isCreateHistory.value = Database.isCreateHistory;
      AppSettings.isAutoPlayVideo.value = Database.isAutoPlayVideo;
      AppSettings.showNotification.value = Database.showNotification;

      isDarkMode.value = isDarkTheme;

      Get.changeThemeMode(isDarkTheme ? ThemeMode.dark : ThemeMode.light);

      if (loginUserId != null) await GetProfileApi.callApi(loginUserId!);
    }
  }

  static bool get isNewUser => localStorage.read("isNewUser") ?? true;

  static bool get isOnBoarding => localStorage.read("isOnBoarding") ?? false;

  static String? get deviceId => localStorage.read("deviceId");

  static String? get fcmToken => localStorage.read("fcmToken");

  static bool get isDarkTheme => localStorage.read('isDarkMode') ?? false;

  static int get loginType => localStorage.read("loginType");

  static String? get loginUserId => localStorage.read("loginUserId");

  static bool get isChannel => localStorage.read("isChannel") ?? false;

  static String? get channelId => localStorage.read("channelId");

  static String get profileImage => localStorage.read("profileImage");

  static bool get isCreateHistory => localStorage.read("isCreateHistory") ?? true;

  static bool get isIncognitoMode => localStorage.read("isIncognitoMode") ?? false;

  static bool get isAutoPlayVideo => localStorage.read("isAutoPlayVideo") ?? false;

  static bool get showNotification => localStorage.read("showNotification") ?? true;

  static onSetIncognitoMode(bool isIncognitoMode) async => await localStorage.write("isIncognitoMode", isIncognitoMode);

  static onSetCreateHistory(bool isCreateHistory) async => await localStorage.write("isCreateHistory", isCreateHistory);

  static onSetAutoPlayVideo(bool isAutoPlayVideo) async => await localStorage.write("isAutoPlayVideo", isAutoPlayVideo);

  static onSetNotification(bool showNotification) async => await localStorage.write("showNotification", showNotification);

  // >>>>> Use To Get Profile Api Call Time <<<<<

  static onSetIsNewUser(bool isNewUser) async => localStorage.write("isNewUser", isNewUser);

  static onSetOnBoarding(bool isOnBoarding) async => await localStorage.write("isOnBoarding", isOnBoarding);

  static onSetLoginType(int loginType) async => localStorage.write("loginType", loginType);

  static onSetLoginUserId(String loginUserId) async => localStorage.write("loginUserId", loginUserId);

  static onSetIsChannel(bool isChannel) async => localStorage.write("isChannel", isChannel);

  static onSetChannelId(String channelId) async => localStorage.write("channelId", channelId);

  static onSetProfileImage(String profileImage) async => localStorage.write("profileImage", profileImage);

  // >>>>> Use To Get Images <<<<<

  static String? onGetImageUrl(String videoId) => localStorage.read("Image_$videoId");

  static String? onGetVideoUrl(String videoId) => localStorage.read(videoId);

  static String? onGetChannelImageUrl(String channelId) => localStorage.read("Channel_Img_$channelId");

  static onSetImageUrl(String videoId, String imageUrl) async => await localStorage.write("Image_$videoId", imageUrl);

  static onSetVideoUrl(String videoId, String? videoUrl) async => await localStorage.write(videoId, videoUrl);

  static onSetChannelImageUrl(String channelId, String imageUrl) async => await localStorage.write("Channel_Img_$channelId", imageUrl);

  // >>>>> Watch Time Database <<<<<

  static int get lastOpenWeekDay => localStorage.read("weekDay") ?? 0;

  static int dayWiseWatchTime(int day) => localStorage.read("$day") ?? 0;

  static int get lastWeekWatchTime => localStorage.read("lastWeekWatchTime") ?? 0;

  static onSetDayWiseWatchTime(int day, int watchTime) async {
    Utils.showLog("Make content ==> $watchTime");
    await localStorage.write("$day", watchTime);
  }

  static onSetLastOpenWeekDay(int weekDay) async => await localStorage.write("weekDay", weekDay);

  static onSetLastWeekWatchTime(int watchTime) async => await localStorage.write("lastWeekWatchTime", watchTime);

  // *** Watch Ad History Database ***

  static int? get nextAdTaskTime => localStorage.read("nextAdTaskTime");
  static onSetNextAdTaskTime(int nextAdTaskTime) async => await localStorage.write("nextAdTaskTime", nextAdTaskTime);

  static String? get lastRewardDate => localStorage.read("lastRewardDate");
  static onSetLastRewardDate(String lastRewardDate) async => await localStorage.write("lastRewardDate", lastRewardDate);

  // >>>>> >>>>> Set Language Database <<<<< <<<<<

  static onSetSelectedLanguage(String language) async => await localStorage.write("language", language);
  static onSetSelectedLanguageCountryCode(String languageCountryCode) async => await localStorage.write("languageCountryCode", languageCountryCode);

  // >>>>> >>>>> Get Language Database <<<<< <<<<<

  static String get selectedLanguage => localStorage.read("language") ?? 'en';
  static String get languageCountryCode => localStorage.read("languageCountryCode") ?? 'US';

  // *** Watch Ad History Database ***

  static Future<void> logOut() async {
    int overlayCount = 0;
    while (Get.isOverlaysOpen && overlayCount < 5) {
      Get.back();
      overlayCount++;
    }
    if (overlayCount > 0) {
      await Future.delayed(const Duration(milliseconds: 100));
    }

    final SharedPreferences preferences = await SharedPreferences.getInstance();
    AppSettings.showLog("Logout Method Called....");

    // >>>>> Clean Local Database <<<<<

    final appId = deviceId;
    final token = fcmToken;
    final lang = selectedLanguage;
    final countryCode = languageCountryCode;
    final isDark = isDarkTheme;
    final boarding = isOnBoarding;
    final newUser = isNewUser;

    if (loginType == 2) {
      AppSettings.showLog("Google Logout Success");
      await GoogleSignIn().signOut();
    }
    if (loginType == 3) {
      FirebaseAuth.instance.signOut();
    }
    await localStorage.erase();
    await preferences.clear();
    if (Platform.isAndroid) {
      await onDeleteDownload();
    }
    AppSettings.navigationIndex.value = 0;

    localStorage.write("deviceId", appId);
    localStorage.write("fcmToken", token);
    localStorage.write("language", lang);
    localStorage.write("languageCountryCode", countryCode);
    localStorage.write("isDarkMode", isDark);
    localStorage.write("isOnBoarding", boarding);
    localStorage.write("isNewUser", newUser);

    // final localizationService = Get.find<LocalizationService>();
    // await localizationService.switchLanguage('en', 'en');


    Get.put(LocalizationService());
    await Get.find<LocalizationService>().init();


    Get.offAll(() => const LetsYouInView());
  }
}

Future<void> onDeleteDownload() async {
  Directory? externalDir = Platform.isAndroid ? await getExternalStorageDirectory() : await getApplicationSupportDirectory();
  if (await externalDir?.exists() ?? false) {
    try {
      await externalDir?.delete(recursive: true);
      debugPrint('External storage directory removed successfully');
    } catch (e) {
      debugPrint('Error while removing external storage directory: $e');
    }
  } else {
    debugPrint('External storage directory does not exist');
  }
}
