const mongoose = require("../util/mongooseShim");

const membershipTierSchema = new mongoose.Schema(
  {
    tierName: { type: String, required: true, trim: true }, // e.g., Free, Silver, Gold, Platinum
    level: { type: Number, required: true }, // 1..5 (unique per tierType)
    // "TASKER"  -> viewer/earner ladder, controls the daily earning caps
    // "CREATOR" -> creator ladder, controls the ad revenue split
    tierType: { type: String, enum: ["TASKER", "CREATOR"], default: "TASKER" },
    dailyEarningCapInCoins: { type: Number, default: 1000 },
    dailyEarningCapInINR: { type: Number, default: 100 },
    dailyAdLimit: { type: Number, default: 20 },
    dailyLikeLimit: { type: Number, default: 5 },
    dailyCommentLimit: { type: Number, default: 2 },
    coinMultiplier: { type: Number, default: 1.0 },
    adCreditsGranted: { type: Number, default: 0 },
    membershipPrice: { type: Number, default: 0 },
    // TASKER: cumulative lifetime watch hours that unlock this level for free
    watchHoursToUpgrade: { type: Number, default: 0 },
    // CREATOR VIP pass lengths (util/creatorPass.js). Neither set = legacy
    // one-time pass priced by membershipPrice.
    quarterlyPriceINR: { type: Number, default: 0 },
    annualPriceINR: { type: Number, default: 0 },
    standardQuarterlyPriceINR: { type: Number, default: 0 }, // after the intro offer; 0 = unchanged
    standardAnnualPriceINR: { type: Number, default: 0 },
    introOfferLimit: { type: Number, default: 0 }, // first N creators keep the launch price
    maxSubscribers: { type: Number, default: null },
    creatorRevenueSharePercentage: { type: Number, default: 70 }, // e.g. 60%, 70%, 80%
    companyRevenueSharePercentage: { type: Number, default: 30 }, // e.g. 40%, 30%, 20%
    minSubscribersRequired: { type: Number, default: 0 }, // min subscribers needed for upgrade qualification
    maxEarningPerVideoInINR: { type: Number, default: 1000 }, // max earning cap per video for creator
    upgradeFeeInINR: { type: Number, default: 0 }, // fee required to upgrade to this tier
    description: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

membershipTierSchema.index({ level: 1 });

module.exports = mongoose.model("MembershipTier", membershipTierSchema);
