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
const {
  HISTORY_TYPE,
  ensureDailyReset,
  getLimits,
  creditReward,
  snapshotCounts,
} = require("../../util/rewardEngine");
const { recordWatchProgress } = require("../../util/watchLedger.service");
const { lockMessage } = require("../../util/taskSecurity.service");

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

// 5. Watch-time milestone (500 coins for 2h) + Stage-2 referral check.
// Older per-video report from installed app builds; newer builds send the
// playback heartbeat (client/watch/heartbeat). Both credit watch time through
// util/watchLedger.service.js, which never credits more than the wall-clock
// time since the user's previous report.
exports.checkWatchTimeMilestone = async (req, res) => {
  try {
    const userId = (req.body && req.body.userId) || req.query.userId;
    const sessionMinutes = Number((req.body && req.body.sessionMinutes) ?? req.query.sessionMinutes);
    if (!userId || !Number.isFinite(sessionMinutes) || sessionMinutes <= 0) {
      return res.status(200).json({ status: false, message: "Invalid parameters!" });
    }

    const user = await db.findById("users", userId);
    if (!user || user.isBlock) {
      return res.status(200).json({ status: false, message: "User blocked or not found!" });
    }

    const progress = await recordWatchProgress(user, Math.min(sessionMinutes, 180) * 60, { maxSeconds: 180 * 60 });
    if (!progress.ok) {
      return res.status(200).json({
        status: false,
        code: progress.reason,
        message: progress.reason === "SECURITY_LOCK" ? lockMessage(progress.lock.reasons) : "User blocked or not found!",
      });
    }

    return res.status(200).json({
      status: true,
      milestoneReached: progress.milestoneReached,
      message: progress.milestoneReached
        ? (progress.milestoneCoins > 0
            ? `2-Hour watch-time milestone! Earned ${progress.milestoneCoins} bonus coins.`
            : "2-hour milestone reached — today's earning cap is already met.")
        : "Watch time updated.",
      coinsEarned: progress.milestoneCoins,
      totalWatchMinutesToday: progress.watchMinutesToday,
      minutesUntilMilestone: progress.minutesUntilMilestone,
      totalCoins: progress.coin,
      tierUpgraded: progress.tierUpgraded,
      newTierName: progress.newTierName,
    });
  } catch (error) {
    console.error("Error checking watch time milestone:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// Shape a creditReward() result into the response the app expects
function shapeRewardResponse(result, which) {
  if (!result.ok) {
    return { status: false, code: result.reason, message: result.message, ...(result.counts || {}) };
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
