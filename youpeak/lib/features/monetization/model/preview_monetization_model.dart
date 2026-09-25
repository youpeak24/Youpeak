import 'dart:convert';

PreviewMonetizationModel previewMonetizationModelFromJson(String str) => PreviewMonetizationModel.fromJson(json.decode(str));
String previewMonetizationModelToJson(PreviewMonetizationModel data) => json.encode(data.toJson());

class PreviewMonetizationModel {
  PreviewMonetizationModel({
    bool? status,
    String? message,
    MonetizationOfChannel? monetizationOfChannel,
  }) {
    _status = status;
    _message = message;
    _monetizationOfChannel = monetizationOfChannel;
  }

  PreviewMonetizationModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _monetizationOfChannel = json['monetizationOfChannel'] != null ? MonetizationOfChannel.fromJson(json['monetizationOfChannel']) : null;
  }
  bool? _status;
  String? _message;
  MonetizationOfChannel? _monetizationOfChannel;
  PreviewMonetizationModel copyWith({
    bool? status,
    String? message,
    MonetizationOfChannel? monetizationOfChannel,
  }) =>
      PreviewMonetizationModel(
        status: status ?? _status,
        message: message ?? _message,
        monetizationOfChannel: monetizationOfChannel ?? _monetizationOfChannel,
      );
  bool? get status => _status;
  String? get message => _message;
  MonetizationOfChannel? get monetizationOfChannel => _monetizationOfChannel;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_monetizationOfChannel != null) {
      map['monetizationOfChannel'] = _monetizationOfChannel?.toJson();
    }
    return map;
  }
}

MonetizationOfChannel monetizationOfChannelFromJson(String str) => MonetizationOfChannel.fromJson(json.decode(str));
String monetizationOfChannelToJson(MonetizationOfChannel data) => json.encode(data.toJson());

class MonetizationOfChannel {
  MonetizationOfChannel({
    Channel? channel,
    int? totalSubscribers,
    int? dateWiseotalSubscribers,
    int? totalViewsOfthatChannelVideos,
    num? totalWatchTime,
  }) {
    _channel = channel;
    _totalSubscribers = totalSubscribers;
    _dateWiseotalSubscribers = dateWiseotalSubscribers;
    _totalViewsOfthatChannelVideos = totalViewsOfthatChannelVideos;
    _totalWatchTime = totalWatchTime;
  }

  MonetizationOfChannel.fromJson(dynamic json) {
    _channel = json['channel'] != null ? Channel.fromJson(json['channel']) : null;
    _totalSubscribers = json['totalSubscribers'];
    _dateWiseotalSubscribers = json['dateWiseotalSubscribers'];
    _totalViewsOfthatChannelVideos = json['totalViewsOfthatChannelVideos'];
    _totalWatchTime = json['totalWatchTime'];
  }
  Channel? _channel;
  int? _totalSubscribers;
  int? _dateWiseotalSubscribers;
  int? _totalViewsOfthatChannelVideos;
  num? _totalWatchTime;
  MonetizationOfChannel copyWith({
    Channel? channel,
    int? totalSubscribers,
    int? dateWiseotalSubscribers,
    int? totalViewsOfthatChannelVideos,
    num? totalWatchTime,
  }) =>
      MonetizationOfChannel(
        channel: channel ?? _channel,
        totalSubscribers: totalSubscribers ?? _totalSubscribers,
        dateWiseotalSubscribers: dateWiseotalSubscribers ?? _dateWiseotalSubscribers,
        totalViewsOfthatChannelVideos: totalViewsOfthatChannelVideos ?? _totalViewsOfthatChannelVideos,
        totalWatchTime: totalWatchTime ?? _totalWatchTime,
      );
  Channel? get channel => _channel;
  int? get totalSubscribers => _totalSubscribers;
  int? get dateWiseotalSubscribers => _dateWiseotalSubscribers;
  int? get totalViewsOfthatChannelVideos => _totalViewsOfthatChannelVideos;
  num? get totalWatchTime => _totalWatchTime;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (_channel != null) {
      map['channel'] = _channel?.toJson();
    }
    map['totalSubscribers'] = _totalSubscribers;
    map['dateWiseotalSubscribers'] = _dateWiseotalSubscribers;
    map['totalViewsOfthatChannelVideos'] = _totalViewsOfthatChannelVideos;
    map['totalWatchTime'] = _totalWatchTime;
    return map;
  }
}

Channel channelFromJson(String str) => Channel.fromJson(json.decode(str));
String channelToJson(Channel data) => json.encode(data.toJson());

class Channel {
  Channel({
    String? id,
    String? fullName,
    String? image,
    String? channelId,
    num? totalWithdrawableAmount,
  }) {
    _id = id;
    _fullName = fullName;
    _image = image;
    _channelId = channelId;
    _totalWithdrawableAmount = totalWithdrawableAmount;
  }

  Channel.fromJson(dynamic json) {
    _id = json['_id'];
    _fullName = json['fullName'];
    _image = json['image'];
    _channelId = json['channelId'];
    _totalWithdrawableAmount = json['totalWithdrawableAmount'];
  }
  String? _id;
  String? _fullName;
  String? _image;
  String? _channelId;
  num? _totalWithdrawableAmount;
  Channel copyWith({
    String? id,
    String? fullName,
    String? image,
    String? channelId,
    num? totalWithdrawableAmount,
  }) =>
      Channel(
        id: id ?? _id,
        fullName: fullName ?? _fullName,
        image: image ?? _image,
        channelId: channelId ?? _channelId,
        totalWithdrawableAmount: totalWithdrawableAmount ?? _totalWithdrawableAmount,
      );
  String? get id => _id;
  String? get fullName => _fullName;
  String? get image => _image;
  String? get channelId => _channelId;
  num? get totalWithdrawableAmount => _totalWithdrawableAmount;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['_id'] = _id;
    map['fullName'] = _fullName;
    map['image'] = _image;
    map['channelId'] = _channelId;
    map['totalWithdrawableAmount'] = _totalWithdrawableAmount;
    return map;
  }
}
