/**
 * YouPeak – Pure Firestore Admin Video Promotion Controller
 */

"use strict";

const db = require("../../util/connection");

exports.index = async (req, res) => {
  try {
    const status = req.query.status;
    let query = {};
    if (status && status !== "All") {
      query.status = status;
    }

    const campaigns = await db.find("videoPromotions", query);

    const enriched = await Promise.all(
      campaigns.map(async (c) => {
        const user = c.userId ? await db.findById("users", c.userId) : null;
        const video = c.videoId ? await db.findById("videos", c.videoId) : null;
        return {
          ...c,
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

exports.updateCampaignStatus = async (req, res) => {
  try {
    const { campaignId, action, rejectionReason } = req.body || {};

    if (!campaignId || !["approve", "reject"].includes(action)) {
      return res.status(200).json({ status: false, message: "Invalid details!" });
    }

    const campaign = await db.findById("videoPromotions", campaignId);
    if (!campaign) {
      return res.status(200).json({ status: false, message: "Campaign not found!" });
    }

    const updates = {};
    if (action === "approve") {
      const startedAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (campaign.planDurationDays || 1));

      updates.status = "active";
      updates.approvedByAdmin = true;
      updates.approvedAt = startedAt.toISOString();
      updates.startedAt = startedAt.toISOString();
      updates.expiresAt = expiresAt.toISOString();

      if (campaign.videoId) {
        const vId = campaign.videoId._id || campaign.videoId.id || campaign.videoId;
        await db.update("videos", vId, { isPromoted: true });
      }
    } else if (action === "reject") {
      updates.status = "rejected";
      updates.rejectionReason = rejectionReason || "Rejected by Admin";
    }

    updates.updatedAt = new Date().toISOString();
    const updatedCampaign = await db.update("videoPromotions", campaignId, updates);

    return res.status(200).json({
      status: true,
      message: `Campaign ${action}d successfully.`,
      campaign: updatedCampaign,
    });
  } catch (error) {
    console.error("Error updating campaign status:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
