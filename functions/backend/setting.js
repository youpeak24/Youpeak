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
  // Cloudflare Stream (adaptive HLS). customerCode = the "customer-xxxxx" part
  // of your playback URLs (Stream dashboard).
  cloudflareStreamCustomerCode: process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE || "",
  // non-video assets go to Firebase Storage:
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
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
  // Lower "trial" minimum on a user's very first-ever withdrawal (Creator,
  // Tasker, Digital Partner) — verifies their payout details work before
  // they commit to the normal ₹500 minimum on every withdrawal after.
  firstWithdrawalMinimumInr: 100,
  // Digital Partner's second and later payouts (their first uses the trial
  // minimum above). Disbursed weekly on partnerPayoutDay.
  partnerMinWithdrawalInr: 500,
  partnerPayoutDay: "Monday",
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
  // V9 "+500 boosted cap": tier dailyEarningCapInCoins values already include
  // the boost (Free = 500 + 500). Turning it off takes `coins` back off every
  // tier's cap (util/rewardEngine.js getLimits).
  taskerCapBoost: { enabled: true, coins: 500 },
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
  // Per-platform Razorpay checkout switches (Admin Panel > Settings > Payment).
  // Android + web are on by default so checkout appears as soon as a key is
  // configured; iOS stays off (store billing rules) until the admin opts in.
  razorPaySwitch: true,
  razorpayWebEnabled: true,
  razorpayIosEnabled: false,

  // ── Digital Partner Program (TRS) ──
  // One-time license; on payment the user gets isDigitalPartner=true,
  // partnerStatus=ACTIVE, and a PartnerProfile with this much ad-credit
  // balance. The Peak Partner ₹100+₹100 referral engine is unaffected by
  // this — it stays open to every user, partner or not.
  digitalPartnerLicenseFeeINR: 25000,

  // ── Creator Funding Campaigns (fan crowdfunding — perks only) ──
  // Redesigned from an earlier "tradeable fan card / secondary market /
  // passive income" concept that would have been an unregistered
  // securities offering under Indian law (SEBI Act §11AA Collective
  // Investment Scheme territory) — real public money pooled into a
  // tradeable instrument with profit expectation from others' trading.
  // This version: creators set a funding goal, fans back it with real
  // money via the normal payment.createOrder/verify flow, and receive
  // ONLY creator-defined perks (a badge, a shoutout, early access) —
  // never a resellable stake, never a trading market, never a promised
  // return. Goal met -> creator is credited (minus the platform fee).
  // Goal missed by the deadline -> every backer is refunded in full.
  creatorFundingEnabled: true,
  creatorFundingPlatformFeePercentage: 20,
  creatorFundingMinAccountAgeDays: 90,
  creatorFundingMaxDurationDays: 30,
  creatorFundingTiers: [
    { minSubscribers: 10000, maxGoalInr: 100000 },
    { minSubscribers: 50000, maxGoalInr: 500000 },
    { minSubscribers: 100000, maxGoalInr: 1000000 },
    { minSubscribers: 1000000, maxGoalInr: 2000000 },
  ],

  // ── Content moderation (IT Rules 2021) ──
  moderationEnabled: true,
  reportAutoHoldThreshold: 5,          // reports within the window -> pending_review
  reportAutoHoldWindowHours: 24,
  grievanceSlaHours: 36,
  grievanceOfficerName: "Grievance Officer",
  grievanceEmail: "grievance@youpeak.in",
  grievancePhone: "",
  grievanceAddress: "Trichy, Tamil Nadu, India",
  // Per the District Partner V4 agreement letterhead ("YOUPEAK PRIVATE LIMITED").
  companyLegalName: "Youpeak Private Limited",

  // ── Copyright / duplicate detection (needs the fingerprint worker) ──
  copyrightEngineEnabled: false,       // turn on once a worker is deployed
  copyrightAudioMatchThreshold: 0.85,
  copyrightFrameHammingThreshold: 10,
  copyrightMinFrameMatches: 3,

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
  // Creator Growth & Video Promotion rate card. Names are the keys existing
  // campaigns and payment transactions reference — rename with care.
  // DOC-20260826-WA0214 "Creator Growth & Video Promotion" rate card. `id` is
  // the stable key orders use; impressions are ESTIMATES (util/promotion.service.js).
  promotionPlans: [
    { id: "starter_plan", name: "Starter Plan", priceINR: 49, impressionsMin: 2000, impressionsMax: 2500, durationDays: 1, targeting: "Global", category: "Daily", isActive: true },
    { id: "basic_plan", name: "Basic Plan", priceINR: 99, impressionsMin: 3000, impressionsMax: 3500, durationDays: 2, targeting: "Global", category: "Daily", isActive: true },
    { id: "pro_starter", name: "Pro Starter", priceINR: 199, impressionsMin: 3000, impressionsMax: 5000, durationDays: 2, targeting: "Global", category: "Daily", isActive: true },
    { id: "boost_plan", name: "Boost Plan", priceINR: 249, impressionsMin: 3000, impressionsMax: 8000, durationDays: 4, targeting: "Global", category: "Daily", isActive: true },
    { id: "weekly_mega_plan", name: "Weekly Mega Plan", priceINR: 1000, impressionsMin: 50000, impressionsMax: 75000, durationDays: 7, targeting: "Global", category: "Weekly", isActive: true },
    { id: "monthly_pro_plan", name: "Monthly Pro Plan", priceINR: 3000, impressionsMin: 200000, impressionsMax: 250000, durationDays: 30, targeting: "Global", category: "Monthly", isActive: true },
  ],
  // In-app ad credit top-ups. `credits` is the total received (base + bonus);
  // `baseCredits` and `bonusCredits` are explicit 2-decimal/quantized values;
  // `id` is the stable pack identifier used by client checkout orders.
  adCreditPacks: [
    { id: "pack_100", name: "100 Credits", credits: 100, baseCredits: 98.04, bonusCredits: 1.96, bonusPercent: 2, priceINR: 160, validityDays: 730, isActive: true },
    { id: "pack_330", name: "330 Credits", credits: 330, baseCredits: 330, bonusCredits: 0, bonusPercent: 0, priceINR: 520, validityDays: 730, isActive: true },
    { id: "pack_660", name: "660 Credits", credits: 660, baseCredits: 660, bonusCredits: 0, bonusPercent: 0, priceINR: 1050, validityDays: 730, isActive: true },
    { id: "pack_1320", name: "1320 Credits", credits: 1320, baseCredits: 1320, bonusCredits: 0, bonusPercent: 0, priceINR: 2150, validityDays: 730, isActive: true },
    { id: "pack_3500", name: "3500 Credits", credits: 3500, baseCredits: 3301.89, bonusCredits: 198.11, bonusPercent: 6, priceINR: 5500, validityDays: 730, isActive: true },
    { id: "pack_7500", name: "7500 Credits", credits: 7500, baseCredits: 6578.95, bonusCredits: 921.05, bonusPercent: 14, priceINR: 11100, validityDays: 730, isActive: true },
  ],
  adCreditValidityDays: 730,
  // District Partner commission chart V4 (Trichy territory) — video unlocks
  // unchanged; VIP Creator Onboarding adjusted 20%->15%; Tasker Onboarding
  // and Digital Partner are new lines added in V4.
  districtPartnerRates: {
    videoUnlock: 10,          // capped by districtPartnerUnlockCapINR
    taskerOnboarding: 10,     // on paid Tasker "Starter Pass" purchases in-district
    tierUpgrade: 15,          // VIP creator pass sale (V4 adjustment: was 20)
    digitalPartnerLicense: 20, // on the Digital Partner license fee, in-district
    localBusinessAds: 30,
    adRevenue: 10,
    coinPurchase: 0,
    premiumPurchase: 0,
  },
  districtPartnerUnlockCapINR: 1000,
  // Digital Partner's own direct cut — separate from the District Partner's
  // override above. Local Business Ads: 50% direct (Digital Partner) + 30%
  // override (District Partner) + 20% platform. No booking/ad-serving system
  // exists yet to actually generate this revenue — rate is recorded now so
  // it's correct the moment that feature is built.
  digitalPartnerRates: {
    localBusinessAds: 50,
  },
  // "Tasker Onboarding Commission" (YP-TC) — whoever referred a Tasker earns
  // this % of every reward that Tasker earns, credited as an ADDITIONAL
  // platform-funded bonus (the Tasker's own payout is never reduced) — same
  // pattern as the paid-tier referral bonus in referral.service.js.
  taskerEarningsReferralPercentage: 20,

  // ── Peak Boost (fan -> creator coin tipping) ──
  // The 80/20 split itself lives in revenueSplits.peakBoost above; these are
  // the sheet's limits and preset cards (read through
  // util/platformConfig.js getPeakBoostConfig()). 100 coins = ₹1.
  peakBoost: {
    enabled: true,
    minCoins: 100,
    maxCoins: 1000000,
    presets: [
      { name: "Starter Boost", coins: 100 },
      { name: "Mini Boost", coins: 500 },
      { name: "Super Boost", coins: 2000 },
      { name: "Mega Boost", coins: 5000 },
      { name: "Ultra Boost", coins: 10000 },
    ],
  },

  // ── Membership activation (Play Store / App Store compliance) ──
  // The mobile app never takes a membership or license payment itself: it
  // sends the user to this web portal. The app locks a user out only while
  // an activation payment is actually owed (see util/accessGate.js).
  membershipPortalUrl: "https://youpeak.in",

  // ── Watch-time heartbeat ──
  // The app pings every watchHeartbeatIntervalSeconds while a video really
  // plays; the server credits at most watchHeartbeatMaxCreditSeconds per ping
  // and never more than the wall-clock time since the last credited ping
  // (util/watchLedger.service.js).
  watchHeartbeatIntervalSeconds: 10,
  watchHeartbeatMaxCreditSeconds: 15,

  // ── Tasker anti-fraud (util/taskSecurity.service.js) ──
  // Task rewards (ads/likes/comments/watch time) need a device attestation
  // from the app no older than taskAttestationTtlHours. The app reports VPN,
  // proxy, emulator and root signals; the server adds its own IP check and
  // binds each device to one tasker account.
  requireDeviceAttestationForTasks: true,
  taskAttestationTtlHours: 24,
  blockTasksOnVpn: true,
  blockTasksOnEmulator: true,
  blockTasksOnRootedDevice: true,
  oneTaskerAccountPerDevice: true,
  // Earning on the website (product requirement). Browsers expose none of
  // the device signals above, so web eligibility is the verified sign-in,
  // the server's datacenter/VPN IP check and the same account-level caps;
  // rewarded ads stay app-only (taskSecurity.adRewardRefusal). Admins can
  // switch web earning off here.
  allowWebTasking: true,
  // Reward actions closer together than this are treated as automated.
  minSecondsBetweenRewardActions: 3,

  // A single withdrawal may not exceed the user's Tasker tier's estimated
  // monthly income (tier.monthlyIncomeCapInINR, else daily coin cap x 30).
  // Applies to the in-app Tasker withdrawal (POST client/payout/request), and
  // only to pure taskers: Digital Partners, Creator VIP holders and anyone
  // with creator revenue are exempt (their earnings aren't tasker earnings).
  // NOTE: on the free tier the cap (₹300) is below the standard ₹500
  // minimum, so a free tasker can only withdraw once until they level up.
  enforceTierMonthlyWithdrawalCap: true,
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
