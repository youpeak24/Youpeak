/**
 * Referral engine — YouPeak Peak Partner model.
 *
 *   Stage 1  ₹100 (10,000 coins)  when the referral code is applied by a new,
 *            OTP-verified user. Held for `referralStage1HoldHours` (24h).
 *   Stage 2  ₹100 (10,000 coins)  when the referred user reaches
 *            `referralStage2WatchMinutes` (100) within
 *            `referralStage2WindowDays` (7). Held `referralStage2HoldHours` (48h).
 *
 *   Paid-tier bonus (YP-TC §1.5): when a referred user buys a paid tasker/creator
 *   pass, the referrer gets `paidTierReferralPercentage` (10%) of the price, as
 *   coins.
 *
 * Held coins sit in user.pendingReferralCoin until the cron
 * (releaseHeldReferrals) moves them to the spendable `coin` balance.
 *
 * Anti-fraud: one referral per referred device/IP; per-day cap per referrer;
 * fraud-risk hook. Bot / VPN detection is enforced elsewhere (fraud engine).
 */
"use strict";

const db = require("./connection");
const { generateHistoryUniqueId } = require("./generateHistoryUniqueId");
const { HISTORY_TYPE, todayStr } = require("./rewardEngine");

let evaluateFraudRisk = async () => null;
try {
  ({ evaluateFraudRisk } = require("./fraudDetection.service"));
} catch (e) { /* optional */ }

const HISTORY_TYPE_STAGE1_REFERRAL = 5.1; // stored numerically; distinct from checkin(5)

function cfg() {
  const s = global.settingJSON || {};
  const n = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
  return {
    stage1Coins: n(s.referralStage1Coins, 10000),
    stage2Coins: n(s.referralStage2Coins, 10000),
    stage1HoldHours: n(s.referralStage1HoldHours, 24),
    stage2HoldHours: n(s.referralStage2HoldHours, 48),
    stage2WatchMinutes: n(s.referralStage2WatchMinutes, 100),
    stage2WindowDays: n(s.referralStage2WindowDays, 7),
    maxReferralsPerDay: n(s.maxReferralsPerDayPerUser, 20),
    deviceDedup: s.referralDeviceDedup !== false,
    paidTierPct: n(s.paidTierReferralPercentage, 10),
  };
}

async function addPending(userId, coins) {
  const u = await db.findById("users", userId);
  if (!u) return null;
  await db.update("users", u._id || u.id, {
    pendingReferralCoin: (u.pendingReferralCoin || 0) + coins,
  });
  return u;
}

