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

  // Numbers may arrive as text and ids as numbers (older records); a single
  // odd field must not make the whole page unreadable.
  static int? _int(dynamic v) => v == null ? null : (v is num ? v.toInt() : int.tryParse("$v") ?? double.tryParse("$v")?.toInt());
  static num? _num(dynamic v) => v == null ? null : (v is num ? v : num.tryParse("$v"));
  static String? _str(dynamic v) => v == null ? null : "$v";

  DetailsOfVideo.fromJson(Map<String, dynamic> json) {
    id = _str(json['_id']);
    hashTag = (json['hashTag'] is List) ? (json['hashTag'] as List).map((e) => "$e").where((e) => e.trim().isNotEmpty).toList() : <String>[];
    shareCount = _int(json['shareCount']);
    like = _int(json['like']);
    dislike = _int(json['dislike']);
    channelId = _str(json['channelId']);
    title = _str(json['title']);
    description = _str(json['description']);
    videoType = _int(json['videoType']);
    videoTime = _int(json['videoTime']);
    videoUrl = _str(json['videoUrl']);
    videoImage = _str(json['videoImage']);
    commentType = _int(json['commentType']);
    videoPrivacyType = _int(json['videoPrivacyType']);
    userId = _str(json['userId']);
    createdAt = _str(json['createdAt']);
    channelType = _int(json['channelType']);
    subscriptionCost = _num(json['subscriptionCost']);
    videoUnlockCost = _num(json['videoUnlockCost']);
    channelName = _str(json['channelName']);
    channelImage = _str(json['channelImage']);
    totalComments = _int(json['totalComments']);
    totalSubscribers = _int(json['totalSubscribers']);
    views = _int(json['views']);
    isSubscribed = json['isSubscribed'] == true;
    isSaveToWatchLater = json['isSaveToWatchLater'] == true;
    isLike = json['isLike'] == true;
    isDislike = json['isDislike'] == true;
    time = _str(json['time']);
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
