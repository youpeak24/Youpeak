import 'dart:convert';
GetPremiumPlanPurchaseHistoryModel getPremiumPlanPurchaseHistoryModelFromJson(String str) => GetPremiumPlanPurchaseHistoryModel.fromJson(json.decode(str));
String getPremiumPlanPurchaseHistoryModelToJson(GetPremiumPlanPurchaseHistoryModel data) => json.encode(data.toJson());
class GetPremiumPlanPurchaseHistoryModel {
  GetPremiumPlanPurchaseHistoryModel({
      bool? status, 
      String? message, 
      List<PlanHistory>? planHistory, 
      List<CoinplanHistory>? coinplanHistory,}){
    _status = status;
    _message = message;
    _planHistory = planHistory;
    _coinplanHistory = coinplanHistory;
}

  GetPremiumPlanPurchaseHistoryModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    if (json['planHistory'] != null) {
      _planHistory = [];
      json['planHistory'].forEach((v) {
        _planHistory?.add(PlanHistory.fromJson(v));
      });
    }
    if (json['coinplanHistory'] != null) {
      _coinplanHistory = [];
      json['coinplanHistory'].forEach((v) {
        _coinplanHistory?.add(CoinplanHistory.fromJson(v));
      });
    }
  }
  bool? _status;
  String? _message;
  List<PlanHistory>? _planHistory;
  List<CoinplanHistory>? _coinplanHistory;
GetPremiumPlanPurchaseHistoryModel copyWith({  bool? status,
  String? message,
  List<PlanHistory>? planHistory,
  List<CoinplanHistory>? coinplanHistory,
}) => GetPremiumPlanPurchaseHistoryModel(  status: status ?? _status,
  message: message ?? _message,
  planHistory: planHistory ?? _planHistory,
  coinplanHistory: coinplanHistory ?? _coinplanHistory,
);
  bool? get status => _status;
  String? get message => _message;
  List<PlanHistory>? get planHistory => _planHistory;
  List<CoinplanHistory>? get coinplanHistory => _coinplanHistory;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_planHistory != null) {
      map['planHistory'] = _planHistory?.map((v) => v.toJson()).toList();
    }
    if (_coinplanHistory != null) {
      map['coinplanHistory'] = _coinplanHistory?.map((v) => v.toJson()).toList();
    }
    return map;
  }

}

CoinplanHistory coinplanHistoryFromJson(String str) => CoinplanHistory.fromJson(json.decode(str));
String coinplanHistoryToJson(CoinplanHistory data) => json.encode(data.toJson());
class CoinplanHistory {
  CoinplanHistory({
      String? id, 
      String? userId, 
      String? paymentGateway, 
      String? fullName, 
      String? nickName, 
      String? image, 
      List<Coinplan>? coinplan,}){
    _id = id;
    _userId = userId;
    _paymentGateway = paymentGateway;
    _fullName = fullName;
    _nickName = nickName;
    _image = image;
    _coinplan = coinplan;
}

  CoinplanHistory.fromJson(dynamic json) {
    _id = json['_id'];
    _userId = json['userId'];
    _paymentGateway = json['paymentGateway'];
    _fullName = json['fullName'];
    _nickName = json['nickName'];
    _image = json['image'];
    if (json['coinplan'] != null) {
      _coinplan = [];
      json['coinplan'].forEach((v) {
        _coinplan?.add(Coinplan.fromJson(v));
      });
    }
  }
  String? _id;
  String? _userId;
  String? _paymentGateway;
  String? _fullName;
  String? _nickName;
  String? _image;
  List<Coinplan>? _coinplan;
CoinplanHistory copyWith({  String? id,
  String? userId,
  String? paymentGateway,
  String? fullName,
  String? nickName,
  String? image,
  List<Coinplan>? coinplan,
}) => CoinplanHistory(  id: id ?? _id,
  userId: userId ?? _userId,
  paymentGateway: paymentGateway ?? _paymentGateway,
  fullName: fullName ?? _fullName,
  nickName: nickName ?? _nickName,
  image: image ?? _image,
  coinplan: coinplan ?? _coinplan,
);
  String? get id => _id;
  String? get userId => _userId;
  String? get paymentGateway => _paymentGateway;
  String? get fullName => _fullName;
  String? get nickName => _nickName;
  String? get image => _image;
  List<Coinplan>? get coinplan => _coinplan;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['userId'] = _userId;
    map['paymentGateway'] = _paymentGateway;
    map['fullName'] = _fullName;
    map['nickName'] = _nickName;
    map['image'] = _image;
    if (_coinplan != null) {
      map['coinplan'] = _coinplan?.map((v) => v.toJson()).toList();
    }
    return map;
  }

}

Coinplan coinplanFromJson(String str) => Coinplan.fromJson(json.decode(str));
String coinplanToJson(Coinplan data) => json.encode(data.toJson());
class Coinplan {
  Coinplan({
      int? amount, 
      int? coin, 
      int? extraCoin, 
      String? purchasedAt, 
      String? id,}){
    _amount = amount;
    _coin = coin;
    _extraCoin = extraCoin;
    _purchasedAt = purchasedAt;
    _id = id;
}

