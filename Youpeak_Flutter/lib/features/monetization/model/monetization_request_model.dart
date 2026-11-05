import 'dart:convert';

MonetizationRequestModel monetizationRequestModelFromJson(String str) => MonetizationRequestModel.fromJson(json.decode(str));
String monetizationRequestModelToJson(MonetizationRequestModel data) => json.encode(data.toJson());

class MonetizationRequestModel {
  MonetizationRequestModel({
    bool? status,
    String? message,
    MonetizationRequest? monetizationRequest,
  }) {
    _status = status;
    _message = message;
    _monetizationRequest = monetizationRequest;
  }

  MonetizationRequestModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _monetizationRequest = json['monetizationRequest'] != null ? MonetizationRequest.fromJson(json['monetizationRequest']) : null;
  }
  bool? _status;
  String? _message;
  MonetizationRequest? _monetizationRequest;
  MonetizationRequestModel copyWith({
    bool? status,
    String? message,
    MonetizationRequest? monetizationRequest,
  }) =>
      MonetizationRequestModel(
        status: status ?? _status,
        message: message ?? _message,
        monetizationRequest: monetizationRequest ?? _monetizationRequest,
      );
  bool? get status => _status;
  String? get message => _message;
  MonetizationRequest? get monetizationRequest => _monetizationRequest;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_monetizationRequest != null) {
      map['monetizationRequest'] = _monetizationRequest?.toJson();
    }
    return map;
  }
}

MonetizationRequest monetizationRequestFromJson(String str) => MonetizationRequest.fromJson(json.decode(str));
String monetizationRequestToJson(MonetizationRequest data) => json.encode(data.toJson());

class MonetizationRequest {
  MonetizationRequest({
    String? userId,
    String? channelId,
    String? channelName,
    int? totalWatchTime,
    int? status,
    String? requestDate,
    String? id,
    String? createdAt,
    String? updatedAt,
  }) {
    _userId = userId;
    _channelId = channelId;
    _channelName = channelName;
    _totalWatchTime = totalWatchTime;
    _status = status;
    _requestDate = requestDate;
    _id = id;
    _createdAt = createdAt;
    _updatedAt = updatedAt;
  }

  MonetizationRequest.fromJson(dynamic json) {
    _userId = json['userId'];
    _channelId = json['channelId'];
    _channelName = json['channelName'];
    _totalWatchTime = json['totalWatchTime'];
    _status = json['status'];
    _requestDate = json['requestDate'];
    _id = json['_id'];
    _createdAt = json['createdAt'];
    _updatedAt = json['updatedAt'];
  }
  String? _userId;
  String? _channelId;
  String? _channelName;
  int? _totalWatchTime;
  int? _status;
  String? _requestDate;
  String? _id;
  String? _createdAt;
  String? _updatedAt;
  MonetizationRequest copyWith({
    String? userId,
    String? channelId,
    String? channelName,
    int? totalWatchTime,
    int? status,
    String? requestDate,
    String? id,
    String? createdAt,
    String? updatedAt,
  }) =>
      MonetizationRequest(
        userId: userId ?? _userId,
        channelId: channelId ?? _channelId,
        channelName: channelName ?? _channelName,
        totalWatchTime: totalWatchTime ?? _totalWatchTime,
        status: status ?? _status,
        requestDate: requestDate ?? _requestDate,
        id: id ?? _id,
        createdAt: createdAt ?? _createdAt,
        updatedAt: updatedAt ?? _updatedAt,
      );
  String? get userId => _userId;
  String? get channelId => _channelId;
  String? get channelName => _channelName;
  int? get totalWatchTime => _totalWatchTime;
  int? get status => _status;
  String? get requestDate => _requestDate;
  String? get id => _id;
  String? get createdAt => _createdAt;
  String? get updatedAt => _updatedAt;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['userId'] = _userId;
    map['channelId'] = _channelId;
    map['channelName'] = _channelName;
    map['totalWatchTime'] = _totalWatchTime;
    map['status'] = _status;
    map['requestDate'] = _requestDate;
    map['_id'] = _id;
    map['createdAt'] = _createdAt;
    map['updatedAt'] = _updatedAt;
    return map;
  }
}
