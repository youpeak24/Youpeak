import 'dart:convert';

CreateLiveUserModel createLiveUserModelFromJson(String str) => CreateLiveUserModel.fromJson(json.decode(str));
String createLiveUserModelToJson(CreateLiveUserModel data) => json.encode(data.toJson());

class CreateLiveUserModel {
  CreateLiveUserModel({
    bool? status,
    String? message,
    LiveUser? liveUser,
  }) {
    _status = status;
    _message = message;
    _liveUser = liveUser;
  }

  CreateLiveUserModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _liveUser = json['liveUser'] != null ? LiveUser.fromJson(json['liveUser']) : null;
  }
  bool? _status;
  String? _message;
  LiveUser? _liveUser;
  CreateLiveUserModel copyWith({
    bool? status,
    String? message,
    LiveUser? liveUser,
  }) =>
      CreateLiveUserModel(
        status: status ?? _status,
        message: message ?? _message,
        liveUser: liveUser ?? _liveUser,
      );
  bool? get status => _status;
  String? get message => _message;
  LiveUser? get liveUser => _liveUser;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_liveUser != null) {
      map['liveUser'] = _liveUser?.toJson();
    }
    return map;
  }
}

LiveUser liveUserFromJson(String str) => LiveUser.fromJson(json.decode(str));
String liveUserToJson(LiveUser data) => json.encode(data.toJson());

class LiveUser {
  LiveUser({
    String? id,
    String? image,
    String? channel,
    int? view,
    String? liveHistoryId,
    String? userId,
    String? createdAt,
    String? updatedAt,
  }) {
    _id = id;
    _image = image;
    _channel = channel;
    _view = view;
    _liveHistoryId = liveHistoryId;
    _userId = userId;
    _createdAt = createdAt;
    _updatedAt = updatedAt;
  }

  LiveUser.fromJson(dynamic json) {
    _id = json['_id'];
    _image = json['image'];
    _channel = json['channel'];
    _view = json['view'];
    _liveHistoryId = json['liveHistoryId'];
    _userId = json['userId'];
    _createdAt = json['createdAt'];
    _updatedAt = json['updatedAt'];
  }
  String? _id;
  String? _image;
  String? _channel;
  int? _view;
  String? _liveHistoryId;
  String? _userId;
  String? _createdAt;
  String? _updatedAt;
  LiveUser copyWith({
    String? id,
    String? image,
    String? channel,
    int? view,
    String? liveHistoryId,
    String? userId,
    String? createdAt,
    String? updatedAt,
  }) =>
      LiveUser(
        id: id ?? _id,
        image: image ?? _image,
        channel: channel ?? _channel,
        view: view ?? _view,
        liveHistoryId: liveHistoryId ?? _liveHistoryId,
        userId: userId ?? _userId,
        createdAt: createdAt ?? _createdAt,
        updatedAt: updatedAt ?? _updatedAt,
      );
  String? get id => _id;
  String? get image => _image;
  String? get channel => _channel;
  int? get view => _view;
  String? get liveHistoryId => _liveHistoryId;
  String? get userId => _userId;
  String? get createdAt => _createdAt;
  String? get updatedAt => _updatedAt;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['image'] = _image;
    map['channel'] = _channel;
    map['view'] = _view;
    map['liveHistoryId'] = _liveHistoryId;
    map['userId'] = _userId;
    map['createdAt'] = _createdAt;
    map['updatedAt'] = _updatedAt;
    return map;
  }
}
