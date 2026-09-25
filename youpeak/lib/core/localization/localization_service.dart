import 'dart:convert';
import 'dart:developer';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:http/http.dart' as http;
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/localization/models/language_info.dart';
import 'package:youpeak/core/localization/models/localization_version.dart';
import 'package:youpeak/features/settings/model/fetch_language_model.dart';
import 'package:youpeak/core/constants/app_constant.dart';
import 'package:youpeak/core/storage/prefrens.dart';
import 'package:youpeak/core/utils/utils.dart';

import 'package:youpeak/core/localization/models/language_model.dart';
import 'package:youpeak/core/localization/languages/language_zh_cn.dart';

class LocalizationService extends GetxService {
  final _storage = GetStorage();
  final String _versionKey = 'lang_version';
  final String _langDataPrefix = 'lang_data_';
  final String _langListKey = 'supported_langs_list';

  List<LanguageInfo> supportedLanguages = [];

  /// Returns the language code of the language marked as default (isDefault == true).
  /// Falls back to the first language in the list, or empty string if list is empty.
  String get defaultLanguageCode {
    if (supportedLanguages.isEmpty) return '';
    try {
      return supportedLanguages.firstWhere((l) => l.isDefault).code;
    } catch (_) {
      return supportedLanguages.first.code;
    }
  }

  Future<LocalizationService> init() async {
    log("message>>>>>>>LocalizationService>>>>");
    // 1. Load cached supported languages list so UI has them immediately
    _loadCachedLanguageList();

    // 2. Instantly load cached translations so UI doesn't delay
    _loadCachedTranslations();

    // 3. Detect first launch using the version key.
    //    _versionKey is only written after a successful full sync, so null = first launch.
    //    NOTE: init() runs before runApp(), so Get.updateLocale() here has no effect.
    //    fetchAndCacheLanguage() handles the locale refresh after translations are loaded.
    String currentLang = Get.locale?.languageCode ?? Database.selectedLanguage;
    final bool isFirstLaunch = _storage.read(_versionKey) == null || _storage.read(_langDataPrefix + currentLang) == null;
    if (isFirstLaunch) {
      // Await so translations are fetched & injected before runApp() is called
      await syncTranslations();
    } else {
      syncTranslations(); // background update on subsequent launches
    }

    return this;
  }

  /// Instantly load translations from GetStorage into GetX memory
  void _loadCachedTranslations() {
    String langCode = Get.locale?.languageCode ?? Database.selectedLanguage;
    String countryCodeVal = Get.locale?.countryCode ?? Database.languageCountryCode;
    String localeKey = "${langCode}_$countryCodeVal";

    var cachedData = _storage.read(_langDataPrefix + langCode);
    var langData = _storage.read(_langDataPrefix + langCode);
    Map<String, Map<String, String>> translationsMap = {};

    if (langData != null) {
      try {
        final languageModel = LanguageModel.fromJson(langData);
        translationsMap[localeKey] = languageModel.translations;
      } catch (e) {
        Utils.showLog("Failed to parse cached translations for $localeKey: $e");
      }
    } else if (langCode.startsWith('zh')) {
      translationsMap['zh_CN'] = enZhCN;
      translationsMap['zh'] = enZhCN;
    }

    if (translationsMap.isNotEmpty) {
      Get.appendTranslations(translationsMap);
      Utils.showLog("Loaded $langCode from GetStorage Cache");
    }
  }

  void _loadCachedLanguageList() {
    log("supportedLanguages>>>>>>>_langListKey${_langListKey}");

    var cachedData = _storage.read(_langListKey);
    log("supportedLanguages>>>>>>>${cachedData}");

    if (cachedData != null && cachedData is List) {
      try {
        supportedLanguages = cachedData.map((e) => LanguageInfo.fromJson(e)).toList();
        log("supportedLanguages>>>>>>>${supportedLanguages}");
      } catch (e) {
        Utils.showLog("Failed to load cached language list: $e");
      }
    }
  }

