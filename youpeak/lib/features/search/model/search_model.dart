import 'dart:convert';

SearchModel searchModelFromJson(String str) =>
    SearchModel.fromJson(json.decode(str));

String searchModelToJson(SearchModel data) => json.encode(data.toJson());

class SearchModel {
  SearchModel({
    bool? status,
    String? message,
    SearchData? searchData,
  }) {
    _status = status;
    _message = message;
    _searchData = searchData;
  }

  SearchModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _searchData = json['searchData'] != null
        ? SearchData.fromJson(json['searchData'])
        : null;
  }

  bool? _status;
  String? _message;
  SearchData? _searchData;

  SearchModel copyWith({
    bool? status,
    String? message,
    SearchData? searchData,
  }) =>
      SearchModel(
        status: status ?? _status,
        message: message ?? _message,
        searchData: searchData ?? _searchData,
      );

  bool? get status => _status;

  String? get message => _message;

  SearchData? get searchData => _searchData;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_searchData != null) {
      map['searchData'] = _searchData?.toJson();
    }
    return map;
  }
}

SearchData searchDataFromJson(String str) =>
    SearchData.fromJson(json.decode(str));

String searchDataToJson(SearchData data) => json.encode(data.toJson());

class SearchData {
  SearchData({
    List<Channel>? channel,
    List<Videos>? videos,
    List<Shorts>? shorts,
  }) {
    _channel = channel;
    _videos = videos;
    _shorts = shorts;
  }

  SearchData.fromJson(dynamic json) {
    // CHANNEL FIX
    if (json['channel'] != null) {
      _channel = [];

      for (var channelWrapper in json['channel']) {
        if (channelWrapper['data'] != null) {
          for (var ch in channelWrapper['data']) {
            _channel?.add(Channel.fromJson(ch));
          }
        }
      }
    }

    // VIDEOS
    if (json['videos'] != null) {
      _videos = [];
      json['videos'].forEach((v) {
        _videos?.add(Videos.fromJson(v));
      });
    }

    // SHORTS
    if (json['shorts'] != null) {
      _shorts = [];
      json['shorts'].forEach((v) {
        _shorts?.add(Shorts.fromJson(v));
      });
    }
  }

  List<Channel>? _channel;
  List<Videos>? _videos;
  List<Shorts>? _shorts;

  SearchData copyWith({
    List<Channel>? channel,
    List<Videos>? videos,
    List<Shorts>? shorts,
  }) =>
      SearchData(
        channel: channel ?? _channel,
        videos: videos ?? _videos,
        shorts: shorts ?? _shorts,
      );

  List<Channel>? get channel => _channel;

  List<Videos>? get videos => _videos;

  List<Shorts>? get shorts => _shorts;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (_channel != null) {
      map['channel'] = _channel?.map((v) => v.toJson()).toList();
    }
    if (_videos != null) {
      map['videos'] = _videos?.map((v) => v.toJson()).toList();
    }
    if (_shorts != null) {
      map['shorts'] = _shorts?.map((v) => v.toJson()).toList();
    }
    return map;
  }
}

Shorts shortsFromJson(String str) => Shorts.fromJson(json.decode(str));

String shortsToJson(Shorts data) => json.encode(data.toJson());

class Shorts {
  Shorts({
    String? id,
    String? title,
    String? description,
    int? videoType,
    num? videoTime,
    String? videoUrl,
    String? videoImage,
    String? channelId,
    String? createdAt,
    String? channelName,
    String? channelImage,
    bool? isSubscribed,
    bool? isSaveToWatchLater,
    int? views,
    String? time,
    num? subscriptionCost,
    num? videoUnlockCost,
    int? channelType,
    int? videoPrivacyType,
  }) {
    _id = id;
    _title = title;
    _description = description;
    _videoType = videoType;
    _videoTime = videoTime;
    _videoUrl = videoUrl;
    _videoImage = videoImage;
    _channelId = channelId;
    _createdAt = createdAt;
    _channelName = channelName;
    _channelImage = channelImage;
    _isSubscribed = isSubscribed;
    _isSaveToWatchLater = isSaveToWatchLater;
    _views = views;
    _time = time;
    _subscriptionCost = subscriptionCost;
    _videoUnlockCost = videoUnlockCost;
    _channelType = channelType;
    _videoPrivacyType = videoPrivacyType;
  }

