import 'dart:convert';

VideoEngagementRewardModel videoEngagementRewardModelFromJson(String str) => VideoEngagementRewardModel.fromJson(json.decode(str));
String videoEngagementRewardModelToJson(VideoEngagementRewardModel data) => json.encode(data.toJson());

class VideoEngagementRewardModel {
  VideoEngagementRewardModel({
    bool? status,
    String? message,
    Data? data,
  }) {
    _status = status;
    _message = message;
    _data = data;
  }

  VideoEngagementRewardModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _data = json['data'] != null ? Data.fromJson(json['data']) : null;
  }
  bool? _status;
  String? _message;
  Data? _data;
  VideoEngagementRewardModel copyWith({
    bool? status,
    String? message,
    Data? data,
  }) =>
      VideoEngagementRewardModel(
        status: status ?? _status,
        message: message ?? _message,
        data: data ?? _data,
      );
  bool? get status => _status;
  String? get message => _message;
  Data? get data => _data;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_data != null) {
      map['data'] = _data?.toJson();
    }
    return map;
  }
}

Data dataFromJson(String str) => Data.fromJson(json.decode(str));
String dataToJson(Data data) => json.encode(data.toJson());

class Data {
  Data({
    SocialMediaLinks? socialMediaLinks,
    Plan? plan,
    WatchAds? watchAds,
    bool? isReferral,
    int? referralCount,
    String? id,
    String? fullName,
    String? nickName,
    String? email,
    String? gender,
    int? age,
    String? mobileNumber,
    String? image,
    String? country,
    String? ipAddress,
    String? channelId,
    String? descriptionOfChannel,
    bool? isChannel,
    String? password,
    String? uniqueId,
    String? identity,
    String? fcmToken,
    String? date,
    bool? isPremiumPlan,
    bool? isAddByAdmin,
    bool? isActive,
    bool? isBlock,
    bool? isVerified,
    String? isLive,
    dynamic channel,
    String? liveHistoryId,
    bool? isMonetization,
    int? totalWatchTime,
    int? totalCurrentWatchTime,
    int? totalWithdrawableAmount,
    int? loginType,
    String? createdAt,
    String? updatedAt,
    int? coin,
    int? totalEarningAmount,
  }) {
    _socialMediaLinks = socialMediaLinks;
    _plan = plan;
    _watchAds = watchAds;
    _isReferral = isReferral;
    _referralCount = referralCount;
    _id = id;
    _fullName = fullName;
    _nickName = nickName;
    _email = email;
    _gender = gender;
    _age = age;
    _mobileNumber = mobileNumber;
    _image = image;
    _country = country;
    _ipAddress = ipAddress;
    _channelId = channelId;
    _descriptionOfChannel = descriptionOfChannel;
    _isChannel = isChannel;
    _password = password;
    _uniqueId = uniqueId;
    _identity = identity;
    _fcmToken = fcmToken;
    _date = date;
    _isPremiumPlan = isPremiumPlan;
    _isAddByAdmin = isAddByAdmin;
    _isActive = isActive;
    _isBlock = isBlock;
    _isVerified = isVerified;
    _isLive = isLive;
    _channel = channel;
    _liveHistoryId = liveHistoryId;
    _isMonetization = isMonetization;
    _totalWatchTime = totalWatchTime;
    _totalCurrentWatchTime = totalCurrentWatchTime;
    _totalWithdrawableAmount = totalWithdrawableAmount;
    _loginType = loginType;
    _createdAt = createdAt;
    _updatedAt = updatedAt;
    _coin = coin;
    _totalEarningAmount = totalEarningAmount;
  }

