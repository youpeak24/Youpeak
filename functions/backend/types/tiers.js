/**
 * Canonical tier definitions.
 *
 *  TASKER  — viewer / earner ladder (YP-TC-2026-FINAL §2). Controls the daily
 *            engagement caps and the daily earning cap. Assigned via
 *            user.membershipTierId (paid "Starter Pass").
 *  CREATOR — creator ladder (VIP pricing doc). Controls the ad-revenue split.
 *            Assigned via user.activeCreatorTierId (subscriber-gated VIP pass).
 *
 * All coin/INR numbers are configurable from the admin panel — these are the
 * launch defaults only. 100 coins = ₹1.
 */
"use strict";

const TASKER_TIERS = [
  {
    _id: "tier_tasker_free",
    tierType: "TASKER", level: 1, tierName: "Free",
    membershipPrice: 0, adCreditsGranted: 0,
    dailyAdLimit: 20, dailyLikeLimit: 5, dailyCommentLimit: 2,
    dailyEarningCapInCoins: 500, dailyEarningCapInINR: 5, coinMultiplier: 1.0,
    isDefault: true, isActive: true,
    description: "Free tasker — 20 ads / 5 likes / 2 comments, up to ₹5/day.",
  },
  {
    _id: "tier_tasker_bronze",
    tierType: "TASKER", level: 2, tierName: "Bronze",
    membershipPrice: 999, adCreditsGranted: 1000,
    dailyAdLimit: 20, dailyLikeLimit: 10, dailyCommentLimit: 5,
    dailyEarningCapInCoins: 2000, dailyEarningCapInINR: 20, coinMultiplier: 1.0,
    isDefault: false, isActive: true,
    description: "Bronze Starter — up to ₹20/day.",
  },
  {
    _id: "tier_tasker_silver",
    tierType: "TASKER", level: 3, tierName: "Silver",
    membershipPrice: 2499, adCreditsGranted: 2500,
    dailyAdLimit: 20, dailyLikeLimit: 20, dailyCommentLimit: 10,
    dailyEarningCapInCoins: 4000, dailyEarningCapInINR: 40, coinMultiplier: 1.0,
    isDefault: false, isActive: true,
    description: "Silver Intermediate — up to ₹40/day.",
  },
  {
    _id: "tier_tasker_gold",
    tierType: "TASKER", level: 4, tierName: "Gold",
    membershipPrice: 4999, adCreditsGranted: 5000,
    dailyAdLimit: 20, dailyLikeLimit: 40, dailyCommentLimit: 20,
    dailyEarningCapInCoins: 12000, dailyEarningCapInINR: 120, coinMultiplier: 1.0,
    isDefault: false, isActive: true,
    description: "Gold Advanced — up to ₹120/day.",
  },
  {
    _id: "tier_tasker_platinum",
    tierType: "TASKER", level: 5, tierName: "Platinum",
    membershipPrice: 9999, adCreditsGranted: 10000,
    dailyAdLimit: 20, dailyLikeLimit: 60, dailyCommentLimit: 30,
    dailyEarningCapInCoins: 16667, dailyEarningCapInINR: 166.67, coinMultiplier: 1.0,
    isDefault: false, isActive: true,
    description: "Platinum Regional Pro — up to ₹5,000/month.",
  },
];

const CREATOR_TIERS = [
  {
    _id: "tier_creator_classic",
    tierType: "CREATOR", level: 1, tierName: "Classic Pass",
    membershipPrice: 0, minSubscribersRequired: 0, maxSubscribers: null,
    creatorRevenueSharePercentage: 50, companyRevenueSharePercentage: 50,
    maxEarningPerVideoInINR: 1000, isDefault: true, isActive: true,
    description: "Free — 0 subscribers, 50/50 ad revenue split.",
  },
  {
    _id: "tier_creator_starter_vip",
    tierType: "CREATOR", level: 2, tierName: "Starter VIP Pass",
    membershipPrice: 4999, minSubscribersRequired: 0, maxSubscribers: 5000,
    creatorRevenueSharePercentage: 60, companyRevenueSharePercentage: 40,
    maxEarningPerVideoInINR: 2000, isDefault: false, isActive: true,
    description: "< 5,000 subscribers — 60/40 split.",
  },
  {
    _id: "tier_creator_silver_vip",
    tierType: "CREATOR", level: 3, tierName: "Silver VIP Pass",
    membershipPrice: 2999, minSubscribersRequired: 5000, maxSubscribers: 25000,
    creatorRevenueSharePercentage: 65, companyRevenueSharePercentage: 35,
    maxEarningPerVideoInINR: 5000, isDefault: false, isActive: true,
    description: "5,000–25,000 subscribers — 65/35 split.",
  },
  {
    _id: "tier_creator_gold_vip",
    tierType: "CREATOR", level: 4, tierName: "Gold VIP Pass",
    membershipPrice: 1499, minSubscribersRequired: 25000, maxSubscribers: 100000,
    creatorRevenueSharePercentage: 75, companyRevenueSharePercentage: 25,
    maxEarningPerVideoInINR: 10000, isDefault: false, isActive: true,
    description: "25,000–100,000 subscribers — 75/25 split.",
  },
  {
    _id: "tier_creator_platinum_vip",
    tierType: "CREATOR", level: 5, tierName: "Platinum VIP Pass",
    membershipPrice: 0, minSubscribersRequired: 100000, maxSubscribers: null,
    creatorRevenueSharePercentage: 80, companyRevenueSharePercentage: 20,
    maxEarningPerVideoInINR: 25000, isDefault: false, isActive: true,
    description: "> 100,000 subscribers — 80/20 split.",
  },
];

module.exports = {
  TASKER_TIERS,
  CREATOR_TIERS,
  ALL_TIERS: [...TASKER_TIERS, ...CREATOR_TIERS],
};
