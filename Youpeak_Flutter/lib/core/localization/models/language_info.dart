class LanguageInfo {
  final String code;
  final String name;
  final String nativeName;
  final String icon;
  final bool isDefault;

  LanguageInfo({
    required this.code,
    required this.name,
    required this.nativeName,
    this.icon = "",
    this.isDefault = false,
  });

  factory LanguageInfo.fromJson(Map<String, dynamic> json) {
    final String languageCode = json['languageCode'] ?? json['code'] ?? '';
    return LanguageInfo(
      code: languageCode,
      name: json['name'] ?? json['languageTitle'] ?? "",
      nativeName: json['nativeName'] ?? json['native_name'] ?? json['localLanguageTitle'] ?? "",
      icon: json['languageIcon'] ?? "",
      isDefault: json['isDefault'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {'code': code, 'name': name, 'nativeName': nativeName, 'icon': icon, 'isDefault': isDefault};
  }
}