  Data.fromJson(dynamic json) {
    _socialMediaLinks = json['socialMediaLinks'] != null ? SocialMediaLinks.fromJson(json['socialMediaLinks']) : null;
    _plan = json['plan'] != null ? Plan.fromJson(json['plan']) : null;
    _watchAds = json['watchAds'] != null ? WatchAds.fromJson(json['watchAds']) : null;
    _isReferral = json['isReferral'];
    _referralCount = json['referralCount'];
    _id = json['_id'];
    _fullName = json['fullName'];
    _nickName = json['nickName'];
    _email = json['email'];
    _gender = json['gender'];
    _age = json['age'];
    _mobileNumber = json['mobileNumber'];
    _image = json['image'];
    _country = json['country'];
    _ipAddress = json['ipAddress'];
    _channelId = json['channelId'];
    _descriptionOfChannel = json['descriptionOfChannel'];
    _isChannel = json['isChannel'];
    _password = json['password'];
    _uniqueId = json['uniqueId'];
    _identity = json['identity'];
    _fcmToken = json['fcmToken'];
    _date = json['date'];
    _isPremiumPlan = json['isPremiumPlan'];
    _isAddByAdmin = json['isAddByAdmin'];
    _isActive = json['isActive'];
    _isBlock = json['isBlock'];
    _isVerified = json['isVerified'];
    _isLive = json['isLive'];
    _channel = json['channel'];
    _liveHistoryId = json['liveHistoryId'];
    _isMonetization = json['isMonetization'];
    _totalWatchTime = json['totalWatchTime'];
    _totalCurrentWatchTime = json['totalCurrentWatchTime'];
    _totalWithdrawableAmount = json['totalWithdrawableAmount'];
    _loginType = json['loginType'];
    _createdAt = json['createdAt'];
    _updatedAt = json['updatedAt'];
    _coin = json['coin'];
    _totalEarningAmount = json['totalEarningAmount'];
  }
  SocialMediaLinks? _socialMediaLinks;
  Plan? _plan;
  WatchAds? _watchAds;
  bool? _isReferral;
  int? _referralCount;
  String? _id;
  String? _fullName;
  String? _nickName;
  String? _email;
  String? _gender;
  int? _age;
  String? _mobileNumber;
  String? _image;
  String? _country;
  String? _ipAddress;
  String? _channelId;
  String? _descriptionOfChannel;
  bool? _isChannel;
  String? _password;
  String? _uniqueId;
  String? _identity;
  String? _fcmToken;
  String? _date;
  bool? _isPremiumPlan;
  bool? _isAddByAdmin;
  bool? _isActive;
  bool? _isBlock;
  bool? _isVerified;
  String? _isLive;
  dynamic _channel;
  String? _liveHistoryId;
  bool? _isMonetization;
  int? _totalWatchTime;
  int? _totalCurrentWatchTime;
  int? _totalWithdrawableAmount;
  int? _loginType;
  String? _createdAt;
  String? _updatedAt;
  int? _coin;
  int? _totalEarningAmount;
  Data copyWith({
    SocialMediaLinks? socialMediaLinks,
    Plan? plan,
    WatchAds? watchAds,
    bool? isReferral,
    int? referralCount,
    String? id,
    String? fullName,
    String? nickName,
    String? email,
    String? gender,
    int? age,
    String? mobileNumber,
    String? image,
    String? country,
    String? ipAddress,
    String? channelId,
    String? descriptionOfChannel,
    bool? isChannel,
    String? password,
    String? uniqueId,
    String? identity,
    String? fcmToken,
    String? date,
    bool? isPremiumPlan,
    bool? isAddByAdmin,
    bool? isActive,
    bool? isBlock,
    bool? isVerified,
    String? isLive,
    dynamic channel,
    String? liveHistoryId,
    bool? isMonetization,
    int? totalWatchTime,
    int? totalCurrentWatchTime,
    int? totalWithdrawableAmount,
    int? loginType,
    String? createdAt,
    String? updatedAt,
    int? coin,
    int? totalEarningAmount,
  }) =>
      Data(
        socialMediaLinks: socialMediaLinks ?? _socialMediaLinks,
        plan: plan ?? _plan,
        watchAds: watchAds ?? _watchAds,
        isReferral: isReferral ?? _isReferral,
        referralCount: referralCount ?? _referralCount,
        id: id ?? _id,
        fullName: fullName ?? _fullName,
        nickName: nickName ?? _nickName,
        email: email ?? _email,
        gender: gender ?? _gender,
        age: age ?? _age,
        mobileNumber: mobileNumber ?? _mobileNumber,
        image: image ?? _image,
        country: country ?? _country,
        ipAddress: ipAddress ?? _ipAddress,
        channelId: channelId ?? _channelId,
        descriptionOfChannel: descriptionOfChannel ?? _descriptionOfChannel,
        isChannel: isChannel ?? _isChannel,
        password: password ?? _password,
        uniqueId: uniqueId ?? _uniqueId,
        identity: identity ?? _identity,
        fcmToken: fcmToken ?? _fcmToken,
        date: date ?? _date,
        isPremiumPlan: isPremiumPlan ?? _isPremiumPlan,
        isAddByAdmin: isAddByAdmin ?? _isAddByAdmin,
        isActive: isActive ?? _isActive,
        isBlock: isBlock ?? _isBlock,
        isVerified: isVerified ?? _isVerified,
        isLive: isLive ?? _isLive,
        channel: channel ?? _channel,
        liveHistoryId: liveHistoryId ?? _liveHistoryId,
        isMonetization: isMonetization ?? _isMonetization,
        totalWatchTime: totalWatchTime ?? _totalWatchTime,
        totalCurrentWatchTime: totalCurrentWatchTime ?? _totalCurrentWatchTime,
        totalWithdrawableAmount: totalWithdrawableAmount ?? _totalWithdrawableAmount,
        loginType: loginType ?? _loginType,
        createdAt: createdAt ?? _createdAt,
        updatedAt: updatedAt ?? _updatedAt,
        coin: coin ?? _coin,
        totalEarningAmount: totalEarningAmount ?? _totalEarningAmount,
      );
  SocialMediaLinks? get socialMediaLinks => _socialMediaLinks;
  Plan? get plan => _plan;
  WatchAds? get watchAds => _watchAds;
  bool? get isReferral => _isReferral;
  int? get referralCount => _referralCount;
  String? get id => _id;
  String? get fullName => _fullName;
  String? get nickName => _nickName;
  String? get email => _email;
  String? get gender => _gender;
  int? get age => _age;
  String? get mobileNumber => _mobileNumber;
  String? get image => _image;
  String? get country => _country;
  String? get ipAddress => _ipAddress;
  String? get channelId => _channelId;
  String? get descriptionOfChannel => _descriptionOfChannel;
  bool? get isChannel => _isChannel;
  String? get password => _password;
  String? get uniqueId => _uniqueId;
  String? get identity => _identity;
  String? get fcmToken => _fcmToken;
  String? get date => _date;
  bool? get isPremiumPlan => _isPremiumPlan;
  bool? get isAddByAdmin => _isAddByAdmin;
  bool? get isActive => _isActive;
  bool? get isBlock => _isBlock;
  bool? get isVerified => _isVerified;
  String? get isLive => _isLive;
  dynamic get channel => _channel;
  String? get liveHistoryId => _liveHistoryId;
  bool? get isMonetization => _isMonetization;
  int? get totalWatchTime => _totalWatchTime;
  int? get totalCurrentWatchTime => _totalCurrentWatchTime;
  int? get totalWithdrawableAmount => _totalWithdrawableAmount;
  int? get loginType => _loginType;
  String? get createdAt => _createdAt;
  String? get updatedAt => _updatedAt;
  int? get coin => _coin;
  int? get totalEarningAmount => _totalEarningAmount;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (_socialMediaLinks != null) {
      map['socialMediaLinks'] = _socialMediaLinks?.toJson();
    }
    if (_plan != null) {
      map['plan'] = _plan?.toJson();
    }
    if (_watchAds != null) {
      map['watchAds'] = _watchAds?.toJson();
    }
    map['isReferral'] = _isReferral;
    map['referralCount'] = _referralCount;
    map['_id'] = _id;
    map['fullName'] = _fullName;
    map['nickName'] = _nickName;
    map['email'] = _email;
    map['gender'] = _gender;
    map['age'] = _age;
    map['mobileNumber'] = _mobileNumber;
    map['image'] = _image;
    map['country'] = _country;
    map['ipAddress'] = _ipAddress;
    map['channelId'] = _channelId;
    map['descriptionOfChannel'] = _descriptionOfChannel;
    map['isChannel'] = _isChannel;
    map['password'] = _password;
    map['uniqueId'] = _uniqueId;
    map['identity'] = _identity;
    map['fcmToken'] = _fcmToken;
    map['date'] = _date;
    map['isPremiumPlan'] = _isPremiumPlan;
    map['isAddByAdmin'] = _isAddByAdmin;
    map['isActive'] = _isActive;
    map['isBlock'] = _isBlock;
    map['isVerified'] = _isVerified;
    map['isLive'] = _isLive;
    map['channel'] = _channel;
    map['liveHistoryId'] = _liveHistoryId;
    map['isMonetization'] = _isMonetization;
    map['totalWatchTime'] = _totalWatchTime;
    map['totalCurrentWatchTime'] = _totalCurrentWatchTime;
    map['totalWithdrawableAmount'] = _totalWithdrawableAmount;
    map['loginType'] = _loginType;
    map['createdAt'] = _createdAt;
    map['updatedAt'] = _updatedAt;
    map['coin'] = _coin;
    map['totalEarningAmount'] = _totalEarningAmount;
    return map;
  }
}

