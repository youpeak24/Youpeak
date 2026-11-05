// To parse this JSON data, do
//
//     final getCoinHistoryModel = getCoinHistoryModelFromJson(jsonString);

import 'dart:convert';

GetCoinHistoryModel getCoinHistoryModelFromJson(String str) => GetCoinHistoryModel.fromJson(json.decode(str));

String getCoinHistoryModelToJson(GetCoinHistoryModel data) => json.encode(data.toJson());

class GetCoinHistoryModel {
  bool? status;
  String? message;
  num? total;
  List<Datum>? data;

  GetCoinHistoryModel({
    this.status,
    this.message,
    this.total,
    this.data,
  });

  factory GetCoinHistoryModel.fromJson(Map<String, dynamic> json) => GetCoinHistoryModel(
        status: json["status"],
        message: json["message"],
        total: json["total"],
        data: json["data"] == null ? [] : List<Datum>.from(json["data"]!.map((x) => Datum.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "status": status,
        "message": message,
        "total": total,
        "data": data == null ? [] : List<dynamic>.from(data!.map((x) => x.toJson())),
      };
}

class Datum {
  String? id;
  num? type;
  num? coin;
  String? uniqueId;
  String? date;
  DateTime? createdAt;
  String? senderName;
  String? receiverName;
  bool? isIncome;
  String? videoName;
  String? channelName;

  Datum({
    this.id,
    this.type,
    this.coin,
    this.uniqueId,
    this.date,
    this.createdAt,
    this.senderName,
    this.receiverName,
    this.isIncome,
    this.videoName,
    this.channelName,
  });

  factory Datum.fromJson(Map<String, dynamic> json) => Datum(
        id: json["_id"],
        type: json["type"],
        coin: json["coin"],
        uniqueId: json["uniqueId"],
        date: json["date"],
        createdAt: json["createdAt"] == null ? null : DateTime.parse(json["createdAt"]),
        senderName: json["senderName"],
        receiverName: json["receiverName"],
        isIncome: json["isIncome"],
        videoName: json["videoName"],
        channelName: json["channelName"],
      );

  Map<String, dynamic> toJson() => {
        "_id": id,
        "type": type,
        "coin": coin,
        "uniqueId": uniqueId,
        "date": date,
        "createdAt": createdAt?.toIso8601String(),
        "senderName": senderName,
        "receiverName": receiverName,
        "isIncome": isIncome,
        "videoName": videoName,
        "channelName": channelName,
      };
}
