/**
 * YouPeak – Peak Boost (fan -> creator coin tipping).
 *
 * POST client/peakBoost  { videoId, coins, requestId }
 *
 * The booster is the signed-in user (requireAppUser), never a body field —
 * otherwise anyone holding the app secret could spend someone else's coins
 * into their own channel.
 *
 * Money flow, in order:
 *   1. createOnce(peakBoosts/pb_<user>_<requestId>) — a retried or
 *      double-tapped request with the same requestId can't boost twice.
 *   2. spendBalance() — atomic check-and-debit; two concurrent boosts can
 *      never overdraw the balance.
 *   3. settleRevenue("peakBoost") — creator share (80%) credited as coins,
 *      platform share (20%) recorded, ledger row written.
 *   If step 3 throws, the booster is refunded and the boost marked REFUNDED.
 */
"use strict";

const db = require("../../util/connection");
const { settleRevenue } = require("../../util/revenueSplit.service");
const { getPeakBoost } = require("../../util/systemConfig.service");
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

// histories.type for the booster's own debit row (the creator's credit row is
// written by settleRevenue with its revenue type).
const HISTORY_TYPE_PEAK_BOOST_SENT = 21;
const REQUEST_ID = /^[A-Za-z0-9_-]{8,64}$/;

function fail(res, code, message, extra = {}) {
  return res.status(200).json({ status: false, code, message, ...extra });
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

exports.boost = async (req, res) => {
  try {
    const user = req.appUser;
    const userId = req.appUserId;
    const body = req.body || {};
    const videoId = typeof body.videoId === "string" ? body.videoId.trim() : "";
    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
    const coins = Number(body.coins);

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

    const video = await db.findById("videos", videoId);
    if (!video || video.isActive === false) return fail(res, "VIDEO_NOT_FOUND", "Video not found.");
    const creatorId = String(video.userId || "");
    if (!creatorId) return fail(res, "VIDEO_NOT_FOUND", "Video not found.");
    if (creatorId === userId) return fail(res, "SELF_BOOST", "You can't boost your own video.");

    const creator = await db.findById("users", creatorId);
    if (!creator || creator.isBlock || creator.isActive === false) {
      return fail(res, "CREATOR_UNAVAILABLE", "This creator can't receive boosts right now.");
    }

    const boostId = `pb_${userId}_${requestId}`;
    const claim = await db.createOnce("peakBoosts", boostId, {
      boosterId: userId,
      creatorId,
      videoId,
      coins,
      status: "PROCESSING",
    });
    if (!claim.created) {
      // Same requestId again: report what the first attempt did, never redo it.
      const existing = await db.findById("peakBoosts", boostId);
      if (existing && existing.status === "COMPLETED") return success(res, existing, displayName(user));
      if (existing && existing.status === "PROCESSING") {
        return fail(res, "IN_PROGRESS", "This boost is still being processed.");
      }
      return fail(res, "REQUEST_USED", "This boost didn't go through. Please try again.");
    }

    const spend = await db.spendBalance("users", userId, "coin", coins);
    if (!spend.ok) {
      await db.update("peakBoosts", boostId, { status: "FAILED", failureReason: spend.reason });
      return fail(res, "INSUFFICIENT_BALANCE", "Insufficient balance.", { balance: spend.before });
    }

    let settlement;
    try {
      settlement = await settleRevenue({
        sourceType: "peakBoost",
        grossCoins: coins,
        creatorId,
        buyerId: userId,
        videoId,
        meta: { peakBoostId: boostId },
      });
    } catch (e) {
      console.error("peakBoost settlement failed, refunding:", e.message);
      await db.incrementFields("users", userId, { coin: coins });
      await db.update("peakBoosts", boostId, { status: "REFUNDED", failureReason: "SETTLEMENT_FAILED" });
      return fail(res, "SETTLEMENT_FAILED", "Boost failed and your coins were refunded. Please try again.");
    }

    const completed = {
      status: "COMPLETED",
      balanceAfter: spend.after,
      creatorCoins: settlement.creatorCoins,
      platformCoins: settlement.platformCoins,
      referrerCoins: settlement.referrerCoins,
      split: settlement.split,
      completedAt: new Date().toISOString(),
    };
    await db.update("peakBoosts", boostId, completed);

    // Best-effort bookkeeping — the boost itself is already settled.
    try {
      await db.create("histories", {
        userId,
        uniqueId: await generateHistoryUniqueId(),
        coin: coins,
        type: HISTORY_TYPE_PEAK_BOOST_SENT,
        isIncome: false,
        videoId,
        otherUserId: creatorId,
        peakBoostId: boostId,
        date: new Date().toISOString(),
      });
    } catch (e) { /* ignore */ }
    try {
      await db.incrementFields("videos", videoId, { peakBoostCoins: coins, peakBoostCount: 1 });
    } catch (e) { /* ignore */ }

    return success(res, { ...claim.doc, ...completed, _id: boostId }, displayName(user));
  } catch (error) {
    console.error("peakBoost error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
