// Web-release fixes: channel creation (validation, ownership, idempotency,
// name races, browser-compatible name check, Channel Details numerics) and
// video publishing (idempotent publish, concurrent publish, size limit on the
// presigned URL request, cleanup of abandoned uploads).
"use strict";

module.exports = async (h, check, assert) => {
  const { call, seedUser, idToken, set, get, nowIso, fsdb } = h;
  const grants = h.req("util/uploadGrants");

  // ───────────────────────────── channel creation ─────────────────────────────
  const create = (tok, body) => call("PATCH", "/client/user/update", { token: tok, body: { isChannel: true, channelType: 1, ...body } });
  for (const id of ["rf_ann", "rf_ben", "rf_cy", "rf_dee", "rf_legacy"]) await seedUser(id, { fullName: `Profile ${id}` });
  await seedUser("rf_namesake", { fullName: "Taken Name" }); // a plain profile name from before reservations existed
  const ann = await idToken("rf_ann"), ben = await idToken("rf_ben"), cy = await idToken("rf_cy"), dee = await idToken("rf_dee");

  await check("CH-01", "required fields and limits are validated by the server (200 + status:false, with a code)", async () => {
    const noName = await create(ann, { fullName: "  ", descriptionOfChannel: "about" });
    assert.equal(noName.json.status, false); assert.equal(noName.json.code, "CHANNEL_NAME_REQUIRED");
    const noDesc = await create(ann, { fullName: "Ann TV", descriptionOfChannel: " " });
    assert.equal(noDesc.json.code, "CHANNEL_DESCRIPTION_REQUIRED");
    const tooLong = await create(ann, { fullName: "x".repeat(31), descriptionOfChannel: "about" });
    assert.equal(tooLong.json.code, "CHANNEL_NAME_TOO_LONG");
    const badType = await create(ann, { fullName: "Ann TV", descriptionOfChannel: "about", channelType: 7 });
    assert.equal(badType.json.code, "CHANNEL_TYPE_INVALID");
    const u = await get("users", "rf_ann");
    assert.notEqual(u.isChannel, true, "a refused request must not create a channel");
  });

  await check("CH-02", "success: the caller's own profile becomes the channel (channelId = userId), numbers stored as numbers, no credentials in the reply", async () => {
    await set("users", "rf_cred", { fullName: "Cred", isActive: true, passwordHash: "secret-hash", password: "legacy" });
    const cred = await idToken("rf_cred");
    const r = await create(cred, { fullName: "  Cred   Channel ", descriptionOfChannel: " about me ", channelType: "2" });
    assert.equal(r.json.status, true, JSON.stringify(r.json));
    assert.equal(r.json.code, "CHANNEL_CREATED");
    assert.equal(r.json.channelId, "rf_cred");
    assert.equal(r.json.user.passwordHash, undefined); assert.equal(r.json.user.password, undefined);
    const u = await get("users", "rf_cred");
    assert.equal(u.isChannel, true); assert.equal(u.channelId, "rf_cred");
    assert.equal(u.fullName, "Cred Channel"); assert.equal(u.descriptionOfChannel, "about me");
    assert.strictEqual(u.channelType, 2, "channelType must be a number");
    assert.equal(u.subscriptionCost, undefined, "no price is invented: it would list free videos as premium");
    assert.equal(u.videoUnlockCost, undefined);
  });

  await check("CH-03", "double tap / retry / five parallel requests create exactly one channel and one name reservation", async () => {
    const results = await Promise.all(Array.from({ length: 5 }, () => create(ben, { fullName: "Ben Channel", descriptionOfChannel: "hello" })));
    assert.ok(results.every((r) => r.json.status === true), JSON.stringify(results.map((r) => [r.status, r.json.code, r.json.message])));
    assert.equal(results.filter((r) => r.json.alreadyExists === false).length, 1, "exactly one request creates it");
    assert.equal(results.filter((r) => r.json.alreadyExists === true).length, 4);
    const again = await create(ben, { fullName: "Some Other Name", descriptionOfChannel: "changed" });
    assert.equal(again.json.alreadyExists, true);
    assert.equal((await get("users", "rf_ben")).fullName, "Ben Channel", "a retry must not rename the channel");
    const reservations = await fsdb.collection("channelNames").where("ownerId", "==", "rf_ben").get();
    assert.equal(reservations.size, 1);
  });

  await check("CH-04", "two people racing for one name: one wins, case-insensitively; a plain profile name counts as taken", async () => {
    const race = await Promise.all([
      create(cy, { fullName: "Race Name", descriptionOfChannel: "a" }),
      create(dee, { fullName: "race name", descriptionOfChannel: "b" }),
    ]);
    const won = race.filter((r) => r.json.status === true), lost = race.filter((r) => r.json.status === false);
    assert.equal(won.length, 1, JSON.stringify(race.map((r) => r.json.code)));
    assert.equal(lost[0].json.code, "CHANNEL_NAME_TAKEN");
    const legacy = await create(await idToken("rf_legacy"), { fullName: "Taken Name", descriptionOfChannel: "x" });
    assert.equal(legacy.json.code, "CHANNEL_NAME_TAKEN");
  });

  await check("CH-05", "ownership comes from the token: naming another user is refused and creates nothing", async () => {
    await seedUser("rf_victim", { fullName: "Victim" });
    const attack = await call("PATCH", "/client/user/update?userId=rf_victim", { token: ann, body: { isChannel: true, fullName: "Hijack", descriptionOfChannel: "x", channelType: 1 } });
    assert.equal(attack.status, 403); assert.equal(attack.json.code, "USER_MISMATCH");
    const anon = await call("PATCH", "/client/user/update", { body: { isChannel: true, fullName: "Anon", descriptionOfChannel: "x" } });
    assert.equal(anon.status, 401);
    assert.notEqual((await get("users", "rf_victim")).isChannel, true);
  });

  await check("CH-06", "the name check works without a request body (browsers drop the body of a GET)", async () => {
    const free = await call("GET", "/client/video/verifyChannelname?fullName=Brand%20New%20Name", { token: ann });
    assert.equal(free.json.status, true, JSON.stringify(free.json));
    const taken = await call("GET", "/client/video/verifyChannelname?fullName=Ben%20Channel", { token: ann });
    assert.equal(taken.json.status, false); assert.equal(taken.json.code, "CHANNEL_NAME_TAKEN");
    const own = await call("GET", "/client/video/verifyChannelname?fullName=Ben%20Channel", { token: ben });
    assert.equal(own.json.status, true, "a name the caller already owns is available to them");
    const empty = await call("GET", "/client/video/verifyChannelname", { token: ann });
    assert.equal(empty.json.status, false); assert.equal(empty.json.code, "CHANNEL_NAME_REQUIRED");
    // The published Android build sends the name as a JSON body on the GET
    // (node's http allows it; a browser's fetch/XHR does not).
    const http = require("node:http");
    const legacyBody = await new Promise((resolve, reject) => {
      const payload = JSON.stringify({ fullName: "Another Free Name" });
      const r = http.request(h.base + "/client/video/verifyChannelname", { method: "GET", headers: { key: "test-app-key", "content-type": "application/json", "content-length": Buffer.byteLength(payload), authorization: "Bearer " + ann } }, (res) => {
        let data = ""; res.on("data", (c) => (data += c)); res.on("end", () => resolve(JSON.parse(data)));
      });
      r.on("error", reject); r.end(payload);
    });
    assert.equal(legacyBody.status, true, "the published Android build sends the name in the body");
  });

  await check("CH-07", "Channel Details right after creation and for a legacy string-typed profile: numeric fields, totals, no missing keys", async () => {
    const fresh = await call("GET", "/client/user/detailsOfChannel?channelId=rf_ben&userId=rf_ben", { token: ben });
    assert.equal(fresh.json.status, true, JSON.stringify(fresh.json));
    assert.strictEqual(fresh.json.channelType, 1);
    assert.strictEqual(fresh.json.totalVideosOfChannel, 0); assert.strictEqual(fresh.json.totalSubscribers, 0);
    assert.equal(fresh.json.channelName, "Ben Channel");
    assert.ok(Array.isArray(fresh.json.detailsOfChannel));
    await set("users", "rf_strings", { fullName: "Stringly", isActive: true, isChannel: true, channelId: "rf_strings", channelType: "1", subscriptionCost: "10", videoUnlockCost: undefined });
    const legacy = await call("GET", "/client/user/detailsOfChannel?channelId=rf_strings", { token: ann });
    assert.strictEqual(legacy.json.channelType, 1); assert.strictEqual(legacy.json.subscriptionCost, 10); assert.strictEqual(legacy.json.videoUnlockCost, 0);
    const missing = await call("GET", "/client/user/detailsOfChannel?channelId=nobody", { token: ann });
    assert.equal(missing.json.status, false);
  });

  await check("CH-08", "the generic profile update no longer flips isChannel and rejects bad numbers", async () => {
    const flip = await call("PATCH", "/client/user/update", { token: dee, body: { isChannel: false, nickName: "nick" } });
    assert.equal(flip.json.status, true);
    const bad = await call("PATCH", "/client/user/update", { token: dee, body: { subscriptionCost: -5 } });
    assert.equal(bad.json.code, "COST_INVALID");
  });

  // ───────────────────────────── publishing an upload ─────────────────────────────
  const uid = (n) => (0xf000 + n).toString(16).padStart(32, "b");
  const streamUrl = (n) => `https://videodelivery.net/${uid(n)}/manifest/video.m3u8`;
  const grant = (n, ownerId, extra = {}) => set("uploadGrants", grants.grantId("stream", uid(n)), {
    provider: "stream", ref: uid(n), ownerId, ownerType: "user", kind: "video",
    createdAt: nowIso(), publishBy: new Date(Date.now() + 3600e3).toISOString(), usedByVideoId: null, ...extra,
  });
  const body = (n, extra = {}) => ({
    title: `rf ${n}`, videoType: 1, videoTime: 30, visibilityType: 1, audienceType: 3, commentType: 1, scheduleType: 2,
    videoPrivacyType: 1, videoUrl: streamUrl(n), videoImage: "https://firebasestorage.googleapis.com/v0/b/b/o/img%2Frf.jpg?alt=media", ...extra,
  });
  await seedUser("rf_up_alice", { channelId: "rf_up_alice", isChannel: true, fullName: "rf up alice" });
  await seedUser("rf_up_bob", { channelId: "rf_up_bob", isChannel: true, fullName: "rf up bob" });
  const alice = await idToken("rf_up_alice"), bob = await idToken("rf_up_bob");
  const publish = (tok, b) => call("POST", "/client/video/createVideo", { token: tok, body: b });
  const videosTitled = async (title) => (await fsdb.collection("videos").where("title", "==", title).get()).size;

  await check("UP-01", "publishing is idempotent: a retry of the same upload returns the same video, never a second one", async () => {
    await grant(1, "rf_up_alice");
    const first = await publish(alice, body(1));
    assert.equal(first.json.status, true, JSON.stringify(first.json).slice(0, 200));
    const id = first.json.video._id || first.json.video.id;
    const retry = await publish(alice, body(1));
    assert.equal(retry.status, 200); assert.equal(retry.json.status, true); assert.equal(retry.json.alreadyPublished, true);
    assert.equal(retry.json.video._id || retry.json.video.id, id);
    assert.equal(await videosTitled("rf 1"), 1);
  });

  await check("UP-02", "another account cannot publish a used or foreign upload", async () => {
    const stolen = await publish(bob, body(1));
    assert.equal(stolen.status, 403); assert.ok(["UPLOAD_NOT_OWNED", "UPLOAD_ALREADY_USED"].includes(stolen.json.code), stolen.json.code);
    assert.equal(await videosTitled("rf 1"), 1);
  });

  await check("UP-03", "five simultaneous publishes of one upload create exactly one video", async () => {
    await grant(2, "rf_up_alice");
    const results = await Promise.all(Array.from({ length: 5 }, () => publish(alice, body(2))));
    const codes = results.map((r) => `${r.status}:${r.json.code || (r.json.alreadyPublished ? "again" : "ok")}`);
    assert.ok(results.some((r) => r.json.status === true), codes.join(" "));
    for (const r of results) assert.ok(r.json.status === true || r.json.code === "UPLOAD_IN_PROGRESS", codes.join(" "));
    assert.equal(await videosTitled("rf 2"), 1, codes.join(" "));
    // Once it has finished, the stragglers' retry resolves to the same video.
    const after = await publish(alice, body(2));
    assert.equal(after.json.alreadyPublished, true);
    assert.equal(await videosTitled("rf 2"), 1);
  });

  await check("UP-04", "a publish that fails before saving gives the upload back so the retry can succeed", async () => {
    await grant(3, "rf_up_alice");
    const bad = await publish(alice, body(3, { title: "" }));        // invalid details: refused
    assert.equal(bad.json.status, false);
    const g = await get("uploadGrants", grants.grantId("stream", uid(3)));
    assert.equal(g.usedByVideoId, null, "a refused publish must not consume the upload");
  });

  await check("UP-05", "the presigned-URL request validates the declared size and returns the limits", async () => {
    const keep = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_R2_ACCESS_KEY", "CLOUDFLARE_R2_SECRET_KEY", "CLOUDFLARE_R2_BUCKET", "CLOUDFLARE_R2_PUBLIC_DOMAIN"].map((k) => [k, process.env[k]]);
    Object.assign(process.env, { CLOUDFLARE_ACCOUNT_ID: "testacct", CLOUDFLARE_R2_ACCESS_KEY: "testkey", CLOUDFLARE_R2_SECRET_KEY: "testsecret", CLOUDFLARE_R2_BUCKET: "testbucket", CLOUDFLARE_R2_PUBLIC_DOMAIN: "https://media.example.test" });
    try {
      const url = (b) => call("POST", "/client/file/direct-upload-url", { token: alice, body: { folderStructure: "normalvideo", contentType: "video/mp4", ...b } });
      const ok = await url({ fileSize: 5_000_000 });
      assert.equal(ok.json.status, true, JSON.stringify(ok.json));
      assert.match(ok.json.uploadURL, /^https:\/\/(testbucket\.testacct\.r2\.cloudflarestorage\.com|testacct\.r2\.cloudflarestorage\.com\/testbucket)\/normalvideo\/[0-9a-f-]+\.mp4\?/);
      assert.match(ok.json.publicUrl, /^https:\/\/media\.example\.test\/normalvideo\//);
      assert.equal(ok.json.expiresInSeconds, 900); assert.ok(ok.json.maxBytes >= 1e9);
      const grantDoc = await get("uploadGrants", grants.grantId("r2", ok.json.key));
      assert.equal(grantDoc.ownerId, "rf_up_alice");
      assert.equal((await url({})).json.status, true, "older apps send no size");
      const empty = await url({ fileSize: 0 }); assert.equal(empty.status, 400); assert.equal(empty.json.code, "INVALID_FILE_SIZE");
      const huge = await url({ fileSize: 9e12 }); assert.equal(huge.status, 413); assert.equal(huge.json.code, "FILE_TOO_LARGE");
      const type = await url({ contentType: "application/zip" }); assert.equal(type.status, 400); assert.equal(type.json.code, "INVALID_VIDEO_TYPE");
    } finally {
      for (const [k, v] of keep) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
    }
  });

  await check("UP-06", "cleanup removes abandoned uploads after the grace period, keeps referenced and recent ones, and drops old records of published ones", async () => {
    const old = (h2) => new Date(Date.now() - h2 * 3600e3).toISOString();
    const r2grant = (name, extra) => set("uploadGrants", grants.grantId("r2", `cleanup/${name}.mp4`), { provider: "r2", ref: `cleanup/${name}.mp4`, ownerId: "rf_up_alice", ownerType: "user", createdAt: old(200), usedByVideoId: null, ...extra });
    await r2grant("abandoned", { publishBy: old(100) });
    await r2grant("referenced", { publishBy: old(100) });
    await r2grant("published", { publishBy: old(100), usedByVideoId: "some_video" });
    await r2grant("recent", { publishBy: old(30) });      // expired, but inside the 72 h grace
    await r2grant("live", { publishBy: new Date(Date.now() + 3600e3).toISOString() });
    const deleted = [];
    const result = await grants.cleanupExpired({
      limit: 50,
      deleteMedia: async (g) => { deleted.push(g.ref); return true; },
      referencedByVideo: async (g) => g.ref === "cleanup/referenced.mp4",
    });
    assert.ok(deleted.includes("cleanup/abandoned.mp4"));
    assert.deepEqual(deleted.filter((r) => r.startsWith("cleanup/")), ["cleanup/abandoned.mp4"], "only the abandoned file is deleted");
    assert.equal(result.keptReferenced, 1);
    assert.equal(await get("uploadGrants", grants.grantId("r2", "cleanup/abandoned.mp4")), null);
    assert.equal(await get("uploadGrants", grants.grantId("r2", "cleanup/published.mp4")), null);
    assert.ok(await get("uploadGrants", grants.grantId("r2", "cleanup/referenced.mp4")), "a file a video points at must stay");
    assert.ok(await get("uploadGrants", grants.grantId("r2", "cleanup/recent.mp4")));
    assert.ok(await get("uploadGrants", grants.grantId("r2", "cleanup/live.mp4")));
  });

  await check("UP-07", "abandon-upload only deletes the caller's own unpublished uploads", async () => {
    const abandon = (tok, b) => call("POST", "/client/file/abandon-upload", { token: tok, body: b });
    const anon = await call("POST", "/client/file/abandon-upload", { body: { videoUrl: streamUrl(9) } });
    assert.equal(anon.status, 401);
    const ok = await abandon(alice, { videoUrl: "not a url", imageUrl: "" });
    assert.equal(ok.json.status, true, "garbage input is ignored, not an error");
    assert.ok(await get("videos", (await h.where("videos", "title", "rf 1"))[0]._id), "a published video is untouched");
  });
};
