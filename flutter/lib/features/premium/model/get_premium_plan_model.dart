import 'dart:convert';

GetPremiumPlanModel getPremiumPlanModelFromJson(String str) => GetPremiumPlanModel.fromJson(json.decode(str));
String getPremiumPlanModelToJson(GetPremiumPlanModel data) => json.encode(data.toJson());

class GetPremiumPlanModel {
  GetPremiumPlanModel({
    bool? status,
    String? message,
    List<PremiumPlan>? premiumPlan,
  }) {
    _status = status;
    _message = message;
    _premiumPlan = premiumPlan;
  }

  GetPremiumPlanModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    if (json['premiumPlan'] != null) {
      _premiumPlan = [];
      json['premiumPlan'].forEach((v) {
        _premiumPlan?.add(PremiumPlan.fromJson(v));
      });
    }
  }
  bool? _status;
  String? _message;
  List<PremiumPlan>? _premiumPlan;
  GetPremiumPlanModel copyWith({
    bool? status,
    String? message,
    List<PremiumPlan>? premiumPlan,
  }) =>
      GetPremiumPlanModel(
        status: status ?? _status,
        message: message ?? _message,
        premiumPlan: premiumPlan ?? _premiumPlan,
      );
  bool? get status => _status;
  String? get message => _message;
  List<PremiumPlan>? get premiumPlan => _premiumPlan;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_premiumPlan != null) {
      map['premiumPlan'] = _premiumPlan?.map((v) => v.toJson()).toList();
    }
    return map;
  }
}

PremiumPlan premiumPlanFromJson(String str) => PremiumPlan.fromJson(json.decode(str));
String premiumPlanToJson(PremiumPlan data) => json.encode(data.toJson());

class PremiumPlan {
  PremiumPlan({
    String? id,
    List<String>? planBenefit,
    bool? isActive,
    int? validity,
    String? validityType,
    String? createdAt,
    String? updatedAt,
    String? productKey,
    int? amount,
  }) {
    _id = id;
    _planBenefit = planBenefit;
    _isActive = isActive;
    _validity = validity;
    _validityType = validityType;
    _createdAt = createdAt;
    _updatedAt = updatedAt;
    _productKey = productKey;
    _amount = amount;
  }

  PremiumPlan.fromJson(dynamic json) {
    _id = json['_id'];
    _planBenefit = json['planBenefit'] != null ? json['planBenefit'].cast<String>() : [];
    _isActive = json['isActive'];
    _validity = json['validity'];
    _validityType = json['validityType'];
    _createdAt = json['createdAt'];
    _updatedAt = json['updatedAt'];
    _productKey = json['productKey'];
    _amount = json['amount'];
  }
  String? _id;
  List<String>? _planBenefit;
  bool? _isActive;
  int? _validity;
  String? _validityType;
  String? _createdAt;
  String? _updatedAt;
  String? _productKey;
  int? _amount;
  PremiumPlan copyWith({
    String? id,
    List<String>? planBenefit,
    bool? isActive,
    int? validity,
    String? validityType,
    String? createdAt,
    String? updatedAt,
    String? productKey,
    int? amount,
  }) =>
      PremiumPlan(
        id: id ?? _id,
        planBenefit: planBenefit ?? _planBenefit,
        isActive: isActive ?? _isActive,
        validity: validity ?? _validity,
        validityType: validityType ?? _validityType,
        createdAt: createdAt ?? _createdAt,
        updatedAt: updatedAt ?? _updatedAt,
        productKey: productKey ?? _productKey,
        amount: amount ?? _amount,
      );
  String? get id => _id;
  List<String>? get planBenefit => _planBenefit;
  bool? get isActive => _isActive;
  int? get validity => _validity;
  String? get validityType => _validityType;
  String? get createdAt => _createdAt;
  String? get updatedAt => _updatedAt;
  String? get productKey => _productKey;
  int? get amount => _amount;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['planBenefit'] = _planBenefit;
    map['isActive'] = _isActive;
    map['validity'] = _validity;
    map['validityType'] = _validityType;
    map['createdAt'] = _createdAt;
    map['updatedAt'] = _updatedAt;
    map['productKey'] = _productKey;
    map['amount'] = _amount;
    return map;
  }
}
