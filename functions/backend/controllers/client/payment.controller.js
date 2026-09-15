/**
 * Payment flow (gateway-agnostic; Razorpay built-in).
 *
 *   POST /client/payment/createOrder   { userId, purpose, tierId?, coinPlanId?, premiumPlanId? }
 *        -> creates a gateway order + a `created` PaymentTransaction
 *   POST /client/payment/verify        { userId, orderId, paymentId, signature }
 *        -> verifies the client callback, marks paid, fulfils
 *   POST /payment/webhook/:gateway     (server-to-server, raw body)
 *        -> verifies webhook signature, marks paid, fulfils (idempotent)
 *   GET  /client/payment/status?orderId=…
 *
 * Purposes: joining_fee | tier_upgrade | coin_plan | premium_plan
 */
"use strict";

const db = require("../../util/connection");
const payment = require("../../util/payment.service");
const referralService = require("../../util/referral.service");
const revenueSplit = require("../../util/revenueSplit.service");
const { recordAgencyCommission } = require("../../util/revenueCommission.service");
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");
const creatorFunding = require("../../util/creatorFunding.service");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// Resolve how much a given purpose costs, and stash target ids on the txn.
async function resolveAmount({ purpose, tierId, coinPlanId, premiumPlanId, campaignId, amountInr: requestedAmountInr }) {
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
    if (num(tier.membershipPrice, 0) <= 0) return { error: "This tier is free — no payment needed." };
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
      purpose, tierId: b.tierId, coinPlanId: b.coinPlanId, premiumPlanId: b.premiumPlanId,
      campaignId: b.campaignId, amountInr: b.amountInr,
    });
    if (resolved.error) return res.status(200).json({ status: false, message: resolved.error });

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
      status: "created",
      fulfilled: false,
      meta: { email: user.email || "", mobileNumber: user.mobileNumber || "" },
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({
      status: true,
      message: "Order created.",
      transactionId: txn._id || txn.id,
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
      await db.update("paymentTransactions", txn._id || txn.id, { status: "failed" });
      return res.status(200).json({ status: false, message: "Payment signature verification failed." });
    }

    const result = await markPaidAndFulfil(txn, { paymentId, verifiedVia: "callback" });
    return res.status(200).json({
      status: true,
      message: "Payment verified.",
      purpose: txn.purpose,
      fulfilment: result,
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
    // Always 200 the gateway quickly once the signature is valid.
    res.status(200).json({ status: true });

    if (!parsed.paid || !parsed.orderId) return;
    const txn = await db.findOne("paymentTransactions", { orderId: parsed.orderId });
    if (!txn) return;
    await markPaidAndFulfil(txn, { paymentId: parsed.paymentId, verifiedVia: "webhook" });
  } catch (error) {
    console.error("webhook error:", error);
    if (!res.headersSent) res.status(500).json({ status: false });
  }
};

exports.status = async (req, res) => {
  try {
    const orderId = req.query.orderId || (req.body && req.body.orderId);
    const txn = await db.findOne("paymentTransactions", { orderId });
    if (!txn) return res.status(200).json({ status: false, message: "Transaction not found." });
    return res.status(200).json({
      status: true,
      transaction: { status: txn.status, fulfilled: txn.fulfilled, purpose: txn.purpose, amountInr: txn.amountInr },
    });
  } catch (error) {
    return res.status(200).json({ status: false, message: error.message });
  }
};

// ── Mark a transaction paid and run the purpose-specific fulfilment (idempotent)
async function markPaidAndFulfil(txn, { paymentId, verifiedVia }) {
  const id = txn._id || txn.id;
  if (txn.fulfilled) return { alreadyFulfilled: true };

  await db.update("paymentTransactions", id, {
    status: "paid",
    paymentId: paymentId || txn.paymentId || null,
    paidAt: new Date().toISOString(),
    verifiedVia,
  });

  let fulfilment = {};
  try {
    if (txn.purpose === "joining_fee") fulfilment = await fulfilJoiningFee(txn);
    else if (txn.purpose === "tier_upgrade") fulfilment = await fulfilTierUpgrade(txn);
    else if (txn.purpose === "coin_plan") fulfilment = await fulfilCoinPlan(txn);
    else if (txn.purpose === "premium_plan") fulfilment = await fulfilPremiumPlan(txn);
    else if (txn.purpose === "digital_partner_license") fulfilment = await fulfilDigitalPartnerLicense(txn);
    else if (txn.purpose === "campaign_backing") fulfilment = await fulfilCampaignBacking(txn);
  } catch (e) {
    console.error(`fulfilment failed for ${id} (${txn.purpose}):`, e.message);
    fulfilment = { error: e.message };
  }

  await db.update("paymentTransactions", id, { fulfilled: true, fulfilledAt: new Date().toISOString() });
  return fulfilment;
}

async function fulfilJoiningFee(txn) {
  await db.update("users", txn.userId, {
    paymentStatus: true,
    payment_status: true,
    paymentVerifiedAt: new Date().toISOString(),
    paymentGatewayRef: txn.paymentId || txn.orderId,
  });
  return { paymentStatus: true };
}

// Digital Partner Program — Module A (Partner Upgrade & Payment Flow).
// Does NOT touch the Peak Partner referral engine (referral.service.js) —
// that stays open to every user. This only unlocks the partner dashboard /
// ad-credits wallet.
async function fulfilDigitalPartnerLicense(txn) {
  const amount = num(txn.amountInr);

  await db.update("users", txn.userId, {
    isDigitalPartner: true,
    partnerStatus: "ACTIVE",
  });

  const existing = await db.findOne("PartnerProfile", { userId: txn.userId });
  const patch = {
    userId: txn.userId,
    licenseFeePaid: amount,
    paymentTransactionId: txn._id || txn.id,
    adCreditsBalance: (existing?.adCreditsBalance || 0) + amount,
    adCreditsGranted: (existing?.adCreditsGranted || 0) + amount,
    activatedAt: new Date().toISOString(),
  };
  if (existing) {
    await db.update("PartnerProfile", existing._id || existing.id, patch);
  } else {
    patch.totalReferrals = 0;
    patch.totalEarnings = 0;
    await db.create("PartnerProfile", patch);
  }

  // District Partner override — 20% of the license fee, per the V4 chart's
  // "Digital Partner" line (digital platform promotions / network expansion /
  // user acquisition within the district).
  try {
    const rate = num((global.settingJSON || {}).districtPartnerRates?.digitalPartnerLicense, 20);
    if (rate > 0 && amount > 0) {
      const buyer = await db.findById("users", txn.userId);
      await recordAgencyCommission({
        sourceType: "DIGITAL_PARTNER_LICENSE",
        grossAmount: amount,
        ratePercentage: rate,
        state: buyer?.state || "",
        district: buyer?.district || "",
        userId: txn.userId,
      });
    }
  } catch (e) { /* ignore */ }

  return { isDigitalPartner: true, adCreditsBalance: patch.adCreditsBalance };
}

// Creator Funding — a verified backing. Records the backing, bumps the
// campaign's raised total, and resolves the campaign immediately if the
// goal is hit (no need to wait for the deadline). If the campaign somehow
// closed between order-creation and this payment landing (deadline passed
// mid-checkout, or the creator cancelled it), refund the backer as coins
// rather than silently keeping a payment against a dead campaign.
async function fulfilCampaignBacking(txn) {
  const amountInr = num(txn.amountInr);
  const campaign = await db.findById("creatorFundingCampaigns", txn.campaignId);
  if (!campaign) return { error: "campaign missing" };

  if (campaign.status !== "ACTIVE") {
    const rate = num((global.settingJSON || {}).coinToInrRate, 0.01);
    const refundCoins = Math.round(amountInr / rate);
    const backer = await db.findById("users", txn.userId);
    if (backer) {
      await db.update("users", backer._id || backer.id, { coin: (backer.coin || 0) + refundCoins });
    }
    await db.create("campaignBackings", {
      campaignId: txn.campaignId, backerId: txn.userId, amountInr,
      paymentTransactionId: txn._id || txn.id, status: "REFUNDED",
      refundedAt: new Date().toISOString(), refundCoins,
    });
    return { refunded: true, reason: "Campaign was no longer active.", refundCoins };
  }

  const perk = (campaign.perks || [])
    .filter((p) => num(p.minAmountInr) <= amountInr)
    .sort((a, b) => num(b.minAmountInr) - num(a.minAmountInr))[0];

  await db.create("campaignBackings", {
    campaignId: txn.campaignId,
    backerId: txn.userId,
    amountInr,
    paymentTransactionId: txn._id || txn.id,
    perkUnlocked: perk?.title || "",
    status: "ACTIVE",
  });

  const raisedAmountInr = Number((num(campaign.raisedAmountInr) + amountInr).toFixed(2));
  await db.update("creatorFundingCampaigns", campaign._id || campaign.id, {
    raisedAmountInr,
    backerCount: (campaign.backerCount || 0) + 1,
  });

  let resolvedCampaign = null;
  if (raisedAmountInr >= num(campaign.goalAmountInr)) {
    resolvedCampaign = await creatorFunding.resolveCampaignSuccess(campaign._id || campaign.id);
  }

  return {
    campaignId: campaign._id || campaign.id,
    perkUnlocked: perk?.title || null,
    raisedAmountInr,
    goalReached: !!resolvedCampaign,
  };
}

async function fulfilTierUpgrade(txn) {
  const tier = await db.findById("membershipTiers", txn.tierId);
  if (!tier) return { error: "tier missing" };
  const field = tier.tierType === "CREATOR" ? "activeCreatorTierId" : "membershipTierId";
  await db.update("users", txn.userId, { [field]: tier._id || tier.id, isMonetization: true });

  let referralBonus = null;
  try {
    const r = await referralService.handlePaidTierReferral({
      buyerId: txn.userId, tierPriceInr: txn.amountInr, tierName: tier.tierName,
    });
    if (r.ok) referralBonus = { coins: r.bonusCoins, percentage: r.percentage };
  } catch (e) { /* ignore */ }

  // District Partner commission — V4 chart. Called directly (not via
  // revenueSplit.settleRevenue) so it doesn't also re-run the peer referral
  // split above.
  //   CREATOR tier (VIP Creator Onboarding): 15% (was 20%, V4 adjustment)
  //   TASKER tier (Tasker Onboarding, paid "Starter Pass"): 10%
  try {
    const s = global.settingJSON || {};
    const isCreator = tier.tierType === "CREATOR";
    const isTasker = tier.tierType === "TASKER";
    const rate = isCreator
      ? num(s.districtPartnerRates?.tierUpgrade, 15)
      : num(s.districtPartnerRates?.taskerOnboarding, 10);
    if ((isCreator || isTasker) && rate > 0 && num(txn.amountInr) > 0) {
      const buyer = await db.findById("users", txn.userId);
      await recordAgencyCommission({
        sourceType: isCreator ? "VIP_CREATOR_ONBOARDING" : "TASKER_ONBOARDING",
        grossAmount: num(txn.amountInr),
        ratePercentage: rate,
        state: buyer?.state || "",
        district: buyer?.district || "",
        userId: txn.userId,
      });
    }
  } catch (e) { /* ignore */ }

  return { tier: tier.tierName, tierType: tier.tierType, referralBonus };
}

async function fulfilCoinPlan(txn) {
  const plan = await db.findById("CoinPlan", txn.coinPlanId);
  if (!plan) return { error: "coin plan missing" };
  const user = await db.findById("users", txn.userId);
  const total = num(plan.coin) + num(plan.extraCoin);

  await db.update("users", txn.userId, {
    coin: (user.coin || 0) + total,
    purchasedCoin: (user.purchasedCoin || 0) + num(plan.coin),
  });
  await db.create("histories", {
    userId: txn.userId,
    uniqueId: await generateHistoryUniqueId(),
    coin: num(plan.coin),
    rewardCoins: num(plan.extraCoin),
    amount: num(plan.amount),
    paymentGateway: txn.gateway,
    uniqueRef: txn.paymentId || txn.orderId,
    type: 8,
    date: new Date().toISOString(),
  });

  try {
    await revenueSplit.settleRevenue({
      sourceType: "coinPurchase",
      grossInr: num(plan.amount),
      buyerId: txn.userId,
      referrerOf: "buyer",
      agencyContext: { state: user.state || "", district: user.district || "", userId: txn.userId },
      meta: { coinPlanId: txn.coinPlanId, gateway: txn.gateway },
    });
  } catch (e) { /* ignore */ }

  return { coinsCredited: total };
}

async function fulfilPremiumPlan(txn) {
  const plan = await db.findById("PremiumPlan", txn.premiumPlanId);
  if (!plan) return { error: "premium plan missing" };
  const start = new Date();
  const end = new Date(start);
  const v = num(plan.validity, 30);
  const t = (plan.validityType || "day").toLowerCase();
  if (t.startsWith("year")) end.setFullYear(end.getFullYear() + v);
  else if (t.startsWith("month")) end.setMonth(end.getMonth() + v);
  else if (t.startsWith("week")) end.setDate(end.getDate() + v * 7);
  else end.setDate(end.getDate() + v);

  await db.update("users", txn.userId, {
    isPremiumPlan: true,
    plan: {
      planStartDate: start.toISOString(),
      planEndDate: end.toISOString(),
      premiumPlanId: plan._id || plan.id,
      amount: num(plan.amount),
      validity: v,
      validityType: plan.validityType || "day",
      planBenefit: plan.planBenefit || [],
    },
  });
  return { premiumUntil: end.toISOString() };
}

// Admin: manually mark a transaction paid (e.g. reconciliation)
exports.adminMarkPaid = async (req, res) => {
  try {
    const orderId = req.body && (req.body.orderId || req.body.transactionId);
    const txn = orderId && (await db.findOne("paymentTransactions", { orderId }))
      || (req.body.transactionId && (await db.findById("paymentTransactions", req.body.transactionId)));
    if (!txn) return res.status(200).json({ status: false, message: "Transaction not found." });
    const fulfilment = await markPaidAndFulfil(txn, { paymentId: req.body.paymentId || "admin", verifiedVia: "admin" });
    return res.status(200).json({ status: true, message: "Marked paid.", fulfilment });
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
