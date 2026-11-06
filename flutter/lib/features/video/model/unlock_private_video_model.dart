import 'dart:convert';

UnlockPrivateVideoModel unlockPrivateVideoModelFromJson(String str) => UnlockPrivateVideoModel.fromJson(json.decode(str));
String unlockPrivateVideoModelToJson(UnlockPrivateVideoModel data) => json.encode(data.toJson());

class UnlockPrivateVideoModel {
  UnlockPrivateVideoModel({
    bool? status,
    String? message,
    bool? isUnlocked,
    String? videoUrl,
  }) {
    _status = status;
    _message = message;
    _isUnlocked = isUnlocked;
    _videoUrl = videoUrl;
  }

  UnlockPrivateVideoModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _isUnlocked = json['isUnlocked'];
    _videoUrl = json['videoUrl'];
  }
  bool? _status;
  String? _message;
  bool? _isUnlocked;
  // Playback URL for the buyer; feeds withhold a locked video's URL.
  String? _videoUrl;
  UnlockPrivateVideoModel copyWith({
    bool? status,
    String? message,
    bool? isUnlocked,
  }) =>
      UnlockPrivateVideoModel(
        status: status ?? _status,
        message: message ?? _message,
        isUnlocked: isUnlocked ?? _isUnlocked,
      );
  bool? get status => _status;
  String? get message => _message;
  bool? get isUnlocked => _isUnlocked;
  String? get videoUrl => _videoUrl;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    map['isUnlocked'] = _isUnlocked;
    return map;
  }
}
