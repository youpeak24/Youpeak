/**
 * YouPeak – Peak Boost (fan -> creator coin tipping).
 *
 * POST client/peakBoost  { videoId, coins, requestId }
 *
 * The booster is the signed-in user (requireAppUser), never a body field —
 * otherwise anyone holding the app secret could spend someone else's coins
 * into their own channel.
 *
 * Money flow (Phase 2, F-23): ONE Firestore transaction commits
 *   • the booster's debit (refused below the amount — never negative),
 *   • the boost record peakBoosts/pb_<user>_<requestId> (idempotency key),
 *   • the creator's 80% credit and history row,
 *   • the revenue ledger row with the platform's 20% (revenueLedger/rev_<boostId>),
 *   • the booster's history row and the video's boost counters —
 * or none of them. There is no refund path because a partial settlement can
 * no longer happen. Shares are integer coins: creator = round(T × 80%),
 * platform = T − creator (util/revenueSplit.service.js; BLOCK-01 records that
 * this rounding rule still needs owner sign-off).
 */
"use strict";

const db = require("../../util/connection");
const firebaseAdmin = require("../../util/firebaseAdmin");
const { planRevenue, applyRevenuePlan } = require("../../util/revenueSplit.service");
const { getPeakBoost } = require("../../util/systemConfig.service");
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");
const visibility = require("../../util/videoVisibility");

// histories.type for the booster's own debit row (the creator's credit row is
// written by applyRevenuePlan with its revenue type).
const HISTORY_TYPE_PEAK_BOOST_SENT = 21;
const REQUEST_ID = /^[A-Za-z0-9_-]{8,64}$/;

function fail(res, code, message, extra = {}, httpStatus = 200) {
  return res.status(httpStatus).json({ status: false, code, message, ...extra });
}

function displayName(user) {
  return user.fullName || user.nickName || "A fan";
}

function success(res, boost, boosterName) {
  return res.status(200).json({
    status: true,
    message: `Boosted ${boost.coins} coins!`,
    boostId: boost._id || boost.id,
    coins: boost.coins,
    balance: boost.balanceAfter,
    creatorCoins: boost.creatorCoins,
    platformCoins: boost.platformCoins,
    boosterName,
  });
}

class BoostRefused extends Error {
  constructor(code, message, extra = {}) { super(message); this.code = code; this.extra = extra; }
}

