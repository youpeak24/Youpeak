/**
 * District Franchise portal — endpoints for an AGENCY_ADMIN login. Everything
 * is scoped to req.agencyId (set by middleware/checkScope.middleware.js from
 * the admin record, never from the request), so a franchise can only ever
 * see or change the Digital Partners in its own district.
 */
"use strict";

const net = require("../../util/partnerNetwork.service");

function requireFranchise(req, res) {
  if (req.adminRole !== "AGENCY_ADMIN" || !req.agencyId) {
    res.status(403).json({ status: false, message: "This page is only for District Franchise logins." });
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

// GET /admin/franchisePortal/dashboard
exports.dashboard = async (req, res) => {
  try {
    if (!requireFranchise(req, res)) return;
    const overview = await net.agencyOverview(req.agencyId);
    return res.status(200).json({ status: true, message: "Franchise dashboard.", ...overview, rules: net.referralRules() });
  } catch (error) {
    return fail(res, error, "Failed to load dashboard");
  }
};

// GET /admin/franchisePortal/partners
exports.listPartners = async (req, res) => {
  try {
    if (!requireFranchise(req, res)) return;
    const partners = await net.listPartnerRows({ agencyId: req.agencyId });
    return res.status(200).json({ status: true, message: "Digital Partners.", summary: net.summarizePartners(partners), partners });
  } catch (error) {
    return fail(res, error, "Failed to load Digital Partners");
  }
};

// POST /admin/franchisePortal/partners/create
//   { fullName, email, mobileNumber?, password, licenseFeeInr? }
exports.createPartner = async (req, res) => {
  try {
    if (!requireFranchise(req, res)) return;
    const b = req.body || {};
    const result = await net.createPartner({
      agencyId: req.agencyId,
      actorAdminId: req.admin?._id || req.admin?.id,
      fullName: b.fullName,
      email: b.email,
      mobileNumber: b.mobileNumber,
      password: b.password,
      licenseFeeInr: b.licenseFeeInr === "" || b.licenseFeeInr === undefined ? 0 : b.licenseFeeInr,
    });
    const how =
      result.appAccount === "CREATED"
        ? "A new app account was created — they can log in to the app and the partner panel with this email and password."
        : "Linked to their existing app account (they keep their own app login). Use this email and password for the partner panel.";
    return res.status(200).json({ status: true, message: `Digital Partner created. ${how}`, ...result });
  } catch (error) {
    return fail(res, error, "Failed to create Digital Partner");
  }
};

// GET /admin/franchisePortal/partners/detail?userId=
exports.partnerDetail = async (req, res) => {
  try {
    if (!requireFranchise(req, res)) return;
    const detail = await net.partnerDetail(req.query.userId);
    if (!detail.isDigitalPartner || String(detail.partner.agencyId || "") !== String(req.agencyId)) {
      throw new net.PartnerNetworkError("This Digital Partner does not belong to your district franchise.");
    }
    return res.status(200).json({ status: true, message: "Digital Partner detail.", ...detail });
  } catch (error) {
    return fail(res, error, "Failed to load Digital Partner");
  }
};

// PATCH /admin/franchisePortal/partners/update?userId=  { fullName?, mobileNumber?, newPassword? }
exports.updatePartner = async (req, res) => {
  try {
    if (!requireFranchise(req, res)) return;
    const b = req.body || {};
    const result = await net.updatePartner({
      userId: req.query.userId,
      agencyScopeId: req.agencyId,
      fullName: b.fullName,
      mobileNumber: b.mobileNumber,
      newPassword: b.newPassword,
    });
    let message = "Digital Partner updated.";
    if (result.passwordChanged.portal) {
      message += result.passwordChanged.app
        ? " New password set for both the app and the partner panel."
        : " New password set for the partner panel (their app login is their own and was not changed).";
    }
    return res.status(200).json({ status: true, message, ...result });
  } catch (error) {
    return fail(res, error, "Failed to update Digital Partner");
  }
};

// PATCH /admin/franchisePortal/partners/status?userId=  { status: ACTIVE|SUSPENDED }
exports.setPartnerStatus = async (req, res) => {
  try {
    if (!requireFranchise(req, res)) return;
    const result = await net.setPartnerStatus({ userId: req.query.userId, agencyScopeId: req.agencyId, status: req.body?.status });
    return res.status(200).json({
      status: true,
      message: result.partnerStatus === "ACTIVE" ? "Digital Partner activated." : "Digital Partner suspended — their partner panel login is disabled.",
      ...result,
    });
  } catch (error) {
    return fail(res, error, "Failed to change Digital Partner status");
  }
};

// DELETE /admin/franchisePortal/partners/remove?userId=
exports.removePartner = async (req, res) => {
  try {
    if (!requireFranchise(req, res)) return;
    const result = await net.removePartner({ userId: req.query.userId, agencyScopeId: req.agencyId });
    return res.status(200).json({
      status: true,
      message: "Removed from the Digital Partner programme. Their app account, wallet and referral history are kept.",
      ...result,
    });
  } catch (error) {
    return fail(res, error, "Failed to remove Digital Partner");
  }
};

// GET /admin/franchisePortal/referrals?stage=&partnerUserId=&start=&limit=
exports.referrals = async (req, res) => {
  try {
    if (!requireFranchise(req, res)) return;
    let partners = await net.listPartnerRows({ agencyId: req.agencyId });
    if (req.query.partnerUserId) partners = partners.filter((p) => p.userId === String(req.query.partnerUserId));
    const result = await net.listReferrals(partners, {
      stage: req.query.stage || "",
      start: req.query.start,
      limit: req.query.limit,
    });
    return res.status(200).json({
      status: true,
      message: "Referrals.",
      partners: partners.map((p) => ({ userId: p.userId, fullName: p.fullName })),
      ...result,
    });
  } catch (error) {
    return fail(res, error, "Failed to load referrals");
  }
};
