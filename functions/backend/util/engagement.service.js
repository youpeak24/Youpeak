/**
 * Viewer engagement state changes that must stay consistent under retries,
 * double taps, parallel tabs and concurrent users: like/dislike, Watch Later
 * and channel subscriptions.
 *
 * Each change runs in ONE Firestore transaction that reads the viewer's
 * current record(s) and the counter it affects, so:
 *   - a viewer has at most one like-or-dislike per video (mutually exclusive);
 *   - the video's like/dislike counters move by exactly the transition, never
 *     by a stale read-modify-write (two users liking at once both count);
 *   - an explicit "set" is idempotent: repeating it (retry after a timeout,
 *     a double tap) changes nothing the second time.
 * Records written here use a deterministic id (`<userId>_<targetId>`); older
 * records with random ids are found by query and folded into it.
 */
"use strict";

const db = require("./connection");

const LIKE_COL = "LikeHistoryOfVideo";
const WATCH_LATER_COL = "SaveToWatchLater";
const SUB_COL = "UserWiseSubscription";

const fs = () => {
  const f = db.getDb();
  if (!f) throw new Error("Firestore is not initialised");
  return f;
};
const col = (name) => fs().collection(db.normalizeCollectionName(name));
const pairId = (a, b) => `${String(a)}_${String(b)}`;
const nowIso = () => new Date().toISOString();

// Firestore transactions retry on contention; a few extra attempts keep
// bursts of concurrent requests from failing outright.
async function runTx(fn) {
  return fs().runTransaction(fn, { maxAttempts: 12 });
}

// The viewer's records for a pair: the deterministic one plus any older
// random-id ones (located before the transaction, then re-read inside it by
// reference — point reads keep concurrent transactions on the same video
// from blocking each other the way query reads do).
async function pairRefs(colRef, fieldA, a, fieldB, b) {
  const det = colRef.doc(pairId(a, b));
  const legacy = await colRef.where(fieldA, "==", String(a)).where(fieldB, "==", String(b)).get();
  const refs = [det, ...legacy.docs.map((d) => d.ref).filter((r) => r.id !== det.id)];
  return { det, refs };
}

async function readAll(tx, refs) {
  const snaps = await tx.getAll(...refs);
  return snaps.filter((d) => d.exists);
}

/**
 * action: "like" | "dislike" | "likeremove" | "dislikeremove" | "none"
 * Returns { ok, before, after, like, dislike, channelId, ownerId } or { ok:false, reason }.
 */
async function setLikeState({ userId, videoId, action }) {
  const uid = String(userId), vid = String(videoId);
  const videoRef = fs().collection("videos").doc(vid);
  const { det: recRef, refs } = await pairRefs(col(LIKE_COL), "userId", uid, "videoId", vid);

  return runTx(async (tx) => {
    const [videoSnap, ...rest] = await tx.getAll(videoRef, ...refs);
    if (!videoSnap.exists || videoSnap.data().isActive === false) return { ok: false, reason: "VIDEO_NOT_FOUND" };
    const video = videoSnap.data();
    const records = rest.filter((d) => d.exists);
    const before = records.some((d) => d.data().likeOrDislike === "like") ? "like"
      : records.some((d) => d.data().likeOrDislike === "dislike") ? "dislike" : null;

    let after = before;
    if (action === "like") after = "like";
    else if (action === "dislike") after = "dislike";
    else if (action === "likeremove") after = before === "like" ? null : before;
    else if (action === "dislikeremove") after = before === "dislike" ? null : before;
    else if (action !== "none") return { ok: false, reason: "INVALID_ACTION" };

    let like = Math.max(0, Number(video.like) || 0);
    let dislike = Math.max(0, Number(video.dislike) || 0);
    if (after !== before) {
      if (before === "like") like = Math.max(0, like - 1);
      if (before === "dislike") dislike = Math.max(0, dislike - 1);
      if (after === "like") like += 1;
      if (after === "dislike") dislike += 1;
      tx.update(videoRef, { like, dislike, updatedAt: nowIso() });
    }
    // Normalise to one deterministic record (or none).
    for (const d of records) if (d.id !== recRef.id) tx.delete(d.ref);
    if (after) {
      const keep = records.find((d) => d.id === recRef.id);
      if (!keep || keep.data().likeOrDislike !== after || records.length > 1 || after !== before) {
        tx.set(recRef, {
          _id: recRef.id, id: recRef.id, userId: uid, videoId: vid, channelId: video.channelId || "",
          likeOrDislike: after, createdAt: keep ? keep.data().createdAt || nowIso() : nowIso(), updatedAt: nowIso(),
        });
      }
    } else if (records.some((d) => d.id === recRef.id)) {
      tx.delete(recRef);
    }
    return { ok: true, before, after, like, dislike, channelId: video.channelId || "", ownerId: String(video.userId || "") };
  });
}

