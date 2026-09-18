/**
 * Referral engine — YouPeak Peak Partner model.
 *
 *   Stage 1  ₹100 (10,000 coins)  when the referral code is applied by a new,
 *            OTP-verified user. Held for `referralStage1HoldHours` (24h).
 *   Stage 2  ₹100 (10,000 coins)  when the referred user reaches
 *            `referralStage2WatchMinutes` (100) within
 *            `referralStage2WindowDays` (7). Held `referralStage2HoldHours` (48h).
 *
 *   Free Tasker direct bonus (YP-TC §1.5): additive on top of Stage 1/2 above
 *   — if the REFERRER is currently on the free tier, they also get a flat
 *   `freeTaskerReferralBonusCoins` (250) the moment the referral is applied,
 *   credited immediately (no hold, unlike Stage 1/2 — the doc names no
 *   holding period for it).
 *
 *   Paid-tier bonus (YP-TC §1.5): when a referred user buys a paid tasker/creator
 *   pass, the referrer gets `paidTierReferralPercentage` (10%) of the price, as
 *   coins. Also additive — stacks with Stage 1/2 and the free-tier bonus above,
 *   same as how it already worked before this bonus existed.
 *
 * Held coins sit in user.pendingReferralCoin until the cron
 * (releaseHeldReferrals) moves them to the spendable `coin` balance.
 *
 * Anti-fraud: one referral per referred device/IP; per-day cap per referrer;
 * VPN/proxy check on the referred user's IP (YP-TC §4.1/4.2); fraud-risk hook.
 */
"use strict";

const db = require("./connection");
const { generateHistoryUniqueId } = require("./generateHistoryUniqueId");
const { HISTORY_TYPE, todayStr } = require("./rewardEngine");
const { isLikelyVpnOrProxy } = require("./vpnDetection.service");

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
    // Already a configured setting (admin-editable, exposed via
    // setting.controller.js) but never actually credited anywhere until now.
    freeTaskerReferralBonusCoins: n(s.referralRewardCoins, 250),
  };
}

