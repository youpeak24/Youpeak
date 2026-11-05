/**
 * Super-admin view of every Digital Partner across all District Franchises.
 * Partners are created only by their District Franchise
 * (controllers/admin/franchisePortal.controller.js) — the super admin can
 * see, suspend, re-assign and reset portal logins, but deliberately not
 * create. Everything except report() (role-scoped) is SUPER_ADMIN only,
 * checked explicitly here.
 */
"use strict";

const db = require("../../util/connection");
const { regeneratePortalPassword } = require("../../util/digitalPartner.service");
const net = require("../../util/partnerNetwork.service");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

function requireSuperAdmin(req, res) {
  if (req.adminRole !== "SUPER_ADMIN") {
    res.status(403).json({ status: false, message: "Only a super admin can manage Digital Partners." });
    return false;
  }
  return true;
}

function fail(res, error, fallback) {
  if (error instanceof net.PartnerNetworkError) {
    return res.status(200).json({ status: false, message: error.message });
  }
  console.error(fallback, error);
  return res.status(500).json({ status: false, message: error.message || fallback });
}

// GET /admin/digitalPartner/list?agencyId=&status=&search=
//   agencyId=unassigned lists partners not linked to any franchise.
exports.list = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const q = req.query || {};
    let partners = await net.listPartnerRows({ agencyId: q.agencyId && q.agencyId !== "unassigned" ? q.agencyId : null });
    if (q.agencyId === "unassigned") partners = partners.filter((p) => !p.agencyId);
    if (q.status) partners = partners.filter((p) => p.partnerStatus === q.status);
    const search = String(q.search || "").trim().toLowerCase();
    if (search) {
      partners = partners.filter((p) =>
        [p.fullName, p.email, p.mobileNumber, p.referralCode, p.uniqueId, p.agencyName].some((v) => String(v || "").toLowerCase().includes(search))
      );
    }
    return res.status(200).json({ status: true, message: "Digital Partners fetched.", summary: net.summarizePartners(partners), partners });
  } catch (error) {
    return fail(res, error, "digitalPartner.list error:");
  }
};

// GET /admin/digitalPartner/detail?userId=
exports.detail = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const detail = await net.partnerDetail(req.query.userId, { includeContact: true });
    return res.status(200).json({ status: true, message: "Digital Partner detail.", ...detail });
  } catch (error) {
    return fail(res, error, "digitalPartner.detail error:");
  }
};

// PATCH /admin/digitalPartner/status?userId=  { status: ACTIVE|SUSPENDED }
exports.setStatus = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const result = await net.setPartnerStatus({ userId: req.query.userId, status: req.body?.status });
    return res.status(200).json({ status: true, message: result.partnerStatus === "ACTIVE" ? "Digital Partner activated." : "Digital Partner suspended.", ...result });
  } catch (error) {
    return fail(res, error, "digitalPartner.setStatus error:");
  }
};

// PATCH /admin/digitalPartner/assignAgency?userId=  { agencyId | null }
// Links an unassigned (e.g. app-purchased, pre-franchise) partner to a
// franchise, or moves one between franchises.
exports.assignAgency = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const result = await net.assignPartnerToAgency({ userId: req.query.userId, agencyId: req.body?.agencyId || null });
    return res.status(200).json({
      status: true,
      message: result.agencyName ? `Digital Partner assigned to ${result.agencyName}.` : "Digital Partner unassigned from its franchise.",
      ...result,
    });
  } catch (error) {
    return fail(res, error, "digitalPartner.assignAgency error:");
  }
};

