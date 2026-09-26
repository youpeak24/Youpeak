/**
 * Creator VIP Pass pricing and validity (2026-09-26 introductory launch table).
 *
 * A CREATOR tier (membershipTiers) can be sold for 3 months and/or a year:
 *   quarterlyPriceINR / annualPriceINR           launch ("introductory") prices
 *   standardQuarterlyPriceINR / standardAnnualPriceINR
 *                                                price once the intro offer is used up
 *   introOfferLimit                              first N creators get the launch price,
 *                                                and keep it on every renewal
 *
 * A tier with neither period price set is a legacy one-time pass (its
 * membershipPrice buys it with no expiry) — that's how every pass was sold
 * before this change, so tier docs not yet updated keep working unchanged.
 *
 * The user carries creatorPassExpiresAt; null/absent = no expiry (free passes
 * and legacy purchases).
 */
"use strict";

const db = require("./connection");

const PERIOD_MONTHS = { quarterly: 3, annual: 12 };

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const idOf = (doc) => String(doc?._id || doc?.id || "");

function periodPrices(tier) {
  return { quarterly: num(tier.quarterlyPriceINR), annual: num(tier.annualPriceINR) };
}

function isTimedTier(tier) {
  const p = periodPrices(tier);
  return p.quarterly > 0 || p.annual > 0;
}

function standardPrice(tier, period) {
  return num(period === "quarterly" ? tier.standardQuarterlyPriceINR : tier.standardAnnualPriceINR);
}

function isPassActive(user, now = Date.now()) {
  if (!user || !user.activeCreatorTierId) return false;
  if (!user.creatorPassExpiresAt) return true;
  const t = Date.parse(user.creatorPassExpiresAt);
  return !Number.isFinite(t) || t > now;
}

/**
 * Whether this creator buys at the introductory price: they already hold an
 * intro-priced purchase of this tier (grandfathered), or fewer than
 * introOfferLimit creators have bought it at the intro price so far.
 */
async function qualifiesForIntro(tier, userId) {
  const limit = num(tier.introOfferLimit);
  if (limit <= 0) return true;
  const paid = await db.find("paymentTransactions", { tierId: idOf(tier), purpose: "tier_upgrade", status: "paid", introPricing: true });
  if (paid.some((t) => String(t.userId) === String(userId))) return true;
  return new Set(paid.map((t) => String(t.userId))).size < limit;
}

/**
 * Price table for one creator, for display and checkout.
 * @returns {Promise<{ timed: boolean, introPricing: boolean, options: Array<{ billingPeriod, months, priceINR, listPriceINR }> }>}
 */
async function pricingFor(tier, userId) {
  if (!isTimedTier(tier)) {
    const price = num(tier.membershipPrice);
    return { timed: false, introPricing: false, options: price > 0 ? [{ billingPeriod: "lifetime", months: null, priceINR: price, listPriceINR: price }] : [] };
  }
  const intro = await qualifiesForIntro(tier, userId);
  const options = [];
  for (const [period, listPrice] of Object.entries(periodPrices(tier))) {
    if (listPrice <= 0) continue;
    const std = standardPrice(tier, period);
    const price = intro || std <= 0 ? listPrice : std;
    options.push({ billingPeriod: period, months: PERIOD_MONTHS[period], priceINR: price, listPriceINR: std > 0 ? std : listPrice });
  }
  return { timed: true, introPricing: intro, options };
}

/**
 * Resolve what a creator pays for a pass at checkout
 * (controllers/client/payment.controller.js resolveAmount).
 */
async function resolveCheckout({ tier, user, billingPeriod }) {
  const subs = num(user.totalSubscribers);
  const minSubs = num(tier.minSubscribersRequired);
  if (subs < minSubs) {
    return { error: `${tier.tierName} needs at least ${minSubs.toLocaleString("en-IN")} subscribers. You have ${subs.toLocaleString("en-IN")}.` };
  }

  const pricing = await pricingFor(tier, idOf(user));
  if (pricing.options.length === 0) return { error: "This pass is free — no payment needed." };

  let option;
  if (!pricing.timed) {
    option = pricing.options[0];
  } else {
    // Older app builds send no period: default to the annual pass when it's sold.
    const wanted = billingPeriod || (pricing.options.some((o) => o.billingPeriod === "annual") ? "annual" : pricing.options[0].billingPeriod);
    option = pricing.options.find((o) => o.billingPeriod === wanted);
    if (!option) return { error: `${tier.tierName} isn't sold as a ${wanted} pass.` };
  }

  return {
    amountInr: option.priceINR,
    tier,
    txnExtra: {
      billingPeriod: option.billingPeriod,
      // Counts toward (and grandfathers into) the first-N-creators offer, for
      // either period.
      introPricing: pricing.timed && pricing.introPricing && num(tier.introOfferLimit) > 0,
    },
  };
}

/**
 * Expiry for a newly paid pass: renewing the pass you already hold extends
 * it from its current expiry; anything else starts today.
 */
function nextExpiry(user, tier, billingPeriod, now = new Date()) {
  const months = PERIOD_MONTHS[billingPeriod];
  if (!months) return null;
  let start = now;
  if (user && String(user.activeCreatorTierId || "") === idOf(tier) && user.creatorPassExpiresAt) {
    const current = new Date(user.creatorPassExpiresAt);
    if (Number.isFinite(current.getTime()) && current > now) start = current;
  }
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  return end.toISOString();
}

module.exports = { PERIOD_MONTHS, isTimedTier, isPassActive, pricingFor, resolveCheckout, nextExpiry };
