import 'dart:convert';

GetDailyRewardModel getDailyRewardModelFromJson(String str) => GetDailyRewardModel.fromJson(json.decode(str));
String getDailyRewardModelToJson(GetDailyRewardModel data) => json.encode(data.toJson());

class GetDailyRewardModel {
  GetDailyRewardModel({
    bool? status,
    String? message,
    List<DailyRewardData>? data,
    int? streak,
    int? totalCoins,
  }) {
    _status = status;
    _message = message;
    _data = data;
    _streak = streak;
    _totalCoins = totalCoins;
  }

  GetDailyRewardModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    if (json['data'] != null) {
      _data = [];
      json['data'].forEach((v) {
        _data?.add(DailyRewardData.fromJson(v));
      });
    }
    _streak = json['streak'];
    _totalCoins = json['totalCoins'];
  }
  bool? _status;
  String? _message;
  List<DailyRewardData>? _data;
  int? _streak;
  int? _totalCoins;
  GetDailyRewardModel copyWith({
    bool? status,
    String? message,
    List<DailyRewardData>? data,
    int? streak,
    int? totalCoins,
  }) =>
      GetDailyRewardModel(
        status: status ?? _status,
        message: message ?? _message,
        data: data ?? _data,
        streak: streak ?? _streak,
        totalCoins: totalCoins ?? _totalCoins,
      );
  bool? get status => _status;
  String? get message => _message;
  List<DailyRewardData>? get data => _data;
  int? get streak => _streak;
  int? get totalCoins => _totalCoins;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_data != null) {
      map['data'] = _data?.map((v) => v.toJson()).toList();
    }
    map['streak'] = _streak;
    map['totalCoins'] = _totalCoins;
    return map;
  }
}

DailyRewardData dataFromJson(String str) => DailyRewardData.fromJson(json.decode(str));
String dataToJson(DailyRewardData data) => json.encode(data.toJson());

class DailyRewardData {
  DailyRewardData({
    int? day,
    int? reward,
    bool? isCheckIn,
    dynamic checkInDate,
  }) {
    _day = day;
    _reward = reward;
    _isCheckIn = isCheckIn;
    _checkInDate = checkInDate;
  }

  DailyRewardData.fromJson(dynamic json) {
    _day = json['day'];
    _reward = json['reward'];
    _isCheckIn = json['isCheckIn'];
    _checkInDate = json['checkInDate'];
  }
  int? _day;
  int? _reward;
  bool? _isCheckIn;
  dynamic _checkInDate;
  DailyRewardData copyWith({
    int? day,
    int? reward,
    bool? isCheckIn,
    dynamic checkInDate,
  }) =>
      DailyRewardData(
        day: day ?? _day,
        reward: reward ?? _reward,
        isCheckIn: isCheckIn ?? _isCheckIn,
        checkInDate: checkInDate ?? _checkInDate,
      );
  int? get day => _day;
  int? get reward => _reward;
  bool? get isCheckIn => _isCheckIn;
  dynamic get checkInDate => _checkInDate;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['day'] = _day;
    map['reward'] = _reward;
    map['isCheckIn'] = _isCheckIn;
    map['checkInDate'] = _checkInDate;
    return map;
  }
}
