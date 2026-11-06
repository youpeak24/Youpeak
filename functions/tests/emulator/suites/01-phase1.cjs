// Phase 1 audit tests (2026-10-01), moved from the session scratchpad into the
// repo. Same 25 cases; ids unchanged. Seeds use the "p1_" prefix.
"use strict";

module.exports = async (h, check, assert) => {
  const { fsdb, call, seedUser, getUser, idToken, setSettings, nowIso } = h;
  const referral = h.req("util/referral.service");
  const rewardEngine = h.req("util/rewardEngine");
  const { loadSettings } = h.req("util/loadSettings");
  const adminWithdraw = h.req("controllers/admin/withDrawalRequest.controller");

  await setSettings({ minSecondsBetweenRewardActions: 0, joiningFeeINR: 0, adRewardCoins: 20 });

  await seedUser("p1_victim", { totalEarningAmount: 500 });
  await seedUser("p1_attacker");
  const victimTok = await idToken("p1_victim");
  const attackerTok = await idToken("p1_attacker");
  const wdBody = { userId: "p1_victim", requestAmount: 100, paymentGateway: "UPI", paymentDetails: ["UPI ID: thief@upi"] };

  await check("SEC-01", "withdrawal with only the shared key is refused (401)", async () => {
    const r = await call("POST", "/client/withdrawalRequest/createWithdrawRequest", { body: wdBody });
    assert.equal(r.status, 401); assert.equal(r.json.code, "AUTH_REQUIRED");
  });
  await check("SEC-02", "withdrawal naming another user is refused (403 USER_MISMATCH)", async () => {
    const r = await call("POST", "/client/withdrawalRequest/createWithdrawRequest", { token: attackerTok, body: wdBody });
    assert.equal(r.status, 403); assert.equal(r.json.code, "USER_MISMATCH");
    assert.equal((await h.where("withDrawRequests", "userId", "p1_victim")).length, 0);
  });
  await check("SEC-03", "owner's own withdrawal request still works", async () => {
    const r = await call("POST", "/client/withdrawalRequest/createWithdrawRequest", { token: victimTok, body: { ...wdBody, paymentDetails: ["UPI ID: victim@upi"] } });
    assert.equal(r.json.status, true, JSON.stringify(r.json));
  });
  await check("SEC-04", "deleteUserAccount for another user is refused; account stays active", async () => {
    const r = await call("DELETE", "/client/user/deleteUserAccount?userId=p1_victim", { token: attackerTok });
    assert.equal(r.status, 403);
    assert.equal((await getUser("p1_victim")).isActive, true);
  });
  await check("SEC-05", "coinToAmountConverter with only the key is refused", async () => {
    const r = await call("GET", "/client/withdrawalRequest/coinToAmountConverter?userId=p1_victim&coin=100");
    assert.equal(r.status, 401);
  });

  await seedUser("p1_pw", { email: "p1_pw@test.local", password: "orig-cipher", loginType: 4 });
  const otpDoc = async (email) => (await fsdb.collection(h.db.normalizeCollectionName("OTP")).where("email", "==", email).get()).docs[0]?.data();
  await check("SEC-06", "setPassword by ?userId (old takeover) is refused", async () => {
    const r = await call("POST", "/client/user/setPassword?userId=p1_pw", { body: { newPassword: "hacked" } });
    assert.equal(r.json.status, false);
    assert.equal((await getUser("p1_pw")).password, "orig-cipher");
  });
  await check("SEC-07", "setPassword by email without a verified OTP is refused", async () => {
    const r = await call("POST", "/client/user/setPassword", { body: { email: "p1_pw@test.local", newPassword: "x1", confirmPassword: "x1" } });
    assert.equal(r.json.status, false);
    assert.equal((await getUser("p1_pw")).password, "orig-cipher");
  });
  await check("SEC-08", "verified OTP allows one reset; the grant is consumed", async () => {
    await call("POST", "/client/otp/create", { body: { email: "p1_pw@test.local" } });
    const { otp } = await otpDoc("p1_pw@test.local");
    assert.ok(otp >= 1000 && otp <= 9999);
    const v = await call("POST", "/client/otp/verify", { body: { email: "p1_pw@test.local", otp } });
    assert.equal(v.json.status, true);
    const s1 = await call("POST", "/client/user/setPassword", { body: { email: "p1_pw@test.local", newPassword: "newpass", confirmPassword: "newpass" } });
    assert.equal(s1.json.status, true, JSON.stringify(s1.json));
    const u = await getUser("p1_pw");
    assert.ok(u.password !== "orig-cipher" || u.passwordHash, "password changed");
    const s2 = await call("POST", "/client/user/setPassword", { body: { email: "p1_pw@test.local", newPassword: "again", confirmPassword: "again" } });
    assert.equal(s2.json.status, false);
  });
  await check("SEC-09", "5 wrong OTP guesses lock the code (correct code then fails)", async () => {
    await seedUser("p1_otp", { email: "p1_otp@test.local" });
    await call("POST", "/client/otp/create", { body: { email: "p1_otp@test.local" } });
    const { otp } = await otpDoc("p1_otp@test.local");
    const wrong = otp === 1000 ? 1001 : 1000;
    let last;
    for (let i = 0; i < 5; i++) last = await call("POST", "/client/otp/verify", { body: { email: "p1_otp@test.local", otp: wrong } });
    assert.match(last.json.message, /Too many wrong attempts/);
    const v = await call("POST", "/client/otp/verify", { body: { email: "p1_otp@test.local", otp } });
    assert.equal(v.json.status, false);
  });
  await check("SEC-10", "6th OTP request within an hour is refused", async () => {
    let r;
    for (let i = 0; i < 5; i++) r = await call("POST", "/client/otp/create", { body: { email: "p1_otp@test.local" } });
    assert.match(r.json.message || "", /Too many codes/);
  });

  await seedUser("p1_partnerA", { isDigitalPartner: true, partnerStatus: "ACTIVE", referralCode: "P1PARTA", pendingReferralCoin: 10000 });
  await h.set("partnerProfiles", "p1_ppA", { userId: "p1_partnerA", adCreditsBalance: 25000, licenseFeePaid: 25000 });
  await h.set("admins", "p1_admA", { email: "p1parta@test.local", password: "hash", role: "DIGITAL_PARTNER_ADMIN", partnerUserId: "p1_partnerA", isDefaultPassword: true });
  await seedUser("p1_refA1", { totalWatchTime: 42 });
  await h.set("referralHistories", "p1_refA1", { referrerId: "p1_partnerA", referredUserId: "p1_refA1", stage1Completed: true, stage2Completed: false, status: "STAGE1_DONE", totalRewardCoinsGiven: 10000, stage2DeadlineAt: nowIso(), createdAt: nowIso() });
  await check("SEC-11", "partner dashboard for another partner does not return portal credentials", async () => {
    const anon = await call("GET", "/client/partner/dashboard?userId=p1_partnerA");
    assert.equal(anon.status, 401);
    const other = await call("GET", "/client/partner/dashboard?userId=p1_partnerA", { token: attackerTok });
    assert.equal(other.status, 403);
    assert.equal(JSON.stringify(other.json).includes("password"), false);
    assert.equal((await h.get("admins", "p1_admA")).password, "hash");
  });
  await check("REQ-DP-API-02", "partner's own dashboard: real earnings, pending and watch progress", async () => {
    const r = await call("GET", "/client/partner/dashboard", { token: await idToken("p1_partnerA") });
    assert.equal(r.json.status, true, JSON.stringify(r.json));
    assert.equal(r.json.referrals.totalEarningsInr, 100);
    assert.equal(r.json.referrals.pendingInr, 100);
    assert.equal(r.json.recentReferrals[0].watchMinutes, 42);
    assert.equal(r.json.recentReferrals[0].stage2TargetMinutes, 100);
  });

  await seedUser("p1_payee", { totalEarningAmount: 100 });
  for (const id of ["p1_wd1", "p1_wd2"]) {
    await h.set("withDrawRequests", id, { userId: "p1_payee", requestAmount: 100, status: 1, accepted: false, paymentGateway: "UPI", paymentDetails: ["UPI ID: p@upi"] });
  }
  await check("FIN-01", "two concurrent approvals against a ₹100 balance (legacy unreserved requests): exactly one paid", async () => {
    const runs = ["p1_wd1", "p1_wd2"].map((id) => { const m = h.mockRes(); adminWithdraw.acceptWithdrawalRequest({ query: { requestId: id } }, m.res); return m.done; });
    const out = await Promise.all(runs);
    assert.equal(out.filter((b) => b.status === true).length, 1, JSON.stringify(out));
    assert.equal((await getUser("p1_payee")).totalEarningAmount, 0);
    const docs = await Promise.all(["p1_wd1", "p1_wd2"].map((id) => h.get("withDrawRequests", id)));
    assert.equal(docs.filter((d) => d.status === 2).length, 1);
    const unpaid = docs.find((d) => d.status !== 2);
    assert.equal(unpaid.status, 1); assert.equal(unpaid.accepted, false);
  });

  await seedUser("p1_susp", { isDigitalPartner: true, partnerStatus: "SUSPENDED", totalEarningAmount: 1000 });
  await seedUser("p1_restr", { isRestricted: true, totalEarningAmount: 1000 });
  await check("FRAUD-01", "suspended partner cannot withdraw (legacy route and /payout/request)", async () => {
    const tok = await idToken("p1_susp");
    const a = await call("POST", "/client/withdrawalRequest/createWithdrawRequest", { token: tok, body: { requestAmount: 500, paymentGateway: "UPI", paymentDetails: ["UPI ID: s@upi"] } });
    assert.equal(a.json.code, "PAYOUT_ON_HOLD", JSON.stringify(a.json));
    const b = await call("POST", "/client/payout/request", { token: tok, body: { amountInr: 500, method: "UPI", upiId: "s@upi" } });
    assert.equal(b.json.code, "PAYOUT_ON_HOLD", JSON.stringify(b.json));
  });
  await check("FRAUD-02", "fraud-restricted user cannot withdraw", async () => {
    const b = await call("POST", "/client/payout/request", { token: await idToken("p1_restr"), body: { amountInr: 500, method: "UPI", upiId: "r@upi" } });
    assert.equal(b.json.code, "PAYOUT_ON_HOLD", JSON.stringify(b.json));
  });
  await check("FRAUD-03", "held referral rewards stay frozen while the referrer is suspended, then release", async () => {
    await seedUser("p1_frozen", { isDigitalPartner: true, partnerStatus: "SUSPENDED", pendingReferralCoin: 10000, coin: 0 });
    await h.set("referralHistories", "p1_refF1", { referrerId: "p1_frozen", referredUserId: "p1_x1", stage1Completed: true, stage1RewardCoins: 10000, stage1HeldUntil: new Date(Date.now() - 60e3).toISOString(), stage1Released: false, stage2Completed: false, status: "STAGE1_DONE" });
    const first = await referral.releaseHeldReferrals();
    assert.ok(first.heldForReview >= 1);
    let u = await getUser("p1_frozen");
    assert.equal(u.pendingReferralCoin, 10000); assert.equal(u.coin, 0);
    await fsdb.collection("users").doc("p1_frozen").update({ partnerStatus: "ACTIVE" });
    await referral.releaseHeldReferrals();
    u = await getUser("p1_frozen");
    assert.equal(u.pendingReferralCoin, 0); assert.equal(u.coin, 10000);
  });

  await seedUser("p1_partnerV", { isDigitalPartner: true, partnerStatus: "ACTIVE", referralCode: "P1PARTV" });
  const twoDaysAgo = new Date(Date.now() - 2 * 86400e3).toISOString();
  await seedUser("p1_newV", { isNewUser: true, createdAt: twoDaysAgo, identity: "device-p1-newV" });
  await check("FRAUD-04", "VPN signup on a partner's code suspends the partner (no permanent block)", async () => {
    const r = await call("PATCH", "/client/user/validateAndApplyReferralCode", { token: await idToken("p1_newV"), body: { referralCode: "P1PARTV" }, headers: { "x-forwarded-for": "52.1.2.3" } });
    assert.equal(r.json.flagged, true, JSON.stringify(r.json));
    const p = await getUser("p1_partnerV");
    assert.equal(p.partnerStatus, "SUSPENDED");
    assert.notEqual(p.isBlock, true);
  });
  await check("REQ-PP-05", "Stage 2 deadline is 7 days from the referred user's registration", async () => {
    const rec = (await h.where("referralHistories", "referredUserId", "p1_newV"))[0];
    assert.equal(Date.parse(rec.stage2DeadlineAt), Date.parse(twoDaysAgo) + 7 * 86400e3);
  });
  await check("FRAUD-05", "3 flagged referrals suspend a Digital Partner (2 do not)", async () => {
    await seedUser("p1_partnerD", { isDigitalPartner: true, partnerStatus: "ACTIVE", referralCode: "P1PARTD" });
    const statuses = [];
    for (let i = 1; i <= 4; i++) {
      await seedUser(`p1_dup${i}`, { isNewUser: true, identity: "p1-shared-device" });
      await call("PATCH", "/client/user/validateAndApplyReferralCode", { token: await idToken(`p1_dup${i}`), body: { referralCode: "P1PARTD" } });
      statuses.push((await getUser("p1_partnerD")).partnerStatus);
    }
    assert.deepEqual(statuses, ["ACTIVE", "ACTIVE", "ACTIVE", "SUSPENDED"]);
  });

  await check("FIN-02", "40 concurrent ad rewards never pass 20 ads/day; ledger = balance; follow-ups stop at exactly 20", async () => {
    await seedUser("p1_adBot");
    const tok = await idToken("p1_adBot");
    const burst = await Promise.all(Array.from({ length: 40 }, () => call("POST", "/client/userTaskReward/adWatch", { token: tok, body: {} })));
    assert.ok(burst.filter((r) => r.json.status === true).length <= 20);
    assert.ok(((await getUser("p1_adBot")).dailyAdCountToday || 0) <= 20);
    for (let i = 0; i < 25; i++) {
      const r = await call("POST", "/client/userTaskReward/adWatch", { token: tok, body: {} });
      if (r.json.code === "COUNT_LIMIT") break;
    }
    const u = await getUser("p1_adBot");
    const hist = await h.where("histories", "userId", "p1_adBot");
    const ledger = hist.reduce((s, d) => s + d.coin, 0);
    assert.equal(u.dailyAdCountToday, 20); assert.equal(hist.length, 20); assert.equal(u.coin, 400); assert.equal(ledger, 400);
  });
  await check("FIN-03", "daily coin cap holds under concurrency (990/1000 + 10 parallel ads = 1000)", async () => {
    await seedUser("p1_capBot", { dailyEarningCoinsToday: 990 });
    const tok = await idToken("p1_capBot");
    await Promise.all(Array.from({ length: 10 }, () => call("POST", "/client/userTaskReward/adWatch", { token: tok, body: {} })));
    const u = await getUser("p1_capBot");
    assert.equal(u.dailyEarningCoinsToday, 1000); assert.equal(u.coin, 10);
  });
  await check("FIN-04", "pacing rule holds under concurrency (credited likes never closer than 3 s)", async () => {
    await setSettings({ minSecondsBetweenRewardActions: 3 });
    await seedUser("p1_likeBot");
    const tok = await idToken("p1_likeBot");
    // The endpoint pays only for a real like (one per video), so each call
    // names a different video the user has liked.
    const LikeHistory = h.req("models/likeHistoryOfVideo.model");
    for (let i = 0; i < 10; i++) await LikeHistory.create({ userId: "p1_likeBot", videoId: `p1_likeBot_v${i}`, likeOrDislike: "like" });
    const out = await Promise.all(Array.from({ length: 10 }, (_, i) => call("POST", "/client/userTaskReward/like", { token: tok, body: { videoId: `p1_likeBot_v${i}` } })));
    const ok = out.filter((r) => r.json.status === true).length;
    const times = (await h.where("histories", "userId", "p1_likeBot")).map((d) => Date.parse(d.date)).sort((a, b) => a - b);
    assert.ok(ok >= 1 && ok < 10, `credited ${ok}`);
    assert.equal(times.length, ok);
    for (let i = 1; i < times.length; i++) assert.ok(times[i] - times[i - 1] >= 3000, `gap ${times[i] - times[i - 1]} ms`);
    await setSettings({ minSecondsBetweenRewardActions: 0 });
  });
  await check("FIN-05", "per-video reward dedupe holds under concurrency (5 parallel -> 1)", async () => {
    await seedUser("p1_dupBot");
    await loadSettings(true);
    const out = await Promise.all(Array.from({ length: 5 }, () => rewardEngine.creditReward({ userId: "p1_dupBot", kind: "like", historyType: 7, countField: "dailyLikesToday", capField: "maxLikesPerDay", dedupeVideoId: "p1_vid1" })));
    assert.equal(out.filter((r) => r.ok).length, 1);
    assert.equal((await getUser("p1_dupBot")).coin, 2);
  });
  await check("REQ-ACC-04", "unpaid joining fee blocks coin earning on the server", async () => {
    await setSettings({ joiningFeeINR: 99 });
    await seedUser("p1_unpaid", { paymentStatus: false });
    const r = await call("POST", "/client/userTaskReward/adWatch", { token: await idToken("p1_unpaid"), body: {} });
    assert.equal(r.json.code, "ACCESS_LOCKED", JSON.stringify(r.json));
    assert.equal((await getUser("p1_unpaid")).coin, 0);
    await setSettings({ joiningFeeINR: 0 });
  });
  await check("MOD-01", "getVideos hides a video held for review", async () => {
    await seedUser("p1_viewer");
    const v = (id, moderationStatus) => h.set("videos", id, { userId: "p1_attacker", title: id, isActive: true, videoType: 1, scheduleType: 2, visibilityType: 1, moderationStatus, createdAt: nowIso() });
    await v("p1_vid_ok", "approved"); await v("p1_vid_held", "pending_review");
    const r = await call("GET", "/client/video/getVideos?userId=p1_viewer", { token: await idToken("p1_viewer") });
    const ids = (r.json.videos || []).map((x) => String(x._id));
    assert.ok(ids.includes("p1_vid_ok"), JSON.stringify(r.json).slice(0, 300));
    assert.ok(!ids.includes("p1_vid_held"));
  });
};
