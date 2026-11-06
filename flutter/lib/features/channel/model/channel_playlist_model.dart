// To parse this JSON data, do
//
//     final channelPlaylistModel = channelPlaylistModelFromJson(jsonString);

import 'dart:convert';

ChannelPlaylistModel channelPlaylistModelFromJson(String str) => ChannelPlaylistModel.fromJson(json.decode(str));

String channelPlaylistModelToJson(ChannelPlaylistModel data) => json.encode(data.toJson());

class ChannelPlaylistModel {
  bool? status;
  String? message;
  int? total;
  List<PlayListsOfChannel>? playListsOfChannel;

  ChannelPlaylistModel({
    this.status,
    this.message,
    this.total,
    this.playListsOfChannel,
  });

  factory ChannelPlaylistModel.fromJson(Map<String, dynamic> json) => ChannelPlaylistModel(
        status: json["status"],
        message: json["message"],
        total: json["total"],
        playListsOfChannel: json["playListsOfChannel"] == null
            ? []
            : List<PlayListsOfChannel>.from(json["playListsOfChannel"]!.map((x) => PlayListsOfChannel.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "status": status,
        "message": message,
        "total": total,
        "playListsOfChannel": playListsOfChannel == null ? [] : List<dynamic>.from(playListsOfChannel!.map((x) => x.toJson())),
      };
}

class PlayListsOfChannel {
  String? id;
  String? channelId;
  String? userId;
  String? playListName;
  int? playListType;
  String? channelName;
  int? channelType;
  DateTime? createdAt;
  String? videoImage;
  String? videoId;
  int? totalVideo;

  PlayListsOfChannel({
    this.id,
    this.channelId,
    this.userId,
    this.playListName,
    this.playListType,
    this.channelName,
    this.channelType,
    this.createdAt,
    this.videoImage,
    this.videoId,
    this.totalVideo,
  });

  factory PlayListsOfChannel.fromJson(Map<String, dynamic> json) => PlayListsOfChannel(
        id: json["_id"],
        channelId: json["channelId"],
        userId: json["userId"],
        playListName: json["playListName"],
        playListType: json["playListType"],
        channelName: json["channelName"],
        channelType: json["channelType"],
        createdAt: json["createdAt"] == null ? null : DateTime.parse(json["createdAt"]),
        videoImage: json["videoImage"],
        videoId: json["videoId"],
        totalVideo: json["totalVideo"],
      );

  Map<String, dynamic> toJson() => {
        "_id": id,
        "channelId": channelId,
        "userId": userId,
        "playListName": playListName,
        "playListType": playListType,
        "channelName": channelName,
        "channelType": channelType,
        "createdAt": createdAt?.toIso8601String(),
        "videoImage": videoImage,
        "videoId": videoId,
        "totalVideo": totalVideo,
      };
}
