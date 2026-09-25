class GetChannelVideoModel {
  bool? status;
  String? message;
  List<VideosTypeWiseOfChannel>? videosTypeWiseOfChannel;

  GetChannelVideoModel({this.status, this.message, this.videosTypeWiseOfChannel});

  GetChannelVideoModel.fromJson(Map<String, dynamic> json) {
    status = json['status'];
    message = json['message'];
    if (json['videosTypeWiseOfChannel'] != null) {
      videosTypeWiseOfChannel = <VideosTypeWiseOfChannel>[];
      json['videosTypeWiseOfChannel'].forEach((v) {
        videosTypeWiseOfChannel!.add(new VideosTypeWiseOfChannel.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['status'] = this.status;
    data['message'] = this.message;
    if (this.videosTypeWiseOfChannel != null) {
      data['videosTypeWiseOfChannel'] = this.videosTypeWiseOfChannel!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class VideosTypeWiseOfChannel {
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
  String? time;

  VideosTypeWiseOfChannel(
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
      this.time});

  VideosTypeWiseOfChannel.fromJson(Map<String, dynamic> json) {
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
    data['time'] = this.time;
    return data;
  }
}
