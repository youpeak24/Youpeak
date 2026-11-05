// Phase 2 audit tests (2026-10-01)
// Covers: F-12 (video visibility), F-13 (anonymous feed), F-19 (bcrypt passwords)
"use strict";

module.exports = async (h, check, assert) => {
  const { fsdb, call, seedUser, getUser, idToken, setSettings, nowIso } = h;

  await setSettings({ minSecondsBetweenRewardActions: 0, joiningFeeINR: 0, adRewardCoins: 20 });

  // --- Seed helper for videos ------------------------------------------------
  async function seedVideo(id, extra = {}) {
    await fsdb.collection("videos").doc(id).set({
      _id: id, id,
      title: id, description: id,
      isActive: true, videoType: 1,
      scheduleType: 2, visibilityType: 1,
      moderationStatus: "approved",
      isCopyrightFlagged: false,
      channelId: extra.userId || "p2_creator",
      userId: extra.userId || "p2_creator",
      createdAt: nowIso(),
      ...extra,
    });
  }

  // --- F-13 / F-12: getVideos feed ------------------------------------------
  await seedUser("p2_creator");
  await seedUser("p2_viewer");
  await seedVideo("p2_vid_pub",      { moderationStatus: "approved" });
  await seedVideo("p2_vid_held",     { moderationStatus: "pending_review" });
  await seedVideo("p2_vid_rejected", { moderationStatus: "rejected" });
  await seedVideo("p2_vid_flagged",  { isCopyrightFlagged: true });
  await seedVideo("p2_vid_private",  { visibilityType: 2 });
  await seedVideo("p2_vid_inactive", { isActive: false });

  await check("VIS-01", "F-13: anonymous getVideos returns only public/approved videos", async () => {
    const r = await call("GET", "/client/video/getVideos");
    assert.equal(r.status, 200);
    const ids = (r.json.videos || []).map((v) => String(v._id || v.id));
    assert.ok(ids.includes("p2_vid_pub"), "expected p2_vid_pub in: " + JSON.stringify(ids));
    assert.ok(!ids.includes("p2_vid_held"),     "held video leaked to anon caller");
    assert.ok(!ids.includes("p2_vid_rejected"), "rejected video leaked to anon caller");
    assert.ok(!ids.includes("p2_vid_flagged"),  "copyright-flagged video leaked to anon caller");
    assert.ok(!ids.includes("p2_vid_private"),  "private video leaked to anon caller");
    assert.ok(!ids.includes("p2_vid_inactive"), "inactive video leaked to anon caller");
  });

  await check("VIS-02", "F-12: authenticated getVideos hides held/flagged/private/inactive", async () => {
    const tok = await idToken("p2_viewer");
    const r = await call("GET", "/client/video/getVideos?userId=p2_viewer", { token: tok });
    assert.equal(r.status, 200);
    const ids = (r.json.videos || []).map((v) => String(v._id || v.id));
    assert.ok(!ids.includes("p2_vid_held"),     "held video leaked to authenticated viewer");
    assert.ok(!ids.includes("p2_vid_rejected"), "rejected video leaked to authenticated viewer");
    assert.ok(!ids.includes("p2_vid_flagged"),  "copyright-flagged video leaked to authenticated viewer");
    assert.ok(!ids.includes("p2_vid_private"),  "private video leaked to authenticated viewer");
    assert.ok(!ids.includes("p2_vid_inactive"), "inactive video leaked to authenticated viewer");
  });

  await check("VIS-03", "F-12: getVideoList hides held/flagged videos", async () => {
    const r = await call("GET", "/client/video/getVideoList");
    assert.equal(r.status, 200);
    const ids = (r.json.videos || []).map((v) => String(v._id || v.id));
    assert.ok(!ids.includes("p2_vid_held"),     "held video leaked via getVideoList");
    assert.ok(!ids.includes("p2_vid_rejected"), "rejected video leaked via getVideoList");
    assert.ok(!ids.includes("p2_vid_flagged"),  "copyright-flagged video leaked via getVideoList");
  });

  await check("VIS-04", "F-12: detailsOfVideo returns false for a held video (non-owner)", async () => {
    const tok = await idToken("p2_viewer");
    const r = await call("GET", "/client/video/detailsOfVideo?userId=p2_viewer&videoId=p2_vid_held&videoType=1", { token: tok });
    assert.equal(r.json.status, false, "expected false for held video, got: " + JSON.stringify(r.json).slice(0, 200));
  });

  await check("VIS-05", "F-12: detailsOfVideo returns false for a copyright-flagged video", async () => {
    const tok = await idToken("p2_viewer");
    const r = await call("GET", "/client/video/detailsOfVideo?userId=p2_viewer&videoId=p2_vid_flagged&videoType=1", { token: tok });
    assert.equal(r.json.status, false, "expected false for flagged video");
  });

  // --- F-19: bcrypt password migration ---------------------------------------
  await check("PW-01", "F-19: signup response does not expose password or passwordHash", async () => {
    const r = await call("POST", "/client/user/login", {
      body: { loginType: 4, identity: "p2-signup-dev", fcmToken: "p2-signup-fcm", email: "p2_new@test.local", password: "s3cr3t!" },
    });
    assert.equal(r.json.status, true, JSON.stringify(r.json));
    const userJson = JSON.stringify(r.json.user || {});
    assert.ok(!userJson.includes("s3cr3t"),    "plaintext password leaked in signup response");
    assert.ok(!userJson.includes("password"),  'password field leaked in signup response');
  });

  await check("PW-02", "F-19: stored credential is bcrypt (not cryptr ciphertext)", async () => {
    const stored = await h.where("users", "email", "p2_new@test.local");
    assert.ok(stored.length > 0, "test user not found");
    const user = stored[0];
    assert.ok(user.passwordHash && user.passwordHash.startsWith("$2"), "not bcrypt: " + user.passwordHash);
    assert.ok(!user.password, "legacy password field still set: " + user.password);
  });

  await check("PW-03", "F-19: login with bcrypt-hashed password succeeds without exposing credential", async () => {
    const r = await call("POST", "/client/user/login", {
      body: { loginType: 4, identity: "p2-login-dev", fcmToken: "p2-login-fcm", email: "p2_new@test.local", password: "s3cr3t!" },
    });
    assert.equal(r.json.status, true, JSON.stringify(r.json));
    const userJson = JSON.stringify(r.json.user || {});
    assert.ok(!userJson.includes("s3cr3t"),    "plaintext password leaked in login response");
    assert.ok(!userJson.includes("password"),  'password field leaked in login response');
  });

  await check("PW-04", "F-19: login with wrong password is refused", async () => {
    const r = await call("POST", "/client/user/login", {
      body: { loginType: 4, identity: "p2-bad-dev", fcmToken: "p2-bad-fcm", email: "p2_new@test.local", password: "wrongpassword" },
    });
    assert.equal(r.json.status, false, JSON.stringify(r.json));
  });

  await check("PW-05", "F-19: getProfile response does not expose password or passwordHash", async () => {
    const tok = await idToken("p2_viewer");
    const r = await call("GET", "/client/user/profile?userId=p2_viewer", { token: tok });
    assert.equal(r.status, 200);
    const userJson = JSON.stringify(r.json.user || {});
    assert.ok(!userJson.includes("password"), "credential leaked in getProfile: " + userJson.slice(0, 200));
  });

  await check("PW-06", "F-19: setPassword writes a bcrypt hash and clears legacy field", async () => {
    await seedUser("p2_reset", { email: "p2_reset@test.local", loginType: 4 });
    await fsdb.collection("users").doc("p2_reset").update({
      passwordResetGrantUntil: new Date(Date.now() + 10 * 60e3).toISOString(),
    });
    const r = await call("POST", "/client/user/setPassword", {
      body: { email: "p2_reset@test.local", newPassword: "newP@ss1", confirmPassword: "newP@ss1" },
    });
    assert.equal(r.json.status, true, JSON.stringify(r.json));
    const user = await getUser("p2_reset");
    assert.ok(user.passwordHash && user.passwordHash.startsWith("$2"),
      "setPassword did not write bcrypt hash: passwordHash=" + user.passwordHash);
    assert.ok(!user.password, "legacy field still set after setPassword: " + user.password);
  });
  // Legacy cryptr credentials are migrated only after a successful login and
  // are never wiped by an unrelated login/profile write.
  const Cryptr = require("node:module").createRequire(require("node:path").join(h.BACKEND, "index.js"))("cryptr");
  const legacy = new Cryptr(process.env.USER_PW_SECRET || "myTotallySecretKey");
  await check("PW-07", "F-19: legacy cryptr user logs in once, is migrated to bcrypt, legacy field cleared", async () => {
    await seedUser("p2_legacy", { email: "p2_legacy@test.local", loginType: 4, password: legacy.encrypt("old-pass") });
    const bad = await call("POST", "/client/user/login", { body: { loginType: 4, identity: "p2-l", fcmToken: "f", email: "p2_legacy@test.local", password: "nope" } });
    assert.equal(bad.json.status, false);
    let u = await getUser("p2_legacy");
    assert.ok(u.password && !u.passwordHash, "legacy credential must survive a failed login");
    const ok = await call("POST", "/client/user/login", { body: { loginType: 4, identity: "p2-l", fcmToken: "f", email: "p2_legacy@test.local", password: "old-pass" } });
    assert.equal(ok.json.status, true, JSON.stringify(ok.json));
    assert.ok(!JSON.stringify(ok.json.user).includes("password"));
    u = await getUser("p2_legacy");
    assert.ok(u.passwordHash && u.passwordHash.startsWith("$2"), "not migrated");
    assert.ok(!u.password, "legacy field not cleared after migration");
    const again = await call("POST", "/client/user/login", { body: { loginType: 4, identity: "p2-l", fcmToken: "f", email: "p2_legacy@test.local", password: "old-pass" } });
    assert.equal(again.json.status, true, "login after migration");
  });
  await check("PW-08", "F-19: a profile update never wipes an unmigrated legacy password", async () => {
    await seedUser("p2_legacy2", { email: "p2_legacy2@test.local", loginType: 4, password: legacy.encrypt("keep-me") });
    const r = await call("PATCH", "/client/user/updateProfile?userId=p2_legacy2", { token: await idToken("p2_legacy2"), body: { nickName: "renamed" } });
    assert.equal(r.json.status, true, JSON.stringify(r.json));
    assert.ok(!JSON.stringify(r.json).includes("password"));
    const u = await getUser("p2_legacy2");
    assert.equal(legacy.decrypt(u.password), "keep-me");
  });
  await check("PW-09", "F-19: admin user list and profile never include credentials", async () => {
    const adminUsers = h.req("controllers/admin/user.controller");
    const a = h.mockRes(); adminUsers.getUsers({ query: { start: 1, limit: 500 } }, a.res);
    const b = h.mockRes(); adminUsers.getProfile({ query: { userId: "p2_legacy2" } }, b.res);
    const [list, prof] = await Promise.all([a.done, b.done]);
    assert.equal(JSON.stringify(list).includes("password"), false);
    assert.equal(JSON.stringify(prof).includes("password"), false);
  });
  await check("PW-10", "F-19: admin password reset stores bcrypt, never plain text", async () => {
    const adminUsers = h.req("controllers/admin/user.controller");
    const m = h.mockRes(); adminUsers.updatePassword({ body: { userId: "p2_legacy2", newPassword: "admin-set" } }, m.res);
    await m.done;
    const u = await getUser("p2_legacy2");
    assert.ok(u.passwordHash.startsWith("$2")); assert.ok(!u.password);
  });
};
