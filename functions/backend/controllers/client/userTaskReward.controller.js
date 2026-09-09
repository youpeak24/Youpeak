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
  creditReward,
  snapshotCounts,
} = require("../../util/rewardEngine");

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
    const newMinutesToday = prevMinutesToday + sessionMinutes;
    const newTotalWatchTime = (user.totalWatchTime || 0) + sessionMinutes;
    const crossedMilestone = prevMinutesToday < milestoneMin && newMinutesToday >= milestoneMin;

    const updates = {
      totalCurrentWatchTime: newMinutesToday,
      totalWatchTime: newTotalWatchTime,
    };

    let milestoneCoins = 0;
    if (crossedMilestone) {
      const room = limits.dailyEarningCapInCoins - (user.dailyEarningCoinsToday || 0);
      milestoneCoins = Math.max(0, Math.min(limits.reward.engagementWatch, room));
      if (milestoneCoins > 0) {
        updates.coin = (user.coin || 0) + milestoneCoins;
        updates.engagementRewardCoin = (user.engagementRewardCoin || 0) + milestoneCoins;
        updates.totalRewardCoin = (user.totalRewardCoin || 0) + milestoneCoins;
        updates.dailyEarningCoinsToday = (user.dailyEarningCoinsToday || 0) + milestoneCoins;
      }
    }

    await db.update("users", userIdStr, updates);

    if (milestoneCoins > 0) {
      await db.create("histories", {
        userId: userIdStr,
        uniqueId: await generateHistoryUniqueId(),
        coin: milestoneCoins,
        type: HISTORY_TYPE.WATCH_TIME_MILESTONE,
        date: new Date().toISOString(),
      });
    }

    // Stage-2 referral: referred user hits 100 watch minutes within the window
    try {
      await maybeCompleteStage2Referral(user, newTotalWatchTime);
    } catch (stage2Err) {
      console.error("Stage 2 referral check error:", stage2Err.message);
    }

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
      totalCoins: (user.coin || 0) + milestoneCoins,
    });
  } catch (error) {
    console.error("Error checking watch time milestone:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

async function maybeCompleteStage2Referral(user, newTotalWatchTime) {
  if (!user.isReferral) return;
  const userIdStr = user._id || user.id;

  const referralRecord = await db.findOne("referralHistories", {
    referredUserId: userIdStr,
    stage1Completed: true,
    stage2Completed: false,
  });
  if (!referralRecord) return;

  const s = global.settingJSON || {};
  const stage2Minutes = Number(s.referralStage2WatchMinutes) || 100;
  const stage2Coins = Number(s.referralStage2Coins) || 10000; // ₹100

  const deadline = referralRecord.stage2DeadlineAt ? new Date(referralRecord.stage2DeadlineAt) : null;
  if (deadline && new Date() > deadline) {
    await db.update("referralHistories", referralRecord._id || referralRecord.id, { status: "EXPIRED" });
    return;
  }
  if (newTotalWatchTime < stage2Minutes) return;

  const referrer = await db.findById("users", referralRecord.referrerId);
  if (!referrer || referrer.isBlock) return;
  const referrerIdStr = referrer._id || referrer.id;

  await db.update("users", referrerIdStr, {
    coin: (referrer.coin || 0) + stage2Coins,
    referralRewardCoin: (referrer.referralRewardCoin || 0) + stage2Coins,
    totalRewardCoin: (referrer.totalRewardCoin || 0) + stage2Coins,
  });
  await db.create("histories", {
    userId: referrerIdStr,
    uniqueId: await generateHistoryUniqueId(),
    coin: stage2Coins,
    type: HISTORY_TYPE.STAGE2_REFERRAL,
    date: new Date().toISOString(),
  });
  await db.update("referralHistories", referralRecord._id || referralRecord.id, {
    stage2Completed: true,
    stage2CompletedAt: new Date().toISOString(),
    stage2RewardCoins: stage2Coins,
    totalRewardCoinsGiven: (referralRecord.totalRewardCoinsGiven || 0) + stage2Coins,
    status: "STAGE2_DONE",
  });
}

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