async function addPending(userId, coins) {
  const u = await db.findById("users", userId);
  if (!u) return null;
  await db.incrementFields("users", u._id || u.id, { pendingReferralCoin: coins });
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

  // YP-TC §4.1/4.2: VPN/proxy usage is strictly prohibited. Checked on the
  // new (referred) user's IP — a fresh signup arriving via a known
  // datacenter/VPN range is a strong signal of referral farming with
  // disposable accounts. See vpnDetection.service.js for the heuristic and
  // its known limitations.
  if (ipAddress && isLikelyVpnOrProxy(ipAddress)) {
    flaggedReason = "VPN_PROXY_USAGE";
  }
  if (!flaggedReason && c.deviceDedup && deviceId) {
    const sameDevice = await db.findOne("referralHistories", { referredDeviceId: deviceId });
    if (sameDevice) flaggedReason = "DUPLICATE_DEVICE";
  }
  if (!flaggedReason && ipAddress) {
    // Named "sameIpToday" but had no date filter at all — flagged a referrer
    // forever after their 3rd-ever referral from one IP (e.g. home/office
    // WiFi), even if spread across months of genuine, unrelated referrals.
    // Scope it to today, matching the daily-cap check right below.
    const t = todayStr();
    const all = await db.find("referralHistories", { referrerId, referredIp: ipAddress });
    const sameIpToday = all.filter((r) => String(r.createdAt || "").slice(0, 10) === t).length;
    if (sameIpToday >= 3) flaggedReason = "MULTIPLE_SAME_IP";
  }
  if (!flaggedReason) {
    const t = todayStr();
    const todaysReferrals = (await db.find("referralHistories", { referrerId }))
      .filter((r) => String(r.createdAt || "").slice(0, 10) === t).length;
    if (todaysReferrals >= c.maxReferralsPerDay) flaggedReason = "DAILY_CAP_EXCEEDED";
  }

  // Atomic claim — a double-tap on "apply code" (or a retried request) must
  // not create two referralHistories records / credit two referrers for
  // the same new user. The referralApplied check above is only a fast
  // pre-check; this is the real, race-free gate.
  const claim = await db.claimOnce("users", referredUserId, "referralApplied");
  if (!claim.claimed) {
    return { ok: false, message: "Referral code already applied." };
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

  // Mark the referred user (referralApplied already flipped by the claim above)
  await db.update("users", referredUserId, {
    isReferral: true,
    referrerId,
    isNewUser: false,
  });

  if (flaggedReason) {
    try {
      // Map this function's internal reason codes onto FraudAlert's actual
      // riskType enum — was always hardcoded to SUSPICIOUS_REFERRAL_FARMING
      // regardless of flaggedReason, which silently downgraded VPN_PROXY_USAGE
      // to a soft, reviewable flag instead of the hard auto-block it needs.
      const riskTypeByReason = {
        VPN_PROXY_USAGE: "VPN_PROXY_USAGE",
        MULTIPLE_SAME_IP: "MULTIPLE_ACCOUNTS_SAME_IP",
        DAILY_CAP_EXCEEDED: "EXCEEDED_DAILY_LIMIT_VELOCITY",
      };
      await evaluateFraudRisk({
        userId: referrerId,
        riskType: riskTypeByReason[flaggedReason] || "SUSPICIOUS_REFERRAL_FARMING",
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
  await db.incrementFields("users", referrerId, { referralCount: 1 });

  // YP-TC §1.5 "Free Tasker Referrals" — additive flat bonus, credited
  // immediately (not held), only when the referrer is currently on the free
  // tier. A referrer on a paid tier doesn't get this on top of Stage 1 — they
  // instead get the (larger, percentage-based) paid-tier bonus above if/when
  // this same referred user later buys a pass (handlePaidTierReferral).
  let freeTierBonusCoins = 0;
  const referrerIsFreeTier = !referrer.membershipTierId || referrer.membershipTierId === "tier_tasker_free";
  if (referrerIsFreeTier && c.freeTaskerReferralBonusCoins > 0) {
    freeTierBonusCoins = c.freeTaskerReferralBonusCoins;
    await db.incrementFields("users", referrerId, {
      coin: freeTierBonusCoins,
      referralRewardCoin: freeTierBonusCoins,
      totalRewardCoin: freeTierBonusCoins,
      totalEarningAmount: freeTierBonusCoins * 0.01,
    });
    await db.create("histories", {
      userId: referrerId,
      uniqueId: await generateHistoryUniqueId(),
      coin: freeTierBonusCoins,
      type: HISTORY_TYPE_STAGE1_REFERRAL,
      date: new Date().toISOString(),
      note: `Free Tasker direct referral bonus (flat ${freeTierBonusCoins} coins)`,
    });
  }

  return {
    ok: true,
    flagged: false,
    message: `Referral applied. ₹${(c.stage1Coins * 0.01).toFixed(0)} (${c.stage1Coins} coins) pending for the referrer — released after ${c.stage1HoldHours}h.${freeTierBonusCoins > 0 ? ` Plus an immediate ${freeTierBonusCoins}-coin free-tier referral bonus.` : ""}`,
    stage1CoinsPending: c.stage1Coins,
    freeTierBonusCoins,
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

  // Atomic claim — two concurrent watch-time checks crossing the stage-2
  // threshold around the same moment must not both credit the referrer.
  const claim = await db.claimOnce("referralHistories", rec._id || rec.id, "stage2Completed");
  if (!claim.claimed) return { ok: false };

  const now = Date.now();
  await db.update("referralHistories", rec._id || rec.id, {
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

      // Atomic claim — two overlapping cron runs (a retried request, or two
      // schedulers both configured against this endpoint) must not both
      // release the same held stage for the same referral record.
      const releaseClaim = await db.claimOnce("referralHistories", rec._id || rec.id, `${stage}Released`);
      if (!releaseClaim.claimed) continue;

      // moveBalance re-reads pendingReferralCoin inside its own transaction
      // and clamps to whatever's actually there, so this is safe even if
      // `referrer.pendingReferralCoin` (read moments ago, above) is stale.
      const moveResult = await db.moveBalance(
        "users",
        rec.referrerId,
        "pendingReferralCoin",
        { coin: 1, referralRewardCoin: 1, totalRewardCoin: 1, totalEarningAmount: 0.01 },
        coins
      );
      if (!moveResult.ok || moveResult.moved <= 0) continue;
      const move = moveResult.moved;

      await db.create("histories", {
        userId: String(rec.referrerId),
        uniqueId: await generateHistoryUniqueId(),
        coin: move,
        type: stage === "stage1" ? HISTORY_TYPE_STAGE1_REFERRAL : HISTORY_TYPE.STAGE2_REFERRAL,
        date: new Date().toISOString(),
        referralId: rec._id || rec.id,
      });
      await db.incrementFields("referralHistories", rec._id || rec.id, { totalRewardCoinsGiven: move }, {
        [`${stage}ReleasedAt`]: new Date().toISOString(),
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

  await db.incrementFields("users", referrerId, {
    coin: bonusCoins,
    referralRewardCoin: bonusCoins,
    totalRewardCoin: bonusCoins,
    totalEarningAmount: bonusCoins * 0.01,
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
