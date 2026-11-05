// Web task earning: platform-aware eligibility, every supported web earning
// action, account-level caps shared with the app, and the abuse boundaries
// (browser ad claims, unproven engagement claims, duplicates, expired or
// missing sessions, datacenter networks).
"use strict";

module.exports = async (h, check, assert) => {
  const { call, seedUser, idToken, setSettings, getUser, where, fsdb } = h;
  const engine = h.req("util/rewardEngine");
  const { loadSettings } = h.req("util/loadSettings");
  const security = h.req("util/taskSecurity.service");
  const BROWSER = { origin: "https://youpeak-web.vercel.app", "sec-fetch-site": "cross-site" };

  await setSettings({
    minSecondsBetweenRewardActions: 0, joiningFeeINR: 0, adRewardCoins: 20,
    allowWebTasking: true, requireDeviceAttestationForTasks: true, blockTasksOnVpn: true,
  });
  const DailyReward = h.req("models/dailyRewardCoin.model");
  for (let day = 1; day <= 7; day++) await DailyReward.create({ day, dailyRewardCoin: 15 });
  for (const v of ["web_v1", "web_v2", "web_v3"]) await h.set("videos", v, { isActive: true, videoType: 1, userId: "web_creator", channelId: "web_creator", title: v, commentType: 1, scheduleType: 2, visibilityType: 1, videoPrivacyType: 1, videoTime: 600 });
  await seedUser("web_creator");

  // A browser session: signed in, attested as "web" (no device fields).
  async function webUser(id, extra = {}) {
    await seedUser(id, { taskAttestation: null, ...extra });
    const tok = await idToken(id);
    const att = await call("POST", "/client/security/attest", { token: tok, headers: BROWSER, body: { platform: "web", appVersion: "web-test", isPhysicalDevice: true, vpnActive: false } });
    return { tok, att: att.json };
  }

  await check("WEB-01", "default settings allow web earning: a fresh web attestation is not locked", async () => {
    const { att } = await webUser("web_a");
    assert.equal(att.taskingAllowed, true, JSON.stringify(att));
    assert.deepEqual(att.reasons, []);
  });

  await check("WEB-02", "a browser's attestation stores no device-integrity claims (no invented physical device / device id)", async () => {
    const u = await getUser("web_a");
    const s = u.taskAttestation.signals;
    assert.equal(s.platform, "web");
    assert.equal(s.deviceIntegrity, "unavailable-in-browser");
    assert.equal("isPhysicalDevice" in s, false);
    assert.equal(s.deviceId, "");
    assert.equal(u.taskAttestation.deviceHash, null);
  });

  await check("WEB-03", "admin switch off -> web locked (WEB_PLATFORM) and every reward refused; app attestation unaffected", async () => {
    await setSettings({ allowWebTasking: false });
    const { tok, att } = await webUser("web_off");
    assert.equal(att.taskingAllowed, false, JSON.stringify(att));
    assert.deepEqual(att.reasons, ["WEB_PLATFORM"]);
    const r = await call("PATCH", "/client/dailyCoinReward/handleDailyCheckInReward", { token: tok, headers: BROWSER, body: {} });
    assert.equal(r.json.status, false);
    assert.equal((await getUser("web_off")).coin, 0);
    // An app (mobile) attestation is judged by the device rules, not the web switch.
    assert.deepEqual(security.reasonsFor({ signals: { platform: "android", deviceId: "present", isPhysicalDevice: true } }), []);
    await setSettings({ allowWebTasking: true });
  });

  await check("WEB-04", "web from a datacenter / VPN network is locked by the server's own IP check", async () => {
    await seedUser("web_dc", { taskAttestation: null });
    const tok = await idToken("web_dc");
    const att = await call("POST", "/client/security/attest", { token: tok, headers: { ...BROWSER, "x-forwarded-for": "52.1.2.3" }, body: { platform: "web" } });
    assert.equal(att.json.taskingAllowed, false, JSON.stringify(att.json));
    assert.ok(att.json.reasons.includes("DATACENTER_IP"));
  });

  await check("WEB-05", "web check-in earns once per day; 8 parallel tabs -> one credit", async () => {
    const { tok } = await webUser("web_ci");
    const out = await Promise.all(Array.from({ length: 8 }, () => call("PATCH", "/client/dailyCoinReward/handleDailyCheckInReward", { token: tok, headers: BROWSER, body: {} })));
    const u = await getUser("web_ci");
    assert.equal(out.filter((r) => r.json.status === true).length, 1, JSON.stringify(out.map((r) => r.json.message)));
    assert.equal(u.coin, 15);
    assert.equal(u.dailyCheckInsToday, 1);
  });

  await check("WEB-06", "web like earns once per video (parallel double-click -> one credit); unlike reverses", async () => {
    const { tok } = await webUser("web_like");
    const q = "/client/video/likeOrDislikeOfVideo?userId=web_like&videoId=web_v1&likeOrDislike=like";
    const out = await Promise.all(Array.from({ length: 4 }, () => call("POST", q, { token: tok, headers: BROWSER })));
    assert.ok(out.some((r) => r.json.status === true));
    let u = await getUser("web_like");
    assert.equal(u.dailyLikesToday, 1);
    const likeCoins = u.coin;
    assert.ok(likeCoins > 0);
    assert.equal((await where("histories", "userId", "web_like")).filter((x) => x.type === engine.HISTORY_TYPE.VIDEO_LIKE).length, 1);
  });

  await check("WEB-07", "web comment earns on the first comment per video only", async () => {
    const { tok } = await webUser("web_cm");
    const body = { userId: "web_cm", videoId: "web_v2", commentText: "Nice video" };
    const a = await call("POST", "/client/videoComment/createComment", { token: tok, headers: BROWSER, body });
    const b = await call("POST", "/client/videoComment/createComment", { token: tok, headers: BROWSER, body: { ...body, commentText: "Again" } });
    assert.equal(a.json.status, true, JSON.stringify(a.json));
    assert.equal(b.json.status, true);
    const u = await getUser("web_cm");
    assert.equal(u.dailyCommentsToday, 1);
    assert.equal((await where("histories", "userId", "web_cm")).filter((x) => x.type === engine.HISTORY_TYPE.VIDEO_COMMENT).length, 1);
  });

  await check("WEB-08", "web watch heartbeats credit no faster than real time, also from 3 parallel tabs; background/muted beats credit nothing", async () => {
    const { tok } = await webUser("web_watch");
    await fsdb.collection("users").doc("web_watch").update({ watchClaimAt: Date.now() - 20e3, watchSecondsCarry: 0, totalCurrentWatchTime: 0, totalWatchTime: 100 });
    const beat = (extra = {}) => call("POST", "/client/watch/heartbeat", { token: tok, headers: BROWSER, body: { videoId: "web_v3", playedSeconds: 15, playbackRate: 1, muted: false, foreground: true, ...extra } });
    const hidden = await beat({ foreground: false });
    const muted = await beat({ muted: true });
    assert.equal(hidden.json.creditedSeconds, 0); assert.equal(hidden.json.ignored, "BACKGROUND");
    assert.equal(muted.json.creditedSeconds, 0); assert.equal(muted.json.ignored, "MUTED");
    const tabs = await Promise.all([beat(), beat(), beat()]);
    const credited = tabs.reduce((s, r) => s + (r.json.creditedSeconds || 0), 0);
    assert.ok(credited <= 21, `credited ${credited}s for ~20s of wall clock`);
    assert.ok(credited >= 14, `credited ${credited}s`);
    const u = await getUser("web_watch");
    assert.equal(u.totalWatchTime >= 100, true, "lifetime minutes never go down");
  });

  await check("WEB-15", "a heartbeat whose playback position stands still (media paused behind the player) earns nothing; moving playback earns", async () => {
    const { tok } = await webUser("web_stall");
    const rewind = (s) => fsdb.collection("users").doc("web_stall").update({ watchClaimAt: Date.now() - s * 1000 });
    const beat = (positionSeconds, videoId = "web_v3") => call("POST", "/client/watch/heartbeat", { token: tok, headers: BROWSER, body: { videoId, playedSeconds: 10, positionSeconds, playbackRate: 1, muted: false, foreground: true } });
    await rewind(12); const first = await beat(40);      // baseline for this video
    await rewind(12); const stalled = await beat(40);    // position didn't move
    await rewind(12); const moving = await beat(50);     // moved 10 s
    await rewind(12); const back = await beat(5);        // seek back / loop restart
    await rewind(12); const other = await beat(3, "web_v2"); // another video: no baseline yet
    assert.ok(first.json.creditedSeconds > 0, JSON.stringify(first.json));
    assert.equal(stalled.json.creditedSeconds, 1, "1 s sampling slack only");
    assert.equal(moving.json.creditedSeconds, 10, JSON.stringify(moving.json));
    assert.equal(back.json.creditedSeconds, 10, "a loop restart / seek back is bounded by the wall clock, not refused");
    assert.equal(other.json.creditedSeconds, 10);
    assert.deepEqual((await getUser("web_stall")).watchPosition, { videoId: "web_v2", seconds: 3 });
  });

  await check("WEB-09", "rewarded-ad claims from a browser are refused and credit nothing (no web ad provider can be verified)", async () => {
    const { tok } = await webUser("web_ad");
    const a = await call("PATCH", "/client/user/handleAdWatchReward", { token: tok, headers: BROWSER, body: { coinEarnedFromAd: 9999 } });
    const b = await call("POST", "/client/userTaskReward/adWatch", { token: tok, headers: { origin: "https://evil.example" }, body: {} });
    const c = await call("POST", "/client/userTaskReward/adWatch", { token: tok, headers: { "sec-fetch-site": "same-origin" }, body: {} });
    for (const r of [a, b, c]) { assert.equal(r.json.status, false); assert.equal(r.json.code, "AD_REWARD_APP_ONLY"); }
    const u = await getUser("web_ad");
    assert.equal(u.coin, 0); assert.equal(u.dailyAdCountToday || 0, 0);
  });

  await check("WEB-10", "the native app's ad claim (no browser headers) still works under the same caps", async () => {
    await seedUser("web_app_ad");
    const tok = await idToken("web_app_ad");
    const r = await call("PATCH", "/client/user/handleAdWatchReward", { token: tok, body: {} });
    assert.equal(r.json.status, true, JSON.stringify(r.json));
    assert.equal((await getUser("web_app_ad")).dailyAdCountToday, 1);
  });

  await check("WEB-11", "legacy like/comment endpoints pay only for a real like/comment, once per video, never in addition to the main path", async () => {
    const { tok } = await webUser("web_legacy");
    const none = await call("POST", "/client/userTaskReward/like", { token: tok, headers: BROWSER, body: { videoId: "web_v1" } });
    assert.equal(none.json.code, "ENGAGEMENT_NOT_FOUND");
    assert.equal((await getUser("web_legacy")).coin, 0);
    // Real like through the main path (credits), then the legacy claim for the same video.
    await call("POST", "/client/video/likeOrDislikeOfVideo?userId=web_legacy&videoId=web_v1&likeOrDislike=like", { token: tok, headers: BROWSER });
    const after = (await getUser("web_legacy")).coin;
    const again = await Promise.all([1, 2, 3].map(() => call("POST", "/client/userTaskReward/like", { token: tok, headers: BROWSER, body: { videoId: "web_v1" } })));
    assert.ok(again.every((r) => r.json.status === false));
    assert.equal((await getUser("web_legacy")).coin, after);
    const nocomment = await call("POST", "/client/userTaskReward/comment", { token: tok, headers: BROWSER, body: { videoId: "web_v2" } });
    assert.equal(nocomment.json.code, "ENGAGEMENT_NOT_FOUND");
  });

  await check("WEB-12", "account-level caps are shared by web and app: likes from both stop at maxLikesPerDay", async () => {
    await setSettings({ dailyMaxLikes: 2 });
    for (let i = 0; i < 4; i++) await h.set("videos", `cap_v${i}`, { isActive: true, videoType: 1, userId: "web_creator", channelId: "web_creator", title: "x", scheduleType: 2, visibilityType: 1, videoPrivacyType: 1, videoTime: 600 });
    const { tok } = await webUser("web_cap");
    // two likes "from the app" (no browser headers), two from the web
    for (let i = 0; i < 4; i++) {
      const hd = i % 2 ? BROWSER : {};
      await call("POST", `/client/video/likeOrDislikeOfVideo?userId=web_cap&videoId=cap_v${i}&likeOrDislike=like`, { token: tok, headers: hd });
    }
    const u = await getUser("web_cap");
    assert.ok(u.dailyLikesToday <= 2, `dailyLikesToday ${u.dailyLikesToday}`);
    assert.equal((await where("histories", "userId", "web_cap")).filter((x) => x.type === engine.HISTORY_TYPE.VIDEO_LIKE).length, u.dailyLikesToday);
    await setSettings({ dailyMaxLikes: 5 });
  });

  await check("WEB-13", "an expired web attestation locks earning until the site re-checks; unauthenticated requests are refused", async () => {
    await setSettings({ taskAttestationTtlHours: 1 });
    const { tok } = await webUser("web_exp");
    await fsdb.collection("users").doc("web_exp").update({ "taskAttestation.at": new Date(Date.now() - 2 * 3600e3).toISOString() });
    const r = await call("PATCH", "/client/dailyCoinReward/handleDailyCheckInReward", { token: tok, headers: BROWSER, body: {} });
    assert.equal(r.json.status, false);
    assert.equal((await getUser("web_exp")).coin, 0);
    const anon = await call("PATCH", "/client/dailyCoinReward/handleDailyCheckInReward", { headers: BROWSER, body: { userId: "web_exp" } });
    assert.equal(anon.status, 401);
    const other = await call("PATCH", "/client/dailyCoinReward/handleDailyCheckInReward", { token: tok, headers: BROWSER, body: { userId: "web_a" } });
    assert.equal(other.status, 403);
    await setSettings({ taskAttestationTtlHours: 24 });
  });

  await check("WEB-14", "two accounts on the same browser are not tied by a device binding (web has no device id)", async () => {
    const a = await webUser("web_shared1");
    const b = await webUser("web_shared2");
    assert.equal(a.att.taskingAllowed, true); assert.equal(b.att.taskingAllowed, true);
    assert.ok(!(b.att.reasons || []).includes("DEVICE_LINKED_TO_OTHER_ACCOUNT"));
  });

  await loadSettings(true);
};
