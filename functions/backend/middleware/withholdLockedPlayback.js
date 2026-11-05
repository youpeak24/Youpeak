/**
 * Coin-locked videos (videoPrivacyType 2) are listed publicly, but their
 * playback URL must only reach viewers who may play them (F-27): the owner,
 * a buyer with a VideoUnlock record, or a subscriber of the owner's paid
 * channel (channelType 2). About 25 aggregate pipelines project `videoUrl`
 * for every item, and detailsOfVideo returned it even while computing the
 * video as still locked — so the paywall was cosmetic.
 *
 * This wraps res.json for the client router: every object in a response
 * that has a `videoUrl` and videoPrivacyType 2 is re-checked for the VERIFIED
 * viewer (req.appUserId — never a caller-supplied userId) and, without
 * access, has its playback fields removed and `playbackLocked: true` set.
 * The buyer receives the URL from client/video/unlockPrivateVideo.
 *
 * Limits (external, see audit): R2/Stream objects themselves are public by
 * URL; truly private delivery needs signed Stream URLs or a private bucket.
 */
"use strict";

const db = require("../util/connection");

const PLAYBACK_FIELDS = ["videoUrl", "hlsUrl", "dashUrl", "rawVideoUrl", "streamUid"];
const MAX_DEPTH = 8;

function collect(node, out, depth = 0) {
  if (!node || typeof node !== "object" || depth > MAX_DEPTH) return;
  if (Array.isArray(node)) { for (const v of node) collect(v, out, depth + 1); return; }
  if (Object.prototype.hasOwnProperty.call(node, "videoUrl") && Number(node.videoPrivacyType) === 2) out.push(node);
  for (const v of Object.values(node)) if (v && typeof v === "object") collect(v, out, depth + 1);
}

const idOf = (v) => String((v && (v._id || v.id || v)) || "");

async function accessibleIds(viewerId, items) {
  const allowed = new Set();
  if (!viewerId) return allowed;
  const videoIds = [...new Set(items.map((i) => idOf(i._id || i.videoId)).filter(Boolean))];
  for (const i of items) {
    const owner = idOf(i.userId) || String(i.channelId || "");
    if (owner && owner === String(viewerId)) allowed.add(idOf(i._id || i.videoId));
  }
  const unlocks = await db.find(db.normalizeCollectionName("VideoUnlock"), { userId: String(viewerId) });
  for (const u of unlocks) if (videoIds.includes(String(u.videoId))) allowed.add(String(u.videoId));

  const channelIds = [...new Set(items.map((i) => String(i.channelId || idOf(i.userId) || "")).filter(Boolean))];
  if (channelIds.length) {
    const subs = await db.find(db.normalizeCollectionName("UserWiseSubscription"), { userId: String(viewerId) });
    const subscribed = new Set(subs.map((s) => String(s.channelId)));
    for (const ch of channelIds) {
      if (!subscribed.has(ch)) continue;
      const channelUser = await db.findById("users", ch).catch(() => null);
      if (channelUser && Number(channelUser.channelType) === 2) {
        for (const i of items) if (String(i.channelId || idOf(i.userId)) === ch) allowed.add(idOf(i._id || i.videoId));
      }
    }
  }
  return allowed;
}

function lock(item) {
  for (const f of PLAYBACK_FIELDS) delete item[f];
  item.playbackLocked = true;
}

module.exports = function withholdLockedPlayback(req, res, next) {
  const json = res.json.bind(res);
  res.json = (body) => {
    const items = [];
    collect(body, items);
    if (!items.length) return json(body);
    accessibleIds(req.appUserId, items)
      .then((allowed) => { for (const i of items) if (!allowed.has(idOf(i._id || i.videoId))) lock(i); })
      .catch((e) => { console.error("withholdLockedPlayback:", e.message); for (const i of items) lock(i); })
      .finally(() => json(body));
    return res;
  };
  next();
};
