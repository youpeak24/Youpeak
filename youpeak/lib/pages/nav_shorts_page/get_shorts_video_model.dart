class GetShortsVideoModel {
  bool? status;
  String? message;
  List<Shorts>? shorts;

  GetShortsVideoModel({this.status, this.message, this.shorts});

  GetShortsVideoModel.fromJson(Map<String, dynamic> json) {
    status = json['status'];
    message = json['message'];
    if (json['shorts'] != null) {
      shorts = <Shorts>[];
      json['shorts'].forEach((v) {
        shorts!.add(new Shorts.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['status'] = this.status;
    data['message'] = this.message;
    if (this.shorts != null) {
      data['shorts'] = this.shorts!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Shorts {
  String? id;
  List<String>? hashTag;
  num? shareCount;
  num? like;
  num? dislike;
  String? title;
  String? description;
  num? videoType;
  num? videoTime;
  String? videoUrl;
  String? videoImage;
  num? commentType;
  String? userId;
  String? channelId;
  String? createdAt;
  num? videoPrivacyType;
  String? channelName;
  String? channelImage;
  num? totalComments;
  bool? isSubscribed;
  bool? isSaveToWatchLater;
  bool? isLike;
  bool? isDislike;
  num? views;
  num? channelType;
  num? subscriptionCost;
  num? videoUnlockCost;

  Shorts(
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

  Shorts.fromJson(Map<String, dynamic> json) {
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
