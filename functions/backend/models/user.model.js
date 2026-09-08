const { LOGIN_TYPE, CHANNEL_TYPE } = require("../types/constant");

const mongoose = require("../util/mongooseShim");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: "" }, //channelName when set the channelName
    nickName: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    gender: { type: String, trim: true, default: "" },
    age: { type: Number, default: 0 },
    mobileNumber: { type: String, trim: true, default: null },
    image: { type: String, default: null },
    country: { type: String, trim: true, default: null },
    ipAddress: { type: String, trim: true, default: null },

    socialMediaLinks: {
      instagramLink: { type: String, default: "" },
      facebookLink: { type: String, default: "" },
      twitterLink: { type: String, default: "" },
      websiteLink: { type: String, default: "" },
    },

    channelType: { type: Number, default: 1, enum: CHANNEL_TYPE }, //1.free 2.paid
    channelId: { type: String, trim: true, default: null },
    descriptionOfChannel: { type: String, trim: true, default: null },
    isChannel: { type: Boolean, default: false },

    loginType: { type: Number, enum: LOGIN_TYPE }, //1.facebook 2.google 3.Apple 4.email-password 5.isLogin
    password: { type: String, trim: true, default: null },
    uniqueId: { type: String, trim: true, default: null },
    identity: { type: String, trim: true, default: null },
    fcmToken: { type: String, trim: true, default: null },
    date: { type: String, default: null },


    isPremiumPlan: { type: Boolean, default: false },

    // Web-Portal Payment Sync (Per Final Developer Blueprint)
    // True = user has completed joining fee payment on youpeak.in web portal
    // False = user must be directed to web portal to complete registration
    paymentStatus: { type: Boolean, default: false },
    paymentVerifiedAt: { type: Date, default: null },
    paymentGatewayRef: { type: String, default: null }, // Razorpay/PhonePe transaction ID
    plan: {
      planStartDate: { type: String, default: null }, //premium plan start date
      planEndDate: { type: String, default: null }, //Premium plan end date
      premiumPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "PremiumPlan", default: null },
      amount: { type: Number, default: 0 },
      validity: { type: Number, default: 0 },
      validityType: { type: String, default: null },
      planBenefit: { type: Array, default: [] },
    },
    coinplan: [
      {
        amount: { type: Number, default: 0 },
        coin: { type: Number, default: 0 },
        extraCoin: { type: Number, default: 0 },
        purchasedAt: { type: Date, default: Date.now },
      },
    ],

    isAddByAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBlock: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    isLive: { type: Boolean, default: false },
    channel: { type: String, default: null },
    liveHistoryId: { type: mongoose.Schema.Types.ObjectId, ref: "LiveHistory", default: null },

    watchAds: {
      count: { type: Number, default: 0 },
      date: { type: Date, default: null },
    },

    referralCode: { type: String, trim: true, unique: true },
    isReferral: { type: Boolean, default: false }, //True if the user was used referral code
    referralCount: { type: Number, default: 0 }, //how many users have signed up using a specific user's referral code

    loginRewardCoin: { type: Number, default: 0 },
    dailyCheckInRewardCoin: { type: Number, default: 0 },
    referralRewardCoin: { type: Number, default: 0 },
    adsRewardCoin: { type: Number, default: 0 },
    engagementRewardCoin: { type: Number, default: 0 },

    coin: { type: Number, default: 0 },
    purchasedCoin: { type: Number, default: 0 }, //when coin plan purchased at that time increased
    totalRewardCoin: { type: Number, default: 0 }, //login reward + daily checkIn reward + referral reward + ads reward + engagement reward

    subscriptionCost: { type: Number, default: 10 },
    videoUnlockCost: { type: Number, default: 10 },

    isMonetization: { type: Boolean, default: false },
    totalWatchTime: { type: Number, default: 0 }, //that value always save in minutes for Monetization

    totalCurrentWatchTime: { type: Number, default: 0 },
    totalWithdrawableAmount: { type: Number, default: 0 },

    totalEarningAmount: { type: Number, default: 0 }, //Earning from monetization and Earninng from converted coin (coin earned from rewards)

    // Regional & Geofenced Agency binding
    state: { type: String, default: "" },
    district: { type: String, default: "" },
    city: { type: String, default: "" },
    currentLat: { type: Number, default: 0 },
    currentLng: { type: Number, default: 0 },
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", default: null },

    // Tier Management & Limits
    membershipTierId: { type: mongoose.Schema.Types.ObjectId, ref: "MembershipTier", default: null },
    activeCreatorTierId: { type: mongoose.Schema.Types.ObjectId, ref: "MembershipTier", default: null },
    totalSubscribers: { type: Number, default: 0 },
    dailyEarningCoinsToday: { type: Number, default: 0 },
    dailyAdCountToday: { type: Number, default: 0 },
    dailyCheckInsToday: { type: Number, default: 0 },
    dailyLikesToday: { type: Number, default: 0 },
    dailyCommentsToday: { type: Number, default: 0 },
    dailyDislikesToday: { type: Number, default: 0 },
    dailyVideoWatchesToday: { type: Number, default: 0 },
    lastActivityDate: { type: String, default: "" }, // YYYY-MM-DD format for resetting daily metrics

    // Fraud & Security
    fraudFlags: { type: Number, default: 0 },
    isRestricted: { type: Boolean, default: false },
    restrictionReason: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.index({ createdAt: -1 });
userSchema.index({ isAddByAdmin: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isBlock: 1 });
userSchema.index({ isMonetization: 1 });

module.exports = mongoose.model("User", userSchema);
