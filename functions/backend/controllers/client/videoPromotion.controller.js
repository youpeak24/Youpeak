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

exports.createCampaign = async (req, res) => {
  try {
    const { userId, videoId, planName, paymentGatewayRef } = req.body || {};

    if (!userId || !videoId || !planName) {
      return res.status(200).json({ status: false, message: "Missing required fields!" });
    }

    if (!PROMOTION_PLANS[planName]) {
      return res.status(200).json({ status: false, message: "Invalid plan name selected." });
    }

    const user = await db.findById("users", userId);
    if (!user || user.isBlock) {
      return res.status(200).json({ status: false, message: "User not found or blocked." });
    }

    const video = await db.findById("videos", videoId);
    if (!video) {
      return res.status(200).json({ status: false, message: "Video not found." });
    }

    const videoUserId = video.userId ? (video.userId._id || video.userId.id || video.userId).toString() : "";
    if (videoUserId !== userId.toString()) {
      return res.status(200).json({ status: false, message: "You can only promote your own videos." });
    }

    const planDetails = PROMOTION_PLANS[planName];
    const status = paymentGatewayRef ? "active" : "pending_payment";
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planDetails.durationDays);

    const campaignData = {
      userId,
      videoId,
      planName,
      planPriceINR: planDetails.priceINR,
      planDurationDays: planDetails.durationDays,
      paymentGatewayRef: paymentGatewayRef || null,
      status,
      startedAt: status === "active" ? now.toISOString() : null,
      expiresAt: status === "active" ? expiresAt.toISOString() : null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const campaign = await db.create("videoPromotions", campaignData);

    if (status === "active") {
      await db.update("videos", videoId, { isPromoted: true });
    }

    return res.status(200).json({
      status: true,
      message: "Promotion campaign created successfully.",
      campaign,
    });
  } catch (error) {
    console.error("Error creating video promotion campaign:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
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
