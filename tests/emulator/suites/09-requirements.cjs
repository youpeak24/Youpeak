// Phase 2: runtime verification of requirements that Phase 1 marked UNVERIFIED.
"use strict";
const crypto = require("node:crypto");

module.exports = async (h, check, assert) => {
  const { call, seedUser, idToken, setSettings, getUser, get, set, nowIso, where } = h;
  await setSettings({ minSecondsBetweenRewardActions: 0, reportAutoHoldThreshold: 5, reportAutoHoldWindowHours: 24, referralRewardCoins: 250, paymentGateway: "razorpay", joiningFeeINR: 0 });
  const engine = h.req("util/rewardEngine");
  const { loadSettings } = h.req("util/loadSettings");

  await check("REQ-0111", "5 reports from 5 users within 24 h hold the video and it leaves the public feed", async () => {
    await seedUser("p9_owner");
    await set("videos", "p9_vid", { userId: "p9_owner", channelId: "p9_owner", title: "p9", isActive: true, videoType: 1, scheduleType: 2, visibilityType: 1, moderationStatus: "approved", createdAt: nowIso() });
    for (let i = 1; i <= 5; i++) {
      await seedUser(`p9_rep${i}`);
      const r = await call("POST", "/client/report/reportToVideo", { token: await idToken(`p9_rep${i}`), body: { videoId: "p9_vid", reportType: 1 } });
      assert.equal(r.json.status, true, JSON.stringify(r.json));
      const st = (await get("videos", "p9_vid")).moderationStatus;
      assert.equal(st, i < 5 ? "approved" : "pending_review", `after ${i} reports: ${st}`);
    }
    const dup = await call("POST", "/client/report/reportToVideo", { token: await idToken("p9_rep1"), body: { videoId: "p9_vid", reportType: 1 } });
    assert.equal(dup.json.status, false, "one report per user per video");
    const feed = await call("GET", "/client/video/getVideos");
    assert.ok(!JSON.stringify(feed.json).includes('"p9_vid"'));
  });
  await check("REQ-0040", "a Free Tasker referrer gets the flat 250 coins per registered referral", async () => {
    await seedUser("p9_ref", { referralCode: "P9REFFRE" });
    await seedUser("p9_new", { isNewUser: true, identity: "p9-device" });
    const r = await call("PATCH", "/client/user/validateAndApplyReferralCode", { token: await idToken("p9_new"), body: { referralCode: "P9REFFRE" } });
    assert.equal(r.json.status, true, JSON.stringify(r.json));
    const u = await getUser("p9_ref");
    assert.equal(u.coin, 250); assert.equal(u.pendingReferralCoin, 10000);
  });
  await check("REQ-0088", "verified joining-fee payment sets paymentStatus / payment_status (signed webhook, once)", async () => {
    await seedUser("p9_join", { paymentStatus: false });
    await set("paymentTransactions", "p9_txn", { userId: "p9_join", gateway: "razorpay", purpose: "joining_fee", amountInr: 2100, currency: "INR", orderId: "order_p9", status: "created", fulfilled: false });
    const raw = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_p9", order_id: "order_p9", amount: 210000, currency: "INR" } } } });
    const sig = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest("hex");
    const r = await call("POST", "/payment/webhook/razorpay", { raw, headers: { "x-razorpay-signature": sig } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const u = await getUser("p9_join");
    assert.equal(u.paymentStatus, true); assert.equal(u.payment_status, true);
    assert.equal((await get("paymentTransactions", "p9_txn")).fulfilmentStatus, "COMPLETED");
  });
  await check("REQ-0035", "a dislike earns 2 coins once per video", async () => {
    await seedUser("p9_dis");
    await loadSettings(true);
    const d = () => engine.creditReward({ userId: "p9_dis", kind: "dislike", historyType: engine.HISTORY_TYPE.VIDEO_DISLIKE, countField: "dailyDislikesToday", capField: "maxDislikesPerDay", dedupeVideoId: "p9_v" });
    assert.equal((await d()).credited, 2);
    assert.equal((await d()).ok, false);
    assert.equal((await getUser("p9_dis")).coin, 2);
    assert.equal((await where("histories", "userId", "p9_dis")).length, 1);
  });
};
