/**
 * YouPeak – Pure Firestore Client Video Promotion Controller
 * Per DOC-20260826-WA0214 (Creator Growth & Promotion Plans). The rate card
 * itself is admin-editable (settings.promotionPlans, Platform Config →
 * Video Promotion Rate Card) — see util/platformConfig.js.
 */

"use strict";

const db = require("../../util/connection");
const { getPromotionPlans } = require("../../util/platformConfig");

// Campaign creation moved to payment.controller.js (purpose: "video_promotion")
// — this used to accept a client-supplied paymentGatewayRef and activate the
// campaign on the spot, no verification at all: any caller could invent a
// string and get free promotion. Real purchases now go through the same
// Razorpay createOrder -> verify signature-checked pipeline every other paid
// feature in the app uses (see fulfilVideoPromotion there). This file keeps
// only the read-only endpoints.

exports.getPlans = async (req, res) => {
  const plans = getPromotionPlans({ activeOnly: true }).map((p) => ({
    planName: p.name,
    priceINR: p.priceINR,
    durationDays: p.durationDays,
    impressionsMin: p.impressionsMin,
    impressionsMax: p.impressionsMax,
  }));
  return res.status(200).json({ status: true, message: "Promotion plans fetched.", plans });
};

exports.getUserCampaigns = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(200).json({ status: false, message: "User ID required." });
    }

    const campaigns = await db.find("videoPromotions", { userId });
    return res.status(200).json({
      status: true,
      message: "User campaigns fetched successfully.",
      campaigns,
    });
  } catch (error) {
    console.error("Error fetching user campaigns:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
