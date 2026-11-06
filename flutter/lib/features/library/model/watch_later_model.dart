class WatchLaterModel {
  bool? status;
  String? message;
  List<GetSaveToWatchLater>? getSaveToWatchLater;

  WatchLaterModel({this.status, this.message, this.getSaveToWatchLater});

  WatchLaterModel.fromJson(Map<String, dynamic> json) {
    status = json['status'];
    message = json['message'];
    if (json['getSaveToWatchLater'] != null) {
      getSaveToWatchLater = <GetSaveToWatchLater>[];
      json['getSaveToWatchLater'].forEach((v) {
        getSaveToWatchLater!.add(new GetSaveToWatchLater.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['status'] = this.status;
    data['message'] = this.message;
    if (this.getSaveToWatchLater != null) {
      data['getSaveToWatchLater'] = this.getSaveToWatchLater!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class GetSaveToWatchLater {
  String? id;
  String? userId;
  bool? isSubscribed;
  String? videoId;
  String? videoTitle;
  int? videoType;
  int? videoTime;
  String? videoUrl;
  String? videoImage;
  int? videoPrivacyType;
  String? channelName;
  int? subscriptionCost;
  int? videoUnlockCost;
  int? channelType;

  GetSaveToWatchLater(
      {this.id,
      this.userId,
      this.isSubscribed,
      this.videoId,
      this.videoTitle,
      this.videoType,
      this.videoTime,
      this.videoUrl,
      this.videoImage,
      this.videoPrivacyType,
      this.channelName,
      this.subscriptionCost,
      this.videoUnlockCost,
      this.channelType});

  GetSaveToWatchLater.fromJson(Map<String, dynamic> json) {
    id = json['_id'];
    userId = json['userId'];
    isSubscribed = json['isSubscribed'];
    videoId = json['videoId'];
    videoTitle = json['videoTitle'];
    videoType = json['videoType'];
    videoTime = json['videoTime'];
    videoUrl = json['videoUrl'];
    videoImage = json['videoImage'];
    videoPrivacyType = json['videoPrivacyType'];
    channelName = json['channelName'];
    subscriptionCost = json['subscriptionCost'];
    videoUnlockCost = json['videoUnlockCost'];
    channelType = json['channelType'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['_id'] = this.id;
    data['userId'] = this.userId;
    data['isSubscribed'] = this.isSubscribed;
    data['videoId'] = this.videoId;
    data['videoTitle'] = this.videoTitle;
    data['videoType'] = this.videoType;
    data['videoTime'] = this.videoTime;
    data['videoUrl'] = this.videoUrl;
    data['videoImage'] = this.videoImage;
    data['videoPrivacyType'] = this.videoPrivacyType;
    data['channelName'] = this.channelName;
    data['subscriptionCost'] = this.subscriptionCost;
    data['videoUnlockCost'] = this.videoUnlockCost;
    data['channelType'] = this.channelType;
    return data;
  }
}
