// Android upload + channel: distinct, machine-readable outcomes for the channel
// lookup and publish paths, server-side channel ownership, retries/double taps
// that must not create duplicates, and that a published video lands in the
// right channel. Stream-style URLs are used because the media policy accepts
// them without R2 configuration (same approach as suite 08).
"use strict";

module.exports = async (h, check, assert) => {
  const { call, seedUser, idToken, set, get, where, nowIso } = h;
  const grants = h.req("util/uploadGrants");
  const uid = (n) => (0x1400 + n).toString(16).padStart(32, "b");
  const streamUrl = (n) => `https://videodelivery.net/${uid(n)}/manifest/video.m3u8`;
  const grant = (n, ownerId) => set("uploadGrants", grants.grantId("stream", uid(n)), {
    provider: "stream", ref: uid(n), ownerId, ownerType: "user", kind: "video",
    createdAt: nowIso(), publishBy: new Date(Date.now() + 3600e3).toISOString(), usedByVideoId: null,
  });
  const img = "https://firebasestorage.googleapis.com/v0/b/b/o/img%2Fp14.jpg?alt=media";
  const body = (n, userId, channelId, extra = {}) => ({
    title: `p14 ${n}`, videoType: 1, videoTime: 30, visibilityType: 1, audienceType: 3, commentType: 1, scheduleType: 2,
    videoPrivacyType: 1, videoUrl: streamUrl(n), videoImage: img, userId, channelId, ...extra,
  });

  await seedUser("p14_owner", { isChannel: true, channelId: "p14_owner", fullName: "p14 owner", channelType: 1 });
  await seedUser("p14_fresh", { isChannel: false, fullName: "p14 fresh" });
  await seedUser("p14_other", { isChannel: true, channelId: "p14_other", fullName: "p14 other" });
  const owner = await idToken("p14_owner"), fresh = await idToken("p14_fresh"), other = await idToken("p14_other");
  const publish = (tok, b) => call("POST", "/client/video/createVideo", { token: tok, body: b });
  const channelVideos = (tok, channelId) => call("GET", `/client/user/videosOfChannel?userId=${channelId}&channelId=${channelId}&start=1&limit=50&videoType=1`, { token: tok });

  // ── Channel lookup outcomes ──────────────────────────────────────────────
  await check("AC-01", "profile tells an owner from a user without a channel (the lookup the app makes before upload)", async () => {
    const a = await call("GET", "/client/user/profile?userId=p14_owner", { token: owner });
    assert.equal(a.status, 200); assert.equal(a.json.user.isChannel, true); assert.equal(a.json.user.channelId, "p14_owner");
    const b = await call("GET", "/client/user/profile?userId=p14_fresh", { token: fresh });
    assert.equal(b.status, 200); assert.notEqual(b.json.user.isChannel, true); assert.ok(!b.json.user.channelId, "no channel id yet");
  });
  await check("AC-02", "failures are distinct: no session 401 AUTH_REQUIRED, bad token 401 AUTH_INVALID, someone else's userId 403 USER_MISMATCH", async () => {
    const none = await call("GET", "/client/user/profile?userId=p14_owner");
    assert.equal(none.status, 401); assert.equal(none.json.code, "AUTH_REQUIRED");
    const bad = await call("GET", "/client/user/profile?userId=p14_owner", { token: owner.slice(0, -5) + "AAAAA" });
    assert.equal(bad.status, 401); assert.equal(bad.json.code, "AUTH_INVALID");
    const wrong = await call("GET", "/client/user/profile?userId=p14_owner", { token: other });
    assert.equal(wrong.status, 403); assert.equal(wrong.json.code, "USER_MISMATCH");
  });
  await check("AC-03", "channel reads carry a code: empty channelId -> CHANNEL_ID_REQUIRED, unknown -> CHANNEL_NOT_FOUND (still HTTP 200 for older apps)", async () => {
    const empty = await call("GET", "/client/user/detailsOfChannel?channelId=&userId=p14_fresh&start=1&limit=20", { token: fresh });
    assert.equal(empty.status, 200); assert.equal(empty.json.status, false); assert.equal(empty.json.code, "CHANNEL_ID_REQUIRED");
    const none = await call("GET", "/client/user/detailsOfChannel?channelId=p14_nobody&userId=p14_owner&start=1&limit=20", { token: owner });
    assert.equal(none.status, 200); assert.equal(none.json.status, false); assert.equal(none.json.code, "CHANNEL_NOT_FOUND");
    const about = await call("GET", "/client/user/aboutOfChannel?channelId=p14_nobody", { token: owner });
    assert.equal(about.json.code, "CHANNEL_NOT_FOUND");
  });

  await check("AC-02b", "a deleted account and a blocked account are told apart from a failed request", async () => {
    // A valid token for a user that has no record (deleted), and a blocked user.
    const g = await call("GET", "/client/user/profile?userId=p14_ghost", { token: await idToken("p14_ghost") });
    assert.equal(g.status, 401); assert.equal(g.json.code, "AUTH_NO_ACCOUNT");
    await seedUser("p14_blk", { isChannel: true, channelId: "p14_blk", isBlock: true });
    const b = await call("GET", "/client/user/profile?userId=p14_blk", { token: await idToken("p14_blk") });
    assert.equal(b.status, 403); assert.equal(b.json.code, "USER_BLOCKED");
  });

  // ── Publishing ───────────────────────────────────────────────────────────
  await check("AC-04", "the owner publishes to their own channel and the video appears in that channel's tab, in the shape the app reads", async () => {
    await grant(1, "p14_owner");
    const r = await publish(owner, body(1, "p14_owner", "p14_owner"));
    assert.equal(r.status, 200); assert.equal(r.json.status, true, JSON.stringify(r.json).slice(0, 200));
    const vid = r.json.video._id || r.json.video.id;
    const tab = await channelVideos(owner, "p14_owner");
    assert.ok(Array.isArray(tab.json.videosTypeWiseOfChannel), "app key present");
    assert.ok(tab.json.videosTypeWiseOfChannel.some((v) => String(v._id) === String(vid)), "published video listed in the owner's channel");
    const stored = await get("videos", String(vid));
    assert.equal(stored.userId, "p14_owner"); assert.equal(stored.channelId, "p14_owner");
  });
  await check("AC-05", "another user can't publish to this channel (403 CHANNEL_NOT_OWNED) nor with someone else's upload; nothing is created", async () => {
    await grant(2, "p14_other");
    const before = (await where("videos", "channelId", "p14_owner")).length;
    const intoOwners = await publish(other, body(2, "p14_other", "p14_owner"));
    assert.equal(intoOwners.status, 403); assert.equal(intoOwners.json.code, "CHANNEL_NOT_OWNED");
    await grant(3, "p14_owner");
    const stolenUpload = await publish(other, body(3, "p14_other", "p14_other"));
    assert.equal(stolenUpload.status, 403); assert.equal(stolenUpload.json.code, "UPLOAD_NOT_OWNED");
    assert.equal((await where("videos", "channelId", "p14_owner")).length, before, "no video added to the owner's channel");
    assert.equal((await where("videos", "channelId", "p14_other")).length, 0, "and none to the other user's");
  });
  await check("AC-06", "the body's userId is not trusted: a token can only publish as itself", async () => {
    await grant(4, "p14_other");
    const r = await publish(other, body(4, "p14_owner", "p14_owner"));
    assert.equal(r.status, 403); assert.equal(r.json.code, "CHANNEL_NOT_OWNED");
  });
  await check("AC-07", "a stale channelId from a user who has no channel yet is a distinct 404 CHANNEL_NOT_FOUND, and creates no channel", async () => {
    await grant(5, "p14_fresh");
    const r = await publish(fresh, body(5, "p14_fresh", "p14_ghost_channel"));
    assert.equal(r.status, 404); assert.equal(r.json.code, "CHANNEL_NOT_FOUND");
    const u = await get("users", "p14_fresh");
    assert.notEqual(u.isChannel, true, "refusal must not create the channel");
    assert.equal((await where("videos", "userId", "p14_fresh")).length, 0);
  });
  await check("AC-08", "a user with no channel publishes once with a name: exactly one channel (their own id) and one video", async () => {
    await grant(6, "p14_fresh");
    const r = await publish(fresh, body(6, "p14_fresh", "", { fullName: "Fresh Channel p14", descriptionOfChannel: "hello" }));
    assert.equal(r.json.status, true, JSON.stringify(r.json).slice(0, 200));
    const u = await get("users", "p14_fresh");
    assert.equal(u.isChannel, true); assert.equal(u.channelId, "p14_fresh");
    assert.equal((await where("users", "channelId", "p14_fresh")).length, 1, "one channel");
    assert.equal((await where("videos", "userId", "p14_fresh")).length, 1, "one video");
  });
  await check("AC-09", "double tap / retry: the same upload published 5 times in parallel and again later gives one video", async () => {
    await seedUser("p14_dbl", { isChannel: true, channelId: "p14_dbl", fullName: "p14 dbl" });
    const dbl = await idToken("p14_dbl");
    await grant(7, "p14_dbl");
    const results = await Promise.all(Array.from({ length: 5 }, () => publish(dbl, body(7, "p14_dbl", "p14_dbl"))));
    const ok = results.filter((r) => r.status === 200 && r.json.status === true);
    assert.ok(ok.length >= 1, "one of them published: " + JSON.stringify(results.map((r) => [r.status, r.json.code])));
    for (const r of results) assert.ok(r.status === 200 || r.json.code === "UPLOAD_IN_PROGRESS", `unexpected ${r.status} ${r.json.code}`);
    const later = await publish(dbl, body(7, "p14_dbl", "p14_dbl"));
    assert.equal(later.status, 200); assert.equal(later.json.alreadyPublished, true);
    assert.equal((await where("videos", "userId", "p14_dbl")).length, 1, "exactly one video");
  });
  await check("AC-10", "a blocked account is refused with its own message, not as a missing channel", async () => {
    await seedUser("p14_blocked", { isChannel: true, channelId: "p14_blocked", isBlock: true });
    const t = await idToken("p14_blocked");
    await grant(8, "p14_blocked");
    const r = await publish(t, body(8, "p14_blocked", "p14_blocked"));
    assert.equal(r.json.status, false); assert.match(r.json.message, /blocked/i);
  });
};
