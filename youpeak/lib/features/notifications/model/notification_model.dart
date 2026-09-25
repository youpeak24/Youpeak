import 'dart:convert';

NotificationModel notificationModelFromJson(String str) => NotificationModel.fromJson(json.decode(str));
String notificationModelToJson(NotificationModel data) => json.encode(data.toJson());

class NotificationModel {
  NotificationModel({
    bool? status,
    String? message,
    List<Notification>? notification,
  }) {
    _status = status;
    _message = message;
    _notification = notification;
  }

  NotificationModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    if (json['notification'] != null) {
      _notification = [];
      json['notification'].forEach((v) {
        _notification?.add(Notification.fromJson(v));
      });
    }
  }
  bool? _status;
  String? _message;
  List<Notification>? _notification;
  NotificationModel copyWith({
    bool? status,
    String? message,
    List<Notification>? notification,
  }) =>
      NotificationModel(
        status: status ?? _status,
        message: message ?? _message,
        notification: notification ?? _notification,
      );
  bool? get status => _status;
  String? get message => _message;
  List<Notification>? get notification => _notification;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_notification != null) {
      map['notification'] = _notification?.map((v) => v.toJson()).toList();
    }
    return map;
  }
}

Notification notificationFromJson(String str) => Notification.fromJson(json.decode(str));
String notificationToJson(Notification data) => json.encode(data.toJson());

class Notification {
  Notification({
    String? id,
    String? title,
    String? message,
    String? userId,
    String? videoId,
    String? channelImage,
    String? videoImage,
    String? createdAt,
    String? updatedAt,
    String? time,
  }) {
    _id = id;
    _title = title;
    _message = message;
    _userId = userId;
    _videoId = videoId;
    _channelImage = channelImage;
    _videoImage = videoImage;
    _createdAt = createdAt;
    _updatedAt = updatedAt;
    _time = time;
  }

  Notification.fromJson(dynamic json) {
    _id = json['_id'];
    _title = json['title'];
    _message = json['message'];
    _userId = json['userId'];
    _videoId = json['videoId'];
    _channelImage = json['channelImage'];
    _videoImage = json['videoImage'];
    _createdAt = json['createdAt'];
    _updatedAt = json['updatedAt'];
    _time = json['time'];
  }
  String? _id;
  String? _title;
  String? _message;
  String? _userId;
  String? _videoId;
  String? _channelImage;
  String? _videoImage;
  String? _createdAt;
  String? _updatedAt;
  String? _time;
  Notification copyWith({
    String? id,
    String? title,
    String? message,
    String? userId,
    String? videoId,
    String? channelImage,
    String? videoImage,
    String? createdAt,
    String? updatedAt,
    String? time,
  }) =>
      Notification(
        id: id ?? _id,
        title: title ?? _title,
        message: message ?? _message,
        userId: userId ?? _userId,
        videoId: videoId ?? _videoId,
        channelImage: channelImage ?? _channelImage,
        videoImage: videoImage ?? _videoImage,
        createdAt: createdAt ?? _createdAt,
        updatedAt: updatedAt ?? _updatedAt,
        time: time ?? _time,
      );
  String? get id => _id;
  String? get title => _title;
  String? get message => _message;
  String? get userId => _userId;
  String? get videoId => _videoId;
  String? get channelImage => _channelImage;
  String? get videoImage => _videoImage;
  String? get createdAt => _createdAt;
  String? get updatedAt => _updatedAt;
  String? get time => _time;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['title'] = _title;
    map['message'] = _message;
    map['userId'] = _userId;
    map['videoId'] = _videoId;
    map['channelImage'] = _channelImage;
    map['videoImage'] = _videoImage;
    map['createdAt'] = _createdAt;
    map['updatedAt'] = _updatedAt;
    map['time'] = _time;
    return map;
  }
}
