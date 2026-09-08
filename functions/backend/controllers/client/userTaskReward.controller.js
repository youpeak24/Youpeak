/**
 * YouPeak – Pure Firestore User Task & Reward Controller
 * Handles: Tier-based daily limits, Video Like/Comment Rewards, Ad Watch Rewards,
 * 2-Hour Watch-Time Milestone (500 coins), and Stage 2 Referral Check (100 min within 7 days).
 * 100% Pure Firestore (util/connection). No MongoDB/Mongoose dependencies.
 */

"use strict";

const db = require("../../util/connection");
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

// Helper to format today's date in YYYY-MM-DD (Asia/Kolkata timezone)
const getTodayDateStr = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    .toISOString()
    .slice(0, 10);
};

// Helper to check & reset daily counters if date has changed
const ensureDailyReset = async (user, todayStr) => {
  if (user.lastActivityDate !== todayStr) {
    const resetUpdates = {
      dailyEarningCoinsToday: 0,
      dailyAdCountToday: 0,
      dailyLikesToday: 0,
      dailyCommentsToday: 0,
      dailyDislikesToday: 0,
      totalCurrentWatchTime: 0,
      lastActivityDate: todayStr,
    };
    await db.update("users", user._id || user.id, resetUpdates);
    Object.assign(user, resetUpdates);
  }
};

/**
 * Get tier-based daily limits for a user.
 * Per YP-TC-2026-FINAL:
 *   Free:     20 Ads / 5 Likes  / 2 Comments  / 500 Coin Cap
 *   Bronze:   20 Ads / 10 Likes / 5 Comments  / 2,000 Coin Cap
 *   Silver:   20 Ads / 20 Likes / 10 Comments / 4,000 Coin Cap
 *   Gold:     20 Ads / 40 Likes / 20 Comments / 12,000 Coin Cap
 *   Platinum: 20 Ads / 60 Likes / 30 Comments / 16,667 Coin Cap
 */
const getTierLimits = async (user) => {
  const defaults = {
    maxAdsPerDay: 20,
    maxLikesPerDay: 5,
    maxCommentsPerDay: 2,
    dailyMaxCapInCoins: 500,
    likeCoins: 2,      // Per spec: Like Action = 2 Coins
    dislikeCoins: 2,   // Per spec: Unlike/Dislike = 2 Coins
    commentCoins: 5,   // Per spec: Comment = 5 Coins
    adCoins: 20,       // Per ad
  };

  if (!user.membershipTierId) return defaults;

  try {
    const tier = await db.findById("membershipTiers", user.membershipTierId);
    if (!tier) return defaults;

    const tierLimitMap = {
      1: { maxLikesPerDay: 5,  maxCommentsPerDay: 2,  dailyMaxCapInCoins: 500   }, // Free
      2: { maxLikesPerDay: 10, maxCommentsPerDay: 5,  dailyMaxCapInCoins: 2000  }, // Bronze
      3: { maxLikesPerDay: 20, maxCommentsPerDay: 10, dailyMaxCapInCoins: 4000  }, // Silver
      4: { maxLikesPerDay: 40, maxCommentsPerDay: 20, dailyMaxCapInCoins: 12000 }, // Gold
      5: { maxLikesPerDay: 60, maxCommentsPerDay: 30, dailyMaxCapInCoins: 16667 }, // Platinum
    };

    const levelLimits = tierLimitMap[tier.level] || tierLimitMap[1];

    return {
      maxAdsPerDay: tier.dailyAdLimit || 20,
      maxLikesPerDay: levelLimits.maxLikesPerDay,
      maxCommentsPerDay: levelLimits.maxCommentsPerDay,
      dailyMaxCapInCoins: tier.dailyEarningCapInCoins || levelLimits.dailyMaxCapInCoins,
      likeCoins: 2,
      dislikeCoins: 2,
      commentCoins: 5,
      adCoins: 20,
    };
  } catch (e) {
    return defaults;
  }
};

