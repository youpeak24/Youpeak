// Phase 3: Peak Boost alignment (documented presets, status after timeout,
// viewer/creator history) and the Video Promotion lifecycle (rate-card
// catalogue, server pricing, eligibility, verified payment → one campaign,
// placements, deduplicated impressions, expiry, admin actions, isolation).
// Razorpay is stubbed in-process (no network, no real payment); signatures
// use the harness's throwaway test secrets.
"use strict";
const crypto = require("node:crypto");
const path = require("node:path");

module.exports = async (h, check, assert) => {
  const { call, seedUser, idToken, setSettings, nowIso, set, get, getUser, where, fsdb } = h;
  const promotion = h.req("util/promotion.service");
  const DEFAULT_PLANS = h.req("setting").promotionPlans;
  await setSettings({ paymentGateway: "razorpay", promotionPlans: DEFAULT_PLANS, peakBoost: { enabled: true, minCoins: 100, maxCoins: 1000000, presets: h.req("setting").peakBoost.presets } });

  // ── Razorpay SDK stub: records what the server asked the gateway to charge.
  const rzPath = require.resolve("razorpay", { paths: [path.join(h.BACKEND, "util")] });
  const gatewayOrders = [];
  require.cache[rzPath] = {
    id: rzPath, filename: rzPath, loaded: true,
    exports: class { constructor() { this.orders = { create: async (o) => { const id = `order_p13_${gatewayOrders.length + 1}_${crypto.randomBytes(3).toString("hex")}`; gatewayOrders.push({ id, ...o }); return { id, amount: o.amount, currency: o.currency }; } }; } },
  };
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
  const verify = (tok, orderId, { paymentId = `pay_${orderId}`, badSig = false } = {}) => call("POST", "/client/payment/verify", {
    token: tok, body: { orderId, paymentId, signature: badSig ? "0".repeat(64) : crypto.createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex") },
  });
  const webhook = (orderId, amountPaise, event = "payment.captured") => {
    const raw = JSON.stringify({ event, payload: { payment: { entity: { id: `pay_${orderId}`, order_id: orderId, amount: amountPaise, currency: "INR", status: event === "payment.captured" ? "captured" : "failed" } } } });
    return call("POST", "/payment/webhook/razorpay", { raw, headers: { "x-razorpay-signature": crypto.createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex") } });
  };
  const order = (tok, body) => call("POST", "/client/payment/createOrder", { token: tok, body: { purpose: "video_promotion", ...body } });

  // ── Fixtures: a creator with public videos, a second creator, viewers.
  const pub = { isActive: true, videoType: 1, scheduleType: 2, visibilityType: 1, moderationStatus: "approved" };
  const creator = "p13_creator", other = "p13_other", viewer = "p13_viewer", viewer2 = "p13_viewer2";
  for (const u of [creator, other, viewer, viewer2]) await seedUser(u, { coin: 0 });
  const tC = await idToken(creator), tO = await idToken(other), tV = await idToken(viewer), tV2 = await idToken(viewer2);
  let vn = 0;
  async function video(owner = creator, extra = {}) {
    const id = `p13_vid_${++vn}`;
    await set("videos", id, { userId: owner, channelId: owner, title: `p13 video ${vn}`, videoImage: "https://cdn.test/thumb.jpg", videoUrl: "https://cdn.test/v.mp4", createdAt: nowIso(), ...pub, ...extra });
    return id;
  }
  async function buy(tok, videoId, planId) {
    const o = await order(tok, { videoId, planId });
    assert.equal(o.json.status, true, JSON.stringify(o.json));
    const v = await verify(tok, o.json.orderId);
    assert.equal(v.json.status, true, JSON.stringify(v.json));
    return { orderId: o.json.orderId, txnId: o.json.transactionId, campaignId: v.json.fulfilment && v.json.fulfilment.video_promotion ? v.json.fulfilment.video_promotion.campaignId : `promo_${o.json.transactionId}` };
  }
  const RATE_CARD = [
    ["starter_plan", "Starter Plan", 49, 2000, 2500, 1, "Daily"],
    ["basic_plan", "Basic Plan", 99, 3000, 3500, 2, "Daily"],
    ["pro_starter", "Pro Starter", 199, 3000, 5000, 2, "Daily"],
    ["boost_plan", "Boost Plan", 249, 3000, 8000, 4, "Daily"],
    ["weekly_mega_plan", "Weekly Mega Plan", 1000, 50000, 75000, 7, "Weekly"],
    ["monthly_pro_plan", "Monthly Pro Plan", 3000, 200000, 250000, 30, "Monthly"],
  ];

  // ═════════════════════════════ Peak Boost ═════════════════════════════
  await set("videos", "p13_pb_vid", { userId: creator, channelId: creator, title: "pb", createdAt: nowIso(), ...pub });
  let rn = 0;
  const rid = () => `p13req${String(++rn).padStart(6, "0")}`;

  await check("PB3-01", "config serves exactly the documented presets (100/500/2,000/5,000/10,000) and custom range 100–10,00,000", async () => {
    const pb = h.req("util/systemConfig.service").getPeakBoost();
    assert.deepEqual(pb.presets.map((p) => p.coins), [100, 500, 2000, 5000, 10000]);
    assert.deepEqual(pb.presets.map((p) => p.name || p.label), ["Starter Boost", "Mini Boost", "Super Boost", "Mega Boost", "Ultra Boost"]);
    assert.equal(pb.minCoins, 100); assert.equal(pb.maxCoins, 1000000);
  });

  await check("PB3-02", "every preset settles 80/20; viewer history debit = boost, creator history credit = creator share", async () => {
    await seedUser("p13_fan", { coin: 17600 }); const tf = await idToken("p13_fan");
    const c0 = (await getUser(creator)).coin;
    let credited = 0;
    for (const T of [100, 500, 2000, 5000, 10000]) {
      const r = await call("POST", "/client/peakBoost", { token: tf, body: { videoId: "p13_pb_vid", coins: T, requestId: rid() } });
      assert.equal(r.json.status, true, JSON.stringify(r.json));
      assert.equal(r.json.creatorCoins, Math.round(T * 0.8)); assert.equal(r.json.platformCoins, T - Math.round(T * 0.8));
      const sent = await get("histories", `${r.json.boostId}_sent`);
      const recv = await get("histories", `rev_${r.json.boostId}_creator`);
      assert.equal(sent.coin, T); assert.equal(sent.isIncome, false); assert.equal(sent.userId, "p13_fan"); assert.equal(sent.otherUserId, creator);
      assert.equal(recv.coin, r.json.creatorCoins); assert.equal(recv.userId, creator);
      credited += r.json.creatorCoins;
    }
    assert.equal((await getUser("p13_fan")).coin, 0, "17,600 spent exactly");
    assert.equal((await getUser(creator)).coin - c0, credited);
  });

  await check("PB3-03", "status after a timeout: unknown request → found:false (safe to retry); completed request → found, coins, no second debit", async () => {
    await seedUser("p13_fan2", { coin: 1000 }); const tf = await idToken("p13_fan2");
    const id = rid();
    let s = await call("GET", `/client/peakBoost/status?requestId=${id}`, { token: tf });
    assert.equal(s.json.status, true); assert.equal(s.json.found, false); assert.equal(s.json.balance, 1000);
    await call("POST", "/client/peakBoost", { token: tf, body: { videoId: "p13_pb_vid", coins: 500, requestId: id } });
    s = await call("GET", `/client/peakBoost/status?requestId=${id}`, { token: tf });
    assert.equal(s.json.found, true); assert.equal(s.json.completed, true); assert.equal(s.json.coins, 500); assert.equal(s.json.balance, 500);
    // The app's retry reuses the same requestId — still one debit.
    const again = await call("POST", "/client/peakBoost", { token: tf, body: { videoId: "p13_pb_vid", coins: 500, requestId: id } });
    assert.equal(again.json.status, true); assert.equal((await getUser("p13_fan2")).coin, 500);
  });

  await check("PB3-04", "status is per-user: another account can't see a boost by its requestId; bad requestId / no token refused", async () => {
    await seedUser("p13_fan3", { coin: 100 }); const tf = await idToken("p13_fan3");
    const id = rid();
    await call("POST", "/client/peakBoost", { token: tf, body: { videoId: "p13_pb_vid", coins: 100, requestId: id } });
    const spy = await call("GET", `/client/peakBoost/status?requestId=${id}`, { token: tV });
    assert.equal(spy.json.found, false);
    assert.equal((await call("GET", "/client/peakBoost/status?requestId=x", { token: tf })).json.code, "INVALID_REQUEST");
    assert.equal((await call("GET", `/client/peakBoost/status?requestId=${id}`)).status, 401);
  });

  await check("PB3-05", "insufficient balance: refused with the current balance, nothing written", async () => {
    await seedUser("p13_poor", { coin: 99 }); const tp = await idToken("p13_poor");
    const id = rid();
    const r = await call("POST", "/client/peakBoost", { token: tp, body: { videoId: "p13_pb_vid", coins: 100, requestId: id } });
    assert.equal(r.json.code, "INSUFFICIENT_BALANCE"); assert.equal(r.json.balance, 99);
    assert.equal(await get("peakBoosts", `pb_p13_poor_${id}`), null);
    assert.equal((await call("GET", `/client/peakBoost/status?requestId=${id}`, { token: tp })).json.found, false);
  });

  // ═══════════════════════════ Video Promotion ═══════════════════════════
  await check("VP-01", "catalogue = rate card: six plans, stable ids, ₹ price, impression estimates, duration, Global, category, cost per 1k", async () => {
    const r = await call("GET", "/client/videoPromotion/plans");
    assert.equal(r.json.status, true);
    assert.deepEqual(r.json.plans.map((p) => [p.id, p.name, p.priceINR, p.impressionsMin, p.impressionsMax, p.durationDays, p.category]), RATE_CARD);
    for (const p of r.json.plans) { assert.equal(p.targeting, "Global"); assert.equal(p.currency, "INR"); assert.equal(p.planName, p.name); }
    const starter = r.json.plans[0];
    assert.equal(starter.costPer1kLow, 19.6); assert.equal(starter.costPer1kHigh, 24.5);
    const monthly = r.json.plans[5];
    assert.equal(monthly.costPer1kLow, 12); assert.equal(monthly.costPer1kHigh, 15);
  });

  await check("VP-02", "every plan: the gateway is asked for the catalogue price, never the client's (tampered amountInr / price ignored)", async () => {
    for (const [planId, , price] of RATE_CARD) {
      const v = await video();
      const before = gatewayOrders.length;
      const r = await order(tC, { videoId: v, planId, amountInr: 1, planPriceINR: 1, priceINR: 1 });
      assert.equal(r.json.status, true, JSON.stringify(r.json));
      assert.equal(r.json.amountInr, price);
      assert.equal(gatewayOrders.length, before + 1);
      assert.equal(gatewayOrders.at(-1).amount, price * 100, `${planId} charged in paise`);
      const txn = (await where("paymentTransactions", "orderId", r.json.orderId))[0];
      assert.equal(txn.userId, creator); assert.equal(txn.videoId, v); assert.equal(txn.planId, planId); assert.equal(txn.promotionPlan.priceINR, price);
    }
  });

  await check("VP-03", "unknown / inactive plan refused; older app's planName 'Weekly Mega' resolves to weekly_mega_plan", async () => {
    const v = await video();
    assert.equal((await order(tC, { videoId: v, planId: "free_plan" })).json.status, false);
    assert.equal((await order(tC, { videoId: v })).json.status, false);
    await setSettings({ promotionPlans: DEFAULT_PLANS.map((p) => (p.id === "boost_plan" ? { ...p, isActive: false } : p)) });
    try {
      assert.match((await order(tC, { videoId: v, planId: "boost_plan" })).json.message, /isn't available/);
      assert.equal((await call("GET", "/client/videoPromotion/plans")).json.plans.some((p) => p.id === "boost_plan"), false);
    } finally { await setSettings({ promotionPlans: DEFAULT_PLANS }); }
    const legacy = await order(tC, { videoId: v, planName: "Weekly Mega" });
    assert.equal(legacy.json.status, true); assert.equal(legacy.json.amountInr, 1000);
    assert.equal((await where("paymentTransactions", "orderId", legacy.json.orderId))[0].planId, "weekly_mega_plan");
  });

  await check("VP-04", "eligibility: someone else's video, a Bite, private/unlisted/under-review/scheduled videos are refused", async () => {
    const theirs = await video(other);
    assert.match((await order(tC, { videoId: theirs, planId: "starter_plan" })).json.message, /your own videos/);
    const bite = await video(creator, { videoType: 2 });
    assert.match((await order(tC, { videoId: bite, planId: "starter_plan" })).json.message, /normal videos/);
    for (const extra of [{ visibilityType: 2 }, { moderationStatus: "pending_review" }, { moderationStatus: "rejected" }, { isCopyrightFlagged: true }, { scheduleType: 1, scheduleTime: new Date(Date.now() + 864e5).toISOString() }]) {
      const v = await video(creator, extra);
      assert.match((await order(tC, { videoId: v, planId: "starter_plan" })).json.message, /public, published/, JSON.stringify(extra));
    }
    assert.equal((await order(tC, { videoId: "nope", planId: "starter_plan" })).json.status, false);
    const list = await call("GET", "/client/videoPromotion/eligibleVideos", { token: tC });
    assert.equal(list.json.status, true);
    assert.equal(list.json.videos.find((x) => x._id === bite).eligible, false);
    assert.equal(list.json.videos.some((x) => x._id === theirs), false, "only the caller's own videos");
  });

  await check("VP-05", "double tap: a second createOrder for the same video/plan reuses the unpaid order (one gateway order)", async () => {
    const v = await video();
    const before = gatewayOrders.length;
    const [a, b] = [await order(tC, { videoId: v, planId: "basic_plan" }), await order(tC, { videoId: v, planId: "basic_plan" })];
    assert.equal(a.json.orderId, b.json.orderId); assert.equal(b.json.reused, true);
    assert.equal(b.json.checkout.amount, 9900); assert.equal(b.json.checkout.key, "rzp_test_dummy");
    assert.equal(gatewayOrders.length, before + 1);
    // A different plan is a different order.
    assert.notEqual((await order(tC, { videoId: v, planId: "pro_starter" })).json.orderId, a.json.orderId);
  });

  let mainCampaign, mainVideo, mainOrder;
  await check("VP-06", "verified payment activates exactly one campaign with the plan snapshot; replayed verify + webhooks change nothing", async () => {
    mainVideo = await video();
    const o = await order(tC, { videoId: mainVideo, planId: "weekly_mega_plan" });
    mainOrder = o.json.orderId;
    // Before payment: no campaign, status pending.
    let st = await call("GET", `/client/payment/status?orderId=${mainOrder}`, { token: tC });
    assert.equal(st.json.transaction.status, "created"); assert.equal(st.json.transaction.campaignId, undefined);
    const results = await Promise.all([verify(tC, mainOrder), verify(tC, mainOrder), webhook(mainOrder, 100000), webhook(mainOrder, 100000)]);
    assert.ok(results.some((r) => r.json && r.json.status === true));
    await verify(tC, mainOrder); await webhook(mainOrder, 100000);
    const camps = await where("videoPromotions", "videoId", mainVideo);
    assert.equal(camps.length, 1, "one campaign");
    const c = camps[0]; mainCampaign = c._id;
    assert.equal(c.userId, creator); assert.equal(c.planId, "weekly_mega_plan"); assert.equal(c.planPriceINR, 1000);
    assert.equal(c.planSnapshot.impressionsMin, 50000); assert.equal(c.planSnapshot.impressionsMax, 75000); assert.equal(c.planSnapshot.targeting, "Global");
    assert.equal(c.impressionsDelivered, 0); assert.equal(c.paymentStatus, "paid"); assert.equal(c.status, "active");
    assert.equal(Date.parse(c.expiresAt) - Date.parse(c.startedAt), 7 * 864e5);
    const ev = await where("videoPromotionEvents", "campaignId", mainCampaign);
    assert.deepEqual(ev.map((e) => e.type), ["activated"]);
    assert.equal((await get("videos", mainVideo)).isPromoted, true);
    st = await call("GET", `/client/payment/status?orderId=${mainOrder}`, { token: tC });
    assert.equal(st.json.transaction.fulfilled, true); assert.equal(st.json.transaction.campaignId, mainCampaign);
  });

  await check("VP-07", "bad signature and failed payment never activate; payment status is private to the buyer", async () => {
    const v = await video();
    const o = await order(tC, { videoId: v, planId: "starter_plan" });
    assert.equal((await verify(tC, o.json.orderId, { badSig: true })).json.status, false);
    await webhook(o.json.orderId, 4900, "payment.failed");
    assert.equal((await where("videoPromotions", "videoId", v)).length, 0);
    assert.equal((await get("videos", v)).isPromoted, undefined);
    assert.equal((await call("GET", `/client/payment/status?orderId=${o.json.orderId}`, { token: tO })).json.status, false, "another user");
  });

  await check("VP-08", "a video with a running promotion can't be ordered again; two orders paid together queue back-to-back (no overlap)", async () => {
    assert.match((await order(tC, { videoId: mainVideo, planId: "starter_plan" })).json.message, /already has an active promotion/);
    const v = await video();
    const o1 = await order(tC, { videoId: v, planId: "starter_plan" });
    const o2 = await order(tC, { videoId: v, planId: "basic_plan" });
    await Promise.all([verify(tC, o1.json.orderId), verify(tC, o2.json.orderId)]);
    const camps = (await where("videoPromotions", "videoId", v)).sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
    assert.equal(camps.length, 2);
    assert.equal(camps[1].startedAt, camps[0].expiresAt, "second starts when the first ends");
    assert.equal(promotion.effectiveStatus(camps[1]), "scheduled");
    const types = (await where("videoPromotionEvents", "campaignId", camps[1]._id)).map((e) => e.type);
    assert.deepEqual(types, ["scheduled_after_running_campaign"]);
  });

  await check("VP-09", "a rate-card edit after purchase never changes what was bought", async () => {
    await setSettings({ promotionPlans: DEFAULT_PLANS.map((p) => (p.id === "weekly_mega_plan" ? { ...p, priceINR: 1500, impressionsMin: 1, impressionsMax: 2 } : p)) });
    try {
      const mine = await call("GET", "/client/videoPromotion/", { token: tC });
      const c = mine.json.campaigns.find((x) => x._id === mainCampaign);
      assert.equal(c.plan.priceINR, 1000); assert.equal(c.impressionsTargetMin, 50000); assert.equal(c.impressionsTargetMax, 75000);
      assert.equal(c.planPriceINR, 1000);
    } finally { await setSettings({ promotionPlans: DEFAULT_PLANS }); }
  });

  await check("VP-10", "campaign APIs are user-scoped: others can't list or open someone's campaigns", async () => {
    const mine = await call("GET", "/client/videoPromotion/", { token: tC });
    assert.ok(mine.json.campaigns.some((c) => c._id === mainCampaign));
    const theirs = await call("GET", "/client/videoPromotion/", { token: tO });
    assert.equal(theirs.json.campaigns.some((c) => c._id === mainCampaign), false);
    assert.equal((await call("GET", `/client/videoPromotion/?userId=${creator}`, { token: tO })).status, 403);
    assert.equal((await call("GET", `/client/videoPromotion/campaign?campaignId=${mainCampaign}`, { token: tO })).json.status, false);
    const detail = await call("GET", `/client/videoPromotion/campaign?campaignId=${mainCampaign}`, { token: tC });
    assert.equal(detail.json.status, true); assert.equal(detail.json.campaign.status, "active");
    assert.equal(detail.json.events[0].type, "activated");
    assert.equal((await call("GET", "/client/videoPromotion/")).status, 401);
    assert.equal((await call("GET", "/client/videoPromotion/eligibleVideos")).status, 401);
  });

  await check("VP-11", "placements: viewers get the promoted video with a token; its owner doesn't; anonymous gets no token", async () => {
    const pv = await call("GET", "/client/videoPromotion/placements?limit=3", { token: tV });
    const p = pv.json.placements.find((x) => x.campaignId === mainCampaign);
    assert.ok(p, "viewer sees the campaign"); assert.ok(p.placementToken); assert.equal(p.video._id, mainVideo);
    const own = await call("GET", "/client/videoPromotion/placements?limit=3", { token: tC });
    assert.equal(own.json.placements.some((x) => x.video.userId === creator), false);
    const anon = await call("GET", "/client/videoPromotion/placements");
    assert.ok(anon.json.placements.every((x) => x.placementToken === null));
  });

  await check("VP-12", "impressions: one per viewer per campaign per India day; forged / other-viewer / expired tokens never count", async () => {
    const tokenFor = async (tok) => (await call("GET", "/client/videoPromotion/placements?limit=3", { token: tok })).json.placements.find((x) => x.campaignId === mainCampaign).placementToken;
    const t1 = await tokenFor(tV);
    const a = await call("POST", "/client/videoPromotion/impression", { token: tV, body: { placementToken: t1 } });
    assert.equal(a.json.counted, true);
    const b = await call("POST", "/client/videoPromotion/impression", { token: tV, body: { placementToken: await tokenFor(tV) } });
    assert.equal(b.json.counted, false); assert.equal(b.json.reason, "ALREADY_COUNTED_TODAY");
    // viewer2 replaying viewer's token
    assert.equal((await call("POST", "/client/videoPromotion/impression", { token: tV2, body: { placementToken: t1 } })).json.reason, "BAD_TOKEN");
    const forged = Buffer.from(`${mainCampaign}.${viewer2}.${Date.now()}`).toString("base64url") + ".AAAA";
    assert.equal((await call("POST", "/client/videoPromotion/impression", { token: tV2, body: { placementToken: forged } })).json.reason, "BAD_TOKEN");
    const old = promotion.signToken(mainCampaign, viewer2, Date.now() - 31 * 60 * 1000);
    assert.equal((await call("POST", "/client/videoPromotion/impression", { token: tV2, body: { placementToken: old } })).json.reason, "TOKEN_EXPIRED");
    assert.equal((await call("POST", "/client/videoPromotion/impression", { body: { placementToken: t1 } })).status, 401);
    // Concurrent reports from viewer2: exactly one counts.
    const t2 = await tokenFor(tV2);
    const burst = await Promise.all(Array.from({ length: 5 }, () => call("POST", "/client/videoPromotion/impression", { token: tV2, body: { placementToken: t2 } })));
    assert.equal(burst.filter((r) => r.json.counted).length, 1);
    // Owner never counts, even with a valid self-issued token.
    const ownTok = promotion.signToken(mainCampaign, creator);
    assert.equal((await call("POST", "/client/videoPromotion/impression", { token: tC, body: { placementToken: ownTok } })).json.reason, "OWNER");
    assert.equal((await get("videoPromotions", mainCampaign)).impressionsDelivered, 2);
    const mine = await call("GET", `/client/videoPromotion/campaign?campaignId=${mainCampaign}`, { token: tC });
    assert.equal(mine.json.campaign.impressionsDelivered, 2);
    assert.equal(mine.json.campaign.progressToMinEstimate, 2 / 50000);
  });

  await check("VP-13", "delivery stops at the upper estimate (status completed)", async () => {
    const v = await video();
    const { campaignId } = await buy(tC, v, "starter_plan");
    await fsdb.collection("videoPromotions").doc(campaignId).update({ impressionsDelivered: 2500 });
    const tok = promotion.signToken(campaignId, viewer);
    assert.equal((await call("POST", "/client/videoPromotion/impression", { token: tV, body: { placementToken: tok } })).json.reason, "NOT_ACTIVE");
    assert.equal(promotion.effectiveStatus(await get("videoPromotions", campaignId)), "completed");
    assert.equal((await call("GET", "/client/videoPromotion/placements?limit=3", { token: tV })).json.placements.some((x) => x.campaignId === campaignId), false);
  });

  await check("VP-14", "expiry: past the end it's no longer served or counted; the cron settles status, logs it and clears the video flag", async () => {
    const v = await video();
    const { campaignId } = await buy(tC, v, "starter_plan");
    const past = new Date(Date.now() - 1000).toISOString();
    await fsdb.collection("videoPromotions").doc(campaignId).update({ startedAt: new Date(Date.now() - 864e5 - 1000).toISOString(), expiresAt: past });
    assert.equal((await call("GET", "/client/videoPromotion/placements?limit=3", { token: tV })).json.placements.some((x) => x.campaignId === campaignId), false);
    assert.equal((await call("POST", "/client/videoPromotion/impression", { token: tV, body: { placementToken: promotion.signToken(campaignId, viewer) } })).json.reason, "NOT_ACTIVE");
    const cron = await call("GET", "/cron/daily", { headers: { authorization: "Bearer test-cron" } });
    assert.equal(cron.json.status, true, JSON.stringify(cron.json));
    assert.ok(cron.json.tasks.expirePromotions >= 1, JSON.stringify(cron.json.tasks.expirePromotions));
    const c = await get("videoPromotions", campaignId);
    assert.equal(c.status, "expired"); assert.ok(c.endedAt);
    assert.ok((await where("videoPromotionEvents", "campaignId", campaignId)).some((e) => e.type === "expired"));
    assert.equal((await get("videos", v)).isPromoted, false);
    // Once it ended, the video can be promoted again.
    assert.equal((await order(tC, { videoId: v, planId: "starter_plan" })).json.status, true);
  });

  await check("VP-15", "admin: review keeps dates; pause stops delivery; resume gives the paused time back; take-down needs a reason, clears the flag, notes no refund; unpaid rows can't be activated", async () => {
    const ctl = h.req("controllers/admin/videoPromotion.controller");
    const adminCall = async (body) => { const { res, done } = h.mockRes(); ctl.updateCampaignStatus({ body, query: {}, admin: { _id: "p13_admin" } }, res); return done; };
    const v = await video();
    const { campaignId } = await buy(tC, v, "boost_plan");
    const c0 = await get("videoPromotions", campaignId);
    assert.equal((await adminCall({ campaignId, action: "approve" })).status, true);
    let c = await get("videoPromotions", campaignId);
    assert.equal(c.approvedByAdmin, true); assert.equal(c.startedAt, c0.startedAt); assert.equal(c.expiresAt, c0.expiresAt);
    assert.equal((await adminCall({ campaignId, action: "pause" })).status, true);
    assert.equal((await call("GET", "/client/videoPromotion/placements?limit=3", { token: tV })).json.placements.some((x) => x.campaignId === campaignId), false);
    assert.equal((await get("videos", v)).isPromoted, false);
    await fsdb.collection("videoPromotions").doc(campaignId).update({ pausedAt: new Date(Date.now() - 3600e3).toISOString() });
    assert.equal((await adminCall({ campaignId, action: "resume" })).status, true);
    c = await get("videoPromotions", campaignId);
    const gained = Date.parse(c.expiresAt) - Date.parse(c0.expiresAt);
    assert.ok(gained >= 3600e3 && gained < 3700e3, `extended by the paused hour (${gained})`);
    assert.equal((await get("videos", v)).isPromoted, true);
    assert.equal((await adminCall({ campaignId, action: "reject" })).status, false, "reason required");
    const rj = await adminCall({ campaignId, action: "reject", rejectionReason: "Policy violation" });
    assert.equal(rj.status, true); assert.match(rj.note, /No refund has been issued/);
    c = await get("videoPromotions", campaignId);
    assert.equal(c.status, "rejected"); assert.equal(c.planPriceINR, 249, "price untouched");
    assert.equal((await get("videos", v)).isPromoted, false);
    const types = (await where("videoPromotionEvents", "campaignId", campaignId)).sort((a, b) => a.at.localeCompare(b.at)).map((e) => e.type);
    assert.deepEqual(types, ["activated", "reviewed", "paused", "resumed", "rejected"]);
    const mine = await call("GET", `/client/videoPromotion/campaign?campaignId=${campaignId}`, { token: tC });
    assert.equal(mine.json.campaign.status, "rejected"); assert.equal(mine.json.campaign.rejectionReason, "Policy violation");
    assert.ok(mine.json.events.every((e) => e.by !== "p13_admin"), "admin ids aren't shown to creators");
    // Legacy unpaid row: can't be approved into delivery.
    await set("videoPromotions", "p13_legacy", { userId: creator, videoId: v, planName: "Starter Plan", status: "pending_payment", createdAt: nowIso() });
    const ap = await adminCall({ campaignId: "p13_legacy", action: "approve" });
    assert.equal(ap.status, false); assert.match(ap.message, /no verified payment/);
  });

  await check("VP-16", "older campaign rows (no snapshot, old plan name) still present correctly", async () => {
    const v = await video();
    await set("videoPromotions", "p13_old", {
      userId: creator, videoId: v, planName: "Weekly Mega", planPriceINR: 1000, planDurationDays: 7, impressionsTargetMin: 50000, impressionsTargetMax: 75000,
      paymentGatewayRef: "ptxn_old", status: "active", startedAt: new Date(Date.now() - 864e5).toISOString(), expiresAt: new Date(Date.now() + 6 * 864e5).toISOString(), createdAt: nowIso(),
    });
    const r = await call("GET", `/client/videoPromotion/campaign?campaignId=p13_old`, { token: tC });
    assert.equal(r.json.campaign.plan.name, "Weekly Mega"); assert.equal(r.json.campaign.plan.priceINR, 1000);
    assert.equal(r.json.campaign.impressionsDelivered, 0); assert.equal(r.json.campaign.status, "active");
  });
};
