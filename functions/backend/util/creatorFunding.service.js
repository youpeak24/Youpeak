/**
 * Creator Funding Campaigns — shared resolution logic used by the payment
 * flow (goal reached early), the daily cron (deadline passed), and the
 * client controller (creator cancels). One place decides what "success"
 * and "refund" mean so all three paths stay consistent.
 *
 * Perks only, never a financial return — see setting.js's creatorFunding*
 * comment for why this exists instead of the tradeable "fan card" concept
 * it replaced.
 */
"use strict";

const db = require("./connection");

function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function coinToInrRate() {
  return num((global.settingJSON || {}).coinToInrRate, 0.01);
}

// Goal met -> credit the creator (minus the platform fee) as coins, same
// wallet every other creator-earning path uses, so they cash out through
// the existing (already-atomic) withdrawal flow like any other earning.
// Idempotent: no-ops if the campaign isn't ACTIVE anymore.
async function resolveCampaignSuccess(campaignId) {
  const campaign = await db.findById("creatorFundingCampaigns", campaignId);
  if (!campaign || campaign.status !== "ACTIVE") return null;

  const feePct = num(campaign.platformFeePercentage, num((global.settingJSON || {}).creatorFundingPlatformFeePercentage, 20));
  const raisedInr = num(campaign.raisedAmountInr);
  const payoutInr = Number(((raisedInr * (100 - feePct)) / 100).toFixed(2));
  const rate = coinToInrRate();
  const payoutCoins = Math.round(payoutInr / rate);

  const creator = await db.findById("users", campaign.creatorId);
  if (creator) {
    await db.update("users", creator._id || creator.id, {
      coin: (creator.coin || 0) + payoutCoins,
      totalEarningAmount: Number(((creator.totalEarningAmount || 0) + payoutInr).toFixed(2)),
      totalRewardCoin: (creator.totalRewardCoin || 0) + payoutCoins,
    });
  }

  return db.update("creatorFundingCampaigns", campaignId, {
    status: "SUCCESSFUL",
    resolvedAt: new Date().toISOString(),
    payoutCoins,
  });
}

// Goal missed (or creator cancelled) -> every ACTIVE backer gets their
// contribution back as spendable coins. Real-money Razorpay refunds
// aren't wired up yet (a separate, bigger integration) — flagged as a
// known follow-up, not silently skipped.
async function refundCampaign(campaignId, finalStatus = "FAILED") {
  const campaign = await db.findById("creatorFundingCampaigns", campaignId);
  if (!campaign || campaign.status !== "ACTIVE") return null;

  const rate = coinToInrRate();
  const backings = await db.find("campaignBackings", { campaignId: String(campaignId), status: "ACTIVE" });

  let refundedCount = 0;
  for (const b of backings) {
    const refundCoins = Math.round(num(b.amountInr) / rate);
    const backer = await db.findById("users", b.backerId);
    if (backer) {
      await db.update("users", backer._id || backer.id, {
        coin: (backer.coin || 0) + refundCoins,
      });
    }
    await db.update("campaignBackings", b._id || b.id, {
      status: "REFUNDED",
      refundedAt: new Date().toISOString(),
      refundCoins,
    });
    refundedCount++;
  }

  const updatedCampaign = await db.update("creatorFundingCampaigns", campaignId, {
    status: finalStatus,
    resolvedAt: new Date().toISOString(),
  });
  return { campaign: updatedCampaign, refundedCount };
}

// Cron task: any ACTIVE campaign whose deadline has passed either
// succeeded (goal was met — resolve it) or failed (refund everyone).
async function resolveExpiredCampaigns() {
  const now = Date.now();
  const active = await db.find("creatorFundingCampaigns", { status: "ACTIVE" });
  let resolved = 0;
  for (const c of active) {
    const deadline = c.deadlineAt ? new Date(c.deadlineAt).getTime() : null;
    if (!deadline || now < deadline) continue;
    if (num(c.raisedAmountInr) >= num(c.goalAmountInr)) {
      await resolveCampaignSuccess(c._id || c.id);
    } else {
      await refundCampaign(c._id || c.id, "FAILED");
    }
    resolved++;
  }
  return { checked: active.length, resolved };
}

module.exports = { resolveCampaignSuccess, refundCampaign, resolveExpiredCampaigns };
