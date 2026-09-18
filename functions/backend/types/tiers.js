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

// Updated 2026-09-17 to the founder's V9 rate card (YP-TC-2026-FINAL V9):
// tiers renamed Free/Bronze/Silver/Gold/Platinum -> Free Tasker/Level 1-4
// Tasker (same _ids kept — renaming _id would orphan existing users'
// membershipTierId references), every daily coin cap boosted +500, and a
// new Dual Level Upgrade Mechanism added: a Tasker reaches a level either by
// buying its Starter Pass directly (membershipPrice, unchanged) OR for free
// by accumulating watchHoursToUpgrade cumulative watch hours (checked in
// util/rewardEngine.js checkTaskerWatchHourUpgrade, hooked into
// controllers/client/userTaskReward.controller.js checkWatchTimeMilestone).
const TASKER_TIERS = [
  {
    _id: "tier_tasker_free",
    tierType: "TASKER", level: 1, tierName: "Free Tasker",
    membershipPrice: 0, adCreditsGranted: 0, watchHoursToUpgrade: 0,
    dailyAdLimit: 20, dailyLikeLimit: 5, dailyCommentLimit: 2,
    dailyEarningCapInCoins: 1000, dailyEarningCapInINR: 10, coinMultiplier: 1.0,
    isDefault: true, isActive: true,
    description: "Free tasker — 20 ads / 5 likes / 2 comments, up to ₹10/day.",
  },
  {
    _id: "tier_tasker_bronze",
    tierType: "TASKER", level: 2, tierName: "Level 1 Tasker",
    membershipPrice: 999, adCreditsGranted: 1000, watchHoursToUpgrade: 50,
    dailyAdLimit: 20, dailyLikeLimit: 10, dailyCommentLimit: 5,
    dailyEarningCapInCoins: 2500, dailyEarningCapInINR: 25, coinMultiplier: 1.0,
    isDefault: false, isActive: true,
    description: "Level 1 Tasker — up to ₹25/day. Reach it via 50 watch hours or the Starter Pass.",
  },
  {
    _id: "tier_tasker_silver",
    tierType: "TASKER", level: 3, tierName: "Level 2 Tasker",
    membershipPrice: 2499, adCreditsGranted: 2500, watchHoursToUpgrade: 100,
    dailyAdLimit: 20, dailyLikeLimit: 20, dailyCommentLimit: 10,
    dailyEarningCapInCoins: 4500, dailyEarningCapInINR: 45, coinMultiplier: 1.0,
    isDefault: false, isActive: true,
    description: "Level 2 Tasker — up to ₹45/day. Reach it via 100 watch hours or the Starter Pass.",
  },
  {
    _id: "tier_tasker_gold",
    tierType: "TASKER", level: 4, tierName: "Level 3 Tasker",
    membershipPrice: 4999, adCreditsGranted: 5000, watchHoursToUpgrade: 200,
    dailyAdLimit: 20, dailyLikeLimit: 40, dailyCommentLimit: 20,
    dailyEarningCapInCoins: 12500, dailyEarningCapInINR: 125, coinMultiplier: 1.0,
    isDefault: false, isActive: true,
    description: "Level 3 Tasker — up to ₹125/day. Reach it via 200 watch hours or the Starter Pass.",
  },
  {
    _id: "tier_tasker_platinum",
    tierType: "TASKER", level: 5, tierName: "Level 4 Tasker",
    membershipPrice: 9999, adCreditsGranted: 10000, watchHoursToUpgrade: 400,
    dailyAdLimit: 20, dailyLikeLimit: 60, dailyCommentLimit: 30,
    dailyEarningCapInCoins: 17167, dailyEarningCapInINR: 171.67, coinMultiplier: 1.0,
    isDefault: false, isActive: true,
    description: "Level 4 Tasker — up to ₹5,150/month. Reach it via 400 watch hours or the Starter Pass.",
  },
];

// Updated 2026-09-11 to the founder's VIP Pass rate card (pasted twice,
// verbatim, treated as the current source of truth — supersedes the older
// numbers from the "VIP pricing doc"). Sub-thresholds and price now fall as
// subscriber count rises; splits climb 60/40 -> 70/30 -> 80/20 in a clean
// +10 step per tier. Platinum's split (90/10) continues that same arithmetic
// step since the rate card didn't state one — confirm with the founder, but
// it's the only value consistent with the other three.
// maxEarningPerVideoInINR is not in the rate card; carried over unchanged.
const CREATOR_TIERS = [
  {
    _id: "tier_creator_classic",
    tierType: "CREATOR", level: 1, tierName: "Classic Pass",
    membershipPrice: 0, minSubscribersRequired: 0, maxSubscribers: null,
    creatorRevenueSharePercentage: 50, companyRevenueSharePercentage: 50,
    maxEarningPerVideoInINR: 1000, isDefault: true, isActive: true,
    description: "Free — before any VIP Pass, 50/50 ad revenue split.",
  },
  {
    _id: "tier_creator_starter_vip",
    tierType: "CREATOR", level: 2, tierName: "Starter VIP Pass",
    membershipPrice: 2999, minSubscribersRequired: 0, maxSubscribers: 1000,
    creatorRevenueSharePercentage: 60, companyRevenueSharePercentage: 40,
    maxEarningPerVideoInINR: 2000, isDefault: false, isActive: true,
    description: "< 1,000 subscribers — 60/40 split.",
  },
  {
    _id: "tier_creator_silver_vip",
    tierType: "CREATOR", level: 3, tierName: "Silver VIP Pass",
    membershipPrice: 1999, minSubscribersRequired: 1000, maxSubscribers: 10000,
    creatorRevenueSharePercentage: 70, companyRevenueSharePercentage: 30,
    maxEarningPerVideoInINR: 5000, isDefault: false, isActive: true,
    description: "1,000–10,000 subscribers — 70/30 split.",
  },
  {
    _id: "tier_creator_gold_vip",
    tierType: "CREATOR", level: 4, tierName: "Gold VIP Pass",
    membershipPrice: 1499, minSubscribersRequired: 10000, maxSubscribers: 100000,
    creatorRevenueSharePercentage: 80, companyRevenueSharePercentage: 20,
    maxEarningPerVideoInINR: 10000, isDefault: false, isActive: true,
    description: "10,000–100,000 subscribers — 80/20 split.",
  },
  {
    _id: "tier_creator_platinum_vip",
    tierType: "CREATOR", level: 5, tierName: "Platinum VIP Pass",
    membershipPrice: 999, minSubscribersRequired: 100000, maxSubscribers: null,
    creatorRevenueSharePercentage: 90, companyRevenueSharePercentage: 10,
    maxEarningPerVideoInINR: 25000, isDefault: false, isActive: true,
    description: "> 100,000 subscribers — 90/10 split (inferred; confirm).",
  },
];

module.exports = {
  TASKER_TIERS,
  CREATOR_TIERS,
  ALL_TIERS: [...TASKER_TIERS, ...CREATOR_TIERS],
};
