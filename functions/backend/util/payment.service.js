/**
 * Gateway-agnostic payment layer.
 *
 * Adapters implement: createOrder, verifyCallbackSignature, parseWebhook.
 * Razorpay ships built-in; Cashfree / PhonePe are stubs to fill in later.
 *
 * Credentials resolve env-first, then the admin settings doc:
 *   RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET
 *   (settings: razorPayId / razorSecretKey / razorpayWebhookSecret)
 */
"use strict";

const crypto = require("crypto");

function activeGateway(explicit) {
  const s = global.settingJSON || {};
  return (explicit || s.paymentGateway || "razorpay").toLowerCase();
}

// Credentials pasted into a dashboard (Vercel env, admin panel) very often carry
// a trailing space / newline / quotes, which Razorpay rejects as "Authentication
// failed" — and a stray newline silently breaks the webhook HMAC. Clean them.
const clean = (v) => String(v == null ? "" : v).trim().replace(/^["']+|["']+$/g, "").trim();

function gatewayConfig(gateway) {
  const s = global.settingJSON || {};
  const g = activeGateway(gateway);
  if (g === "razorpay") {
    return {
      gateway: "razorpay",
      keyId: clean(process.env.RAZORPAY_KEY_ID || s.razorPayId),
      keySecret: clean(process.env.RAZORPAY_KEY_SECRET || s.razorSecretKey),
      webhookSecret: clean(process.env.RAZORPAY_WEBHOOK_SECRET || s.razorpayWebhookSecret),
    };
  }
  if (g === "cashfree") {
    return {
      gateway: "cashfree",
      appId: process.env.CASHFREE_APP_ID || s.cashfreeClientId || "",
      secretKey: process.env.CASHFREE_SECRET_KEY || s.cashfreeClientSecret || "",
      webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET || s.cashfreeWebhookSecret || "",
      env: process.env.CASHFREE_ENV || s.cashfreeEnv || "PROD",
    };
  }
  return { gateway: g };
}

function isConfigured(gateway) {
  const c = gatewayConfig(gateway);
  if (c.gateway === "razorpay") return Boolean(c.keyId && c.keySecret);
  if (c.gateway === "cashfree") return Boolean(c.appId && c.secretKey);
  return false;
}

// ── Create an order at the gateway ─────────────────────────────────────────
async function createOrder({ gateway, amountInr, currency = "INR", receipt, notes }) {
  const c = gatewayConfig(gateway);
  const amountPaise = Math.round(Number(amountInr) * 100);
  if (!(amountPaise > 0)) throw new Error("Invalid amount");

  if (c.gateway === "razorpay") {
    if (!c.keyId || !c.keySecret) throw new Error("Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).");
    const Razorpay = require("razorpay");
    const rp = new Razorpay({ key_id: c.keyId, key_secret: c.keySecret });
    const order = await rp.orders.create({
      amount: amountPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    });
    return {
      gateway: "razorpay",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: c.keyId,
      checkout: { key: c.keyId, order_id: order.id, amount: order.amount, currency: order.currency },
    };
  }

  throw new Error(`Payment gateway "${c.gateway}" is not implemented yet.`);
}

// ── Verify a client-side payment callback ──────────────────────────────────
// Razorpay: HMAC_SHA256(order_id + "|" + payment_id, key_secret) === signature
function verifyCallbackSignature({ gateway, orderId, paymentId, signature }) {
  const c = gatewayConfig(gateway);
  if (c.gateway === "razorpay") {
    if (!c.keySecret || !orderId || !paymentId || !signature) return false;
    const expected = crypto.createHmac("sha256", c.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
    return safeEqual(expected, signature);
  }
  return false;
}

// ── Verify + normalise a server-to-server webhook ──────────────────────────
function parseWebhook({ gateway, rawBody, headers }) {
  const c = gatewayConfig(gateway);
  const raw = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody || "");

  if (c.gateway === "razorpay") {
    const sig = headers["x-razorpay-signature"] || headers["X-Razorpay-Signature"];
    if (!c.webhookSecret) return { valid: false, reason: "no_webhook_secret" };
    const expected = crypto.createHmac("sha256", c.webhookSecret).update(raw).digest("hex");
    if (!safeEqual(expected, sig || "")) return { valid: false, reason: "bad_signature" };

    let body;
    try { body = JSON.parse(raw); } catch (e) { return { valid: false, reason: "bad_json" }; }
    const event = body.event || "";
    const entity = body.payload && (body.payload.payment ? body.payload.payment.entity : (body.payload.order ? body.payload.order.entity : null));
    const paid = event === "payment.captured" || event === "order.paid";
    return {
      valid: true,
      paid,
      event,
      orderId: entity && (entity.order_id || entity.id),
      paymentId: entity && entity.id,
      amountInr: entity && entity.amount ? entity.amount / 100 : null,
      amountPaise: entity && Number.isFinite(Number(entity.amount)) ? Number(entity.amount) : null,
      currency: entity && entity.currency ? String(entity.currency).toUpperCase() : null,
      notes: (entity && entity.notes) || {},
      raw: body,
    };
  }

  return { valid: false, reason: "unsupported_gateway" };
}

// ── Admin diagnostics ───────────────────────────────────────────────────────
// Never returns a secret: only whether it is set, where it came from, and the
// key id with its middle masked.
function describeConfig(gateway) {
  const s = global.settingJSON || {};
  const c = gatewayConfig(gateway);
  if (c.gateway !== "razorpay") return { gateway: c.gateway, configured: isConfigured(c.gateway) };
  const mask = (id) => (id.length > 12 ? `${id.slice(0, 9)}…${id.slice(-4)}` : id ? "…" : "");
  const mode = /^rzp_test_/.test(c.keyId) ? "test" : /^rzp_live_/.test(c.keyId) ? "live" : c.keyId ? "unknown" : null;
  const where = (envVal, setVal) => (clean(envVal) ? "environment" : clean(setVal) ? "admin settings" : null);
  return {
    gateway: "razorpay",
    configured: isConfigured("razorpay"),
    mode,
    keyId: mask(c.keyId),
    keyIdSource: where(process.env.RAZORPAY_KEY_ID, s.razorPayId),
    keySecretSet: Boolean(c.keySecret),
    keySecretSource: where(process.env.RAZORPAY_KEY_SECRET, s.razorSecretKey),
    webhookSecretSet: Boolean(c.webhookSecret),
    webhookSecretSource: where(process.env.RAZORPAY_WEBHOOK_SECRET, s.razorpayWebhookSecret),
    // The checkout key id and the server secret must be the same account + mode.
    keyIdLooksValid: /^rzp_(test|live)_[A-Za-z0-9]{8,}$/.test(c.keyId),
  };
}

// A read-only call (lists 1 order) that proves the key id + secret authenticate.
async function testConnection(gateway) {
  const c = gatewayConfig(gateway);
  if (c.gateway !== "razorpay") return { ok: false, message: `Connection test is only available for Razorpay (active: ${c.gateway}).` };
  if (!c.keyId || !c.keySecret) return { ok: false, message: "Razorpay key id / secret are not set." };
  try {
    const Razorpay = require("razorpay");
    await new Razorpay({ key_id: c.keyId, key_secret: c.keySecret }).orders.all({ count: 1 });
    return { ok: true, message: "Razorpay accepted the credentials.", mode: describeConfig("razorpay").mode };
  } catch (e) {
    const err = (e && e.error) || {};
    const status = e && e.statusCode;
    const reason = status === 401 ? "Razorpay rejected the key id / secret (Authentication failed). Check they are from the same account and the same Test/Live mode."
      : err.description || e.message || "Could not reach Razorpay.";
    return { ok: false, message: reason, statusCode: status || null };
  }
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

module.exports = { activeGateway, gatewayConfig, isConfigured, createOrder, verifyCallbackSignature, parseWebhook, describeConfig, testConnection };
