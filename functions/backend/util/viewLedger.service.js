/**
 * Per-(viewer, video) verified viewing: the source of view counts and of
 * creator watch earnings (WH-1).
 *
 * The playback heartbeat (client/watch/heartbeat) reports played seconds
 * every ~10 s. recordViewing() adds them to `viewProgress/<userId>_<videoId>`
 * bounded by the wall-clock time since that record's previous report (and
 * by 15 s per report), in one transaction — so a client can't claim viewing
 * faster than real time, however it reports. It is independent of the
 * viewer's reward eligibility: a viewer who can't earn coins still watched.
 *
 * View policy (documented in the release report):
 *   - one view per signed-in viewer per video, ever (refreshes, replays and
 *     re-renders never add views);
 *   - it counts once the viewer has VIEW_MIN_SECONDS of verified playback,
 *     or the whole video if it is shorter;
 *   - the owner watching their own video is not a view.
 * A qualifying view writes the viewer's WatchHistory row (deterministic id),
 * which is what every feed's `views` counts.
 *
 * Creator earnings (settleCreatorEarning) are paid from verified seconds
 * only — never from the client's playhead — once the viewer has watched 40%
 * of the video, each verified second at most once, and persisted before the
 * API answers. Rate: settings.earningPerHour (unchanged).
 */
"use strict";

const db = require("./connection");

const VIEW_MIN_SECONDS = 30;
const MAX_SECONDS_PER_REPORT = 15;
const EARNING_THRESHOLD = 0.4;

const fs = () => {
  const f = db.getDb();
  if (!f) throw new Error("Firestore is not initialised");
  return f;
};
const pairId = (u, v) => `${String(u)}_${String(v)}`;
const durationOf = (video) => Math.max(0, Number(video && video.videoTime) || 0);

/**
 * @returns {Promise<{verifiedSeconds:number, viewCounted:boolean, newView:boolean}>}
 */
async function recordViewing({ userId, video, seconds, now = Date.now() }) {
  const uid = String(userId);
  const vid = String(video._id || video.id);
  const ownerId = String(video.userId || "");
  const progressRef = fs().collection("viewProgress").doc(pairId(uid, vid));
  const historyRef = fs().collection(db.normalizeCollectionName("WatchHistory")).doc(pairId(uid, vid));
  const requested = Math.max(0, Math.min(Number(seconds) || 0, MAX_SECONDS_PER_REPORT));

  return db.withTimeout(fs().runTransaction(async (tx) => {
    const snap = await tx.get(progressRef);
    const p = snap.exists ? snap.data() : {};
    const last = Number(p.lastReportAt) || 0;
    // The first report has no previous clock: it is bounded by the per-report cap.
    const elapsed = last > 0 ? Math.max(0, (now - last) / 1000) : MAX_SECONDS_PER_REPORT;
    const credit = Math.min(requested, elapsed);
    const verifiedSeconds = (Number(p.verifiedSeconds) || 0) + credit;
    const duration = durationOf(video);
    const threshold = duration > 0 ? Math.min(VIEW_MIN_SECONDS, duration) : VIEW_MIN_SECONDS;
    const isOwner = ownerId && ownerId === uid;
    const newView = !p.viewCounted && !isOwner && verifiedSeconds >= threshold;
    const iso = new Date(now).toISOString();

    tx.set(progressRef, {
      userId: uid, videoId: vid, videoUserId: ownerId,
      verifiedSeconds, lastReportAt: now,
      viewCounted: !!p.viewCounted || newView,
      creditedSeconds: Number(p.creditedSeconds) || 0,
      createdAt: p.createdAt || iso, updatedAt: iso,
    }, { merge: true });
    if (newView) {
      tx.set(historyRef, {
        _id: historyRef.id, id: historyRef.id,
        userId: uid, videoId: vid, videoChannelId: video.channelId || "", videoUserId: ownerId,
        totalWatchTime: Math.min(verifiedSeconds, duration || verifiedSeconds), videoDuration: duration,
        totalWithdrawableAmount: 0, createdAt: iso, updatedAt: iso,
      }, { merge: true });
    }
    return { verifiedSeconds, viewCounted: !!p.viewCounted || newView, newView };
  }));
}

/**
 * Credit the video's creator for verified seconds not paid before.
 * @returns {Promise<{ok:boolean, reason?:string, earnings:number, seconds:number}>}
 */
async function settleCreatorEarning({ userId, video, earningPerHour }) {
  const uid = String(userId);
  const vid = String(video._id || video.id);
  const ownerId = String(video.userId || "");
  if (!ownerId || ownerId === uid) return { ok: false, reason: "SELF_WATCH", earnings: 0, seconds: 0 };
  const rate = Number(earningPerHour);
  if (!(rate > 0)) return { ok: false, reason: "NO_RATE", earnings: 0, seconds: 0 };
  const duration = durationOf(video);
  if (!(duration > 0)) return { ok: false, reason: "NO_DURATION", earnings: 0, seconds: 0 };

  const progressRef = fs().collection("viewProgress").doc(pairId(uid, vid));
  const historyRef = fs().collection(db.normalizeCollectionName("WatchHistory")).doc(pairId(uid, vid));

  // Claim the newly payable seconds atomically; the money moves afterwards
  // (an interruption can under-pay, never pay twice).
  const claim = await db.withTimeout(fs().runTransaction(async (tx) => {
    const [ps, hs] = await Promise.all([tx.get(progressRef), tx.get(historyRef)]);
    if (!ps.exists) return { ok: false, reason: "NO_VERIFIED_VIEWING" };
    const p = ps.data();
    // Earnings follow a counted view (whose WatchHistory row they accrue on).
    if (!p.viewCounted) return { ok: false, reason: "VIEW_NOT_COUNTED" };
    const verified = Math.min(Number(p.verifiedSeconds) || 0, duration);
    if (verified < duration * EARNING_THRESHOLD) return { ok: false, reason: "BELOW_THRESHOLD" };
    const already = Math.min(Number(p.creditedSeconds) || 0, duration);
    const seconds = Math.max(0, verified - already);
    if (seconds <= 0) return { ok: false, reason: "ALREADY_CREDITED" };
    const earnings = Number(((seconds / 3600) * rate).toFixed(4));
    const iso = new Date().toISOString();
    tx.set(progressRef, { creditedSeconds: already + seconds, updatedAt: iso }, { merge: true });
    const h = hs.exists ? hs.data() : null;
    tx.set(historyRef, {
      _id: historyRef.id, id: historyRef.id,
      userId: uid, videoId: vid, videoChannelId: video.channelId || "", videoUserId: ownerId,
      totalWatchTime: verified, videoDuration: duration,
      totalWithdrawableAmount: Number(((Number(h && h.totalWithdrawableAmount) || 0) + earnings).toFixed(4)),
      createdAt: (h && h.createdAt) || iso, updatedAt: iso,
    }, { merge: true });
    return { ok: true, earnings, seconds };
  }));
  if (!claim.ok) return { ...claim, earnings: 0, seconds: 0 };
  return claim;
}

module.exports = { recordViewing, settleCreatorEarning, VIEW_MIN_SECONDS, EARNING_THRESHOLD };