// ── Stage 1: apply a referral code ───────────────────────────────────────────
async function applyReferralCode({ referredUserId, referralCode, ipAddress = "" }) {
  if (!referredUserId || !referralCode) {
    return { ok: false, message: "userId and referralCode are required." };
  }

  const user = await db.findById("users", referredUserId);
  if (!user) return { ok: false, message: "User not found." };
  if (user.referralApplied) return { ok: false, message: "Referral code already applied." };

  // New-user guard: must not already be an established account.
  const isNew = user.isNewUser !== false && (user.totalRewardCoin || 0) <= (user.loginRewardCoin || 0) + 5000;
  if (!isNew) {
    return { ok: false, message: "Referral codes can only be applied by new accounts." };
  }

  const referrer = await db.findOne("users", { referralCode: String(referralCode).trim() });
  if (!referrer) return { ok: false, message: "Invalid referral code." };
  const referrerId = String(referrer._id || referrer.id);
  if (referrerId === String(referredUserId)) {
    return { ok: false, message: "You cannot use your own referral code." };
  }
  if (referrer.isBlock) return { ok: false, message: "This referral code is not active." };

  const c = cfg();
  const deviceId = user.identity || "";

  // ── Anti-fraud checks ──
  let flaggedReason = null;

  if (c.deviceDedup && deviceId) {
    const sameDevice = await db.findOne("referralHistories", { referredDeviceId: deviceId });
    if (sameDevice) flaggedReason = "DUPLICATE_DEVICE";
  }
  if (!flaggedReason && ipAddress) {
    const all = await db.find("referralHistories", { referrerId });
    const sameIpToday = all.filter((r) => r.referredIp === ipAddress).length;
    if (sameIpToday >= 3) flaggedReason = "MULTIPLE_SAME_IP";
  }
  if (!flaggedReason) {
    const t = todayStr();
    const todaysReferrals = (await db.find("referralHistories", { referrerId }))
      .filter((r) => String(r.createdAt || "").slice(0, 10) === t).length;
    if (todaysReferrals >= c.maxReferralsPerDay) flaggedReason = "DAILY_CAP_EXCEEDED";
  }

  const now = Date.now();
  const record = {
    _id: `ref_${now}_${Math.floor(Math.random() * 1e6)}`,
    referrerId,
    referredUserId: String(referredUserId),
    referralCode: String(referralCode).trim(),
    referredDeviceId: deviceId,
    referredIp: ipAddress,
    ipAddress,
    stage1Completed: true,
    stage1CompletedAt: new Date().toISOString(),
    stage1RewardCoins: c.stage1Coins,
    stage1HeldUntil: new Date(now + c.stage1HoldHours * 3600e3).toISOString(),
    stage1Released: false,
    stage2Completed: false,
    stage2RewardCoins: 0,
    stage2DeadlineAt: new Date(now + c.stage2WindowDays * 86400e3).toISOString(),
    stage2Released: false,
    totalRewardCoinsGiven: 0,
    status: flaggedReason ? "FLAGGED_SUSPICIOUS" : "STAGE1_DONE",
    flaggedReason: flaggedReason || null,
    createdAt: new Date().toISOString(),
  };
  await db.create("referralHistories", record, record._id);

  // Mark the referred user
  await db.update("users", referredUserId, {
    referralApplied: true,
    isReferral: true,
    referrerId,
    isNewUser: false,
  });

  if (flaggedReason) {
    try {
      await evaluateFraudRisk({
        userId: referrerId,
        riskType: "SUSPICIOUS_REFERRAL_FARMING",
        details: `Referral ${record._id} flagged: ${flaggedReason}`,
        ipAddress,
      });
    } catch (e) { /* ignore */ }
    return {
      ok: true,
      flagged: true,
      message: "Referral recorded but held for review (suspicious activity).",
      stage1CoinsPending: 0,
    };
  }

  // Credit Stage-1 coins to the referrer's PENDING balance (released by cron).
  await addPending(referrerId, c.stage1Coins);
  await db.update("users", referrerId, { referralCount: (referrer.referralCount || 0) + 1 });

  return {
    ok: true,
    flagged: false,
    message: `Referral applied. ₹${(c.stage1Coins * 0.01).toFixed(0)} (${c.stage1Coins} coins) pending for the referrer — released after ${c.stage1HoldHours}h.`,
    stage1CoinsPending: c.stage1Coins,
    holdHours: c.stage1HoldHours,
  };
}

// ── Stage 2: referred user hit the watch-time threshold ─────────────────────
async function completeStage2({ referredUserId, totalWatchMinutes }) {
  if (!referredUserId) return { ok: false };
  const rec = await db.findOne("referralHistories", {
    referredUserId: String(referredUserId),
    stage1Completed: true,
    stage2Completed: false,
  });
  if (!rec || rec.status === "FLAGGED_SUSPICIOUS") return { ok: false };

  const c = cfg();
  const deadline = rec.stage2DeadlineAt ? new Date(rec.stage2DeadlineAt).getTime() : null;
  if (deadline && Date.now() > deadline) {
    await db.update("referralHistories", rec._id || rec.id, { status: "EXPIRED" });
    return { ok: false, expired: true };
  }
  if (Number(totalWatchMinutes || 0) < c.stage2WatchMinutes) return { ok: false };

  const referrer = await db.findById("users", rec.referrerId);
  if (!referrer || referrer.isBlock) return { ok: false };

  const now = Date.now();
  await db.update("referralHistories", rec._id || rec.id, {
    stage2Completed: true,
    stage2CompletedAt: new Date().toISOString(),
    stage2RewardCoins: c.stage2Coins,
    stage2HeldUntil: new Date(now + c.stage2HoldHours * 3600e3).toISOString(),
    stage2Released: false,
    status: "STAGE2_DONE",
  });
  await addPending(rec.referrerId, c.stage2Coins);

  return { ok: true, stage2CoinsPending: c.stage2Coins, holdHours: c.stage2HoldHours };
}

