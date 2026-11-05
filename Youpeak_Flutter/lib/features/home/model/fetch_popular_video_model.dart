class FetchPopularVideoModel {
  bool? status;
  String? message;
  Data? data;

  FetchPopularVideoModel({this.status, this.message, this.data});

  FetchPopularVideoModel.fromJson(Map<String, dynamic> json) {
    status = json['status'];
    message = json['message'];
    data = json['data'] != null ? new Data.fromJson(json['data']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['status'] = this.status;
    data['message'] = this.message;
    if (this.data != null) {
      data['data'] = this.data!.toJson();
    }
    return data;
  }
}

class Data {
  List<PopularVideos>? videos;
  List<PopularShorts>? shorts;

  Data({this.videos, this.shorts});

  Data.fromJson(Map<String, dynamic> json) {
    if (json['videos'] != null) {
      videos = <PopularVideos>[];
      json['videos'].forEach((v) {
        videos!.add(new PopularVideos.fromJson(v));
      });
    }
    if (json['shorts'] != null) {
      shorts = <PopularShorts>[];
      json['shorts'].forEach((v) {
        shorts!.add(new PopularShorts.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    if (this.videos != null) {
      data['videos'] = this.videos!.map((v) => v.toJson()).toList();
    }
    if (this.shorts != null) {
      data['shorts'] = this.shorts!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class PopularVideos {
  String? id;
  String? title;
  int? videoType;
  int? videoTime;
  String? videoUrl;
  String? videoImage;
  int? scheduleType;
  String? scheduleTime;
  String? userId;
  String? channelId;
  int? videoPrivacyType;
  int? views;
  String? channelName;
  String? channelImage;
  bool? isSubscribed;
  bool? isSaveToWatchLater;
  String? time;
  int? channelType;
  int? subscriptionCost;
  int? videoUnlockCost;

  PopularVideos(
      {this.id,
      this.title,
      this.videoType,
      this.videoTime,
      this.videoUrl,
      this.videoImage,
      this.scheduleType,
      this.scheduleTime,
      this.userId,
      this.channelId,
      this.videoPrivacyType,
      this.views,
      this.channelName,
      this.channelImage,
      this.isSubscribed,
      this.isSaveToWatchLater,
      this.time,
      this.channelType,
      this.subscriptionCost,
      this.videoUnlockCost});

  PopularVideos.fromJson(Map<String, dynamic> json) {
    id = json['_id'];
    title = json['title'];
    videoType = json['videoType'];
    videoTime = json['videoTime'];
    videoUrl = json['videoUrl'];
    videoImage = json['videoImage'];
    scheduleType = json['scheduleType'];
    scheduleTime = json['scheduleTime'];
    userId = json['userId'];
    channelId = json['channelId'];
    videoPrivacyType = json['videoPrivacyType'];
    views = json['views'];
    channelName = json['channelName'];
    channelImage = json['channelImage'];
    isSubscribed = json['isSubscribed'];
    isSaveToWatchLater = json['isSaveToWatchLater'];
    time = json['time'];
    channelType = json['channelType'];
    subscriptionCost = json['subscriptionCost'];
    videoUnlockCost = json['videoUnlockCost'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['_id'] = this.id;
    data['title'] = this.title;
    data['videoType'] = this.videoType;
    data['videoTime'] = this.videoTime;
    data['videoUrl'] = this.videoUrl;
    data['videoImage'] = this.videoImage;
    data['scheduleType'] = this.scheduleType;
    data['scheduleTime'] = this.scheduleTime;
    data['userId'] = this.userId;
    data['channelId'] = this.channelId;
    data['videoPrivacyType'] = this.videoPrivacyType;
    data['views'] = this.views;
    data['channelName'] = this.channelName;
    data['channelImage'] = this.channelImage;
    data['isSubscribed'] = this.isSubscribed;
    data['isSaveToWatchLater'] = this.isSaveToWatchLater;
    data['time'] = this.time;
    data['channelType'] = this.channelType;
    data['subscriptionCost'] = this.subscriptionCost;
    data['videoUnlockCost'] = this.videoUnlockCost;
    return data;
  }
}

class PopularShorts {
  String? id;
  List<String>? hashTag;
  int? shareCount;
  int? like;
  int? dislike;
  String? title;
  String? description;
  int? videoType;
  int? videoTime;
  String? videoUrl;
  String? videoImage;
  int? commentType;
  String? userId;
  String? channelId;
  String? createdAt;
  int? videoPrivacyType;
  String? channelName;
  String? channelImage;
  int? totalComments;
  bool? isSubscribed;
  bool? isSaveToWatchLater;
  bool? isLike;
  bool? isDislike;
  int? views;
  int? channelType;
  int? subscriptionCost;
  int? videoUnlockCost;

  PopularShorts(
      {this.id,
      this.hashTag,
      this.shareCount,
      this.like,
      this.dislike,
      this.title,
      this.description,
      this.videoType,
      this.videoTime,
      this.videoUrl,
      this.videoImage,
      this.commentType,
      this.userId,
      this.channelId,
      this.createdAt,
      this.videoPrivacyType,
      this.channelName,
      this.channelImage,
      this.totalComments,
      this.isSubscribed,
      this.isSaveToWatchLater,
      this.isLike,
      this.isDislike,
      this.views,
      this.channelType,
      this.subscriptionCost,
      this.videoUnlockCost});

  PopularShorts.fromJson(Map<String, dynamic> json) {
    id = json['_id'];
    hashTag = (json['hashTag'] as List?)?.cast<String>() ?? <String>[];
    shareCount = json['shareCount'];
    like = json['like'];
    dislike = json['dislike'];
    title = json['title'];
    description = json['description'];
    videoType = json['videoType'];
    videoTime = json['videoTime'];
    videoUrl = json['videoUrl'];
    videoImage = json['videoImage'];
    commentType = json['commentType'];
    userId = json['userId'];
    channelId = json['channelId'];
    createdAt = json['createdAt'];
    videoPrivacyType = json['videoPrivacyType'];
    channelName = json['channelName'];
    channelImage = json['channelImage'];
    totalComments = json['totalComments'];
    isSubscribed = json['isSubscribed'];
    isSaveToWatchLater = json['isSaveToWatchLater'];
    isLike = json['isLike'];
    isDislike = json['isDislike'];
    views = json['views'];
    channelType = json['channelType'];
    subscriptionCost = json['subscriptionCost'];
    videoUnlockCost = json['videoUnlockCost'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['_id'] = this.id;
    data['hashTag'] = this.hashTag;
    data['shareCount'] = this.shareCount;
    data['like'] = this.like;
    data['dislike'] = this.dislike;
    data['title'] = this.title;
    data['description'] = this.description;
    data['videoType'] = this.videoType;
    data['videoTime'] = this.videoTime;
    data['videoUrl'] = this.videoUrl;
    data['videoImage'] = this.videoImage;
    data['commentType'] = this.commentType;
    data['userId'] = this.userId;
    data['channelId'] = this.channelId;
    data['createdAt'] = this.createdAt;
    data['videoPrivacyType'] = this.videoPrivacyType;
    data['channelName'] = this.channelName;
    data['channelImage'] = this.channelImage;
    data['totalComments'] = this.totalComments;
    data['isSubscribed'] = this.isSubscribed;
    data['isSaveToWatchLater'] = this.isSaveToWatchLater;
    data['isLike'] = this.isLike;
    data['isDislike'] = this.isDislike;
    data['views'] = this.views;
    data['channelType'] = this.channelType;
    data['subscriptionCost'] = this.subscriptionCost;
    data['videoUnlockCost'] = this.videoUnlockCost;
    return data;
  }
}
