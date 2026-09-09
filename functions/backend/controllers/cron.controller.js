/**
 * Scheduled maintenance. Invoked by Vercel Cron (see vercel.json "crons") or any
 * external scheduler. Protected by CRON_SECRET.
 *
 * Runs at 00:00 IST daily. Tasks:
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

const db = require("../util/connection");
const { todayStr } = require("../util/rewardEngine");

function authorised(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const hdr = req.get("authorization") || req.get("Authorization") || "";
  const bearer = hdr.replace(/^Bearer\s+/i, "");
  return bearer === secret || req.query.key === secret;
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
  const result = { ranAt: new Date().toISOString(), tasks: {} };
  try {
    result.tasks.expireReferrals = await expireReferrals();
  } catch (e) {
    result.tasks.expireReferrals = { error: e.message };
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
