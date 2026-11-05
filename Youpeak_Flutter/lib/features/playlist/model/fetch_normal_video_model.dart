class FetchNormalVideoModel {
  bool? status;
  String? message;
  List<Videos>? videos;

  FetchNormalVideoModel({this.status, this.message, this.videos});

  FetchNormalVideoModel.fromJson(Map<String, dynamic> json) {
    status = json['status'];
    message = json['message'];
    if (json['videos'] != null) {
      videos = <Videos>[];
      json['videos'].forEach((v) {
        videos!.add(new Videos.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['status'] = this.status;
    data['message'] = this.message;
    if (this.videos != null) {
      data['videos'] = this.videos!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Videos {
  String? id;
  String? channelId;
  int? scheduleType;
  String? scheduleTime;
  String? title;
  int? videoType;
  int? videoTime;
  String? videoUrl;
  String? videoImage;
  int? videoPrivacyType;
  String? userId;
  int? views;
  int? channelType;
  int? subscriptionCost;
  int? videoUnlockCost;
  String? channelName;
  String? channelImage;
  bool? isSaveToWatchLater;
  bool? isSubscribed;
  String? time;

  Videos(
      {this.id,
      this.channelId,
      this.scheduleType,
      this.scheduleTime,
      this.title,
      this.videoType,
      this.videoTime,
      this.videoUrl,
      this.videoImage,
      this.videoPrivacyType,
      this.userId,
      this.views,
      this.channelType,
      this.subscriptionCost,
      this.videoUnlockCost,
      this.channelName,
      this.channelImage,
      this.isSaveToWatchLater,
      this.isSubscribed,
      this.time});

  Videos.fromJson(Map<String, dynamic> json) {
    id = json['_id'];
    channelId = json['channelId'];
    scheduleType = json['scheduleType'];
    scheduleTime = json['scheduleTime'];
    title = json['title'];
    videoType = json['videoType'];
    videoTime = json['videoTime'];
    videoUrl = json['videoUrl'];
    videoImage = json['videoImage'];
    videoPrivacyType = json['videoPrivacyType'];
    userId = json['userId'];
    views = json['views'];
    channelType = json['channelType'];
    subscriptionCost = json['subscriptionCost'];
    videoUnlockCost = json['videoUnlockCost'];
    channelName = json['channelName'];
    channelImage = json['channelImage'];
    isSaveToWatchLater = json['isSaveToWatchLater'];
    isSubscribed = json['isSubscribed'];
    time = json['time'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['_id'] = this.id;
    data['channelId'] = this.channelId;
    data['scheduleType'] = this.scheduleType;
    data['scheduleTime'] = this.scheduleTime;
    data['title'] = this.title;
    data['videoType'] = this.videoType;
    data['videoTime'] = this.videoTime;
    data['videoUrl'] = this.videoUrl;
    data['videoImage'] = this.videoImage;
    data['videoPrivacyType'] = this.videoPrivacyType;
    data['userId'] = this.userId;
    data['views'] = this.views;
    data['channelType'] = this.channelType;
    data['subscriptionCost'] = this.subscriptionCost;
    data['videoUnlockCost'] = this.videoUnlockCost;
    data['channelName'] = this.channelName;
    data['channelImage'] = this.channelImage;
    data['isSaveToWatchLater'] = this.isSaveToWatchLater;
    data['isSubscribed'] = this.isSubscribed;
    data['time'] = this.time;
    return data;
  }
}
