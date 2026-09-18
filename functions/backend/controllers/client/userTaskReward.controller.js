/**
 * YouPeak – User Task & Reward Controller
 * Video Like / Comment / Ad-watch rewards, the 2-hour watch-time milestone
 * (500 coins) and the Stage-2 referral check (100 min within 7 days).
 *
 * All caps + coin amounts come from util/rewardEngine (single source of truth).
 * 100% Firestore.
 */
"use strict";

const db = require("../../util/connection");
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");
const {
  HISTORY_TYPE,
  todayStr,
  ensureDailyReset,
  getLimits,
  checkTaskerWatchHourUpgrade,
  creditReward,
  snapshotCounts,
} = require("../../util/rewardEngine");
const referralService = require("../../util/referral.service");

// 1. Reward Video Like
exports.rewardVideoLike = async (req, res) => {
  try {
    const userId = (req.body && req.body.userId) || req.query.userId;
    const result = await creditReward({
      userId,
      kind: "like",
      historyType: HISTORY_TYPE.VIDEO_LIKE,
      countField: "dailyLikesToday",
      capField: "maxLikesPerDay",
      meta: { videoId: (req.body && req.body.videoId) || "" },
    });
    return res.status(200).json(shapeRewardResponse(result, { likes: true }));
  } catch (error) {
    console.error("Error rewarding video like:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 2. Reward Video Comment
exports.rewardVideoComment = async (req, res) => {
  try {
    const userId = (req.body && req.body.userId) || req.query.userId;
    const result = await creditReward({
      userId,
      kind: "comment",
      historyType: HISTORY_TYPE.VIDEO_COMMENT,
      countField: "dailyCommentsToday",
      capField: "maxCommentsPerDay",
      meta: { videoId: (req.body && req.body.videoId) || "" },
    });
    return res.status(200).json(shapeRewardResponse(result, { comments: true }));
  } catch (error) {
    console.error("Error rewarding video comment:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 3. Reward Ad Watch (max 20 / day, all tiers)
exports.rewardAdWatch = async (req, res) => {
  try {
    const userId = (req.body && req.body.userId) || req.query.userId;
    const result = await creditReward({
      userId,
      kind: "ad",
      historyType: HISTORY_TYPE.AD_WATCH,
      countField: "dailyAdCountToday",
      capField: "maxAdsPerDay",
      meta: {
        adId: (req.body && req.body.adId) || "",
        claimedByClient: Number(req.body && req.body.coinEarnedFromAd) || 0,
      },
    });
    return res.status(200).json(shapeRewardResponse(result, { ads: true }));
  } catch (error) {
    console.error("Error rewarding ad watch:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 4. Daily earning status
exports.getDailyEarningStatus = async (req, res) => {
  try {
    const userId = req.query.userId || (req.body && req.body.userId);
    if (!userId) return res.status(200).json({ status: false, message: "Invalid User ID!" });

    const user = await db.findById("users", userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found!" });

    await ensureDailyReset(user);
    const limits = await getLimits(user);
    const counts = snapshotCounts(user);

    return res.status(200).json({
      status: true,
      message: "Daily earning status fetched successfully.",
      ...counts,
      dailyMaxCapInCoins: limits.dailyEarningCapInCoins,
      maxAdsPerDay: limits.maxAdsPerDay,
      maxLikesPerDay: limits.maxLikesPerDay,
      maxCommentsPerDay: limits.maxCommentsPerDay,
      coinToInrRate: limits.coinToInrRate,
      inrEarnedToday: (counts.dailyEarningCoinsToday * limits.coinToInrRate).toFixed(2),
      totalCoins: user.coin || 0,
      totalInrValue: ((user.coin || 0) * limits.coinToInrRate).toFixed(2),
      tierName: limits.tierName || "Free",
    });
  } catch (error) {
    console.error("Error fetching daily status:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 5. Watch-time milestone (500 coins for 2h) + Stage-2 referral check
exports.checkWatchTimeMilestone = async (req, res) => {
  try {
    const userId = (req.body && req.body.userId) || req.query.userId;
    let sessionMinutes = Number((req.body && req.body.sessionMinutes) ?? req.query.sessionMinutes);
    if (!userId || !Number.isFinite(sessionMinutes) || sessionMinutes <= 0) {
      return res.status(200).json({ status: false, message: "Invalid parameters!" });
    }
    sessionMinutes = Math.min(sessionMinutes, 180);

    const user = await db.findById("users", userId);
    if (!user || user.isBlock) {
      return res.status(200).json({ status: false, message: "User blocked or not found!" });
    }

    await ensureDailyReset(user);
    const limits = await getLimits(user);
    const userIdStr = user._id || user.id;

    const milestoneMin = limits.minWatchMinutesForEngagementReward; // 120
    const prevMinutesToday = user.totalCurrentWatchTime || 0;

    // Atomic accumulation — two concurrent watch-time reports (a retried
    // request, or this same milestone being polled from more than one
    // screen) must not lose each other's minutes.
    const accumulated = await db.incrementFields("users", userIdStr, {
      totalCurrentWatchTime: sessionMinutes,
      totalWatchTime: sessionMinutes,
    });
    const newMinutesToday = accumulated ? (accumulated.totalCurrentWatchTime || 0) : prevMinutesToday + sessionMinutes;
    const newTotalWatchTime = accumulated ? (accumulated.totalWatchTime || 0) : (user.totalWatchTime || 0) + sessionMinutes;
    const crossedMilestone = prevMinutesToday < milestoneMin && newMinutesToday >= milestoneMin;

    let milestoneCoins = 0;
    if (crossedMilestone) {
      const dailyEarningSoFar = accumulated ? (accumulated.dailyEarningCoinsToday || 0) : (user.dailyEarningCoinsToday || 0);
      const room = limits.dailyEarningCapInCoins - dailyEarningSoFar;
      milestoneCoins = Math.max(0, Math.min(limits.reward.engagementWatch, room));
      if (milestoneCoins > 0) {
        // Atomic once-per-day claim — SAME key format as
        // user.controller.js's handleEngagementVideoWatchReward, which
        // credits this identical 2h/500-coin milestone via a different
        // route. Without a shared key, hitting both endpoints the same day
        // would pay out twice.
        const dedupeId = `hist_dedupe_${userIdStr}_${todayStr()}_watchMilestone`;
        const claim = await db.createOnce("histories", dedupeId, {
          userId: userIdStr,
          uniqueId: await generateHistoryUniqueId(),
          coin: milestoneCoins,
          type: HISTORY_TYPE.WATCH_TIME_MILESTONE,
          date: new Date().toISOString(),
        });
        if (claim.created) {
          await db.incrementFields("users", userIdStr, {
            coin: milestoneCoins,
            engagementRewardCoin: milestoneCoins,
            totalRewardCoin: milestoneCoins,
            dailyEarningCoinsToday: milestoneCoins,
          });
        } else {
          milestoneCoins = 0; // already claimed today (this endpoint or the other one)
        }
      }
    }

    // Stage-2 referral: referred user hits the watch-minute threshold in-window
    try {
      if (user.isReferral) {
        await referralService.completeStage2({
          referredUserId: userIdStr,
          totalWatchMinutes: newTotalWatchTime,
        });
      }
    } catch (stage2Err) {
      console.error("Stage 2 referral check error:", stage2Err.message);
    }

    // Dual Level Upgrade Mechanism (V9 §1.6) — free tier progression via
    // cumulative watch hours, alongside the paid Starter Pass "instant skip".
    let upgradedTier = null;
    try {
      upgradedTier = await checkTaskerWatchHourUpgrade(user, newTotalWatchTime);
    } catch (upgradeErr) {
      console.error("Tasker watch-hour upgrade check error:", upgradeErr.message);
    }

    const finalUser = (milestoneCoins > 0 || upgradedTier) ? await db.findById("users", userIdStr) : accumulated;

    return res.status(200).json({
      status: true,
      milestoneReached: crossedMilestone,
      message: crossedMilestone
        ? (milestoneCoins > 0
            ? `2-Hour watch-time milestone! Earned ${milestoneCoins} bonus coins.`
            : "2-hour milestone reached — today's earning cap is already met.")
        : "Watch time updated.",
      coinsEarned: milestoneCoins,
      totalWatchMinutesToday: newMinutesToday,
      minutesUntilMilestone: Math.max(0, milestoneMin - newMinutesToday),
      totalCoins: finalUser ? (finalUser.coin || 0) : (user.coin || 0) + milestoneCoins,
      tierUpgraded: !!upgradedTier,
      newTierName: upgradedTier ? upgradedTier.tierName : undefined,
    });
  } catch (error) {
    console.error("Error checking watch time milestone:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// Shape a creditReward() result into the response the app expects
function shapeRewardResponse(result, which) {
  if (!result.ok) {
    return { status: false, message: result.message, ...(result.counts || {}) };
  }
  const c = result.counts;
  const out = {
    status: true,
    message: result.message,
    coinsEarned: result.credited,
    data: { coin: result.user.coin },
    dailyEarningCoinsToday: c.dailyEarningCoinsToday,
    dailyMaxCapInCoins: result.limits.dailyEarningCapInCoins,
    totalCoins: result.user.coin,
  };
  if (which.ads) { out.dailyAdCountToday = c.dailyAdCountToday; out.maxAdsPerDay = result.limits.maxAdsPerDay; }
  if (which.likes) { out.dailyLikesToday = c.dailyLikesToday; out.maxLikesPerDay = result.limits.maxLikesPerDay; }
  if (which.comments) { out.dailyCommentsToday = c.dailyCommentsToday; out.maxCommentsPerDay = result.limits.maxCommentsPerDay; }
  return out;
}
