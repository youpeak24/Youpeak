import 'dart:convert';

SignUpModel signUpModelFromJson(String str) =>
    SignUpModel.fromJson(json.decode(str));
String signUpModelToJson(SignUpModel data) => json.encode(data.toJson());

class SignUpModel {
  SignUpModel({
    bool? status,
    String? message,
    User? user,
    bool? signUp,
  }) {
    _status = status;
    _message = message;
    _user = user;
    _signUp = signUp;
  }

  SignUpModel.fromJson(dynamic json) {
    _status = json['status'];
    _message = json['message'];
    _user = json['user'] != null ? User.fromJson(json['user']) : null;
    _signUp = json['signUp'];
  }
  bool? _status;
  String? _message;
  User? _user;
  bool? _signUp;
  SignUpModel copyWith({
    bool? status,
    String? message,
    User? user,
    bool? signUp,
  }) =>
      SignUpModel(
        status: status ?? _status,
        message: message ?? _message,
        user: user ?? _user,
        signUp: signUp ?? _signUp,
      );
  bool? get status => _status;
  String? get message => _message;
  User? get user => _user;
  bool? get signUp => _signUp;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['status'] = _status;
    map['message'] = _message;
    if (_user != null) {
      map['user'] = _user?.toJson();
    }
    map['signUp'] = _signUp;
    return map;
  }
}

User userFromJson(String str) => User.fromJson(json.decode(str));
String userToJson(User data) => json.encode(data.toJson());

class User {
  User({
    Plan? plan,
    String? id,
    String? fullName,
    String? nickName,
    String? email,
    String? gender,
    int? age,
    dynamic mobileNumber,
    String? image,
    dynamic country,
    dynamic ipAddress,
    String? channelId,
    dynamic descriptionOfChannel,
    bool? isChannel,
    String? password,
    String? uniqueId,
    bool? isPremiumPlan,
    bool? isAddByAdmin,
    bool? isActive,
    bool? isBlock,
    bool? isVerified,
    bool? isLive,
    dynamic channel,
    dynamic liveHistoryId,
    String? date,
    int? loginType,
    String? identity,
    String? fcmToken,
    String? createdAt,
    String? updatedAt,
  }) {
    _plan = plan;
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
    _isPremiumPlan = isPremiumPlan;
    _isAddByAdmin = isAddByAdmin;
    _isActive = isActive;
    _isBlock = isBlock;
    _isVerified = isVerified;
    _isLive = isLive;
    _channel = channel;
    _liveHistoryId = liveHistoryId;
    _date = date;
    _loginType = loginType;
    _identity = identity;
    _fcmToken = fcmToken;
    _createdAt = createdAt;
    _updatedAt = updatedAt;
  }

