// The channel response is built by the server from a user profile, so older
// profiles can carry numbers as strings or leave fields out. Read leniently
// and fall back to safe defaults: the pages dereference these fields.
int? _asInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? double.tryParse(value)?.toInt();
  return null;
}

bool? _asBool(dynamic value) => value is bool ? value : (value is String ? value == "true" : null);

String? _asString(dynamic value) => value == null ? null : value.toString();

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
    status = _asBool(json['status']);
    message = _asString(json['message']);
    totalVideosOfChannel = _asInt(json['totalVideosOfChannel']) ?? 0;
    totalSubscribers = _asInt(json['totalSubscribers']) ?? 0;
    isSubscribed = _asBool(json['isSubscribed']) ?? false;
    channelName = _asString(json['channelName']) ?? "";
    channelImage = _asString(json['channelImage']) ?? "";
    channelType = _asInt(json['channelType']) ?? 1;
    subscriptionCost = _asInt(json['subscriptionCost']) ?? 0;
    videoUnlockCost = _asInt(json['videoUnlockCost']) ?? 0;
    final details = json['detailsOfChannel'];
    if (details is List) {
      detailsOfChannel = <DetailsOfChannel>[];
      for (final v in details) {
        if (v is Map<String, dynamic>) detailsOfChannel!.add(DetailsOfChannel.fromJson(v));
      }
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
    id = _asString(json['_id']) ?? "";
    channelId = _asString(json['channelId']) ?? "";
    title = _asString(json['title']) ?? "";
    videoType = _asInt(json['videoType']) ?? 1;
    videoTime = _asInt(json['videoTime']) ?? 0;
    videoUrl = _asString(json['videoUrl']) ?? "";
    videoImage = _asString(json['videoImage']) ?? "";
    videoPrivacyType = _asInt(json['videoPrivacyType']) ?? 1;
    createdAt = _asString(json['createdAt']);
    channelType = _asInt(json['channelType']) ?? 1;
    subscriptionCost = _asInt(json['subscriptionCost']) ?? 0;
    videoUnlockCost = _asInt(json['videoUnlockCost']) ?? 0;
    views = _asInt(json['views']) ?? 0;
    isSubscribed = _asBool(json['isSubscribed']) ?? false;
    isSaveToWatchLater = _asBool(json['isSaveToWatchLater']) ?? false;
    time = _asString(json['time']);
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