exports.boost = async (req, res) => {
  try {
    const user = req.appUser;
    const userId = req.appUserId;
    const body = req.body || {};
    const videoId = typeof body.videoId === "string" ? body.videoId.trim() : "";
    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
    // A JSON number only — "200" / null / 150.5 are rejected, not coerced.
    const coins = typeof body.coins === "number" ? body.coins : NaN;

    const pb = getPeakBoost();
    if (!pb.enabled) return fail(res, "PEAK_BOOST_DISABLED", "Peak Boost is not available right now.");
    if (!Number.isInteger(coins) || coins < pb.minCoins || coins > pb.maxCoins) {
      return fail(res, "INVALID_AMOUNT", `Boost between ${pb.minCoins.toLocaleString("en-IN")} and ${pb.maxCoins.toLocaleString("en-IN")} coins.`, {
        minCoins: pb.minCoins,
        maxCoins: pb.maxCoins,
      });
    }
    if (!videoId || videoId.length > 64 || !REQUEST_ID.test(requestId)) {
      return fail(res, "INVALID_REQUEST", "Invalid boost request.");
    }

    const boostId = `pb_${userId}_${requestId}`;
    const existing = await db.findById("peakBoosts", boostId);
    if (existing) {
      // Same requestId again: report what the first attempt did, never redo it —
      // and never reuse a requestId for a different boost.
      if (String(existing.videoId) !== videoId || Number(existing.coins) !== coins) {
        return fail(res, "REQUEST_ID_REUSED", "This boost request id was already used for a different boost.", {}, 409);
      }
      if (existing.status === "COMPLETED") return success(res, existing, displayName(user));
      return fail(res, "REQUEST_USED", "This boost didn't go through. Please try again with a new request.");
    }

    const video = await db.findById("videos", videoId);
    if (!video || !visibility.canView(video, userId)) return fail(res, "VIDEO_NOT_FOUND", "Video not found.");
    const creatorId = visibility.ownerOf(video);
    if (!creatorId) return fail(res, "VIDEO_NOT_FOUND", "Video not found.");
    if (creatorId === userId) return fail(res, "SELF_BOOST", "You can't boost your own video.");

    const creator = await db.findById("users", creatorId);
    if (!creator || creator.isBlock || creator.isActive === false) {
      return fail(res, "CREATOR_UNAVAILABLE", "This creator can't receive boosts right now.");
    }

    const plan = await planRevenue({
      sourceType: "peakBoost", grossCoins: coins, creatorId, buyerId: userId, videoId,
      ledgerId: `rev_${boostId}`, meta: { peakBoostId: boostId },
    });
    if (!(plan.creatorCoins > 0)) return fail(res, "CREATOR_UNAVAILABLE", "This creator can't receive boosts right now.");
    const historyUniqueId = await generateHistoryUniqueId();

    const fs = db.getDb();
    const boostRef = fs.collection("peakBoosts").doc(boostId);
    const boosterRef = fs.collection("users").doc(userId);
    let completed;
    try {
      completed = await db.withTimeout(fs.runTransaction(async (tx) => {
        const [boostSnap, boosterSnap] = await Promise.all([tx.get(boostRef), tx.get(boosterRef)]);
        if (boostSnap.exists) throw new BoostRefused("DUPLICATE", "duplicate");
        if (!boosterSnap.exists) throw new BoostRefused("USER_NOT_FOUND", "Account not found.");
        const booster = boosterSnap.data();
        if (booster.isBlock) throw new BoostRefused("USER_BLOCKED", "You are blocked by the admin.");
        const before = Number(booster.coin) || 0;
        if (before < coins) throw new BoostRefused("INSUFFICIENT_BALANCE", "Insufficient balance.", { balance: before });

        const now = new Date().toISOString();
        const after = before - coins;
        tx.update(boosterRef, { coin: after, updatedAt: now });
        const doc = {
          _id: boostId, id: boostId, boosterId: userId, creatorId, videoId, coins,
          status: "COMPLETED", balanceAfter: after,
          creatorCoins: plan.creatorCoins, platformCoins: plan.platformCoins, referrerCoins: plan.referrerCoins,
          split: plan.split, ledgerId: plan.ledgerId, createdAt: now, updatedAt: now, completedAt: now,
        };
        tx.create(boostRef, doc);
        applyRevenuePlan(tx, plan);
        const hid = `${boostId}_sent`;
        tx.create(fs.collection("histories").doc(hid), {
          _id: hid, id: hid, userId, uniqueId: historyUniqueId, coin: coins, type: HISTORY_TYPE_PEAK_BOOST_SENT,
          isIncome: false, videoId, otherUserId: creatorId, peakBoostId: boostId, date: now, createdAt: now, updatedAt: now,
        });
        tx.set(fs.collection("videos").doc(videoId), {
          peakBoostCoins: firebaseAdmin.firestore.FieldValue.increment(coins),
          peakBoostCount: firebaseAdmin.firestore.FieldValue.increment(1),
        }, { merge: true });
        return doc;
      }));
    } catch (err) {
      if (err instanceof BoostRefused) {
        if (err.code === "DUPLICATE") {
          const first = await db.findById("peakBoosts", boostId);
          if (first && first.status === "COMPLETED" && String(first.videoId) === videoId && Number(first.coins) === coins) return success(res, first, displayName(user));
          return fail(res, "REQUEST_ID_REUSED", "This boost request id was already used for a different boost.", {}, 409);
        }
        return fail(res, err.code, err.message, err.extra);
      }
      if (err.code === 6 || /ALREADY_EXISTS/i.test(err.message || "")) {
        const first = await db.findById("peakBoosts", boostId);
        if (first && first.status === "COMPLETED") return success(res, first, displayName(user));
      }
      throw err;
    }

    return success(res, completed, displayName(user));
  } catch (error) {
    console.error("peakBoost error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// GET client/peakBoost/status?requestId= — what happened to the caller's boost
// with this requestId. The app asks this after a timeout before offering to
// boost again, so a boost that did go through is never sent twice.
exports.status = async (req, res) => {
  try {
    const requestId = typeof req.query.requestId === "string" ? req.query.requestId.trim() : "";
    if (!REQUEST_ID.test(requestId)) return fail(res, "INVALID_REQUEST", "Invalid boost request.");
    const boost = await db.findById("peakBoosts", `pb_${req.appUserId}_${requestId}`);
    const balance = Number((await db.findById("users", req.appUserId) || {}).coin) || 0;
    if (!boost) return res.status(200).json({ status: true, found: false, balance });
    return res.status(200).json({
      status: true,
      found: true,
      completed: boost.status === "COMPLETED",
      boostId: boost._id || boost.id,
      videoId: boost.videoId,
      coins: boost.coins,
      creatorCoins: boost.creatorCoins,
      platformCoins: boost.platformCoins,
      createdAt: boost.createdAt,
      balance,
    });
  } catch (error) {
    console.error("peakBoost status error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
