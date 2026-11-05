/**
 * Watch-time ledger — the one place watch time is credited to a user.
 *
 * Every watch-time report (the app's 10-second playback heartbeat, and the
 * two older per-video endpoints) goes through claimWatchSeconds(), which
 * credits at most the wall-clock time that has passed since this user's
 * previous credited report. A client can therefore never be credited faster
 * than real time, however much it claims or however many devices/requests it
 * reports from in parallel — they all draw on the same per-user clock
 * (users.watchClaimAt), inside one Firestore transaction.
 *
 * Why: the older endpoints trusted a client-supplied number. The app sent the
 * video's length in SECONDS as `totalWatchTime`, the server read it as
 * MINUTES (capped at 180 per call), so opening one 10-minute video credited 3
 * hours — enough for the daily 2-hour bonus, the referrer's ₹100 Stage 2
 * reward, and a free Tasker level-up every ~134 videos.
 *
 * Seconds below a whole minute carry over (users.watchSecondsCarry), so
 * 10-second heartbeats add up exactly to the minute counters the rest of the
 * system uses (totalCurrentWatchTime = today, totalWatchTime = lifetime).
 */
"use strict";

const db = require("./connection");
const { generateHistoryUniqueId } = require("./generateHistoryUniqueId");
const {
  HISTORY_TYPE,
  todayStr,
  ensureDailyReset,
  getLimits,
  checkTaskerWatchHourUpgrade,
} = require("./rewardEngine");
const referralService = require("./referral.service");
const { taskLockState } = require("./taskSecurity.service");
const { accessGateFor } = require("./accessGate");

const num = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/**
 * Atomically credit up to `requestedSeconds` of watch time, bounded by
 * `maxSeconds` and by the wall-clock time since the user's last claim. The
 * first claim ever only starts the clock and credits nothing.
 *
 * With `playback` ({ videoId, positionSeconds } from a heartbeat), a report
 * for the same video as the previous one is also bounded by how far the
 * playback position moved forward since then: a player that says "playing" while its
 * position stands still (a browser paused the media element behind the
 * app's back) earns nothing. The position is client-reported, so this stops
 * stalled playback from an honest client, not a forged one — the wall clock
 * above is what bounds a forged client.
 */
async function claimWatchSeconds(userId, requestedSeconds, { maxSeconds, countVideoWatch = false, playback = null } = {}) {
  const firestore = db.getDb();
  if (!firestore) throw new Error("Firestore is not initialised");
  const ref = firestore.collection("users").doc(String(userId));
  const requested = Math.max(0, num(requestedSeconds, 0));
  const cap = Math.max(0, num(maxSeconds, 15));

  return db.withTimeout(
    firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return null;
      const u = snap.data();
      const now = Date.now();
      const last = num(u.watchClaimAt, 0);
      const elapsed = last > 0 ? Math.max(0, (now - last) / 1000) : 0;

      let creditedSeconds = Math.min(requested, elapsed, cap);
      const pos = playback ? num(playback.positionSeconds, NaN) : NaN;
      const prevPos = u.watchPosition || null;
      if (playback && Number.isFinite(pos) && prevPos && prevPos.videoId === String(playback.videoId)) {
        const moved = pos - num(prevPos.seconds, 0);
        // Forward but less than claimed (frozen or crawling position): pay
        // only what the position covered, plus 1 s of sampling slack. A
        // backward jump is a seek back or a loop restart (Bites loop) — the
        // app already drops that second, and the wall clock still bounds it.
        if (moved >= 0) creditedSeconds = Math.min(creditedSeconds, moved + 1);
      }
      let carry = Math.max(0, num(u.watchSecondsCarry, 0)) + creditedSeconds;
      const creditedMinutes = Math.floor(carry / 60);
      carry -= creditedMinutes * 60;

      const prevMinutesToday = num(u.totalCurrentWatchTime, 0);
      const prevTotalMinutes = num(u.totalWatchTime, 0);
      const update = {
        watchClaimAt: now,
        ...(playback && Number.isFinite(pos) ? { watchPosition: { videoId: String(playback.videoId), seconds: pos } } : {}),
        watchSecondsCarry: Number(carry.toFixed(3)),
        updatedAt: new Date(now).toISOString(),
      };
      if (creditedMinutes > 0) {
        update.totalCurrentWatchTime = prevMinutesToday + creditedMinutes;
        update.totalWatchTime = prevTotalMinutes + creditedMinutes;
      }
      if (countVideoWatch) update.dailyVideoWatchesToday = num(u.dailyVideoWatchesToday, 0) + 1;
      tx.update(ref, update);

      return {
        creditedSeconds,
        creditedMinutes,
        carrySeconds: update.watchSecondsCarry,
        prevMinutesToday,
        newMinutesToday: prevMinutesToday + creditedMinutes,
        newTotalWatchMinutes: prevTotalMinutes + creditedMinutes,
        dailyEarningCoinsToday: num(u.dailyEarningCoinsToday, 0),
        coin: num(u.coin, 0),
      };
    })
  );
}

