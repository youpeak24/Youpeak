// Razorpay configuration from the admin panel.
//
// Verifies:
//   1. Credentials pasted with whitespace / quotes / newlines are cleaned before use
//   2. /admin/payment/gatewayStatus reports state but never a secret
//   3. Saving settings keeps the Razorpay secrets write-only (never returned, never wiped by a blank field)
//   4. Franchise / Digital Partner logins cannot reach the payment or settings endpoints
"use strict";

const jwt = require("jsonwebtoken");

module.exports = async (h, check, assert) => {
  const { call, set } = h;
  const payment = h.req("util/payment.service");

  const mkAdmin = async (id, extra) => {
    await set("admins", id, { email: `${id}@test.local`, isActive: true, isBlock: false, ...extra });
    return jwt.sign({ _id: id }, process.env.JWT_SECRET);
  };
  const superToken = await mkAdmin("rp_super", { role: "SUPER_ADMIN" });
  const agencyToken = await mkAdmin("rp_agency", { role: "AGENCY_ADMIN", agencyId: "no_such_agency" });
  const adminCall = (method, p, token, body) => call(method, p, { body, headers: { authorization: token } });

  await check("RPA-01", "credentials with stray whitespace, newline or quotes are cleaned", async () => {
    const saved = { id: process.env.RAZORPAY_KEY_ID, secret: process.env.RAZORPAY_KEY_SECRET, hook: process.env.RAZORPAY_WEBHOOK_SECRET };
    try {
      process.env.RAZORPAY_KEY_ID = ' "rzp_test_ABCDEFGH12345"\n';
      process.env.RAZORPAY_KEY_SECRET = "  s3cret-value \r\n";
      process.env.RAZORPAY_WEBHOOK_SECRET = "'hook-secret'\n";
      const c = payment.gatewayConfig("razorpay");
      assert.equal(c.keyId, "rzp_test_ABCDEFGH12345");
      assert.equal(c.keySecret, "s3cret-value");
      assert.equal(c.webhookSecret, "hook-secret");
      assert.equal(payment.describeConfig("razorpay").mode, "test");
    } finally {
      process.env.RAZORPAY_KEY_ID = saved.id; process.env.RAZORPAY_KEY_SECRET = saved.secret; process.env.RAZORPAY_WEBHOOK_SECRET = saved.hook;
    }
  });

  await check("RPA-02", "gatewayStatus reports configuration but never leaks a secret", async () => {
    const r = await adminCall("GET", "/admin/payment/gatewayStatus?gateway=razorpay", superToken);
    assert.equal(r.status, 200);
    assert.equal(r.json.status, true);
    assert.equal(r.json.gateway.configured, true);
    assert.equal(r.json.gateway.keySecretSet, true);
    assert.equal(r.json.gateway.webhookSecretSet, true);
    const text = JSON.stringify(r.json);
    assert.ok(!text.includes(process.env.RAZORPAY_KEY_SECRET), "key secret leaked");
    assert.ok(!text.includes(process.env.RAZORPAY_WEBHOOK_SECRET), "webhook secret leaked");
  });

  await check("RPA-03", "testGateway fails clearly (no crash) when the gateway rejects the key", async () => {
    // rzp_test_dummy / test-razorpay-secret are not real credentials. Whether the
    // sandbox has network access or not, the answer must be a clean ok:false.
    const r = await adminCall("POST", "/admin/payment/testGateway", superToken, { gateway: "razorpay" });
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, false);
    assert.ok(typeof r.json.message === "string" && r.json.message.length > 0);
  });

  await check("RPA-04", "admin settings: secrets are write-only, blank never wipes, ids are trimmed", async () => {
    const save = await adminCall("PATCH", "/admin/setting/update", superToken, {
      razorPayId: "  rzp_test_SavedKey123456  ", razorSecretKey: "  saved-secret  ", razorpayWebhookSecret: "hook-1", razorpayWebEnabled: true,
    });
    assert.equal(save.json.status, true);
    assert.equal(save.json.setting.razorSecretKey, undefined);
    assert.equal(save.json.setting.razorSecretKeySet, true);
    assert.equal(save.json.setting.razorpayWebhookSecretSet, true);

    const stored = await h.db.findOne("settings", {});
    assert.equal(stored.razorPayId, "rzp_test_SavedKey123456");
    assert.equal(stored.razorSecretKey, "saved-secret");

    // A later save that leaves the secret fields blank / masked must not wipe them.
    const again = await adminCall("PATCH", "/admin/setting/update", superToken, { razorSecretKey: "", razorpayWebhookSecret: "••••••", razorPaySwitch: true });
    assert.equal(again.json.status, true);
    const after = await h.db.findOne("settings", {});
    assert.equal(after.razorSecretKey, "saved-secret");
    assert.equal(after.razorpayWebhookSecret, "hook-1");
    assert.equal(after.razorPaySwitch, true);

    const read = await adminCall("GET", "/admin/setting", superToken);
    assert.equal(read.json.setting.razorSecretKey, undefined);
    assert.equal(read.json.setting.razorpayWebhookSecret, undefined);
    assert.equal(read.json.setting.razorSecretKeySet, true);
    assert.ok(!JSON.stringify(read.json).includes("saved-secret"));
  });

  await check("RPA-05", "app-facing /client/setting never exposes the secrets either", async () => {
    const r = await call("GET", "/client/setting");
    const text = JSON.stringify(r.json);
    assert.ok(!text.includes("saved-secret"));
    assert.ok(!text.includes("hook-1"));
  });

  await check("RPA-06", "franchise logins are refused on payment and settings endpoints", async () => {
    const a = await adminCall("GET", "/admin/payment/gatewayStatus", agencyToken);
    const b = await adminCall("POST", "/admin/payment/testGateway", agencyToken, {});
    const c = await adminCall("PATCH", "/admin/setting/update", agencyToken, { razorSecretKey: "x" });
    for (const r of [a, b, c]) assert.ok(r.status === 403, `expected 403, got ${r.status}`);
  });
};
