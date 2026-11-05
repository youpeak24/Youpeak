/**
 * Scheduled uploads (videos.scheduleType 1 + scheduleTime).
 *
 * A scheduled video stays hidden from everyone but its owner
 * (util/videoVisibility.js) until its scheduleTime; nothing used to publish
 * it afterwards, so scheduled videos stayed hidden forever.
 * publishDue() flips due videos to published (scheduleType 2). It runs from
 * the daily cron and, throttled to once a minute per server instance, before
 * the public video endpoints answer — so a video appears on time without a
 * minute-level cron, and never early.
 *
 * parseScheduleTime() accepts an ISO timestamp with an offset (what the app
 * now sends). An offset-less value from older app versions — a bare
 * "yyyy-MM-dd" — is read as midnight India time, the app's audience,
 * instead of the server's UTC.
 */
"use strict";

const moment = require("moment-timezone");
const db = require("./connection");

const DEFAULT_TZ = "Asia/Kolkata";
const MAX_AHEAD_DAYS = 366;
const THROTTLE_MS = 60 * 1000;
let lastRun = 0;
let running = null;

function parseScheduleTime(value, now = Date.now()) {
  const raw = String(value || "").trim();
  if (!raw) return { ok: false, code: "SCHEDULE_TIME_REQUIRED", message: "Pick a date and time for the scheduled video." };
  const hasOffset = /([zZ]|[+-]\d{2}:?\d{2})$/.test(raw);
  const m = hasOffset ? moment.parseZone(raw, moment.ISO_8601, true) : moment.tz(raw, ["YYYY-MM-DD", "YYYY-MM-DDTHH:mm", "YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DD HH:mm", moment.ISO_8601], true, DEFAULT_TZ);
  if (!m.isValid()) return { ok: false, code: "SCHEDULE_TIME_INVALID", message: "The schedule time isn't a valid date." };
  const at = m.valueOf();
  if (at <= now + 60 * 1000) return { ok: false, code: "SCHEDULE_TIME_PAST", message: "Pick a schedule time in the future." };
  if (at > now + MAX_AHEAD_DAYS * 86400000) return { ok: false, code: "SCHEDULE_TIME_TOO_FAR", message: "You can schedule at most a year ahead." };
  return { ok: true, iso: new Date(at).toISOString() };
}

async function publishDue(now = Date.now()) {
  const fs = db.getDb();
  if (!fs) return 0;
  // scheduleType has been stored as a number and as a string.
  const snaps = await Promise.all([1, "1"].map((v) => db.withTimeout(fs.collection("videos").where("scheduleType", "==", v).get())));
  let published = 0;
  for (const snap of snaps) {
    for (const doc of snap.docs) {
      const v = doc.data();
      const at = Date.parse(v.scheduleTime || "");
      if (!Number.isFinite(at) || at > now) continue;
      // Only the request that flips it announces it (transaction), so two
      // instances publishing at once don't notify twice.
      const ref = fs.collection("videos").doc(doc.id);
      const flipped = await db.withTimeout(fs.runTransaction(async (tx) => {
        const cur = await tx.get(ref);
        if (!cur.exists || Number(cur.data().scheduleType) !== 1) return false;
        tx.update(ref, { scheduleType: 2, publishedAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString() });
        return true;
      }));
      if (!flipped) continue;
      published++;
      try {
        await require("./videoNotifications").notifySubscribersOfNewVideo({ ...v, _id: doc.id, scheduleType: 2 }, { admin: require("./privateKey") });
      } catch (e) { console.error("scheduledPublish notify:", e.message); }
    }
  }
  return published;
}

// Throttled, failure-tolerant hook for request paths.
function publishDueThrottled() {
  const now = Date.now();
  if (running) return running;
  if (now - lastRun < THROTTLE_MS) return Promise.resolve(0);
  lastRun = now;
  running = publishDue(now).catch((e) => { console.error("scheduledPublish:", e.message); return 0; }).finally(() => { running = null; });
  return running;
}

// Express middleware form.
function middleware(req, res, next) {
  publishDueThrottled().finally(() => next());
}

module.exports = { parseScheduleTime, publishDue, publishDueThrottled, middleware, _reset: () => { lastRun = 0; } };
