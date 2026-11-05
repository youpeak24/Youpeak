import 'dart:convert';

GetFaqModel getFaqModelFromJson(String str) => GetFaqModel.fromJson(json.decode(str));
String getFaqModelToJson(GetFaqModel data) => json.encode(data.toJson());

class GetFaqModel {
  GetFaqModel({
    bool? status,
    String? message,
    List<FaQ>? faQ,
  }) {
    _status = status;
    _message = message;
    _faQ = faQ;
  }

  GetFaqModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    if (json['FaQ'] != null) {
      _faQ = [];
      json['FaQ'].forEach((v) {
        _faQ?.add(FaQ.fromJson(v));
      });
    }
  }
  bool? _status;
  String? _message;
  List<FaQ>? _faQ;
  GetFaqModel copyWith({
    bool? status,
    String? message,
    List<FaQ>? faQ,
  }) =>
      GetFaqModel(
        status: status ?? _status,
        message: message ?? _message,
        faQ: faQ ?? _faQ,
      );
  bool? get status => _status;
  String? get message => _message;
  List<FaQ>? get faQ => _faQ;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_faQ != null) {
      map['FaQ'] = _faQ?.map((v) => v.toJson()).toList();
    }
    return map;
  }
}

FaQ faQFromJson(String str) => FaQ.fromJson(json.decode(str));
String faQToJson(FaQ data) => json.encode(data.toJson());

class FaQ {
  FaQ({
    String? id,
    bool? isView,
    String? question,
    String? answer,
    String? createdAt,
    String? updatedAt,
  }) {
    _id = id;
    _isView = isView;
    _question = question;
    _answer = answer;
    _createdAt = createdAt;
    _updatedAt = updatedAt;
  }

  FaQ.fromJson(dynamic json) {
    _id = json['_id'];
    _isView = json['isView'];
    _question = json['question'];
    _answer = json['answer'];
    _createdAt = json['createdAt'];
    _updatedAt = json['updatedAt'];
  }
  String? _id;
  bool? _isView;
  String? _question;
  String? _answer;
  String? _createdAt;
  String? _updatedAt;
  FaQ copyWith({
    String? id,
    bool? isView,
    String? question,
    String? answer,
    String? createdAt,
    String? updatedAt,
  }) =>
      FaQ(
        id: id ?? _id,
        isView: isView ?? _isView,
        question: question ?? _question,
        answer: answer ?? _answer,
        createdAt: createdAt ?? _createdAt,
        updatedAt: updatedAt ?? _updatedAt,
      );
  String? get id => _id;
  bool? get isView => _isView;
  String? get question => _question;
  String? get answer => _answer;
  String? get createdAt => _createdAt;
  String? get updatedAt => _updatedAt;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['isView'] = _isView;
    map['question'] = _question;
    map['answer'] = _answer;
    map['createdAt'] = _createdAt;
    map['updatedAt'] = _updatedAt;
    return map;
  }
}
