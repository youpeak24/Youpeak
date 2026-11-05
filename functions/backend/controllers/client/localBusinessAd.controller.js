/**
 * Local Business Ads — client endpoints.
 *   POST /client/localBusinessAd/submit               -> Digital Partner sources a local ad
 *   GET  /client/localBusinessAd/getMyAds              -> a partner's own submissions
 *   GET  /client/localBusinessAd/getActiveAdsForRegion -> ads to actually show in the feed
 *   POST /client/localBusinessAd/recordImpression
 *   POST /client/localBusinessAd/recordClick
 *
 * No commission is credited here — that happens once admin approves the
 * creative (see controllers/admin/localBusinessAd.controller.js), so a
 * partner can't just submit anything and get paid without review.
 */
"use strict";

const db = require("../../util/connection");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

exports.submit = async (req, res) => {
  try {
    const b = req.body || {};
    const { userId, businessName, creativeUrl, adBudgetInr, durationDays } = b;
    if (!userId || !businessName || !creativeUrl || !adBudgetInr || !durationDays) {
      return res.status(200).json({ status: false, message: "userId, businessName, creativeUrl, adBudgetInr and durationDays are required." });
    }

    const user = await db.findById("users", userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found." });
    if (user.isBlock) return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    if (!user.isDigitalPartner || user.partnerStatus !== "ACTIVE") {
      return res.status(200).json({ status: false, message: "Only active Digital Partners can source local business ads." });
    }

    const budget = num(adBudgetInr);
    if (budget <= 0) return res.status(200).json({ status: false, message: "adBudgetInr must be greater than 0." });
    const duration = num(durationDays);
    if (duration <= 0 || duration > 90) return res.status(200).json({ status: false, message: "durationDays must be between 1 and 90." });

    const ad = await db.create("localBusinessAds", {
      submittedByUserId: String(userId),
      businessName: String(businessName).trim().slice(0, 150),
      businessContact: String(b.businessContact || "").trim().slice(0, 100),
      category: String(b.category || "").trim().slice(0, 60),
      creativeUrl: String(creativeUrl).trim(),
      creativeType: b.creativeType === "video" ? "video" : "image",
      targetState: String(b.targetState || user.state || "").trim(),
      targetDistrict: String(b.targetDistrict || user.district || "").trim(),
      adBudgetInr: budget,
      durationDays: duration,
      status: "PENDING_REVIEW",
      impressionCount: 0,
      clickCount: 0,
    });

    return res.status(200).json({ status: true, message: "Ad submitted for review.", ad });
  } catch (error) {
    console.error("localBusinessAd.submit error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.getMyAds = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(200).json({ status: false, message: "userId is required." });
    const rows = await db.find("localBusinessAds", { submittedByUserId: String(userId) }, { sort: { createdAt: -1 } });
    return res.status(200).json({ status: true, ads: rows });
  } catch (error) {
    console.error("localBusinessAd.getMyAds error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.getActiveAdsForRegion = async (req, res) => {
  try {
    const { state, district } = req.query;
    const now = Date.now();
    const rows = await db.find("localBusinessAds", { status: "ACTIVE" }, { sort: { createdAt: -1 }, limit: 50 });

    const live = rows.filter((ad) => {
      if (district && ad.targetDistrict && ad.targetDistrict !== district) return false;
      if (state && ad.targetState && ad.targetState !== state) return false;
      if (ad.endAt && new Date(ad.endAt).getTime() < now) return false;
      return true;
    });

    return res.status(200).json({
      status: true,
      ads: live.map((ad) => ({
        _id: ad._id || ad.id,
        businessName: ad.businessName,
        creativeUrl: ad.creativeUrl,
        creativeType: ad.creativeType,
        category: ad.category,
      })),
    });
  } catch (error) {
    console.error("localBusinessAd.getActiveAdsForRegion error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.recordImpression = async (req, res) => {
  try {
    const adId = req.body?.adId || req.query.adId;
    if (!adId) return res.status(200).json({ status: false, message: "adId is required." });
    const ad = await db.findById("localBusinessAds", adId);
    if (!ad || ad.status !== "ACTIVE") return res.status(200).json({ status: false });
    await db.incrementFields("localBusinessAds", adId, { impressionCount: 1 });
    return res.status(200).json({ status: true });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.recordClick = async (req, res) => {
  try {
    const adId = req.body?.adId || req.query.adId;
    if (!adId) return res.status(200).json({ status: false, message: "adId is required." });
    const ad = await db.findById("localBusinessAds", adId);
    if (!ad || ad.status !== "ACTIVE") return res.status(200).json({ status: false });
    await db.incrementFields("localBusinessAds", adId, { clickCount: 1 });
    return res.status(200).json({ status: true });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};
