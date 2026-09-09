// Default settings. Real values are loaded from the Firestore `settings`
// collection at runtime and managed from the admin panel.
// Secrets (R2 keys, Firebase SA, payment keys) are NEVER stored here — they
// come from environment variables. See .env.example.
module.exports = {
  _id: "6a5a008c9fb97d1dc7aa9e61",
  storage: {
    local: false,
    awsS3: false,
    digitalOcean: false,
    cloudflareR2: true,
  },
  r2BucketName: process.env.CLOUDFLARE_R2_BUCKET || "youpeak-videos",
  r2PublicDomain: process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || "",
  currency: {
    name: "USD",
    symbol: "$",
    countryCode: "USA",
    currencyCode: "USD",
    isDefault: true,
  },
  privacyPolicyLink: "https://youpeak-9ff65.web.app",
  privacyPolicyText: "PRIVACY POLICY TEXT",
  adminCommissionOfPaidChannel: 0,
  adminCommissionOfPaidVideo: 0,
  durationOfShorts: 60000,
  createdAt: "2023-08-08T12:48:46.902Z",
  updatedAt: new Date().toISOString(),
  minWithdrawalRequestedAmount: 500,
  zegoAppId: "",
  zegoAppSignIn: "",
  earningPerHour: 2,
  minSubScriber: 1,
  minWatchTime: 1,
  isMonetization: true,
  adDisplayIndex: 2,
  privateKey: {},
  // ── Engagement / earning limits (YP-TC-2026-FINAL + strategy call) ──
  coinToInrRate: 0.01,        // INR per coin (100 coins = ₹1)
  coinsPerInr: 100,           // coins per ₹1 (used for coin->INR conversion)
  maxAdPerDay: 20,             // hard cap, all tiers
  dailyMaxLikes: 5,            // free tier
  dailyMaxComments: 2,         // free tier
  dailyMaxDislikes: 5,         // free tier
  dailyMaxCheckIns: 1,
  dailyMaxVideoWatches: 50,
  dailyMaxEarningCapInCoins: 500,   // free tier: ₹5/day
  minWatchMinutesForEngagementReward: 120, // 2 hours -> 500 coins
  engagementWatchRewardCoins: 500,
  minCoinForCashOut: 100,
  commentingRewardCoins: 5,      // per comment
  likeVideoRewardCoins: 2,       // per like
  dislikeVideoRewardCoins: 2,    // per unlike/dislike
  adRewardCoins: 25,             // per ad view (20 ads x 25 = 500 = free-tier daily cap)
  loginRewardCoins: 100,
  referralRewardCoins: 250,      // free tasker referral = 250 coins (₹2.50)
  requiredMembers: 5,

  // ── Peak Partner referral (₹100 + ₹100, with holding periods) ──
  referralStage1Coins: 10000,           // ₹100 on code apply
  referralStage2Coins: 10000,           // ₹100 on watch-time task
  referralStage1HoldHours: 24,
  referralStage2HoldHours: 48,
  referralStage2WatchMinutes: 100,
  referralStage2WindowDays: 7,
  maxReferralsPerDayPerUser: 20,
  referralDeviceDedup: true,
  paidTierReferralPercentage: 10,       // YP-TC §1.5: 10% of a referred member's paid pass
  watchingVideoRewardCoins: 2,   // per video watch (non-milestone)
  minWithdrawalRequestedCoin: 50000,  // ₹500
  minConvertCoin: 1000,

  // ── Payments ──
  // joiningFeeINR: 0 = no joining fee (launch on the tier model). Set > 0 only
  // after legal sign-off to gate earning/withdrawal behind a one-time fee.
  joiningFeeINR: 0,
  paymentGateway: "razorpay",         // razorpay | cashfree | phonepe

  // ── Revenue split (% of gross; creator+referrer+platform must sum to 100) ──
  // District-partner cut is taken from the platform share, capped separately.
  revenueSplits: {
    videoUnlock:     { creator: 80, referrer: 10, platform: 10 },
    peakBoost:       { creator: 80, referrer: 0,  platform: 20 },
    coinPurchase:    { creator: 0,  referrer: 10, platform: 90 },
    premiumPurchase: { creator: 0,  referrer: 10, platform: 90 },
    tierUpgrade:     { creator: 0,  referrer: 10, platform: 90 },
    adRevenue:       { creator: 55, referrer: 0,  platform: 45 }, // creator% overridden by VIP tier
  },
  districtPartnerRates: {
    videoUnlock: 10,        // capped by districtPartnerUnlockCapINR
    tierUpgrade: 20,        // VIP creator pass sale
    localBusinessAds: 30,
    adRevenue: 10,
    coinPurchase: 0,
    premiumPurchase: 0,
  },
  districtPartnerUnlockCapINR: 1000,
  isWatermarkOn: false,
  watermarkIcon: "",
  watermarkType: 2,
  resendApiKey: "",
  awsAccessKey: "",
  awsBucketName: "",
  awsEndpoint: "",
  awsHostname: "",
  awsRegion: "",
  awsSecretKey: "",
  doAccessKey: "",
  doBucketName: "",
  doEndpoint: "",
  doHostname: "",
  doRegion: "",
  doSecretKey: "",
  androidAppLink: "",
  androidAppVersion: "1.0.0",
  iosAppLink: "",
  iosAppVersion: "1.0.0",
  zegoServerSecret: "",
  websiteUrl: "https://youpeak-9ff65.web.app"
};