  Coinplan.fromJson(dynamic json) {
    _amount = json['amount'];
    _coin = json['coin'];
    _extraCoin = json['extraCoin'];
    _purchasedAt = json['purchasedAt'];
    _id = json['_id'];
  }
  int? _amount;
  int? _coin;
  int? _extraCoin;
  String? _purchasedAt;
  String? _id;
Coinplan copyWith({  int? amount,
  int? coin,
  int? extraCoin,
  String? purchasedAt,
  String? id,
}) => Coinplan(  amount: amount ?? _amount,
  coin: coin ?? _coin,
  extraCoin: extraCoin ?? _extraCoin,
  purchasedAt: purchasedAt ?? _purchasedAt,
  id: id ?? _id,
);
  int? get amount => _amount;
  int? get coin => _coin;
  int? get extraCoin => _extraCoin;
  String? get purchasedAt => _purchasedAt;
  String? get id => _id;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['amount'] = _amount;
    map['coin'] = _coin;
    map['extraCoin'] = _extraCoin;
    map['purchasedAt'] = _purchasedAt;
    map['_id'] = _id;
    return map;
  }

}

PlanHistory planHistoryFromJson(String str) => PlanHistory.fromJson(json.decode(str));
String planHistoryToJson(PlanHistory data) => json.encode(data.toJson());
class PlanHistory {
  PlanHistory({
      String? id, 
      String? userId, 
      String? premiumPlanId, 
      String? paymentGateway, 
      String? fullName, 
      String? nickName, 
      String? image, 
      String? planStartDate, 
      String? planEndDate, 
      int? amount, 
      int? validity, 
      String? validityType, 
      List<String>? planBenefit,}){
    _id = id;
    _userId = userId;
    _premiumPlanId = premiumPlanId;
    _paymentGateway = paymentGateway;
    _fullName = fullName;
    _nickName = nickName;
    _image = image;
    _planStartDate = planStartDate;
    _planEndDate = planEndDate;
    _amount = amount;
    _validity = validity;
    _validityType = validityType;
    _planBenefit = planBenefit;
}

  PlanHistory.fromJson(dynamic json) {
    _id = json['_id'];
    _userId = json['userId'];
    _premiumPlanId = json['premiumPlanId'];
    _paymentGateway = json['paymentGateway'];
    _fullName = json['fullName'];
    _nickName = json['nickName'];
    _image = json['image'];
    _planStartDate = json['planStartDate'];
    _planEndDate = json['planEndDate'];
    _amount = json['amount'];
    _validity = json['validity'];
    _validityType = json['validityType'];
    _planBenefit = json['planBenefit'] != null ? json['planBenefit'].cast<String>() : [];
  }
  String? _id;
  String? _userId;
  String? _premiumPlanId;
  String? _paymentGateway;
  String? _fullName;
  String? _nickName;
  String? _image;
  String? _planStartDate;
  String? _planEndDate;
  int? _amount;
  int? _validity;
  String? _validityType;
  List<String>? _planBenefit;
PlanHistory copyWith({  String? id,
  String? userId,
  String? premiumPlanId,
  String? paymentGateway,
  String? fullName,
  String? nickName,
  String? image,
  String? planStartDate,
  String? planEndDate,
  int? amount,
  int? validity,
  String? validityType,
  List<String>? planBenefit,
}) => PlanHistory(  id: id ?? _id,
  userId: userId ?? _userId,
  premiumPlanId: premiumPlanId ?? _premiumPlanId,
  paymentGateway: paymentGateway ?? _paymentGateway,
  fullName: fullName ?? _fullName,
  nickName: nickName ?? _nickName,
  image: image ?? _image,
  planStartDate: planStartDate ?? _planStartDate,
  planEndDate: planEndDate ?? _planEndDate,
  amount: amount ?? _amount,
  validity: validity ?? _validity,
  validityType: validityType ?? _validityType,
  planBenefit: planBenefit ?? _planBenefit,
);
  String? get id => _id;
  String? get userId => _userId;
  String? get premiumPlanId => _premiumPlanId;
  String? get paymentGateway => _paymentGateway;
  String? get fullName => _fullName;
  String? get nickName => _nickName;
  String? get image => _image;
  String? get planStartDate => _planStartDate;
  String? get planEndDate => _planEndDate;
  int? get amount => _amount;
  int? get validity => _validity;
  String? get validityType => _validityType;
  List<String>? get planBenefit => _planBenefit;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['userId'] = _userId;
    map['premiumPlanId'] = _premiumPlanId;
    map['paymentGateway'] = _paymentGateway;
    map['fullName'] = _fullName;
    map['nickName'] = _nickName;
    map['image'] = _image;
    map['planStartDate'] = _planStartDate;
    map['planEndDate'] = _planEndDate;
    map['amount'] = _amount;
    map['validity'] = _validity;
    map['validityType'] = _validityType;
    map['planBenefit'] = _planBenefit;
    return map;
  }

}