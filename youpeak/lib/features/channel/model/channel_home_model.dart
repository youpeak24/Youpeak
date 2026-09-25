class ChannelHomeModel {
  bool? status;
  String? message;
  int? totalVideosOfChannel;
  int? totalSubscribers;
  bool? isSubscribed;
  String? channelName;
  String? channelImage;
  int? channelType;
  int? subscriptionCost;
  int? videoUnlockCost;
  List<DetailsOfChannel>? detailsOfChannel;

  ChannelHomeModel(
      {this.status,
      this.message,
      this.totalVideosOfChannel,
      this.totalSubscribers,
      this.isSubscribed,
      this.channelName,
      this.channelImage,
      this.channelType,
      this.subscriptionCost,
      this.videoUnlockCost,
      this.detailsOfChannel});

  ChannelHomeModel.fromJson(Map<String, dynamic> json) {
    status = json['status'];
    message = json['message'];
    totalVideosOfChannel = json['totalVideosOfChannel'];
    totalSubscribers = json['totalSubscribers'];
    isSubscribed = json['isSubscribed'];
    channelName = json['channelName'];
    channelImage = json['channelImage'];
    channelType = json['channelType'];
    subscriptionCost = json['subscriptionCost'];
    videoUnlockCost = json['videoUnlockCost'];
    if (json['detailsOfChannel'] != null) {
      detailsOfChannel = <DetailsOfChannel>[];
      json['detailsOfChannel'].forEach((v) {
        detailsOfChannel!.add(new DetailsOfChannel.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['status'] = this.status;
    data['message'] = this.message;
    data['totalVideosOfChannel'] = this.totalVideosOfChannel;
    data['totalSubscribers'] = this.totalSubscribers;
    data['isSubscribed'] = this.isSubscribed;
    data['channelName'] = this.channelName;
    data['channelImage'] = this.channelImage;
    data['channelType'] = this.channelType;
    data['subscriptionCost'] = this.subscriptionCost;
    data['videoUnlockCost'] = this.videoUnlockCost;
    if (this.detailsOfChannel != null) {
      data['detailsOfChannel'] = this.detailsOfChannel!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class DetailsOfChannel {
  String? id;
  String? channelId;
  String? title;
  int? videoType;
  int? videoTime;
  String? videoUrl;
  String? videoImage;
  int? videoPrivacyType;
  String? createdAt;
  int? channelType;
  int? subscriptionCost;
  int? videoUnlockCost;
  int? views;
  bool? isSubscribed;
  bool? isSaveToWatchLater;
  String? time;

  DetailsOfChannel(
      {this.id,
      this.channelId,
      this.title,
      this.videoType,
      this.videoTime,
      this.videoUrl,
      this.videoImage,
      this.videoPrivacyType,
      this.createdAt,
      this.channelType,
      this.subscriptionCost,
      this.videoUnlockCost,
      this.views,
      this.isSubscribed,
      this.isSaveToWatchLater,
      this.time});

  DetailsOfChannel.fromJson(Map<String, dynamic> json) {
    id = json['_id'];
    channelId = json['channelId'];
    title = json['title'];
    videoType = json['videoType'];
    videoTime = json['videoTime'];
    videoUrl = json['videoUrl'];
    videoImage = json['videoImage'];
    videoPrivacyType = json['videoPrivacyType'];
    createdAt = json['createdAt'];
    channelType = json['channelType'];
    subscriptionCost = json['subscriptionCost'];
    videoUnlockCost = json['videoUnlockCost'];
    views = json['views'];
    isSubscribed = json['isSubscribed'];
    isSaveToWatchLater = json['isSaveToWatchLater'];
    time = json['time'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['_id'] = this.id;
    data['channelId'] = this.channelId;
    data['title'] = this.title;
    data['videoType'] = this.videoType;
    data['videoTime'] = this.videoTime;
    data['videoUrl'] = this.videoUrl;
    data['videoImage'] = this.videoImage;
    data['videoPrivacyType'] = this.videoPrivacyType;
    data['createdAt'] = this.createdAt;
    data['channelType'] = this.channelType;
    data['subscriptionCost'] = this.subscriptionCost;
    data['videoUnlockCost'] = this.videoUnlockCost;
    data['views'] = this.views;
    data['isSubscribed'] = this.isSubscribed;
    data['isSaveToWatchLater'] = this.isSaveToWatchLater;
    data['time'] = this.time;
    return data;
  }
}
