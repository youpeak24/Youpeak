import 'dart:convert';

EarnCoinFromCheckInModel earnCoinFromCheckInModelFromJson(String str) => EarnCoinFromCheckInModel.fromJson(json.decode(str));
String earnCoinFromCheckInModelToJson(EarnCoinFromCheckInModel data) => json.encode(data.toJson());

class EarnCoinFromCheckInModel {
  EarnCoinFromCheckInModel({
    bool? status,
    String? message,
    bool? isCheckIn,
    String? code,
    int? coinsEarned,
    int? totalCoins,
  }) {
    _status = status;
    _message = message;
    _isCheckIn = isCheckIn;
    _code = code;
    _coinsEarned = coinsEarned;
    _totalCoins = totalCoins;
  }

  EarnCoinFromCheckInModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _isCheckIn = json['isCheckIn'];
    _code = json['code'];
    _coinsEarned = (json['coinsEarned'] as num?)?.toInt();
    _totalCoins = (json['totalCoins'] as num?)?.toInt();
  }
  bool? _status;
  String? _message;
  bool? _isCheckIn;
  String? _code;
  int? _coinsEarned;
  int? _totalCoins;
  EarnCoinFromCheckInModel copyWith({
    bool? status,
    String? message,
    bool? isCheckIn,
    String? code,
    int? coinsEarned,
    int? totalCoins,
  }) =>
      EarnCoinFromCheckInModel(
        status: status ?? _status,
        message: message ?? _message,
        isCheckIn: isCheckIn ?? _isCheckIn,
        code: code ?? _code,
        coinsEarned: coinsEarned ?? _coinsEarned,
        totalCoins: totalCoins ?? _totalCoins,
      );
  bool? get status => _status;
  String? get message => _message;
  bool? get isCheckIn => _isCheckIn;

  /// Refusal reason from the server (e.g. a task-security lock), if any.
  String? get code => _code;

  /// Coins the server actually credited (0 when today's cap was reached).
  int? get coinsEarned => _coinsEarned;
  int? get totalCoins => _totalCoins;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    map['isCheckIn'] = _isCheckIn;
    map['code'] = _code;
    map['coinsEarned'] = _coinsEarned;
    map['totalCoins'] = _totalCoins;
    return map;
  }
}
