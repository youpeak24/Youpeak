import 'dart:convert';

GetWithdrawHistoryModel getWithdrawHistoryModelFromJson(String str) => GetWithdrawHistoryModel.fromJson(json.decode(str));
String getWithdrawHistoryModelToJson(GetWithdrawHistoryModel data) => json.encode(data.toJson());

class GetWithdrawHistoryModel {
  GetWithdrawHistoryModel({
    bool? status,
    String? message,
    List<WithDrawRequests>? withDrawRequests,
  }) {
    _status = status;
    _message = message;
    _withDrawRequests = withDrawRequests;
  }

  GetWithdrawHistoryModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    if (json['WithDrawRequests'] != null) {
      _withDrawRequests = [];
      json['WithDrawRequests'].forEach((v) {
        _withDrawRequests?.add(WithDrawRequests.fromJson(v));
      });
    }
  }
  bool? _status;
  String? _message;
  List<WithDrawRequests>? _withDrawRequests;
  GetWithdrawHistoryModel copyWith({
    bool? status,
    String? message,
    List<WithDrawRequests>? withDrawRequests,
  }) =>
      GetWithdrawHistoryModel(
        status: status ?? _status,
        message: message ?? _message,
        withDrawRequests: withDrawRequests ?? _withDrawRequests,
      );
  bool? get status => _status;
  String? get message => _message;
  List<WithDrawRequests>? get withDrawRequests => _withDrawRequests;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_withDrawRequests != null) {
      map['WithDrawRequests'] = _withDrawRequests?.map((v) => v.toJson()).toList();
    }
    return map;
  }
}

WithDrawRequests withDrawRequestsFromJson(String str) => WithDrawRequests.fromJson(json.decode(str));
String withDrawRequestsToJson(WithDrawRequests data) => json.encode(data.toJson());

class WithDrawRequests {
  WithDrawRequests({
    String? id,
    String? userId,
    String? channelId,
    String? channelName,
    int? requestAmount,
    int? totalWatchTime,
    String? paymentGateway,
    List<String>? paymentDetails,
    int? status,
    String? reason,
    String? uniqueId,
    String? requestDate,
    String? paymentDate,
    String? createdAt,
    String? updatedAt,
  }) {
    _id = id;
    _userId = userId;
    _channelId = channelId;
    _channelName = channelName;
    _requestAmount = requestAmount;
    _totalWatchTime = totalWatchTime;
    _paymentGateway = paymentGateway;
    _paymentDetails = paymentDetails;
    _status = status;
    _reason = reason;
    _uniqueId = uniqueId;
    _requestDate = requestDate;
    _paymentDate = paymentDate;
    _createdAt = createdAt;
    _updatedAt = updatedAt;
  }

  WithDrawRequests.fromJson(dynamic json) {
    _id = json['_id'];
    _userId = json['userId'];
    _channelId = json['channelId'];
    _channelName = json['channelName'];
    _requestAmount = json['requestAmount'];
    _totalWatchTime = json['totalWatchTime'];
    _paymentGateway = json['paymentGateway'];
    _paymentDetails = json['paymentDetails'] != null ? json['paymentDetails'].cast<String>() : [];
    _status = json['status'];
    _reason = json['reason'];
    _uniqueId = json['uniqueId'];
    _requestDate = json['requestDate'];
    _paymentDate = json['paymentDate'];
    _createdAt = json['createdAt'];
    _updatedAt = json['updatedAt'];
  }
  String? _id;
  String? _userId;
  String? _channelId;
  String? _channelName;
  int? _requestAmount;
  int? _totalWatchTime;
  String? _paymentGateway;
  List<String>? _paymentDetails;
  int? _status;
  String? _reason;
  String? _uniqueId;
  String? _requestDate;
  String? _paymentDate;
  String? _createdAt;
  String? _updatedAt;
  WithDrawRequests copyWith({
    String? id,
    String? userId,
    String? channelId,
    String? channelName,
    int? requestAmount,
    int? totalWatchTime,
    String? paymentGateway,
    List<String>? paymentDetails,
    int? status,
    String? reason,
    String? uniqueId,
    String? requestDate,
    String? paymentDate,
    String? createdAt,
    String? updatedAt,
  }) =>
      WithDrawRequests(
        id: id ?? _id,
        userId: userId ?? _userId,
        channelId: channelId ?? _channelId,
        channelName: channelName ?? _channelName,
        requestAmount: requestAmount ?? _requestAmount,
        totalWatchTime: totalWatchTime ?? _totalWatchTime,
        paymentGateway: paymentGateway ?? _paymentGateway,
        paymentDetails: paymentDetails ?? _paymentDetails,
        status: status ?? _status,
        reason: reason ?? _reason,
        uniqueId: uniqueId ?? _uniqueId,
        requestDate: requestDate ?? _requestDate,
        paymentDate: paymentDate ?? _paymentDate,
        createdAt: createdAt ?? _createdAt,
        updatedAt: updatedAt ?? _updatedAt,
      );
  String? get id => _id;
  String? get userId => _userId;
  String? get channelId => _channelId;
  String? get channelName => _channelName;
  int? get requestAmount => _requestAmount;
  int? get totalWatchTime => _totalWatchTime;
  String? get paymentGateway => _paymentGateway;
  List<String>? get paymentDetails => _paymentDetails;
  int? get status => _status;
  String? get reason => _reason;
  String? get uniqueId => _uniqueId;
  String? get requestDate => _requestDate;
  String? get paymentDate => _paymentDate;
  String? get createdAt => _createdAt;
  String? get updatedAt => _updatedAt;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['userId'] = _userId;
    map['channelId'] = _channelId;
    map['channelName'] = _channelName;
    map['requestAmount'] = _requestAmount;
    map['totalWatchTime'] = _totalWatchTime;
    map['paymentGateway'] = _paymentGateway;
    map['paymentDetails'] = _paymentDetails;
    map['status'] = _status;
    map['reason'] = _reason;
    map['uniqueId'] = _uniqueId;
    map['requestDate'] = _requestDate;
    map['paymentDate'] = _paymentDate;
    map['createdAt'] = _createdAt;
    map['updatedAt'] = _updatedAt;
    return map;
  }
}
