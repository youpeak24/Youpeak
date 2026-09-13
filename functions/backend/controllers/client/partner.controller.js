"use strict";
/**
 * Digital Partner Program — client endpoints.
 *   POST /client/partner/upgrade    -> alias for /client/payment/createOrder
 *                                      with purpose=digital_partner_license
 *   GET  /client/partner/dashboard  -> live metrics for an active partner
 *
 * Module A (payment -> role transition) lives in payment.controller.js
 * (fulfilDigitalPartnerLicense) since it shares the same gateway/webhook
 * plumbing as every other purchase. The Peak Partner ₹100+₹100 referral
 * engine (referral.service.js) is untouched by any of this — it stays open
 * to every user, partner or not.
 */
const db = require("../../util/connection");
const payment = require("./payment.controller");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// POST /client/partner/upgrade  { userId }
// Thin wrapper so the app has a dedicated, TRS-named endpoint; does the
// same thing as POST /client/payment/createOrder { purpose: "digital_partner_license" }.
exports.upgrade = async (req, res) => {
  req.body = { ...req.body, ...req.query, purpose: "digital_partner_license" };
  return payment.createOrder(req, res);
};

// GET /client/partner/dashboard?userId=...
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(200).json({ status: false, message: "userId is required." });

    const user = await db.findById("users", userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found." });

    const profile = await db.findOne("PartnerProfile", { userId });
    if (!user.isDigitalPartner || !profile) {
      return res.status(200).json({
        status: true,
        message: "Not a Digital Partner yet.",
        isDigitalPartner: false,
        licenseFeeInr: num((global.settingJSON || {}).digitalPartnerLicenseFeeINR, 25000),
      });
    }

    const referrals = await db.find("referralHistories", { referrerId: String(userId) });
    const activeReferrals = referrals.filter((r) => r.status !== "FLAGGED_SUSPICIOUS");
    const stage1Only = activeReferrals.filter((r) => r.stage1Completed && !r.stage2Completed);
    const bothStages = activeReferrals.filter((r) => r.stage1Completed && r.stage2Completed);

    const recent = activeReferrals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);
    const referredIds = [...new Set(recent.map((r) => r.referredUserId).filter(Boolean))];
    const referredUsers = referredIds.length
      ? await Promise.all(referredIds.map((id) => db.findById("users", id).catch(() => null)))
      : [];
    const nameById = {};
    referredUsers.forEach((u, i) => { if (u) nameById[referredIds[i]] = u.fullName || u.nickName || "Youpeak User"; });

    return res.status(200).json({
      status: true,
      message: "Partner dashboard.",
      isDigitalPartner: true,
      partnerStatus: user.partnerStatus || "ACTIVE",
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
      recentReferrals: recent.map((r) => ({
        referredUserId: r.referredUserId,
        referredUserName: nameById[r.referredUserId] || "Youpeak User",
        stage1Completed: !!r.stage1Completed,
        stage2Completed: !!r.stage2Completed,
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("partner.getDashboard error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
