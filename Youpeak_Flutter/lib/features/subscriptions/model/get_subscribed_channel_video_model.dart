class GetSubscribedChannelVideoModel {
  bool? status;
  String? message;
  List<VideoOfSubscribedChannel>? videoOfSubscribedChannel;

  GetSubscribedChannelVideoModel({this.status, this.message, this.videoOfSubscribedChannel});

  GetSubscribedChannelVideoModel.fromJson(Map<String, dynamic> json) {
    status = json['status'];
    message = json['message'];
    if (json['videoOfSubscribedChannel'] != null) {
      videoOfSubscribedChannel = <VideoOfSubscribedChannel>[];
      json['videoOfSubscribedChannel'].forEach((v) {
        videoOfSubscribedChannel!.add(new VideoOfSubscribedChannel.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['status'] = this.status;
    data['message'] = this.message;
    if (this.videoOfSubscribedChannel != null) {
      data['videoOfSubscribedChannel'] = this.videoOfSubscribedChannel!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class VideoOfSubscribedChannel {
  String? id;
  bool? isSaveToWatchLater;
  String? videoId;
  String? videoTitle;
  num? videoType;
  num? videoTime;
  String? videoUrl;
  String? videoImage;
  String? videoCreatedAt;
  num? videoPrivacyType;
  num? channelType;
  num? subscriptionCost;
  num? videoUnlockCost;
  String? channelName;
  String? channelId;
  String? channelImage;
  num? views;

  VideoOfSubscribedChannel(
      {this.id,
      this.isSaveToWatchLater,
      this.videoId,
      this.videoTitle,
      this.videoType,
      this.videoTime,
      this.videoUrl,
      this.videoImage,
      this.videoCreatedAt,
      this.videoPrivacyType,
      this.channelType,
      this.subscriptionCost,
      this.videoUnlockCost,
      this.channelName,
      this.channelId,
      this.channelImage,
      this.views});

  VideoOfSubscribedChannel.fromJson(Map<String, dynamic> json) {
    id = json['_id'];
    isSaveToWatchLater = json['isSaveToWatchLater'];
    videoId = json['videoId'];
    videoTitle = json['videoTitle'];
    videoType = json['videoType'];
    videoTime = json['videoTime'];
    videoUrl = json['videoUrl'];
    videoImage = json['videoImage'];
    videoCreatedAt = json['videoCreatedAt'];
    videoPrivacyType = json['videoPrivacyType'];
    channelType = json['channelType'];
    subscriptionCost = json['subscriptionCost'];
    videoUnlockCost = json['videoUnlockCost'];
    channelName = json['channelName'];
    channelId = json['channelId'];
    channelImage = json['channelImage'];
    views = json['views'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['_id'] = this.id;
    data['isSaveToWatchLater'] = this.isSaveToWatchLater;
    data['videoId'] = this.videoId;
    data['videoTitle'] = this.videoTitle;
    data['videoType'] = this.videoType;
    data['videoTime'] = this.videoTime;
    data['videoUrl'] = this.videoUrl;
    data['videoImage'] = this.videoImage;
    data['videoCreatedAt'] = this.videoCreatedAt;
    data['videoPrivacyType'] = this.videoPrivacyType;
    data['channelType'] = this.channelType;
    data['subscriptionCost'] = this.subscriptionCost;
    data['videoUnlockCost'] = this.videoUnlockCost;
    data['channelName'] = this.channelName;
    data['channelId'] = this.channelId;
    data['channelImage'] = this.channelImage;
    data['views'] = this.views;
    return data;
  }
}
