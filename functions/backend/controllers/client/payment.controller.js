/**
 * Payment flow (gateway-agnostic; Razorpay built-in).
 *
 *   POST /client/payment/createOrder   { userId, purpose, tierId?, billingPeriod?, coinPlanId?, premiumPlanId? }
 *        billingPeriod ("quarterly" | "annual") picks the Creator VIP Pass length; default annual
 *        -> creates a gateway order + a `created` PaymentTransaction
 *   POST /client/payment/verify        { userId, orderId, paymentId, signature }
 *        -> verifies the client callback, marks paid, fulfils
 *   POST /payment/webhook/:gateway     (server-to-server, raw body)
 *        -> verifies webhook signature, marks paid, fulfils (idempotent)
 *   GET  /client/payment/status?orderId=…
 *
 * Purposes: joining_fee | tier_upgrade | coin_plan | premium_plan | video_promotion
 */
"use strict";

const db = require("../../util/connection");
const promotion = require("../../util/promotion.service");
const payment = require("../../util/payment.service");
const referralService = require("../../util/referral.service");
const revenueSplit = require("../../util/revenueSplit.service");
const { planAgencyCommission } = require("../../util/revenueCommission.service");
const firebaseAdmin = require("../../util/firebaseAdmin");
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");
const creatorFunding = require("../../util/creatorFunding.service");
const { grantDigitalPartnerLicense } = require("../../util/digitalPartner.service");
const creatorPass = require("../../util/creatorPass");
const adCreditWallet = require("../../util/adCreditWallet.service");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// Resolve how much a given purpose costs, and stash target ids on the txn.
async function resolveAmount({ purpose, user, userId, tierId, billingPeriod, coinPlanId, premiumPlanId, campaignId, videoId, planId, planName, packId, amountInr: requestedAmountInr }) {
  const s = global.settingJSON || {};
  if (purpose === "joining_fee") {
    const amt = num(s.joiningFeeINR, 0);
    if (amt <= 0) return { error: "Joining fee is not enabled." };
    return { amountInr: amt };
  }
  if (purpose === "tier_upgrade") {
    if (!tierId) return { error: "tierId is required." };
    const tier = await db.findById("membershipTiers", tierId);
    if (!tier || tier.isActive === false) return { error: "Invalid tier." };
    // Creator VIP passes: subscriber gate + 3-month / annual / intro pricing.
    // The gate matters here, not just at upgradeTier: fulfilTierUpgrade
    // assigns the pass on payment, and higher passes cost less.
    if (tier.tierType === "CREATOR") return creatorPass.resolveCheckout({ tier, user, billingPeriod });
    if (num(tier.membershipPrice, 0) <= 0) return { error: "This tier is free — no payment needed." };
    // F-14: buying a Tasker pass at or below the current level used to downgrade
    // the buyer. Tasker passes do not expire, so the current level is never stale.
    if (tier.tierType === "TASKER") {
      const cur = user && user.membershipTierId ? await db.findById("membershipTiers", user.membershipTierId) : null;
      const curLevel = cur && cur.tierType === "TASKER" ? num(cur.level, 1) : 1;
      if (num(tier.level, 1) <= curLevel) return { error: "You already have this level or a higher one." };
    }
    return { amountInr: num(tier.membershipPrice), tier };
  }
  if (purpose === "coin_plan") {
    if (!coinPlanId) return { error: "coinPlanId is required." };
    const plan = await db.findById("CoinPlan", coinPlanId);
    if (!plan || plan.isActive === false) return { error: "Invalid coin plan." };
    return { amountInr: num(plan.amount), coinPlan: plan };
  }
  if (purpose === "premium_plan") {
    if (!premiumPlanId) return { error: "premiumPlanId is required." };
    const plan = await db.findById("PremiumPlan", premiumPlanId);
    if (!plan || plan.isActive === false) return { error: "Invalid premium plan." };
    return { amountInr: num(plan.amount), premiumPlan: plan };
  }
  if (purpose === "digital_partner_license") {
    const amt = num(s.digitalPartnerLicenseFeeINR, 25000);
    if (amt <= 0) return { error: "Digital Partner Program is not enabled." };
    return { amountInr: amt };
  }
  if (purpose === "campaign_backing") {
    if (!s.creatorFundingEnabled) return { error: "Creator Funding is not enabled." };
    if (!campaignId) return { error: "campaignId is required." };
    const amt = num(requestedAmountInr, 0);
    if (amt < 10) return { error: "Minimum backing amount is ₹10." };
    const campaign = await db.findById("creatorFundingCampaigns", campaignId);
    if (!campaign || campaign.status !== "ACTIVE") return { error: "This campaign isn't accepting support right now." };
    if (campaign.deadlineAt && Date.now() > new Date(campaign.deadlineAt).getTime()) {
      return { error: "This campaign's deadline has passed." };
    }
    return { amountInr: amt, campaign };
  }
  if (purpose === "video_promotion") {
    // Stable plan id (planName still accepted from older app versions).
    if (!videoId || (!planId && !planName)) return { error: "videoId and planId are required." };
    const plan = promotion.findPlan({ planId, planName });
    if (!plan || !plan.isActive) return { error: "This promotion plan isn't available." };
    if (!(plan.priceINR > 0)) return { error: "This promotion plan has no price set." };
    const video = await db.findById("videos", videoId);
    const why = await promotion.ineligibility(video, userId);
    if (why) return { error: why };
    // Snapshot the terms bought, so a later rate-card edit can't change an
    // order that's already been paid for.
    const snap = promotion.snapshot(plan);
    return { amountInr: snap.priceINR, plan, txnExtra: { planId: snap.id, planName: snap.name, promotionPlan: snap } };
  }
  if (purpose === "ad_credits") {
    if (!packId) return { error: "packId is required." };
    const pack = adCreditWallet.findPack(packId);
    if (!pack || !pack.isActive) return { error: "This ad credit pack isn't available." };
    if (!(pack.priceINR > 0)) return { error: "This ad credit pack has no price set." };
    const snap = adCreditWallet.snapshotPack(pack);
    if (requestedAmountInr != null && Number(requestedAmountInr) !== Number(snap.priceINR)) {
      return { error: "Price mismatch: client price does not match catalog price." };
    }
    return {
      amountInr: snap.priceINR,
      pack,
      txnExtra: {
        packId: snap.id,
        packName: snap.name,
        adCreditPack: snap,
      },
    };
  }
  return { error: "Unknown purpose." };
}