  Shorts.fromJson(dynamic json) {
    _id = json['_id'];
    _title = json['title'];
    _description = json['description'];
    _videoType = json['videoType'];
    _videoTime = json['videoTime'];
    _videoUrl = json['videoUrl'];
    _videoImage = json['videoImage'];
    _channelId = json['channelId'];
    _createdAt = json['createdAt'];
    _channelName = json['channelName'];
    _channelImage = json['channelImage'];
    _isSubscribed = json['isSubscribed'];
    _isSaveToWatchLater = json['isSaveToWatchLater'];
    _views = json['views'];
    _time = json['time'];
    _subscriptionCost = json['subscriptionCost'];
    _videoUnlockCost = json['videoUnlockCost'];
    _channelType = json['channelType'];
    _videoPrivacyType = json['videoPrivacyType'];
  }

  String? _id;
  String? _title;
  String? _description;
  int? _videoType;
  num? _videoTime;
  String? _videoUrl;
  String? _videoImage;
  String? _channelId;
  String? _createdAt;
  String? _channelName;
  String? _channelImage;
  bool? _isSubscribed;
  bool? _isSaveToWatchLater;
  int? _views;
  String? _time;
  num? _subscriptionCost;
  num? _videoUnlockCost;
  int? _channelType;
  int? _videoPrivacyType;

  // Getters
  String? get id => _id;

  String? get title => _title;

  String? get description => _description;

  int? get videoType => _videoType;

  num? get videoTime => _videoTime;

  String? get videoUrl => _videoUrl;

  String? get videoImage => _videoImage;

  String? get channelId => _channelId;

  String? get createdAt => _createdAt;

  String? get channelName => _channelName;

  String? get channelImage => _channelImage;

  bool? get isSubscribed => _isSubscribed;

  bool? get isSaveToWatchLater => _isSaveToWatchLater;

  int? get views => _views;

  String? get time => _time;

  num? get subscriptionCost => _subscriptionCost;

  num? get videoUnlockCost => _videoUnlockCost;

  int? get channelType => _channelType;

  int? get videoPrivacyType => _videoPrivacyType;

  // Setters
  set id(String? value) => _id = value;

  set title(String? value) => _title = value;

  set description(String? value) => _description = value;

  set videoType(int? value) => _videoType = value;

  set videoTime(num? value) => _videoTime = value;

  set videoUrl(String? value) => _videoUrl = value;

  set videoImage(String? value) => _videoImage = value;

  set channelId(String? value) => _channelId = value;

  set createdAt(String? value) => _createdAt = value;

  set channelName(String? value) => _channelName = value;

  set channelImage(String? value) => _channelImage = value;

  set isSubscribed(bool? value) => _isSubscribed = value;

  set isSaveToWatchLater(bool? value) => _isSaveToWatchLater = value;

  set views(int? value) => _views = value;

  set time(String? value) => _time = value;

  set subscriptionCost(num? value) => _subscriptionCost = value;

  set videoUnlockCost(num? value) => _videoUnlockCost = value;

  set channelType(int? value) => _channelType = value;

  set videoPrivacyType(int? value) => _videoPrivacyType = value;

