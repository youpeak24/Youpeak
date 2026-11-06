// Phase 2: video visibility across feeds/search/related/channel/playlist/
// subscription/history (F-12/F-13), viewer-identity binding of browse and
// owner routes (F-18), coin-locked playback (F-27) and unlock idempotency.
"use strict";

module.exports = async (h, check, assert) => {
  const { call, seedUser, idToken, setSettings, nowIso, set, getUser } = h;
  await setSettings({ minSecondsBetweenRewardActions: 0, joiningFeeINR: 0 });

  const creator = "p3_creator", viewer = "p3_viewer", buyer = "p3_buyer";
  await seedUser(creator, { channelId: creator, channelType: 1, videoUnlockCost: 50, isChannel: true });
  await seedUser(viewer, { coin: 1000 });
  await seedUser(buyer, { coin: 1000 });
  const tok = { creator: await idToken(creator), viewer: await idToken(viewer), buyer: await idToken(buyer) };

  const vid = (id, extra = {}) => set("videos", id, {
    userId: creator, channelId: creator, title: `p3 ${id}`, description: "p3search", hashTag: ["p3tag"],
    isActive: true, videoType: 1, scheduleType: 2, visibilityType: 1, videoPrivacyType: 1,
    moderationStatus: "approved", isCopyrightFlagged: false, videoUrl: `https://media.test/${id}.mp4`, createdAt: nowIso(), ...extra,
  });
  const states = {
    p3_pub: {}, p3_private: { visibilityType: 2 }, p3_unlisted: { visibilityType: 3 }, p3_inactive: { isActive: false },
    p3_held: { moderationStatus: "pending_review" }, p3_rejected: { moderationStatus: "rejected" },
    p3_flagged: { isCopyrightFlagged: true }, p3_scheduled: { scheduleType: 1 },
  };
  for (const [id, extra] of Object.entries(states)) await vid(id, extra);
  for (const [id, extra] of Object.entries(states)) await vid(`${id}_s`, { ...extra, videoType: 2 });
  await vid("p3_locked", { videoPrivacyType: 2 });

  const has = (r, id) => JSON.stringify(r.json).includes(`"${id}"`);
  const hidden = ["p3_private", "p3_unlisted", "p3_inactive", "p3_held", "p3_rejected", "p3_flagged", "p3_scheduled"];

  // ── Listings: only public + published + unmoderated, for any caller ─────
  await check("VIS-10", "anonymous and signed-in getVideos list only the public video of the 8 states", async () => {
    for (const r of [await call("GET", "/client/video/getVideos"), await call("GET", "/client/video/getVideos", { token: tok.viewer })]) {
      assert.ok(has(r, "p3_pub"), JSON.stringify(r.json).slice(0, 200));
      for (const id of hidden) assert.ok(!has(r, id), `${id} listed`);
    }
  });
  await check("VIS-11", "searchShorts returns public shorts only (it used to search PRIVATE shorts)", async () => {
    const r = await call("POST", "/client/video/searchShorts", { token: tok.viewer, body: { searchString: "p3search" } });
    assert.equal(r.json.status, true, JSON.stringify(r.json).slice(0, 200));
    assert.ok(has(r, "p3_pub_s"));
    for (const id of hidden) assert.ok(!has(r, `${id}_s`), `${id}_s listed`);
  });
  await check("VIS-12", "searchChannelVideoShortsByUser (videos and shorts) never returns private/held/flagged", async () => {
    for (const type of ["videos", "shorts"]) {
      const r = await call("POST", `/client/video/searchChannelVideoShortsByUser?type=${type}&searchString=p3search`, { token: tok.viewer });
      const sfx = type === "shorts" ? "_s" : "";
      assert.ok(has(r, `p3_pub${sfx}`), `${type}: ${JSON.stringify(r.json).slice(0, 200)}`);
      for (const id of hidden) assert.ok(!has(r, `${id}${sfx}`), `${type}: ${id}${sfx} listed`);
    }
  });
  await check("VIS-13", "getAllLikeThis (related) never returns private/held/flagged/inactive", async () => {
    const r = await call("GET", "/client/video/getAllLikeThis?videoId=p3_pub", { token: tok.viewer });
    for (const id of hidden) assert.ok(!has(r, id), `${id} listed as related`);
  });
  await check("VIS-14", "channel page: others see public only; the verified owner sees own private/held", async () => {
    const other = await call("GET", `/client/user/videosOfChannel?channelId=${creator}`, { token: tok.viewer });
    assert.ok(has(other, "p3_pub"));
    for (const id of ["p3_private", "p3_held", "p3_flagged", "p3_inactive"]) assert.ok(!has(other, id), `${id} shown to other`);
    const anonSpoof = await call("GET", `/client/user/videosOfChannel?channelId=${creator}&userId=${creator}`);
    assert.ok(!has(anonSpoof, "p3_private"), "key-only caller claiming to be the owner saw private videos");
    const own = await call("GET", `/client/user/videosOfChannel?channelId=${creator}`, { token: tok.creator });
    for (const id of ["p3_pub", "p3_private", "p3_held"]) assert.ok(has(own, id), `owner missing ${id}`);
    assert.ok(!has(own, "p3_inactive"));
  });
  await check("VIS-15", "detailsOfVideo: owner opens own held/private video; others and anonymous cannot", async () => {
    for (const id of ["p3_held", "p3_private", "p3_flagged"]) {
      const other = await call("GET", `/client/video/detailsOfVideo?videoId=${id}&videoType=1`, { token: tok.viewer });
      assert.equal(other.json.status, false, `${id} opened by other`);
      const anon = await call("GET", `/client/video/detailsOfVideo?videoId=${id}&videoType=1&userId=${creator}`);
      assert.equal(anon.json.status, false, `${id} opened by key-only caller`);
      const own = await call("GET", `/client/video/detailsOfVideo?videoId=${id}&videoType=1`, { token: tok.creator });
      assert.equal(own.json.status, true, `owner could not open ${id}: ${JSON.stringify(own.json).slice(0, 150)}`);
    }
    const unlisted = await call("GET", "/client/video/detailsOfVideo?videoId=p3_unlisted&videoType=1", { token: tok.viewer });
    assert.equal(unlisted.json.status, true, "unlisted video should open by link");
  });
  await check("VIS-16", "private playlist hidden from others; playlist videos now load and are filtered", async () => {
    await set("PlayList", "p3_pl_pub", { userId: creator, channelId: creator, playListName: "pub", playListType: 2, videoId: ["p3_pub", "p3_private", "p3_held"] });
    await set("PlayList", "p3_pl_priv", { userId: creator, channelId: creator, playListName: "priv", playListType: 1, videoId: ["p3_pub"] });
    const lists = await call("GET", `/client/user/playListsOfChannel?channelId=${creator}`, { token: tok.viewer });
    assert.ok(has(lists, "p3_pl_pub")); assert.ok(!has(lists, "p3_pl_priv"));
    const ownLists = await call("GET", `/client/user/playListsOfChannel?channelId=${creator}`, { token: tok.creator });
    assert.ok(has(ownLists, "p3_pl_priv"));
    const vids = await call("GET", "/client/user/getPlayListVideos?playListId=p3_pl_pub", { token: tok.viewer });
    assert.ok(has(vids, "p3_pub"), JSON.stringify(vids.json).slice(0, 200));
    assert.ok(!has(vids, "p3_private")); assert.ok(!has(vids, "p3_held"));
    const priv = await call("GET", "/client/user/getPlayListVideos?playListId=p3_pl_priv", { token: tok.viewer });
    assert.equal(priv.json.status, false);
  });
  await check("VIS-17", "subscription feed shows the channel's public videos only", async () => {
    await set("UserWiseSubscription", "p3_sub", { userId: viewer, channelId: creator, createdAt: nowIso() });
    const r = await call("GET", "/client/userWiseSubscription/videoOfSubscribedChannel?type=all", { token: tok.viewer });
    assert.equal(r.json.status, true, JSON.stringify(r.json).slice(0, 200));
    for (const id of ["p3_private", "p3_held", "p3_flagged", "p3_inactive"]) assert.ok(!has(r, id), `${id} in subscription feed`);
  });

  // ── F-18: identity comes from the token, never from the request ─────────
  await check("AUTH-01", "owner routes refuse a key-only call and a mismatched token", async () => {
    const routes = [
      ["GET", `/client/notification/getNotificationList?userId=${viewer}`],
      ["GET", `/client/watchHistory/getWatchHistory?userId=${viewer}&startDate=All&endDate=All`],
      ["GET", `/client/premiumPlan/planHistoryOfUser?userId=${viewer}`],
      ["GET", `/client/user/profile?userId=${viewer}`],
      ["POST", "/client/payment/createOrder", { userId: viewer, purpose: "coin_plan" }],
      ["POST", "/client/playList/newPlayList", { userId: viewer, playListName: "x" }],
      ["POST", "/client/saveToWatchLater/addVideoToWatchLater?videoId=p3_pub&userId=" + viewer],
    ];
    for (const [m, p, body] of routes) {
      const anon = await call(m, p, { body });
      assert.equal(anon.status, 401, `${p} key-only -> ${anon.status}`);
      const other = await call(m, p, { body, token: tok.buyer });
      assert.equal(other.status, 403, `${p} other user -> ${other.status}`);
    }
    // Retired legacy fulfilment (PAY-1): refused for everyone, before auth.
    assert.equal((await call("POST", "/client/coinplan/createCoinPlanHistory", { body: { userId: viewer } })).status, 410);
  });
  await check("AUTH-02", "browse routes drop a caller-chosen userId when there is no token", async () => {
    // key-only + someone's userId: treated as anonymous, not as that user.
    const r = await call("GET", `/client/video/getAllLikeThis?videoId=p3_pub&userId=${viewer}`);
    assert.equal(r.json.status, false, "expected 'userId required' for an anonymous caller");
    const ok = await call("GET", "/client/video/getAllLikeThis?videoId=p3_pub", { token: tok.viewer });
    assert.notEqual(ok.status, 401);
  });
  await check("AUTH-03", "browse route with a token for someone else is refused (403)", async () => {
    const r = await call("GET", `/client/video/getVideos?userId=${creator}`, { token: tok.viewer });
    assert.equal(r.status, 403);
  });

  // ── F-27: coin-locked playback ───────────────────────────────────────────
  await check("PAY-01", "locked video URL is withheld from non-buyers in feeds and details", async () => {
    const feed = await call("GET", "/client/video/getVideos", { token: tok.viewer });
    const item = (feed.json.videos || []).find((v) => String(v._id) === "p3_locked");
    assert.ok(item, "locked video should still be listed");
    assert.equal(item.videoUrl, undefined); assert.equal(item.playbackLocked, true);
    const det = await call("GET", "/client/video/detailsOfVideo?videoId=p3_locked&videoType=1", { token: tok.viewer });
    assert.equal(det.json.status, true);
    assert.equal(det.json.detailsOfVideo.videoUrl, undefined, "details leaked the locked URL");
    const own = await call("GET", "/client/video/detailsOfVideo?videoId=p3_locked&videoType=1", { token: tok.creator });
    assert.ok(own.json.detailsOfVideo.videoUrl, "owner must keep the URL");
  });
  await check("PAY-02", "unlock: 5 parallel taps charge once, return the URL, then details carry it", async () => {
    const out = await Promise.all(Array.from({ length: 5 }, () => call("POST", "/client/video/unlockPrivateVideo?videoId=p3_locked", { token: tok.buyer })));
    const charged = out.filter((r) => r.json.status === true);
    assert.equal(charged.length, 1, JSON.stringify(out.map((r) => r.json.message)));
    assert.equal(charged[0].json.videoUrl, "https://media.test/p3_locked.mp4");
    assert.equal((await getUser(buyer)).coin, 950);
    const det = await call("GET", "/client/video/detailsOfVideo?videoId=p3_locked&videoType=1", { token: tok.buyer });
    assert.equal(det.json.detailsOfVideo.videoUrl, "https://media.test/p3_locked.mp4");
  });
  await check("PAY-03", "a held or private video cannot be bought", async () => {
    await vid("p3_locked_held", { videoPrivacyType: 2, moderationStatus: "pending_review" });
    const r = await call("POST", "/client/video/unlockPrivateVideo?videoId=p3_locked_held", { token: tok.buyer });
    assert.equal(r.json.status, false);
    assert.equal((await getUser(buyer)).coin, 950);
  });
};
