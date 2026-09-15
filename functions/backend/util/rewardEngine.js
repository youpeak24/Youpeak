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
 * Double-reward and lost-increment races (e.g. a double-tapped "like", or
 * two concurrent ad-watch calls) are closed by db.createOnce() (dedup, via a
 * deterministic history-doc id) and db.incrementFields() (atomic balance
 * math) below — see firestoreDb.service.js. The per-day COUNT/EARNING caps
 * themselves stay a best-effort read-then-check: each individual reward is
 * only a few coins, so the worst case under deliberate concurrent spam is a
 * few coins over the daily cap, not an unbounded exploit — not worth a
 * multi-field capped transaction the way the payment/commission paths (real
 * money, unbounded if raced) needed one.
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
  VIDEO_DISLIKE: 12,
  TASKER_REFERRAL_COMMISSION: 13,
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

  limits.tierName = "Free";
  limits.tierLevel = 1;

  if (user && user.membershipTierId) {
    try {
      const tier = await db.findById("membershipTiers", user.membershipTierId);
      if (tier) {
        limits.maxAdsPerDay = num(tier.dailyAdLimit, limits.maxAdsPerDay);
        limits.dailyEarningCapInCoins = num(tier.dailyEarningCapInCoins, limits.dailyEarningCapInCoins);
        limits.coinMultiplier = num(tier.coinMultiplier, 1) || 1;

        // prefer explicit per-tier limits, else the T&C tier table by level
        const caps = TIER_ENGAGEMENT_CAPS[tier.level];
        limits.maxLikesPerDay = num(tier.dailyLikeLimit, caps ? caps.likes : limits.maxLikesPerDay);
        limits.maxCommentsPerDay = num(tier.dailyCommentLimit, caps ? caps.comments : limits.maxCommentsPerDay);
        limits.maxDislikesPerDay = num(tier.dailyLikeLimit, caps ? caps.likes : limits.maxDislikesPerDay);

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
 * Resolve a creator's ad-revenue split. Returns the fraction (0–1) that goes to
 * the creator and to the platform, from their active creator tier (VIP pass) or
 * the Classic default (50/50).
 */
async function getCreatorRevenueShare(user) {
  const s = global.settingJSON || {};
  let creatorPct = num(s.defaultCreatorRevenueSharePercentage, 50);
  let tierName = "Classic Pass";
  let maxPerVideoINR = num(s.defaultMaxEarningPerVideoInINR, 1000);

  const tierId = user && (user.activeCreatorTierId || user.creatorTierId);
  if (tierId) {
    try {
      const tier = await db.findById("membershipTiers", tierId);
      if (tier && tier.tierType === "CREATOR") {
        creatorPct = num(tier.creatorRevenueSharePercentage, creatorPct);
        maxPerVideoINR = num(tier.maxEarningPerVideoInINR, maxPerVideoINR);
        tierName = tier.tierName || tierName;
      }
    } catch (e) {
      /* fall back to Classic */
    }
  }
  creatorPct = Math.min(100, Math.max(0, creatorPct));
  return {
    tierName,
    creatorShare: creatorPct / 100,
    platformShare: (100 - creatorPct) / 100,
    creatorSharePercentage: creatorPct,
    maxEarningPerVideoInINR: maxPerVideoINR,
  };
}

/**
 * Credit a reward for one engagement action, enforcing the count cap and the
 * daily coin cap. Loads + resets the user itself.
 *
 * @param {string} [dedupeVideoId]  if set, only reward once per (user, video, historyType)
 * @returns {Promise<{ok, credited, reason, message, limits, user, counts}>}
 *   reason: "OK" | "PARTIAL_CAP" | "COUNT_LIMIT" | "EARNING_CAP" | "ALREADY_REWARDED"
 *         | "USER_BLOCKED" | "USER_NOT_FOUND"
 */
async function creditReward({ userId, kind, historyType, countField, capField, fixedCoins, meta, dedupeVideoId }) {
  if (!userId) return { ok: false, reason: "USER_NOT_FOUND", credited: 0, message: "userId is required." };

  const user = await db.findById("users", userId);
  if (!user) return { ok: false, reason: "USER_NOT_FOUND", credited: 0, message: "User not found." };
  if (user.isBlock) return { ok: false, reason: "USER_BLOCKED", credited: 0, message: "You are blocked by the admin." };

  await ensureDailyReset(user);
  const limits = await getLimits(user);
  const id = user._id || user.id;

  // Fast pre-check — cheap early exit with an accurate message. The REAL
  // atomic gate against a double-tap or a retried request landing twice is
  // the createOnce() call below, keyed deterministically so two concurrent
  // requests for the same (user, video, action) can never both win.
  const historyId = dedupeVideoId
    ? `hist_dedupe_${id}_${dedupeVideoId}_${historyType}`
    : `hist_${id}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

  if (dedupeVideoId) {
    const already = await db.findOne("histories", { userId: id, videoId: dedupeVideoId, type: historyType });
    if (already) {
      return {
        ok: false, reason: "ALREADY_REWARDED", credited: 0, limits,
        message: "Already rewarded for this video.",
        counts: snapshotCounts(user),
      };
    }
  }

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

  if (credited > 0) {
    const claim = await db.createOnce("histories", historyId, {
      userId: id,
      uniqueId: await generateHistoryUniqueId(),
      videoId: dedupeVideoId || null,
      coin: credited,
      type: historyType,
      date: new Date().toISOString(),
      ...(meta || {}),
    });
    if (!claim.created) {
      // A concurrent request already claimed this exact (user, video,
      // action) a moment ago — do not credit again.
      return {
        ok: false, reason: "ALREADY_REWARDED", credited: 0, limits,
        message: "Already rewarded for this video.",
        counts: snapshotCounts(user),
      };
    }
  }

  const incFields = {
    coin: credited,
    totalRewardCoin: credited,
    dailyEarningCoinsToday: credited,
  };
  if (bucketField) incFields[bucketField] = credited;
  if (countField) incFields[countField] = 1;

  const updatedUser = await db.incrementFields("users", id, incFields);

  if (credited > 0) {
    // Tasker Onboarding Commission (YP-TC): whoever referred this tasker
    // earns a % of every reward they earn, as an additional platform-funded
    // bonus — never deducted from the tasker's own payout. Awaited (this runs
    // on serverless functions — a detached promise can be killed before it
    // finishes) but its own errors never fail the tasker's own reward.
    await creditTaskerReferralCommission(id, credited).catch(() => {});
  }

  const merged = updatedUser || { ...user, ...incFields };
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

/**
 * Undo a previously-credited engagement reward (e.g. user un-likes a video).
 * Subtracts exactly what was credited, deletes the history row, and decrements
 * the daily count. Never drives a balance negative.
 */
async function reverseReward({ userId, videoId, historyType, countField }) {
  if (!userId) return { ok: false, reversed: 0 };
  const user = await db.findById("users", userId);
  if (!user) return { ok: false, reversed: 0 };
  const id = user._id || user.id;

  const hist = await db.findOne("histories", { userId: id, videoId, type: historyType });
  if (!hist) return { ok: false, reversed: 0 };

  // Atomic claim — two concurrent reversals of the SAME history record (a
  // double-tapped "unlike", or a retried request) must only subtract the
  // coins once, not once per call.
  const claim = await db.claimOnce("histories", hist._id || hist.id, "reversed");
  if (!claim.claimed) return { ok: false, reversed: 0 };

  const amt = Math.max(0, Number(hist.coin) || 0);
  const deltas = {
    coin: -amt,
    engagementRewardCoin: -amt,
    totalRewardCoin: -amt,
    dailyEarningCoinsToday: -amt,
  };
  if (countField) deltas[countField] = -1;

  await db.incrementFields("users", id, deltas);
  await db.delete("histories", hist._id || hist.id);
  return { ok: true, reversed: amt };
}

// Not reusing revenueSplit.service's resolveReferrer here: that module
// requires this one (for getCreatorRevenueShare), so requiring it back would
// create a circular dependency. Small enough to duplicate.
async function resolveReferrerId(userId) {
  try {
    const rec = await db.findOne("referralHistories", { referredUserId: String(userId) });
    if (rec && rec.referrerId) return String(rec.referrerId);
  } catch (e) { /* ignore */ }
  try {
    const u = await db.findById("users", userId);
    return u && u.referrerId ? String(u.referrerId) : null;
  } catch (e) {
    return null;
  }
}

async function creditTaskerReferralCommission(taskerId, taskerCoins) {
  const pct = num((global.settingJSON || {}).taskerEarningsReferralPercentage, 20);
  if (pct <= 0 || taskerCoins <= 0) return;
  const bonus = Math.round((taskerCoins * pct) / 100);
  if (bonus <= 0) return;

  const referrerId = await resolveReferrerId(taskerId);
  if (!referrerId || referrerId === String(taskerId)) return;

  const referrer = await db.findById("users", referrerId);
  if (!referrer || referrer.isBlock) return;

  await db.incrementFields("users", referrerId, {
    coin: bonus,
    referralRewardCoin: bonus,
    totalRewardCoin: bonus,
  });
  await db.create("histories", {
    userId: referrerId,
    uniqueId: await generateHistoryUniqueId(),
    coin: bonus,
    type: HISTORY_TYPE.TASKER_REFERRAL_COMMISSION,
    date: new Date().toISOString(),
    otherUserId: String(taskerId), // the tasker whose earnings generated this commission
  });
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
  getCreatorRevenueShare,
  creditReward,
  reverseReward,
  snapshotCounts,
};
