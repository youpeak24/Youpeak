import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:youpeak/core/storage/database/database.dart';
import 'package:youpeak/core/localization/languages/language_ar.dart';
import 'package:youpeak/core/localization/languages/language_bn.dart';
import 'package:youpeak/core/localization/languages/language_de.dart';
import 'package:youpeak/core/localization/languages/language_en.dart';
import 'package:youpeak/core/localization/languages/language_es.dart';
import 'package:youpeak/core/localization/languages/language_fr.dart';
import 'package:youpeak/core/localization/languages/language_hi.dart';
import 'package:youpeak/core/localization/languages/language_id.dart';
import 'package:youpeak/core/localization/languages/language_it.dart';
import 'package:youpeak/core/localization/languages/language_ja.dart';
import 'package:youpeak/core/localization/languages/language_pt.dart';
import 'package:youpeak/core/localization/languages/language_ru.dart';
import 'package:youpeak/core/localization/languages/language_sw.dart';
import 'package:youpeak/core/localization/languages/language_ta.dart';
import 'package:youpeak/core/localization/languages/language_te.dart';
import 'package:youpeak/core/localization/languages/language_tr.dart';
import 'package:youpeak/core/localization/languages/language_ur.dart';
import 'package:youpeak/core/localization/models/language_info.dart';
import 'package:youpeak/core/localization/models/language_model.dart';
import 'package:youpeak/core/utils/utils.dart';

import 'package:youpeak/core/localization/languages/language_ko.dart';
import 'package:youpeak/core/localization/languages/language_zh_cn.dart';

// class AppLanguages extends Translations {
//   @override
//   Map<String, Map<String, String>> get keys => {
//         "ar_DZ": enAr,
//         "bn_In": enBn,
//         "zh_CN": enZhCN,
//         "en_US": enUS,
//         "fr_Fr": enFr,
//         "de_De": enDe,
//         "hi_IN": enHi,
//         "it_In": enIt,
//         "id_ID": enId,
//         "ja_JP": jaJP,
//         "ko_KR": enKo,
//         "pt_PT": enPt,
//         "ru_RU": enRu,
//         "es_ES": enEs,
//         "sw_KE": enSw,
//         "tr_TR": enTr,
//         "te_IN": enTe,
//         "ta_IN": enTa,
//         "ur_PK": enUr,
//       };
// }
//
// final List<LanguageModel> languages = [
//   LanguageModel("dz", "Arabic (العربية)", 'ar', 'DZ'),
//   LanguageModel("🇮🇳", "Bengali (বাংলা)", 'bn', 'IN'),
//   LanguageModel("🇨🇳", "Chinese Simplified (中国人)", 'zh', 'CN'),
//   LanguageModel("🇺🇸", "English (English)", 'en', 'US'),
//   LanguageModel("🇫🇷", "French (français)", 'fr', 'FR'),
//   LanguageModel("🇩🇪", "German (Deutsche)", 'de', 'DE'),
//   LanguageModel("🇮🇳", "Hindi (हिंदी)", 'hi', 'IN'),
//   LanguageModel("🇮🇹", "Italian (italiana)", 'it', 'IT'),
//   LanguageModel("🇮🇩", "Indonesian (bahasa indo)", 'id', 'ID'),
//   LanguageModel("🇯🇵", "Japanese (日本語)", 'ja', 'JP'),
//   LanguageModel("🇰🇵", "Korean (한국인)", 'ko', 'KR'),
//   LanguageModel("🇵🇹", "Portuguese (português)", 'pt', 'PT'),
//   LanguageModel("🇷🇺", "Russian (русский)", 'ru', 'RU'),
//   LanguageModel("🇪🇸", "Spanish (Español)", 'es', 'ES'),
//   LanguageModel("🇰🇪", "Swahili (Kiswahili)", 'sw', 'KE'),
//   LanguageModel("🇹🇷", "Turkish (Türk)", 'tr', 'TR'),
//   LanguageModel("🇮🇳", "Telugu (తెలుగు)", 'te', 'IN'),
//   LanguageModel("🇮🇳", "Tamil (தமிழ்)", 'ta', 'IN'),
//   LanguageModel("🇵🇰", "(اردو) Urdu", 'ur', 'PK'),
// ];
//
// class LanguageModel {
//   LanguageModel(
//     this.symbol,
//     this.language,
//     this.languageCode,
//     this.countryCode,
//   );
//
//   String language;
//   String symbol;
//   String countryCode;
//   String languageCode;
// }

class AppLanguages extends Translations {
  final box = GetStorage();
  final String _langDataPrefix = 'lang_data_';
  final String _langListKey = 'supported_langs_list';

  /// Returns the code of the language marked as default (isDefault == true).
  String get _defaultLangCode {
    final cachedList = box.read(_langListKey);
    if (cachedList != null && cachedList is List) {
      try {
        final langs = cachedList.map((e) => LanguageInfo.fromJson(e)).toList();
        final def = langs.cast<LanguageInfo?>().firstWhere(
              (l) => l?.isDefault == true,
              orElse: () => langs.isNotEmpty ? langs.first : null,
            );
        return def?.code ?? '';
      } catch (_) {}
    }
    return '';
  }

  @override
  Map<String, Map<String, String>> get keys {
    // 1. Initial Map with bundled local translations as guaranteed fallbacks
    Map<String, Map<String, String>> translationsMap = {
      "ar_DZ": enAr,
      "bn_In": enBn,
      "zh_CN": enZhCN,
      "zh_US": enZhCN,
      "zh": enZhCN,
      "en_US": enUS,
      "fr_Fr": enFr,
      "de_De": enDe,
      "hi_IN": enHi,
      "it_In": enIt,
      "id_ID": enId,
      "ja_JP": jaJP,
      "ko_KR": enKo,
      "pt_PT": enPt,
      "ru_RU": enRu,
      "es_ES": enEs,
      "sw_KE": enSw,
      "tr_TR": enTr,
      "te_IN": enTe,
      "ta_IN": enTa,
      "ur_PK": enUr,
    };

    // 2. Overlay with Cached Data (API data) if available
    final String defCode = _defaultLangCode;
    if (defCode.isNotEmpty) {
      var defData = box.read(_langDataPrefix + defCode);
      if (defData != null) {
        try {
          final languageModel = LanguageModel.fromJson(defData);
          translationsMap['${defCode}_US'] = languageModel.translations;
        } catch (_) {}
      }
    }

    String currentLang = Get.locale?.languageCode ?? Database.selectedLanguage;
    String currentCountry = Get.locale?.countryCode ?? Database.languageCountryCode;
    String localeKey = "${currentLang}_$currentCountry";

    if (currentLang.isNotEmpty && currentLang != defCode) {
      var langData = box.read(_langDataPrefix + currentLang) ?? box.read(_langDataPrefix + Database.selectedLanguage);
      if (langData != null) {
        try {
          final languageModel = LanguageModel.fromJson(langData);
          translationsMap[localeKey] = languageModel.translations;
        } catch (_) {}
      }
    }

    return translationsMap;
  }
}
