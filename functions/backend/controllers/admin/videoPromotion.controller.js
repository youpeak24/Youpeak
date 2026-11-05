/**
 * YouPeak – Admin Video Promotion Controller
 *
 * Campaigns are activated only by a verified payment (payment.controller.js).
 * Admin actions here never restart a campaign's dates or touch its price:
 *   review  – mark a running campaign as checked by YouPeak (no state change)
 *   pause   – stop delivery; the paused time is added back on resume
 *   resume  – continue a paused campaign
 *   reject  – take a campaign down (reason required). Refunds are a manual
 *             decision outside this tool; the response says so.
 * Every action is written to videoPromotionEvents.
 */

"use strict";

const db = require("../../util/connection");
const promotion = require("../../util/promotion.service");

const adminRef = (req) => (req.admin ? String(req.admin._id || req.admin.id || "admin") : "admin");

exports.index = async (req, res) => {
  try {
    const status = req.query.status;
    const now = Date.now();
    const campaigns = (await db.find(promotion.CAMPAIGNS, {}))
      .map((c) => ({ ...c, effectiveStatus: promotion.effectiveStatus(c, now) }))
      .filter((c) => !status || status === "All" || c.effectiveStatus === status || c.status === status)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    const enriched = await Promise.all(
      campaigns.map(async (c) => {
        const user = c.userId ? await db.findById("users", c.userId) : null;
        const video = c.videoId ? await db.findById("videos", c.videoId) : null;
        return {
          ...c,
          plan: c.planSnapshot || null,
          impressionsDelivered: Number(c.impressionsDelivered) || 0,
          userId: user ? { _id: user._id || user.id, fullName: user.fullName, email: user.email, image: user.image } : c.userId,
          videoId: video ? { _id: video._id || video.id, title: video.title || video.caption, videoUrl: video.videoUrl, videoImage: video.videoImage } : c.videoId,
        };
      })
    );

    return res.status(200).json({
      status: true,
      message: "Campaigns fetched successfully.",
      total: enriched.length,
      campaigns: enriched,
    });
  } catch (error) {
    console.error("Error fetching admin campaigns:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

exports.events = async (req, res) => {
  try {
    const id = String(req.query.campaignId || "");
    if (!id) return res.status(200).json({ status: false, message: "campaignId is required." });
    const events = (await db.find(promotion.EVENTS, { campaignId: id })).sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
    return res.status(200).json({ status: true, events });
  } catch (error) {
    console.error("Error fetching campaign events:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

const ACTIONS = ["approve", "review", "pause", "resume", "reject"];

exports.updateCampaignStatus = async (req, res) => {
  try {
    const { campaignId, rejectionReason } = req.body || {};
    let action = req.body && req.body.action;
    if (action === "approve") action = "review"; // older admin builds

    if (!campaignId || !ACTIONS.includes(action)) {
      return res.status(200).json({ status: false, message: "Invalid details!" });
    }

    const campaign = await db.findById(promotion.CAMPAIGNS, campaignId);
    if (!campaign) {
      return res.status(200).json({ status: false, message: "Campaign not found!" });
    }

    const now = new Date();
    const eff = promotion.effectiveStatus(campaign, now.getTime());
    const paid = campaign.paymentStatus === "paid" || (campaign.status === "active" && campaign.paymentGatewayRef);
    const updates = { updatedAt: now.toISOString() };
    let message;
    let note = null;

    if (action === "review") {
      if (!paid) return res.status(200).json({ status: false, message: "This campaign has no verified payment, so it can't be activated or approved." });
      if (eff === "rejected") return res.status(200).json({ status: false, message: "This campaign was taken down." });
      updates.approvedByAdmin = true;
      updates.approvedAt = now.toISOString();
      message = "Campaign marked as reviewed.";
    } else if (action === "pause") {
      if (eff !== "active" && eff !== "scheduled") return res.status(200).json({ status: false, message: `A ${eff} campaign can't be paused.` });
      updates.status = "paused";
      updates.pausedAt = now.toISOString();
      message = "Campaign paused.";
    } else if (action === "resume") {
      if (campaign.status !== "paused") return res.status(200).json({ status: false, message: "Only a paused campaign can be resumed." });
      // Give back the paused time so the buyer still gets the days they paid for.
      const pausedMs = Math.max(0, now.getTime() - (Date.parse(campaign.pausedAt || "") || now.getTime()));
      const end = Date.parse(campaign.expiresAt || "");
      updates.status = "active";
      updates.pausedAt = null;
      if (Number.isFinite(end)) updates.expiresAt = new Date(end + pausedMs).toISOString();
      message = "Campaign resumed.";
    } else if (action === "reject") {
      const reason = String(rejectionReason || "").trim();
      if (!reason) return res.status(200).json({ status: false, message: "A reason is required to take a campaign down." });
      if (eff === "rejected") return res.status(200).json({ status: false, message: "This campaign was already taken down." });
      updates.status = "rejected";
      updates.rejectionReason = reason.slice(0, 300);
      updates.endedAt = now.toISOString();
      message = "Campaign taken down.";
      if (paid) note = "This campaign was paid for. No refund has been issued — refunds are handled manually by the owner.";
    }

    const updatedCampaign = await db.update(promotion.CAMPAIGNS, campaignId, updates);
    await promotion.logEvent(campaignId, action === "reject" ? "rejected" : action === "review" ? "reviewed" : action === "pause" ? "paused" : "resumed", "admin", {
      adminId: adminRef(req),
      ...(updates.rejectionReason ? { reason: updates.rejectionReason } : {}),
    });

    // Keep the video's "promoted" flag in line with what's actually running.
    if (campaign.videoId && (action === "pause" || action === "reject" || action === "resume")) {
      const vId = String(campaign.videoId._id || campaign.videoId.id || campaign.videoId);
      const running = await promotion.activeCampaignFor(vId);
      await db.update("videos", vId, { isPromoted: !!running }).catch(() => {});
    }

    return res.status(200).json({ status: true, message, note, campaign: updatedCampaign });
  } catch (error) {
    console.error("Error updating campaign status:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
