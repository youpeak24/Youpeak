import 'dart:convert';

GetProfileModel getProfileModelFromJson(String str) => GetProfileModel.fromJson(json.decode(str));
String getProfileModelToJson(GetProfileModel data) => json.encode(data.toJson());

class GetProfileModel {
  GetProfileModel({
    bool? status,
    String? message,
    User? user,
  }) {
    _status = status;
    _message = message;
    _user = user;
  }

  GetProfileModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _user = json['user'] != null ? User.fromJson(json['user']) : null;
  }
  bool? _status;
  String? _message;
  User? _user;
  GetProfileModel copyWith({
    bool? status,
    String? message,
    User? user,
  }) =>
      GetProfileModel(
        status: status ?? _status,
        message: message ?? _message,
        user: user ?? _user,
      );
  bool? get status => _status;
  String? get message => _message;
  User? get user => _user;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_user != null) {
      map['user'] = _user?.toJson();
    }
    return map;
  }
}

User userFromJson(String str) => User.fromJson(json.decode(str));
String userToJson(User data) => json.encode(data.toJson());

class User {
  User({
    SocialMediaLinks? socialMediaLinks,
    Plan? plan,
    WatchAds? watchAds,
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
    int? channelType,
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
    bool? isLive,
    String? channel,
    String? liveHistoryId,
    bool? isReferral,
    int? referralCount,
    num? coin,
    num? purchasedCoin,
    num? subscriptionCost,
    num? videoUnlockCost,
    bool? isMonetization,
    num? totalWatchTime,
    num? totalCurrentWatchTime,
    num? totalWithdrawableAmount,
    num? totalEarningAmount,
    List<Coinplan>? coinplan,
    String? referralCode,
    int? loginType,
    String? createdAt,
    String? updatedAt,
  }) {
    _socialMediaLinks = socialMediaLinks;
    _plan = plan;
    _watchAds = watchAds;
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
    _channelType = channelType;
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
    _isReferral = isReferral;
    _referralCount = referralCount;
    _coin = coin;
    _purchasedCoin = purchasedCoin;
    _subscriptionCost = subscriptionCost;
    _videoUnlockCost = videoUnlockCost;
    _isMonetization = isMonetization;
    _totalWatchTime = totalWatchTime;
    _totalCurrentWatchTime = totalCurrentWatchTime;
    _totalWithdrawableAmount = totalWithdrawableAmount;
    _totalEarningAmount = totalEarningAmount;
    _coinplan = coinplan;
    _referralCode = referralCode;
    _loginType = loginType;
    _createdAt = createdAt;
    _updatedAt = updatedAt;
  }

