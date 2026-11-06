import 'dart:convert';
WithDrawListModel withDrawListModelFromJson(String str) => WithDrawListModel.fromJson(json.decode(str));
String withDrawListModelToJson(WithDrawListModel data) => json.encode(data.toJson());
class WithDrawListModel {
  WithDrawListModel({
      bool? status, 
      String? message, 
      List<WithdrawMethod>? withdrawMethod,}){
    _status = status;
    _message = message;
    _withdrawMethod = withdrawMethod;
}

  WithDrawListModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    if (json['withdrawMethod'] != null) {
      _withdrawMethod = [];
      json['withdrawMethod'].forEach((v) {
        _withdrawMethod?.add(WithdrawMethod.fromJson(v));
      });
    }
  }
  bool? _status;
  String? _message;
  List<WithdrawMethod>? _withdrawMethod;
WithDrawListModel copyWith({  bool? status,
  String? message,
  List<WithdrawMethod>? withdrawMethod,
}) => WithDrawListModel(  status: status ?? _status,
  message: message ?? _message,
  withdrawMethod: withdrawMethod ?? _withdrawMethod,
);
  bool? get status => _status;
  String? get message => _message;
  List<WithdrawMethod>? get withdrawMethod => _withdrawMethod;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_withdrawMethod != null) {
      map['withdrawMethod'] = _withdrawMethod?.map((v) => v.toJson()).toList();
    }
    return map;
  }

}

WithdrawMethod withdrawMethodFromJson(String str) => WithdrawMethod.fromJson(json.decode(str));
String withdrawMethodToJson(WithdrawMethod data) => json.encode(data.toJson());
class WithdrawMethod {
  WithdrawMethod({
      String? id, 
      List<String>? details, 
      bool? isEnabled, 
      String? name, 
      String? image, 
      String? createdAt, 
      String? updatedAt,}){
    _id = id;
    _details = details;
    _isEnabled = isEnabled;
    _name = name;
    _image = image;
    _createdAt = createdAt;
    _updatedAt = updatedAt;
}

  WithdrawMethod.fromJson(dynamic json) {
    _id = json['_id'];
    _details = json['details'] != null ? json['details'].cast<String>() : [];
    _isEnabled = json['isEnabled'];
    _name = json['name'];
    _image = json['image'];
    _createdAt = json['createdAt'];
    _updatedAt = json['updatedAt'];
  }
  String? _id;
  List<String>? _details;
  bool? _isEnabled;
  String? _name;
  String? _image;
  String? _createdAt;
  String? _updatedAt;
WithdrawMethod copyWith({  String? id,
  List<String>? details,
  bool? isEnabled,
  String? name,
  String? image,
  String? createdAt,
  String? updatedAt,
}) => WithdrawMethod(  id: id ?? _id,
  details: details ?? _details,
  isEnabled: isEnabled ?? _isEnabled,
  name: name ?? _name,
  image: image ?? _image,
  createdAt: createdAt ?? _createdAt,
  updatedAt: updatedAt ?? _updatedAt,
);
  String? get id => _id;
  List<String>? get details => _details;
  bool? get isEnabled => _isEnabled;
  String? get name => _name;
  String? get image => _image;
  String? get createdAt => _createdAt;
  String? get updatedAt => _updatedAt;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['details'] = _details;
    map['isEnabled'] = _isEnabled;
    map['name'] = _name;
    map['image'] = _image;
    map['createdAt'] = _createdAt;
    map['updatedAt'] = _updatedAt;
    return map;
  }

}