  // CopyWith method
  Shorts copyWith({
    String? id,
    String? title,
    String? description,
    int? videoType,
    int? videoTime,
    String? videoUrl,
    String? videoImage,
    String? channelId,
    String? createdAt,
    String? channelName,
    String? channelImage,
    bool? isSubscribed,
    bool? isSaveToWatchLater,
    int? views,
    String? time,
    int? subscriptionCost,
    int? videoUnlockCost,
    int? channelType,
    int? videoPrivacyType,
  }) =>
      Shorts(
        id: id ?? _id,
        title: title ?? _title,
        description: description ?? _description,
        videoType: videoType ?? _videoType,
        videoTime: videoTime ?? _videoTime,
        videoUrl: videoUrl ?? _videoUrl,
        videoImage: videoImage ?? _videoImage,
        channelId: channelId ?? _channelId,
        createdAt: createdAt ?? _createdAt,
        channelName: channelName ?? _channelName,
        channelImage: channelImage ?? _channelImage,
        isSubscribed: isSubscribed ?? _isSubscribed,
        isSaveToWatchLater: isSaveToWatchLater ?? _isSaveToWatchLater,
        views: views ?? _views,
        time: time ?? _time,
        subscriptionCost: subscriptionCost ?? _subscriptionCost,
        videoUnlockCost: videoUnlockCost ?? _videoUnlockCost,
        channelType: channelType ?? _channelType,
        videoPrivacyType: videoPrivacyType ?? _videoPrivacyType,
      );

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['title'] = _title;
    map['description'] = _description;
    map['videoType'] = _videoType;
    map['videoTime'] = _videoTime;
    map['videoUrl'] = _videoUrl;
    map['videoImage'] = _videoImage;
    map['channelId'] = _channelId;
    map['createdAt'] = _createdAt;
    map['channelName'] = _channelName;
    map['channelImage'] = _channelImage;
    map['isSubscribed'] = _isSubscribed;
    map['isSaveToWatchLater'] = _isSaveToWatchLater;
    map['views'] = _views;
    map['time'] = _time;
    map['subscriptionCost'] = _subscriptionCost;
    map['videoUnlockCost'] = _videoUnlockCost;
    map['channelType'] = _channelType;
    map['videoPrivacyType'] = _videoPrivacyType;
    return map;
  }
}

Videos videosFromJson(String str) => Videos.fromJson(json.decode(str));

String videosToJson(Videos data) => json.encode(data.toJson());

class Videos {
  Videos({
    String? id,
    String? title,
    String? description,
    int? videoType,
    int? videoTime,
    String? videoUrl,
    String? videoImage,
    String? channelId,
    String? createdAt,
    String? channelName,
    String? channelImage,
    bool? isSubscribed,
    bool? isSaveToWatchLater,
    int? views,
    String? time,
    num? subscriptionCost,
    num? videoUnlockCost,
    int? channelType,
    int? videoPrivacyType,
  }) {
    _id = id;
    _title = title;
    _description = description;
    _videoType = videoType;
    _videoTime = videoTime;
    _videoUrl = videoUrl;
    _videoImage = videoImage;
    _channelId = channelId;
    _createdAt = createdAt;
    _channelName = channelName;
    _channelImage = channelImage;
    _isSubscribed = isSubscribed;
    _isSaveToWatchLater = isSaveToWatchLater;
    _views = views;
    _time = time;
    _subscriptionCost = subscriptionCost;
    _videoUnlockCost = videoUnlockCost;
    _channelType = channelType;
    _videoPrivacyType = videoPrivacyType;
  }

  Videos.fromJson(dynamic json) {
    _id = json['_id'];
    _title = json['title'];
    _description = json['description'];
    _videoType = json['videoType'];
    _videoTime = json['videoTime'];
    _videoUrl = json['videoUrl'];
    _videoImage = json['videoImage'];
    _channelId = json['channelId'];
    _createdAt = json['createdAt'];
    _channelName = json['channelName'];
    _channelImage = json['channelImage'];
    _isSubscribed = json['isSubscribed'];
    _isSaveToWatchLater = json['isSaveToWatchLater'];
    _views = json['views'];
    _time = json['time'];
    _subscriptionCost = json['subscriptionCost'];
    _videoUnlockCost = json['videoUnlockCost'];
    _channelType = json['channelType'];
    _videoPrivacyType = json['videoPrivacyType'];
  }