// GET /admin/digitalPartner/report?startDate=&endDate=&state=&district=&partnerUserId=
// Scoped by role rather than super-admin-only: a DIGITAL_PARTNER_ADMIN only
// ever sees their own row, an AGENCY_ADMIN only partners in their territory.
// Every figure is derived from the source collections (PartnerProfile,
// referralHistories, localBusinessAds) — nothing here is a stored total that
// could drift. startDate/endDate filter the period activity (referrals, ads,
// license activations); referral earnings are lifetime (the profile keeps
// one running total, there is no dated ledger for it).
exports.report = async (req, res) => {
  try {
    const role = req.adminRole;
    const q = req.query || {};

    const inRange = (value) => {
      if (!value) return !(q.startDate || q.endDate);
      const t = new Date(value).getTime();
      if (Number.isNaN(t)) return false;
      if (q.startDate && t < new Date(`${q.startDate}T00:00:00`).getTime()) return false;
      if (q.endDate && t > new Date(`${q.endDate}T23:59:59.999`).getTime()) return false;
      return true;
    };

    let partners = await db.find("users", { isDigitalPartner: true });
    if (role === "DIGITAL_PARTNER_ADMIN") {
      partners = partners.filter((u) => String(u._id || u.id) === String(req.partnerUserId));
    } else if (role === "AGENCY_ADMIN") {
      partners = partners.filter((u) => req.agencyId && String(u.agencyId || "") === String(req.agencyId));
    } else if (role !== "SUPER_ADMIN") {
      return res.status(403).json({ status: false, message: "Not allowed to view Digital Partner reports." });
    }
    if (q.partnerUserId) partners = partners.filter((u) => String(u._id || u.id) === String(q.partnerUserId));
    if (q.state) partners = partners.filter((u) => (u.state || "").toLowerCase() === String(q.state).toLowerCase());
    if (q.district) partners = partners.filter((u) => (u.district || "").toLowerCase() === String(q.district).toLowerCase());

    const coinRate = num((global.settingJSON || {}).coinToInrRate, 0.01);
    const ids = new Set(partners.map((u) => String(u._id || u.id)));

    const partnerIdsList = Array.from(ids);
    const [profiles, referrals, ads] = await Promise.all([
      Promise.all(partners.map((u) => db.findOne("PartnerProfile", { userId: String(u._id || u.id) }))),
      ids.size === 1
        ? db.find("referralHistories", { referrerId: partnerIdsList[0] })
        : ids.size > 0 && ids.size <= 10
        ? Promise.all(partnerIdsList.map((id) => db.find("referralHistories", { referrerId: id }))).then((arrs) => arrs.flat())
        : ids.size
        ? db.find("referralHistories", {})
        : [],
      ids.size === 1
        ? db.find("localBusinessAds", { submittedByUserId: partnerIdsList[0] })
        : ids.size > 0 && ids.size <= 10
        ? Promise.all(partnerIdsList.map((id) => db.find("localBusinessAds", { submittedByUserId: id }))).then((arrs) => arrs.flat())
        : ids.size
        ? db.find("localBusinessAds", {})
        : [],
    ]);

    const rows = partners.map((u, i) => {
      const userId = String(u._id || u.id);
      const profile = profiles[i] || {};
      const myRefs = referrals.filter((r) => String(r.referrerId) === userId && inRange(r.createdAt));
      const valid = myRefs.filter((r) => r.status !== "FLAGGED_SUSPICIOUS");
      const myAds = ads.filter((a) => String(a.submittedByUserId) === userId && inRange(a.createdAt));
      const approved = myAds.filter((a) => a.commissionCredited || a.status === "ACTIVE" || a.status === "COMPLETED" || a.status === "EXPIRED");
      const commissionCoins = approved.reduce((s, a) => s + num(a.digitalPartnerCommissionCoins), 0);

      return {
        userId,
        fullName: u.fullName || "",
        email: u.email || "",
        state: u.state || "",
        district: u.district || "",
        partnerStatus: u.partnerStatus || "NONE",
        activatedAt: profile.activatedAt || null,
        licenseFeePaid: inRange(profile.activatedAt) ? num(profile.licenseFeePaid) : 0,
        adCreditsBalance: num(profile.adCreditsBalance),
        referrals: {
          total: valid.length,
          completed: valid.filter((r) => r.stage1Completed && r.stage2Completed).length,
          pending: valid.filter((r) => !(r.stage1Completed && r.stage2Completed)).length,
          flagged: myRefs.length - valid.length,
        },
        // PartnerProfile.totalEarnings is never maintained — use the user's credited referral coins.
        referralEarningsInr: Number((num(u.referralRewardCoin) * coinRate).toFixed(2)),
        ads: {
          submitted: myAds.length,
          pending: myAds.filter((a) => a.status === "PENDING_REVIEW").length,
          active: myAds.filter((a) => a.status === "ACTIVE").length,
          rejected: myAds.filter((a) => a.status === "REJECTED").length,
          approvedBudgetInr: approved.reduce((s, a) => s + num(a.adBudgetInr), 0),
          commissionInr: Number((commissionCoins * coinRate).toFixed(2)),
          impressions: myAds.reduce((s, a) => s + num(a.impressionCount), 0),
          clicks: myAds.reduce((s, a) => s + num(a.clickCount), 0),
        },
      };
    });

    const sum = (fn) => rows.reduce((s, r) => s + fn(r), 0);
    const summary = {
      totalPartners: rows.length,
      activePartners: rows.filter((r) => r.partnerStatus === "ACTIVE").length,
      licenseRevenueInr: sum((r) => r.licenseFeePaid),
      referrals: sum((r) => r.referrals.total),
      completedReferrals: sum((r) => r.referrals.completed),
      flaggedReferrals: sum((r) => r.referrals.flagged),
      referralEarningsInr: sum((r) => r.referralEarningsInr),
      adsSubmitted: sum((r) => r.ads.submitted),
      adsPending: sum((r) => r.ads.pending),
      adsActive: sum((r) => r.ads.active),
      adsRejected: sum((r) => r.ads.rejected),
      approvedAdBudgetInr: sum((r) => r.ads.approvedBudgetInr),
      adCommissionInr: Number(sum((r) => r.ads.commissionInr).toFixed(2)),
      impressions: sum((r) => r.ads.impressions),
      clicks: sum((r) => r.ads.clicks),
      adCreditsBalance: sum((r) => r.adCreditsBalance),
    };

    rows.sort((a, b) => (b.ads.commissionInr + b.referralEarningsInr) - (a.ads.commissionInr + a.referralEarningsInr));
    return res.status(200).json({ status: true, message: "Digital Partner report.", summary, partners: rows });
  } catch (error) {
    console.error("digitalPartner.report error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// POST /admin/digitalPartner/regeneratePassword   { userId }
// For an already-activated Digital Partner whose portal password needs to
// be reissued (lost, or never picked up the first reveal). forgotPassword
// is a non-functional stub platform-wide, so this is their only recovery
// path besides the dashboard's own auto-rotation (client/partner.controller.js
// getDashboard), which only helps once they can already log in once.
exports.regeneratePassword = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const userId = req.body.userId;
    if (!userId) {
      return res.status(200).json({ status: false, message: "userId is required." });
    }

    const portalCredentials = await regeneratePortalPassword(userId);
    if (!portalCredentials) {
      return res.status(200).json({ status: false, message: "This user has no Digital Partner portal account yet. Activate them first." });
    }

    return res.status(200).json({ status: true, message: "Portal password regenerated.", portalCredentials });
  } catch (error) {
    console.error("digitalPartner.regeneratePassword error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};
