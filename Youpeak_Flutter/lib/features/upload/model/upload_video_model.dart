import 'dart:convert';

UploadVideoModel uploadVideoModelFromJson(String str) => UploadVideoModel.fromJson(json.decode(str));
String uploadVideoModelToJson(UploadVideoModel data) => json.encode(data.toJson());

class UploadVideoModel {
  UploadVideoModel({
    bool? status,
    String? message,
    Video? video,
  }) {
    _status = status;
    _message = message;
    _video = video;
  }

  UploadVideoModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _video = json['video'] != null ? Video.fromJson(json['video']) : null;
  }
  bool? _status;
  String? _message;
  Video? _video;
  UploadVideoModel copyWith({
    bool? status,
    String? message,
    Video? video,
  }) =>
      UploadVideoModel(
        status: status ?? _status,
        message: message ?? _message,
        video: video ?? _video,
      );
  bool? get status => _status;
  String? get message => _message;
  Video? get video => _video;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_video != null) {
      map['video'] = _video?.toJson();
    }
    return map;
  }
}

Video videoFromJson(String str) => Video.fromJson(json.decode(str));
String videoToJson(Video data) => json.encode(data.toJson());

class Video {
  Video({
    LocationCoordinates? locationCoordinates,
    dynamic soundListId,
    String? id,
    String? uniqueVideoId,
    List<String>? hashTag,
    bool? isActive,
    bool? isAddByAdmin,
    int? shareCount,
    int? like,
    int? dislike,
    String? title,
    int? videoType,
    String? description,
    int? videoTime,
    String? videoUrl,
    String? videoImage,
    int? visibilityType,
    int? audienceType,
    int? ageRestrictionType,
    int? commentType,
    int? scheduleType,
    String? scheduleTime,
    String? location,
    UserId? userId,
    String? channelId,
    String? createdAt,
    String? updatedAt,
  }) {
    _locationCoordinates = locationCoordinates;
    _soundListId = soundListId;
    _id = id;
    _uniqueVideoId = uniqueVideoId;
    _hashTag = hashTag;
    _isActive = isActive;
    _isAddByAdmin = isAddByAdmin;
    _shareCount = shareCount;
    _like = like;
    _dislike = dislike;
    _title = title;
    _videoType = videoType;
    _description = description;
    _videoTime = videoTime;
    _videoUrl = videoUrl;
    _videoImage = videoImage;
    _visibilityType = visibilityType;
    _audienceType = audienceType;
    _ageRestrictionType = ageRestrictionType;
    _commentType = commentType;
    _scheduleType = scheduleType;
    _scheduleTime = scheduleTime;
    _location = location;
    _userId = userId;
    _channelId = channelId;
    _createdAt = createdAt;
    _updatedAt = updatedAt;
  }