  String? _id;
  String? _title;
  String? _description;
  int? _videoType;
  int? _videoTime;
  String? _videoUrl;
  String? _videoImage;
  String? _channelId;
  String? _createdAt;
  String? _channelName;
  String? _channelImage;
  bool? _isSubscribed;
  bool? _isSaveToWatchLater;
  int? _views;
  String? _time;
  num? _subscriptionCost;
  num? _videoUnlockCost;
  int? _channelType;
  int? _videoPrivacyType;

  // Getters
  String? get id => _id;

  String? get title => _title;

  String? get description => _description;

  int? get videoType => _videoType;

  int? get videoTime => _videoTime;

  String? get videoUrl => _videoUrl;

  String? get videoImage => _videoImage;

  String? get channelId => _channelId;

  String? get createdAt => _createdAt;

  String? get channelName => _channelName;

  String? get channelImage => _channelImage;

  bool? get isSubscribed => _isSubscribed;

  bool? get isSaveToWatchLater => _isSaveToWatchLater;

  int? get views => _views;

  String? get time => _time;

  num? get subscriptionCost => _subscriptionCost;

  num? get videoUnlockCost => _videoUnlockCost;

  int? get channelType => _channelType;

  int? get videoPrivacyType => _videoPrivacyType;

  // Setters
  set id(String? value) => _id = value;

  set title(String? value) => _title = value;

  set description(String? value) => _description = value;

  set videoType(int? value) => _videoType = value;

  set videoTime(int? value) => _videoTime = value;

  set videoUrl(String? value) => _videoUrl = value;

  set videoImage(String? value) => _videoImage = value;

  set channelId(String? value) => _channelId = value;

  set createdAt(String? value) => _createdAt = value;

  set channelName(String? value) => _channelName = value;

  set channelImage(String? value) => _channelImage = value;

  set isSubscribed(bool? value) => _isSubscribed = value;

  set isSaveToWatchLater(bool? value) => _isSaveToWatchLater = value;

  set views(int? value) => _views = value;

  set time(String? value) => _time = value;

  set subscriptionCost(num? value) => _subscriptionCost = value;

  set videoUnlockCost(num? value) => _videoUnlockCost = value;

  set channelType(int? value) => _channelType = value;

  set videoPrivacyType(int? value) => _videoPrivacyType = value;

  // CopyWith method
  Videos copyWith({
    String? id,
    String? title,
    String? description,
    int? videoType,
    int? videoTime,
    String? videoUrl,
    String? videoImage,
    String? channelId,
    String? createdAt,
    String? channelName,
    String? channelImage,
    bool? isSubscribed,
    bool? isSaveToWatchLater,
    int? views,
    String? time,
    num? subscriptionCost,
    num? videoUnlockCost,
    int? channelType,
    int? videoPrivacyType,
  }) =>
      Videos(
        id: id ?? _id,
        title: title ?? _title,
        description: description ?? _description,
        videoType: videoType ?? _videoType,
        videoTime: videoTime ?? _videoTime,
        videoUrl: videoUrl ?? _videoUrl,
        videoImage: videoImage ?? _videoImage,
        channelId: channelId ?? _channelId,
        createdAt: createdAt ?? _createdAt,
        channelName: channelName ?? _channelName,
        channelImage: channelImage ?? _channelImage,
        isSubscribed: isSubscribed ?? _isSubscribed,
        isSaveToWatchLater: isSaveToWatchLater ?? _isSaveToWatchLater,
        views: views ?? _views,
        time: time ?? _time,
        subscriptionCost: subscriptionCost ?? _subscriptionCost,
        videoUnlockCost: videoUnlockCost ?? _videoUnlockCost,
        channelType: channelType ?? _channelType,
        videoPrivacyType: videoPrivacyType ?? _videoPrivacyType,
      );

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['title'] = _title;
    map['description'] = _description;
    map['videoType'] = _videoType;
    map['videoTime'] = _videoTime;
    map['videoUrl'] = _videoUrl;
    map['videoImage'] = _videoImage;
    map['channelId'] = _channelId;
    map['createdAt'] = _createdAt;
    map['channelName'] = _channelName;
    map['channelImage'] = _channelImage;
    map['isSubscribed'] = _isSubscribed;
    map['isSaveToWatchLater'] = _isSaveToWatchLater;
    map['views'] = _views;
    map['time'] = _time;
    map['subscriptionCost'] = _subscriptionCost;
    map['videoUnlockCost'] = _videoUnlockCost;
    map['channelType'] = _channelType;
    map['videoPrivacyType'] = _videoPrivacyType;
    return map;
  }
}

