/**
 * Revenue-split engine. One place that decides how the money from a
 * monetisable event is divided between the creator, the referrer, the platform
 * and the regional District Partner — and records an audit ledger row.
 *
 * All percentages are config-driven (settings.revenueSplits[sourceType] and
 * settings.districtPartnerRates[sourceType]); the constants below are only the
 * launch defaults. creator + referrer + platform must sum to 100. The District
 * Partner cut is taken FROM the platform share and capped separately.
 *
 * Money units:
 *   • creator / referrer / platform shares are COINS (integers, 100 coins = ₹1)
 *   • the District Partner commission is recorded in INR (payout ledger)
 *
 * Two phases (Phase 2, F-22/F-23):
 *   planRevenue(p)            reads only — resolves recipients, computes integer
 *                             shares; a share whose recipient can't be credited
 *                             (missing/blocked) goes to the platform, so
 *                             creator + referrer + platform == gross always.
 *   applyRevenuePlan(tx, plan) writes only, inside the caller's Firestore
 *                             transaction: balance credits, history rows, the
 *                             ledger row (platform share durably recorded) and
 *                             the District Partner commission. With a
 *                             deterministic plan.ledgerId a second application
 *                             fails (ALREADY_EXISTS) instead of double-crediting.
 *   settleRevenue(p)          plan + apply in one transaction (existing callers).
 */
"use strict";

const db = require("./connection");
const firebaseAdmin = require("./firebaseAdmin");
const { getCreatorRevenueShare } = require("./rewardEngine");
const { planAgencyCommission } = require("./revenueCommission.service");
const { generateHistoryUniqueId } = require("./generateHistoryUniqueId");

const DEFAULT_SPLITS = {
  videoUnlock:     { creator: 80, referrer: 10, platform: 10 },
  peakBoost:       { creator: 80, referrer: 0,  platform: 20 },
  coinPurchase:    { creator: 0,  referrer: 10, platform: 90 },
  premiumPurchase: { creator: 0,  referrer: 10, platform: 90 },
  tierUpgrade:     { creator: 0,  referrer: 10, platform: 90 },
  adRevenue:       { creator: 55, referrer: 0,  platform: 45 }, // creator% overridden by tier
};

// % of gross taken as District Partner commission (out of the platform share).
const DEFAULT_DISTRICT_RATES = {
  videoUnlock: 10,
  tierUpgrade: 20,
  localBusinessAds: 30,
  adRevenue: 10,
  coinPurchase: 0,
  premiumPurchase: 0,
};

const HISTORY_TYPE_REVENUE = 20; // ledger marker in the histories collection

function num(v, d) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function coinToInrRate() {
  return num((global.settingJSON || {}).coinToInrRate, 0.01);
}

function getSplitConfig(sourceType) {
  const s = global.settingJSON || {};
  const base = DEFAULT_SPLITS[sourceType] || { creator: 0, referrer: 0, platform: 100 };
  const override = (s.revenueSplits && s.revenueSplits[sourceType]) || {};
  const merged = {
    creator: num(override.creator, base.creator),
    referrer: num(override.referrer, base.referrer),
    platform: num(override.platform, base.platform),
  };
  const total = merged.creator + merged.referrer + merged.platform;
  if (total !== 100 && total > 0) {
    // normalise so it always sums to 100
    merged.creator = (merged.creator / total) * 100;
    merged.referrer = (merged.referrer / total) * 100;
    merged.platform = (merged.platform / total) * 100;
  }
  return merged;
}

function getDistrictRate(sourceType) {
  const s = global.settingJSON || {};
  const override = (s.districtPartnerRates && s.districtPartnerRates[sourceType]);
  return num(override, DEFAULT_DISTRICT_RATES[sourceType] || 0);
}

/** Who referred this user (from referralHistories, then user.referrerId). */
async function resolveReferrer(userId) {
  if (!userId) return null;
  try {
    const rec = await db.findOne("referralHistories", { referredUserId: String(userId) });
    if (rec && rec.referrerId) return String(rec.referrerId);
  } catch (e) { /* ignore */ }
  const u = await db.findById("users", userId);
  return u && u.referrerId ? String(u.referrerId) : null;
}

async function creditable(userId) {
  if (!userId) return false;
  const u = await db.findById("users", userId);
  return !!u && !u.isBlock;
}

