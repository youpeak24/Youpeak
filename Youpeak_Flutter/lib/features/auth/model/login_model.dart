import 'dart:convert';

LoginModel loginModelFromJson(String str) =>
    LoginModel.fromJson(json.decode(str));
String loginModelToJson(LoginModel data) => json.encode(data.toJson());

class LoginModel {
  LoginModel({
    bool? status,
    String? message,
    bool? isLogin,
  }) {
    _status = status;
    _message = message;
    _isLogin = isLogin;
  }

  LoginModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _isLogin = json['isLogin'];
  }
  bool? _status;
  String? _message;
  bool? _isLogin;
  LoginModel copyWith({
    bool? status,
    String? message,
    bool? isLogin,
  }) =>
      LoginModel(
        status: status ?? _status,
        message: message ?? _message,
        isLogin: isLogin ?? _isLogin,
      );
  bool? get status => _status;
  String? get message => _message;
  bool? get isLogin => _isLogin;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    map['isLogin'] = _isLogin;
    return map;
  }
}
