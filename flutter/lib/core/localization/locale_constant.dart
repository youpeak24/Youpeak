import 'dart:developer';
import 'dart:ui';

import 'package:youpeak/core/storage/prefrens.dart';
import 'package:youpeak/core/settings/app_settings.dart';

Future<Locale> getLocale() async {
  String languageCode = Preference.shared.getString(Preference.selectedLanguage) ?? AppSettings.languageEn;
  String countryCode = Preference.shared.getString(Preference.selectedCountryCode) ?? AppSettings.countryCodeEn;
  log("getLocale Updated $languageCode   $countryCode");
  return _locale(languageCode, countryCode);
}

Locale _locale(String languageCode, String countryCode) {
  return languageCode.isNotEmpty ? Locale(languageCode, countryCode) : const Locale(AppSettings.languageEn, AppSettings.countryCodeEn);
}