/**
 * Read phase. Returns a plan the caller applies with applyRevenuePlan(tx, plan).
 *
 * Rounding (existing implemented rule, not an owner-approved policy — see
 * Phase 2 report BLOCK-01): creator = round(gross × creator%), referrer =
 * round(gross × referrer%), platform = the remainder, so the three always sum
 * to the gross exactly.
 *
 * @param {object} p  see settleRevenue
 * @param {string} [p.ledgerId]  deterministic ledger id (idempotency key)
 */
async function planRevenue(p = {}) {
  const rate = coinToInrRate();
  const grossCoins = p.grossCoins != null
    ? Math.max(0, Math.round(p.grossCoins))
    : Math.max(0, Math.round(num(p.grossInr, 0) / rate));
  const grossInr = p.grossInr != null ? num(p.grossInr, 0) : Number((grossCoins * rate).toFixed(2));
  const split = getSplitConfig(p.sourceType);

  if (p.sourceType === "adRevenue" && p.creatorId) {
    try {
      const creator = await db.findById("users", p.creatorId);
      const share = await getCreatorRevenueShare(creator || {});
      split.creator = share.creatorSharePercentage;
      split.platform = 100 - split.creator - split.referrer;
    } catch (e) { /* keep profile default */ }
  }

  let creatorCoins = grossCoins > 0 ? Math.round((grossCoins * split.creator) / 100) : 0;
  let referrerCoins = grossCoins > 0 ? Math.round((grossCoins * split.referrer) / 100) : 0;

  const creatorId = p.creatorId && creatorCoins > 0 && (await creditable(p.creatorId)) ? String(p.creatorId) : null;
  if (!creatorId) creatorCoins = 0;

  let referrerId = p.referrerId || null;
  if (!referrerId && referrerCoins > 0) {
    referrerId = await resolveReferrer(p.referrerOf === "creator" ? p.creatorId : p.buyerId);
  }
  if (!referrerId || referrerCoins <= 0 || !(await creditable(referrerId))) { referrerId = null; referrerCoins = 0; }

  const platformCoins = grossCoins - creatorCoins - referrerCoins;

  let districtCommission = null;
  const dpRate = getDistrictRate(p.sourceType);
  if (grossCoins > 0 && dpRate > 0 && p.agencyContext) {
    const cap = p.sourceType === "videoUnlock" ? num((global.settingJSON || {}).districtPartnerUnlockCapINR, 1000) : null;
    try {
      districtCommission = await planAgencyCommission({
        agencyId: p.agencyContext.agencyId || null,
        sourceType: mapDpSourceType(p.sourceType),
        grossAmount: grossInr,
        ratePercentage: dpRate,
        capInr: cap,
        state: p.agencyContext.state || "",
        district: p.agencyContext.district || "",
        userId: p.agencyContext.userId || p.buyerId || null,
        id: p.ledgerId ? `${p.ledgerId}_dp` : undefined,
      });
    } catch (e) { districtCommission = null; }
  }

  const credits = [];
  if (creatorId) credits.push({ userId: creatorId, coins: creatorCoins, bucket: "engagementRewardCoin", role: "creator", uniqueId: await generateHistoryUniqueId() });
  if (referrerId) credits.push({ userId: referrerId, coins: referrerCoins, bucket: "referralRewardCoin", role: "referrer", uniqueId: await generateHistoryUniqueId() });

  return {
    sourceType: p.sourceType,
    ledgerId: p.ledgerId || `rev_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    grossCoins, grossInr, split,
    creatorId: p.creatorId || null, buyerId: p.buyerId || null, videoId: p.videoId || null,
    referrerId, creatorCoins, referrerCoins, platformCoins,
    credits, districtCommission, meta: p.meta || {},
  };
}

/** Write phase — call inside a Firestore transaction, after all of its reads. */
function applyRevenuePlan(tx, plan) {
  const fs = db.getDb();
  const now = new Date().toISOString();
  const inc = (n) => firebaseAdmin.firestore.FieldValue.increment(n);
  for (const c of plan.credits) {
    if (!(c.coins > 0)) continue;
    // Coins only — the user's coin → ₹ conversion adds withdrawable ₹.
    tx.set(fs.collection("users").doc(c.userId), { coin: inc(c.coins), [c.bucket]: inc(c.coins), updatedAt: now }, { merge: true });
    const hid = `${plan.ledgerId}_${c.role}`;
    tx.create(fs.collection("histories").doc(hid), {
      _id: hid, id: hid, userId: c.userId, uniqueId: c.uniqueId, coin: c.coins, type: HISTORY_TYPE_REVENUE,
      revenueType: plan.sourceType, role: c.role, videoId: plan.videoId || "", ledgerId: plan.ledgerId, date: now, createdAt: now, updatedAt: now,
    });
  }
  if (plan.districtCommission) {
    tx.create(fs.collection(db.normalizeCollectionName("agencyCommissions")).doc(plan.districtCommission.id), plan.districtCommission.doc);
  }
  tx.create(fs.collection(db.normalizeCollectionName("revenueLedger")).doc(plan.ledgerId), JSON.parse(JSON.stringify({
    _id: plan.ledgerId, id: plan.ledgerId,
    sourceType: plan.sourceType, videoId: plan.videoId, buyerId: plan.buyerId, creatorId: plan.creatorId, referrerId: plan.referrerId,
    grossCoins: plan.grossCoins, grossInr: plan.grossInr, split: plan.split,
    creatorCoins: plan.creatorCoins, referrerCoins: plan.referrerCoins, platformCoins: plan.platformCoins,
    districtPartner: plan.districtCommission
      ? { amountInr: plan.districtCommission.doc.commissionAmount, ratePercentage: plan.districtCommission.doc.commissionRatePercentage, agencyId: plan.districtCommission.doc.agencyId, record: plan.districtCommission.id }
      : null,
    createdAt: now, meta: plan.meta,
  })));
}

function summary(plan) {
  return {
    grossCoins: plan.grossCoins, grossInr: plan.grossInr, split: plan.split,
    creatorCoins: plan.creatorCoins, referrerCoins: plan.referrerCoins, platformCoins: plan.platformCoins,
    districtPartner: plan.districtCommission ? { amountInr: plan.districtCommission.doc.commissionAmount, record: plan.districtCommission.id } : null,
    ledgerId: plan.ledgerId,
  };
}

/**
 * Settle one monetisable event atomically (plan + apply in one transaction).
 *
 * @param {object} p
 * @param {string} p.sourceType   videoUnlock | peakBoost | coinPurchase | premiumPurchase | tierUpgrade | adRevenue | localBusinessAds
 * @param {number} [p.grossCoins] amount in coins (unlocks, boosts)
 * @param {number} [p.grossInr]   amount in INR (gateway purchases, ad revenue)
 * @param {string} [p.creatorId]  the content owner
 * @param {string} [p.buyerId]    the paying user
 * @param {string} [p.referrerId] explicit referrer; else resolved from buyer/creator
 * @param {string} [p.referrerOf] "buyer" (default) | "creator"
 * @param {object} [p.agencyContext] { agencyId?, state?, district?, userId? } for the District Partner
 * @param {string} [p.videoId]
 * @param {string} [p.ledgerId]   deterministic ledger id: a repeat settles nothing ({ alreadySettled: true })
 * @param {object} [p.meta]
 */
async function settleRevenue(p = {}) {
  const plan = await planRevenue(p);
  if (plan.grossCoins <= 0) return { ...summary(plan), creatorCoins: 0, referrerCoins: 0, platformCoins: 0, districtPartner: null };
  const fs = db.getDb();
  try {
    await db.withTimeout(fs.runTransaction(async (tx) => { applyRevenuePlan(tx, plan); }));
  } catch (err) {
    if (p.ledgerId && (err.code === 6 || /ALREADY_EXISTS/i.test(err.message || ""))) return { ...summary(plan), alreadySettled: true };
    throw err;
  }
  return summary(plan);
}

function mapDpSourceType(t) {
  switch (t) {
    case "coinPurchase": return "COIN_PURCHASE";
    case "premiumPurchase": return "PREMIUM_SUBSCRIPTION";
    case "videoUnlock": return "VIDEO_UNLOCK";
    case "tierUpgrade": return "VIP_CREATOR_ONBOARDING";
    case "localBusinessAds": return "LOCAL_BUSINESS_ADS";
    case "adRevenue": return "AD_IMPRESSION";
    default: return "PAID_CHANNEL";
  }
}

module.exports = {
  settleRevenue, planRevenue, applyRevenuePlan, resolveReferrer, getSplitConfig, getDistrictRate,
  DEFAULT_SPLITS, DEFAULT_DISTRICT_RATES, HISTORY_TYPE_REVENUE,
};