WatchAds watchAdsFromJson(String str) => WatchAds.fromJson(json.decode(str));
String watchAdsToJson(WatchAds data) => json.encode(data.toJson());

class WatchAds {
  WatchAds({
    int? count,
    String? date,
  }) {
    _count = count;
    _date = date;
  }

  WatchAds.fromJson(dynamic json) {
    _count = json['count'];
    _date = json['date'];
  }
  int? _count;
  String? _date;
  WatchAds copyWith({
    int? count,
    String? date,
  }) =>
      WatchAds(
        count: count ?? _count,
        date: date ?? _date,
      );
  int? get count => _count;
  String? get date => _date;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['count'] = _count;
    map['date'] = _date;
    return map;
  }
}

Plan planFromJson(String str) => Plan.fromJson(json.decode(str));
String planToJson(Plan data) => json.encode(data.toJson());

class Plan {
  Plan({
    String? planStartDate,
    String? planEndDate,
    String? premiumPlanId,
  }) {
    _planStartDate = planStartDate;
    _planEndDate = planEndDate;
    _premiumPlanId = premiumPlanId;
  }

  Plan.fromJson(dynamic json) {
    _planStartDate = json['planStartDate'];
    _planEndDate = json['planEndDate'];
    _premiumPlanId = json['premiumPlanId'];
  }
  String? _planStartDate;
  String? _planEndDate;
  String? _premiumPlanId;
  Plan copyWith({
    String? planStartDate,
    String? planEndDate,
    String? premiumPlanId,
  }) =>
      Plan(
        planStartDate: planStartDate ?? _planStartDate,
        planEndDate: planEndDate ?? _planEndDate,
        premiumPlanId: premiumPlanId ?? _premiumPlanId,
      );
  String? get planStartDate => _planStartDate;
  String? get planEndDate => _planEndDate;
  String? get premiumPlanId => _premiumPlanId;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['planStartDate'] = _planStartDate;
    map['planEndDate'] = _planEndDate;
    map['premiumPlanId'] = _premiumPlanId;
    return map;
  }
}

