// AUDIT: Firestore collection-name consistency between Mongoose-shim models, direct db.* calls and
// aggregate $lookup names; feed endpoints that must answer.
"use strict";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async (h, check, assert) => {
  const { call, fsdb, set, seedUser, idToken } = h;
  const WatchHistory = h.req("models/watchHistory.model");
  const VideoComment = h.req("models/videoComment.model");
  const names = {
    WatchHistory: WatchHistory.collectionName, VideoComment: VideoComment.collectionName,
    UserWiseSubscription: h.req("models/userWiseSubscription.model").collectionName,
    LikeHistoryOfVideo: h.req("models/likeHistoryOfVideo.model").collectionName,
    SaveToWatchLater: h.req("models/saveToWatchLater.model").collectionName,
  };

  await check("CF-01", "model collection names equal the names used by aggregate $lookup and direct db.find calls", async () => {
    const lookups = { watchhistories: names.WatchHistory, videocomments: names.VideoComment, userwisesubscriptions: names.UserWiseSubscription, likehistoryofvideos: names.LikeHistoryOfVideo, savetowatchlaters: names.SaveToWatchLater };
    const bad = Object.entries(lookups).filter(([lookup, model]) => h.db.normalizeCollectionName(lookup) !== model).map(([lookup, model]) => `$lookup "${lookup}" → "${h.db.normalizeCollectionName(lookup)}" but model writes "${model}"`);
    assert.deepEqual(bad, [], bad.join("; ") + "; direct db.find uses 'userWiseSubscriptions'");
  });

  await check("CF-02", "a subscription made through the API is visible to the feed (isSubscribed) and to channel details (totalSubscribers)", async () => {
    await seedUser("cf_creator", { isChannel: true, channelId: "cf_creator", channelType: 1, fullName: "Creator CF" });
    await seedUser("cf_viewer", { fullName: "Viewer CF" });
    await set("videos", "cf_vid", { userId: "cf_creator", channelId: "cf_creator", title: "t", isActive: true, videoType: 1, scheduleType: 2, visibilityType: 1, videoPrivacyType: 1, createdAt: new Date().toISOString() });
    const tok = await idToken("cf_viewer");
    const sub = await call("POST", "/client/userWiseSubscription/subscribedUnSubscibed?channelId=cf_creator", { token: tok });
    assert.equal(sub.json.status, true, JSON.stringify(sub.json));
    const feed = await call("GET", "/client/video/getVideos?start=1&limit=10", { token: tok });
    const item = (feed.json.videos || []).find((v) => String(v._id) === "cf_vid");
    const det = await call("GET", "/client/user/detailsOfChannel?channelId=cf_creator&start=1&limit=10", { token: tok });
    assert.ok(item && item.isSubscribed === true && det.json.totalSubscribers === 1,
      `feed isSubscribed=${item && item.isSubscribed}; detailsOfChannel.totalSubscribers=${det.json.totalSubscribers} (expected true / 1)`);
  });

  await check("CF-03", "feed 'views' counts the watch-history rows written by the app", async () => {
    await WatchHistory.create({ userId: "cf_viewer", videoId: "cf_vid", videoUserId: "cf_creator", videoChannelId: "cf_creator" });
    const tok = await idToken("cf_viewer");
    const feed = await call("GET", "/client/video/getVideos?start=1&limit=10", { token: tok });
    const item = (feed.json.videos || []).find((v) => String(v._id) === "cf_vid");
    assert.equal(item && item.views, 1, `views=${item && item.views} after one WatchHistory row was written`);
  });

  await check("CF-04", "GET client/video/shortsOfUser answers within 5 s", async () => {
    await set("videos", "cf_short", { userId: "cf_creator", channelId: "cf_creator", title: "s", isActive: true, videoType: 2, scheduleType: 2, visibilityType: 1, videoPrivacyType: 1, createdAt: new Date().toISOString() });
    const tok = await idToken("cf_viewer");
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 5000);
    let outcome;
    try {
      const r = await fetch(`${h.base}/client/video/shortsOfUser?videoId=cf_short&start=1&limit=10`, { headers: { key: "test-app-key", authorization: `Bearer ${tok}` }, signal: ctl.signal });
      outcome = `HTTP ${r.status}`;
    } catch (e) { outcome = "no response within 5 s (request hangs)"; }
    clearTimeout(timer);
    assert.ok(/^HTTP 2/.test(outcome), outcome);
  });

  await check("CF-05", "a paid-channel subscription stops granting access after its expiryDate", async () => {
    const src = require("node:fs").readFileSync(require("node:path").join(h.BACKEND, "middleware/withholdLockedPlayback.js"), "utf8")
      + require("node:fs").readFileSync(require("node:path").join(h.BACKEND, "controllers/client/video.controller.js"), "utf8");
    assert.ok(/expiryDate/.test(src), "no code path reads UserWiseSubscription.expiryDate; it is written (+1 month) but never enforced");
  });
};
