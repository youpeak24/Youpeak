// To parse this JSON data, do
//
//     final getPlayListModel = getPlayListModelFromJson(jsonString);

import 'dart:convert';

GetPlayListModel getPlayListModelFromJson(String str) => GetPlayListModel.fromJson(json.decode(str));

String getPlayListModelToJson(GetPlayListModel data) => json.encode(data.toJson());

class GetPlayListModel {
  bool? status;
  String? message;
  int? total;
  List<PlayList>? playListVideos;

  GetPlayListModel({
    this.status,
    this.message,
    this.total,
    this.playListVideos,
  });

  factory GetPlayListModel.fromJson(Map<String, dynamic> json) => GetPlayListModel(
        status: json["status"],
        message: json["message"],
        total: json["total"],
        playListVideos: json["playListVideos"] == null ? [] : List<PlayList>.from(json["playListVideos"]!.map((x) => PlayList.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "status": status,
        "message": message,
        "total": total,
        "playListVideos": playListVideos == null ? [] : List<dynamic>.from(playListVideos!.map((x) => x.toJson())),
      };
}

class PlayList {
  String? id;
  String? channelId;
  String? userId;
  String? playListName;
  int? playListType;
  bool? isSubscribed;
  int? videoPrivacyType;
  String? channelName;
  int? channelType;
  int? subscriptionCost;
  int? videoUnlockCost;
  String? videoId;
  String? videoName;
  String? videoUrl;
  String? videoImage;
  int? videoTime;

  PlayList({
    this.id,
    this.channelId,
    this.userId,
    this.playListName,
    this.playListType,
    this.isSubscribed,
    this.videoPrivacyType,
    this.channelName,
    this.channelType,
    this.subscriptionCost,
    this.videoUnlockCost,
    this.videoId,
    this.videoName,
    this.videoUrl,
    this.videoImage,
    this.videoTime,
  });

  factory PlayList.fromJson(Map<String, dynamic> json) => PlayList(
        id: json["_id"],
        channelId: json["channelId"],
        userId: json["userId"],
        playListName: json["playListName"],
        playListType: json["playListType"],
        isSubscribed: json["isSubscribed"],
        videoPrivacyType: json["videoPrivacyType"],
        channelName: json["channelName"],
        channelType: json["channelType"],
        subscriptionCost: json["subscriptionCost"],
        videoUnlockCost: json["videoUnlockCost"],
        videoId: json["videoId"],
        videoName: json["videoName"],
        videoUrl: json["videoUrl"],
        videoImage: json["videoImage"],
        videoTime: json["videoTime"],
      );

  Map<String, dynamic> toJson() => {
        "_id": id,
        "channelId": channelId,
        "userId": userId,
        "playListName": playListName,
        "playListType": playListType,
        "isSubscribed": isSubscribed,
        "videoPrivacyType": videoPrivacyType,
        "channelName": channelName,
        "channelType": channelType,
        "subscriptionCost": subscriptionCost,
        "videoUnlockCost": videoUnlockCost,
        "videoId": videoId,
        "videoName": videoName,
        "videoUrl": videoUrl,
        "videoImage": videoImage,
        "videoTime": videoTime,
      };
}