// ── Cron: release held referral coins whose holding period has elapsed ───────
async function releaseHeldReferrals() {
  const now = Date.now();
  const records = await db.find("referralHistories", { stage1Completed: true });
  let released = 0;
  let releasedCoins = 0;

  for (const rec of records) {
    if (rec.status === "FLAGGED_SUSPICIOUS") continue;

    for (const stage of ["stage1", "stage2"]) {
      const done = rec[`${stage}Completed`];
      const already = rec[`${stage}Released`];
      const heldUntil = rec[`${stage}HeldUntil`] ? new Date(rec[`${stage}HeldUntil`]).getTime() : 0;
      const coins = Number(rec[`${stage}RewardCoins`]) || 0;
      if (!done || already || coins <= 0 || !heldUntil || now < heldUntil) continue;

      const referrer = await db.findById("users", rec.referrerId);
      if (!referrer) { continue; }

      const pending = referrer.pendingReferralCoin || 0;
      const move = Math.min(coins, pending);
      await db.update("users", rec.referrerId, {
        pendingReferralCoin: Math.max(0, pending - move),
        coin: (referrer.coin || 0) + move,
        referralRewardCoin: (referrer.referralRewardCoin || 0) + move,
        totalRewardCoin: (referrer.totalRewardCoin || 0) + move,
        totalEarningAmount: Number(((referrer.totalEarningAmount || 0) + move * 0.01).toFixed(2)),
      });
      await db.create("histories", {
        userId: String(rec.referrerId),
        uniqueId: await generateHistoryUniqueId(),
        coin: move,
        type: stage === "stage1" ? HISTORY_TYPE_STAGE1_REFERRAL : HISTORY_TYPE.STAGE2_REFERRAL,
        date: new Date().toISOString(),
        referralId: rec._id || rec.id,
      });
      await db.update("referralHistories", rec._id || rec.id, {
        [`${stage}Released`]: true,
        [`${stage}ReleasedAt`]: new Date().toISOString(),
        totalRewardCoinsGiven: (rec.totalRewardCoinsGiven || 0) + move,
      });
      released++;
      releasedCoins += move;
    }
  }
  return { checked: records.length, released, releasedCoins };
}

// ── YP-TC §1.5: paid-tier referral bonus (10% of the pass price) ────────────
async function handlePaidTierReferral({ buyerId, tierPriceInr, tierName = "" }) {
  const price = Number(tierPriceInr) || 0;
  if (!buyerId || price <= 0) return { ok: false };

  const buyer = await db.findById("users", buyerId);
  const referrerId = buyer && buyer.referrerId ? String(buyer.referrerId) : null;
  if (!referrerId) return { ok: false };

  const referrer = await db.findById("users", referrerId);
  if (!referrer || referrer.isBlock) return { ok: false };

  const c = cfg();
  const bonusCoins = Math.round((price * c.paidTierPct) / 100 / 0.01); // % of INR -> coins
  if (bonusCoins <= 0) return { ok: false };

  await db.update("users", referrerId, {
    coin: (referrer.coin || 0) + bonusCoins,
    referralRewardCoin: (referrer.referralRewardCoin || 0) + bonusCoins,
    totalRewardCoin: (referrer.totalRewardCoin || 0) + bonusCoins,
    totalEarningAmount: Number(((referrer.totalEarningAmount || 0) + bonusCoins * 0.01).toFixed(2)),
  });
  await db.create("histories", {
    userId: referrerId,
    uniqueId: await generateHistoryUniqueId(),
    coin: bonusCoins,
    type: HISTORY_TYPE.STAGE2_REFERRAL,
    date: new Date().toISOString(),
    note: `Paid-tier referral (${c.paidTierPct}% of ${tierName || "pass"} ₹${price})`,
  });
  return { ok: true, bonusCoins, percentage: c.paidTierPct };
}

module.exports = {
  applyReferralCode,
  completeStage2,
  releaseHeldReferrals,
  handlePaidTierReferral,
  cfg,
};
