// Phase 2 (F-24): withdrawal reservation — available → reserved on request,
// reserved → paid on approval, reserved → available on decline; one pending
// request per user; no double reserve / double release.
"use strict";

module.exports = async (h, check, assert) => {
  const { call, seedUser, idToken, setSettings, getUser, get, where, fsdb } = h;
  await setSettings({ firstWithdrawalMinimumInr: 100, minWithdrawalRequestedAmount: 500, enforceTierMonthlyWithdrawalCap: false, minCoinForCashOut: 100, coinsPerInr: 100 });
  const adminCtl = h.req("controllers/admin/withDrawalRequest.controller");
  const accept = (requestId, extra = {}) => { const m = h.mockRes(); adminCtl.acceptWithdrawalRequest({ query: { requestId, ...extra }, admin: { _id: "p6_admin" } }, m.res); return m.done; };
  const decline = (requestId) => { const m = h.mockRes(); adminCtl.declineWithdrawalRequest({ query: { requestId, reason: "test" }, admin: { _id: "p6_admin" } }, m.res); return m.done; };
  const legacy = (tok, amount) => call("POST", "/client/withdrawalRequest/createWithdrawRequest", { token: tok, body: { requestAmount: amount, paymentGateway: "UPI", paymentDetails: ["UPI ID: ab@upi"] } });
  const payout = (tok, amount) => call("POST", "/client/payout/request", { token: tok, body: { amountInr: amount, method: "UPI", upiId: "ab@upi" } });
  const requestsOf = async (uid) => (await where("withDrawRequests", "userId", uid));

  await check("WD-01", "first payout: ₹99 refused, exactly ₹100 reserved (available 100 → 0, reserved 0 → 100)", async () => {
    await seedUser("p6_first", { totalEarningAmount: 100 });
    const tok = await idToken("p6_first");
    assert.equal((await payout(tok, 99)).json.code, "BELOW_MINIMUM");
    const r = await payout(tok, 100);
    assert.equal(r.json.status, true, JSON.stringify(r.json));
    const u = await getUser("p6_first");
    assert.equal(u.totalEarningAmount, 0); assert.equal(u.reservedEarningAmount, 100);
    assert.ok(await get("withdrawalLocks", "p6_first"));
  });
  await check("WD-02", "6 simultaneous requests (both routes) → exactly one pending, balance reserved once", async () => {
    await seedUser("p6_race", { totalEarningAmount: 600 });
    const tok = await idToken("p6_race");
    const out = await Promise.all([...Array.from({ length: 3 }, () => payout(tok, 500)), ...Array.from({ length: 3 }, () => legacy(tok, 500))]);
    assert.equal(out.filter((r) => r.json.status === true).length, 1, JSON.stringify(out.map((r) => r.json.code || r.json.message)));
    const u = await getUser("p6_race");
    assert.equal(u.totalEarningAmount, 100); assert.equal(u.reservedEarningAmount, 500);
    assert.equal((await requestsOf("p6_race")).filter((x) => x.status === 1).length, 1);
  });
  await check("WD-03", "approval consumes the reservation once (concurrent double approval → one), lock released, next request allowed", async () => {
    const [req] = (await requestsOf("p6_race")).filter((x) => x.status === 1);
    const out = await Promise.all([accept(req._id), accept(req._id), accept(req._id)]);
    assert.equal(out.filter((b) => b.status === true).length, 1, JSON.stringify(out));
    const u = await getUser("p6_race");
    assert.equal(u.reservedEarningAmount, 0); assert.equal(u.totalEarningAmount, 100);
    const done = await get("withDrawRequests", req._id);
    assert.equal(done.status, 2); assert.equal(done.settlementEvidence, "MANUAL_ADMIN_APPROVAL");
    assert.equal(await get("withdrawalLocks", "p6_race"), null);
  });
  await check("WD-04", "after a paid payout the ₹500 standard minimum applies", async () => {
    const tok = await idToken("p6_race");
    await fsdb.collection("users").doc("p6_race").update({ totalEarningAmount: 600 });
    assert.equal((await payout(tok, 400)).json.code, "BELOW_MINIMUM");
    assert.equal((await payout(tok, 500)).json.status, true);
  });
  await check("WD-05", "decline releases exactly once; racing decline + approve → one winner; money conserved", async () => {
    await seedUser("p6_dec", { totalEarningAmount: 300 });
    const tok = await idToken("p6_dec");
    await payout(tok, 200);
    const [req] = await requestsOf("p6_dec");
    const out = await Promise.all([decline(req._id), decline(req._id), accept(req._id)]);
    assert.equal(out.filter((b) => b.status === true).length, 1, JSON.stringify(out));
    const u = await getUser("p6_dec");
    const final = await get("withDrawRequests", req._id);
    if (final.status === 3) { assert.equal(u.totalEarningAmount, 300); assert.equal(u.reservedEarningAmount, 0); }
    else { assert.equal(final.status, 2); assert.equal(u.totalEarningAmount, 100); assert.equal(u.reservedEarningAmount, 0); }
  });
  await check("WD-06", "coin shortfall converted inside the reservation (₹50 + 10,000 coins → ₹100 request)", async () => {
    await seedUser("p6_conv", { totalEarningAmount: 50, coin: 10000 });
    const r = await payout(await idToken("p6_conv"), 100);
    assert.equal(r.json.status, true, JSON.stringify(r.json)); assert.equal(r.json.convertedCoins, 5000);
    const u = await getUser("p6_conv");
    assert.equal(u.coin, 5000); assert.equal(u.totalEarningAmount, 0); assert.equal(u.reservedEarningAmount, 100);
    assert.equal((await where("walletHistories", "userId", "p6_conv")).length, 1);
  });
  await check("WD-07", "insufficient coins + ₹: refused with nothing reserved or converted", async () => {
    await seedUser("p6_poor", { totalEarningAmount: 50, coin: 100 });
    const r = await payout(await idToken("p6_poor"), 100);
    assert.equal(r.json.code, "INSUFFICIENT_BALANCE");
    const u = await getUser("p6_poor");
    assert.equal(u.coin, 100); assert.equal(u.totalEarningAmount, 50); assert.ok(!u.reservedEarningAmount);
    assert.equal(await get("withdrawalLocks", "p6_poor"), null);
  });
  await check("WD-08", "fraud hold after the request blocks approval; reservation stays until declined", async () => {
    await seedUser("p6_hold", { totalEarningAmount: 200 });
    await payout(await idToken("p6_hold"), 200);
    const [req] = await requestsOf("p6_hold");
    await fsdb.collection("users").doc("p6_hold").update({ isRestricted: true });
    const a = await accept(req._id);
    assert.equal(a.code, "PAYOUT_ON_HOLD");
    assert.equal((await getUser("p6_hold")).reservedEarningAmount, 200);
    assert.equal((await decline(req._id)).status, true);
    const u = await getUser("p6_hold");
    assert.equal(u.totalEarningAmount, 200); assert.equal(u.reservedEarningAmount, 0);
  });
  await check("WD-09", "approval is admin-only: the app key cannot reach the admin route", async () => {
    const r = await call("PATCH", "/admin/withDrawalRequest/acceptWithdrawalRequest?requestId=x");
    assert.equal(r.status, 401);
  });
};