  Video.fromJson(dynamic json) {
    _locationCoordinates = json['locationCoordinates'] != null
        ? LocationCoordinates.fromJson(json['locationCoordinates'])
        : null;
    _soundListId = json['soundListId'];
    _id = json['_id'];
    _uniqueVideoId = json['uniqueVideoId'];
    _hashTag = json['hashTag'] != null ? json['hashTag'].cast<String>() : [];
    _isActive = json['isActive'];
    _isAddByAdmin = json['isAddByAdmin'];
    _shareCount = json['shareCount'];
    _like = json['like'];
    _dislike = json['dislike'];
    _title = json['title'];
    _videoType = json['videoType'];
    _description = json['description'];
    _videoTime = json['videoTime'];
    _videoUrl = json['videoUrl'];
    _videoImage = json['videoImage'];
    _visibilityType = json['visibilityType'];
    _audienceType = json['audienceType'];
    _ageRestrictionType = json['ageRestrictionType'];
    _commentType = json['commentType'];
    _scheduleType = json['scheduleType'];
    _scheduleTime = json['scheduleTime'];
    _location = json['location'];
    _userId = json['userId'] != null ? UserId.fromJson(json['userId']) : null;
    _channelId = json['channelId'];
    _createdAt = json['createdAt'];
    _updatedAt = json['updatedAt'];
  }
  LocationCoordinates? _locationCoordinates;
  dynamic _soundListId;
  String? _id;
  String? _uniqueVideoId;
  List<String>? _hashTag;
  bool? _isActive;
  bool? _isAddByAdmin;
  int? _shareCount;
  int? _like;
  int? _dislike;
  String? _title;
  int? _videoType;
  String? _description;
  int? _videoTime;
  String? _videoUrl;
  String? _videoImage;
  int? _visibilityType;
  int? _audienceType;
  int? _ageRestrictionType;
  int? _commentType;
  int? _scheduleType;
  String? _scheduleTime;
  String? _location;
  UserId? _userId;
  String? _channelId;
  String? _createdAt;
  String? _updatedAt;
  Video copyWith({
    LocationCoordinates? locationCoordinates,
    dynamic soundListId,
    String? id,
    String? uniqueVideoId,
    List<String>? hashTag,
    bool? isActive,
    bool? isAddByAdmin,
    int? shareCount,
    int? like,
    int? dislike,
    String? title,
    int? videoType,
    String? description,
    int? videoTime,
    String? videoUrl,
    String? videoImage,
    int? visibilityType,
    int? audienceType,
    int? ageRestrictionType,
    int? commentType,
    int? scheduleType,
    String? scheduleTime,
    String? location,
    UserId? userId,
    String? channelId,
    String? createdAt,
    String? updatedAt,
  }) =>
      Video(
        locationCoordinates: locationCoordinates ?? _locationCoordinates,
        soundListId: soundListId ?? _soundListId,
        id: id ?? _id,
        uniqueVideoId: uniqueVideoId ?? _uniqueVideoId,
        hashTag: hashTag ?? _hashTag,
        isActive: isActive ?? _isActive,
        isAddByAdmin: isAddByAdmin ?? _isAddByAdmin,
        shareCount: shareCount ?? _shareCount,
        like: like ?? _like,
        dislike: dislike ?? _dislike,
        title: title ?? _title,
        videoType: videoType ?? _videoType,
        description: description ?? _description,
        videoTime: videoTime ?? _videoTime,
        videoUrl: videoUrl ?? _videoUrl,
        videoImage: videoImage ?? _videoImage,
        visibilityType: visibilityType ?? _visibilityType,
        audienceType: audienceType ?? _audienceType,
        ageRestrictionType: ageRestrictionType ?? _ageRestrictionType,
        commentType: commentType ?? _commentType,
        scheduleType: scheduleType ?? _scheduleType,
        scheduleTime: scheduleTime ?? _scheduleTime,
        location: location ?? _location,
        userId: userId ?? _userId,
        channelId: channelId ?? _channelId,
        createdAt: createdAt ?? _createdAt,
        updatedAt: updatedAt ?? _updatedAt,
      );
  LocationCoordinates? get locationCoordinates => _locationCoordinates;
  dynamic get soundListId => _soundListId;
  String? get id => _id;
  String? get uniqueVideoId => _uniqueVideoId;
  List<String>? get hashTag => _hashTag;
  bool? get isActive => _isActive;
  bool? get isAddByAdmin => _isAddByAdmin;
  int? get shareCount => _shareCount;
  int? get like => _like;
  int? get dislike => _dislike;
  String? get title => _title;
  int? get videoType => _videoType;
  String? get description => _description;
  int? get videoTime => _videoTime;
  String? get videoUrl => _videoUrl;
  String? get videoImage => _videoImage;
  int? get visibilityType => _visibilityType;
  int? get audienceType => _audienceType;
  int? get ageRestrictionType => _ageRestrictionType;
  int? get commentType => _commentType;
  int? get scheduleType => _scheduleType;
  String? get scheduleTime => _scheduleTime;
  String? get location => _location;
  UserId? get userId => _userId;
  String? get channelId => _channelId;
  String? get createdAt => _createdAt;
  String? get updatedAt => _updatedAt;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (_locationCoordinates != null) {
      map['locationCoordinates'] = _locationCoordinates?.toJson();
    }
    map['soundListId'] = _soundListId;
    map['_id'] = _id;
    map['uniqueVideoId'] = _uniqueVideoId;
    map['hashTag'] = _hashTag;
    map['isActive'] = _isActive;
    map['isAddByAdmin'] = _isAddByAdmin;
    map['shareCount'] = _shareCount;
    map['like'] = _like;
    map['dislike'] = _dislike;
    map['title'] = _title;
    map['videoType'] = _videoType;
    map['description'] = _description;
    map['videoTime'] = _videoTime;
    map['videoUrl'] = _videoUrl;
    map['videoImage'] = _videoImage;
    map['visibilityType'] = _visibilityType;
    map['audienceType'] = _audienceType;
    map['ageRestrictionType'] = _ageRestrictionType;
    map['commentType'] = _commentType;
    map['scheduleType'] = _scheduleType;
    map['scheduleTime'] = _scheduleTime;
    map['location'] = _location;
    if (_userId != null) {
      map['userId'] = _userId?.toJson();
    }
    map['channelId'] = _channelId;
    map['createdAt'] = _createdAt;
    map['updatedAt'] = _updatedAt;
    return map;
  }
}

UserId userIdFromJson(String str) => UserId.fromJson(json.decode(str));
String userIdToJson(UserId data) => json.encode(data.toJson());

class UserId {
  UserId({
    String? id,
    String? fullName,
    String? nickName,
  }) {
    _id = id;
    _fullName = fullName;
    _nickName = nickName;
  }

  UserId.fromJson(dynamic json) {
    _id = json['_id'];
    _fullName = json['fullName'];
    _nickName = json['nickName'];
  }
  String? _id;
  String? _fullName;
  String? _nickName;
  UserId copyWith({
    String? id,
    String? fullName,
    String? nickName,
  }) =>
      UserId(
        id: id ?? _id,
        fullName: fullName ?? _fullName,
        nickName: nickName ?? _nickName,
      );
  String? get id => _id;
  String? get fullName => _fullName;
  String? get nickName => _nickName;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['fullName'] = _fullName;
    map['nickName'] = _nickName;
    return map;
  }
}

LocationCoordinates locationCoordinatesFromJson(String str) => LocationCoordinates.fromJson(json.decode(str));
String locationCoordinatesToJson(LocationCoordinates data) => json.encode(data.toJson());

class LocationCoordinates {
  LocationCoordinates({
    String? latitude,
    String? longitude,
  }) {
    _latitude = latitude;
    _longitude = longitude;
  }

  LocationCoordinates.fromJson(dynamic json) {
    _latitude = json['latitude'];
    _longitude = json['longitude'];
  }
  String? _latitude;
  String? _longitude;
  LocationCoordinates copyWith({
    String? latitude,
    String? longitude,
  }) =>
      LocationCoordinates(
        latitude: latitude ?? _latitude,
        longitude: longitude ?? _longitude,
      );
  String? get latitude => _latitude;
  String? get longitude => _longitude;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['latitude'] = _latitude;
    map['longitude'] = _longitude;
    return map;
  }
}
