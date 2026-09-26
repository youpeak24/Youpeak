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
const net = require("../../util/partnerNetwork.service");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// GET /admin/partnerPortal/dashboard
// Same partner data the franchise and super admin see (partnerNetwork.service),
// plus the live referral reward rules so the portal can explain the workflow.
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.partnerUserId;
    if (!userId) return res.status(403).json({ status: false, message: "Not a Digital Partner portal account." });

    const detail = await net.partnerDetail(userId);
    if (!detail.isDigitalPartner) {
      return res.status(200).json({ status: true, isDigitalPartner: false, message: "Partner profile not found." });
    }

    return res.status(200).json({
      status: true,
      message: "Partner dashboard.",
      ...detail,
      rules: net.referralRules(),
    });
  } catch (error) {
    if (error instanceof net.PartnerNetworkError) {
      return res.status(200).json({ status: false, message: error.message });
    }
    console.error("partnerPortal.getDashboard error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ── Wallet & withdrawals ─────────────────────────────────────────────────────
// The partner's earnings sit in their normal app wallet, so the portal runs
// the app's OWN withdrawal handlers (client/withDrawalRequest.controller.js,
// client/withdraw.controller.js) — same minimums, conversion rate, atomic
// debit and pending-request rules — with the userId taken from the portal
// session, never from the request.
function invoke(handler, req) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(body) { resolve({ httpStatus: this.statusCode, body }); return this; },
    };
    Promise.resolve(handler(req, res)).catch(reject);
  });
}

const withdrawalCtl = () => require("../client/withDrawalRequest.controller");
const withdrawMethodCtl = () => require("../client/withdraw.controller");

// GET /admin/partnerPortal/wallet
exports.getWallet = async (req, res) => {
  try {
    const userId = req.partnerUserId;
    if (!userId) return res.status(403).json({ status: false, message: "Not a Digital Partner portal account." });
    const [settings, methods, history] = await Promise.all([
      invoke(withdrawalCtl().fetchSettingDetails, { query: { userId: String(userId) } }),
      invoke(withdrawMethodCtl().withdrawList, { query: {} }),
      invoke(withdrawalCtl().getWithdrawRequests, { query: { userId: String(userId), startDate: "All", endDate: "All", start: 1, limit: 20 } }),
    ]);
    if (!settings.body.status) return res.status(200).json({ status: false, message: settings.body.message || "Wallet unavailable." });
    const s = global.settingJSON || {};
    return res.status(200).json({
      status: true,
      message: "Wallet.",
      wallet: settings.body.data,
      firstWithdrawalMinimumInr: num(s.firstWithdrawalMinimumInr, 100),
      methods: (methods.body.withdrawMethod || []).map((m) => ({
        _id: String(m._id || m.id),
        name: m.name,
        image: m.image || "",
        details: Array.isArray(m.details) ? m.details : [],
      })),
      requests: history.body.status ? history.body.WithDrawRequests || [] : [],
    });
  } catch (error) {
    console.error("partnerPortal.getWallet error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// POST /admin/partnerPortal/wallet/convert  { coin }
exports.convertCoins = async (req, res) => {
  try {
    const userId = req.partnerUserId;
    if (!userId) return res.status(403).json({ status: false, message: "Not a Digital Partner portal account." });
    const out = await invoke(withdrawalCtl().coinToAmountConverter, { query: { userId: String(userId), coin: String(req.body?.coin ?? "") } });
    return res.status(out.httpStatus).json(out.body);
  } catch (error) {
    console.error("partnerPortal.convertCoins error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// POST /admin/partnerPortal/wallet/withdraw  { requestAmount, paymentGateway, paymentDetails: ["Field:value"] }
exports.requestWithdrawal = async (req, res) => {
  try {
    const userId = req.partnerUserId;
    if (!userId) return res.status(403).json({ status: false, message: "Not a Digital Partner portal account." });
    const b = req.body || {};
    const out = await invoke(withdrawalCtl().createWithdrawRequest, {
      body: {
        userId: String(userId),
        requestAmount: b.requestAmount,
        paymentGateway: String(b.paymentGateway || ""),
        paymentDetails: Array.isArray(b.paymentDetails) ? b.paymentDetails.map((d) => String(d).slice(0, 200)) : [],
      },
    });
    return res.status(out.httpStatus).json(out.body);
  } catch (error) {
    console.error("partnerPortal.requestWithdrawal error:", error);
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
