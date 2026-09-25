import 'dart:convert';

WithdrawSettingModel withdrawSettingModelFromJson(String str) => WithdrawSettingModel.fromJson(json.decode(str));
String withdrawSettingModelToJson(WithdrawSettingModel data) => json.encode(data.toJson());

class WithdrawSettingModel {
  WithdrawSettingModel({
    bool? status,
    String? message,
    Data? data,
  }) {
    _status = status;
    _message = message;
    _data = data;
  }

  WithdrawSettingModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _data = json['data'] != null ? Data.fromJson(json['data']) : null;
  }
  bool? _status;
  String? _message;
  Data? _data;
  WithdrawSettingModel copyWith({
    bool? status,
    String? message,
    Data? data,
  }) =>
      WithdrawSettingModel(
        status: status ?? _status,
        message: message ?? _message,
        data: data ?? _data,
      );
  bool? get status => _status;
  String? get message => _message;
  Data? get data => _data;

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

Data dataFromJson(String str) => Data.fromJson(json.decode(str));
String dataToJson(Data data) => json.encode(data.toJson());

class Data {
  Data({
    int? coin,
    int? minCoinForCashOut,
    int? minConvertCoin,
    int? minWithdrawalRequestedAmount,
    int? referralRewardCoins,
    int? watchingVideoRewardCoins,
    int? commentingRewardCoins,
    int? likeVideoRewardCoins,
    Currency? currency,
  }) {
    _coin = coin;
    _minCoinForCashOut = minCoinForCashOut;
    _minConvertCoin = minConvertCoin;
    _minWithdrawalRequestedAmount = minWithdrawalRequestedAmount;
    _referralRewardCoins = referralRewardCoins;
    _watchingVideoRewardCoins = watchingVideoRewardCoins;
    _commentingRewardCoins = commentingRewardCoins;
    _likeVideoRewardCoins = likeVideoRewardCoins;
    _currency = currency;
  }

  Data.fromJson(dynamic json) {
    _coin = json['coin'];
    _minCoinForCashOut = json['minCoinForCashOut'];
    _minConvertCoin = json['minConvertCoin'];
    _minWithdrawalRequestedAmount = json['minWithdrawalRequestedAmount'];
    _referralRewardCoins = json['referralRewardCoins'];
    _watchingVideoRewardCoins = json['watchingVideoRewardCoins'];
    _commentingRewardCoins = json['commentingRewardCoins'];
    _likeVideoRewardCoins = json['likeVideoRewardCoins'];
    _currency = json['currency'] != null ? Currency.fromJson(json['currency']) : null;
  }
  int? _coin;
  int? _minCoinForCashOut;
  int? _minConvertCoin;
  int? _minWithdrawalRequestedAmount;
  int? _referralRewardCoins;
  int? _watchingVideoRewardCoins;
  int? _commentingRewardCoins;
  int? _likeVideoRewardCoins;
  Currency? _currency;
  Data copyWith({
    int? coin,
    int? minCoinForCashOut,
    int? minConvertCoin,
    int? minWithdrawalRequestedAmount,
    int? referralRewardCoins,
    int? watchingVideoRewardCoins,
    int? commentingRewardCoins,
    int? likeVideoRewardCoins,
    Currency? currency,
  }) =>
      Data(
        coin: coin ?? _coin,
        minCoinForCashOut: minCoinForCashOut ?? _minCoinForCashOut,
        minConvertCoin: minConvertCoin ?? _minConvertCoin,
        minWithdrawalRequestedAmount: minWithdrawalRequestedAmount ?? _minWithdrawalRequestedAmount,
        referralRewardCoins: referralRewardCoins ?? _referralRewardCoins,
        watchingVideoRewardCoins: watchingVideoRewardCoins ?? _watchingVideoRewardCoins,
        commentingRewardCoins: commentingRewardCoins ?? _commentingRewardCoins,
        likeVideoRewardCoins: likeVideoRewardCoins ?? _likeVideoRewardCoins,
        currency: currency ?? _currency,
      );
  int? get coin => _coin;
  int? get minCoinForCashOut => _minCoinForCashOut;
  int? get minConvertCoin => _minConvertCoin;
  int? get minWithdrawalRequestedAmount => _minWithdrawalRequestedAmount;
  int? get referralRewardCoins => _referralRewardCoins;
  int? get watchingVideoRewardCoins => _watchingVideoRewardCoins;
  int? get commentingRewardCoins => _commentingRewardCoins;
  int? get likeVideoRewardCoins => _likeVideoRewardCoins;
  Currency? get currency => _currency;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['coin'] = _coin;
    map['minCoinForCashOut'] = _minCoinForCashOut;
    map['minConvertCoin'] = _minConvertCoin;
    map['minWithdrawalRequestedAmount'] = _minWithdrawalRequestedAmount;
    map['referralRewardCoins'] = _referralRewardCoins;
    map['watchingVideoRewardCoins'] = _watchingVideoRewardCoins;
    map['commentingRewardCoins'] = _commentingRewardCoins;
    map['likeVideoRewardCoins'] = _likeVideoRewardCoins;
    if (_currency != null) {
      map['currency'] = _currency?.toJson();
    }
    return map;
  }
}

Currency currencyFromJson(String str) => Currency.fromJson(json.decode(str));
String currencyToJson(Currency data) => json.encode(data.toJson());

class Currency {
  Currency({
    String? name,
    String? symbol,
    String? countryCode,
    String? currencyCode,
    bool? isDefault,
  }) {
    _name = name;
    _symbol = symbol;
    _countryCode = countryCode;
    _currencyCode = currencyCode;
    _isDefault = isDefault;
  }

  Currency.fromJson(dynamic json) {
    _name = json['name'];
    _symbol = json['symbol'];
    _countryCode = json['countryCode'];
    _currencyCode = json['currencyCode'];
    _isDefault = json['isDefault'];
  }
  String? _name;
  String? _symbol;
  String? _countryCode;
  String? _currencyCode;
  bool? _isDefault;
  Currency copyWith({
    String? name,
    String? symbol,
    String? countryCode,
    String? currencyCode,
    bool? isDefault,
  }) =>
      Currency(
        name: name ?? _name,
        symbol: symbol ?? _symbol,
        countryCode: countryCode ?? _countryCode,
        currencyCode: currencyCode ?? _currencyCode,
        isDefault: isDefault ?? _isDefault,
      );
  String? get name => _name;
  String? get symbol => _symbol;
  String? get countryCode => _countryCode;
  String? get currencyCode => _currencyCode;
  bool? get isDefault => _isDefault;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['name'] = _name;
    map['symbol'] = _symbol;
    map['countryCode'] = _countryCode;
    map['currencyCode'] = _currencyCode;
    map['isDefault'] = _isDefault;
    return map;
  }
}
