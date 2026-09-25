import 'dart:convert';

GetSoundModel getSoundModelFromJson(String str) => GetSoundModel.fromJson(json.decode(str));
String getSoundModelToJson(GetSoundModel data) => json.encode(data.toJson());

class GetSoundModel {
  GetSoundModel({
    bool? status,
    String? message,
    List<SoundList>? soundList,
  }) {
    _status = status;
    _message = message;
    _soundList = soundList;
  }

  GetSoundModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    if (json['soundList'] != null) {
      _soundList = [];
      json['soundList'].forEach((v) {
        _soundList?.add(SoundList.fromJson(v));
      });
    }
  }
  bool? _status;
  String? _message;
  List<SoundList>? _soundList;
  GetSoundModel copyWith({
    bool? status,
    String? message,
    List<SoundList>? soundList,
  }) =>
      GetSoundModel(
        status: status ?? _status,
        message: message ?? _message,
        soundList: soundList ?? _soundList,
      );
  bool? get status => _status;
  String? get message => _message;
  List<SoundList>? get soundList => _soundList;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_soundList != null) {
      map['soundList'] = _soundList?.map((v) => v.toJson()).toList();
    }
    return map;
  }
}

SoundList soundListFromJson(String str) => SoundList.fromJson(json.decode(str));
String soundListToJson(SoundList data) => json.encode(data.toJson());

class SoundList {
  SoundList({
    String? id,
    String? singerName,
    String? soundTitle,
    String? soundLink,
    int? soundTime,
    String? soundImage,
    SoundCategoryId? soundCategoryId,
    String? createdAt,
    String? updatedAt,
  }) {
    _id = id;
    _singerName = singerName;
    _soundTitle = soundTitle;
    _soundLink = soundLink;
    _soundTime = soundTime;
    _soundImage = soundImage;
    _soundCategoryId = soundCategoryId;
    _createdAt = createdAt;
    _updatedAt = updatedAt;
  }

  SoundList.fromJson(dynamic json) {
    _id = json['_id'];
    _singerName = json['singerName'];
    _soundTitle = json['soundTitle'];
    _soundLink = json['soundLink'];
    _soundTime = json['soundTime'];
    _soundImage = json['soundImage'];
    _soundCategoryId = json['soundCategoryId'] != null ? SoundCategoryId.fromJson(json['soundCategoryId']) : null;
    _createdAt = json['createdAt'];
    _updatedAt = json['updatedAt'];
  }
  String? _id;
  String? _singerName;
  String? _soundTitle;
  String? _soundLink;
  int? _soundTime;
  String? _soundImage;
  SoundCategoryId? _soundCategoryId;
  String? _createdAt;
  String? _updatedAt;
  SoundList copyWith({
    String? id,
    String? singerName,
    String? soundTitle,
    String? soundLink,
    int? soundTime,
    String? soundImage,
    SoundCategoryId? soundCategoryId,
    String? createdAt,
    String? updatedAt,
  }) =>
      SoundList(
        id: id ?? _id,
        singerName: singerName ?? _singerName,
        soundTitle: soundTitle ?? _soundTitle,
        soundLink: soundLink ?? _soundLink,
        soundTime: soundTime ?? _soundTime,
        soundImage: soundImage ?? _soundImage,
        soundCategoryId: soundCategoryId ?? _soundCategoryId,
        createdAt: createdAt ?? _createdAt,
        updatedAt: updatedAt ?? _updatedAt,
      );
  String? get id => _id;
  String? get singerName => _singerName;
  String? get soundTitle => _soundTitle;
  String? get soundLink => _soundLink;
  int? get soundTime => _soundTime;
  String? get soundImage => _soundImage;
  SoundCategoryId? get soundCategoryId => _soundCategoryId;
  String? get createdAt => _createdAt;
  String? get updatedAt => _updatedAt;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['singerName'] = _singerName;
    map['soundTitle'] = _soundTitle;
    map['soundLink'] = _soundLink;
    map['soundTime'] = _soundTime;
    map['soundImage'] = _soundImage;
    if (_soundCategoryId != null) {
      map['soundCategoryId'] = _soundCategoryId?.toJson();
    }
    map['createdAt'] = _createdAt;
    map['updatedAt'] = _updatedAt;
    return map;
  }
}

SoundCategoryId soundCategoryIdFromJson(String str) => SoundCategoryId.fromJson(json.decode(str));
String soundCategoryIdToJson(SoundCategoryId data) => json.encode(data.toJson());

class SoundCategoryId {
  SoundCategoryId({
    String? id,
    String? name,
    String? image,
  }) {
    _id = id;
    _name = name;
    _image = image;
  }

  SoundCategoryId.fromJson(dynamic json) {
    _id = json['_id'];
    _name = json['name'];
    _image = json['image'];
  }
  String? _id;
  String? _name;
  String? _image;
  SoundCategoryId copyWith({
    String? id,
    String? name,
    String? image,
  }) =>
      SoundCategoryId(
        id: id ?? _id,
        name: name ?? _name,
        image: image ?? _image,
      );
  String? get id => _id;
  String? get name => _name;
  String? get image => _image;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['name'] = _name;
    map['image'] = _image;
    return map;
  }
}
