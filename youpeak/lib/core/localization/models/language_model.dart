class LanguageModel {
  final String code;
  final String name;
  final String nativeName;
  final Map<String, String> translations;
  final String version;

  LanguageModel({
    required this.code,
    required this.name,
    required this.nativeName,
    required this.translations,
    required this.version,
  });

  factory LanguageModel.fromJson(Map<String, dynamic> json) {
    // Handle new API response structure with doc wrapper
    Map<String, dynamic> data = json;
    if (json.containsKey('doc')) {
      data = json['doc'];
    } else if (json.containsKey('docs') && json['docs'] is List && json['docs'].isNotEmpty) {
      data = json['docs'][0];
    }

    // Extract version safely (can be String or Map in new API)
    String versionStr = '';
    if (json['version'] is String) {
      versionStr = json['version'];
    } else if (data['version'] is String) {
      versionStr = data['version'];
    }

    // Filter out empty translations to trigger GetX fallback mechanism
    final Map<String, dynamic> rawTranslations = data['translations'] ?? {};
    final Map<String, String> filteredTranslations = {};
    rawTranslations.forEach((key, value) {
      if (value.toString().trim().isNotEmpty) {
        filteredTranslations[key] = value.toString();
      }
    });

    return LanguageModel(
      code: data['languageCode'] ?? data['code'] ?? '',
      name: data['name'] ?? '',
      nativeName: data['nativeName'] ?? data['native_name'] ?? '',
      translations: filteredTranslations,
      version: versionStr,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'code': code,
      'name': name,
      'nativeName': nativeName,
      'translations': translations,
      'version': version,
    };
  }

  String getTranslation(String key, {String fallback = ''}) {
    return translations[key] ?? fallback;
  }
}