  User.fromJson(dynamic json) {
    _socialMediaLinks = json['socialMediaLinks'] != null ? SocialMediaLinks.fromJson(json['socialMediaLinks']) : null;
    _plan = json['plan'] != null ? Plan.fromJson(json['plan']) : null;
    _watchAds = json['watchAds'] != null ? WatchAds.fromJson(json['watchAds']) : null;
    _id = json['_id'] ?? json['id'];
    _fullName = json['fullName'];
    _nickName = json['nickName'];
    _email = json['email'];
    _gender = json['gender'];
    // age / channelType can come back as a String (older saves stored the
    // raw form-field text) or a num — accept either instead of crashing.
    _age = json['age'] is num ? (json['age'] as num).toInt() : int.tryParse('${json['age'] ?? ''}');
    _mobileNumber = json['mobileNumber'];
    _image = json['image'];
    _country = json['country'];
    _ipAddress = json['ipAddress'];
    _channelType = json['channelType'] is num ? (json['channelType'] as num).toInt() : int.tryParse('${json['channelType'] ?? ''}');
    _channelId = json['channelId'];
    _descriptionOfChannel = json['descriptionOfChannel'];
    _isChannel = json['isChannel'];
    _password = json['password'];
    // uniqueId is a numeric id server-side; the model stores it as a string.
    _uniqueId = json['uniqueId']?.toString();
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
    _isReferral = json['isReferral'];
    _referralCount = json['referralCount'];
    _coin = json['coin'];
    _purchasedCoin = json['purchasedCoin'];
    // Prices were saved as the raw form text by the old channel update, so a
    // String "10" must not fail the whole profile (and with it, sign-in).
    _subscriptionCost = json['subscriptionCost'] is num ? json['subscriptionCost'] as num : num.tryParse('${json['subscriptionCost'] ?? ''}');
    _videoUnlockCost = json['videoUnlockCost'] is num ? json['videoUnlockCost'] as num : num.tryParse('${json['videoUnlockCost'] ?? ''}');
    _isMonetization = json['isMonetization'];
    _totalWatchTime = json['totalWatchTime'];
    _totalCurrentWatchTime = json['totalCurrentWatchTime'];
    _totalWithdrawableAmount = json['totalWithdrawableAmount'];
    _totalEarningAmount = json['totalEarningAmount'];
    if (json['coinplan'] != null) {
      _coinplan = [];
      json['coinplan'].forEach((v) {
        _coinplan?.add(Coinplan.fromJson(v));
      });
    }
    _referralCode = json['referralCode'];
    _loginType = json['loginType'];
    _createdAt = json['createdAt'];
    _updatedAt = json['updatedAt'];
  }
  SocialMediaLinks? _socialMediaLinks;
  Plan? _plan;
  WatchAds? _watchAds;
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
  int? _channelType;
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
  bool? _isLive;
  String? _channel;
  String? _liveHistoryId;
  bool? _isReferral;
  int? _referralCount;
  num? _coin;
  num? _purchasedCoin;
  num? _subscriptionCost;
  num? _videoUnlockCost;
  bool? _isMonetization;
  num? _totalWatchTime;
  num? _totalCurrentWatchTime;
  num? _totalWithdrawableAmount;
  num? _totalEarningAmount;
  List<Coinplan>? _coinplan;
  String? _referralCode;
  int? _loginType;
  String? _createdAt;
  String? _updatedAt;
  User copyWith({
    SocialMediaLinks? socialMediaLinks,
    Plan? plan,
    WatchAds? watchAds,
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
    int? channelType,
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
    bool? isLive,
    String? channel,
    String? liveHistoryId,
    bool? isReferral,
    int? referralCount,
    int? coin,
    int? purchasedCoin,
    int? subscriptionCost,
    int? videoUnlockCost,
    bool? isMonetization,
    int? totalWatchTime,
    int? totalCurrentWatchTime,
    int? totalWithdrawableAmount,
    int? totalEarningAmount,
    List<Coinplan>? coinplan,
    String? referralCode,
    int? loginType,
    String? createdAt,
    String? updatedAt,
  }) =>
      User(
        socialMediaLinks: socialMediaLinks ?? _socialMediaLinks,
        plan: plan ?? _plan,
        watchAds: watchAds ?? _watchAds,
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
        channelType: channelType ?? _channelType,
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
        isReferral: isReferral ?? _isReferral,
        referralCount: referralCount ?? _referralCount,
        coin: coin ?? _coin,
        purchasedCoin: purchasedCoin ?? _purchasedCoin,
        subscriptionCost: subscriptionCost ?? _subscriptionCost,
        videoUnlockCost: videoUnlockCost ?? _videoUnlockCost,
        isMonetization: isMonetization ?? _isMonetization,
        totalWatchTime: totalWatchTime ?? _totalWatchTime,
        totalCurrentWatchTime: totalCurrentWatchTime ?? _totalCurrentWatchTime,
        totalWithdrawableAmount: totalWithdrawableAmount ?? _totalWithdrawableAmount,
        totalEarningAmount: totalEarningAmount ?? _totalEarningAmount,
        coinplan: coinplan ?? _coinplan,
        referralCode: referralCode ?? _referralCode,
        loginType: loginType ?? _loginType,
        createdAt: createdAt ?? _createdAt,
        updatedAt: updatedAt ?? _updatedAt,
      );
  SocialMediaLinks? get socialMediaLinks => _socialMediaLinks;
  Plan? get plan => _plan;
  WatchAds? get watchAds => _watchAds;
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
  int? get channelType => _channelType;
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
  bool? get isLive => _isLive;
  String? get channel => _channel;
  String? get liveHistoryId => _liveHistoryId;
  bool? get isReferral => _isReferral;
  num? get referralCount => _referralCount;
  num? get coin => _coin;
  num? get purchasedCoin => _purchasedCoin;
  num? get subscriptionCost => _subscriptionCost;
  num? get videoUnlockCost => _videoUnlockCost;
  bool? get isMonetization => _isMonetization;
  num? get totalWatchTime => _totalWatchTime;
  num? get totalCurrentWatchTime => _totalCurrentWatchTime;
  num? get totalWithdrawableAmount => _totalWithdrawableAmount;
  num? get totalEarningAmount => _totalEarningAmount;
  List<Coinplan>? get coinplan => _coinplan;
  String? get referralCode => _referralCode;
  int? get loginType => _loginType;
  String? get createdAt => _createdAt;
  String? get updatedAt => _updatedAt;

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
    map['channelType'] = _channelType;
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
    map['isReferral'] = _isReferral;
    map['referralCount'] = _referralCount;
    map['coin'] = _coin;
    map['purchasedCoin'] = _purchasedCoin;
    map['subscriptionCost'] = _subscriptionCost;
    map['videoUnlockCost'] = _videoUnlockCost;
    map['isMonetization'] = _isMonetization;
    map['totalWatchTime'] = _totalWatchTime;
    map['totalCurrentWatchTime'] = _totalCurrentWatchTime;
    map['totalWithdrawableAmount'] = _totalWithdrawableAmount;
    map['totalEarningAmount'] = _totalEarningAmount;
    if (_coinplan != null) {
      map['coinplan'] = _coinplan?.map((v) => v.toJson()).toList();
    }
    map['referralCode'] = _referralCode;
    map['loginType'] = _loginType;
    map['createdAt'] = _createdAt;
    map['updatedAt'] = _updatedAt;
    return map;
  }
}

