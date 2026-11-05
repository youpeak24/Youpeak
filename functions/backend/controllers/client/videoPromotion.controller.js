/**
 * YouPeak – client Video Promotion API (DOC-20260826-WA0214 rate card).
 *
 * Buying goes through payment.controller.js (purpose "video_promotion"):
 * server-priced order → Razorpay → signature/webhook-verified payment →
 * one-time campaign activation. This file serves the catalogue, the caller's
 * own campaigns, and delivery (placements + counted impressions); see
 * util/promotion.service.js for what a promotion delivers and how
 * impressions are counted.
 */
"use strict";

const db = require("../../util/connection");
const visibility = require("../../util/videoVisibility");
const promotion = require("../../util/promotion.service");

const perThousand = (price, impressions) => (impressions > 0 ? Math.round((price / impressions) * 1000 * 100) / 100 : null);

// GET client/videoPromotion/plans — the plans on sale, as the server prices them.
exports.getPlans = async (req, res) => {
  const plans = promotion.catalogue({ activeOnly: true }).map((p) => ({
    ...p,
    planName: p.name, // older app versions read planName
    // Estimated cost per 1,000 impressions across the estimate range
    // (low = at the upper estimate, high = at the lower estimate).
    costPer1kLow: perThousand(p.priceINR, p.impressionsMax),
    costPer1kHigh: perThousand(p.priceINR, p.impressionsMin),
  }));
  return res.status(200).json({ status: true, message: "Promotion plans fetched.", plans });
};

// GET client/videoPromotion/eligibleVideos — the caller's own videos and whether each can be promoted.
exports.getEligibleVideos = async (req, res) => {
  try {
    const userId = req.appUserId;
    const videos = (await db.find("videos", { userId: String(userId) }))
      .filter((v) => v.isActive !== false)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, 100);
    const out = [];
    for (const v of videos) {
      const reason = await promotion.ineligibility(v, userId);
      out.push({ _id: String(v._id || v.id), title: v.title || "", videoImage: v.videoImage || "", videoType: Number(v.videoType) || 1, eligible: !reason, reason });
    }
    return res.status(200).json({ status: true, videos: out });
  } catch (error) {
    console.error("eligibleVideos error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// GET client/videoPromotion/ — the caller's own campaigns (bindAppUser: the token's user only).
exports.getUserCampaigns = async (req, res) => {
  try {
    const userId = req.appUserId || req.query.userId;
    if (!userId) return res.status(200).json({ status: false, message: "User ID required." });
    const rows = (await db.find(promotion.CAMPAIGNS, { userId: String(userId) }))
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    const campaigns = await Promise.all(rows.map((c) => promotion.present(c)));
    return res.status(200).json({ status: true, message: "User campaigns fetched successfully.", campaigns });
  } catch (error) {
    console.error("Error fetching user campaigns:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// GET client/videoPromotion/campaign?campaignId= — one of the caller's campaigns with its history.
exports.getCampaign = async (req, res) => {
  try {
    const id = String(req.query.campaignId || "");
    const c = id ? await db.findById(promotion.CAMPAIGNS, id) : null;
    if (!c || String(c.userId) !== String(req.appUserId)) return res.status(200).json({ status: false, message: "Campaign not found." });
    const events = (await db.find(promotion.EVENTS, { campaignId: id }))
      .sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")))
      .map((e) => ({ type: e.type, at: e.at, by: e.by === "admin" ? "YouPeak" : e.by, reason: e.reason || null }));
    return res.status(200).json({ status: true, campaign: await promotion.present(c), events });
  } catch (error) {
    console.error("getCampaign error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// Settle ended campaigns (stored status, video.isPromoted) at most every 5 min
// per instance; what's served is already filtered by effective status.
let lastSweep = 0;
function sweepEnded() {
  if (Date.now() - lastSweep < 5 * 60 * 1000) return;
  lastSweep = Date.now();
  promotion.expireDue().catch((e) => console.error("promotion expireDue:", e.message));
}

// GET client/videoPromotion/placements — promoted videos to show in the Home slot.
exports.getPlacements = async (req, res) => {
  try {
    sweepEnded();
    const limit = Math.min(3, Math.max(1, Number(req.query.limit) || 2));
    const items = await promotion.placements(req.appUserId || null, { limit });
    return res.status(200).json({ status: true, placements: items.map((p) => ({ ...p, video: visibility.stripInternal(p.video) })) });
  } catch (error) {
    console.error("placements error:", error);
    return res.status(200).json({ status: true, placements: [] });
  }
};

// POST client/videoPromotion/impression { placementToken } — count one impression (server policy).
exports.recordImpression = async (req, res) => {
  try {
    const token = (req.body && req.body.placementToken) || "";
    const r = await promotion.recordImpression(req.appUserId, token);
    return res.status(200).json({ status: r.ok, counted: r.counted, reason: r.reason || null });
  } catch (error) {
    console.error("impression error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