Channel channelFromJson(String str) => Channel.fromJson(json.decode(str));

String channelToJson(Channel data) => json.encode(data.toJson());

class Channel {
  Channel({
    String? id,
    String? fullName,
    String? image,
    String? channelId,
    bool? isSubscribed,
    int? totalVideos,
    int? channelType,
    int? totalSubscribers,
    int? subscriptionCost,
    int? videoUnlockCost,
  }) {
    _id = id;
    _fullName = fullName;
    _image = image;
    _channelId = channelId;
    _isSubscribed = isSubscribed;
    _totalVideos = totalVideos;
    _channelType = channelType;
    _totalSubscribers = totalSubscribers;
    _subscriptionCost = subscriptionCost;
    _videoUnlockCost = videoUnlockCost;
  }

  Channel.fromJson(dynamic json) {
    _id = json['_id'];
    _fullName = json['fullName'];
    _image = json['image'];
    _channelId = json['channelId'];
    _isSubscribed = json['isSubscribed'];
    _totalVideos = json['totalVideos'];
    _channelType = json['channelType'];
    _totalSubscribers = json['totalSubscribers'];
    _subscriptionCost = json['subscriptionCost'];
    _videoUnlockCost = json['videoUnlockCost'];
  }

  String? _id;
  String? _fullName;
  String? _image;
  String? _channelId;
  bool? _isSubscribed;
  int? _totalVideos;
  int? _channelType;
  int? _totalSubscribers;
  int? _subscriptionCost;
  int? _videoUnlockCost;

  // Setter for channelType
  set channelType(int? value) {
    _channelType = value;
  }

  // Getters
  String? get id => _id;

  String? get fullName => _fullName;

  String? get image => _image;

  String? get channelId => _channelId;

  bool? get isSubscribed => _isSubscribed;

  int? get totalVideos => _totalVideos;

  int? get channelType => _channelType;

  int? get totalSubscribers => _totalSubscribers;

  int? get subscriptionCost => _subscriptionCost;

  int? get videoUnlockCost => _videoUnlockCost;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['fullName'] = _fullName;
    map['image'] = _image;
    map['channelId'] = _channelId;
    map['isSubscribed'] = _isSubscribed;
    map['totalVideos'] = _totalVideos;
    map['channelType'] = _channelType;
    map['totalSubscribers'] = _totalSubscribers;
    map['subscriptionCost'] = _subscriptionCost;
    map['videoUnlockCost'] = _videoUnlockCost;
    return map;
  }

  // CopyWith method for immutability
  Channel copyWith({
    String? id,
    String? fullName,
    String? image,
    String? channelId,
    bool? isSubscribed,
    int? totalVideos,
    int? channelType,
    int? totalSubscribers,
    int? subscriptionCost,
    int? videoUnlockCost,
  }) =>
      Channel(
        id: id ?? _id,
        fullName: fullName ?? _fullName,
        image: image ?? _image,
        channelId: channelId ?? _channelId,
        isSubscribed: isSubscribed ?? _isSubscribed,
        totalVideos: totalVideos ?? _totalVideos,
        channelType: channelType ?? _channelType,
        totalSubscribers: totalSubscribers ?? _totalSubscribers,
        subscriptionCost: subscriptionCost ?? _subscriptionCost,
        videoUnlockCost: videoUnlockCost ?? _videoUnlockCost,
      );
}

