class VideoDetailsModel {
  bool? status;
  String? message;
  DetailsOfVideo? detailsOfVideo;

  VideoDetailsModel({this.status, this.message, this.detailsOfVideo});

  VideoDetailsModel.fromJson(Map<String, dynamic> json) {
    status = json['status'];
    message = json['message'];
    detailsOfVideo = json['detailsOfVideo'] != null ? DetailsOfVideo.fromJson(json['detailsOfVideo']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['status'] = status;
    data['message'] = message;
    if (detailsOfVideo != null) {
      data['detailsOfVideo'] = detailsOfVideo!.toJson();
    }
    return data;
  }
}

class DetailsOfVideo {
  String? id;
  List<String>? hashTag;
  int? shareCount;
  int? like;
  int? dislike;
  String? channelId;
  String? title;
  String? description;
  int? videoType;
  int? videoTime;
  String? videoUrl;
  String? videoImage;
  int? commentType;
  int? videoPrivacyType;
  String? userId;
  String? createdAt;
  int? channelType;
  num? subscriptionCost;
  num? videoUnlockCost;
  String? channelName;
  String? channelImage;
  int? totalComments;
  int? totalSubscribers;
  int? views;
  bool? isSubscribed;
  bool? isSaveToWatchLater;
  bool? isLike;
  bool? isDislike;
  String? time;

  DetailsOfVideo(
      {this.id,
      this.hashTag,
      this.shareCount,
      this.like,
      this.dislike,
      this.channelId,
      this.title,
      this.description,
      this.videoType,
      this.videoTime,
      this.videoUrl,
      this.videoImage,
      this.commentType,
      this.videoPrivacyType,
      this.userId,
      this.createdAt,
      this.channelType,
      this.subscriptionCost,
      this.videoUnlockCost,
      this.channelName,
      this.channelImage,
      this.totalComments,
      this.totalSubscribers,
      this.views,
      this.isSubscribed,
      this.isSaveToWatchLater,
      this.isLike,
      this.isDislike,
      this.time});

  DetailsOfVideo.fromJson(Map<String, dynamic> json) {
    id = json['_id'];
    hashTag = (json['hashTag'] as List?)?.cast<String>() ?? <String>[];
    shareCount = json['shareCount'];
    like = json['like'];
    dislike = json['dislike'];
    channelId = json['channelId'];
    title = json['title'];
    description = json['description'];
    videoType = json['videoType'];
    videoTime = json['videoTime'];
    videoUrl = json['videoUrl'];
    videoImage = json['videoImage'];
    commentType = json['commentType'];
    videoPrivacyType = json['videoPrivacyType'];
    userId = json['userId'];
    createdAt = json['createdAt'];
    channelType = json['channelType'];
    subscriptionCost = json['subscriptionCost'];
    videoUnlockCost = json['videoUnlockCost'];
    channelName = json['channelName'];
    channelImage = json['channelImage'];
    totalComments = json['totalComments'];
    totalSubscribers = json['totalSubscribers'];
    views = json['views'];
    isSubscribed = json['isSubscribed'];
    isSaveToWatchLater = json['isSaveToWatchLater'];
    isLike = json['isLike'];
    isDislike = json['isDislike'];
    time = json['time'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['_id'] = id;
    data['hashTag'] = hashTag;
    data['shareCount'] = shareCount;
    data['like'] = like;
    data['dislike'] = dislike;
    data['channelId'] = channelId;
    data['title'] = title;
    data['description'] = description;
    data['videoType'] = videoType;
    data['videoTime'] = videoTime;
    data['videoUrl'] = videoUrl;
    data['videoImage'] = videoImage;
    data['commentType'] = commentType;
    data['videoPrivacyType'] = videoPrivacyType;
    data['userId'] = userId;
    data['createdAt'] = createdAt;
    data['channelType'] = channelType;
    data['subscriptionCost'] = subscriptionCost;
    data['videoUnlockCost'] = videoUnlockCost;
    data['channelName'] = channelName;
    data['channelImage'] = channelImage;
    data['totalComments'] = totalComments;
    data['totalSubscribers'] = totalSubscribers;
    data['views'] = views;
    data['isSubscribed'] = isSubscribed;
    data['isSaveToWatchLater'] = isSaveToWatchLater;
    data['isLike'] = isLike;
    data['isDislike'] = isDislike;
    data['time'] = time;
    return data;
  }
}
