import 'dart:convert';
GetAdRewardModel getAdRewardModelFromJson(String str) => GetAdRewardModel.fromJson(json.decode(str));
String getAdRewardModelToJson(GetAdRewardModel data) => json.encode(data.toJson());
class GetAdRewardModel {
  GetAdRewardModel({
      bool? status, 
      String? message, 
      UserWatchAds? userWatchAds, 
      List<Data>? data,}){
    _status = status;
    _message = message;
    _userWatchAds = userWatchAds;
    _data = data;
}

  GetAdRewardModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _userWatchAds = json['userWatchAds'] != null ? UserWatchAds.fromJson(json['userWatchAds']) : null;
    if (json['data'] != null) {
      _data = [];
      json['data'].forEach((v) {
        _data?.add(Data.fromJson(v));
      });
    }
  }
  bool? _status;
  String? _message;
  UserWatchAds? _userWatchAds;
  List<Data>? _data;
GetAdRewardModel copyWith({  bool? status,
  String? message,
  UserWatchAds? userWatchAds,
  List<Data>? data,
}) => GetAdRewardModel(  status: status ?? _status,
  message: message ?? _message,
  userWatchAds: userWatchAds ?? _userWatchAds,
  data: data ?? _data,
);
  bool? get status => _status;
  String? get message => _message;
  UserWatchAds? get userWatchAds => _userWatchAds;
  List<Data>? get data => _data;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_userWatchAds != null) {
      map['userWatchAds'] = _userWatchAds?.toJson();
    }
    if (_data != null) {
      map['data'] = _data?.map((v) => v.toJson()).toList();
    }
    return map;
  }

}

Data dataFromJson(String str) => Data.fromJson(json.decode(str));
String dataToJson(Data data) => json.encode(data.toJson());
class Data {
  Data({
      String? id, 
      String? adLabel, 
      int? adDisplayInterval, 
      int? coinEarnedFromAd, 
      String? createdAt, 
      String? updatedAt,}){
    _id = id;
    _adLabel = adLabel;
    _adDisplayInterval = adDisplayInterval;
    _coinEarnedFromAd = coinEarnedFromAd;
    _createdAt = createdAt;
    _updatedAt = updatedAt;
}

  Data.fromJson(dynamic json) {
    _id = json['_id'];
    _adLabel = json['adLabel'];
    _adDisplayInterval = json['adDisplayInterval'];
    _coinEarnedFromAd = json['coinEarnedFromAd'];
    _createdAt = json['createdAt'];
    _updatedAt = json['updatedAt'];
  }
  String? _id;
  String? _adLabel;
  int? _adDisplayInterval;
  int? _coinEarnedFromAd;
  String? _createdAt;
  String? _updatedAt;
Data copyWith({  String? id,
  String? adLabel,
  int? adDisplayInterval,
  int? coinEarnedFromAd,
  String? createdAt,
  String? updatedAt,
}) => Data(  id: id ?? _id,
  adLabel: adLabel ?? _adLabel,
  adDisplayInterval: adDisplayInterval ?? _adDisplayInterval,
  coinEarnedFromAd: coinEarnedFromAd ?? _coinEarnedFromAd,
  createdAt: createdAt ?? _createdAt,
  updatedAt: updatedAt ?? _updatedAt,
);
  String? get id => _id;
  String? get adLabel => _adLabel;
  int? get adDisplayInterval => _adDisplayInterval;
  int? get coinEarnedFromAd => _coinEarnedFromAd;
  String? get createdAt => _createdAt;
  String? get updatedAt => _updatedAt;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['adLabel'] = _adLabel;
    map['adDisplayInterval'] = _adDisplayInterval;
    map['coinEarnedFromAd'] = _coinEarnedFromAd;
    map['createdAt'] = _createdAt;
    map['updatedAt'] = _updatedAt;
    return map;
  }

}

UserWatchAds userWatchAdsFromJson(String str) => UserWatchAds.fromJson(json.decode(str));
String userWatchAdsToJson(UserWatchAds data) => json.encode(data.toJson());
class UserWatchAds {
  UserWatchAds({
      int? count, 
      String? date,}){
    _count = count;
    _date = date;
}

  UserWatchAds.fromJson(dynamic json) {
    _count = json['count'];
    _date = json['date'];
  }
  int? _count;
  String? _date;
UserWatchAds copyWith({  int? count,
  String? date,
}) => UserWatchAds(  count: count ?? _count,
  date: date ?? _date,
);
  int? get count => _count;
  String? get date => _date;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['count'] = _count;
    map['date'] = _date;
    return map;
  }

}