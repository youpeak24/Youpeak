import 'dart:convert';

GetSubscribedChannelModel getSubscribedChannelModelFromJson(String str) =>
    GetSubscribedChannelModel.fromJson(json.decode(str));
String getSubscribedChannelModelToJson(GetSubscribedChannelModel data) => json.encode(data.toJson());

class GetSubscribedChannelModel {
  GetSubscribedChannelModel({
    bool? status,
    String? message,
    int? totalSubscribedChannel,
    List<SubscribedChannel>? subscribedChannel,
  }) {
    _status = status;
    _message = message;
    _totalSubscribedChannel = totalSubscribedChannel;
    _subscribedChannel = subscribedChannel;
  }

  GetSubscribedChannelModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _totalSubscribedChannel = json['totalSubscribedChannel'];
    if (json['subscribedChannel'] != null) {
      _subscribedChannel = [];
      json['subscribedChannel'].forEach((v) {
        _subscribedChannel?.add(SubscribedChannel.fromJson(v));
      });
    }
  }
  bool? _status;
  String? _message;
  int? _totalSubscribedChannel;
  List<SubscribedChannel>? _subscribedChannel;
  GetSubscribedChannelModel copyWith({
    bool? status,
    String? message,
    int? totalSubscribedChannel,
    List<SubscribedChannel>? subscribedChannel,
  }) =>
      GetSubscribedChannelModel(
        status: status ?? _status,
        message: message ?? _message,
        totalSubscribedChannel: totalSubscribedChannel ?? _totalSubscribedChannel,
        subscribedChannel: subscribedChannel ?? _subscribedChannel,
      );
  bool? get status => _status;
  String? get message => _message;
  int? get totalSubscribedChannel => _totalSubscribedChannel;
  List<SubscribedChannel>? get subscribedChannel => _subscribedChannel;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    map['totalSubscribedChannel'] = _totalSubscribedChannel;
    if (_subscribedChannel != null) {
      map['subscribedChannel'] = _subscribedChannel?.map((v) => v.toJson()).toList();
    }
    return map;
  }
}

SubscribedChannel subscribedChannelFromJson(String str) => SubscribedChannel.fromJson(json.decode(str));
String subscribedChannelToJson(SubscribedChannel data) => json.encode(data.toJson());

class SubscribedChannel {
  SubscribedChannel({
    String? channelId,
    String? channelName,
    String? channelImage,
  }) {
    _channelId = channelId;
    _channelName = channelName;
    _channelImage = channelImage;
  }

  SubscribedChannel.fromJson(dynamic json) {
    _channelId = json['channelId'];
    _channelName = json['channelName'];
    _channelImage = json['channelImage'];
  }
  String? _channelId;
  String? _channelName;
  String? _channelImage;
  SubscribedChannel copyWith({
    String? channelId,
    String? channelName,
    String? channelImage,
  }) =>
      SubscribedChannel(
        channelId: channelId ?? _channelId,
        channelName: channelName ?? _channelName,
        channelImage: channelImage ?? _channelImage,
      );
  String? get channelId => _channelId;
  String? get channelName => _channelName;
  String? get channelImage => _channelImage;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['channelId'] = _channelId;
    map['channelName'] = _channelName;
    map['channelImage'] = _channelImage;
    return map;
  }
}
