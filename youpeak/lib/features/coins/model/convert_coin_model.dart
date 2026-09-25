import 'dart:convert';

ConvertCoinModel convertCoinModelFromJson(String str) => ConvertCoinModel.fromJson(json.decode(str));
String convertCoinModelToJson(ConvertCoinModel data) => json.encode(data.toJson());

class ConvertCoinModel {
  ConvertCoinModel({
    bool? status,
    String? message,
    num? data,
  }) {
    _status = status;
    _message = message;
    _data = data;
  }

  ConvertCoinModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _data = json['data'];
  }
  bool? _status;
  String? _message;
  num? _data;
  ConvertCoinModel copyWith({
    bool? status,
    String? message,
    num? data,
  }) =>
      ConvertCoinModel(
        status: status ?? _status,
        message: message ?? _message,
        data: data ?? _data,
      );
  bool? get status => _status;
  String? get message => _message;
  num? get data => _data;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    map['data'] = _data;
    return map;
  }
}
