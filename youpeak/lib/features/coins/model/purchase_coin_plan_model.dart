import 'dart:convert';

PurchaseCoinPlanModel purchaseCoinPlanModelFromJson(String str) => PurchaseCoinPlanModel.fromJson(json.decode(str));
String purchaseCoinPlanModelToJson(PurchaseCoinPlanModel data) => json.encode(data.toJson());

class PurchaseCoinPlanModel {
  PurchaseCoinPlanModel({
    bool? status,
    String? message,
  }) {
    _status = status;
    _message = message;
  }

  PurchaseCoinPlanModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
  }
  bool? _status;
  String? _message;
  PurchaseCoinPlanModel copyWith({
    bool? status,
    String? message,
  }) =>
      PurchaseCoinPlanModel(
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
