/**
 * YouPeak – Pure Firestore Client Video Promotion Controller
 * Per DOC-20260826-WA0214 (Creator Growth & Promotion Plans):
 * 6 Plans: Starter (₹49/1d), Basic (₹99/2d), Pro Starter (₹199/2d), Boost (₹249/4d), Weekly Mega (₹1,000/7d), Monthly Pro (₹3,000/30d)
 */

"use strict";

const db = require("../../util/connection");

const PROMOTION_PLANS = {
  "Starter Plan": { priceINR: 49, durationDays: 1 },
  "Basic Plan": { priceINR: 99, durationDays: 2 },
  "Pro Starter": { priceINR: 199, durationDays: 2 },
  "Boost Plan": { priceINR: 249, durationDays: 4 },
  "Weekly Mega": { priceINR: 1000, durationDays: 7 },
  "Monthly Pro": { priceINR: 3000, durationDays: 30 },
};

// Campaign creation moved to payment.controller.js (purpose: "video_promotion")
// — this used to accept a client-supplied paymentGatewayRef and activate the
// campaign on the spot, no verification at all: any caller could invent a
// string and get free promotion. Real purchases now go through the same
// Razorpay createOrder -> verify signature-checked pipeline every other paid
// feature in the app uses (see fulfilVideoPromotion there). This file keeps
// only the read-only endpoints.

exports.getPlans = async (req, res) => {
  const plans = Object.entries(PROMOTION_PLANS).map(([planName, p]) => ({ planName, ...p }));
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

module.exports.PROMOTION_PLANS = PROMOTION_PLANS;
