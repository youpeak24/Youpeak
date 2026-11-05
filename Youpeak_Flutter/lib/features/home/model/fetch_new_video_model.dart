// To parse this JSON data, do
//
//     final fetchNewVideoModel = fetchNewVideoModelFromJson(jsonString);

import 'package:meta/meta.dart';
import 'dart:convert';

FetchNewVideoModel fetchNewVideoModelFromJson(String str) =>
    FetchNewVideoModel.fromJson(json.decode(str));

String fetchNewVideoModelToJson(FetchNewVideoModel data) =>
    json.encode(data.toJson());

class FetchNewVideoModel {
  bool status;
  String message;
  int totalVideos;
  int totalShorts;
  Data data;

  FetchNewVideoModel({
    required this.status,
    required this.message,
    required this.totalVideos,
    required this.totalShorts,
    required this.data,
  });

  factory FetchNewVideoModel.fromJson(Map<String, dynamic> json) =>
      FetchNewVideoModel(
        status: json["status"],
        message: json["message"],
        totalVideos: json["totalVideos"],
        totalShorts: json["totalShorts"],
        data: Data.fromJson(json["data"]),
      );

  Map<String, dynamic> toJson() => {
        "status": status,
        "message": message,
        "totalVideos": totalVideos,
        "totalShorts": totalShorts,
        "data": data.toJson(),
      };
}

class Data {
  List<Video> videos;
  List<Short> shorts;

  Data({
    required this.videos,
    required this.shorts,
  });

  factory Data.fromJson(Map<String, dynamic> json) => Data(
        videos: List<Video>.from(json["videos"].map((x) => Video.fromJson(x))),
        shorts: List<Short>.from(json["shorts"].map((x) => Short.fromJson(x))),
      );

  Map<String, dynamic> toJson() => {
        "videos": List<dynamic>.from(videos.map((x) => x.toJson())),
        "shorts": List<dynamic>.from(shorts.map((x) => x.toJson())),
      };
}

class Short {
  String id;
  List<String> hashTag;
  int videoPrivacyType;
  int commentType;
  int shareCount;
  int like;
  int dislike;
  String channelId;
  String title;
  String description;
  int videoType;
  int videoTime;
  String videoUrl;
  String videoImage;
  String userId;
  DateTime createdAt;
  List<dynamic> totalComments;
  bool isSaveToWatchLater;
  bool isSubscribed;
  int channelType;
  int subscriptionCost;
  int videoUnlockCost;
  String channelName;
  String? channelImage; // Made nullable
  bool isLike;
  bool isDislike;
  int views;

  Short({
    required this.id,
    required this.hashTag,
    required this.videoPrivacyType,
    required this.commentType,
    required this.shareCount,
    required this.like,
    required this.dislike,
    required this.channelId,
    required this.title,
    required this.description,
    required this.videoType,
    required this.videoTime,
    required this.videoUrl,
    required this.videoImage,
    required this.userId,
    required this.createdAt,
    required this.totalComments,
    required this.isSaveToWatchLater,
    required this.isSubscribed,
    required this.channelType,
    required this.subscriptionCost,
    required this.videoUnlockCost,
    required this.channelName,
    this.channelImage, // Now optional
    required this.isLike,
    required this.isDislike,
    required this.views,
  });

  factory Short.fromJson(Map<String, dynamic> json) => Short(
        id: json["_id"],
        hashTag: List<String>.from(json["hashTag"].map((x) => x)),
        videoPrivacyType: json["videoPrivacyType"],
        commentType: json["commentType"],
        shareCount: json["shareCount"],
        like: json["like"],
        dislike: json["dislike"],
        channelId: json["channelId"],
        title: json["title"],
        description: json["description"],
        videoType: json["videoType"],
        videoTime: json["videoTime"],
        videoUrl: json["videoUrl"],
        videoImage: json["videoImage"],
        userId: json["userId"],
        createdAt: DateTime.parse(json["createdAt"]),
        totalComments: List<dynamic>.from(json["totalComments"].map((x) => x)),
        isSaveToWatchLater: json["isSaveToWatchLater"],
        isSubscribed: json["isSubscribed"],
        channelType: json["channelType"] ?? 1,
        subscriptionCost: json["subscriptionCost"] ?? 0,
        videoUnlockCost: json["videoUnlockCost"] ?? 0,
        channelName: json["channelName"] ?? '',
        channelImage: json["channelImage"],
        // Can now accept null
        isLike: json["isLike"],
        isDislike: json["isDislike"],
        views: json["views"],
      );

