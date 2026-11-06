class AdminSettingsModel {
  bool? status;
  String? message;
  Setting? setting;

  AdminSettingsModel({this.status, this.message, this.setting});

  AdminSettingsModel.fromJson(Map<String, dynamic> json) {
    status = json['status'];
    message = json['message'];
    setting = json['setting'] != null ? new Setting.fromJson(json['setting']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['status'] = this.status;
    data['message'] = this.message;
    if (this.setting != null) {
      data['setting'] = this.setting!.toJson();
    }
    return data;
  }
}

class Setting {
  Currency? currency;
  String? sId;
  String? stripePublishableKey;
  String? stripeSecretKey;
  String? razorPayId;
  String? razorSecretKey;
  bool? stripeSwitch;
  bool? razorPaySwitch;
  String? privacyPolicyLink;
  String? privacyPolicyText;
  num? adminCommissionOfPaidChannel;
  num? adminCommissionOfPaidVideo;
  num? durationOfShorts;
  String? createdAt;
  String? updatedAt;
  num? minWithdrawalRequestedAmount;
  String? zegoAppId;
  String? zegoAppSignIn;
  bool? googlePlaySwitch;
  num? earningPerHour;
  num? minSubScriber;
  num? minWatchTime;
  bool? isMonetization;
  num? adDisplayIndex;
  PrivateKey? privateKey;
  String? flutterWaveId;
  bool? flutterWaveSwitch;
  num? maxAdPerDay;
  num? minCoinForCashOut;
  num? commentingRewardCoins;
  num? likeVideoRewardCoins;
  num? loginRewardCoins;
  num? referralRewardCoins;
  num? requiredMembers;
  num? watchingVideoRewardCoins;
  num? minWithdrawalRequestedCoin;
  num? minConvertCoin;
  bool? isWatermarkOn;
  String? watermarkIcon;
  int? watermarkType;
  Android? android;
  Android? ios;
  bool? isGoogle;
  String? androidAppLink;
  String? androidAppVersion;
  String? iosAppLink;
  String? iosAppVersion;
  bool? cashfreeAndroidEnabled;
  String? cashfreeClientId;
  String? cashfreeClientSecret;
  bool? cashfreeIosEnabled;
  bool? flutterwaveIosEnabled;
  bool? googlePayIosEnabled;
  bool? googlePlayEnabled;
  bool? paypalAndroidEnabled;
  String? paypalClientId;
  bool? paypalIosEnabled;
  String? paypalSecretKey;
  bool? paystackAndroidEnabled;
  bool? paystackIosEnabled;
  String? paystackPublicKey;
  String? paystackSecretKey;
  bool? razorpayIosEnabled;
  bool? razorpayWebEnabled;
  bool? stripeIosEnabled;

  Setting({
    this.currency,
    this.sId,
    this.stripePublishableKey,
    this.stripeSecretKey,
    this.razorPayId,
    this.razorSecretKey,
    this.stripeSwitch,
    this.razorPaySwitch,
    this.privacyPolicyLink,
    this.privacyPolicyText,
    this.adminCommissionOfPaidChannel,
    this.adminCommissionOfPaidVideo,
    this.durationOfShorts,
    this.createdAt,
    this.updatedAt,
    this.minWithdrawalRequestedAmount,
    this.zegoAppId,
    this.zegoAppSignIn,
    this.googlePlaySwitch,
    this.earningPerHour,
    this.minSubScriber,
    this.minWatchTime,
    this.isMonetization,
    this.adDisplayIndex,
    this.privateKey,
    this.flutterWaveId,
    this.flutterWaveSwitch,
    this.maxAdPerDay,
    this.minCoinForCashOut,
    this.commentingRewardCoins,
    this.likeVideoRewardCoins,
    this.loginRewardCoins,
    this.referralRewardCoins,
    this.requiredMembers,
    this.watchingVideoRewardCoins,
    this.minWithdrawalRequestedCoin,
    this.minConvertCoin,
    this.isWatermarkOn,
    this.watermarkIcon,
    this.watermarkType,
    this.android,
    this.ios,
    this.isGoogle,
    this.androidAppLink,
    this.androidAppVersion,
    this.iosAppLink,
    this.iosAppVersion,
    this.cashfreeAndroidEnabled,
    this.cashfreeClientId,
    this.cashfreeClientSecret,
    this.cashfreeIosEnabled,
    this.flutterwaveIosEnabled,
    this.googlePayIosEnabled,
    this.googlePlayEnabled,
    this.paypalAndroidEnabled,
    this.paypalClientId,
    this.paypalIosEnabled,
    this.paypalSecretKey,
    this.paystackAndroidEnabled,
    this.paystackIosEnabled,
    this.paystackPublicKey,
    this.paystackSecretKey,
    this.razorpayIosEnabled,
    this.razorpayWebEnabled,
    this.stripeIosEnabled,
  });

  Setting.fromJson(Map<String, dynamic> json) {
    currency = json['currency'] != null ? new Currency.fromJson(json['currency']) : null;
    sId = json['_id'];
    stripePublishableKey = json['stripePublishableKey'];
    stripeSecretKey = json['stripeSecretKey'];
    razorPayId = json['razorPayId'];
    razorSecretKey = json['razorSecretKey'];
    stripeSwitch = json['stripeSwitch'];
    razorPaySwitch = json['razorPaySwitch'];
    privacyPolicyLink = json['privacyPolicyLink'];
    privacyPolicyText = json['privacyPolicyText'];
    adminCommissionOfPaidChannel = json['adminCommissionOfPaidChannel'];
    adminCommissionOfPaidVideo = json['adminCommissionOfPaidVideo'];
    durationOfShorts = json['durationOfShorts'];
    // Legacy Mongo-shaped {"$date": "..."} instead of a plain string used to
    // throw here and abort the whole fromJson() call, silently leaving
    // AdminSettingsApi.adminSettingsModel null for the entire app session —
    // every switch/config read through it (payments, ads, watermark, …) then
    // saw nothing, with no visible error anywhere. Tolerate either shape.
    createdAt = json['createdAt'] is Map ? json['createdAt']['\$date']?.toString() : json['createdAt'];
    updatedAt = json['updatedAt'] is Map ? json['updatedAt']['\$date']?.toString() : json['updatedAt'];
    minWithdrawalRequestedAmount = json['minWithdrawalRequestedAmount'];
    zegoAppId = json['zegoAppId'];
    zegoAppSignIn = json['zegoAppSignIn'];
    googlePlaySwitch = json['googlePlaySwitch'];
    earningPerHour = json['earningPerHour'];
    minSubScriber = json['minSubScriber'];
    minWatchTime = json['minWatchTime'];
    isMonetization = json['isMonetization'];
    adDisplayIndex = json['adDisplayIndex'];
    privateKey = json['privateKey'] != null ? new PrivateKey.fromJson(json['privateKey']) : null;
    flutterWaveId = json['flutterWaveId'];
    flutterWaveSwitch = json['flutterWaveSwitch'];
    maxAdPerDay = json['maxAdPerDay'];
    minCoinForCashOut = json['minCoinForCashOut'];
    commentingRewardCoins = json['commentingRewardCoins'];
    likeVideoRewardCoins = json['likeVideoRewardCoins'];
    loginRewardCoins = json['loginRewardCoins'];
    referralRewardCoins = json['referralRewardCoins'];
    requiredMembers = json['requiredMembers'];
    watchingVideoRewardCoins = json['watchingVideoRewardCoins'];
    minWithdrawalRequestedCoin = json['minWithdrawalRequestedCoin'];
    minConvertCoin = json['minConvertCoin'];
    isWatermarkOn = json['isWatermarkOn'];
    watermarkIcon = json['watermarkIcon'];
    watermarkType = json['watermarkType'];
    android = json['android'] != null ? new Android.fromJson(json['android']) : null;
    ios = json['ios'] != null ? new Android.fromJson(json['ios']) : null;
    isGoogle = json['isGoogle'];
    androidAppLink = json["androidAppLink"];
    androidAppVersion = json["androidAppVersion"];
    iosAppLink = json["iosAppLink"];
    iosAppVersion = json["iosAppVersion"];
    cashfreeAndroidEnabled = json["cashfreeAndroidEnabled"];
    cashfreeClientId = json["cashfreeClientId"];
    cashfreeClientSecret = json["cashfreeClientSecret"];
    cashfreeIosEnabled = json["cashfreeIosEnabled"];
    flutterwaveIosEnabled = json["flutterwaveIosEnabled"];
    googlePayIosEnabled = json["googlePayIosEnabled"];
    googlePlayEnabled = json["googlePlayEnabled"];
    paypalAndroidEnabled = json["paypalAndroidEnabled"];
    paypalClientId = json["paypalClientId"];
    paypalIosEnabled = json["paypalIosEnabled"];
    paypalSecretKey = json["paypalSecretKey"];
    paystackAndroidEnabled = json["paystackAndroidEnabled"];
    paystackIosEnabled = json["paystackIosEnabled"];
    paystackPublicKey = json["paystackPublicKey"];
    paystackSecretKey = json["paystackSecretKey"];
    razorpayIosEnabled = json["razorpayIosEnabled"];
    razorpayWebEnabled = json["razorpayWebEnabled"];
    stripeIosEnabled = json["stripeIosEnabled"];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    if (this.currency != null) {
      data['currency'] = this.currency!.toJson();
    }
    data['_id'] = this.sId;
    data['stripePublishableKey'] = this.stripePublishableKey;
    data['stripeSecretKey'] = this.stripeSecretKey;
    data['razorPayId'] = this.razorPayId;
    data['razorSecretKey'] = this.razorSecretKey;
    data['stripeSwitch'] = this.stripeSwitch;
    data['razorPaySwitch'] = this.razorPaySwitch;
    data['privacyPolicyLink'] = this.privacyPolicyLink;
    data['privacyPolicyText'] = this.privacyPolicyText;
    data['adminCommissionOfPaidChannel'] = this.adminCommissionOfPaidChannel;
    data['adminCommissionOfPaidVideo'] = this.adminCommissionOfPaidVideo;
    data['durationOfShorts'] = this.durationOfShorts;
    data['createdAt'] = this.createdAt;
    data['updatedAt'] = this.updatedAt;
    data['minWithdrawalRequestedAmount'] = this.minWithdrawalRequestedAmount;
    data['zegoAppId'] = this.zegoAppId;
    data['zegoAppSignIn'] = this.zegoAppSignIn;
    data['googlePlaySwitch'] = this.googlePlaySwitch;
    data['earningPerHour'] = this.earningPerHour;
    data['minSubScriber'] = this.minSubScriber;
    data['minWatchTime'] = this.minWatchTime;
    data['isMonetization'] = this.isMonetization;
    data['adDisplayIndex'] = this.adDisplayIndex;
    if (this.privateKey != null) {
      data['privateKey'] = this.privateKey!.toJson();
    }
    data['flutterWaveId'] = this.flutterWaveId;
    data['flutterWaveSwitch'] = this.flutterWaveSwitch;
    data['maxAdPerDay'] = this.maxAdPerDay;
    data['minCoinForCashOut'] = this.minCoinForCashOut;
    data['commentingRewardCoins'] = this.commentingRewardCoins;
    data['likeVideoRewardCoins'] = this.likeVideoRewardCoins;
    data['loginRewardCoins'] = this.loginRewardCoins;
    data['referralRewardCoins'] = this.referralRewardCoins;
    data['requiredMembers'] = this.requiredMembers;
    data['watchingVideoRewardCoins'] = this.watchingVideoRewardCoins;
    data['minWithdrawalRequestedCoin'] = this.minWithdrawalRequestedCoin;
    data['minConvertCoin'] = this.minConvertCoin;
    data['isWatermarkOn'] = this.isWatermarkOn;
    data['watermarkIcon'] = this.watermarkIcon;
    data['watermarkType'] = this.watermarkType;
    if (this.android != null) {
      data['android'] = this.android!.toJson();
    }
    if (this.ios != null) {
      data['ios'] = this.ios!.toJson();
    }
    data['isGoogle'] = this.isGoogle;
    return data;
  }
}

class Currency {
  String? name;
  String? symbol;
  String? countryCode;
  String? currencyCode;
  bool? isDefault;

  Currency({this.name, this.symbol, this.countryCode, this.currencyCode, this.isDefault});

  Currency.fromJson(Map<String, dynamic> json) {
    name = json['name'];
    symbol = json['symbol'];
    countryCode = json['countryCode'];
    currencyCode = json['currencyCode'];
    isDefault = json['isDefault'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['name'] = this.name;
    data['symbol'] = this.symbol;
    data['countryCode'] = this.countryCode;
    data['currencyCode'] = this.currencyCode;
    data['isDefault'] = this.isDefault;
    return data;
  }
}

class PrivateKey {
  String? type;
  String? projectId;
  String? privateKeyId;
  String? privateKey;
  String? clientEmail;
  String? clientId;
  String? authUri;
  String? tokenUri;
  String? authProviderX509CertUrl;
  String? clientX509CertUrl;
  String? universeDomain;

  PrivateKey(
      {this.type,
        this.projectId,
        this.privateKeyId,
        this.privateKey,
        this.clientEmail,
        this.clientId,
        this.authUri,
        this.tokenUri,
        this.authProviderX509CertUrl,
        this.clientX509CertUrl,
        this.universeDomain});

  PrivateKey.fromJson(Map<String, dynamic> json) {
    type = json['type'];
    projectId = json['project_id'];
    privateKeyId = json['private_key_id'];
    privateKey = json['private_key'];
    clientEmail = json['client_email'];
    clientId = json['client_id'];
    authUri = json['auth_uri'];
    tokenUri = json['token_uri'];
    authProviderX509CertUrl = json['auth_provider_x509_cert_url'];
    clientX509CertUrl = json['client_x509_cert_url'];
    universeDomain = json['universe_domain'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['type'] = this.type;
    data['project_id'] = this.projectId;
    data['private_key_id'] = this.privateKeyId;
    data['private_key'] = this.privateKey;
    data['client_email'] = this.clientEmail;
    data['client_id'] = this.clientId;
    data['auth_uri'] = this.authUri;
    data['token_uri'] = this.tokenUri;
    data['auth_provider_x509_cert_url'] = this.authProviderX509CertUrl;
    data['client_x509_cert_url'] = this.clientX509CertUrl;
    data['universe_domain'] = this.universeDomain;
    return data;
  }
}

class Android {
  Google? google;

  Android({this.google});

  Android.fromJson(Map<String, dynamic> json) {
    google = json['google'] != null ? new Google.fromJson(json['google']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    if (this.google != null) {
      data['google'] = this.google!.toJson();
    }
    return data;
  }
}

class Google {
  String? interstitial;
  String? native;
  String? reward;
  String? nativeAdVideo;
  String? videoAdUrl;

  Google({this.interstitial, this.native, this.reward, this.nativeAdVideo, this.videoAdUrl});

  Google.fromJson(Map<String, dynamic> json) {
    interstitial = json['interstitial'];
    native = json['native'];
    reward = json['reward'];
    nativeAdVideo = json['nativeAdVideo'];
    videoAdUrl = json['videoAdUrl'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['interstitial'] = this.interstitial;
    data['native'] = this.native;
    data['reward'] = this.reward;
    data['nativeAdVideo'] = this.nativeAdVideo;
    data['videoAdUrl'] = this.videoAdUrl;
    return data;
  }
}