exports.createOrder = async (req, res) => {
  try {
    const b = { ...req.query, ...req.body };
    const userId = b.userId;
    const purpose = b.purpose;
    if (!userId || !purpose) return res.status(200).json({ status: false, message: "userId and purpose are required." });

    const user = await db.findById("users", userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found." });
    if (user.isBlock) return res.status(200).json({ status: false, message: "You are blocked by the admin." });

    const resolved = await resolveAmount({
      purpose, user, userId, tierId: b.tierId, billingPeriod: b.billingPeriod, coinPlanId: b.coinPlanId, premiumPlanId: b.premiumPlanId,
      campaignId: b.campaignId, videoId: b.videoId, planId: b.planId, planName: b.planName, packId: b.packId, amountInr: b.amountInr,
    });
    if (resolved.error) return res.status(200).json({ status: false, message: resolved.error });

    // A double tap / retry for the same promotion reuses the still-unpaid
    // order from the last 15 minutes instead of creating a second one.
    if (purpose === "video_promotion") {
      const recent = (await db.find("paymentTransactions", { userId: String(userId), purpose, videoId: String(b.videoId) }))
        .find((t) => t.status === "created" && t.planId === resolved.txnExtra.planId && Number(t.amountInr) === Number(resolved.amountInr) &&
          Date.now() - Date.parse(t.createdAt || 0) < 15 * 60 * 1000 && t.checkoutKey);
      if (recent) {
        return res.status(200).json({
          status: true, message: "Order created.", reused: true,
          transactionId: recent._id || recent.id, orderId: recent.orderId, gateway: recent.gateway, amountInr: recent.amountInr,
          checkout: { key: recent.checkoutKey, order_id: recent.orderId, amount: Math.round(Number(recent.amountInr) * 100), currency: recent.currency || "INR" },
        });
      }
    }

    // A double tap / retry for the same ad credits top-up reuses the still-unpaid
    // order from the last 15 minutes instead of creating a second one.
    if (purpose === "ad_credits") {
      const recent = (await db.find("paymentTransactions", { userId: String(userId), purpose }))
        .find((t) => t.status === "created" && String(t.packId) === String(resolved.txnExtra.packId) && Number(t.amountInr) === Number(resolved.amountInr) &&
          Date.now() - Date.parse(t.createdAt || 0) < 15 * 60 * 1000 && t.checkoutKey);
      if (recent) {
        return res.status(200).json({
          status: true, message: "Order created.", reused: true,
          transactionId: recent._id || recent.id, orderId: recent.orderId, gateway: recent.gateway, amountInr: recent.amountInr,
          checkout: { key: recent.checkoutKey, order_id: recent.orderId, amount: Math.round(Number(recent.amountInr) * 100), currency: recent.currency || "INR" },
        });
      }
    }

    if (!payment.isConfigured(b.gateway)) {
      return res.status(200).json({ status: false, message: "Payment gateway is not configured." });
    }

    const receipt = `${purpose}_${userId}_${Date.now()}`.slice(0, 40);
    const order = await payment.createOrder({
      gateway: b.gateway,
      amountInr: resolved.amountInr,
      receipt,
      notes: { userId: String(userId), purpose },
    });

    const txn = await db.create("paymentTransactions", {
      _id: `ptxn_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      userId: String(userId),
      gateway: order.gateway,
      purpose,
      amountInr: resolved.amountInr,
      currency: order.currency || "INR",
      orderId: order.orderId,
      receipt,
      tierId: b.tierId || null,
      coinPlanId: b.coinPlanId || null,
      premiumPlanId: b.premiumPlanId || null,
      campaignId: b.campaignId || null,
      videoId: b.videoId || null,
      planName: b.planName || null,
      checkoutKey: order.checkout && order.checkout.key ? order.checkout.key : null, // public key id (not a secret)
      ...(resolved.txnExtra || {}),
      status: "created",
      fulfilled: false,
      meta: { email: user.email || "", mobileNumber: user.mobileNumber || "" },
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({
      status: true,
      message: "Order created.",
      transactionId: txn._id || txn.id,
      orderId: order.orderId,
      gateway: order.gateway,
      amountInr: resolved.amountInr,
      checkout: order.checkout,
    });
  } catch (error) {
    console.error("createOrder error:", error);
    return res.status(200).json({ status: false, message: error.message || "Order creation failed." });
  }
};

exports.verify = async (req, res) => {
  try {
    const b = { ...req.query, ...req.body };
    const { orderId, paymentId, signature } = b;
    if (!orderId || !paymentId || !signature) {
      return res.status(200).json({ status: false, message: "orderId, paymentId and signature are required." });
    }

    const txn = await db.findOne("paymentTransactions", { orderId });
    if (!txn) return res.status(200).json({ status: false, message: "Transaction not found." });

    const ok = payment.verifyCallbackSignature({ gateway: txn.gateway, orderId, paymentId, signature });
    if (!ok) {
      // Don't overwrite the order's state: anyone can call this with a wrong
      // signature for someone else's order id. The webhook stays authoritative.
      await db.update("paymentTransactions", txn._id || txn.id, { lastSignatureFailureAt: new Date().toISOString() }).catch(() => {});
      return res.status(200).json({ status: false, message: "Payment signature verification failed." });
    }

    const result = await markPaidAndFulfil(txn, { paymentId, verifiedVia: "callback" });
    const done = result.fulfilmentStatus === FULFILMENT.COMPLETED;
    return res.status(200).json({
      status: done,
      code: done ? undefined : result.fulfilmentStatus,
      message: done ? "Payment verified." : "Payment received — we're finishing your purchase. Please check again shortly.",
      purpose: txn.purpose,
      fulfilmentStatus: result.fulfilmentStatus,
      fulfilment: result.fulfilment || null,
    });
  } catch (error) {
    console.error("verify error:", error);
    return res.status(200).json({ status: false, message: error.message || "Verification failed." });
  }
};

exports.webhook = async (req, res) => {
  try {
    const gateway = req.params.gateway || payment.activeGateway();
    const parsed = payment.parseWebhook({
      gateway,
      rawBody: Buffer.isBuffer(req.body) ? req.body : (req.rawBody || JSON.stringify(req.body || {})),
      headers: req.headers,
    });

    if (!parsed.valid) {
      console.warn("payment webhook rejected:", parsed.reason);
      return res.status(400).json({ status: false, message: parsed.reason });
    }
    // Acknowledge only after persistence. Vercel can stop execution once the
    // response ends; an early 200 could lose a captured payment forever.
    if (!parsed.paid || !parsed.orderId) return res.status(200).json({ status: true });
    const txn = await db.findOne("paymentTransactions", { orderId: parsed.orderId });
    if (!txn) return res.status(503).json({ status: false, message: "Order is not available yet. Retry this event." });
    const result = await markPaidAndFulfil(txn, {
      paymentId: parsed.paymentId,
      verifiedVia: "webhook",
      amountPaise: parsed.amountPaise,
      currency: parsed.currency,
    });
    // Non-2xx makes the gateway redeliver: still processing elsewhere, or an
    // effect failed and a retry will finish only the missing effects.
    if (result.fulfilmentStatus === FULFILMENT.IN_PROGRESS) return res.status(503).json({ status: false, fulfilmentStatus: result.fulfilmentStatus });
    if (result.fulfilmentStatus === FULFILMENT.REQUIRES_RECONCILIATION) return res.status(500).json({ status: false, fulfilmentStatus: result.fulfilmentStatus });
    return res.status(200).json({ status: true, fulfilmentStatus: result.fulfilmentStatus });
  } catch (error) {
    console.error("webhook error:", error);
    if (!res.headersSent) res.status(500).json({ status: false });
  }
};

exports.status = async (req, res) => {
  try {
    const orderId = req.query.orderId || (req.body && req.body.orderId);
    const txn = await db.findOne("paymentTransactions", { orderId });
    if (!txn || (req.appUserId && String(txn.userId) !== String(req.appUserId))) {
      return res.status(200).json({ status: false, message: "Transaction not found." });
    }
    const transaction = { status: txn.status, fulfilled: txn.fulfilled, fulfilmentStatus: fulfilmentStateOf(txn), purpose: txn.purpose, amountInr: txn.amountInr };
    if (txn.purpose === "video_promotion" && txn.fulfilled) transaction.campaignId = `promo_${txn._id || txn.id}`;
    return res.status(200).json({ status: true, transaction });
  } catch (error) {
    return res.status(200).json({ status: false, message: error.message });
  }
};

// ── Fulfilment state machine (Phase 2, F-22) ────────────────────────────────
//
// Gateway state (status: created → paid) and fulfilment state are separate:
//
//   PENDING ──claim──▶ PROCESSING ──all effects done──▶ COMPLETED (terminal)
//                         │  └──an effect failed──▶ REQUIRES_RECONCILIATION ──retry──▶ PROCESSING
//                         └──lease (5 min) expired: next callback / webhook / admin retry reclaims
//   gateway amount/currency ≠ order ──▶ VALIDATION_FAILED (terminal until an admin reviews)
//
// Every purpose-specific effect commits in ONE Firestore transaction together
// with its marker paymentEffects/<txnId>__<effect>. A retry therefore re-runs
// only the effects whose marker is missing — it never double-credits, and an
// effect is never half-applied. Nothing external (gateway, email) is called
// inside a transaction callback. `fulfilled: true` is set only on COMPLETED.
const FULFILMENT = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  REQUIRES_RECONCILIATION: "REQUIRES_RECONCILIATION",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  IN_PROGRESS: "IN_PROGRESS", // returned to a caller that lost the claim to a live lease
};
const PROCESSING_LEASE_MS = 5 * 60 * 1000;

function fulfilmentStateOf(txn) {
  if (txn.fulfilmentStatus) return txn.fulfilmentStatus;
  return txn.fulfilled ? FULFILMENT.COMPLETED : FULFILMENT.PENDING; // documents from before the state machine
}

/** Atomically move the transaction to PROCESSING, or report why not. */
async function claimFulfilment(id, { paymentId, verifiedVia }) {
  const fs = db.getDb();
  const ref = fs.collection("paymentTransactions").doc(String(id));
  return db.withTimeout(fs.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { claimed: false, state: "NOT_FOUND" };
    const t = snap.data();
    const state = fulfilmentStateOf(t);
    if (state === FULFILMENT.COMPLETED || state === FULFILMENT.VALIDATION_FAILED) return { claimed: false, state, txn: t };
    const leaseAt = Date.parse(t.processingAt || "") || 0;
    if (state === FULFILMENT.PROCESSING && Date.now() - leaseAt < PROCESSING_LEASE_MS) return { claimed: false, state: FULFILMENT.IN_PROGRESS, txn: t };
    const now = new Date().toISOString();
    tx.update(ref, {
      fulfilmentStatus: FULFILMENT.PROCESSING,
      processingAt: now,
      fulfilmentAttempts: (Number(t.fulfilmentAttempts) || 0) + 1,
      status: "paid",
      paymentId: t.paymentId || paymentId || null,
      paidAt: t.paidAt || now,
      verifiedVia: t.verifiedVia || verifiedVia,
      updatedAt: now,
    });
    return { claimed: true, txn: { ...t, _id: snap.id, id: snap.id } };
  }));
}

/**
 * Run one effect exactly once: `fn(tx, fs)` must do its reads first (tx.get)
 * and then its writes; its marker is created in the same transaction.
 */
async function effectOnce(txnId, effect, fn) {
  const fs = db.getDb();
  const marker = fs.collection("paymentEffects").doc(`${txnId}__${effect}`);
  return db.withTimeout(fs.runTransaction(async (tx) => {
    const m = await tx.get(marker);
    if (m.exists) return { ...(m.data().result || {}), replayed: true };
    const result = (await fn(tx, fs)) || {};
    tx.create(marker, JSON.parse(JSON.stringify({ _id: marker.id, txnId: String(txnId), effect, result, createdAt: new Date().toISOString() })));
    return result;
  }));
}

const inc = (n) => firebaseAdmin.firestore.FieldValue.increment(n);

// Mark a transaction paid and run the purpose-specific fulfilment. Safe to call
// any number of times, concurrently, from the webhook, the client callback and
// the admin retry.
async function markPaidAndFulfil(txn, { paymentId, verifiedVia, amountPaise = null, currency = null }) {
  const id = String(txn._id || txn.id);

  // The gateway's captured amount/currency must match the order we created.
  if (amountPaise != null || currency) {
    const expected = Math.round(num(txn.amountInr) * 100);
    const expectedCurrency = String(txn.currency || "INR").toUpperCase();
    const mismatch = (amountPaise != null && Math.round(Number(amountPaise)) !== expected) ||
      (currency && String(currency).toUpperCase() !== expectedCurrency);
    if (mismatch && fulfilmentStateOf(txn) !== FULFILMENT.COMPLETED) {
      await db.update("paymentTransactions", id, {
        fulfilmentStatus: FULFILMENT.VALIDATION_FAILED,
        validationError: `Gateway reported ${amountPaise} ${currency || ""} for an order of ${expected} ${expectedCurrency}.`,
        gatewayAmountPaise: amountPaise, gatewayCurrency: currency || null, gatewayPaymentId: paymentId || null,
      });
      return { fulfilmentStatus: FULFILMENT.VALIDATION_FAILED };
    }
  }

  const claim = await claimFulfilment(id, { paymentId, verifiedVia });
  if (!claim.claimed) {
    return { fulfilmentStatus: claim.state, alreadyFulfilled: claim.state === FULFILMENT.COMPLETED, fulfilment: claim.txn?.fulfilment || null };
  }
  const freshTxn = claim.txn;

  const fulfillers = {
    joining_fee: fulfilJoiningFee,
    tier_upgrade: fulfilTierUpgrade,
    coin_plan: fulfilCoinPlan,
    premium_plan: fulfilPremiumPlan,
    digital_partner_license: fulfilDigitalPartnerLicense,
    campaign_backing: fulfilCampaignBacking,
    video_promotion: fulfilVideoPromotion,
    ad_credits: fulfilAdCreditsTopup,
  };
  const run = fulfillers[freshTxn.purpose];
  try {
    if (!run) throw new Error(`Unknown purpose "${freshTxn.purpose}".`);
    const fulfilment = await run(freshTxn);
    await db.update("paymentTransactions", id, {
      fulfilmentStatus: FULFILMENT.COMPLETED,
      fulfilled: true,
      fulfilledAt: new Date().toISOString(),
      fulfilment: JSON.parse(JSON.stringify(fulfilment || {})),
      fulfilmentError: null,
    });
    return { fulfilmentStatus: FULFILMENT.COMPLETED, fulfilment };
  } catch (e) {
    console.error(`fulfilment failed for ${id} (${freshTxn.purpose}):`, e.message);
    await db.update("paymentTransactions", id, {
      fulfilmentStatus: FULFILMENT.REQUIRES_RECONCILIATION,
      fulfilmentError: String(e.message || e).slice(0, 500),
      lastFailedAt: new Date().toISOString(),
    }).catch(() => {});
    return { fulfilmentStatus: FULFILMENT.REQUIRES_RECONCILIATION, error: e.message };
  }
}

async function fulfilJoiningFee(txn) {
  return effectOnce(txn._id || txn.id, "joining_fee", (tx, fs) => {
    tx.set(fs.collection("users").doc(String(txn.userId)), {
      paymentStatus: true,
      payment_status: true,
      paymentVerifiedAt: new Date().toISOString(),
      paymentGatewayRef: txn.paymentId || txn.orderId,
    }, { merge: true });
    return { paymentStatus: true };
  });
}

// Digital Partner Program — Module A (Partner Upgrade & Payment Flow).
// Does NOT touch the Peak Partner referral engine (referral.service.js) —
// that stays open to every user. This only unlocks the partner dashboard /
// ad-credits wallet. grantDigitalPartnerLicense is idempotent per effectKey
// (activation, credits and franchise commission in one transaction); the web
// portal login it provisions afterwards is created once and reused.
async function fulfilDigitalPartnerLicense(txn) {
  const { isDigitalPartner, adCreditsBalance, portalCredentials } = await grantDigitalPartnerLicense({
    userId: txn.userId,
    amountInr: txn.amountInr,
    paymentTransactionId: txn._id || txn.id,
    effectKey: `dpl_${txn._id || txn.id}`,
  });
  return { isDigitalPartner, adCreditsBalance, portalCredentials };
}

// Creator Funding — a verified backing. Records the backing and bumps the
// campaign's raised total in one transaction; if the campaign closed between
// order-creation and this payment landing (deadline passed mid-checkout, or
// the creator cancelled it), the backer is refunded as coins instead.
async function fulfilCampaignBacking(txn) {
  const txnId = String(txn._id || txn.id);
  const amountInr = num(txn.amountInr);
  const result = await effectOnce(txnId, "campaign_backing", async (tx, fs) => {
    const campaignRef = fs.collection(db.normalizeCollectionName("creatorFundingCampaigns")).doc(String(txn.campaignId));
    const snap = await tx.get(campaignRef);
    if (!snap.exists) throw new Error("campaign missing");
    const campaign = snap.data();
    const now = new Date().toISOString();
    const backingRef = fs.collection(db.normalizeCollectionName("campaignBackings")).doc(`backing_${txnId}`);
    if (campaign.status !== "ACTIVE") {
      const rate = num((global.settingJSON || {}).coinToInrRate, 0.01);
      const refundCoins = Math.round(amountInr / rate);
      tx.set(fs.collection("users").doc(String(txn.userId)), { coin: inc(refundCoins), updatedAt: now }, { merge: true });
      tx.create(backingRef, { _id: backingRef.id, campaignId: txn.campaignId, backerId: txn.userId, amountInr, paymentTransactionId: txnId, status: "REFUNDED", refundedAt: now, refundCoins, createdAt: now });
      return { refunded: true, reason: "Campaign was no longer active.", refundCoins };
    }
    const perk = (campaign.perks || [])
      .filter((p) => num(p.minAmountInr) <= amountInr)
      .sort((a, b) => num(b.minAmountInr) - num(a.minAmountInr))[0];
    tx.create(backingRef, { _id: backingRef.id, campaignId: txn.campaignId, backerId: txn.userId, amountInr, paymentTransactionId: txnId, perkUnlocked: perk?.title || "", status: "ACTIVE", createdAt: now });
    const raisedAmountInr = Number((num(campaign.raisedAmountInr) + amountInr).toFixed(2));
    tx.update(campaignRef, { raisedAmountInr: inc(amountInr), backerCount: inc(1), updatedAt: now });
    return { campaignId: txn.campaignId, perkUnlocked: perk?.title || null, raisedAmountInr, goalAmountInr: num(campaign.goalAmountInr) };
  });
  // Resolution is itself claim-guarded (creatorFunding.service resolveCampaignSuccess).
  let goalReached = false;
  if (!result.refunded && result.raisedAmountInr >= result.goalAmountInr && result.goalAmountInr > 0) {
    goalReached = !!(await creatorFunding.resolveCampaignSuccess(txn.campaignId));
  }
  return { ...result, goalReached };
}

// DOC-20260826-WA0214 — activates immediately on verified payment, same as
// every other purchase in this file. The admin panel's approve/reject
// (controllers/admin/videoPromotion.controller.js) is a separate, post-hoc
// moderation tool.
async function fulfilVideoPromotion(txn) {
  const txnId = String(txn._id || txn.id);
  // The terms bought (snapshot on the order). Orders placed before snapshots
  // existed fall back to the current catalogue entry with that name.
  const plan = txn.promotionPlan || (() => { const p = promotion.findPlan({ planId: txn.planId, planName: txn.planName }); return p && promotion.snapshot(p); })();
  if (!plan) throw new Error("Invalid plan on transaction.");
  // If this video is already being promoted (e.g. two orders paid in two
  // tabs), the new campaign starts when the last one ends — the buyer gets
  // the full duration they paid for, never an overlap. The per-video lock doc
  // (read inside the transaction) serialises payments verified at the same
  // moment; `running` covers campaigns created before the lock existed.
  const running = await promotion.activeCampaignFor(String(txn.videoId));
  return effectOnce(txnId, "video_promotion", async (tx, fs) => {
    const videoRef = fs.collection("videos").doc(String(txn.videoId));
    const lockRef = fs.collection("promotionVideoLocks").doc(String(txn.videoId));
    const [video, lock] = await Promise.all([tx.get(videoRef), tx.get(lockRef)]);
    if (!video.exists) throw new Error("video missing");
    const now = new Date();
    let queueEnd = running ? Date.parse(running.expiresAt) || 0 : 0;
    if (lock.exists && lock.data().campaignId) {
      // The last campaign queued on this video, as it stands now (an admin
      // may have taken it down or extended it after a pause).
      const last = await tx.get(fs.collection(db.normalizeCollectionName("videoPromotions")).doc(String(lock.data().campaignId)));
      const st = last.exists ? promotion.effectiveStatus(last.data(), now.getTime()) : "";
      if (st === "active" || st === "scheduled") queueEnd = Math.max(queueEnd, Date.parse(last.data().expiresAt) || 0);
    }
    const startedAt = queueEnd > now.getTime() ? new Date(queueEnd) : now;
    const expiresAt = new Date(startedAt.getTime() + num(plan.durationDays, 1) * 86400000);
    const promoRef = fs.collection(db.normalizeCollectionName("videoPromotions")).doc(`promo_${txnId}`);
    tx.create(promoRef, {
      _id: promoRef.id, id: promoRef.id, userId: String(txn.userId), videoId: String(txn.videoId),
      planId: plan.id || null, planName: plan.name || txn.planName, planSnapshot: plan,
      planPriceINR: num(plan.priceINR), planDurationDays: num(plan.durationDays),
      impressionsTargetMin: plan.impressionsMin ?? null, impressionsTargetMax: plan.impressionsMax ?? null,
      impressionsDelivered: 0,
      paymentGatewayRef: txnId, paymentStatus: "paid", status: "active", approvedByAdmin: false,
      startedAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(), updatedAt: now.toISOString(),
    });
    const e = promotion.eventDoc(promoRef.id, startedAt > now ? "scheduled_after_running_campaign" : "activated", "payment", { txnId });
    tx.create(fs.collection(promotion.EVENTS).doc(e.id), e.data);
    tx.update(videoRef, { isPromoted: true, updatedAt: now.toISOString() });
    tx.set(lockRef, { videoId: String(txn.videoId), campaignId: promoRef.id, endsAt: expiresAt.toISOString(), updatedAt: now.toISOString() });
    return { campaignId: promoRef.id, planId: plan.id || null, planName: plan.name, startedAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString() };
  });
}

async function fulfilAdCreditsTopup(txn) {
  const txnId = String(txn._id || txn.id);
  const pack = txn.adCreditPack || (txn.packId ? adCreditWallet.findPack(txn.packId) : null);
  if (!pack) throw new Error("adCreditPack snapshot or packId missing on transaction");

  return effectOnce(txnId, "ad_credits_topup", async (tx, fs) => {
    const res = await adCreditWallet.grantCredits({
      userId: txn.userId,
      amount: pack.baseCredits,
      bonus: pack.bonusCredits || 0,
      source: "TOPUP",
      type: "BASE",
      validityDays: pack.validityDays || 730,
      paymentTransactionId: txnId,
      packId: pack.id,
      ref: {
        priceINR: txn.amountInr,
        packName: pack.name,
      },
      tx,
      fs,
    });
    return {
      credits: res.creditsGranted,
      baseCredits: res.baseCredits,
      bonusCredits: res.bonusCredits,
      balanceAfter: res.balanceAfter,
      packId: pack.id,
      lots: res.lots ? res.lots.map((l) => l.id) : [],
    };
  });
}

async function fulfilTierUpgrade(txn) {
  const txnId = String(txn._id || txn.id);
  const tier = await db.findById("membershipTiers", txn.tierId);
  if (!tier) throw new Error("tier missing");
  const isCreator = tier.tierType === "CREATOR";
  const isTasker = tier.tierType === "TASKER";
  const tierId = String(tier._id || tier.id);

  // 1. Membership: the pass is assigned once. A Tasker level is never lowered
  //    (F-14 — orders for a lower/equal level are refused at checkout).
  const assigned = await effectOnce(txnId, "assign_tier", async (tx, fs) => {
    const userRef = fs.collection("users").doc(String(txn.userId));
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error("buyer missing");
    const buyer = snap.data();
    const now = new Date().toISOString();
    if (isCreator) {
      // Timed VIP pass: 3 months or a year, renewals stack on the current
      // expiry. Legacy one-time passes (billingPeriod "lifetime" or none) never expire.
      const expiresAt = creatorPass.nextExpiry(buyer, tier, txn.billingPeriod);
      tx.set(userRef, { activeCreatorTierId: tierId, isMonetization: true, creatorPassExpiresAt: expiresAt, creatorPassBillingPeriod: txn.billingPeriod || "lifetime", updatedAt: now }, { merge: true });
      tx.update(fs.collection("paymentTransactions").doc(txnId), { passExpiresAt: expiresAt });
      return { tier: tier.tierName, tierType: tier.tierType, passExpiresAt: expiresAt };
    }
    let currentLevel = 1;
    if (buyer.membershipTierId) {
      const cur = await db.findById("membershipTiers", buyer.membershipTierId).catch(() => null);
      if (cur && cur.tierType === "TASKER") currentLevel = num(cur.level, 1);
    }
    if (num(tier.level, 1) <= currentLevel) {
      return { tier: tier.tierName, tierType: tier.tierType, skipped: "ALREADY_AT_OR_ABOVE_LEVEL" };
    }
    tx.set(userRef, { membershipTierId: tierId, isMonetization: true, updatedAt: now }, { merge: true });
    return { tier: tier.tierName, tierType: tier.tierType };
  });

  // 2. Starter Pass Ad Credits (V9 §1.1 — "Level 1 Starter Pass of ₹999
  //    provides 1,000 Ad Credits"). A separate unit from coins/₹:
  //    grants permanent PLAN credits in adCreditLots + adCreditLedger + users.adCreditsBalance.
  let adCredits = null;
  const credits = Math.max(0, Math.round(num(tier.adCreditsGranted, 0)));
  if (isTasker && credits > 0) {
    adCredits = await effectOnce(txnId, "ad_credits", async (tx, fs) => {
      const res = await adCreditWallet.grantCredits({
        userId: txn.userId,
        amount: credits,
        bonus: 0,
        source: "STARTER_PASS",
        type: "PLAN",
        validityDays: null, // Non-expiring per approved decision
        paymentTransactionId: txnId,
        ref: { tierId },
        tx,
        fs,
      });
      return { credits: res.creditsGranted, balanceAfter: res.balanceAfter };
    });
  }

  // 3. Paid-tier referral bonus (YP-TC §1.5; F-15 rule in referral.service).
  const referralBonus = await effectOnce(txnId, "referral_bonus", async (tx, fs) => {
    const plan = await referralService.planPaidTierReferral({ buyerId: txn.userId, tierPriceInr: txn.amountInr, tierName: tier.tierName, tierType: tier.tierType });
    if (!plan) return { coins: 0 };
    const now = new Date().toISOString();
    tx.set(fs.collection("users").doc(plan.referrerId), { coin: inc(plan.bonusCoins), referralRewardCoin: inc(plan.bonusCoins), totalRewardCoin: inc(plan.bonusCoins), updatedAt: now }, { merge: true });
    const hid = `${txnId}_referral`;
    tx.create(fs.collection("histories").doc(hid), { _id: hid, id: hid, userId: plan.referrerId, uniqueId: plan.uniqueId, coin: plan.bonusCoins, type: 10, note: plan.note, paymentTransactionId: txnId, date: now, createdAt: now });
    return { coins: plan.bonusCoins, percentage: plan.percentage, referrerId: plan.referrerId };
  });

  // 4. District Partner commission — V4 chart. CREATOR tier (VIP Creator
  //    Onboarding) 15%; TASKER tier (Tasker Onboarding, paid Starter Pass) 10%.
  const s = global.settingJSON || {};
  const rate = isCreator ? num(s.districtPartnerRates?.tierUpgrade, 15) : num(s.districtPartnerRates?.taskerOnboarding, 10);
  if ((isCreator || isTasker) && rate > 0 && num(txn.amountInr) > 0) {
    await effectOnce(txnId, "district_commission", async (tx, fs) => {
      const buyer = await db.findById("users", txn.userId);
      const plan = await planAgencyCommission({
        sourceType: isCreator ? "VIP_CREATOR_ONBOARDING" : "TASKER_ONBOARDING",
        grossAmount: num(txn.amountInr), ratePercentage: rate,
        state: buyer?.state || "", district: buyer?.district || "", userId: txn.userId,
        id: `agc_${txnId}_tier`,
      });
      if (plan) tx.create(fs.collection(db.normalizeCollectionName("agencyCommissions")).doc(plan.id), plan.doc);
      return { commission: plan ? plan.doc.commissionAmount : 0 };
    });
  }

  return {
    tier: tier.tierName, tierType: tier.tierType,
    referralBonus: referralBonus.coins ? { coins: referralBonus.coins, percentage: referralBonus.percentage } : null,
    adCredits: adCredits ? adCredits.credits : 0,
    passExpiresAt: assigned.passExpiresAt || null,
    skipped: assigned.skipped || null,
  };
}

async function fulfilCoinPlan(txn) {
  const txnId = String(txn._id || txn.id);
  const plan = await db.findById("CoinPlan", txn.coinPlanId);
  if (!plan) throw new Error("coin plan missing");
  const total = num(plan.coin) + num(plan.extraCoin);
  const uniqueId = await generateHistoryUniqueId();

  await effectOnce(txnId, "coins", (tx, fs) => {
    const now = new Date().toISOString();
    tx.set(fs.collection("users").doc(String(txn.userId)), { coin: inc(total), purchasedCoin: inc(num(plan.coin)), updatedAt: now }, { merge: true });
    const hid = `${txnId}_coins`;
    tx.create(fs.collection("histories").doc(hid), {
      _id: hid, id: hid, userId: txn.userId, uniqueId, coin: num(plan.coin), rewardCoins: num(plan.extraCoin), amount: num(plan.amount),
      paymentGateway: txn.gateway, uniqueRef: txn.paymentId || txn.orderId, type: 8, date: now, createdAt: now,
    });
    return { coinsCredited: total };
  });

  await effectOnce(txnId, "revenue_split", async (tx) => {
    const buyer = await db.findById("users", txn.userId);
    const rplan = await revenueSplit.planRevenue({
      sourceType: "coinPurchase",
      grossInr: num(plan.amount),
      buyerId: txn.userId,
      referrerOf: "buyer",
      agencyContext: { state: buyer?.state || "", district: buyer?.district || "", userId: txn.userId },
      ledgerId: `rev_${txnId}`,
      meta: { coinPlanId: txn.coinPlanId, gateway: txn.gateway, paymentTransactionId: txnId },
    });
    if (rplan.grossCoins > 0) revenueSplit.applyRevenuePlan(tx, rplan);
    return { referrerCoins: rplan.referrerCoins, platformCoins: rplan.platformCoins };
  });

  return { coinsCredited: total };
}

async function fulfilPremiumPlan(txn) {
  const plan = await db.findById("PremiumPlan", txn.premiumPlanId);
  if (!plan) throw new Error("premium plan missing");
  return effectOnce(txn._id || txn.id, "premium_plan", (tx, fs) => {
    const start = new Date();
    const end = new Date(start);
    const v = num(plan.validity, 30);
    const t = (plan.validityType || "day").toLowerCase();
    if (t.startsWith("year")) end.setFullYear(end.getFullYear() + v);
    else if (t.startsWith("month")) end.setMonth(end.getMonth() + v);
    else if (t.startsWith("week")) end.setDate(end.getDate() + v * 7);
    else end.setDate(end.getDate() + v);
    tx.set(fs.collection("users").doc(String(txn.userId)), {
      isPremiumPlan: true,
      plan: {
        planStartDate: start.toISOString(), planEndDate: end.toISOString(), premiumPlanId: plan._id || plan.id,
        amount: num(plan.amount), validity: v, validityType: plan.validityType || "day", planBenefit: plan.planBenefit || [],
      },
      updatedAt: start.toISOString(),
    }, { merge: true });
    return { premiumUntil: end.toISOString() };
  });
}

// Admin: re-run fulfilment for a paid order (REQUIRES_RECONCILIATION, or
// PROCESSING whose lease expired). Only the effects that never committed run.
// Marking an order paid by hand needs a reference to real gateway evidence.
exports.adminMarkPaid = async (req, res) => {
  try {
    const orderId = req.body && (req.body.orderId || req.body.transactionId);
    const txn = orderId && (await db.findOne("paymentTransactions", { orderId }))
      || (req.body.transactionId && (await db.findById("paymentTransactions", req.body.transactionId)));
    if (!txn) return res.status(200).json({ status: false, message: "Transaction not found." });
    if (txn.status !== "paid" && !req.body.paymentId) {
      return res.status(200).json({ status: false, message: "This order has no verified payment. Enter the gateway payment id to mark it paid." });
    }
    const result = await markPaidAndFulfil(txn, { paymentId: req.body.paymentId || txn.paymentId || null, verifiedVia: "admin" });
    return res.status(200).json({ status: result.fulfilmentStatus === FULFILMENT.COMPLETED, message: result.fulfilmentStatus, fulfilment: result.fulfilment || null, error: result.error });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Admin: list orders that need attention — read-only dry run by default.
//   GET /admin/payment/reconcile           → list only
//   POST /admin/payment/reconcile {retry:true, limit}  → retry each (idempotent)
exports.adminReconcile = async (req, res) => {
  try {
    const all = await db.find("paymentTransactions", { status: "paid" });
    const now = Date.now();
    const stuck = all.filter((t) => {
      const st = fulfilmentStateOf(t);
      if (st === FULFILMENT.REQUIRES_RECONCILIATION || st === FULFILMENT.VALIDATION_FAILED) return true;
      return st === FULFILMENT.PROCESSING && now - (Date.parse(t.processingAt || "") || 0) >= PROCESSING_LEASE_MS;
    });
    const rows = stuck.map((t) => ({ id: t._id || t.id, orderId: t.orderId, purpose: t.purpose, fulfilmentStatus: fulfilmentStateOf(t), attempts: t.fulfilmentAttempts || 0, error: t.fulfilmentError || t.validationError || null }));
    const retry = req.method === "POST" && req.body && req.body.retry === true;
    if (!retry) return res.status(200).json({ status: true, dryRun: true, count: rows.length, transactions: rows });
    const limit = Math.max(1, Math.min(50, Number(req.body.limit) || 10));
    const results = [];
    for (const t of stuck.filter((x) => fulfilmentStateOf(x) !== FULFILMENT.VALIDATION_FAILED).slice(0, limit)) {
      const r = await markPaidAndFulfil(t, { paymentId: t.paymentId, verifiedVia: "admin_reconcile" });
      results.push({ id: t._id || t.id, fulfilmentStatus: r.fulfilmentStatus, error: r.error || null });
    }
    return res.status(200).json({ status: true, dryRun: false, retried: results.length, results });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports._internal = { markPaidAndFulfil, claimFulfilment, effectOnce, FULFILMENT, PROCESSING_LEASE_MS };

// Admin: is Razorpay (or the active gateway) usable? Never returns a secret.
exports.adminGatewayStatus = async (req, res) => {
  try {
    const gateway = req.query.gateway || undefined;
    return res.status(200).json({
      status: true,
      activeGateway: payment.activeGateway(),
      gateway: payment.describeConfig(gateway),
      webhookUrls: ["/api/payment/webhook/razorpay"],
      webhookEvents: ["payment.captured", "order.paid"],
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Admin: read-only call to the gateway that proves the saved keys authenticate.
exports.adminGatewayTest = async (req, res) => {
  try {
    const result = await payment.testConnection((req.body && req.body.gateway) || undefined);
    return res.status(200).json({ status: result.ok, ...result });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.adminList = async (req, res) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    if (req.query.purpose) q.purpose = req.query.purpose;
    if (req.query.userId) q.userId = req.query.userId;
    const rows = await db.find("paymentTransactions", q, { sort: { createdAt: -1 }, limit: Number(req.query.limit) || 100 });
    return res.status(200).json({ status: true, transactions: rows });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};
