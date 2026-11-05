/**
 * Scheduled maintenance. Invoked by Vercel Cron (see vercel.json "crons") or any
 * external scheduler. Protected by CRON_SECRET.
 *
 * Runs at 00:00 IST daily. Tasks:
 *   0. expireAdCredits   — sweeps Ad Credit lots past expiry (bounded per run, resumable; see service docs)
 *   1. expireReferrals   — Stage-2 referral windows whose 7-day deadline passed
 *   2. resetDailyCounters — OPTIONAL bulk reset (?full=1). Off by default because
 *      the reward engine already resets each user's counters lazily on first
 *      activity of the day.
 *
 * NOTE: automatic coin -> INR settlement at midnight (YP-TC §3.1) is intentionally
 * NOT implemented here yet — it needs a product decision on whether it drains the
 * spendable `coin` balance. Wire it in once that's confirmed.
 */
"use strict";

const crypto = require("node:crypto");
const db = require("../util/connection");
const { loadSettings } = require("../util/loadSettings");
const { todayStr } = require("../util/rewardEngine");
const referralService = require("../util/referral.service");
const creatorFundingService = require("../util/creatorFunding.service");

// Constant-time comparison; length is not secret-worthy (CRON_SECRET is a long random string).
function safeEqual(provided, expected) {
  const a = Buffer.from(String(provided || ""));
  const b = Buffer.from(String(expected || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Only CRON_SECRET authorises maintenance. The shared app key (`key` header / secretKey) never does:
// the Authorization header is checked against CRON_SECRET only, and `?key=` is compared to CRON_SECRET only.
function authorised(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const hdr = req.get("authorization") || req.get("Authorization") || "";
  const bearer = hdr.replace(/^Bearer\s+/i, "");
  const q = typeof req.query.key === "string" ? req.query.key : "";
  return safeEqual(bearer, secret) || safeEqual(q, secret);
}

// Ad Credits expiry runs inside the function's execution limit (vercel.json functions.maxDuration = 30 s).
// The sweep stops starting new lots after this slice and reports `moreWork: true`; the next run resumes
// from the lots that are still ACTIVE (there is no cursor to carry).
const AD_CREDIT_EXPIRY_BATCH = 100;
const AD_CREDIT_EXPIRY_BATCHES = 5;
const AD_CREDIT_DAILY_BUDGET_MS = Math.max(1000, Number(process.env.AD_CREDIT_EXPIRY_BUDGET_MS) || 10000);
const AD_CREDIT_ROUTE_BUDGET_MS = Math.max(1000, Number(process.env.AD_CREDIT_EXPIRY_ROUTE_BUDGET_MS) || 20000);

async function expireAdCredits(budgetMs) {
  const adCreditWallet = require("../util/adCreditWallet.service");
  try {
    const r = await adCreditWallet.expireCredits({
      batchSize: AD_CREDIT_EXPIRY_BATCH,
      maxBatches: AD_CREDIT_EXPIRY_BATCHES,
      deadlineMs: Date.now() + budgetMs,
    });
    return adCreditWallet.toPublicExpiryResult(r);
  } catch (e) {
    // Never echo the raw message: it can contain document paths or user ids.
    console.error("cron expireAdCredits failed:", e && e.code, e && e.message);
    return { error: "AD_CREDIT_EXPIRY_FAILED", moreWork: true };
  }
}

async function expireReferrals() {
  const now = Date.now();
  const pending = await db.find("referralHistories", { stage1Completed: true, stage2Completed: false });
  let expired = 0;
  for (const r of pending) {
    if (r.status === "EXPIRED") continue;
    const deadline = r.stage2DeadlineAt ? new Date(r.stage2DeadlineAt).getTime() : null;
    if (deadline && now > deadline) {
      await db.update("referralHistories", r._id || r.id, { status: "EXPIRED" });
      expired++;
    }
  }
  return { checked: pending.length, expired };
}

async function resetDailyCounters() {
  const t = todayStr();
  const users = await db.find("users", {});
  let reset = 0;
  for (const u of users) {
    if (u.lastActivityDate === t) continue;
    await db.update("users", u._id || u.id, {
      dailyEarningCoinsToday: 0,
      dailyAdCountToday: 0,
      dailyCheckInsToday: 0,
      dailyLikesToday: 0,
      dailyCommentsToday: 0,
      dailyDislikesToday: 0,
      dailyVideoWatchesToday: 0,
      totalCurrentWatchTime: 0,
      lastActivityDate: t,
    });
    reset++;
  }
  return { total: users.length, reset };
}

exports.daily = async (req, res) => {
  if (!authorised(req)) {
    return res.status(401).json({ status: false, message: "Unauthorized cron request" });
  }
  const started = Date.now();
  await loadSettings(); // settings are read only after the caller is authenticated
  const result = { ranAt: new Date().toISOString(), tasks: {} };

  // Ad credits lots past their expiry date (YP-TC / Ad Credits). Runs first, inside its own time slice and its
  // own try/catch, so a slow or failing expiry sweep cannot starve or break the other tasks (and vice versa).
  result.tasks.expireAdCredits = await expireAdCredits(AD_CREDIT_DAILY_BUDGET_MS);

  try {
    result.tasks.expireReferrals = await expireReferrals();
  } catch (e) {
    result.tasks.expireReferrals = { error: e.message };
  }
  try {
    result.tasks.releaseHeldReferrals = await referralService.releaseHeldReferrals();
  } catch (e) {
    result.tasks.releaseHeldReferrals = { error: e.message };
  }
  try {
    result.tasks.resolveExpiredCampaigns = await creatorFundingService.resolveExpiredCampaigns();
  } catch (e) {
    result.tasks.resolveExpiredCampaigns = { error: e.message };
  }
  // Uploads that were never published (cancelled, failed, closed tab) and the
  // records of old upload grants; set UPLOAD_CLEANUP=off to skip.
  if (String(process.env.UPLOAD_CLEANUP || "").toLowerCase() !== "off") {
    try {
      result.tasks.cleanupExpiredUploads = await require("../util/uploadGrants").cleanupExpired();
    } catch (e) {
      result.tasks.cleanupExpiredUploads = { error: e.message };
    }
  }

  // Scheduled uploads whose time has come (also done on demand by the video API).
  try {
    result.tasks.publishScheduledVideos = await require("../util/scheduledPublish").publishDue();
  } catch (e) {
    result.tasks.publishScheduledVideos = { error: e.message };
  }

  // Video promotions past their end date / delivered (also swept by the placements API).
  try {
    result.tasks.expirePromotions = await require("../util/promotion.service").expireDue();
  } catch (e) {
    result.tasks.expirePromotions = { error: e.message };
  }

  if (req.query.full === "1" || String(process.env.CRON_BULK_RESET || "").toLowerCase() === "true") {
    try {
      result.tasks.resetDailyCounters = await resetDailyCounters();
    } catch (e) {
      result.tasks.resetDailyCounters = { error: e.message };
    }
  }

  result.durationMs = Date.now() - started;
  return res.status(200).json({ status: true, ...result });
};

// Dedicated, frequently schedulable route for the Ad Credits expiry sweep only. Same CRON_SECRET protection.
// See reports/project-audit/ad-credits/report.md for the (not yet applied) scheduling proposal.
exports.adCreditsExpiry = async (req, res) => {
  if (!authorised(req)) {
    return res.status(401).json({ status: false, message: "Unauthorized cron request" });
  }
  const started = Date.now();
  await loadSettings();
  const result = { ranAt: new Date().toISOString(), tasks: {} };
  result.tasks.expireAdCredits = await expireAdCredits(AD_CREDIT_ROUTE_BUDGET_MS);
  result.durationMs = Date.now() - started;
  return res.status(200).json({ status: true, ...result });
};