/** saved: true (add) | false (remove). Returns { ok, isSaved, changed }. */
async function setWatchLater({ userId, videoId, saved }) {
  const uid = String(userId), vid = String(videoId);
  const { det: recRef, refs } = await pairRefs(col(WATCH_LATER_COL), "userId", uid, "videoId", vid);
  return runTx(async (tx) => {
    const docs = await readAll(tx, refs);
    const wasSaved = docs.length > 0;
    for (const d of docs) if (!saved || d.id !== recRef.id) tx.delete(d.ref);
    if (saved && !docs.some((d) => d.id === recRef.id)) {
      const createdAt = wasSaved ? docs[0].data().createdAt || nowIso() : nowIso();
      tx.set(recRef, { _id: recRef.id, id: recRef.id, userId: uid, videoId: vid, createdAt, updatedAt: nowIso() });
    }
    return { ok: true, isSaved: !!saved, changed: wasSaved !== !!saved };
  });
}

async function isSubscribed(userId, channelId) {
  const snap = await col(SUB_COL).where("userId", "==", String(userId)).where("channelId", "==", String(channelId)).limit(1).get();
  return !snap.empty;
}

/** Free subscription on/off. Returns { ok, isSubscribed, changed }. */
async function setFreeSubscription({ userId, channelId, subscribed }) {
  const uid = String(userId), ch = String(channelId);
  const { det: recRef, refs } = await pairRefs(col(SUB_COL), "userId", uid, "channelId", ch);
  return runTx(async (tx) => {
    const docs = await readAll(tx, refs);
    const was = docs.length > 0;
    if (!subscribed) {
      for (const d of docs) tx.delete(d.ref);
    } else if (!was) {
      tx.set(recRef, { _id: recRef.id, id: recRef.id, userId: uid, channelId: ch, isPublic: true, expiryDate: null, createdAt: nowIso(), updatedAt: nowIso() });
    }
    return { ok: true, isSubscribed: !!subscribed, changed: was !== !!subscribed };
  });
}

/**
 * Paid subscription: debit the subscriber, credit the channel owner and write
 * the subscription in one transaction, so parallel requests charge once and
 * a failure leaves no half-done state.
 * Returns { ok, changed, isSubscribed } or { ok:false, reason: "INSUFFICIENT"|"NOT_FOUND" }.
 */
async function subscribePaid({ userId, channelId, ownerId, cost }) {
  const uid = String(userId), ch = String(channelId);
  const amount = Number(cost);
  if (!(amount > 0)) return { ok: false, reason: "INVALID_COST" };
  const { det: recRef, refs } = await pairRefs(col(SUB_COL), "userId", uid, "channelId", ch);
  const userRef = fs().collection("users").doc(uid);
  const ownerRef = fs().collection("users").doc(String(ownerId));
  return runTx(async (tx) => {
    const [userSnap, ownerSnap, ...subs] = await tx.getAll(userRef, ownerRef, ...refs);
    if (subs.some((d) => d.exists)) return { ok: true, changed: false, isSubscribed: true };
    if (!userSnap.exists || !ownerSnap.exists) return { ok: false, reason: "NOT_FOUND" };
    const balance = Number(userSnap.data().coin) || 0;
    if (balance < amount) return { ok: false, reason: "INSUFFICIENT" };
    const expiryDate = new Date(); expiryDate.setMonth(expiryDate.getMonth() + 1);
    tx.update(userRef, { coin: balance - amount, updatedAt: nowIso() });
    tx.update(ownerRef, { coin: (Number(ownerSnap.data().coin) || 0) + amount, updatedAt: nowIso() });
    tx.set(recRef, { _id: recRef.id, id: recRef.id, userId: uid, channelId: ch, isPublic: false, expiryDate: expiryDate.toISOString(), createdAt: nowIso(), updatedAt: nowIso() });
    return { ok: true, changed: true, isSubscribed: true };
  });
}

/** Authoritative subscriber count for a channel (actual records). */
async function subscriberCount(channelId) {
  const snap = await col(SUB_COL).where("channelId", "==", String(channelId)).count().get();
  return snap.data().count;
}

module.exports = { setLikeState, setWatchLater, setFreeSubscription, subscribePaid, isSubscribed, subscriberCount, pairId };
