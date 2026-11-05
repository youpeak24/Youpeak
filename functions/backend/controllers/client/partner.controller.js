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
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
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
    // TRS §5: the dashboard shows each referred user's watch-time progress
    // toward Stage 2 (lifetime watch minutes, users.totalWatchTime).
    const watchMinutesById = {};
    referredUsers.forEach((u, i) => { if (u) watchMinutesById[referredIds[i]] = num(u.totalWatchTime); });
    const stage2Minutes = num((global.settingJSON || {}).referralStage2WatchMinutes, 100);

    // PartnerProfile.totalEarnings is never written; the referral ledger is
    // the source of truth (coins released to the wallet, 100 coins = ₹1).
    const releasedCoins = referrals.reduce((sum, r) => sum + num(r.totalRewardCoinsGiven), 0);

    // Web Portal login — see fulfilDigitalPartnerLicense in
    // payment.controller.js for why this exists. While the account is
    // still on its auto-generated password (isDefaultPassword), regenerate
    // a fresh one on every dashboard fetch so a forgotten/lost password is
    // always recoverable from inside the app instead of a dead end (the
    // admin panel's own forgotPassword is a non-functional stub). Once the
    // partner sets their own password via the portal, this stops firing.
    let portalCredentials = null;
    try {
      const portalAdmin = await db.findOne("admins", { partnerUserId: String(userId) });
      if (portalAdmin && portalAdmin.isDefaultPassword) {
        const freshPassword = crypto.randomBytes(9).toString("hex");
        await db.update("admins", portalAdmin._id || portalAdmin.id, {
          password: bcrypt.hashSync(freshPassword, 10),
        });
        portalCredentials = { email: portalAdmin.email, password: freshPassword, isTemporary: true };
      } else if (portalAdmin) {
        portalCredentials = { email: portalAdmin.email, isTemporary: false };
      }
    } catch (e) {
      console.error("partner.getDashboard portal credential refresh failed:", e.message);
    }

    return res.status(200).json({
      status: true,
      message: "Partner dashboard.",
      isDigitalPartner: true,
      partnerStatus: user.partnerStatus || "ACTIVE",
      referralCode: user.referralCode || "",
      portalCredentials,
      wallet: {
        coinBalance: num(user.coin),
        adCreditsBalance: num(profile.adCreditsBalance),
      },
      referrals: {
        total: activeReferrals.length,
        awaitingWatchTimeMilestone: stage1Only.length,
        completedBothStages: bothStages.length,
        flagged: referrals.length - activeReferrals.length,
        totalEarningsInr: Number((releasedCoins / 100).toFixed(2)),
        pendingInr: Number((num(user.pendingReferralCoin) / 100).toFixed(2)),
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
        watchMinutes: watchMinutesById[r.referredUserId] ?? 0,
        stage2TargetMinutes: stage2Minutes,
        stage2DeadlineAt: r.stage2DeadlineAt || null,
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("partner.getDashboard error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
