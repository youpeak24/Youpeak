class GetRelatedVideoModel {
  bool? status;
  String? message;
  List<Data>? data;

  GetRelatedVideoModel({this.status, this.message, this.data});

  GetRelatedVideoModel.fromJson(Map<String, dynamic> json) {
    status = json['status'];
    message = json['message'];
    if (json['data'] != null) {
      data = <Data>[];
      json['data'].forEach((v) {
        data!.add(new Data.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['status'] = this.status;
    data['message'] = this.message;
    if (this.data != null) {
      data['data'] = this.data!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Data {
  String? id;
  String? title;
  String? videoImage;
  String? videoUrl;
  int? videoTime;
  int? videoType;
  String? channelId;
  int? videoPrivacyType;
  User? user;
  int? totalViews;
  String? time;
  bool? isSavedToWatchLater;
  bool? isSubscribedChannel;

  Data(
      {this.id,
      this.title,
      this.videoImage,
      this.videoUrl,
      this.videoTime,
      this.videoType,
      this.channelId,
      this.videoPrivacyType,
      this.user,
      this.totalViews,
      this.time,
      this.isSavedToWatchLater,
      this.isSubscribedChannel});

  Data.fromJson(Map<String, dynamic> json) {
    id = json['_id'];
    title = json['title'];
    videoImage = json['videoImage'];
    videoUrl = json['videoUrl'];
    videoTime = json['videoTime'];
    videoType = json['videoType'];
    channelId = json['channelId'];
    videoPrivacyType = json['videoPrivacyType'];
    user = json['user'] != null ? new User.fromJson(json['user']) : null;
    totalViews = json['totalViews'];
    time = json['time'];
    isSavedToWatchLater = json['isSavedToWatchLater'];
    isSubscribedChannel = json['isSubscribedChannel'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['_id'] = this.id;
    data['title'] = this.title;
    data['videoImage'] = this.videoImage;
    data['videoUrl'] = this.videoUrl;
    data['videoTime'] = this.videoTime;
    data['videoType'] = this.videoType;
    data['channelId'] = this.channelId;
    data['videoPrivacyType'] = this.videoPrivacyType;
    if (this.user != null) {
      data['user'] = this.user!.toJson();
    }
    data['totalViews'] = this.totalViews;
    data['time'] = this.time;
    data['isSavedToWatchLater'] = this.isSavedToWatchLater;
    data['isSubscribedChannel'] = this.isSubscribedChannel;
    return data;
  }
}

class User {
  String? fullName;
  String? image;
  String? channelId;
  num? subscriptionCost;
  num? videoUnlockCost;
  int? channelType;

  User({this.fullName, this.image, this.channelId, this.subscriptionCost, this.videoUnlockCost, this.channelType});

  User.fromJson(Map<String, dynamic> json) {
    fullName = json['fullName'];
    image = json['image'];
    channelId = json['channelId'];
    subscriptionCost = json['subscriptionCost'];
    videoUnlockCost = json['videoUnlockCost'];
    channelType = json['channelType'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['fullName'] = this.fullName;
    data['image'] = this.image;
    data['channelId'] = this.channelId;
    data['subscriptionCost'] = this.subscriptionCost;
    data['videoUnlockCost'] = this.videoUnlockCost;
    data['channelType'] = this.channelType;
    return data;
  }
}
