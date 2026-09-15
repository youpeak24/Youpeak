/**
 * Creator Funding Campaigns — client endpoints.
 *   GET  /client/creatorFunding/eligibility        -> can this user start a campaign?
 *   POST /client/creatorFunding/createCampaign      -> start one
 *   GET  /client/creatorFunding/getActiveCampaigns  -> browse feed
 *   GET  /client/creatorFunding/getCampaignDetails  -> one campaign
 *   GET  /client/creatorFunding/getMyCampaigns      -> a creator's own campaigns
 *   GET  /client/creatorFunding/getMyBackings       -> a fan's own backing history
 *   POST /client/creatorFunding/cancelCampaign      -> creator cancels, backers refunded
 *
 * Backing itself goes through the existing payment flow: POST
 * /client/payment/createOrder { purpose: "campaign_backing", campaignId,
 * amountInr } -> Razorpay -> POST /client/payment/verify. See
 * payment.controller.js fulfilCampaignBacking() and
 * util/creatorFunding.service.js for the money-moving logic — this file is
 * read/write for campaign metadata only, never a place coins change hands.
 */
"use strict";

const db = require("../../util/connection");
const creatorFundingService = require("../../util/creatorFunding.service");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

function cfg() {
  const s = global.settingJSON || {};
  return {
    enabled: s.creatorFundingEnabled !== false,
    minAccountAgeDays: num(s.creatorFundingMinAccountAgeDays, 90),
    maxDurationDays: num(s.creatorFundingMaxDurationDays, 30),
    platformFeePercentage: num(s.creatorFundingPlatformFeePercentage, 20),
    tiers: Array.isArray(s.creatorFundingTiers) ? s.creatorFundingTiers : [],
  };
}

// Highest tier the creator qualifies for, by subscriber count.
function resolveTier(totalSubscribers, tiers) {
  const sorted = [...tiers].sort((a, b) => num(b.minSubscribers) - num(a.minSubscribers));
  return sorted.find((t) => num(totalSubscribers) >= num(t.minSubscribers)) || null;
}

function accountAgeDaysOf(user) {
  if (!user.createdAt) return 0;
  return Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000);
}

