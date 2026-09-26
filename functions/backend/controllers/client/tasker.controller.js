/**
 * YouPeak – Tasker dashboard.
 *
 * GET client/tasker/dashboard — everything the app's Tasker dashboard shows,
 * computed from the same functions that enforce it (getLimits, the watch
 * ledger's counters, the withdrawal rules), for the signed-in user.
 *
 * Lifetime watch hours are cumulative and never reset on level-up; progress
 * to the next level is lifetimeHours / nextLevelTargetHours × 100.
 */
"use strict";

const db = require("../../util/connection");
const { ensureDailyReset, getLimits, snapshotCounts, todayStr } = require("../../util/rewardEngine");
const { taskerLadderPosition, coinsPerInr } = require("../../util/systemConfig.service");
const { taskLockState, lockMessage } = require("../../util/taskSecurity.service");
const { accessGateFor } = require("../../util/accessGate");
const referralService = require("../../util/referral.service");

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const round = (n, dp = 2) => Number(n.toFixed(dp));

function monthlyCapInr(tier, limits, rate) {
  return num(tier && tier.monthlyIncomeCapInINR, Math.round((num(limits.dailyEarningCapInCoins) / rate) * 30));
}

/**
 * The tier's monthly-income cap limits TASKER earnings. Creators (ad /
 * unlock / boost revenue) and Digital Partners (referral payouts) are paid
 * into the same balance, and capping them at a Tasker figure (₹300 on the
 * free tier) would block legitimate payouts, so they're exempt.
 */
async function isTaskerCapExempt(user, userId) {
  if (user.isDigitalPartner === true || user.activeCreatorTierId) return true;
  try {
    return !!(await db.findOne("revenueLedger", { creatorId: String(userId) }));
  } catch (e) {
    return false;
  }
}

async function payoutCapInr(user, userId, limits, tier, rate) {
  const s = global.settingJSON || {};
  if (s.enforceTierMonthlyWithdrawalCap === false) return null;
  if (await isTaskerCapExempt(user, userId)) return null;
  return monthlyCapInr(tier, limits, rate);
}

async function payoutSummary(userId) {
  const requests = await db.find("withDrawRequests", { userId });
  const completed = requests.filter((r) => Number(r.status) === 2).length;
  const pending = requests.some((r) => Number(r.status) === 1);
  return { completed, pending };
}

async function milestone2Summary(userId, user) {
  const rec = await db.findOne("referralHistories", { referredUserId: userId });
  if (!rec) return { tracked: false };
  const c = referralService.cfg();
  const deadline = rec.stage2DeadlineAt ? new Date(rec.stage2DeadlineAt).getTime() : null;
  const achieved = rec.stage2Completed === true;
  const expired = !achieved && (rec.status === "EXPIRED" || (deadline !== null && Date.now() > deadline));
  return {
    tracked: true,
    referredByPartnerId: String(rec.referrerId || ""),
    registeredAt: rec.createdAt || rec.stage1CompletedAt || null,
    deadlineAt: rec.stage2DeadlineAt || null,
    cumulativeWatchMinutes: num(user.totalWatchTime),
    targetMinutes: c.stage2WatchMinutes,
    rewardCoins: c.stage2Coins,
    achieved,
    expired,
    flagged: rec.status === "FLAGGED_SUSPICIOUS",
  };
}

exports.dashboard = async (req, res) => {
  try {
    const user = req.appUser;
    const userId = req.appUserId;
    const s = global.settingJSON || {};
    const rate = coinsPerInr(s);

    await ensureDailyReset(user);
    const [limits, position, payouts, milestone2, bonusRow] = await Promise.all([
      getLimits(user),
      taskerLadderPosition(user),
      payoutSummary(userId),
      milestone2Summary(userId, user),
      db.findById("histories", `hist_dedupe_${userId}_${todayStr()}_watchMilestone`),
    ]);
    const counts = snapshotCounts(user);
    const { current, next, rank } = position;

    const lifetimeSeconds = num(user.totalWatchTime) * 60 + num(user.watchSecondsCarry);
    const lifetimeHours = lifetimeSeconds / 3600;
    const targetHours = next ? num(next.watchHoursToUpgrade) : num(current && current.watchHoursToUpgrade);
    const progressPercent = next && targetHours > 0 ? Math.min(100, (lifetimeHours / targetHours) * 100) : 100;

    const earned = counts.dailyEarningCoinsToday;
    const cap = num(limits.dailyEarningCapInCoins);
    const lock = taskLockState(user);
    const isFirstWithdrawal = payouts.completed === 0;
    const trustHookMinInr = num(s.firstWithdrawalMinimumInr, 100);
    const standardMinInr = num(s.minWithdrawalRequestedAmount, 500);

    return res.status(200).json({
      status: true,
      tier: {
        id: current ? String(current._id || current.id) : null,
        rank,
        level: num(current && current.level, 1),
        name: (current && current.tierName) || limits.tierName || "Free Tasker",
        isTopTier: !next,
      },
      nextTier: next
        ? { id: String(next._id || next.id), name: next.tierName, watchHoursRequired: num(next.watchHoursToUpgrade), membershipPriceInr: num(next.membershipPrice) }
        : null,
      today: {
        date: todayStr(),
        earnedCoins: earned,
        capCoins: cap,
        capReached: earned >= cap,
        ads: { done: counts.dailyAdCountToday, limit: num(limits.maxAdsPerDay) },
        likes: { done: counts.dailyLikesToday, limit: num(limits.maxLikesPerDay) },
        comments: { done: counts.dailyCommentsToday, limit: num(limits.maxCommentsPerDay) },
        watch: {
          minutes: num(user.totalCurrentWatchTime),
          targetMinutes: num(limits.minWatchMinutesForEngagementReward, 120),
          bonusCoins: num(limits.reward.engagementWatch, 500),
          bonusClaimed: !!bonusRow,
        },
      },
      lifetime: {
        watchMinutes: num(user.totalWatchTime),
        watchHours: round(lifetimeHours, 2),
        targetHours,
        progressPercent: round(progressPercent, 1),
      },
      wallet: {
        coins: num(user.coin),
        coinsInr: round(num(user.coin) / rate, 2),
        withdrawableInr: round(num(user.totalEarningAmount), 2),
        pendingReferralCoins: num(user.pendingReferralCoin),
        coinsPerInr: rate,
      },
      payout: {
        completedPayouts: payouts.completed,
        hasPendingRequest: payouts.pending,
        isFirstWithdrawal,
        minThresholdInr: isFirstWithdrawal ? trustHookMinInr : standardMinInr,
        trustHookMinInr,
        standardMinInr,
        monthlyCapInr: await payoutCapInr(user, userId, limits, current, rate),
      },
      milestone2,
      access: accessGateFor(user),
      security: {
        taskingLocked: lock.locked,
        reasons: lock.reasons,
        message: lock.locked ? lockMessage(lock.reasons) : null,
        attestedAt: lock.attestedAt,
      },
    });
  } catch (error) {
    console.error("tasker dashboard error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

exports.payoutCapInr = payoutCapInr;
