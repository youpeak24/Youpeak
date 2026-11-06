// Web membership portal (the landing page): public catalog + the same
// email/password account the app uses, then per-user tier endpoints with the
// Firebase ID token the portal gets from the login response.
//
// Verifies:
//   1. /client/portal/catalog needs the client key and returns real tier prices, never a secret
//   2. Email signup creates the account and hands back a Firebase custom token the portal can exchange
//   3. Logging in again with the password works; a wrong password is refused
//   4. checkUser (used by the portal before signup/login) distinguishes new vs existing accounts
//   5. The exchanged ID token authorises createOrder/tier endpoints, and a user cannot act as another
"use strict";

module.exports = async (h, check, assert) => {
  const { call, set, idToken } = h;
  await h.setSettings({ paymentGateway: "razorpay", razorpayWebEnabled: true, razorPaySwitch: true, digitalPartnerLicenseFeeINR: 25000 });
  for (const tier of h.req("types/tiers").ALL_TIERS) await set("membershipTiers", tier._id, tier);

  await check("WP-01", "catalog requires the client key", async () => {
    const r = await call("GET", "/client/portal/catalog", { headers: { key: "wrong" } });
    assert.equal(r.status, 401);
  });

  await check("WP-02", "catalog lists tasker + creator passes at the server's prices, with no secret", async () => {
    const r = await call("GET", "/client/portal/catalog");
    assert.equal(r.status, 200);
    assert.equal(r.json.status, true);
    const bronze = r.json.taskerTiers.find((t) => t.id === "tier_tasker_bronze");
    assert.ok(bronze, "tasker bronze present");
    assert.equal(bronze.priceINR, 999);
    const vip = r.json.creatorTiers.find((t) => t.id === "tier_creator_starter_vip");
    assert.ok(vip && vip.billingOptions.length === 2, "creator VIP has quarterly + annual options");
    assert.equal(r.json.digitalPartner.licenseFeeINR, 25000);
    assert.equal(typeof r.json.payments.enabled, "boolean");
    const text = JSON.stringify(r.json);
    assert.ok(!text.includes(process.env.RAZORPAY_KEY_SECRET), "key secret leaked");
    assert.ok(!text.includes(process.env.RAZORPAY_WEBHOOK_SECRET), "webhook secret leaked");
  });

  const email = "portal.user@test.local";
  const password = "Portal#12345";
  let userId;

  await check("WP-03", "checkUser: unknown email -> must sign up; signup returns a custom token", async () => {
    const pre = await call("POST", "/client/user/checkUser", { body: { email, password, loginType: 4 } });
    assert.equal(pre.json.status, true);
    assert.equal(pre.json.isLogin, false);

    const r = await call("POST", "/client/user/login", { body: { email, password, loginType: 4, identity: "web-portal", fcmToken: "no-fcm-token", fullName: "Portal User" } });
    assert.equal(r.json.status, true, JSON.stringify(r.json));
    assert.equal(r.json.signUp, true);
    assert.ok(r.json.firebaseCustomToken, "custom token for the portal to exchange");
    assert.equal(r.json.user.password, undefined);
    assert.equal(r.json.user.passwordHash, undefined);
    userId = r.json.user._id || r.json.user.id;
  });

  await check("WP-04", "login again with the password works; a wrong password is refused", async () => {
    const ok = await call("POST", "/client/user/login", { body: { email, password, loginType: 4, identity: "web-portal", fcmToken: "no-fcm-token" } });
    assert.equal(ok.json.status, true);
    assert.equal(ok.json.signUp, false);
    const bad = await call("POST", "/client/user/login", { body: { email, password: "nope", loginType: 4, identity: "web-portal", fcmToken: "no-fcm-token" } });
    assert.equal(bad.json.status, false);
    const chk = await call("POST", "/client/user/checkUser", { body: { email, password: "nope", loginType: 4 } });
    assert.equal(chk.json.isLogin, false);
  });

  await check("WP-05", "the signed-in portal user sees their own tier data; another user's id is refused", async () => {
    const token = await idToken(userId);
    const t = await call("GET", "/client/taskerTier/getAvailableTiers", { token });
    assert.equal(t.json.status, true, JSON.stringify(t.json));
    assert.ok(t.json.tiers.find((x) => x.id === "tier_tasker_bronze" || x._id === "tier_tasker_bronze").canPurchase === true);
    const other = await call("GET", "/client/taskerTier/getAvailableTiers?userId=somebody_else", { token });
    assert.equal(other.status, 403);
    const profile = await call("GET", "/client/user/profile", { token });
    assert.equal(profile.json.status, true);
    assert.equal(profile.json.user.email, email);
  });

  await check("WP-06", "createOrder needs a signed-in user (no token -> 401)", async () => {
    const r = await call("POST", "/client/payment/createOrder", { body: { purpose: "tier_upgrade", tierId: "tier_tasker_bronze" } });
    assert.equal(r.status, 401);
  });
};
