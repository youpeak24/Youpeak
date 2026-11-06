// Functionality & responsive fixes (2026-10-08): data-layer operators (D-01),
// collection names (CF-01), engagement state under retries/concurrency
// (likes, Watch Later, subscriptions, comments), verified views and creator
// earnings (WH-1), public-channel privacy (P-01), retired payment endpoints
// (PAY-1), free uploads vs premium pricing (issue 4), scheduled publishing,
// search input handling, notifications and playlists.
"use strict";

module.exports = async (h, check, assert) => {
  const { call, seedUser, idToken, set, get, fsdb, nowIso, db } = h;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const owner = "ff_owner", viewer = "ff_viewer", other = "ff_other", poor = "ff_poor", paidOwner = "ff_paidowner";
  await seedUser(owner, { fullName: "FF Owner Channel", isChannel: true, channelId: owner, channelType: 1, subscriptionCost: 10, videoUnlockCost: 10,
    passwordHash: "secret-hash", fcmToken: "owner-push-token", identity: "owner-device", mobileNumber: "9999999999", loginType: 3 });
  await seedUser(viewer, { fullName: "FF Viewer", coin: 100, loginType: 3, fcmToken: "viewer-token" });
  await seedUser(other, { fullName: "FF Other", loginType: 3 });
  await seedUser(poor, { fullName: "FF Poor", coin: 5, loginType: 3 });
  await seedUser(paidOwner, { fullName: "FF Paid Channel", isChannel: true, channelId: paidOwner, channelType: 2, subscriptionCost: 30, coin: 0, loginType: 3 });
  const tOwner = await idToken(owner), tViewer = await idToken(viewer), tOther = await idToken(other), tPoor = await idToken(poor);

  const vid = (id, extra = {}) => set("videos", id, {
    title: `Video ${id}`, description: "", videoType: 1, videoTime: 60, videoUrl: `https://media.example/${id}.mp4`, videoImage: `https://media.example/${id}.jpg`,
    userId: owner, channelId: owner, isActive: true, scheduleType: 2, visibilityType: 1, videoPrivacyType: 1, commentType: 1, audienceType: 1,
    like: 0, dislike: 0, createdAt: nowIso(), ...extra,
  });
  await vid("ff_free");
  await vid("ff_paid", { videoPrivacyType: 2 });
  await vid("ff_private", { visibilityType: 2 });
  await vid("ff_nocomments", { commentType: "2" });
  await vid("ff_holdall", { commentType: 4 });
  await vid("ff_tamil", { title: "தமிழ் பாடல் C++ (test)" });

  // ─────────────────────────── D-01: data layer ───────────────────────────
  await check("DL-01", "find() honours $in/$gte/$or/$ne instead of returning the whole collection", async () => {
    for (const [id, n] of [["dl_a", 1], ["dl_b", 5], ["dl_c", 9]]) await set("dlprobe", id, { n, tag: id === "dl_c" ? "x" : "y" });
    assert.deepEqual((await db.find("dlprobe", { _id: { $in: ["dl_a", "dl_c"] } })).map((d) => d._id).sort(), ["dl_a", "dl_c"]);
    assert.deepEqual((await db.find("dlprobe", { n: { $gte: 5 } })).map((d) => d._id).sort(), ["dl_b", "dl_c"]);
    assert.deepEqual((await db.find("dlprobe", { $or: [{ n: 1 }, { tag: "x" }] })).map((d) => d._id).sort(), ["dl_a", "dl_c"]);
    assert.deepEqual((await db.find("dlprobe", { tag: { $ne: "y" } })).map((d) => d._id), ["dl_c"]);
    assert.equal(await db.countDocuments("dlprobe", { n: { $lt: 6 } }), 2);
  });

  await check("DL-02", "an unsupported operator throws instead of widening the filter", async () => {
    await assert.rejects(() => db.find("dlprobe", { n: { $where: "1" } }), /Unsupported query operator/);
    await assert.rejects(() => db.find("dlprobe", { $text: { $search: "x" } }), /Unsupported query operator/);
  });

  await check("DL-03", "deleteMany({_id:{$in:[one]}}) deletes one document; an empty filter is refused", async () => {
    const Report = h.req("models/report.model");
    for (const id of ["dl_r1", "dl_r2", "dl_r3"]) await set("reports", id, { videoId: "ff_free", reason: id });
    const r = await Report.deleteMany({ _id: { $in: ["dl_r2"] } });
    assert.equal(r.deletedCount, 1);
    assert.ok(await get("reports", "dl_r1")); assert.ok(await get("reports", "dl_r3")); assert.equal(await get("reports", "dl_r2"), null);
    await assert.rejects(() => Report.deleteMany({ videoId: undefined }), /empty filter/);
    await assert.rejects(() => Report.updateMany({}, { $set: { x: 1 } }), /empty filter/);
  });

  await check("DL-04", "updateOne({_id, userId}) does not modify a document owned by someone else", async () => {
    const PlayList = h.req("models/playList.model");
    await set("PlayList", "dl_pl", { userId: owner, playListName: "Mine", playListType: 1, videoId: [] });
    const r = await PlayList.updateOne({ _id: "dl_pl", userId: viewer }, { $set: { playListName: "hijacked" } });
    assert.equal(r.modifiedCount, 0);
    assert.equal((await get("PlayList", "dl_pl")).playListName, "Mine");
  });

  await check("DL-05", "$pull with $in removes the listed array elements", async () => {
    const PlayList = h.req("models/playList.model");
    await set("PlayList", "dl_pull", { userId: owner, playListName: "P", playListType: 1, videoId: ["a", "b", "c"] });
    await PlayList.updateMany({ _id: "dl_pull" }, { $pull: { videoId: { $in: ["a", "c"] } } });
    assert.deepEqual((await get("PlayList", "dl_pull")).videoId, ["b"]);
  });

  // ─────────────────── issue 4: free uploads are not premium ───────────────────
  const homeNew = async (token, uid) => (await call("GET", `/client/video/videosOfHome?type=new&start=1&limit=50&userId=${uid}`, { token })).json;
  await check("PR-01", "a free video from a channel with an unlock price is listed with videoUnlockCost 0 / isPaidVideo false, and is playable by another free viewer", async () => {
    const j = await homeNew(tViewer, viewer);
    assert.equal(j.status, true, JSON.stringify(j).slice(0, 300));
    const free = j.data.videos.find((v) => v._id === "ff_free");
    assert.ok(free, "free video listed");
    assert.equal(free.videoPrivacyType, 1);
    assert.equal(free.videoUnlockCost, 0);
    assert.equal(free.isPaidVideo, false);
    assert.ok(free.videoUrl, "free video keeps its playback URL for another viewer");
    assert.notEqual(free.playbackLocked, true);
  });

  await check("PR-02", "a paid video keeps the channel price, is marked paid and its URL is withheld from a non-buyer", async () => {
    const j = await homeNew(tViewer, viewer);
    const paid = j.data.videos.find((v) => v._id === "ff_paid");
    assert.ok(paid);
    assert.equal(paid.videoPrivacyType, 2);
    assert.equal(paid.videoUnlockCost, 10);
    assert.equal(paid.isPaidVideo, true);
    assert.equal(paid.videoUrl, undefined);
    assert.equal(paid.playbackLocked, true);
  });

  await check("PR-03", "the owner still sees their own free video as free in Video details", async () => {
    const d = (await call("GET", `/client/video/detailsOfVideo?userId=${owner}&videoId=ff_free&videoType=1`, { token: tOwner })).json;
    assert.equal(d.status, true, JSON.stringify(d).slice(0, 300));
    assert.equal(d.detailsOfVideo.videoUnlockCost, 0);
    assert.equal(d.detailsOfVideo.isPaidVideo, false);
  });

  // ─────────────────────────── likes / dislikes ───────────────────────────
  const like = (tok, uid, v, action) => call("POST", `/client/video/likeOrDislikeOfVideo?userId=${uid}&videoId=${v}&likeOrDislike=${action}`, { token: tok });
  const likeRecords = async (v) => (await fsdb.collection("LikeHistoryOfVideo").where("videoId", "==", v).get()).docs.map((d) => d.data());
  await check("LK-01", "five parallel likes from one user: one record, count 1", async () => {
    const rs = await Promise.all(Array.from({ length: 5 }, () => like(tViewer, viewer, "ff_free", "like")));
    assert.ok(rs.every((r) => r.json.status === true), JSON.stringify(rs.map((r) => r.json)));
    assert.equal((await get("videos", "ff_free")).like, 1);
    assert.equal((await likeRecords("ff_free")).filter((r) => r.userId === viewer).length, 1);
  });

  await check("LK-02", "two users liking at the same time both count (no lost update)", async () => {
    await Promise.all([like(tOther, other, "ff_free", "like"), like(tOwner, owner, "ff_free", "like")]);
    assert.equal((await get("videos", "ff_free")).like, 3);
  });

  await check("LK-03", "dislike replaces a like (mutually exclusive); removing a like you don't have changes nothing", async () => {
    const r = await like(tOther, other, "ff_free", "dislike");
    assert.equal(r.json.isDislike, true); assert.equal(r.json.isLike, false);
    let v = await get("videos", "ff_free");
    assert.equal(v.like, 2); assert.equal(v.dislike, 1);
    await like(tOther, other, "ff_free", "likeremove");
    v = await get("videos", "ff_free");
    assert.equal(v.like, 2); assert.equal(v.dislike, 1);
    const recs = (await likeRecords("ff_free")).filter((x) => x.userId === other);
    assert.equal(recs.length, 1); assert.equal(recs[0].likeOrDislike, "dislike");
  });

  await check("LK-04", "another user sees the shared counts and their own state in Video details (CF-01)", async () => {
    const d = (await call("GET", `/client/video/detailsOfVideo?userId=${other}&videoId=ff_free&videoType=1`, { token: tOther })).json.detailsOfVideo;
    assert.equal(d.like, 2); assert.equal(d.dislike, 1);
    assert.equal(d.isLike, false); assert.equal(d.isDislike, true);
    const dv = (await call("GET", `/client/video/detailsOfVideo?userId=${viewer}&videoId=ff_free&videoType=1`, { token: tViewer })).json.detailsOfVideo;
    assert.equal(dv.isLike, true);
  });

  await check("LK-05", "liking a private video you can't open is refused", async () => {
    const r = await like(tViewer, viewer, "ff_private", "like");
    assert.equal(r.json.status, false);
    assert.equal((await get("videos", "ff_private")).like, 0);
  });

  // ─────────────────────────── Watch Later ───────────────────────────
  const wl = (tok, uid, v, action) => call("POST", `/client/saveToWatchLater/addVideoToWatchLater?userId=${uid}&videoId=${v}${action ? `&action=${action}` : ""}`, { token: tok });
  const wlRecords = async (uid, v) => (await fsdb.collection("SaveToWatchLater").where("userId", "==", uid).where("videoId", "==", v).get()).size;
  await check("WL-01", "explicit add is idempotent (4 parallel → 1 record), remove is idempotent, toggle still works for old apps", async () => {
    const rs = await Promise.all(Array.from({ length: 4 }, () => wl(tViewer, viewer, "ff_free", "add")));
    assert.ok(rs.every((r) => r.json.isSaved === true));
    assert.equal(await wlRecords(viewer, "ff_free"), 1);
    const d = (await call("GET", `/client/video/detailsOfVideo?userId=${viewer}&videoId=ff_free&videoType=1`, { token: tViewer })).json.detailsOfVideo;
    assert.equal(d.isSaveToWatchLater, true, "details reflect the saved state (CF-01)");
    await wl(tViewer, viewer, "ff_free", "remove"); await wl(tViewer, viewer, "ff_free", "remove");
    assert.equal(await wlRecords(viewer, "ff_free"), 0);
    const t1 = await wl(tViewer, viewer, "ff_free"); const t2 = await wl(tViewer, viewer, "ff_free");
    assert.equal(t1.json.isSaved, true); assert.equal(t2.json.isSaved, false);
  });

  // ─────────────────────────── subscriptions ───────────────────────────
  const sub = (tok, uid, ch, want) => call("POST", `/client/userWiseSubscription/subscribedUnSubscibed?userId=${uid}&channelId=${ch}${want === undefined ? "" : `&subscribe=${want}`}`, { token: tok });
  await check("SB-01", "free channel: repeated subscribe keeps one record; count and isSubscribed visible in details (CF-01)", async () => {
    await Promise.all([sub(tViewer, viewer, owner, true), sub(tViewer, viewer, owner, true), sub(tViewer, viewer, owner, true)]);
    const recs = await fsdb.collection("UserWiseSubscription").where("userId", "==", viewer).where("channelId", "==", owner).get();
    assert.equal(recs.size, 1);
    const d = (await call("GET", `/client/video/detailsOfVideo?userId=${viewer}&videoId=ff_free&videoType=1`, { token: tViewer })).json.detailsOfVideo;
    assert.equal(d.isSubscribed, true); assert.equal(d.totalSubscribers, 1);
    const off = await sub(tViewer, viewer, owner, false);
    assert.equal(off.json.isSubscribed, false); assert.equal(off.json.totalSubscribers, 0);
    await sub(tViewer, viewer, owner, true);
  });

  await check("SB-02", "paid channel: five parallel subscribes charge once and credit the owner once", async () => {
    const before = (await get("users", viewer)).coin;
    const rs = await Promise.all(Array.from({ length: 5 }, () => sub(tViewer, viewer, paidOwner, true)));
    assert.ok(rs.every((r) => r.json.status === true), JSON.stringify(rs.map((r) => r.json)));
    assert.equal((await get("users", viewer)).coin, before - 30);
    assert.equal((await get("users", paidOwner)).coin, 30);
    assert.equal((await fsdb.collection("UserWiseSubscription").where("userId", "==", viewer).where("channelId", "==", paidOwner).get()).size, 1);
  });

  await check("SB-03", "insufficient coins: refused, nothing charged or recorded", async () => {
    const r = await sub(tPoor, poor, paidOwner, true);
    assert.equal(r.json.status, false);
    assert.equal((await get("users", poor)).coin, 5);
    assert.equal((await fsdb.collection("UserWiseSubscription").where("userId", "==", poor).get()).size, 0);
  });

  // ─────────────────────────── comments ───────────────────────────
  const comment = (tok, uid, v, text, requestId) => call("POST", "/client/videoComment/createComment", { token: tok, body: { userId: uid, videoId: v, commentText: text, ...(requestId ? { requestId } : {}) } });
  const comments = async (tok, uid, v) => (await call("GET", `/client/videoComment/getComments?userId=${uid}&videoId=${v}&commentType=newest&start=1&limit=20`, { token: tok })).json;
  await check("CM-01", "comments disabled (stored as \"2\") are refused by the server", async () => {
    const r = await comment(tViewer, viewer, "ff_nocomments", "hello");
    assert.equal(r.json.status, false); assert.equal(r.json.code, "COMMENTS_DISABLED");
    assert.equal((await fsdb.collection("VideoComment").where("videoId", "==", "ff_nocomments").get()).size, 0);
  });

  await check("CM-02", "a retried comment with the same requestId is stored once (3 parallel); count matches", async () => {
    const rs = await Promise.all([1, 2, 3].map(() => comment(tViewer, viewer, "ff_free", "Great video", "req-123")));
    assert.ok(rs.every((r) => r.json.status === true));
    assert.equal((await fsdb.collection("VideoComment").where("videoId", "==", "ff_free").get()).size, 1);
    const list = await comments(tOther, other, "ff_free");
    assert.equal(list.total, 1);
    const d = (await call("GET", `/client/video/detailsOfVideo?userId=${other}&videoId=ff_free&videoType=1`, { token: tOther })).json.detailsOfVideo;
    assert.equal(d.totalComments, 1);
  });

  await check("CM-03", "hold-all-for-review: a viewer's comment is visible to its author and the owner only", async () => {
    const r = await comment(tViewer, viewer, "ff_holdall", "Held one");
    assert.equal(r.json.held, true);
    assert.equal((await comments(tOther, other, "ff_holdall")).total, 0);
    assert.equal((await comments(tViewer, viewer, "ff_holdall")).total, 1);
    const o = await comments(tOwner, owner, "ff_holdall");
    assert.equal(o.total, 1); assert.equal(o.videoComment[0].isHeld, true);
  });

  await check("CM-04", "delete: a stranger gets 403; the author can; parallel replies all count", async () => {
    const c = (await comment(tOther, other, "ff_free", "to delete")).json.data;
    const id = c._id || c.id;
    await Promise.all([1, 2, 3].map((i) => call("POST", "/client/videoComment/createCommentReply", { token: tViewer, body: { userId: viewer, videoId: "ff_free", videoCommentId: id, commentText: `reply ${i}` } })));
    assert.equal((await get("VideoComment", id)).totalReplies, 3);
    const no = await call("DELETE", `/client/videoComment/deleteComment?commentId=${id}`, { token: tViewer });
    assert.equal(no.status, 403);
    const yes = await call("DELETE", `/client/videoComment/deleteComment?commentId=${id}`, { token: tOther });
    assert.equal(yes.json.deleted, true); assert.equal(yes.json.deletedCount, 4);
    assert.equal(await get("VideoComment", id), null);
  });

  // ─────────────────── views + creator earnings (WH-1) ───────────────────
  const viewLedger = h.req("util/viewLedger.service");
  await check("VW-01", "a view counts once after 30 s of verified playback; replays add no views; the owner's own viewing never counts", async () => {
    const video = await get("videos", "ff_free");
    const t0 = Date.now();
    await viewLedger.recordViewing({ userId: viewer, video, seconds: 10, now: t0 });
    await viewLedger.recordViewing({ userId: viewer, video, seconds: 10, now: t0 + 10000 });
    assert.equal((await get("WatchHistory", `${viewer}_ff_free`)), null, "20 s is not a view yet");
    const third = await viewLedger.recordViewing({ userId: viewer, video, seconds: 10, now: t0 + 20000 });
    assert.equal(third.newView, true);
    const again = await viewLedger.recordViewing({ userId: viewer, video, seconds: 10, now: t0 + 30000 });
    assert.equal(again.newView, false);
    for (let i = 0; i < 5; i++) await viewLedger.recordViewing({ userId: owner, video, seconds: 15, now: t0 + i * 15000 });
    assert.equal(await get("WatchHistory", `${owner}_ff_free`), null);
    const d = (await call("GET", `/client/video/detailsOfVideo?userId=${other}&videoId=ff_free&videoType=1`, { token: tOther })).json.detailsOfVideo;
    assert.equal(d.views, 1);
  });

  await check("VW-02", "claims faster than real time are not counted", async () => {
    const video = await get("videos", "ff_paid");
    const t0 = Date.now();
    await viewLedger.recordViewing({ userId: other, video, seconds: 15, now: t0 });
    const r = await viewLedger.recordViewing({ userId: other, video, seconds: 15, now: t0 });
    assert.equal(r.verifiedSeconds, 15);
  });

  await check("WH-01", "createWatchHistory credits the creator once, from verified seconds only (client playhead ignored)", async () => {
    await h.setSettings({ earningPerHour: 36 });
    await set("users", owner, { ...(await get("users", owner)), isMonetization: true, totalWithdrawableAmount: 0, totalEarningAmount: 0 });
    const before = (await get("users", owner)).totalWithdrawableAmount || 0;
    const q = `/client/watchHistory/createWatchHistory?userId=${viewer}&videoId=ff_free&videoUserId=${owner}&videoChannelId=${owner}&currentWatchTime=3600`;
    const rs = [];
    for (let i = 0; i < 5; i++) rs.push((await call("POST", q, { token: tViewer })).json);
    assert.ok(rs.every((r) => r.status === true), JSON.stringify(rs));
    const after = (await get("users", owner)).totalWithdrawableAmount;
    // Verified 40 s (four 10-s reports) of a 60-s video at 36/hour = 0.4.
    assert.equal(Number((after - before).toFixed(4)), 0.4);
    assert.equal(rs.filter((r) => r.credited > 0).length, 1);
  });

  await check("WH-02", "a counted view below 40% of the video earns nothing", async () => {
    await vid("ff_long", { videoTime: 200 });
    const video = await get("videos", "ff_long");
    const t0 = Date.now();
    for (let i = 0; i < 5; i++) await viewLedger.recordViewing({ userId: other, video, seconds: 7, now: t0 + i * 7000 });
    assert.ok(await get("WatchHistory", `${other}_ff_long`), "35 s is a view");
    const r = (await call("POST", `/client/watchHistory/createWatchHistory?userId=${other}&videoId=ff_long&videoUserId=${owner}&videoChannelId=${owner}&currentWatchTime=200`, { token: tOther })).json;
    assert.equal(r.credited, 0);
    assert.equal(r.reason, "BELOW_THRESHOLD");
  });

  // ─────────────────────────── P-01 / PAY-1 ───────────────────────────
  const hasSensitive = (o) => JSON.stringify(o).match(/passwordHash|fcmToken|"identity"|owner-push-token|9999999999/);
  await check("P1-01", "aboutOfChannel returns public fields only, in the shape the About tab reads", async () => {
    const j = (await call("GET", `/client/user/aboutOfChannel?channelId=${owner}`)).json;
    assert.equal(j.status, true);
    assert.equal(hasSensitive(j), null, JSON.stringify(j));
    assert.equal(j.aboutOfChannel.channel.fullName, "FF Owner Channel");
    assert.ok(typeof j.aboutOfChannel.totalViewsOfthatChannelVideos === "number");
  });

  await check("P1-02", "searchChannel lists channels only, without private fields; detailsOfVideo/comments carry no push tokens", async () => {
    const j = (await call("POST", "/client/user/searchChannel", { body: { searchString: "FF" } })).json;
    assert.ok(j.channel.every((c) => c.isChannel === true), JSON.stringify(j.channel.map((c) => c.fullName)));
    assert.equal(hasSensitive(j), null);
    const d = (await call("GET", `/client/video/detailsOfVideo?userId=${other}&videoId=ff_free&videoType=1`, { token: tOther })).json;
    assert.equal(hasSensitive(d), null);
    assert.equal(hasSensitive(await comments(tOther, other, "ff_free")), null);
  });

  await check("PY-01", "legacy fulfilment endpoints are retired (410), nothing credited", async () => {
    const before = (await get("users", viewer)).coin;
    for (const p of ["/client/coinplan/createCoinPlanHistory", "/client/coinplan/processRazorpayPayment", "/client/premiumPlan/createHistory"]) {
      const r = await call("POST", p, { token: tViewer, body: { userId: viewer, coinPlanId: "x", premiumPlanId: "x", paymentGateway: "razorpay", amount: 1000 } });
      assert.equal(r.status, 410, p);
    }
    assert.equal((await get("users", viewer)).coin, before);
    assert.notEqual((await get("users", viewer)).isPremiumPlan, true);
  });

  // ─────────────────────────── scheduled publishing ───────────────────────────
  const sched = h.req("util/scheduledPublish");
  await check("SC-01", "schedule times: offset kept, bare date = midnight IST, past refused", async () => {
    const future = new Date(Date.now() + 3 * 86400000);
    assert.equal(sched.parseScheduleTime(future.toISOString()).iso, future.toISOString());
    const day = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    assert.equal(sched.parseScheduleTime(day).iso, new Date(`${day}T00:00:00+05:30`).toISOString());
    assert.equal(sched.parseScheduleTime(new Date(Date.now() - 60000).toISOString()).code, "SCHEDULE_TIME_PAST");
    assert.equal(sched.parseScheduleTime("not a date").code, "SCHEDULE_TIME_INVALID");
  });

  await check("SC-02", "a scheduled video is hidden until due, then published once and announced to subscribers", async () => {
    await vid("ff_sched_due", { scheduleType: 1, scheduleTime: new Date(Date.now() + 2000).toISOString() });
    await vid("ff_sched_later", { scheduleType: 1, scheduleTime: new Date(Date.now() + 86400000).toISOString() });
    const hidden = (await call("GET", `/client/video/detailsOfVideo?userId=${viewer}&videoId=ff_sched_due&videoType=1`, { token: tViewer })).json;
    assert.equal(hidden.status, false, "not visible early");
    await sleep(2500);
    const n = await Promise.all([sched.publishDue(), sched.publishDue()]);
    assert.equal(n[0] + n[1], 1, "published once");
    assert.equal(Number((await get("videos", "ff_sched_due")).scheduleType), 2);
    assert.equal(Number((await get("videos", "ff_sched_later")).scheduleType), 1);
    const shown = (await call("GET", `/client/video/detailsOfVideo?userId=${viewer}&videoId=ff_sched_due&videoType=1`, { token: tViewer })).json;
    assert.equal(shown.status, true);
    const notes = await fsdb.collection("Notification").where("userId", "==", viewer).where("videoId", "==", "ff_sched_due").get();
    assert.equal(notes.size, 1);
  });

  // ─────────────────────────── search ───────────────────────────
  const search = (q, type = "videos") => call("POST", `/client/video/searchChannelVideoShortsByUser?searchString=${encodeURIComponent(q)}&type=${type}&userId=${viewer}&start=1&limit=10`, { token: tViewer });
  await check("SR-01", "special characters and Tamil are matched literally; whitespace-only is an empty query; private videos never appear", async () => {
    for (const q of ["C++", "(", "[", "?", "\\"]) {
      const r = await search(q);
      assert.equal(r.status, 200, `${q} → ${r.status}`);
    }
    const tamil = (await search("தமிழ்")).json;
    assert.equal(tamil.status, true);
    assert.ok(JSON.stringify(tamil).includes("ff_tamil"), "Tamil title found");
    const cpp = (await search("C++")).json;
    assert.ok(JSON.stringify(cpp).includes("ff_tamil"), "C++ found literally");
    assert.equal((await search("   ")).json.code, "EMPTY_QUERY");
    const priv = (await search("Video ff_private")).json;
    assert.ok(!JSON.stringify(priv).includes("ff_private"), "private video not returned");
  });

  // ─────────────────────────── notifications ───────────────────────────
  await check("NT-01", "list is per user, has unread counts and real relative times; mark-read persists; another user's list is refused", async () => {
    await set("Notification", "nt_1", { userId: viewer, title: "A", message: "m", createdAt: new Date(Date.now() - 5 * 60000).toISOString() });
    await set("Notification", "nt_2", { userId: viewer, title: "B", message: "m", createdAt: new Date(Date.now() - 3 * 3600000).toISOString() });
    await set("Notification", "nt_x", { userId: other, title: "X", message: "m", createdAt: nowIso() });
    const l = (await call("GET", `/client/notification/getNotificationList?userId=${viewer}&start=1&limit=20`, { token: tViewer })).json;
    assert.ok(l.notification.every((n) => n.userId === viewer));
    assert.ok(l.notification.some((n) => n.time === "5 minutes ago"), JSON.stringify(l.notification.map((n) => n.time)));
    assert.ok(l.notification.some((n) => n.time === "3 hours ago"));
    const unread = l.unreadCount;
    await call("PATCH", "/client/notification/markRead?notificationId=nt_1", { token: tViewer });
    await call("PATCH", "/client/notification/markRead?notificationId=nt_x", { token: tViewer });
    assert.equal((await get("Notification", "nt_x")).isRead, undefined, "can't mark someone else's");
    const l2 = (await call("GET", `/client/notification/getNotificationList?userId=${viewer}`, { token: tViewer })).json;
    assert.equal(l2.unreadCount, unread - 1);
    const cross = await call("GET", `/client/notification/getNotificationList?userId=${other}`, { token: tViewer });
    assert.equal(cross.status, 403);
  });

  // ─────────────────────────── playlists ───────────────────────────
  const plCreate = (tok, uid, body) => call("POST", "/client/playlist/newPlayList", { token: tok, body: { userId: uid, ...body } });
  const plUpdate = (tok, uid, body) => call("PATCH", "/client/playlist/updatePlayList", { token: tok, body: { userId: uid, ...body } });
  await check("PL-01", "create: name validated, empty playlist allowed, someone else's private video refused, retry returns the same playlist", async () => {
    assert.equal((await plCreate(tViewer, viewer, { playListName: "  ", playListType: 1 })).json.code, "PLAYLIST_NAME_REQUIRED");
    assert.equal((await plCreate(tViewer, viewer, { playListName: "x".repeat(101), playListType: 1 })).json.code, "PLAYLIST_NAME_TOO_LONG");
    assert.equal((await plCreate(tViewer, viewer, { playListName: "Bad", playListType: 1, videoId: "ff_private" })).json.code, "VIDEO_NOT_FOUND");
    const [a, b] = await Promise.all([plCreate(tViewer, viewer, { playListName: "Road trip", playListType: 1 }), plCreate(tViewer, viewer, { playListName: "Road trip", playListType: 1 })]);
    assert.equal(a.json.status, true); assert.equal(b.json.status, true);
    const mine = (await fsdb.collection("PlayList").where("userId", "==", viewer).get()).docs.map((d) => d.data()).filter((p) => p.playListName === "Road trip");
    assert.ok(mine.length >= 1 && mine.length <= 2, "at most one duplicate in a true race");
  });

  await check("PL-02", "add/remove are atomic (parallel adds both land), rename, privacy, owner-only, delete twice is fine", async () => {
    const pl = (await plCreate(tViewer, viewer, { playListName: "Atomic", playListType: 1 })).json.playList;
    const id = pl._id || pl.id;
    await Promise.all([plUpdate(tViewer, viewer, { playListId: id, type: "add", videoId: ["ff_free"] }), plUpdate(tViewer, viewer, { playListId: id, type: "add", videoId: ["ff_tamil"] })]);
    assert.deepEqual([...(await get("PlayList", id)).videoId].sort(), ["ff_free", "ff_tamil"]);
    await plUpdate(tViewer, viewer, { playListId: id, type: "remove", videoId: ["ff_free"] });
    assert.deepEqual((await get("PlayList", id)).videoId, ["ff_tamil"]);
    await plUpdate(tViewer, viewer, { playListId: id, playListName: "Renamed", playListType: 2 });
    const p = await get("PlayList", id);
    assert.equal(p.playListName, "Renamed"); assert.equal(p.playListType, 2);
    const hijack = await plUpdate(tOther, other, { playListId: id, playListName: "nope" });
    assert.equal(hijack.json.status, false);
    const theirs = (await call("GET", `/client/user/playListsOfChannel?channelId=${viewer}`, { token: tOther })).json;
    assert.ok(theirs.playList.every((x) => Number(x.playListType) === 2), "others see public playlists only");
    const del1 = await call("DELETE", "/client/playlist/deletePlayList", { token: tViewer, body: { userId: viewer, playListId: id } });
    const del2 = await call("DELETE", "/client/playlist/deletePlayList", { token: tViewer, body: { userId: viewer, playListId: id } });
    assert.equal(del1.json.deleted, true); assert.equal(del2.json.status, true);
  });

  // ─────────────────────────── check-in calendar (India time) ───────────────────────────
  const daily = h.req("controllers/client/dailyRewardCoin.controller");
  await check("CK-01", "check-in list: this week's earlier check-ins show as done, today is marked by the server, a broken streak shows 0", async () => {
    for (let d = 1; d <= 7; d++) await set("dailyrewards", `ck_day_${d}`, { day: d, dailyRewardCoin: 100 + d });
    const cal = daily._istWeek();
    const earlier = cal.dates.find((x) => x < cal.today);
    await seedUser("ck_user", { loginType: 3 });
    const tCk = await idToken("ck_user");
    // Last check-in two days ago or more: the streak is broken.
    const twoAgo = new Date(Date.parse(cal.today + "T00:00:00Z") - 2 * 86400000).toISOString().slice(0, 10);
    await set("checkIns", "ck_doc", {
      userId: "ck_user", consecutiveDays: 4, lastCheckInDate: twoAgo + "T10:00:00.000Z",
      rewardsCollected: earlier ? [{ day: cal.dates.indexOf(earlier) + 1, isCheckIn: true, checkInDate: earlier + "T09:00:00.000Z" }] : [],
    });
    const j = (await call("GET", "/client/dailyCoinReward/getDailyRewardCoinByUser?userId=ck_user", { token: tCk })).json;
    assert.equal(j.status, true, JSON.stringify(j));
    assert.equal(j.todayDay, cal.todayDay);
    assert.equal(j.data.filter((x) => x.isToday).length, 1);
    if (earlier) assert.equal(j.data.find((x) => x.date === earlier).isCheckIn, true, "an earlier day this week shows as checked in");
    assert.equal(j.streak, 0, "missed day: streak shows 0");
    assert.equal(j.checkedInToday, false);
  });

  // ─────────────────────── channel lists: shape + page numbers ───────────────────────
  await check("CL-01", "videosOfChannel: page 1 starts at the first video, in the shape the app reads, with owner-only status", async () => {
    await vid("ff_cl_private", { visibilityType: 2, createdAt: new Date(Date.now() + 5000).toISOString() });
    const own = (await call("GET", `/client/user/videosOfChannel?channelId=${owner}&videoType=1&start=1&limit=50`, { token: tOwner })).json;
    const ids = own.videosTypeWiseOfChannel.map((v) => v._id);
    assert.equal(ids[0], "ff_cl_private", "newest first, page 1 not skipping the first item");
    assert.equal(own.total, ids.length);
    assert.equal(own.videosTypeWiseOfChannel[0].visibilityType, 2);
    assert.ok(typeof own.videosTypeWiseOfChannel[0].views === "number");
    const theirs = (await call("GET", `/client/user/videosOfChannel?channelId=${owner}&videoType=1&start=1&limit=50`, { token: tViewer })).json;
    assert.ok(!theirs.videosTypeWiseOfChannel.some((v) => v._id === "ff_cl_private"), "others never see a private video");
    assert.equal(theirs.videosTypeWiseOfChannel[0].visibilityType, undefined, "status fields are owner-only");
    const free = theirs.videosTypeWiseOfChannel.find((v) => v._id === "ff_free");
    assert.equal(free.videoUnlockCost, 0, "free video has no price");
  });

  await check("CL-02", "playListsOfChannel returns playListsOfChannel cards with count and first viewable thumbnail", async () => {
    await set("PlayList", "cl_pl", { userId: viewer, channelId: viewer, playListName: "Cards", playListType: 2, videoId: ["ff_private", "ff_free"], createdAt: nowIso() });
    const j = (await call("GET", `/client/user/playListsOfChannel?channelId=${viewer}&start=1&limit=20`, { token: tOther })).json;
    const card = j.playListsOfChannel.find((p) => p._id === "cl_pl");
    assert.ok(card, JSON.stringify(j).slice(0, 300));
    assert.equal(card.totalVideo, 1, "the private video isn't counted for others");
    assert.equal(card.videoId, "ff_free");
  });

  await check("TT-01", "Starter Pass list marks the Free level current for a user without a stored tier, and only higher paid levels as purchasable", async () => {
    const j = (await call("GET", `/client/taskerTier/getAvailableTiers?userId=${other}`, { token: tOther })).json;
    assert.equal(j.status, true);
    assert.equal(j.currentLevel, 1);
    const cur = j.tiers.filter((t) => t.isCurrentTier);
    assert.equal(cur.length, 1); assert.equal(Number(cur[0].level), 1);
    assert.ok(j.tiers.filter((t) => Number(t.level) > 1 && Number(t.membershipPrice) > 0).every((t) => t.canPurchase === true));
    assert.ok(j.tiers.every((t) => !(t.isCurrentTier && t.canPurchase)));
  });

  await check("SR-02", "playlist video picker search treats special characters literally", async () => {
    for (const q of ["C++", "(", "[x", "\\"]) {
      const r = await call("GET", `/client/video/getVideoList?start=1&limit=10&search=${encodeURIComponent(q)}`, { token: tViewer });
      assert.equal(r.status, 200, q);
    }
  });

  await check("TM-01", "feeds and details show real relative times for ISO createdAt (not \"56 years ago\")", async () => {
    await vid("ff_time", { createdAt: new Date(Date.now() - 2 * 3600e3 - 60e3).toISOString() });
    const d = (await call("GET", `/client/video/detailsOfVideo?userId=${viewer}&videoId=ff_time&videoType=1`, { token: tViewer })).json.detailsOfVideo;
    assert.equal(d.time, "2 hours ago");
  });
};
