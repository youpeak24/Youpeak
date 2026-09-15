"use strict";

const db = require("../../util/connection");
const creatorFundingService = require("../../util/creatorFunding.service");

// GET /admin/creatorFunding/list?status=ACTIVE
exports.list = async (req, res) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    const rows = await db.find("creatorFundingCampaigns", q, { sort: { createdAt: -1 }, limit: Number(req.query.limit) || 100 });

    const creatorIds = [...new Set(rows.map((r) => r.creatorId).filter(Boolean))];
    const creators = creatorIds.length ? await Promise.all(creatorIds.map((id) => db.findById("users", id).catch(() => null))) : [];
    const byId = {};
    creators.forEach((u, i) => { if (u) byId[creatorIds[i]] = u; });

    const campaigns = rows.map((c) => ({
      ...c,
      creator: byId[c.creatorId] ? { _id: byId[c.creatorId]._id || byId[c.creatorId].id, fullName: byId[c.creatorId].fullName, email: byId[c.creatorId].email } : null,
    }));

    return res.status(200).json({ status: true, total: campaigns.length, campaigns });
  } catch (error) {
    console.error("admin.creatorFunding.list error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// POST /admin/creatorFunding/forceCancel { campaignId, reason }
// Moderation escape hatch — e.g. a campaign violates guidelines. Refunds
// every backer, same as a creator's own cancellation.
exports.forceCancel = async (req, res) => {
  try {
    const { campaignId, reason } = req.body || {};
    if (!campaignId) return res.status(200).json({ status: false, message: "campaignId is required." });

    const campaign = await db.findById("creatorFundingCampaigns", campaignId);
    if (!campaign) return res.status(200).json({ status: false, message: "Campaign not found." });
    if (campaign.status !== "ACTIVE") return res.status(200).json({ status: false, message: "This campaign is already closed." });

    const result = await creatorFundingService.refundCampaign(campaignId, "CANCELLED");
    if (result?.campaign) {
      await db.update("creatorFundingCampaigns", campaignId, {
        cancelReason: reason || "Cancelled by admin.",
        cancelledBy: req.admin?._id || null,
      });
    }

    return res.status(200).json({
      status: true,
      message: `Campaign force-cancelled. ${result?.refundedCount || 0} backer(s) refunded.`,
    });
  } catch (error) {
    console.error("admin.creatorFunding.forceCancel error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};
