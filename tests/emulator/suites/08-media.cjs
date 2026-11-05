// Phase 2: upload ownership for publishing (util/uploadGrants.js) and no
// delete-by-URL of other users' media (F-28). Stream-style URLs are used
// because the media policy accepts them without R2 configuration.
"use strict";

module.exports = async (h, check, assert) => {
  const { call, seedUser, idToken, set, get, nowIso } = h;
  const grants = h.req("util/uploadGrants");
  const uid = (n) => n.toString(16).padStart(32, "a");
  const streamUrl = (n) => `https://videodelivery.net/${uid(n)}/manifest/video.m3u8`;
  const grant = (n, ownerId, extra = {}) => set("uploadGrants", grants.grantId("stream", uid(n)), {
    provider: "stream", ref: uid(n), ownerId, ownerType: "user", kind: "video",
    createdAt: nowIso(), publishBy: new Date(Date.now() + 3600e3).toISOString(), usedByVideoId: null, ...extra,
  });
  const body = (n, extra = {}) => ({
    title: `p8 ${n}`, videoType: 1, videoTime: 30, visibilityType: 1, audienceType: 3, commentType: 1, scheduleType: 2,
    videoPrivacyType: 1, videoUrl: streamUrl(n), videoImage: "https://firebasestorage.googleapis.com/v0/b/b/o/img%2Fp8.jpg?alt=media", ...extra,
  });
  await seedUser("p8_alice", { channelId: "p8_alice", isChannel: true, fullName: "p8 alice" });
  await seedUser("p8_bob", { channelId: "p8_bob", isChannel: true, fullName: "p8 bob" });
  const alice = await idToken("p8_alice"), bob = await idToken("p8_bob");
  const create = (tok, b) => call("POST", "/client/video/createVideo", { token: tok, body: b });

  await check("MED-01", "publishing needs the caller's own grant: other user's upload 403, no grant 403, own grant OK", async () => {
    await grant(1, "p8_alice");
    const stolen = await create(bob, body(1));
    assert.equal(stolen.status, 403); assert.equal(stolen.json.code, "UPLOAD_NOT_OWNED");
    const none = await create(alice, body(2));
    assert.equal(none.status, 403); assert.equal(none.json.code, "UPLOAD_NOT_FOUND");
    const own = await create(alice, body(1));
    assert.equal(own.json.status, true, JSON.stringify(own.json).slice(0, 200));
  });
  await check("MED-02", "the same upload can't become two videos (the owner's retry gets the first one back); an expired grant is refused", async () => {
    const again = await create(alice, body(1));
    assert.equal(again.status, 200); assert.equal(again.json.alreadyPublished, true);
    const elsewhere = await create(bob, body(1));
    assert.equal(elsewhere.status, 403);
    // A published upload whose video is gone can't be used again either.
    const g = await get("uploadGrants", grants.grantId("stream", uid(1)));
    await set("uploadGrants", grants.grantId("stream", uid(10)), { ...g, ref: uid(10), usedByVideoId: "p8_deleted_video" });
    const orphaned = await create(alice, body(10));
    assert.equal(orphaned.status, 403); assert.equal(orphaned.json.code, "UPLOAD_ALREADY_USED");
    await grant(3, "p8_alice", { publishBy: new Date(Date.now() - 60e3).toISOString() });
    const expired = await create(alice, body(3));
    assert.equal(expired.json.code, "UPLOAD_EXPIRED");
  });
  await check("MED-03", "failed-publish cleanup deletes only the caller's own unpublished upload (F-28)", async () => {
    const { discardOwnUpload } = h.req("controllers/client/video.controller")._internal;
    const removed = [];
    const spy = async (u) => { removed.push(u); };
    const img = (f) => `https://firebasestorage.googleapis.com/v0/b/b/o/img%2F${f}?alt=media`;
    await set("app_assets", "p8_bobimg.jpg", { fileName: "p8_bobimg.jpg", uploadedBy: "p8_bob" });
    await set("app_assets", "p8_aliceimg.jpg", { fileName: "p8_aliceimg.jpg", uploadedBy: "p8_alice" });
    await grant(5, "p8_alice");
    const asAlice = { appUserId: "p8_alice" };
    await discardOwnUpload(asAlice, img("p8_bobimg.jpg"), spy);     // someone else's image
    await discardOwnUpload(asAlice, streamUrl(6), spy);              // no grant at all
    await discardOwnUpload(asAlice, streamUrl(1), spy);              // own, but already published
    await discardOwnUpload({}, img("p8_aliceimg.jpg"), spy);         // no verified caller
    assert.deepEqual(removed, [], "nothing that isn't the caller's own unpublished upload may be deleted");
    await discardOwnUpload(asAlice, img("p8_aliceimg.jpg"), spy);
    await discardOwnUpload(asAlice, streamUrl(5), spy);
    assert.deepEqual(removed, [img("p8_aliceimg.jpg"), streamUrl(5)]);
  });
  await check("MED-05", "publish without channelId no longer crashes after responding (process survives, video kept)", async () => {
    await grant(7, "p8_alice");
    const r = await create(alice, body(7));
    assert.equal(r.json.status, true, JSON.stringify(r.json).slice(0, 200));
    const again = await call("GET", "/client/video/getVideos", { token: alice });
    assert.equal(again.status, 200, "server must still be up");
  });
  await check("MED-04", "grant records owner, provider and ref; bound to the video after publish", async () => {
    const g = await get("uploadGrants", grants.grantId("stream", uid(1)));
    assert.equal(g.ownerId, "p8_alice"); assert.equal(g.provider, "stream"); assert.ok(g.usedByVideoId);
  });
  await check("MED-06", "media audit dry run lists expired unused uploads and external-URL videos without changing anything", async () => {
    await grant(8, "p8_bob", { publishBy: new Date(Date.now() - 100 * 3600e3).toISOString() });
    await set("videos", "p8_external", { userId: "p8_bob", videoUrl: "https://media.w3.org/2010/05/sintel/trailer.mp4", storageProvider: "r2", isActive: true });
    const ctl = h.req("controllers/admin/mediaAudit.controller");
    const m = h.mockRes(); ctl.report({ query: { graceHours: 72 } }, m.res);
    const r = await m.done;
    assert.equal(r.dryRun, true);
    assert.ok(r.orphanCandidates.some((g) => g.ref === uid(8)));
    const item = r.migrationItems.find((v) => v.videoId === "p8_external");
    assert.ok(item); assert.equal(item.host, "media.w3.org"); assert.equal(item.storedProvider, "r2");
    assert.ok(await get("uploadGrants", grants.grantId("stream", uid(8))), "dry run must not delete grants");
    assert.ok(await get("videos", "p8_external"), "dry run must not delete videos");
  });
};
