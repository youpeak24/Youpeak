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
 *   • creator + referrer shares are credited as COINS (100 coins = ₹1)
 *   • District Partner commission is recorded in INR (payout ledger)
 */
"use strict";

const db = require("./connection");
const { getCreatorRevenueShare } = require("./rewardEngine");
const { recordAgencyCommission } = require("./revenueCommission.service");
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

async function creditCoins(userId, coins, bucketField, meta) {
  coins = Math.round(coins);
  if (!userId || coins <= 0) return 0;
  const u = await db.findById("users", userId);
  if (!u || u.isBlock) return 0;
  // Coins only — the user's coin → ₹ conversion is what adds withdrawable
  // totalEarningAmount; crediting both paid the same share out twice.
  const deltas = { coin: coins };
  if (bucketField) deltas[bucketField] = coins;
  await db.incrementFields("users", u._id || u.id, deltas);
  try {
    await db.create("histories", {
      userId: String(userId),
      uniqueId: await generateHistoryUniqueId(),
      coin: coins,
      type: HISTORY_TYPE_REVENUE,
      date: new Date().toISOString(),
      ...(meta || {}),
    });
  } catch (e) { /* ledger row is best-effort */ }
  return coins;
}

/**
 * Settle one monetisable event.
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
 * @param {object} [p.meta]
 * @returns {Promise<{grossCoins, split, creatorCoins, referrerCoins, platformCoins, districtPartner}>}
 */
async function settleRevenue(p = {}) {
  const rate = coinToInrRate();
  const grossCoins = p.grossCoins != null
    ? Math.max(0, Math.round(p.grossCoins))
    : Math.max(0, Math.round(num(p.grossInr, 0) / rate));
  const grossInr = p.grossInr != null ? num(p.grossInr, 0) : Number((grossCoins * rate).toFixed(2));

  if (grossCoins <= 0) {
    return { grossCoins: 0, split: null, creatorCoins: 0, referrerCoins: 0, platformCoins: 0, districtPartner: null };
  }

  const split = getSplitConfig(p.sourceType);

  // Ad revenue: creator % comes from their VIP tier, not the static profile.
  if (p.sourceType === "adRevenue" && p.creatorId) {
    try {
      const creator = await db.findById("users", p.creatorId);
      const share = await getCreatorRevenueShare(creator || {});
      split.creator = share.creatorSharePercentage;
      split.platform = 100 - split.creator - split.referrer;
    } catch (e) { /* keep profile default */ }
  }

  let creatorCoins = Math.round((grossCoins * split.creator) / 100);
  let referrerCoins = Math.round((grossCoins * split.referrer) / 100);
  let platformCoins = grossCoins - creatorCoins - referrerCoins;

  // Credit the creator
  const paidCreator = p.creatorId
    ? await creditCoins(p.creatorId, creatorCoins, "engagementRewardCoin", {
        revenueType: p.sourceType, role: "creator", videoId: p.videoId || "",
      })
    : 0;

  // Credit the referrer
  let referrerId = p.referrerId || null;
  if (!referrerId && referrerCoins > 0) {
    const of = p.referrerOf === "creator" ? p.creatorId : p.buyerId;
    referrerId = await resolveReferrer(of);
  }
  const paidReferrer = referrerId
    ? await creditCoins(referrerId, referrerCoins, "referralRewardCoin", {
        revenueType: p.sourceType, role: "referrer", videoId: p.videoId || "",
      })
    : 0;

  if (!p.creatorId) { platformCoins += creatorCoins; creatorCoins = 0; }
  if (!referrerId) { platformCoins += referrerCoins; referrerCoins = 0; }

  // District Partner commission (INR), from the regional agency
  let districtPartner = null;
  const dpRate = getDistrictRate(p.sourceType);
  if (dpRate > 0 && p.agencyContext) {
    const cap = p.sourceType === "videoUnlock"
      ? num((global.settingJSON || {}).districtPartnerUnlockCapINR, 1000)
      : null;
    try {
      const rec = await recordAgencyCommission({
        agencyId: p.agencyContext.agencyId || null,
        sourceType: mapDpSourceType(p.sourceType),
        grossAmount: grossInr,
        ratePercentage: dpRate,
        capInr: cap,
        state: p.agencyContext.state || "",
        district: p.agencyContext.district || "",
        userId: p.agencyContext.userId || p.buyerId || null,
      });
      if (rec) {
        districtPartner = {
          amountInr: rec.commissionAmount,
          ratePercentage: dpRate,
          agencyId: rec.agencyId,
          record: rec._id || rec.id,
        };
      }
    } catch (e) { /* ignore */ }
  }

  // Audit ledger
  try {
    await db.create("revenueLedger", {
      _id: `rev_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      sourceType: p.sourceType,
      videoId: p.videoId || null,
      buyerId: p.buyerId || null,
      creatorId: p.creatorId || null,
      referrerId: referrerId || null,
      grossCoins, grossInr,
      split,
      creatorCoins: paidCreator, referrerCoins: paidReferrer, platformCoins,
      districtPartner,
      createdAt: new Date().toISOString(),
      meta: p.meta || {},
    });
  } catch (e) { /* best-effort */ }

  return {
    grossCoins, grossInr, split,
    creatorCoins: paidCreator,
    referrerCoins: paidReferrer,
    platformCoins,
    districtPartner,
  };
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

module.exports = { settleRevenue, resolveReferrer, getSplitConfig, getDistrictRate, DEFAULT_SPLITS, DEFAULT_DISTRICT_RATES };