// 1. Reward Video Like (2 Coins per YP-TC-2026-FINAL)
exports.rewardVideoLike = async (req, res) => {
  try {
    const { userId, videoId } = req.body || {};
    if (!userId) {
      return res.status(200).json({ status: false, message: "Invalid User ID!" });
    }

    const todayStr = getTodayDateStr();
    const user = await db.findById("users", userId);

    if (!user || user.isBlock) {
      return res.status(200).json({ status: false, message: "User blocked or not found!" });
    }

    await ensureDailyReset(user, todayStr);

    const limits = await getTierLimits(user);
    const rewardCoins = limits.likeCoins;

    if (user.dailyLikesToday >= limits.maxLikesPerDay) {
      return res.status(200).json({
        status: false,
        message: `Daily like limit of ${limits.maxLikesPerDay} reached for your tier! Upgrade to earn more.`,
        dailyLikesToday: user.dailyLikesToday,
        maxLikesPerDay: limits.maxLikesPerDay,
      });
    }

    if (user.dailyEarningCoinsToday >= limits.dailyMaxCapInCoins) {
      return res.status(200).json({
        status: false,
        message: `Daily earning cap of ${limits.dailyMaxCapInCoins} coins reached for today!`,
        dailyEarningCoinsToday: user.dailyEarningCoinsToday,
      });
    }

    const actualCredit = Math.min(rewardCoins, limits.dailyMaxCapInCoins - user.dailyEarningCoinsToday);

    const userIdStr = user._id || user.id;
    const newCoin = (user.coin || 0) + actualCredit;
    const newEng = (user.engagementRewardCoin || 0) + actualCredit;
    const newTotal = (user.totalRewardCoin || 0) + actualCredit;
    const newDaily = (user.dailyEarningCoinsToday || 0) + actualCredit;
    const newLikes = (user.dailyLikesToday || 0) + 1;

    await db.update("users", userIdStr, {
      coin: newCoin,
      engagementRewardCoin: newEng,
      totalRewardCoin: newTotal,
      dailyEarningCoinsToday: newDaily,
      dailyLikesToday: newLikes,
    });

    const uniqueId = await generateHistoryUniqueId();
    await db.create("histories", {
      userId: userIdStr,
      uniqueId,
      coin: actualCredit,
      type: 7, // 7 = Video Like Reward
      date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    });

    return res.status(200).json({
      status: true,
      message: `Liked video! Earned ${actualCredit} coins.`,
      coinsEarned: actualCredit,
      dailyLikesToday: newLikes,
      maxLikesPerDay: limits.maxLikesPerDay,
      dailyEarningCoinsToday: newDaily,
      totalCoins: newCoin,
    });
  } catch (error) {
    console.error("Error rewarding video like:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 2. Reward Video Comment (5 Coins per YP-TC-2026-FINAL)
exports.rewardVideoComment = async (req, res) => {
  try {
    const { userId, videoId } = req.body || {};
    if (!userId) {
      return res.status(200).json({ status: false, message: "Invalid User ID!" });
    }

    const todayStr = getTodayDateStr();
    const user = await db.findById("users", userId);

    if (!user || user.isBlock) {
      return res.status(200).json({ status: false, message: "User blocked or not found!" });
    }

    await ensureDailyReset(user, todayStr);

    const limits = await getTierLimits(user);
    const rewardCoins = limits.commentCoins;

    if (user.dailyCommentsToday >= limits.maxCommentsPerDay) {
      return res.status(200).json({
        status: false,
        message: `Daily comment limit of ${limits.maxCommentsPerDay} reached for your tier! Upgrade to earn more.`,
        dailyCommentsToday: user.dailyCommentsToday,
        maxCommentsPerDay: limits.maxCommentsPerDay,
      });
    }

    if (user.dailyEarningCoinsToday >= limits.dailyMaxCapInCoins) {
      return res.status(200).json({
        status: false,
        message: `Daily earning cap of ${limits.dailyMaxCapInCoins} coins reached for today!`,
        dailyEarningCoinsToday: user.dailyEarningCoinsToday,
      });
    }

    const actualCredit = Math.min(rewardCoins, limits.dailyMaxCapInCoins - user.dailyEarningCoinsToday);

    const userIdStr = user._id || user.id;
    const newCoin = (user.coin || 0) + actualCredit;
    const newEng = (user.engagementRewardCoin || 0) + actualCredit;
    const newTotal = (user.totalRewardCoin || 0) + actualCredit;
    const newDaily = (user.dailyEarningCoinsToday || 0) + actualCredit;
    const newComments = (user.dailyCommentsToday || 0) + 1;

    await db.update("users", userIdStr, {
      coin: newCoin,
      engagementRewardCoin: newEng,
      totalRewardCoin: newTotal,
      dailyEarningCoinsToday: newDaily,
      dailyCommentsToday: newComments,
    });

    const uniqueId = await generateHistoryUniqueId();
    await db.create("histories", {
      userId: userIdStr,
      uniqueId,
      coin: actualCredit,
      type: 8, // 8 = Comment Reward
      date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    });

    return res.status(200).json({
      status: true,
      message: `Commented! Earned ${actualCredit} coins.`,
      coinsEarned: actualCredit,
      dailyCommentsToday: newComments,
      maxCommentsPerDay: limits.maxCommentsPerDay,
      dailyEarningCoinsToday: newDaily,
      totalCoins: newCoin,
    });
  } catch (error) {
    console.error("Error rewarding video comment:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 3. Reward Ad Watch (Max 20 Ads per day for ALL tiers per spec)
exports.rewardAdWatch = async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) {
      return res.status(200).json({ status: false, message: "Invalid User ID!" });
    }

    const todayStr = getTodayDateStr();
    const user = await db.findById("users", userId);

    if (!user || user.isBlock) {
      return res.status(200).json({ status: false, message: "User blocked or not found!" });
    }

    await ensureDailyReset(user, todayStr);

    const limits = await getTierLimits(user);

    if (user.dailyAdCountToday >= limits.maxAdsPerDay) {
      return res.status(200).json({
        status: false,
        message: `Daily ad watch limit of ${limits.maxAdsPerDay} ads reached for today!`,
        dailyAdCountToday: user.dailyAdCountToday,
        maxAdsPerDay: limits.maxAdsPerDay,
      });
    }

    if (user.dailyEarningCoinsToday >= limits.dailyMaxCapInCoins) {
      return res.status(200).json({
        status: false,
        message: `Daily earning cap of ${limits.dailyMaxCapInCoins} coins reached for today!`,
        dailyEarningCoinsToday: user.dailyEarningCoinsToday,
      });
    }

    const rewardCoins = limits.adCoins;
    const actualCredit = Math.min(rewardCoins, limits.dailyMaxCapInCoins - user.dailyEarningCoinsToday);

    const userIdStr = user._id || user.id;
    const newCoin = (user.coin || 0) + actualCredit;
    const newAdsReward = (user.adsRewardCoin || 0) + actualCredit;
    const newTotal = (user.totalRewardCoin || 0) + actualCredit;
    const newDaily = (user.dailyEarningCoinsToday || 0) + actualCredit;
    const newAdCount = (user.dailyAdCountToday || 0) + 1;

    await db.update("users", userIdStr, {
      coin: newCoin,
      adsRewardCoin: newAdsReward,
      totalRewardCoin: newTotal,
      dailyEarningCoinsToday: newDaily,
      dailyAdCountToday: newAdCount,
    });

    const uniqueId = await generateHistoryUniqueId();
    await db.create("histories", {
      userId: userIdStr,
      uniqueId,
      coin: actualCredit,
      type: 2, // 2 = Ad Watch Reward
      date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    });

    return res.status(200).json({
      status: true,
      message: `Watched Ad! Earned ${actualCredit} coins.`,
      coinsEarned: actualCredit,
      dailyAdCountToday: newAdCount,
      maxAdsPerDay: limits.maxAdsPerDay,
      dailyEarningCoinsToday: newDaily,
      dailyMaxCapInCoins: limits.dailyMaxCapInCoins,
      totalCoins: newCoin,
    });
  } catch (error) {
    console.error("Error rewarding ad watch:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 4. Get Daily Viewer Earning Status
exports.getDailyEarningStatus = async (req, res) => {
  try {
    const { userId } = req.query || {};
    if (!userId) {
      return res.status(200).json({ status: false, message: "Invalid User ID!" });
    }

    const todayStr = getTodayDateStr();
    const user = await db.findById("users", userId);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found!" });
    }

    await ensureDailyReset(user, todayStr);

    const limits = await getTierLimits(user);
    const coinToInrRate = 0.01; // 100 Coins = ₹1

    return res.status(200).json({
      status: true,
      message: "Daily earning status fetched successfully.",
      dailyEarningCoinsToday: user.dailyEarningCoinsToday || 0,
      dailyAdCountToday: user.dailyAdCountToday || 0,
      dailyLikesToday: user.dailyLikesToday || 0,
      dailyCommentsToday: user.dailyCommentsToday || 0,
      dailyMaxCapInCoins: limits.dailyMaxCapInCoins,
      maxAdsPerDay: limits.maxAdsPerDay,
      maxLikesPerDay: limits.maxLikesPerDay,
      maxCommentsPerDay: limits.maxCommentsPerDay,
      inrEarnedToday: ((user.dailyEarningCoinsToday || 0) * coinToInrRate).toFixed(2),
      coinToInrRate,
      totalCoins: user.coin || 0,
      totalInrValue: ((user.coin || 0) * coinToInrRate).toFixed(2),
    });
  } catch (error) {
    console.error("Error fetching daily status:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 5. Watch-Time Milestone Reward (500 Coins for 2 hours) + Stage 2 Referral Check (100 min within 7 days)
exports.checkWatchTimeMilestone = async (req, res) => {
  try {
    const { userId, sessionMinutes } = req.body || {};
    if (!userId || !sessionMinutes || isNaN(sessionMinutes) || sessionMinutes <= 0) {
      return res.status(200).json({ status: false, message: "Invalid parameters!" });
    }

    const todayStr = getTodayDateStr();
    const user = await db.findById("users", userId);

    if (!user || user.isBlock) {
      return res.status(200).json({ status: false, message: "User blocked or not found!" });
    }

    await ensureDailyReset(user, todayStr);

    const WATCH_TIME_MILESTONE_MINUTES = 120; // 2 hours
    const MILESTONE_REWARD_COINS = 500;

    const prevTotalMinutesToday = user.totalCurrentWatchTime || 0;
    const newTotalMinutesToday = prevTotalMinutesToday + Number(sessionMinutes);
    const newTotalWatchTime = (user.totalWatchTime || 0) + Number(sessionMinutes);

    const userIdStr = user._id || user.id;
    let newCoin = user.coin || 0;
    let newEng = user.engagementRewardCoin || 0;
    let newTotalReward = user.totalRewardCoin || 0;
    let newDailyEarning = user.dailyEarningCoinsToday || 0;

    // Check 2-hour milestone
    const crossedMilestone =
      prevTotalMinutesToday < WATCH_TIME_MILESTONE_MINUTES &&
      newTotalMinutesToday >= WATCH_TIME_MILESTONE_MINUTES;

    let milestoneCoinsAwarded = 0;
    if (crossedMilestone) {
      const limits = await getTierLimits(user);
      milestoneCoinsAwarded = Math.min(
        MILESTONE_REWARD_COINS,
        Math.max(0, limits.dailyMaxCapInCoins - newDailyEarning)
      );

      if (milestoneCoinsAwarded > 0) {
        newCoin += milestoneCoinsAwarded;
        newEng += milestoneCoinsAwarded;
        newTotalReward += milestoneCoinsAwarded;
        newDailyEarning += milestoneCoinsAwarded;

        const uniqueId = await generateHistoryUniqueId();
        await db.create("histories", {
          userId: userIdStr,
          uniqueId,
          coin: milestoneCoinsAwarded,
          type: 9, // 9 = Watch Time Milestone Reward
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        });
      }
    }

    await db.update("users", userIdStr, {
      totalCurrentWatchTime: newTotalMinutesToday,
      totalWatchTime: newTotalWatchTime,
      coin: newCoin,
      engagementRewardCoin: newEng,
      totalRewardCoin: newTotalReward,
      dailyEarningCoinsToday: newDailyEarning,
    });

    // Stage 2 Referral Check: if this user was referred, check if they've crossed 100 min total within 7 days
    const STAGE2_WATCH_MINUTES = 100;
    const STAGE2_COINS = 10000; // ₹100 = 10,000 coins

    try {
      if (user.isReferral) {
        const referralRecord = await db.findOne("referralHistories", {
          referredUserId: userIdStr,
          stage1Completed: true,
          stage2Completed: false,
        });

        if (referralRecord) {
          const deadline = referralRecord.stage2DeadlineAt ? new Date(referralRecord.stage2DeadlineAt) : null;
          const isExpired = deadline && new Date() > deadline;

          if (isExpired) {
            await db.update("referralHistories", referralRecord._id || referralRecord.id, {
              status: "EXPIRED",
            });
          } else if (newTotalWatchTime >= STAGE2_WATCH_MINUTES) {
            const referrer = await db.findById("users", referralRecord.referrerId);
            if (referrer && !referrer.isBlock) {
              const referrerIdStr = referrer._id || referrer.id;
              const refNewCoin = (referrer.coin || 0) + STAGE2_COINS;
              const refNewRefCoins = (referrer.referralRewardCoin || 0) + STAGE2_COINS;
              const refNewTotalReward = (referrer.totalRewardCoin || 0) + STAGE2_COINS;

              await db.update("users", referrerIdStr, {
                coin: refNewCoin,
                referralRewardCoin: refNewRefCoins,
                totalRewardCoin: refNewTotalReward,
              });

              const stage2UniqueId = await generateHistoryUniqueId();
              await db.create("histories", {
                userId: referrerIdStr,
                uniqueId: stage2UniqueId,
                coin: STAGE2_COINS,
                type: 10, // 10 = Stage 2 Referral Reward
                date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
              });

              await db.update("referralHistories", referralRecord._id || referralRecord.id, {
                stage2Completed: true,
                stage2CompletedAt: new Date().toISOString(),
                stage2RewardCoins: STAGE2_COINS,
                totalRewardCoinsGiven: (referralRecord.totalRewardCoinsGiven || 0) + STAGE2_COINS,
                status: "STAGE2_DONE",
              });
            }
          }
        }
      }
    } catch (stage2Err) {
      console.error("Stage 2 referral check error:", stage2Err.message);
    }

    return res.status(200).json({
      status: true,
      milestoneReached: crossedMilestone,
      message: crossedMilestone ? `🎉 2-Hour Watch-Time Milestone! Earned ${milestoneCoinsAwarded} bonus coins.` : "Watch time updated.",
      coinsEarned: milestoneCoinsAwarded,
      totalWatchMinutesToday: newTotalMinutesToday,
      minutesUntilMilestone: Math.max(0, WATCH_TIME_MILESTONE_MINUTES - newTotalMinutesToday),
      totalCoins: newCoin,
    });
  } catch (error) {
    console.error("Error checking watch time milestone:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
