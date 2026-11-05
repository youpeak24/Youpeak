class FetchPublicLiveModel {
  bool? status;
  String? message;
  List<LiveData>? data;

  FetchPublicLiveModel({this.status, this.message, this.data});

  FetchPublicLiveModel.fromJson(Map<String, dynamic> json) {
    status = json['status'];
    message = json['message'];
    if (json['data'] != null) {
      data = <LiveData>[];
      json['data'].forEach((v) {
        data!.add(new LiveData.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['status'] = this.status;
    data['message'] = this.message;
    if (this.data != null) {
      data['data'] = this.data!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class LiveData {
  String? sId;
  String? fullName;
  String? nickName;
  String? image;
  String? channelId;
  bool? isLive;
  String? thumbnail;
  String? title;
  String? liveHistoryId;
  int? view;

  LiveData({this.sId, this.fullName, this.nickName, this.image, this.channelId, this.isLive, this.thumbnail, this.title, this.liveHistoryId, this.view});

  LiveData.fromJson(Map<String, dynamic> json) {
    sId = json['_id'];
    fullName = json['fullName'];
    nickName = json['nickName'];
    image = json['image'];
    channelId = json['channelId'];
    isLive = json['isLive'];
    thumbnail = json['thumbnail'];
    title = json['title'];
    liveHistoryId = json['liveHistoryId'];
    view = json['view'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['_id'] = this.sId;
    data['fullName'] = this.fullName;
    data['nickName'] = this.nickName;
    data['image'] = this.image;
    data['channelId'] = this.channelId;
    data['isLive'] = this.isLive;
    data['thumbnail'] = this.thumbnail;
    data['title'] = this.title;
    data['liveHistoryId'] = this.liveHistoryId;
    data['view'] = this.view;
    return data;
  }
}
