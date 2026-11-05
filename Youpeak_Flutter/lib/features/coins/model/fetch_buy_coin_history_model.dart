import 'dart:convert';
FetchBuyCoinHistoryModel fetchBuyCoinHistoryModelFromJson(String str) => FetchBuyCoinHistoryModel.fromJson(json.decode(str));
String fetchBuyCoinHistoryModelToJson(FetchBuyCoinHistoryModel data) => json.encode(data.toJson());
class FetchBuyCoinHistoryModel {
  FetchBuyCoinHistoryModel({
      bool? status, 
      String? message, 
      List<Data>? data,}){
    _status = status;
    _message = message;
    _data = data;
}

  FetchBuyCoinHistoryModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    if (json['data'] != null) {
      _data = [];
      json['data'].forEach((v) {
        _data?.add(Data.fromJson(v));
      });
    }
  }
  bool? _status;
  String? _message;
  List<Data>? _data;
FetchBuyCoinHistoryModel copyWith({  bool? status,
  String? message,
  List<Data>? data,
}) => FetchBuyCoinHistoryModel(  status: status ?? _status,
  message: message ?? _message,
  data: data ?? _data,
);
  bool? get status => _status;
  String? get message => _message;
  List<Data>? get data => _data;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
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
      String? paymentGateway, 
      int? type, 
      int? coin, 
      int? amount, 
      String? uniqueId, 
      String? date, 
      String? createdAt,}){
    _id = id;
    _paymentGateway = paymentGateway;
    _type = type;
    _coin = coin;
    _amount = amount;
    _uniqueId = uniqueId;
    _date = date;
    _createdAt = createdAt;
}

  Data.fromJson(dynamic json) {
    _id = json['_id'];
    _paymentGateway = json['paymentGateway'];
    _type = json['type'];
    _coin = json['coin'];
    _amount = json['amount'];
    _uniqueId = json['uniqueId'];
    _date = json['date'];
    _createdAt = json['createdAt'];
  }
  String? _id;
  String? _paymentGateway;
  int? _type;
  int? _coin;
  int? _amount;
  String? _uniqueId;
  String? _date;
  String? _createdAt;
Data copyWith({  String? id,
  String? paymentGateway,
  int? type,
  int? coin,
  int? amount,
  String? uniqueId,
  String? date,
  String? createdAt,
}) => Data(  id: id ?? _id,
  paymentGateway: paymentGateway ?? _paymentGateway,
  type: type ?? _type,
  coin: coin ?? _coin,
  amount: amount ?? _amount,
  uniqueId: uniqueId ?? _uniqueId,
  date: date ?? _date,
  createdAt: createdAt ?? _createdAt,
);
  String? get id => _id;
  String? get paymentGateway => _paymentGateway;
  int? get type => _type;
  int? get coin => _coin;
  int? get amount => _amount;
  String? get uniqueId => _uniqueId;
  String? get date => _date;
  String? get createdAt => _createdAt;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['paymentGateway'] = _paymentGateway;
    map['type'] = _type;
    map['coin'] = _coin;
    map['amount'] = _amount;
    map['uniqueId'] = _uniqueId;
    map['date'] = _date;
    map['createdAt'] = _createdAt;
    return map;
  }

}