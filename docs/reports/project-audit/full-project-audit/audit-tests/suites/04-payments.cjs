// AUDIT: legacy purchase endpoints. The gateway signature below is produced with the emulator's
// throw-away test secret to stand in for "a payment the caller legitimately made for SOME order".
// No real gateway, card or money is involved.
"use strict";
const crypto = require("node:crypto");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sign = (orderId, paymentId) => crypto.createHmac("sha256", "test-razorpay-secret").update(`${orderId}|${paymentId}`).digest("hex");

module.exports = async (h, check, assert) => {
  const { call, fsdb, set, seedUser, idToken } = h;

  await check("PY-01", "POST client/premiumPlan/createHistory requires proof of payment before activating a premium plan", async () => {
    await seedUser("py_free");
    await fsdb.collection("PremiumPlan").doc("pp1").set({ _id: "pp1", amount: 999, validity: 1, validityType: "year", isActive: true, planBenefit: ["no ads"] });
    const tok = await idToken("py_free");
    const r = await call("POST", "/client/premiumPlan/createHistory", { token: tok, body: { premiumPlanId: "pp1", paymentGateway: "razorpay" } });
    const u = await h.getUser("py_free");
    assert.ok(!(u.isPremiumPlan === true), `premium plan activated with no payment: status=${r.json.status}, isPremiumPlan=${u.isPremiumPlan}`);
  });

  await check("PY-02", "createCoinPlanHistory binds the gateway proof to the plan/amount that was actually paid for", async () => {
    await seedUser("py_cheat", { coin: 0 });
    await fsdb.collection("CoinPlan").doc("cp_big").set({ _id: "cp_big", coin: 1000000, extraCoin: 100000, amount: 10000, isActive: true });
    const tok = await idToken("py_cheat");
    // The attacker only ever paid for an unrelated (e.g. ₹1) order created through processRazorpayPayment.
    const orderId = "order_unrelated_1rupee", paymentId = "pay_unrelated_1rupee";
    const r = await call("POST", "/client/coinplan/createCoinPlanHistory", { token: tok, body: { coinPlanId: "cp_big", paymentGateway: "razorpay", orderId, paymentId, signature: sign(orderId, paymentId) } });
    await sleep(1500);
    const u = await h.getUser("py_cheat");
    assert.equal(u.coin || 0, 0, `credited ${u.coin} coins (₹${(u.coin || 0) / 100}) for a proof that was never tied to plan cp_big (₹10,000); response status=${r.json.status}`);
  });

  await check("PY-03", "the same gateway payment cannot be credited more than once under concurrency", async () => {
    await seedUser("py_replay", { coin: 0 });
    await fsdb.collection("CoinPlan").doc("cp_small").set({ _id: "cp_small", coin: 100, extraCoin: 0, amount: 1, isActive: true });
    const tok = await idToken("py_replay");
    const orderId = "order_replay_1", paymentId = "pay_replay_1";
    const body = { coinPlanId: "cp_small", paymentGateway: "razorpay", orderId, paymentId, signature: sign(orderId, paymentId) };
    await Promise.all(Array.from({ length: 6 }, () => call("POST", "/client/coinplan/createCoinPlanHistory", { token: tok, body })));
    await sleep(2500);
    const u = await h.getUser("py_replay");
    assert.ok((u.coin || 0) <= 100, `one ₹1 payment (100 coins) produced ${u.coin} coins after 6 parallel replays`);
  });

  await check("PY-04", "an authenticated user cannot create gateway orders of arbitrary amount (processRazorpayPayment)", async () => {
    const tok = await idToken("py_free");
    const r = await call("POST", "/client/coinplan/processRazorpayPayment", { token: tok, body: { amount: 1, receipt: "audit" } });
    // With no gateway configured the call fails either way; the check is that the handler does not look up a server-side price.
    const src = require("node:fs").readFileSync(require("node:path").join(h.BACKEND, "controllers/client/coinplan.controller.js"), "utf8");
    assert.ok(!/amount \* 100/.test(src.split("exports.processRazorpayPayment")[1] || ""), "processRazorpayPayment multiplies a client-supplied `amount` (no plan lookup, no per-user binding)");
  });
};
