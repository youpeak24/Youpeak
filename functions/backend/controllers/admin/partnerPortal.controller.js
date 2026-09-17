/**
 * Digital Partner Web Portal — endpoints for a DIGITAL_PARTNER_ADMIN login
 * (see models/admin.model.js, controllers/client/payment.controller.js
 * fulfilDigitalPartnerLicense). Mirrors the Agency/District Partner web
 * portal pattern (agencyDashboard/agencyReport), scoped by req.partnerUserId
 * (set in middleware/checkScope.middleware.js from the admin JWT) instead of
 * req.agencyId.
 *
 * A DIGITAL_PARTNER_ADMIN account is NOT a separate person/entity — it's a
 * second login for the same person who already has a Youpeak app account,
 * so every endpoint here operates on that SAME underlying User document
 * (isDigitalPartner / partnerStatus / referralCode / coin) and the SAME
 * localBusinessAds collection the app's own client endpoints use — this is
 * an alternate front door, not a separate dataset.
 */
"use strict";

const db = require("../../util/connection");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// GET /admin/partnerPortal/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.partnerUserId;
    if (!userId) return res.status(403).json({ status: false, message: "Not a Digital Partner portal account." });

    const user = await db.findById("users", userId);
    if (!user) return res.status(200).json({ status: false, message: "Linked user account not found." });

    const profile = await db.findOne("PartnerProfile", { userId: String(userId) });
    if (!user.isDigitalPartner || !profile) {
      return res.status(200).json({ status: true, isDigitalPartner: false, message: "Partner profile not found." });
    }

    const referrals = await db.find("referralHistories", { referrerId: String(userId) });
    const activeReferrals = referrals.filter((r) => r.status !== "FLAGGED_SUSPICIOUS");
    const stage1Only = activeReferrals.filter((r) => r.stage1Completed && !r.stage2Completed);
    const bothStages = activeReferrals.filter((r) => r.stage1Completed && r.stage2Completed);

    return res.status(200).json({
      status: true,
      message: "Partner dashboard.",
      isDigitalPartner: true,
      partnerStatus: user.partnerStatus || "ACTIVE",
      fullName: user.fullName || "",
      email: user.email || "",
      referralCode: user.referralCode || "",
      wallet: {
        coinBalance: num(user.coin),
        adCreditsBalance: num(profile.adCreditsBalance),
      },
      referrals: {
        total: activeReferrals.length,
        awaitingWatchTimeMilestone: stage1Only.length,
        completedBothStages: bothStages.length,
        flagged: referrals.length - activeReferrals.length,
        totalEarningsInr: num(profile.totalEarnings),
      },
      license: {
        feePaidInr: num(profile.licenseFeePaid),
        activatedAt: profile.activatedAt || null,
      },
    });
  } catch (error) {
    console.error("partnerPortal.getDashboard error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// POST /admin/partnerPortal/localBusinessAd/submit
// Same validation as client/localBusinessAd.controller.js submit() — userId
// comes from the authenticated portal session (req.partnerUserId) instead
// of the request body, since there's no separate identity to pass here.
exports.submitLocalBusinessAd = async (req, res) => {
  try {
    const userId = req.partnerUserId;
    if (!userId) return res.status(403).json({ status: false, message: "Not a Digital Partner portal account." });

    const b = req.body || {};
    const { businessName, creativeUrl, adBudgetInr, durationDays } = b;
    if (!businessName || !creativeUrl || !adBudgetInr || !durationDays) {
      return res.status(200).json({ status: false, message: "businessName, creativeUrl, adBudgetInr and durationDays are required." });
    }

    const user = await db.findById("users", userId);
    if (!user) return res.status(200).json({ status: false, message: "Linked user account not found." });
    if (user.isBlock) return res.status(200).json({ status: false, message: "This account is blocked by the admin." });
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
    console.error("partnerPortal.submitLocalBusinessAd error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// GET /admin/partnerPortal/localBusinessAd/myAds
exports.getMyLocalBusinessAds = async (req, res) => {
  try {
    const userId = req.partnerUserId;
    if (!userId) return res.status(403).json({ status: false, message: "Not a Digital Partner portal account." });
    const rows = await db.find("localBusinessAds", { submittedByUserId: String(userId) }, { sort: { createdAt: -1 } });
    return res.status(200).json({ status: true, ads: rows });
  } catch (error) {
    console.error("partnerPortal.getMyLocalBusinessAds error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};
