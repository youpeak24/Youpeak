/**
 * YouPeak reward engine — the single place that decides how many coins an
 * engagement action earns, and enforces the daily caps from YP-TC-2026-FINAL
 * and the strategy call:
 *
 *   • 20 ads / day  (all tiers)
 *   • Free: 5 likes / 2 comments / day  (scales up per paid tier)
 *   • Daily earning cap in coins per tier (Free = 500 coins = ₹5)
 *   • 100 coins = ₹1
 *
 * The CLIENT never decides the coin amount — the server does, from admin
 * settings (global.settingJSON) with per-tier overrides from the
 * `membershipTiers` collection.
 *
 * NOTE: the Firestore shim has no transactions, so counter updates are
 * read-modify-write. The daily *earning* cap still bounds total coins even if
 * two requests race; tighten with Firestore transactions in a later pass.
 */
"use strict";

const db = require("./connection");
const { generateHistoryUniqueId } = require("./generateHistoryUniqueId");

const HISTORY_TYPE = {
  LOGIN_REWARD: 0,
  AD_WATCH: 2,
  DAILY_CHECKIN: 5,
  VIDEO_LIKE: 7,
  VIDEO_COMMENT: 8,
  WATCH_TIME_MILESTONE: 9,
  STAGE2_REFERRAL: 10,
  ENGAGEMENT_WATCH: 11,
};

const num = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : d;
};

// YYYY-MM-DD in Asia/Kolkata (server "day" for resets)
function todayStr() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    .toISOString()
    .slice(0, 10);
}

// Per-tier like/comment/dislike caps from the T&C tier table, keyed by tier.level
const TIER_ENGAGEMENT_CAPS = {
  1: { likes: 5, comments: 2 },   // Free
  2: { likes: 10, comments: 5 },  // Bronze
  3: { likes: 20, comments: 10 }, // Silver
  4: { likes: 40, comments: 20 }, // Gold
  5: { likes: 60, comments: 30 }, // Platinum
};

async function ensureDailyReset(user) {
  const t = todayStr();
  if (user.lastActivityDate === t) return user;
  const reset = {
    dailyEarningCoinsToday: 0,
    dailyAdCountToday: 0,
    dailyCheckInsToday: 0,
    dailyLikesToday: 0,
    dailyCommentsToday: 0,
    dailyDislikesToday: 0,
    dailyVideoWatchesToday: 0,
    totalCurrentWatchTime: 0,
    lastActivityDate: t,
  };
  await db.update("users", user._id || user.id, reset);
  Object.assign(user, reset);
  return user;
}

async function getLimits(user) {
  const s = global.settingJSON || {};
  const limits = {
    maxAdsPerDay: num(s.maxAdPerDay, 20),
    maxLikesPerDay: num(s.dailyMaxLikes, 5),
    maxCommentsPerDay: num(s.dailyMaxComments, 2),
    maxDislikesPerDay: num(s.dailyMaxDislikes, 5),
    maxCheckInsPerDay: num(s.dailyMaxCheckIns, 1),
    maxVideoWatchesPerDay: num(s.dailyMaxVideoWatches, 50),
    dailyEarningCapInCoins: num(s.dailyMaxEarningCapInCoins, 500),
    coinToInrRate: num(s.coinToInrRate, 0.01),
    coinMultiplier: 1,
    minWatchMinutesForEngagementReward: num(s.minWatchMinutesForEngagementReward, 120),
    reward: {
      like: num(s.likeVideoRewardCoins, 2),
      dislike: num(s.dislikeVideoRewardCoins, num(s.likeVideoRewardCoins, 2)),
      comment: num(s.commentingRewardCoins, 5),
      ad: num(s.adRewardCoins, num(s.watchingVideoRewardCoins, 20)),
      engagementWatch: num(s.engagementWatchRewardCoins, 500),
    },
  };

  if (user && user.membershipTierId) {
    try {
      const tier = await db.findById("membershipTiers", user.membershipTierId);
      if (tier) {
        limits.maxAdsPerDay = num(tier.dailyAdLimit, limits.maxAdsPerDay);
        limits.dailyEarningCapInCoins = num(tier.dailyEarningCapInCoins, limits.dailyEarningCapInCoins);
        limits.coinMultiplier = num(tier.coinMultiplier, 1) || 1;
        const caps = TIER_ENGAGEMENT_CAPS[tier.level];
        if (caps) {
          limits.maxLikesPerDay = caps.likes;
          limits.maxCommentsPerDay = caps.comments;
          limits.maxDislikesPerDay = caps.likes;
        }
        limits.tierName = tier.tierName || `Tier ${tier.level}`;
        limits.tierLevel = tier.level;
      }
    } catch (e) {
      /* fall back to base limits */
    }
  }
  return limits;
}