//
// class Channel {
//   Channel({
//     String? id,
//     String? fullName,
//     String? image,
//     String? channelId,
//     bool? isSubscribed,
//     int? totalVideos,
//     int? channelType,
//     int? totalSubscribers,
//     int? subscriptionCost,
//     int? videoUnlockCost,
//   }) {
//     _id = id;
//     _fullName = fullName;
//     _image = image;
//     _channelId = channelId;
//     _isSubscribed = isSubscribed;
//     _totalVideos = totalVideos;
//     _channelType = channelType;
//     _totalSubscribers = totalSubscribers;
//     _subscriptionCost = subscriptionCost;
//     _videoUnlockCost = videoUnlockCost;
//   }
//
//   Channel.fromJson(dynamic json) {
//     _id = json['_id'];
//     _fullName = json['fullName'];
//     _image = json['image'];
//     _channelId = json['channelId'];
//     _isSubscribed = json['isSubscribed'];
//     _totalVideos = json['totalVideos'];
//     _channelType = json['channelType'];
//     _totalSubscribers = json['totalSubscribers'];
//     _subscriptionCost = json['subscriptionCost'];
//     _videoUnlockCost = json['videoUnlockCost'];
//   }
//
//   String? _id;
//   String? _fullName;
//   String? _image;
//   String? _channelId;
//   bool? _isSubscribed;
//   int? _totalVideos;
//   int? _channelType;
//   int? _totalSubscribers;
//   int? _subscriptionCost;
//   int? _videoUnlockCost;
//
//   Channel copyWith({
//     String? id,
//     String? fullName,
//     String? image,
//     String? channelId,
//     bool? isSubscribed,
//     int? totalVideos,
//     int? channelType,
//     int? totalSubscribers,
//     int? subscriptionCost,
//     int? videoUnlockCost,
//   }) =>
//       Channel(
//         id: id ?? _id,
//         fullName: fullName ?? _fullName,
//         image: image ?? _image,
//         channelId: channelId ?? _channelId,
//         isSubscribed: isSubscribed ?? _isSubscribed,
//         totalVideos: totalVideos ?? _totalVideos,
//         channelType: channelType ?? _channelType,
//         totalSubscribers: totalSubscribers ?? _totalSubscribers,
//         subscriptionCost: subscriptionCost ?? _subscriptionCost,
//         videoUnlockCost: videoUnlockCost ?? _videoUnlockCost,
//       );
//
//   String? get id => _id;
//   String? get fullName => _fullName;
//   String? get image => _image;
//   String? get channelId => _channelId;
//   bool? get isSubscribed => _isSubscribed;
//   int? get totalVideos => _totalVideos;
//   int? get channelType => _channelType;
//   int? get totalSubscribers => _totalSubscribers;
//   int? get subscriptionCost => _subscriptionCost;
//   int? get videoUnlockCost => _videoUnlockCost;
//
//   Map<String, dynamic> toJson() {
//     final map = <String, dynamic>{};
//     map['_id'] = _id;
//     map['fullName'] = _fullName;
//     map['image'] = _image;
//     map['channelId'] = _channelId;
//     map['isSubscribed'] = _isSubscribed;
//     map['totalVideos'] = _totalVideos;
//     map['channelType'] = _channelType;
//     map['totalSubscribers'] = _totalSubscribers;
//     map['subscriptionCost'] = _subscriptionCost;
//     map['videoUnlockCost'] = _videoUnlockCost;
//     return map;
//   }
// }
