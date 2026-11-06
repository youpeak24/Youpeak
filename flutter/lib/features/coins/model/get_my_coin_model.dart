import 'dart:convert';

GetMyCoinModel getMyCoinModelFromJson(String str) => GetMyCoinModel.fromJson(json.decode(str));
String getMyCoinModelToJson(GetMyCoinModel data) => json.encode(data.toJson());

class GetMyCoinModel {
  GetMyCoinModel({
    bool? status,
    String? message,
    CoinData? data,
  }) {
    _status = status;
    _message = message;
    _data = data;
  }

  GetMyCoinModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _data = json['data'] != null ? CoinData.fromJson(json['data']) : null;
  }
  bool? _status;
  String? _message;
  CoinData? _data;
  GetMyCoinModel copyWith({
    bool? status,
    String? message,
    CoinData? data,
  }) =>
      GetMyCoinModel(
        status: status ?? _status,
        message: message ?? _message,
        data: data ?? _data,
      );
  bool? get status => _status;
  String? get message => _message;
  CoinData? get data => _data;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_data != null) {
      map['data'] = _data?.toJson();
    }
    return map;
  }
}

CoinData dataFromJson(String str) => CoinData.fromJson(json.decode(str));
String dataToJson(CoinData data) => json.encode(data.toJson());

class CoinData {
  CoinData({
    int? coin,
    int? minCoinForCashOut,
    int? minConvertCoin,
    int? minWithdrawalRequestedAmount,
    int? referralRewardCoins,
  }) {
    _coin = coin;
    _minCoinForCashOut = minCoinForCashOut;
    _minConvertCoin = minConvertCoin;
    _minWithdrawalRequestedAmount = minWithdrawalRequestedAmount;
    _referralRewardCoins = referralRewardCoins;
  }

  CoinData.fromJson(dynamic json) {
    _coin = json['coin'];
    _minCoinForCashOut = json['minCoinForCashOut'];
    _minConvertCoin = json['minConvertCoin'];
    _minWithdrawalRequestedAmount = json['minWithdrawalRequestedAmount'];
    _referralRewardCoins = json['referralRewardCoins'];
  }
  int? _coin;
  int? _minCoinForCashOut;
  int? _minConvertCoin;
  int? _minWithdrawalRequestedAmount;
  int? _referralRewardCoins;
  CoinData copyWith({
    int? coin,
    int? minCoinForCashOut,
    int? minConvertCoin,
    int? minWithdrawalRequestedAmount,
    int? referralRewardCoins,
  }) =>
      CoinData(
        coin: coin ?? _coin,
        minCoinForCashOut: minCoinForCashOut ?? _minCoinForCashOut,
        minConvertCoin: minConvertCoin ?? _minConvertCoin,
        minWithdrawalRequestedAmount: minWithdrawalRequestedAmount ?? _minWithdrawalRequestedAmount,
        referralRewardCoins: referralRewardCoins ?? _referralRewardCoins,
      );
  int? get coin => _coin;
  int? get minCoinForCashOut => _minCoinForCashOut;
  int? get minConvertCoin => _minConvertCoin;
  int? get minWithdrawalRequestedAmount => _minWithdrawalRequestedAmount;
  int? get referralRewardCoins => _referralRewardCoins;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['coin'] = _coin;
    map['minCoinForCashOut'] = _minCoinForCashOut;
    map['minConvertCoin'] = _minConvertCoin;
    map['minWithdrawalRequestedAmount'] = _minWithdrawalRequestedAmount;
    map['referralRewardCoins'] = _referralRewardCoins;
    return map;
  }
}
