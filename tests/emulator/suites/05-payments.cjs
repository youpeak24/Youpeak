// Phase 2 (F-22): payment fulfilment state machine — idempotent per-effect
// fulfilment, amount/currency validation, recovery after a failed effect or a
// stuck lease. Gateway traffic is simulated with correctly signed Razorpay
// payloads (throwaway secrets from the harness); no network is used.
"use strict";
const crypto = require("node:crypto");

module.exports = async (h, check, assert) => {
  const { call, seedUser, idToken, setSettings, nowIso, set, get, getUser, where, fsdb } = h;
  await setSettings({ paymentGateway: "razorpay", digitalPartnerLicenseFeeINR: 25000, paidTierReferralPercentage: 10 });
  // Canonical tier ladder (types/tiers.js — V9 Tasker table, V6 Creator table).
  for (const tier of h.req("types/tiers").ALL_TIERS) await set("membershipTiers", tier._id, tier);

  const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  let seq = 0;
  async function order(userId, purpose, amountInr, extra = {}) {
    const n = ++seq;
    const id = `p5_txn_${n}`, orderId = `order_p5_${n}`;
    await set("paymentTransactions", id, { userId, gateway: "razorpay", purpose, amountInr, currency: "INR", orderId, status: "created", fulfilled: false, createdAt: nowIso(), ...extra });
    return { id, orderId };
  }
  function webhook(orderId, { amountPaise, currency = "INR", event = "payment.captured", paymentId = `pay_${orderId}`, badSig = false } = {}) {
    const raw = JSON.stringify({ event, payload: { payment: { entity: { id: paymentId, order_id: orderId, amount: amountPaise, currency, status: event === "payment.captured" ? "captured" : "failed" } } } });
    const sig = badSig ? "deadbeef" : crypto.createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
    return call("POST", "/payment/webhook/razorpay", { raw, headers: { "x-razorpay-signature": sig } });
  }
  function callback(orderId, paymentId = `pay_${orderId}`, badSig = false) {
    const signature = badSig ? "0".repeat(64) : crypto.createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
    return call("POST", "/client/payment/verify", { body: { orderId, paymentId, signature } });
  }
  const txnState = async (id) => (await get("paymentTransactions", id)).fulfilmentStatus;

  await set(h.db.normalizeCollectionName("CoinPlan"), "p5_plan", { coin: 1000, extraCoin: 100, amount: 99, isActive: true });

  await check("PF-01", "duplicate webhook: coins credited once, COMPLETED, one ledger row with the platform share", async () => {
    await seedUser("p5_buyer1");
    const o = await order("p5_buyer1", "coin_plan", 99, { coinPlanId: "p5_plan" });
    const a = await webhook(o.orderId, { amountPaise: 9900 });
    const b = await webhook(o.orderId, { amountPaise: 9900 });
    assert.equal(a.status, 200, JSON.stringify(a.json)); assert.equal(b.status, 200);
    assert.equal((await getUser("p5_buyer1")).coin, 1100);
    assert.equal(await txnState(o.id), "COMPLETED");
    const ledger = await get(h.db.normalizeCollectionName("revenueLedger"), `rev_${o.id}`);
    assert.ok(ledger, "revenue ledger row"); assert.equal(ledger.platformCoins + ledger.referrerCoins + ledger.creatorCoins, ledger.grossCoins);
  });
  await check("PF-02", "5 simultaneous webhooks + the client callback: exactly one credit", async () => {
    await seedUser("p5_buyer2");
    const o = await order("p5_buyer2", "coin_plan", 99, { coinPlanId: "p5_plan" });
    await Promise.all([...Array.from({ length: 5 }, () => webhook(o.orderId, { amountPaise: 9900 })), callback(o.orderId)]);
    // Losers of the claim get 503 (in progress) — the gateway would redeliver; do that once.
    await webhook(o.orderId, { amountPaise: 9900 });
    assert.equal((await getUser("p5_buyer2")).coin, 1100);
    assert.equal(await txnState(o.id), "COMPLETED");
    assert.equal((await where("histories", "userId", "p5_buyer2")).filter((x) => x.type === 8).length, 1);
  });
  await check("PF-03", "amount or currency mismatch -> VALIDATION_FAILED, nothing granted, later correct event doesn't auto-fulfil", async () => {
    await seedUser("p5_buyer3");
    const o = await order("p5_buyer3", "coin_plan", 99, { coinPlanId: "p5_plan" });
    const r = await webhook(o.orderId, { amountPaise: 100 });
    assert.equal(r.status, 200);
    assert.equal(await txnState(o.id), "VALIDATION_FAILED");
    await webhook(o.orderId, { amountPaise: 9900 });
    assert.equal((await getUser("p5_buyer3")).coin, 0);
    const o2 = await order("p5_buyer3", "coin_plan", 99, { coinPlanId: "p5_plan" });
    await webhook(o2.orderId, { amountPaise: 9900, currency: "USD" });
    assert.equal(await txnState(o2.id), "VALIDATION_FAILED");
    assert.equal((await getUser("p5_buyer3")).coin, 0);
  });
  await check("PF-04", "invalid signature (webhook 400; callback doesn't mark someone's order failed); unknown order 503", async () => {
    await seedUser("p5_buyer4");
    const o = await order("p5_buyer4", "coin_plan", 99, { coinPlanId: "p5_plan" });
    assert.equal((await webhook(o.orderId, { amountPaise: 9900, badSig: true })).status, 400);
    const cb = await callback(o.orderId, "pay_x", true);
    assert.equal(cb.json.status, false);
    const t = await get("paymentTransactions", o.id);
    assert.equal(t.status, "created"); assert.ok(!t.fulfilled);
    assert.equal((await webhook("order_does_not_exist", { amountPaise: 100 })).status, 503);
  });
  await check("PF-05", "failed/cancelled and out-of-order events: failure event changes nothing; capture after it fulfils", async () => {
    await seedUser("p5_buyer5");
    const o = await order("p5_buyer5", "coin_plan", 99, { coinPlanId: "p5_plan" });
    assert.equal((await webhook(o.orderId, { amountPaise: 9900, event: "payment.failed" })).status, 200);
    assert.equal((await getUser("p5_buyer5")).coin, 0);
    await webhook(o.orderId, { amountPaise: 9900 });
    await webhook(o.orderId, { amountPaise: 9900, event: "payment.failed" });
    assert.equal((await getUser("p5_buyer5")).coin, 1100);
    assert.equal(await txnState(o.id), "COMPLETED");
  });
  await check("PF-06", "an effect fails mid-fulfilment -> REQUIRES_RECONCILIATION (500 to gateway); retry finishes only the missing effects", async () => {
    await seedUser("p5_ref_l1", { membershipTierId: "tier_tasker_bronze" });
    await seedUser("p5_buyer6", { referrerId: "p5_ref_l1" });
    const o = await order("p5_buyer6", "tier_upgrade", 2499, { tierId: "tier_tasker_silver" });
    await set("histories", `${o.id}_referral`, { note: "injected conflict" }); // makes the referral effect's create() fail
    const first = await webhook(o.orderId, { amountPaise: 249900 });
    assert.equal(first.status, 500, JSON.stringify(first.json));
    assert.equal(await txnState(o.id), "REQUIRES_RECONCILIATION");
    let u = await getUser("p5_buyer6");
    assert.equal(u.membershipTierId, "tier_tasker_silver"); assert.equal(u.adCreditsBalance, 2500);
    await fsdb.collection("histories").doc(`${o.id}_referral`).delete();
    const retry = await webhook(o.orderId, { amountPaise: 249900 });
    assert.equal(retry.status, 200, JSON.stringify(retry.json));
    assert.equal(await txnState(o.id), "COMPLETED");
    u = await getUser("p5_buyer6");
    assert.equal(u.adCreditsBalance, 2500, "ad credits granted twice");
    assert.equal((await getUser("p5_ref_l1")).coin, 24990, "L1 referrer gets 10% of ₹2,499 once");
  });
  await check("PF-07", "crash after claim: live PROCESSING lease -> 503; expired lease is reclaimed and completed", async () => {
    await seedUser("p5_buyer7");
    const o = await order("p5_buyer7", "coin_plan", 99, { coinPlanId: "p5_plan", status: "paid", fulfilmentStatus: "PROCESSING", processingAt: nowIso() });
    assert.equal((await webhook(o.orderId, { amountPaise: 9900 })).status, 503);
    assert.equal((await getUser("p5_buyer7")).coin, 0);
    await fsdb.collection("paymentTransactions").doc(o.id).update({ processingAt: new Date(Date.now() - 6 * 60e3).toISOString() });
    assert.equal((await webhook(o.orderId, { amountPaise: 9900 })).status, 200);
    assert.equal((await getUser("p5_buyer7")).coin, 1100);
  });
  await check("PF-08", "a pre-state-machine order already fulfilled (fulfilled:true) is never re-run", async () => {
    await seedUser("p5_buyer8");
    const o = await order("p5_buyer8", "coin_plan", 99, { coinPlanId: "p5_plan", status: "paid", fulfilled: true });
    await webhook(o.orderId, { amountPaise: 9900 });
    assert.equal((await getUser("p5_buyer8")).coin, 0);
  });
  await check("PF-09", "F-26/F-15: Tasker pass grants its Ad Credits; a Free-tier referrer gets no 10% bonus", async () => {
    await seedUser("p5_ref_free");
    await seedUser("p5_buyer9", { referrerId: "p5_ref_free" });
    const o = await order("p5_buyer9", "tier_upgrade", 999, { tierId: "tier_tasker_bronze" });
    await webhook(o.orderId, { amountPaise: 99900 });
    const u = await getUser("p5_buyer9");
    assert.equal(u.membershipTierId, "tier_tasker_bronze"); assert.equal(u.adCreditsBalance, 1000);
    assert.ok(await get("adCreditLedger", `adc_${o.id}`), "ad credit ledger row");
    assert.equal((await getUser("p5_ref_free")).coin, 0, "free referrer must not get the paid-tier 10%");
  });
  await check("PF-10", "F-14: checkout refuses a Tasker pass at or below the current level", async () => {
    await seedUser("p5_l2", { membershipTierId: "tier_tasker_silver" });
    const tok = await idToken("p5_l2");
    for (const tierId of ["tier_tasker_bronze", "tier_tasker_silver"]) {
      const r = await call("POST", "/client/payment/createOrder", { token: tok, body: { purpose: "tier_upgrade", tierId } });
      assert.equal(r.json.status, false); assert.match(r.json.message, /already have this level/);
    }
  });
  await check("PF-11", "Digital Partner licence delivered twice: credits 25,000 once, one franchise commission", async () => {
    await set("agencies", "p5_agency", { isActive: true, state: "TN", district: "Trichy", commissionRatePercentage: 10 });
    await seedUser("p5_partner", { state: "TN", district: "Trichy", email: "p5_partner@test.local" });
    const o = await order("p5_partner", "digital_partner_license", 25000);
    await webhook(o.orderId, { amountPaise: 2500000 });
    await fsdb.collection("paymentTransactions").doc(o.id).update({ fulfilmentStatus: "REQUIRES_RECONCILIATION" }); // force a replay
    await webhook(o.orderId, { amountPaise: 2500000 });
    const profiles = await where(h.db.normalizeCollectionName("PartnerProfile"), "userId", "p5_partner");
    assert.equal(profiles.length, 1); assert.equal(profiles[0].adCreditsBalance, 25000);
    const comms = (await where(h.db.normalizeCollectionName("agencyCommissions"), "userId", "p5_partner")).filter((c) => c.sourceType === "DIGITAL_PARTNER_LICENSE");
    assert.equal(comms.length, 1);
    assert.equal((await getUser("p5_partner")).partnerStatus, "ACTIVE");
  });
  await check("PF-12", "admin reconcile: dry run lists stuck orders; retry completes them idempotently", async () => {
    await seedUser("p5_buyer12");
    const o = await order("p5_buyer12", "coin_plan", 99, { coinPlanId: "p5_plan", status: "paid", fulfilmentStatus: "REQUIRES_RECONCILIATION" });
    const ctl = h.req("controllers/client/payment.controller");
    const dry = h.mockRes(); ctl.adminReconcile({ method: "GET", body: {} }, dry.res);
    const list = await dry.done;
    assert.ok(list.transactions.some((t) => t.id === o.id));
    assert.equal((await getUser("p5_buyer12")).coin, 0, "dry run must not change anything");
    const run = h.mockRes(); ctl.adminReconcile({ method: "POST", body: { retry: true, limit: 50 } }, run.res);
    await run.done;
    assert.equal((await getUser("p5_buyer12")).coin, 1100);
    assert.equal(await txnState(o.id), "COMPLETED");
  });
};
