class GetReferralHistoryModel {
  bool? status;
  String? message;
  List<Data>? data;

  GetReferralHistoryModel({this.status, this.message, this.data});

  GetReferralHistoryModel.fromJson(Map<String, dynamic> json) {
    status = json['status'];
    message = json['message'];
    if (json['data'] != null) {
      data = <Data>[];
      json['data'].forEach((v) {
        data!.add(Data.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['status'] = status;
    data['message'] = message;
    if (this.data != null) {
      data['data'] = this.data!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Data {
  String? sId;
  UserId? userId;
  int? type;
  int? coin;
  String? uniqueId;
  String? date;
  String? createdAt;
  String? updatedAt;

  Data({this.sId, this.userId, this.type, this.coin, this.uniqueId, this.date, this.createdAt, this.updatedAt});

  Data.fromJson(Map<String, dynamic> json) {
    sId = json['_id'];
    userId = json['userId'] != null ? UserId.fromJson(json['userId']) : null;
    type = json['type'];
    coin = json['coin'];
    uniqueId = json['uniqueId'];
    date = json['date'];
    createdAt = json['createdAt'];
    updatedAt = json['updatedAt'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['_id'] = sId;
    if (userId != null) {
      data['userId'] = userId!.toJson();
    }
    data['type'] = type;
    data['coin'] = coin;
    data['uniqueId'] = uniqueId;
    data['date'] = date;
    data['createdAt'] = createdAt;
    data['updatedAt'] = updatedAt;
    return data;
  }
}

class UserId {
  String? sId;
  String? fullName;
  String? nickName;

  UserId({this.sId, this.fullName, this.nickName});

  UserId.fromJson(Map<String, dynamic> json) {
    sId = json['_id'];
    fullName = json['fullName'];
    nickName = json['nickName'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['_id'] = sId;
    data['fullName'] = fullName;
    data['nickName'] = nickName;
    return data;
  }
}
