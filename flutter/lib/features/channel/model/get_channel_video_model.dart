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

  // Owner-only status (sent on your own channel): who can see it and when.
  int? visibilityType; // 1 public · 2 private · 3 unlisted
  int? scheduleType; // 1 scheduled · 2 published
  String? scheduleTime;
  String? moderationStatus;

  /// Short label for "Your videos", or null when it's simply public and free.
  String? get statusLabel {
    if (moderationStatus == "pending_review") return "Under review";
    if (moderationStatus == "rejected") return "Removed";
    if (scheduleType == 1) {
      final at = DateTime.tryParse(scheduleTime ?? "")?.toLocal();
      return at == null ? "Scheduled" : "Scheduled · ${at.day}/${at.month} ${at.hour.toString().padLeft(2, "0")}:${at.minute.toString().padLeft(2, "0")}";
    }
    if (visibilityType == 2) return "Private";
    if (visibilityType == 3) return "Unlisted";
    if (videoPrivacyType == 2) return "Paid";
    return null;
  }

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
    // Numbers may arrive as text (older records): one odd field must not
    // make the whole list unreadable.
    int? asInt(dynamic v) => v == null ? null : (v is num ? v.toInt() : int.tryParse("$v") ?? double.tryParse("$v")?.toInt());
    String? asStr(dynamic v) => v?.toString();
    id = asStr(json['_id']);
    channelId = asStr(json['channelId']);
    title = asStr(json['title']);
    videoType = asInt(json['videoType']);
    videoTime = asInt(json['videoTime']);
    videoUrl = asStr(json['videoUrl']);
    videoImage = asStr(json['videoImage']);
    videoPrivacyType = asInt(json['videoPrivacyType']);
    createdAt = asStr(json['createdAt']);
    channelType = asInt(json['channelType']);
    subscriptionCost = asInt(json['subscriptionCost']);
    videoUnlockCost = asInt(json['videoUnlockCost']);
    views = asInt(json['views']);
    isSubscribed = json['isSubscribed'] == true;
    time = asStr(json['time']);
    visibilityType = asInt(json['visibilityType']);
    scheduleType = asInt(json['scheduleType']);
    scheduleTime = asStr(json['scheduleTime']);
    moderationStatus = asStr(json['moderationStatus']);
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
