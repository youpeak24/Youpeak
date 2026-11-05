// AUDIT: reward caps, creator watch earnings, playback history, comment listing.
"use strict";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async (h, check, assert) => {
  const { call, fsdb, set, seedUser, idToken, setSettings } = h;
  const count = async (col) => (await fsdb.collection(col).get()).size;

  await check("RW-01", "free-tier like cap (5/day, 10 coins) cannot be exceeded by like → convert → unlike cycles", async () => {
    await setSettings({ minSecondsBetweenRewardActions: 3 });
    await seedUser("rw_user", { coin: 0, totalEarningAmount: 0 });
    await seedUser("rw_owner", { isChannel: true, channelId: "rw_owner" });
    await set("videos", "rw_vid", { userId: "rw_owner", channelId: "rw_owner", title: "t", isActive: true, videoType: 1, scheduleType: 2, visibilityType: 1, videoPrivacyType: 1, like: 0, dislike: 0 });
    const tok = await idToken("rw_user");
    let converted = 0;
    for (let i = 0; i < 7; i++) {
      const like = await call("POST", "/client/video/likeOrDislikeOfVideo?videoId=rw_vid&likeOrDislike=like", { token: tok });
      const earned = Number(like.json.coinsEarned) || 0;
      if (earned > 0) {
        const conv = await call("GET", `/client/withdrawalRequest/coinToAmountConverter?coin=${earned}`, { token: tok });
        if (conv.json.status === true) converted += earned;
      }
      await call("POST", "/client/video/likeOrDislikeOfVideo?videoId=rw_vid&likeOrDislike=likeremove", { token: tok });
      await sleep(3200);
    }
    const u = await h.getUser("rw_user");
    assert.ok(converted <= 10, `${converted} coins (₹${converted / 100}) earned from 7 like cycles and converted to cash although the daily like cap is 5 likes = 10 coins; dailyLikesToday=${u.dailyLikesToday}, dailyEarningCoinsToday=${u.dailyEarningCoinsToday}`);
  });

  await check("RW-02", "createWatchHistory credits the creator at most once per (viewer, video)", async () => {
    await seedUser("wh_creator", { isMonetization: true, isChannel: true, channelId: "wh_ch", totalEarningAmount: 0 });
    await seedUser("wh_viewer");
    await set("videos", "wh_vid", { userId: "wh_creator", channelId: "wh_ch", title: "1h", isActive: true, videoType: 1, scheduleType: 2, visibilityType: 1, videoPrivacyType: 1, videoTime: 3600 });
    const tok = await idToken("wh_viewer");
    const q = "/client/watchHistory/createWatchHistory?videoId=wh_vid&videoUserId=wh_creator&videoChannelId=wh_ch&currentWatchTime=3600";
    for (let i = 0; i < 5; i++) { await call("POST", q, { token: tok }); await sleep(400); }
    await sleep(1500);
    const c = await h.getUser("wh_creator");
    const rows = (await fsdb.collection(h.req("models/watchHistory.model").collectionName).get()).size;
    assert.ok((c.totalEarningAmount || 0) <= 2, `creator credited ₹${c.totalEarningAmount} for one 1-hour video watched by one viewer (5 identical calls); watch-history rows stored=${rows}`);
  });

  await check("RW-03", "syncPlayback upserts one resumable row per (user, video)", async () => {
    await seedUser("pb_user");
    await set("videos", "pb_vid", { userId: "wh_creator", channelId: "wh_ch", title: "p", isActive: true, videoType: 1, scheduleType: 2, visibilityType: 1, videoPrivacyType: 1, videoTime: 600 });
    const tok = await idToken("pb_user");
    for (let i = 1; i <= 3; i++) await call("POST", "/client/playbackSession/syncPlayback", { token: tok, body: { videoId: "pb_vid", currentSeconds: i * 10 } });
    const col = h.req("models/playbackSession.model").collectionName;
    const rows = (await fsdb.collection(col).get()).docs.map((d) => d.data());
    const hist = await call("GET", "/client/playbackSession/getMyWatchHistory?start=1&limit=10", { token: tok });
    assert.ok(rows.length === 1 && (hist.json.data || []).length === 1, `3 syncs stored ${rows.length} rows (userId present on ${rows.filter((r) => r.userId).length}); getMyWatchHistory returned ${(hist.json.data || []).length} item(s)`);
  });

  await check("RW-04", "GET videoComment/getComments returns the comments of a video", async () => {
    await seedUser("cm_user");
    const tok = await idToken("cm_user");
    const made = await call("POST", "/client/videoComment/createComment", { token: tok, body: { videoId: "pb_vid", commentText: "hello world" } });
    const list = await call("GET", "/client/videoComment/getComments?videoId=pb_vid&commentType=newest&start=1&limit=10", { token: tok });
    assert.ok(made.json.status === true && list.status === 200 && (list.json.videoComment || []).length === 1, `createComment=${made.json.status}; getComments HTTP ${list.status} status=${list.json.status} msg="${String(list.json.message).slice(0, 120)}" items=${(list.json.videoComment || []).length}`);
  });

  await check("RW-05", "home feed type=all lists videos newest-first or shuffled, not strictly oldest-first by id", async () => {
    await seedUser("hf_user");
    const base = Date.now();
    for (let i = 0; i < 4; i++) await set("videos", `hf_v${i}`, { userId: "wh_creator", channelId: "wh_ch", title: "v" + i, isActive: true, videoType: 1, scheduleType: 2, visibilityType: 1, videoPrivacyType: 1, createdAt: new Date(base + i * 1000).toISOString() });
    const tok = await idToken("hf_user");
    const r = await call("GET", "/client/video/videosOfHome?type=all&start=1&limit=50", { token: tok });
    const ids = ((r.json.data && r.json.data.videos) || []).map((v) => String(v._id)).filter((id) => id.startsWith("hf_v"));
    assert.ok(r.json.status === true && ids.join() !== [...ids].sort().join(), `feed order = ${ids.join(",")} (identical to ascending _id order → randomisation seed has no effect; newest videos are last)`);
  });

  await check("RW-06", "videosOfHome type=popular ranks by view count", async () => {
    const tok = await idToken("hf_user");
    const r = await call("GET", "/client/video/videosOfHome?type=popular&start=1&limit=50", { token: tok });
    const src = require("node:fs").readFileSync(require("node:path").join(h.BACKEND, "controllers/client/video.controller.js"), "utf8");
    const popular = src.split('type === "popular"')[1].split('type === "new"')[0];
    assert.ok(!/\$sort: \{ views: -1 \}/.test(popular), `status=${r.json.status}; popular feed sorts on the lookup ARRAY "views" (\`$sort:{views:-1}\` before \`$size\`), not on a count`);
  });
};