/**
 * Credit watch time for `user` and run everything that hangs off it: the
 * daily 2-hour bonus, the referral Stage 2 check (Digital Partner Milestone 2)
 * and the free watch-hour Tasker level-up.
 *
 * @returns {Promise<object>} ok:false + reason "SECURITY_LOCK" | "USER_NOT_FOUND"
 *   when nothing could be credited; otherwise the progress snapshot.
 */
async function recordWatchProgress(user, requestedSeconds, { maxSeconds, countVideoWatch = false, playback = null } = {}) {
  const userId = String(user._id || user.id);
  await ensureDailyReset(user);
  const limits = await getLimits(user);

  const lock = taskLockState(user);
  if (lock.locked) {
    return { ok: false, reason: "SECURITY_LOCK", lock, limits };
  }
  // Unpaid web-portal activation: no watch credit, and so no 2-hour bonus,
  // Stage 2 referral or free level-up (same gate as rewardEngine.creditReward).
  if (accessGateFor(user).locked) {
    return { ok: false, reason: "ACCESS_LOCKED", limits, message: "Complete your activation payment on the YouPeak web portal to start earning." };
  }

  const claim = await claimWatchSeconds(userId, requestedSeconds, { maxSeconds, countVideoWatch, playback });
  if (!claim) return { ok: false, reason: "USER_NOT_FOUND", limits };

  const milestoneMin = limits.minWatchMinutesForEngagementReward;
  const milestoneReached = claim.prevMinutesToday < milestoneMin && claim.newMinutesToday >= milestoneMin;

  let milestoneCoins = 0;
  if (milestoneReached) {
    // Once per business day per user (the same history id both older
    // endpoints used), capped by the daily coin cap re-read inside the same
    // transaction that writes the credit — a concurrent reward can't push the
    // day past the cap, and a retry can't pay the bonus twice.
    const fs = db.getDb();
    const userRef = fs.collection("users").doc(userId);
    const day = todayStr();
    const histRef = fs.collection("histories").doc(`hist_dedupe_${userId}_${day}_watchMilestone`);
    const uniqueId = await generateHistoryUniqueId();
    try {
      milestoneCoins = await db.withTimeout(fs.runTransaction(async (tx) => {
        const [hs, us] = await Promise.all([tx.get(histRef), tx.get(userRef)]);
        if (hs.exists || !us.exists) return 0;
        const u = us.data();
        const earned = u.lastActivityDate === day ? Number(u.dailyEarningCoinsToday) || 0 : 0;
        const coins = Math.max(0, Math.min(limits.reward.engagementWatch, limits.dailyEarningCapInCoins - earned));
        if (coins <= 0) return 0;
        const now = new Date().toISOString();
        tx.create(histRef, { _id: histRef.id, id: histRef.id, userId, uniqueId, coin: coins, type: HISTORY_TYPE.WATCH_TIME_MILESTONE, date: now, createdAt: now, updatedAt: now });
        tx.update(userRef, {
          coin: (Number(u.coin) || 0) + coins,
          engagementRewardCoin: (Number(u.engagementRewardCoin) || 0) + coins,
          totalRewardCoin: (Number(u.totalRewardCoin) || 0) + coins,
          dailyEarningCoinsToday: earned + coins,
          updatedAt: now,
        });
        return coins;
      }));
    } catch (err) {
      if (!(err.code === 6 || /ALREADY_EXISTS/i.test(err.message || ""))) throw err;
      milestoneCoins = 0;
    }
  }

  let upgradedTier = null;
  if (claim.creditedMinutes > 0) {
    if (user.isReferral) {
      try {
        await referralService.completeStage2({ referredUserId: userId, totalWatchMinutes: claim.newTotalWatchMinutes });
      } catch (e) {
        console.error("Stage 2 referral check error:", e.message);
      }
    }
    try {
      upgradedTier = await checkTaskerWatchHourUpgrade(user, claim.newTotalWatchMinutes);
    } catch (e) {
      console.error("Tasker watch-hour upgrade check error:", e.message);
    }
  }

  const lifetimeSeconds = claim.newTotalWatchMinutes * 60 + claim.carrySeconds;
  const earnedToday = claim.dailyEarningCoinsToday + milestoneCoins;
  return {
    ok: true,
    limits,
    creditedSeconds: Number(claim.creditedSeconds.toFixed(3)),
    creditedMinutes: claim.creditedMinutes,
    watchMinutesToday: claim.newMinutesToday,
    milestoneMinutes: milestoneMin,
    minutesUntilMilestone: Math.max(0, milestoneMin - claim.newMinutesToday),
    milestoneReached,
    milestoneCoins,
    lifetimeWatchMinutes: claim.newTotalWatchMinutes,
    lifetimeWatchHours: Number((lifetimeSeconds / 3600).toFixed(4)),
    dailyEarningCoinsToday: earnedToday,
    dailyCapReached: earnedToday >= limits.dailyEarningCapInCoins,
    coin: claim.coin + milestoneCoins,
    tierUpgraded: !!upgradedTier,
    newTierId: upgradedTier ? upgradedTier._id || upgradedTier.id : undefined,
    newTierName: upgradedTier ? upgradedTier.tierName : undefined,
  };
}

module.exports = { claimWatchSeconds, recordWatchProgress };