  User.fromJson(dynamic json) {
    _plan = json['plan'] != null ? Plan.fromJson(json['plan']) : null;
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
    _isPremiumPlan = json['isPremiumPlan'];
    _isAddByAdmin = json['isAddByAdmin'];
    _isActive = json['isActive'];
    _isBlock = json['isBlock'];
    _isVerified = json['isVerified'];
    _isLive = json['isLive'];
    _channel = json['channel'];
    _liveHistoryId = json['liveHistoryId'];
    _date = json['date'];
    _loginType = json['loginType'];
    _identity = json['identity'];
    _fcmToken = json['fcmToken'];
    _createdAt = json['createdAt'];
    _updatedAt = json['updatedAt'];
  }
  Plan? _plan;
  String? _id;
  String? _fullName;
  String? _nickName;
  String? _email;
  String? _gender;
  int? _age;
  dynamic _mobileNumber;
  String? _image;
  dynamic _country;
  dynamic _ipAddress;
  String? _channelId;
  dynamic _descriptionOfChannel;
  bool? _isChannel;
  String? _password;
  String? _uniqueId;
  bool? _isPremiumPlan;
  bool? _isAddByAdmin;
  bool? _isActive;
  bool? _isBlock;
  bool? _isVerified;
  bool? _isLive;
  dynamic _channel;
  dynamic _liveHistoryId;
  String? _date;
  int? _loginType;
  String? _identity;
  String? _fcmToken;
  String? _createdAt;
  String? _updatedAt;
  User copyWith({
    Plan? plan,
    String? id,
    String? fullName,
    String? nickName,
    String? email,
    String? gender,
    int? age,
    dynamic mobileNumber,
    String? image,
    dynamic country,
    dynamic ipAddress,
    String? channelId,
    dynamic descriptionOfChannel,
    bool? isChannel,
    String? password,
    String? uniqueId,
    bool? isPremiumPlan,
    bool? isAddByAdmin,
    bool? isActive,
    bool? isBlock,
    bool? isVerified,
    bool? isLive,
    dynamic channel,
    dynamic liveHistoryId,
    String? date,
    int? loginType,
    String? identity,
    String? fcmToken,
    String? createdAt,
    String? updatedAt,
  }) =>
      User(
        plan: plan ?? _plan,
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
        isPremiumPlan: isPremiumPlan ?? _isPremiumPlan,
        isAddByAdmin: isAddByAdmin ?? _isAddByAdmin,
        isActive: isActive ?? _isActive,
        isBlock: isBlock ?? _isBlock,
        isVerified: isVerified ?? _isVerified,
        isLive: isLive ?? _isLive,
        channel: channel ?? _channel,
        liveHistoryId: liveHistoryId ?? _liveHistoryId,
        date: date ?? _date,
        loginType: loginType ?? _loginType,
        identity: identity ?? _identity,
        fcmToken: fcmToken ?? _fcmToken,
        createdAt: createdAt ?? _createdAt,
        updatedAt: updatedAt ?? _updatedAt,
      );
  Plan? get plan => _plan;
  String? get id => _id;
  String? get fullName => _fullName;
  String? get nickName => _nickName;
  String? get email => _email;
  String? get gender => _gender;
  int? get age => _age;
  dynamic get mobileNumber => _mobileNumber;
  String? get image => _image;
  dynamic get country => _country;
  dynamic get ipAddress => _ipAddress;
  String? get channelId => _channelId;
  dynamic get descriptionOfChannel => _descriptionOfChannel;
  bool? get isChannel => _isChannel;
  String? get password => _password;
  String? get uniqueId => _uniqueId;
  bool? get isPremiumPlan => _isPremiumPlan;
  bool? get isAddByAdmin => _isAddByAdmin;
  bool? get isActive => _isActive;
  bool? get isBlock => _isBlock;
  bool? get isVerified => _isVerified;
  bool? get isLive => _isLive;
  dynamic get channel => _channel;
  dynamic get liveHistoryId => _liveHistoryId;
  String? get date => _date;
  int? get loginType => _loginType;
  String? get identity => _identity;
  String? get fcmToken => _fcmToken;
  String? get createdAt => _createdAt;
  String? get updatedAt => _updatedAt;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (_plan != null) {
      map['plan'] = _plan?.toJson();
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
    map['channelId'] = _channelId;
    map['descriptionOfChannel'] = _descriptionOfChannel;
    map['isChannel'] = _isChannel;
    map['password'] = _password;
    map['uniqueId'] = _uniqueId;
    map['isPremiumPlan'] = _isPremiumPlan;
    map['isAddByAdmin'] = _isAddByAdmin;
    map['isActive'] = _isActive;
    map['isBlock'] = _isBlock;
    map['isVerified'] = _isVerified;
    map['isLive'] = _isLive;
    map['channel'] = _channel;
    map['liveHistoryId'] = _liveHistoryId;
    map['date'] = _date;
    map['loginType'] = _loginType;
    map['identity'] = _identity;
    map['fcmToken'] = _fcmToken;
    map['createdAt'] = _createdAt;
    map['updatedAt'] = _updatedAt;
    return map;
  }
}

Plan planFromJson(String str) => Plan.fromJson(json.decode(str));
String planToJson(Plan data) => json.encode(data.toJson());

class Plan {
  Plan({
    dynamic planStartDate,
    dynamic premiumPlanId,
  }) {
    _planStartDate = planStartDate;
    _premiumPlanId = premiumPlanId;
  }

  Plan.fromJson(dynamic json) {
    _planStartDate = json['planStartDate'];
    _premiumPlanId = json['premiumPlanId'];
  }
  dynamic _planStartDate;
  dynamic _premiumPlanId;
  Plan copyWith({
    dynamic planStartDate,
    dynamic premiumPlanId,
  }) =>
      Plan(
        planStartDate: planStartDate ?? _planStartDate,
        premiumPlanId: premiumPlanId ?? _premiumPlanId,
      );
  dynamic get planStartDate => _planStartDate;
  dynamic get premiumPlanId => _premiumPlanId;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    map['planStartDate'] = _planStartDate;
    map['premiumPlanId'] = _premiumPlanId;
    return map;
  }
}
