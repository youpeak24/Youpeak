//Mongoose
const mongoose = require("../util/mongooseShim");

//Setting Schema
const settingSchema = new mongoose.Schema(
  {
    privacyPolicyLink: { type: String, default: "PRIVACY POLICY LINK" },
    privacyPolicyText: { type: String, default: "PRIVACY POLICY TEXT" },

    androidAppVersion: { type: String, default: "" },
    iosAppVersion: { type: String, default: "" },
    androidAppLink: { type: String, default: "" },
    iosAppLink: { type: String, default: "" },
    websiteUrl: { type: String, default: "" },

    zegoAppId: { type: String, default: "ZEGO APP ID" },
    zegoAppSignIn: { type: String, default: "ZEGO APP SIGN IN" },
    zegoServerSecret: { type: String, default: "ZEGO SERVER SECRET" },

    resendApiKey: { type: String, default: "RESEND API KEY" },

    adminCommissionOfPaidChannel: { type: Number, default: 0 }, //that value always in percentage
    adminCommissionOfPaidVideo: { type: Number, default: 0 }, //that value always in percentage
    durationOfShorts: { type: Number, default: 0 }, //that value always save in seconds

    minCoinForCashOut: { type: Number, default: 100 }, //min coin requried for convert coin to default currency i.e., 1000 coin = 1 $
    maxAdPerDay: { type: Number, default: 20 },

    //Referral Setting
    referralRewardCoins: { type: Number, default: 250 },

    //engagement setting
    watchingVideoRewardCoins: { type: Number, default: 100 },
    commentingRewardCoins: { type: Number, default: 2 },
    likeVideoRewardCoins: { type: Number, default: 5 },

    //loginReward setting
    loginRewardCoins: { type: Number, default: 100 },

    // Storage Settings
    storage: {
      local: { type: Boolean, default: true }, // Local storage active by default
      awsS3: { type: Boolean, default: false },
      digitalOcean: { type: Boolean, default: false },
    },

    //DigitalOcean Spaces
    doEndpoint: { type: String, default: "" },
    doAccessKey: { type: String, default: "" },
    doSecretKey: { type: String, default: "" },
    doHostname: { type: String, default: "" },
    doBucketName: { type: String, default: "" },
    doRegion: { type: String, default: "" },

    //AWS S3
    awsEndpoint: { type: String, default: "" },
    awsAccessKey: { type: String, default: "" },
    awsSecretKey: { type: String, default: "" },
    awsHostname: { type: String, default: "" },
    awsBucketName: { type: String, default: "" },
    awsRegion: { type: String, default: "" },

    currency: {
      name: { type: String, default: "", unique: true },
      symbol: { type: String, default: "", unique: true },
      countryCode: { type: String, default: "" },
      currencyCode: { type: String, default: "" },
      isDefault: { type: Boolean, default: false },
    }, //default currency

    //withdrawal setting
    minWithdrawalRequestedAmount: { type: Number, min: 0, default: 500 }, // Per YP-TC-2026-FINAL: Min payout ₹500 (50,000 coins),
    minConvertCoin: { type: Number, min: 0, default: 0 },

    //monetization setting
    earningPerHour: { type: Number, min: 0, default: 0 }, //earning with default currency
    isMonetization: { type: Boolean, default: false },
    minWatchTime: { type: Number, default: 0 }, //that value always in hours
    minSubScriber: { type: Number, default: 0 },
    adDisplayIndex: { type: Number, default: 0 }, //it represents the index at which ads should be displayed

    privateKey: { type: Object, default: {} }, //firebase.json handle notification

    watermarkType: { type: Number, enum: [1, 2] }, //1.active 2.inactive
    isWatermarkOn: { type: Boolean, default: false },
    watermarkIcon: { type: String, default: "" },

    androidAssetLinks: { type: Array, default: [] },
    appleAppSiteAssociation: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Coin to INR Dynamic Conversion & Daily Caps
    coinToInrRate: { type: Number, default: 0.01 }, // 100 coins = 1 INR (0.01 INR per coin)
    dailyMaxEarningCapInCoins: { type: Number, default: 500 }, // 500 coins = ₹5 INR daily viewer cap
    dailyMaxCheckIns: { type: Number, default: 1 },
    dailyMaxLikes: { type: Number, default: 20 },
    dailyMaxComments: { type: Number, default: 10 },
    dailyMaxDislikes: { type: Number, default: 20 },
    dailyMaxVideoWatches: { type: Number, default: 50 },

    // Fraud Detection Configuration
    fraudDetectionEnabled: { type: Boolean, default: true },
    autoBlockHighRiskFraud: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Setting", settingSchema);
