import 'dart:convert';

GetWalletHistoryModel getWalletHistoryModelFromJson(String str) => GetWalletHistoryModel.fromJson(json.decode(str));
String getWalletHistoryModelToJson(GetWalletHistoryModel data) => json.encode(data.toJson());

class GetWalletHistoryModel {
  GetWalletHistoryModel({
    bool? status,
    String? message,
    num? total,
    List<Data>? data,
  }) {
    _status = status;
    _message = message;
    _total = total;
    _data = data;
  }

  GetWalletHistoryModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _total = json['total'];
    if (json['data'] != null) {
      _data = [];
      json['data'].forEach((v) {
        _data?.add(Data.fromJson(v));
      });
    }
  }
  bool? _status;
  String? _message;
  num? _total;
  List<Data>? _data;
  GetWalletHistoryModel copyWith({
    bool? status,
    String? message,
    num? total,
    List<Data>? data,
  }) =>
      GetWalletHistoryModel(
        status: status ?? _status,
        message: message ?? _message,
        total: total ?? _total,
        data: data ?? _data,
      );
  bool? get status => _status;
  String? get message => _message;
  num? get total => _total;
  List<Data>? get data => _data;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    map['total'] = _total;
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
    String? userId,
    num? type,
    num? coin,
    num? amount,
    String? uniqueId,
    String? date,
    String? createdAt,
    String? updatedAt,
  }) {
    _id = id;
    _userId = userId;
    _type = type;
    _coin = coin;
    _amount = amount;
    _uniqueId = uniqueId;
    _date = date;
    _createdAt = createdAt;
    _updatedAt = updatedAt;
  }

  Data.fromJson(dynamic json) {
    _id = json['_id'];
    _userId = json['userId'];
    _type = json['type'];
    _coin = json['coin'];
    _amount = json['amount'];
    _uniqueId = json['uniqueId'];
    _date = json['date'];
    _createdAt = json['createdAt'];
    _updatedAt = json['updatedAt'];
  }
  String? _id;
  String? _userId;
  num? _type;
  num? _coin;
  num? _amount;
  String? _uniqueId;
  String? _date;
  String? _createdAt;
  String? _updatedAt;
  Data copyWith({
    String? id,
    String? userId,
    num? type,
    num? coin,
    num? amount,
    String? uniqueId,
    String? date,
    String? createdAt,
    String? updatedAt,
  }) =>
      Data(
        id: id ?? _id,
        userId: userId ?? _userId,
        type: type ?? _type,
        coin: coin ?? _coin,
        amount: amount ?? _amount,
        uniqueId: uniqueId ?? _uniqueId,
        date: date ?? _date,
        createdAt: createdAt ?? _createdAt,
        updatedAt: updatedAt ?? _updatedAt,
      );
  String? get id => _id;
  String? get userId => _userId;
  num? get type => _type;
  num? get coin => _coin;
  num? get amount => _amount;
  String? get uniqueId => _uniqueId;
  String? get date => _date;
  String? get createdAt => _createdAt;
  String? get updatedAt => _updatedAt;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['userId'] = _userId;
    map['type'] = _type;
    map['coin'] = _coin;
    map['amount'] = _amount;
    map['uniqueId'] = _uniqueId;
    map['date'] = _date;
    map['createdAt'] = _createdAt;
    map['updatedAt'] = _updatedAt;
    return map;
  }
}
