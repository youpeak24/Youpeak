import 'dart:convert';

EarnCoinFromCheckInModel earnCoinFromCheckInModelFromJson(String str) => EarnCoinFromCheckInModel.fromJson(json.decode(str));
String earnCoinFromCheckInModelToJson(EarnCoinFromCheckInModel data) => json.encode(data.toJson());

class EarnCoinFromCheckInModel {
  EarnCoinFromCheckInModel({
    bool? status,
    String? message,
    bool? isCheckIn,
  }) {
    _status = status;
    _message = message;
    _isCheckIn = isCheckIn;
  }

  EarnCoinFromCheckInModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _isCheckIn = json['isCheckIn'];
  }
  bool? _status;
  String? _message;
  bool? _isCheckIn;
  EarnCoinFromCheckInModel copyWith({
    bool? status,
    String? message,
    bool? isCheckIn,
  }) =>
      EarnCoinFromCheckInModel(
        status: status ?? _status,
        message: message ?? _message,
        isCheckIn: isCheckIn ?? _isCheckIn,
      );
  bool? get status => _status;
  String? get message => _message;
  bool? get isCheckIn => _isCheckIn;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    map['isCheckIn'] = _isCheckIn;
    return map;
  }
}
