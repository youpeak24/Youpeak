import 'dart:convert';

ChannelAboutModel channelAboutModelFromJson(String str) => ChannelAboutModel.fromJson(json.decode(str));
String channelAboutModelToJson(ChannelAboutModel data) => json.encode(data.toJson());

class ChannelAboutModel {
  ChannelAboutModel({
    bool? status,
    String? message,
    AboutOfChannel? aboutOfChannel,
  }) {
    _status = status;
    _message = message;
    _aboutOfChannel = aboutOfChannel;
  }

  ChannelAboutModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _aboutOfChannel = json['aboutOfChannel'] != null ? AboutOfChannel.fromJson(json['aboutOfChannel']) : null;
  }
  bool? _status;
  String? _message;
  AboutOfChannel? _aboutOfChannel;
  ChannelAboutModel copyWith({
    bool? status,
    String? message,
    AboutOfChannel? aboutOfChannel,
  }) =>
      ChannelAboutModel(
        status: status ?? _status,
        message: message ?? _message,
        aboutOfChannel: aboutOfChannel ?? _aboutOfChannel,
      );
  bool? get status => _status;
  String? get message => _message;
  AboutOfChannel? get aboutOfChannel => _aboutOfChannel;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_aboutOfChannel != null) {
      map['aboutOfChannel'] = _aboutOfChannel?.toJson();
    }
    return map;
  }
}

AboutOfChannel aboutOfChannelFromJson(String str) => AboutOfChannel.fromJson(json.decode(str));
String aboutOfChannelToJson(AboutOfChannel data) => json.encode(data.toJson());

class AboutOfChannel {
  AboutOfChannel({
    Channel? channel,
    int? totalViewsOfthatChannelVideos,
  }) {
    _channel = channel;
    _totalViewsOfthatChannelVideos = totalViewsOfthatChannelVideos;
  }

  AboutOfChannel.fromJson(dynamic json) {
    _channel = json['channel'] != null ? Channel.fromJson(json['channel']) : null;
    _totalViewsOfthatChannelVideos = json['totalViewsOfthatChannelVideos'];
  }
  Channel? _channel;
  int? _totalViewsOfthatChannelVideos;
  AboutOfChannel copyWith({
    Channel? channel,
    int? totalViewsOfthatChannelVideos,
  }) =>
      AboutOfChannel(
        channel: channel ?? _channel,
        totalViewsOfthatChannelVideos: totalViewsOfthatChannelVideos ?? _totalViewsOfthatChannelVideos,
      );
  Channel? get channel => _channel;
  int? get totalViewsOfthatChannelVideos => _totalViewsOfthatChannelVideos;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (_channel != null) {
      map['channel'] = _channel?.toJson();
    }
    map['totalViewsOfthatChannelVideos'] = _totalViewsOfthatChannelVideos;
    return map;
  }
}

Channel channelFromJson(String str) => Channel.fromJson(json.decode(str));
String channelToJson(Channel data) => json.encode(data.toJson());

class Channel {
  Channel({
    SocialMediaLinks? socialMediaLinks,
    String? id,
    String? fullName,
    String? country,
    String? channelId,
    dynamic descriptionOfChannel,
    String? date,
  }) {
    _socialMediaLinks = socialMediaLinks;
    _id = id;
    _fullName = fullName;
    _country = country;
    _channelId = channelId;
    _descriptionOfChannel = descriptionOfChannel;
    _date = date;
  }

  Channel.fromJson(dynamic json) {
    _socialMediaLinks = json['socialMediaLinks'] != null ? SocialMediaLinks.fromJson(json['socialMediaLinks']) : null;
    _id = json['_id'];
    _fullName = json['fullName'];
    _country = json['country'];
    _channelId = json['channelId'];
    _descriptionOfChannel = json['descriptionOfChannel'];
    _date = json['date'];
  }
  SocialMediaLinks? _socialMediaLinks;
  String? _id;
  String? _fullName;
  String? _country;
  String? _channelId;
  dynamic _descriptionOfChannel;
  String? _date;
  Channel copyWith({
    SocialMediaLinks? socialMediaLinks,
    String? id,
    String? fullName,
    String? country,
    String? channelId,
    dynamic descriptionOfChannel,
    String? date,
  }) =>
      Channel(
        socialMediaLinks: socialMediaLinks ?? _socialMediaLinks,
        id: id ?? _id,
        fullName: fullName ?? _fullName,
        country: country ?? _country,
        channelId: channelId ?? _channelId,
        descriptionOfChannel: descriptionOfChannel ?? _descriptionOfChannel,
        date: date ?? _date,
      );
  SocialMediaLinks? get socialMediaLinks => _socialMediaLinks;
  String? get id => _id;
  String? get fullName => _fullName;
  String? get country => _country;
  String? get channelId => _channelId;
  dynamic get descriptionOfChannel => _descriptionOfChannel;
  String? get date => _date;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (_socialMediaLinks != null) {
      map['socialMediaLinks'] = _socialMediaLinks?.toJson();
    }
    map['_id'] = _id;
    map['fullName'] = _fullName;
    map['country'] = _country;
    map['channelId'] = _channelId;
    map['descriptionOfChannel'] = _descriptionOfChannel;
    map['date'] = _date;
    return map;
  }
}

SocialMediaLinks socialMediaLinksFromJson(String str) => SocialMediaLinks.fromJson(json.decode(str));
String socialMediaLinksToJson(SocialMediaLinks data) => json.encode(data.toJson());

class SocialMediaLinks {
  SocialMediaLinks({
    String? facebookLink,
    String? instagramLink,
    String? twitterLink,
    String? websiteLink,
  }) {
    _facebookLink = facebookLink;
    _instagramLink = instagramLink;
    _twitterLink = twitterLink;
    _websiteLink = websiteLink;
  }

  SocialMediaLinks.fromJson(dynamic json) {
    _facebookLink = json['facebookLink'];
    _instagramLink = json['instagramLink'];
    _twitterLink = json['twitterLink'];
    _websiteLink = json['websiteLink'];
  }
  String? _facebookLink;
  String? _instagramLink;
  String? _twitterLink;
  String? _websiteLink;
  SocialMediaLinks copyWith({
    String? facebookLink,
    String? instagramLink,
    String? twitterLink,
    String? websiteLink,
  }) =>
      SocialMediaLinks(
        facebookLink: facebookLink ?? _facebookLink,
        instagramLink: instagramLink ?? _instagramLink,
        twitterLink: twitterLink ?? _twitterLink,
        websiteLink: websiteLink ?? _websiteLink,
      );
  String? get facebookLink => _facebookLink;
  String? get instagramLink => _instagramLink;
  String? get twitterLink => _twitterLink;
  String? get websiteLink => _websiteLink;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['facebookLink'] = _facebookLink;
    map['instagramLink'] = _instagramLink;
    map['twitterLink'] = _twitterLink;
    map['websiteLink'] = _websiteLink;
    return map;
  }
}