exports.getEligibility = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(200).json({ status: false, message: "userId is required." });
    const user = await db.findById("users", userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found." });

    const c = cfg();
    if (!c.enabled) {
      return res.status(200).json({ status: true, eligible: false, reason: "Creator Funding is not currently enabled." });
    }

    const ageDays = accountAgeDaysOf(user);
    const tier = resolveTier(user.totalSubscribers, c.tiers);

    if (ageDays < c.minAccountAgeDays) {
      return res.status(200).json({
        status: true,
        eligible: false,
        reason: `Your channel needs to be at least ${c.minAccountAgeDays} days old (currently ${ageDays}).`,
        accountAgeDays: ageDays,
        minAccountAgeDays: c.minAccountAgeDays,
      });
    }
    if (!tier) {
      const minTier = [...c.tiers].sort((a, b) => num(a.minSubscribers) - num(b.minSubscribers))[0];
      return res.status(200).json({
        status: true,
        eligible: false,
        reason: `You need at least ${minTier?.minSubscribers || 0} subscribers to start a campaign.`,
        totalSubscribers: user.totalSubscribers || 0,
      });
    }

    return res.status(200).json({
      status: true,
      eligible: true,
      maxGoalInr: tier.maxGoalInr,
      maxDurationDays: c.maxDurationDays,
      platformFeePercentage: c.platformFeePercentage,
      totalSubscribers: user.totalSubscribers || 0,
    });
  } catch (error) {
    console.error("creatorFunding.getEligibility error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const { userId, title, description, goalAmountInr, durationDays, perks } = req.body || {};
    if (!userId || !title || !goalAmountInr || !durationDays) {
      return res.status(200).json({ status: false, message: "userId, title, goalAmountInr and durationDays are required." });
    }

    const user = await db.findById("users", userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found." });
    if (user.isBlock) return res.status(200).json({ status: false, message: "You are blocked by the admin." });

    const c = cfg();
    if (!c.enabled) return res.status(200).json({ status: false, message: "Creator Funding is not currently enabled." });

    if (accountAgeDaysOf(user) < c.minAccountAgeDays) {
      return res.status(200).json({ status: false, message: `Your channel needs to be at least ${c.minAccountAgeDays} days old.` });
    }
    const tier = resolveTier(user.totalSubscribers, c.tiers);
    if (!tier) {
      return res.status(200).json({ status: false, message: "You don't have enough subscribers to start a campaign yet." });
    }

    const goal = num(goalAmountInr);
    if (goal <= 0 || goal > num(tier.maxGoalInr)) {
      return res.status(200).json({ status: false, message: `Goal must be between ₹1 and ₹${tier.maxGoalInr} for your subscriber tier.` });
    }

    const duration = num(durationDays);
    if (duration <= 0 || duration > c.maxDurationDays) {
      return res.status(200).json({ status: false, message: `Duration must be between 1 and ${c.maxDurationDays} days.` });
    }

    // One active campaign at a time per creator — keeps things simple and
    // easy for fans to follow, and avoids a creator spreading demand thin
    // across several simultaneous asks.
    const existingActive = await db.findOne("creatorFundingCampaigns", { creatorId: String(userId), status: "ACTIVE" });
    if (existingActive) {
      return res.status(200).json({ status: false, message: "You already have an active campaign. Finish or cancel it first." });
    }

    const cleanPerks = Array.isArray(perks)
      ? perks
          .filter((p) => p && p.title)
          .map((p) => ({
            minAmountInr: num(p.minAmountInr, 0),
            title: String(p.title).trim().slice(0, 100),
            description: String(p.description || "").trim().slice(0, 300),
          }))
          .slice(0, 10)
      : [];

    const deadlineAt = new Date(Date.now() + duration * 86400000).toISOString();

    const campaign = await db.create("creatorFundingCampaigns", {
      creatorId: String(userId),
      title: String(title).trim().slice(0, 150),
      description: String(description || "").trim().slice(0, 2000),
      goalAmountInr: goal,
      raisedAmountInr: 0,
      perks: cleanPerks,
      deadlineAt,
      status: "ACTIVE",
      platformFeePercentage: c.platformFeePercentage,
      backerCount: 0,
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({ status: true, message: "Campaign created.", campaign });
  } catch (error) {
    console.error("creatorFunding.createCampaign error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.getActiveCampaigns = async (req, res) => {
  try {
    const limit = num(req.query.limit, 20);
    const rows = await db.find("creatorFundingCampaigns", { status: "ACTIVE" }, { sort: { createdAt: -1 }, limit });

    const creatorIds = [...new Set(rows.map((r) => r.creatorId).filter(Boolean))];
    const creators = creatorIds.length ? await Promise.all(creatorIds.map((id) => db.findById("users", id).catch(() => null))) : [];
    const byId = {};
    creators.forEach((u, i) => { if (u) byId[creatorIds[i]] = u; });

    const campaigns = rows.map((c) => ({
      ...c,
      creator: byId[c.creatorId]
        ? { _id: byId[c.creatorId]._id || byId[c.creatorId].id, fullName: byId[c.creatorId].fullName, image: byId[c.creatorId].image }
        : null,
      percentFunded: num(c.goalAmountInr) > 0 ? Math.min(100, Math.round((num(c.raisedAmountInr) / num(c.goalAmountInr)) * 100)) : 0,
    }));

    return res.status(200).json({ status: true, campaigns });
  } catch (error) {
    console.error("creatorFunding.getActiveCampaigns error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.getCampaignDetails = async (req, res) => {
  try {
    const campaignId = req.query.campaignId;
    if (!campaignId) return res.status(200).json({ status: false, message: "campaignId is required." });
    const campaign = await db.findById("creatorFundingCampaigns", campaignId);
    if (!campaign) return res.status(200).json({ status: false, message: "Campaign not found." });

    const creator = await db.findById("users", campaign.creatorId);
    const percentFunded = num(campaign.goalAmountInr) > 0 ? Math.min(100, Math.round((num(campaign.raisedAmountInr) / num(campaign.goalAmountInr)) * 100)) : 0;

    return res.status(200).json({
      status: true,
      campaign: {
        ...campaign,
        creator: creator ? { _id: creator._id || creator.id, fullName: creator.fullName, image: creator.image } : null,
        percentFunded,
      },
    });
  } catch (error) {
    console.error("creatorFunding.getCampaignDetails error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.getMyCampaigns = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(200).json({ status: false, message: "userId is required." });
    const rows = await db.find("creatorFundingCampaigns", { creatorId: String(userId) }, { sort: { createdAt: -1 } });
    return res.status(200).json({ status: true, campaigns: rows });
  } catch (error) {
    console.error("creatorFunding.getMyCampaigns error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.getMyBackings = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(200).json({ status: false, message: "userId is required." });
    const rows = await db.find("campaignBackings", { backerId: String(userId) }, { sort: { createdAt: -1 } });

    const campaignIds = [...new Set(rows.map((r) => r.campaignId).filter(Boolean))];
    const campaigns = campaignIds.length ? await Promise.all(campaignIds.map((id) => db.findById("creatorFundingCampaigns", id).catch(() => null))) : [];
    const byId = {};
    campaigns.forEach((c, i) => { if (c) byId[campaignIds[i]] = c; });

    const backings = rows.map((b) => ({
      ...b,
      campaignTitle: byId[b.campaignId]?.title || "",
      campaignStatus: byId[b.campaignId]?.status || "",
    }));

    return res.status(200).json({ status: true, backings });
  } catch (error) {
    console.error("creatorFunding.getMyBackings error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.cancelCampaign = async (req, res) => {
  try {
    const { userId, campaignId } = req.body || {};
    if (!userId || !campaignId) return res.status(200).json({ status: false, message: "userId and campaignId are required." });

    const campaign = await db.findById("creatorFundingCampaigns", campaignId);
    if (!campaign) return res.status(200).json({ status: false, message: "Campaign not found." });
    if (String(campaign.creatorId) !== String(userId)) {
      return res.status(200).json({ status: false, message: "You can only cancel your own campaign." });
    }
    if (campaign.status !== "ACTIVE") {
      return res.status(200).json({ status: false, message: "This campaign is already closed." });
    }

    const result = await creatorFundingService.refundCampaign(campaignId, "CANCELLED");
    return res.status(200).json({
      status: true,
      message: `Campaign cancelled. ${result?.refundedCount || 0} backer(s) refunded.`,
      campaign: result?.campaign,
    });
  } catch (error) {
    console.error("creatorFunding.cancelCampaign error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};