SocialMediaLinks socialMediaLinksFromJson(String str) => SocialMediaLinks.fromJson(json.decode(str));
String socialMediaLinksToJson(SocialMediaLinks data) => json.encode(data.toJson());

class SocialMediaLinks {
  SocialMediaLinks({
    String? instagramLink,
    String? facebookLink,
    String? twitterLink,
    String? websiteLink,
  }) {
    _instagramLink = instagramLink;
    _facebookLink = facebookLink;
    _twitterLink = twitterLink;
    _websiteLink = websiteLink;
  }

  SocialMediaLinks.fromJson(dynamic json) {
    _instagramLink = json['instagramLink'];
    _facebookLink = json['facebookLink'];
    _twitterLink = json['twitterLink'];
    _websiteLink = json['websiteLink'];
  }
  String? _instagramLink;
  String? _facebookLink;
  String? _twitterLink;
  String? _websiteLink;
  SocialMediaLinks copyWith({
    String? instagramLink,
    String? facebookLink,
    String? twitterLink,
    String? websiteLink,
  }) =>
      SocialMediaLinks(
        instagramLink: instagramLink ?? _instagramLink,
        facebookLink: facebookLink ?? _facebookLink,
        twitterLink: twitterLink ?? _twitterLink,
        websiteLink: websiteLink ?? _websiteLink,
      );
  String? get instagramLink => _instagramLink;
  String? get facebookLink => _facebookLink;
  String? get twitterLink => _twitterLink;
  String? get websiteLink => _websiteLink;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['instagramLink'] = _instagramLink;
    map['facebookLink'] = _facebookLink;
    map['twitterLink'] = _twitterLink;
    map['websiteLink'] = _websiteLink;
    return map;
  }
}
