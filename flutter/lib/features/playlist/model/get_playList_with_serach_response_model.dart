// To parse this JSON data, do
//
//     final getPlayListWithSearchResponseModel = getPlayListWithSearchResponseModelFromJson(jsonString);

import 'dart:convert';

GetPlayListWithSearchResponseModel getPlayListWithSearchResponseModelFromJson(String str) => GetPlayListWithSearchResponseModel.fromJson(json.decode(str));

String getPlayListWithSearchResponseModelToJson(GetPlayListWithSearchResponseModel data) => json.encode(data.toJson());

class GetPlayListWithSearchResponseModel {
  bool? status;
  String? message;
  num? total;
  List<Video>? videos;

  GetPlayListWithSearchResponseModel({
    this.status,
    this.message,
    this.total,
    this.videos,
  });

  factory GetPlayListWithSearchResponseModel.fromJson(Map<String, dynamic> json) => GetPlayListWithSearchResponseModel(
        status: json["status"],
        message: json["message"],
        total: json["total"],
        videos: json["videos"] == null ? [] : List<Video>.from(json["videos"]!.map((x) => Video.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "status": status,
        "message": message,
        "total": total,
        "videos": videos == null ? [] : List<dynamic>.from(videos!.map((x) => x.toJson())),
      };
}

class Video {
  String? id;
  num? scheduleType;
  String? channelId;
  String? scheduleTime;
  String? title;
  String? description;
  num? videoType;
  num? videoTime;
  String? videoUrl;
  String? videoImage;
  String? userId;
  DateTime? createdAt;
  String? channelName;
  String? channelImage;

  Video({
    this.id,
    this.scheduleType,
    this.channelId,
    this.scheduleTime,
    this.title,
    this.description,
    this.videoType,
    this.videoTime,
    this.videoUrl,
    this.videoImage,
    this.userId,
    this.createdAt,
    this.channelName,
    this.channelImage,
  });

  factory Video.fromJson(Map<String, dynamic> json) => Video(
        id: json["_id"],
        scheduleType: json["scheduleType"],
        channelId: json["channelId"],
        scheduleTime: json["scheduleTime"],
        title: json["title"],
        description: json["description"],
        videoType: json["videoType"],
        videoTime: json["videoTime"],
        videoUrl: json["videoUrl"],
        videoImage: json["videoImage"],
        userId: json["userId"],
        createdAt: json["createdAt"] == null ? null : DateTime.parse(json["createdAt"]),
        channelName: json["channelName"],
        channelImage: json["channelImage"],
      );

  Map<String, dynamic> toJson() => {
        "_id": id,
        "scheduleType": scheduleType,
        "channelId": channelId,
        "scheduleTime": scheduleTime,
        "title": title,
        "description": description,
        "videoType": videoType,
        "videoTime": videoTime,
        "videoUrl": videoUrl,
        "videoImage": videoImage,
        "userId": userId,
        "createdAt": createdAt?.toIso8601String(),
        "channelName": channelName,
        "channelImage": channelImage,
      };
}