  /// Check version and fetch new maps if necessary
  Future<void> syncTranslations() async {
    try {
      log("syncTranslations>>>>>${Constant.fetchLatestLanguageVersion}");
      final versionRes = await http.get(Uri.parse(Constant.baseURL + Constant.fetchLatestLanguageVersion), headers: {"key": Constant.secretKey});
      log("versionRes>>>>>${versionRes.body}");
      if (versionRes.statusCode == 200) {
        final versionData = LocalizationVersion.fromJson(jsonDecode(versionRes.body));
        log("Version Data> $versionData");
        final onlineVersion = versionData.version;
        final localVersion = _storage.read(_versionKey);
        log("Local Version> $localVersion");
        log("Online Version> $onlineVersion");

        /// Fetch supported languages list todo for this if version not update then uncomment below lines
        // await fetchSupportedLanguages();
        // String currentLang = Get.locale?.languageCode ?? 'en';
        // await fetchAndCacheLanguage(currentLang);
        // Even if versions match, if we have no supported languages in cache we must fetch them
        if (localVersion != onlineVersion || supportedLanguages.isEmpty) {
          Utils.showLog("New language data found or missing. Updating...");

          await fetchSupportedLanguages();

          // Fetch the default language first (isDefault == true) as the fallback locale
          final String defCode = defaultLanguageCode;
          if (defCode.isNotEmpty) {
            await fetchAndCacheLanguage(defCode);
          }

          // Also fetch the currently selected language if it differs from the default
          String currentLang = Get.locale?.languageCode ?? Database.selectedLanguage;
          if (currentLang.isNotEmpty && currentLang != defCode) {
            await fetchAndCacheLanguage(currentLang);
          }

          _storage.write(_versionKey, onlineVersion);
        } else {
          // Version matches — but check if default language cache is missing (edge case on first login)
          final String defCode = defaultLanguageCode;
          if (defCode.isNotEmpty && _storage.read(_langDataPrefix + defCode) == null) {
            await fetchAndCacheLanguage(defCode);
          }

          String currentLang = Get.locale?.languageCode ?? Database.selectedLanguage;
          if (currentLang.isNotEmpty && currentLang != defCode && _storage.read(_langDataPrefix + currentLang) == null) {
            await fetchAndCacheLanguage(currentLang);
          }
        }
      }
    } catch (e) {
      Utils.showLog("Translation sync failed: $e (Using fallbacks)");
    }
  }

  Future<void> fetchSupportedLanguages() async {
    try {
      final url = "${Constant.baseURL}${Constant.fetchLanguages}?start=1&limit=20";
      final res = await http.get(Uri.parse(url), headers: {"key": Constant.secretKey});

      if (res.statusCode == 200) {
        final fetchLanguageModel = FetchLanguageModel.fromJson(jsonDecode(res.body));

        if (fetchLanguageModel.data != null && (fetchLanguageModel.data?.isNotEmpty ?? false)) {
          supportedLanguages = fetchLanguageModel.data!;
          _storage.write(_langListKey, supportedLanguages.map((e) => e.toJson()).toList());
          Utils.showLog("Successfully downloaded first page of languages. Count: ${supportedLanguages.length}");
        }

        print("Translation debug: Successfully fetched active languages");
      } else {
        print("Translation debug: Failed to fetch active languages: ${res.statusCode}");
      }
    } catch (e) {
      Utils.showLog("Failed to fetch supported languages: $e");
      print("Translation debug: Exception fetching active languages: $e");
    }
  }

  /// Download specific language from Constant and inject into GetX
  Future<void> fetchAndCacheLanguage(String langCode) async {
    try {
      final res = await http.get(Uri.parse("${Constant.baseURL + Constant.fetchLanguageTranslations}?languageCode=$langCode&module=app"), headers: {"key": Constant.secretKey});
      log("Fetched language translations>>>> request > ${res.request}");
      log("Fetched language translations>>> headers > ${res.headers}");
      if (res.statusCode == 200) {
        final rawJson = jsonDecode(res.body);
        final languageModel = LanguageModel.fromJson(rawJson);
        log("Fetched language translations> ${languageModel.toJson()}");
        // 1. Save to GetStorage for future app launches
        _storage.write(_langDataPrefix + langCode, languageModel.toJson());

        // 2. Inject into GetX memory
        String currentCountry = Get.locale?.countryCode ?? Database.languageCountryCode;
        String localeKey = "${langCode}_$currentCountry";
        Get.appendTranslations({
          localeKey: languageModel.translations,
        });

        // 3. Update global version key if version is present in model
        if (languageModel.version.isNotEmpty) {
          _storage.write(_versionKey, languageModel.version);
        }

        // 4. Force UI refresh
        if (Get.locale?.languageCode == langCode) {
          Get.updateLocale(Get.locale!);
        }
        Utils.showLog("Successfully downloaded & applied $langCode");
        print("Translation debug: Successfully downloaded translations for $langCode");
      } else {
        print("Translation debug: Failed to fetch translation $langCode: ${res.statusCode}");
      }
    } catch (e) {
      Utils.showLog("Failed to fetch langCode $langCode: $e");
      print("Translation debug: Exception fetching translations $langCode: $e");
    }
  }

  /// Call this when the user manually changes the language in app settings
  Future<void> switchLanguage(String langCode, String countryCode) async {
    String lCode = langCode;
    String cCode = countryCode;

    if (langCode.contains('_')) {
      var split = langCode.split('_');
      lCode = split[0];
      cCode = split[1];
    }

    Locale newLocale = Locale(lCode, cCode);

    // Check if we have this language cached (use the original langCode for storage key)
    var cachedData = _storage.read(_langDataPrefix + langCode) ?? _storage.read(_langDataPrefix + lCode);

    if (cachedData == null) {
      await fetchAndCacheLanguage(langCode);
    }

    await Get.updateLocale(newLocale);
    _loadCachedTranslations();
  }
}