/**
 * Credit a reward for one engagement action, enforcing the count cap and the
 * daily coin cap. Loads + resets the user itself.
 *
 * @returns {Promise<{ok, credited, reason, message, limits, user, counts}>}
 *   reason: "OK" | "PARTIAL_CAP" | "COUNT_LIMIT" | "EARNING_CAP" | "USER_BLOCKED" | "USER_NOT_FOUND"
 */
async function creditReward({ userId, kind, historyType, countField, capField, fixedCoins, meta }) {
  if (!userId) return { ok: false, reason: "USER_NOT_FOUND", credited: 0, message: "userId is required." };

  const user = await db.findById("users", userId);
  if (!user) return { ok: false, reason: "USER_NOT_FOUND", credited: 0, message: "User not found." };
  if (user.isBlock) return { ok: false, reason: "USER_BLOCKED", credited: 0, message: "You are blocked by the admin." };

  await ensureDailyReset(user);
  const limits = await getLimits(user);
  const id = user._id || user.id;

  const maxCount = capField ? limits[capField] : null;
  const currentCount = countField ? (user[countField] || 0) : 0;
  if (countField && maxCount != null && currentCount >= maxCount) {
    return {
      ok: false, reason: "COUNT_LIMIT", credited: 0, limits,
      message: `Daily limit of ${maxCount} reached for today.`,
      counts: snapshotCounts(user),
    };
  }

  const room = limits.dailyEarningCapInCoins - (user.dailyEarningCoinsToday || 0);
  if (room <= 0) {
    return {
      ok: false, reason: "EARNING_CAP", credited: 0, limits,
      message: `Daily earning cap of ${limits.dailyEarningCapInCoins} coins reached for today.`,
      counts: snapshotCounts(user),
    };
  }

  const baseCoins = fixedCoins != null ? Number(fixedCoins) : (limits.reward[kind] || 0);
  const gross = Math.max(0, Math.round(baseCoins * (limits.coinMultiplier || 1)));
  const credited = Math.min(gross, room);

  const bucketField = {
    ad: "adsRewardCoin",
    checkin: "dailyCheckInRewardCoin",
    like: "engagementRewardCoin",
    comment: "engagementRewardCoin",
    dislike: "engagementRewardCoin",
    engagementWatch: "engagementRewardCoin",
  }[kind];

  const updates = {
    coin: (user.coin || 0) + credited,
    totalRewardCoin: (user.totalRewardCoin || 0) + credited,
    dailyEarningCoinsToday: (user.dailyEarningCoinsToday || 0) + credited,
  };
  if (bucketField) updates[bucketField] = (user[bucketField] || 0) + credited;
  if (countField) updates[countField] = currentCount + 1;

  const updatedUser = await db.update("users", id, updates);

  if (credited > 0) {
    await db.create("histories", {
      userId: id,
      uniqueId: await generateHistoryUniqueId(),
      coin: credited,
      type: historyType,
      date: new Date().toISOString(),
      ...(meta || {}),
    });
  }

  const merged = { ...user, ...updates };
  return {
    ok: true,
    reason: credited < gross ? "PARTIAL_CAP" : "OK",
    credited,
    message: credited > 0
      ? `Earned ${credited} coins.`
      : "Daily earning cap reached — no coins credited.",
    limits,
    user: merged,
    updatedUser,
    counts: snapshotCounts(merged),
  };
}

function snapshotCounts(user) {
  return {
    dailyEarningCoinsToday: user.dailyEarningCoinsToday || 0,
    dailyAdCountToday: user.dailyAdCountToday || 0,
    dailyLikesToday: user.dailyLikesToday || 0,
    dailyCommentsToday: user.dailyCommentsToday || 0,
    dailyDislikesToday: user.dailyDislikesToday || 0,
    dailyCheckInsToday: user.dailyCheckInsToday || 0,
    dailyVideoWatchesToday: user.dailyVideoWatchesToday || 0,
  };
}

module.exports = {
  HISTORY_TYPE,
  todayStr,
  ensureDailyReset,
  getLimits,
  creditReward,
  snapshotCounts,
};
