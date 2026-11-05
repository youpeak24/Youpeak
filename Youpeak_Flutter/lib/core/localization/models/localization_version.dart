class LocalizationVersion {
  final String version;
  final DateTime timestamp;

  LocalizationVersion({
    required this.version,
    required this.timestamp,
  });

  factory LocalizationVersion.fromJson(Map<String, dynamic> json) {
    String versionStr = '';
    if (json['data'] is String) {
      versionStr = json['data'];
    } else if (json['version'] is String) {
      versionStr = json['version'];
    }

    return LocalizationVersion(
      version: versionStr,
      timestamp: json['timestamp'] != null ? DateTime.parse(json['timestamp']) : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'version': version,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}
