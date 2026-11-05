// The landing page's real portal client (Youpeak_Landing_Page/src/lib/portal.js)
// run end to end against the emulator backend: email signup, Firebase token
// exchange + refresh, per-user calls, and a verified payment applying a pass.
// Only Razorpay's own servers are not reachable here, so the order row is
// written the way createOrder would and the callback is signed with the
// harness secret exactly as Razorpay Checkout would sign it.
"use strict";
const crypto = require("node:crypto");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

module.exports = async (h, check, assert) => {
  const { set, nowIso } = h;
  await h.setSettings({ paymentGateway: "razorpay", razorpayWebEnabled: true, razorPaySwitch: true });
  for (const tier of h.req("types/tiers").ALL_TIERS) await set("membershipTiers", tier._id, tier);

  // Firebase's public REST endpoints -> the Auth emulator.
  const realFetch = global.fetch;
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  global.fetch = (url, init) => {
    const u = String(url);
    const m = u.match(/^https:\/\/(identitytoolkit|securetoken)\.googleapis\.com(\/.*)$/);
    return realFetch(m ? `http://${authHost}/${m[1]}.googleapis.com${m[2]}` : url, init);
  };

  const portal = await import(pathToFileURL(path.join(h.BACKEND, "../../Youpeak_Landing_Page/src/lib/portal.js")).href);
  const plansLib = await import(pathToFileURL(path.join(h.BACKEND, "../../Youpeak_Landing_Page/src/lib/plans.js")).href);
  portal.configurePortal({ apiBase: h.base, apiKey: "test-app-key", firebaseKey: "fake" });

  const email = "webbuyer@test.local";
  const password = "Web#Buyer1";
  let session;

  await check("WC-01", "catalog -> plans uses the server's prices", async () => {
    const catalog = await portal.fetchCatalog({ force: true });
    const p = plansLib.buildPlans(catalog, null, null);
    const bronze = p.starter.find((x) => x.id === "tier_tasker_bronze");
    assert.equal(bronze.options[0].priceINR, 999);
    assert.ok(p.creator.find((x) => x.id === "tier_creator_starter_vip").options.length === 2);
    assert.ok(p.more.find((x) => x.id === "digital_partner_license"));
    assert.equal(plansLib.findPlan(p, "bronze").id, "tier_tasker_bronze");
  });

  await check("WC-02", "signup: new email -> NEW, then account + working session", async () => {
    assert.equal(await portal.accountState({ email, password }), "NEW");
    const r = await portal.signInWithPassword({ email, password, fullName: "Web Buyer" });
    assert.equal(r.signUp, true);
    session = r.session;
    assert.ok(session.idToken && session.refreshToken && session.userId);
    const me = await portal.fetchProfile();
    assert.equal(me.email, email);
    assert.equal(await portal.accountState({ email, password }), "EXISTS_OK");
    assert.equal(await portal.accountState({ email, password: "wrong" }), "EXISTS_WRONG_PASSWORD");
  });

  await check("WC-03", "an expired ID token is refreshed transparently", async () => {
    const before = portal.loadSession().idToken;
    const s = portal.loadSession();
    s.expiresAt = Date.now() - 1000; // force the refresh path
    const me = await portal.fetchProfile();
    assert.equal(me.email, email);
    assert.ok(portal.loadSession().expiresAt > Date.now(), "expiry moved forward");
    assert.ok(portal.loadSession().idToken, "has a token");
    void before;
  });

  await check("WC-04", "user-specific tier data merges into the plan list", async () => {
    const catalog = await portal.fetchCatalog();
    const [t, c] = await Promise.all([portal.fetchTaskerTiers(), portal.fetchCreatorTiers()]);
    const p = plansLib.buildPlans(catalog, t, c);
    assert.equal(p.starter.find((x) => x.id === "tier_tasker_bronze").status, "buy");
    // 0 subscribers: the Silver VIP pass (needs 5,000) is locked, Starter VIP is open.
    assert.equal(p.creator.find((x) => x.id === "tier_creator_silver_vip").status, "locked");
    assert.equal(p.creator.find((x) => x.id === "tier_creator_starter_vip").status, "buy");
  });

  await check("WC-05", "createOrder either returns a usable checkout or fails with a readable PortalError", async () => {
    // Depending on whether an earlier suite stubbed the gateway, the order is
    // created or Razorpay rejects the dummy key. Either way the client must
    // hand the page something it can act on - never an uncaught crash.
    let order, err;
    try { order = await portal.createOrder({ purpose: "tier_upgrade", tierId: "tier_tasker_bronze" }); } catch (e) { err = e; }
    if (err) assert.ok(err.name === "PortalError" && err.message.length > 0, "PortalError expected");
    else assert.ok(order.checkout && order.checkout.order_id && order.checkout.key, "checkout payload expected");
  });

  await check("WC-06", "a signed callback applies the pass; status reports COMPLETED", async () => {
    const orderId = "order_wc_1";
    await set("paymentTransactions", "wc_txn_1", {
      userId: session.userId, gateway: "razorpay", purpose: "tier_upgrade", tierId: "tier_tasker_bronze",
      amountInr: 999, currency: "INR", orderId, status: "created", fulfilled: false, createdAt: nowIso(),
    });
    const paymentId = "pay_wc_1";
    const signature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
    const bad = await portal.verifyPayment({ orderId, paymentId, signature: "0".repeat(64) });
    assert.equal(bad.status, false);
    const ok = await portal.verifyPayment({ orderId, paymentId, signature });
    assert.equal(ok.status, true, JSON.stringify(ok));
    const st = await portal.orderStatus(orderId);
    assert.equal(st.transaction.fulfilmentStatus, "COMPLETED");
    const user = await h.getUser(session.userId);
    assert.equal(user.membershipTierId, "tier_tasker_bronze");
    // After buying, the tier list reflects it.
    const t = await portal.fetchTaskerTiers();
    assert.equal(t.tiers.find((x) => (x._id || x.id) === "tier_tasker_bronze").isCurrentTier, true);
  });

  await check("WC-07", "logout clears the session and per-user calls then need a login", async () => {
    portal.logout();
    assert.equal(portal.loadSession(), null);
    let err;
    try { await portal.fetchProfile(); } catch (e) { err = e; }
    assert.equal(err && err.code, "AUTH_REQUIRED");
  });

  global.fetch = realFetch;
};
