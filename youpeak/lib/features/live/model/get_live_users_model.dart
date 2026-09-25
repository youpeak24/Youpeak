import 'dart:convert';

GetLiveUsersModel getLiveUsersModelFromJson(String str) => GetLiveUsersModel.fromJson(json.decode(str));
String getLiveUsersModelToJson(GetLiveUsersModel data) => json.encode(data.toJson());

class GetLiveUsersModel {
  GetLiveUsersModel({
    bool? status,
    String? message,
    List<LiveUserList>? liveUserList,
  }) {
    _status = status;
    _message = message;
    _liveUserList = liveUserList;
  }

  GetLiveUsersModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    if (json['liveUserList'] != null) {
      _liveUserList = [];
      json['liveUserList'].forEach((v) {
        _liveUserList?.add(LiveUserList.fromJson(v));
      });
    }
  }
  bool? _status;
  String? _message;
  List<LiveUserList>? _liveUserList;
  GetLiveUsersModel copyWith({
    bool? status,
    String? message,
    List<LiveUserList>? liveUserList,
  }) =>
      GetLiveUsersModel(
        status: status ?? _status,
        message: message ?? _message,
        liveUserList: liveUserList ?? _liveUserList,
      );
  bool? get status => _status;
  String? get message => _message;
  List<LiveUserList>? get liveUserList => _liveUserList;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_liveUserList != null) {
      map['liveUserList'] = _liveUserList?.map((v) => v.toJson()).toList();
    }
    return map;
  }
}

LiveUserList liveUserListFromJson(String str) => LiveUserList.fromJson(json.decode(str));
String liveUserListToJson(LiveUserList data) => json.encode(data.toJson());

class LiveUserList {
  LiveUserList({
    String? id,
    String? fullName,
    String? nickName,
    String? image,
    String? channelId,
    bool? isLive,
    String? liveHistoryId,
    int? view,
  }) {
    _id = id;
    _fullName = fullName;
    _nickName = nickName;
    _image = image;
    _channelId = channelId;
    _isLive = isLive;
    _liveHistoryId = liveHistoryId;
    _view = view;
  }

  LiveUserList.fromJson(dynamic json) {
    _id = json['_id'];
    _fullName = json['fullName'];
    _nickName = json['nickName'];
    _image = json['image'];
    _channelId = json['channelId'];
    _isLive = json['isLive'];
    _liveHistoryId = json['liveHistoryId'];
    _view = json['view'];
  }
  String? _id;
  String? _fullName;
  String? _nickName;
  String? _image;
  String? _channelId;
  bool? _isLive;
  String? _liveHistoryId;
  int? _view;
  LiveUserList copyWith({
    String? id,
    String? fullName,
    String? nickName,
    String? image,
    String? channelId,
    bool? isLive,
    String? liveHistoryId,
    int? view,
  }) =>
      LiveUserList(
        id: id ?? _id,
        fullName: fullName ?? _fullName,
        nickName: nickName ?? _nickName,
        image: image ?? _image,
        channelId: channelId ?? _channelId,
        isLive: isLive ?? _isLive,
        liveHistoryId: liveHistoryId ?? _liveHistoryId,
        view: view ?? _view,
      );
  String? get id => _id;
  String? get fullName => _fullName;
  String? get nickName => _nickName;
  String? get image => _image;
  String? get channelId => _channelId;
  bool? get isLive => _isLive;
  String? get liveHistoryId => _liveHistoryId;
  int? get view => _view;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['fullName'] = _fullName;
    map['nickName'] = _nickName;
    map['image'] = _image;
    map['channelId'] = _channelId;
    map['isLive'] = _isLive;
    map['liveHistoryId'] = _liveHistoryId;
    map['view'] = _view;
    return map;
  }
}
