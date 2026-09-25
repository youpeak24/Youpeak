import 'dart:convert';

ReferralCodeApplyModel referralCodeApplyModelFromJson(String str) => ReferralCodeApplyModel.fromJson(json.decode(str));
String referralCodeApplyModelToJson(ReferralCodeApplyModel data) => json.encode(data.toJson());

class ReferralCodeApplyModel {
  ReferralCodeApplyModel({
    bool? status,
    String? message,
  }) {
    _status = status;
    _message = message;
  }

  ReferralCodeApplyModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
  }
  bool? _status;
  String? _message;
  ReferralCodeApplyModel copyWith({
    bool? status,
    String? message,
  }) =>
      ReferralCodeApplyModel(
        status: status ?? _status,
        message: message ?? _message,
      );
  bool? get status => _status;
  String? get message => _message;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    return map;
  }
}
