import 'dart:convert';

MonetizationModel monetizationModelFromJson(String str) => MonetizationModel.fromJson(json.decode(str));
String monetizationModelToJson(MonetizationModel data) => json.encode(data.toJson());

class MonetizationModel {
  MonetizationModel({
    bool? status,
    String? message,
    DataOfMonetization? dataOfMonetization,
  }) {
    _status = status;
    _message = message;
    _dataOfMonetization = dataOfMonetization;
  }

  MonetizationModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _dataOfMonetization = json['dataOfMonetization'] != null ? DataOfMonetization.fromJson(json['dataOfMonetization']) : null;
  }
  bool? _status;
  String? _message;
  DataOfMonetization? _dataOfMonetization;
  MonetizationModel copyWith({
    bool? status,
    String? message,
    DataOfMonetization? dataOfMonetization,
  }) =>
      MonetizationModel(
        status: status ?? _status,
        message: message ?? _message,
        dataOfMonetization: dataOfMonetization ?? _dataOfMonetization,
      );
  bool? get status => _status;
  String? get message => _message;
  DataOfMonetization? get dataOfMonetization => _dataOfMonetization;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_dataOfMonetization != null) {
      map['dataOfMonetization'] = _dataOfMonetization?.toJson();
    }
    return map;
  }
}

DataOfMonetization dataOfMonetizationFromJson(String str) => DataOfMonetization.fromJson(json.decode(str));
String dataOfMonetizationToJson(DataOfMonetization data) => json.encode(data.toJson());

class DataOfMonetization {
  DataOfMonetization({
    int? minWatchTime,
    int? minSubScriber,
    int? totalSubscribers,
    String? totalWatchTime,
    bool? isMonetization,
  }) {
    _minWatchTime = minWatchTime;
    _minSubScriber = minSubScriber;
    _totalSubscribers = totalSubscribers;
    _totalWatchTime = totalWatchTime;
    _isMonetization = isMonetization;
  }

  DataOfMonetization.fromJson(dynamic json) {
    _minWatchTime = json['minWatchTime'];
    _minSubScriber = json['minSubScriber'];
    _totalSubscribers = json['totalSubscribers'];
    _totalWatchTime = json['totalWatchTime'];
    _isMonetization = json['isMonetization'];
  }
  int? _minWatchTime;
  int? _minSubScriber;
  int? _totalSubscribers;
  String? _totalWatchTime;
  bool? _isMonetization;
  DataOfMonetization copyWith({
    int? minWatchTime,
    int? minSubScriber,
    int? totalSubscribers,
    String? totalWatchTime,
    bool? isMonetization,
  }) =>
      DataOfMonetization(
        minWatchTime: minWatchTime ?? _minWatchTime,
        minSubScriber: minSubScriber ?? _minSubScriber,
        totalSubscribers: totalSubscribers ?? _totalSubscribers,
        totalWatchTime: totalWatchTime ?? _totalWatchTime,
        isMonetization: isMonetization ?? _isMonetization,
      );
  int? get minWatchTime => _minWatchTime;
  int? get minSubScriber => _minSubScriber;
  int? get totalSubscribers => _totalSubscribers;
  String? get totalWatchTime => _totalWatchTime;
  bool? get isMonetization => _isMonetization;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['minWatchTime'] = _minWatchTime;
    map['minSubScriber'] = _minSubScriber;
    map['totalSubscribers'] = _totalSubscribers;
    map['totalWatchTime'] = _totalWatchTime;
    map['isMonetization'] = _isMonetization;
    return map;
  }
}
