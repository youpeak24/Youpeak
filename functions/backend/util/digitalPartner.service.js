"use strict";
const db = require("./connection");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { recordAgencyCommission } = require("./revenueCommission.service");
const { resolveAgency } = require("./geofence.service");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * Activates (or tops up) a user's Digital Partner license: grants the
 * ad-credits wallet, links the partner to their District Franchise, records
 * the franchise's override commission on the fee, and provisions (or
 * reuses) their DIGITAL_PARTNER_ADMIN web portal login.
 *
 * Two callers, one implementation so they can't drift apart:
 *  - client/payment.controller.js fulfilDigitalPartnerLicense — a genuine
 *    Razorpay payment. No agencyId given → the franchise is resolved from
 *    the buyer's state/district; the commission is VERIFIED (the gateway
 *    confirmed the money).
 *  - util/partnerNetwork.service.js createPartner — a District Franchise
 *    onboarding a partner from its portal. agencyId is that franchise; the
 *    fee is whatever the franchise says it collected, so the commission is
 *    recorded UNVERIFIED and a super admin must verify it before it can be
 *    paid out (controllers/admin/commission.controller.js).
 *
 * @param {object} p
 * @param {string} p.userId
 * @param {number} p.amountInr              licence fee (0 = activated without a fee)
 * @param {string} [p.paymentTransactionId]
 * @param {string} [p.agencyId]             owning franchise (else resolved by district)
 * @param {string} [p.portalPassword]       portal password to set (else a temporary one)
 * @param {string} [p.feeRecordedByAdminId] set when a franchise self-reported the fee
 */
async function grantDigitalPartnerLicense({
  userId,
  amountInr,
  paymentTransactionId = null,
  agencyId = null,
  portalPassword = null,
  feeRecordedByAdminId = null,
}) {
  const amount = num(amountInr);
  const buyer = await db.findById("users", userId);

  const owningAgencyId =
    agencyId || (await resolveAgency({ state: buyer?.state || "", district: buyer?.district || "" })) || null;

  await db.update("users", userId, {
    isDigitalPartner: true,
    partnerStatus: "ACTIVE",
    agencyId: owningAgencyId,
    partnerSince: buyer?.partnerSince && buyer?.isDigitalPartner ? buyer.partnerSince : new Date().toISOString(),
  });

  const existing = await db.findOne("PartnerProfile", { userId });
  let adCreditsBalance = amount;
  if (existing) {
    const updated = await db.incrementFields(
      "PartnerProfile",
      existing._id || existing.id,
      { adCreditsBalance: amount, adCreditsGranted: amount, licenseFeePaid: amount },
      { paymentTransactionId, agencyId: owningAgencyId, activatedAt: new Date().toISOString() }
    );
    adCreditsBalance = updated?.adCreditsBalance ?? (existing.adCreditsBalance || 0) + amount;
  } else {
    await db.create("PartnerProfile", {
      userId,
      agencyId: owningAgencyId,
      licenseFeePaid: amount,
      paymentTransactionId,
      adCreditsBalance: amount,
      adCreditsGranted: amount,
      activatedAt: new Date().toISOString(),
      totalReferrals: 0,
      totalEarnings: 0,
    });
  }

  // District Franchise override on the licence fee (V4 chart "Digital
  // Partner" line, districtPartnerRates.digitalPartnerLicense).
  let commission = null;
  try {
    const rate = num((global.settingJSON || {}).districtPartnerRates?.digitalPartnerLicense, 20);
    if (rate > 0 && amount > 0) {
      commission = await recordAgencyCommission({
        agencyId: owningAgencyId || undefined,
        sourceType: "DIGITAL_PARTNER_LICENSE",
        grossAmount: amount,
        ratePercentage: rate,
        state: buyer?.state || "",
        district: buyer?.district || "",
        userId,
        extra: {
          partnerUserId: String(userId),
          verificationStatus: feeRecordedByAdminId ? "UNVERIFIED" : "VERIFIED",
          recordedByAdminId: feeRecordedByAdminId || null,
          paymentTransactionId,
        },
      });
    }
  } catch (e) {
    console.error("Digital Partner licence commission failed:", e.message);
  }

  let portalCredentials = null;
  try {
    const existingAdmin = await db.findOne("admins", { partnerUserId: String(userId) });
    if (!existingAdmin && buyer?.email) {
      const password = portalPassword || crypto.randomBytes(9).toString("hex");
      await db.create("admins", {
        _id: "admin_partner_" + Date.now() + "_" + crypto.randomBytes(3).toString("hex"),
        name: buyer.fullName || buyer.email,
        email: String(buyer.email).trim().toLowerCase(),
        password: bcrypt.hashSync(password, 10),
        role: "DIGITAL_PARTNER_ADMIN",
        partnerUserId: String(userId),
        agencyId: owningAgencyId,
        isActive: true,
        isDefaultPassword: !portalPassword,
      });
      portalCredentials = { email: String(buyer.email).trim().toLowerCase(), password };
    } else if (existingAdmin) {
      const updates = { agencyId: owningAgencyId, isActive: true };
      if (portalPassword) {
        updates.password = bcrypt.hashSync(portalPassword, 10);
        updates.isDefaultPassword = false;
      }
      await db.update("admins", existingAdmin._id || existingAdmin.id, updates);
      if (portalPassword) portalCredentials = { email: existingAdmin.email, password: portalPassword };
    }
  } catch (e) {
    console.error("Digital Partner portal account creation failed:", e.message);
  }

  return { isDigitalPartner: true, adCreditsBalance, portalCredentials, buyer, agencyId: owningAgencyId, commission };
}

// Hands a Digital Partner a fresh portal password without touching their
// license/wallet — for when a super admin needs to (re)issue login access.
async function regeneratePortalPassword(userId) {
  const admin = await db.findOne("admins", { partnerUserId: String(userId) });
  if (!admin) return null;

  const tempPassword = crypto.randomBytes(9).toString("hex");
  await db.update("admins", admin._id || admin.id, {
    password: bcrypt.hashSync(tempPassword, 10),
    isDefaultPassword: true,
  });
  return { email: admin.email, password: tempPassword };
}

module.exports = { grantDigitalPartnerLicense, regeneratePortalPassword };
