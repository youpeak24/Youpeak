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

function gatewayConfig(gateway) {
  const s = global.settingJSON || {};
  const g = activeGateway(gateway);
  if (g === "razorpay") {
    return {
      gateway: "razorpay",
      keyId: process.env.RAZORPAY_KEY_ID || s.razorPayId || "",
      keySecret: process.env.RAZORPAY_KEY_SECRET || s.razorSecretKey || "",
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || s.razorpayWebhookSecret || "",
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
      notes: (entity && entity.notes) || {},
      raw: body,
    };
  }

  return { valid: false, reason: "unsupported_gateway" };
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

module.exports = { activeGateway, gatewayConfig, isConfigured, createOrder, verifyCallbackSignature, parseWebhook };