  Map<String, dynamic> toJson() => {
        "_id": id,
        "hashTag": List<dynamic>.from(hashTag.map((x) => x)),
        "videoPrivacyType": videoPrivacyType,
        "commentType": commentType,
        "shareCount": shareCount,
        "like": like,
        "dislike": dislike,
        "channelId": channelId,
        "title": title,
        "description": description,
        "videoType": videoType,
        "videoTime": videoTime,
        "videoUrl": videoUrl,
        "videoImage": videoImage,
        "userId": userId,
        "createdAt": createdAt.toIso8601String(),
        "totalComments": List<dynamic>.from(totalComments.map((x) => x)),
        "isSaveToWatchLater": isSaveToWatchLater,
        "isSubscribed": isSubscribed,
        "channelType": channelType,
        "subscriptionCost": subscriptionCost,
        "videoUnlockCost": videoUnlockCost,
        "channelName": channelName,
        "channelImage": channelImage, // Can now be null
        "isLike": isLike,
        "isDislike": isDislike,
        "views": views,
      };
}

class Video {
  String id;
  int videoPrivacyType;
  int scheduleType;
  String channelId;
  String scheduleTime;
  String title;
  int videoType;
  int videoTime;
  String videoUrl;
  String videoImage;
  String userId;
  DateTime createdAt;
  bool isSaveToWatchLater;
  bool isSubscribed;
  int views;
  int channelType;
  int subscriptionCost;
  int videoUnlockCost;
  String channelName;
  String? channelImage; // Made nullable
  String time;

  Video({
    required this.id,
    required this.videoPrivacyType,
    required this.scheduleType,
    required this.channelId,
    required this.scheduleTime,
    required this.title,
    required this.videoType,
    required this.videoTime,
    required this.videoUrl,
    required this.videoImage,
    required this.userId,
    required this.createdAt,
    required this.isSaveToWatchLater,
    required this.isSubscribed,
    required this.views,
    required this.channelType,
    required this.subscriptionCost,
    required this.videoUnlockCost,
    required this.channelName,
    this.channelImage, // Now optional
    required this.time,
  });

  factory Video.fromJson(Map<String, dynamic> json) => Video(
        id: json["_id"],
        videoPrivacyType: json["videoPrivacyType"],
        scheduleType: json["scheduleType"],
        channelId: json["channelId"],
        scheduleTime: json["scheduleTime"],
        title: json["title"],
        videoType: json["videoType"],
        videoTime: json["videoTime"],
        videoUrl: json["videoUrl"],
        videoImage: json["videoImage"],
        userId: json["userId"],
        createdAt: DateTime.parse(json["createdAt"]),
        isSaveToWatchLater: json["isSaveToWatchLater"],
        isSubscribed: json["isSubscribed"],
        views: json["views"],
        channelType: json["channelType"] ?? 1,
        subscriptionCost: json["subscriptionCost"] ?? 0,
        videoUnlockCost: json["videoUnlockCost"] ?? 0,
        channelName: json["channelName"] ?? '',
        channelImage: json["channelImage"],
        // Can now accept null
        time: json["time"],
      );

  Map<String, dynamic> toJson() => {
        "_id": id,
        "videoPrivacyType": videoPrivacyType,
        "scheduleType": scheduleType,
        "channelId": channelId,
        "scheduleTime": scheduleTime,
        "title": title,
        "videoType": videoType,
        "videoTime": videoTime,
        "videoUrl": videoUrl,
        "videoImage": videoImage,
        "userId": userId,
        "createdAt": createdAt.toIso8601String(),
        "isSaveToWatchLater": isSaveToWatchLater,
        "isSubscribed": isSubscribed,
        "views": views,
        "channelType": channelType,
        "subscriptionCost": subscriptionCost,
        "videoUnlockCost": videoUnlockCost,
        "channelName": channelName,
        "channelImage": channelImage, // Can now be null
        "time": time,
      };
}