Coinplan coinplanFromJson(String str) => Coinplan.fromJson(json.decode(str));
String coinplanToJson(Coinplan data) => json.encode(data.toJson());

class Coinplan {
  Coinplan({
    int? amount,
    int? coin,
    int? extraCoin,
    String? purchasedAt,
    String? id,
  }) {
    _amount = amount;
    _coin = coin;
    _extraCoin = extraCoin;
    _purchasedAt = purchasedAt;
    _id = id;
  }

  Coinplan.fromJson(dynamic json) {
    _amount = json['amount'];
    _coin = json['coin'];
    _extraCoin = json['extraCoin'];
    _purchasedAt = json['purchasedAt'];
    _id = json['_id'];
  }
  int? _amount;
  int? _coin;
  int? _extraCoin;
  String? _purchasedAt;
  String? _id;
  Coinplan copyWith({
    int? amount,
    int? coin,
    int? extraCoin,
    String? purchasedAt,
    String? id,
  }) =>
      Coinplan(
        amount: amount ?? _amount,
        coin: coin ?? _coin,
        extraCoin: extraCoin ?? _extraCoin,
        purchasedAt: purchasedAt ?? _purchasedAt,
        id: id ?? _id,
      );
  int? get amount => _amount;
  int? get coin => _coin;
  int? get extraCoin => _extraCoin;
  String? get purchasedAt => _purchasedAt;
  String? get id => _id;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['amount'] = _amount;
    map['coin'] = _coin;
    map['extraCoin'] = _extraCoin;
    map['purchasedAt'] = _purchasedAt;
    map['_id'] = _id;
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
    int? amount,
    int? validity,
    String? validityType,
    List<String>? planBenefit,
  }) {
    _planStartDate = planStartDate;
    _planEndDate = planEndDate;
    _premiumPlanId = premiumPlanId;
    _amount = amount;
    _validity = validity;
    _validityType = validityType;
    _planBenefit = planBenefit;
  }

  Plan.fromJson(dynamic json) {
    _planStartDate = json['planStartDate'];
    _planEndDate = json['planEndDate'];
    _premiumPlanId = json['premiumPlanId'];
    _amount = json['amount'];
    _validity = json['validity'];
    _validityType = json['validityType'];
    _planBenefit = json['planBenefit'] != null ? json['planBenefit'].cast<String>() : [];
  }
  String? _planStartDate;
  String? _planEndDate;
  String? _premiumPlanId;
  int? _amount;
  int? _validity;
  String? _validityType;
  List<String>? _planBenefit;
  Plan copyWith({
    String? planStartDate,
    String? planEndDate,
    String? premiumPlanId,
    int? amount,
    int? validity,
    String? validityType,
    List<String>? planBenefit,
  }) =>
      Plan(
        planStartDate: planStartDate ?? _planStartDate,
        planEndDate: planEndDate ?? _planEndDate,
        premiumPlanId: premiumPlanId ?? _premiumPlanId,
        amount: amount ?? _amount,
        validity: validity ?? _validity,
        validityType: validityType ?? _validityType,
        planBenefit: planBenefit ?? _planBenefit,
      );
  String? get planStartDate => _planStartDate;
  String? get planEndDate => _planEndDate;
  String? get premiumPlanId => _premiumPlanId;
  int? get amount => _amount;
  int? get validity => _validity;
  String? get validityType => _validityType;
  List<String>? get planBenefit => _planBenefit;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['planStartDate'] = _planStartDate;
    map['planEndDate'] = _planEndDate;
    map['premiumPlanId'] = _premiumPlanId;
    map['amount'] = _amount;
    map['validity'] = _validity;
    map['validityType'] = _validityType;
    map['planBenefit'] = _planBenefit;
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
