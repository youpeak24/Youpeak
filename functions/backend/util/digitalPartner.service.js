"use strict";
const db = require("./connection");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { recordAgencyCommission } = require("./revenueCommission.service");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * Activates (or tops up) a user's Digital Partner license: grants the
 * ad-credits wallet, records the District Partner override commission for
 * whichever Agency covers the buyer's district, and auto-provisions (or
 * reuses) their DIGITAL_PARTNER_ADMIN web portal login.
 *
 * Shared by the real payment flow (client/payment.controller.js
 * fulfilDigitalPartnerLicense — a genuine Razorpay transaction) and the
 * manual admin-activation path (admin/digitalPartner.controller.js — for
 * partners onboarded before/outside the payment gateway, e.g. paid via
 * bank transfer) so both produce IDENTICAL results instead of two
 * implementations that can drift apart.
 */
async function grantDigitalPartnerLicense({ userId, amountInr, paymentTransactionId = null }) {
  const amount = num(amountInr);

  await db.update("users", userId, {
    isDigitalPartner: true,
    partnerStatus: "ACTIVE",
  });

  const existing = await db.findOne("PartnerProfile", { userId });
  let adCreditsBalance = amount;
  if (existing) {
    const updated = await db.incrementFields(
      "PartnerProfile",
      existing._id || existing.id,
      { adCreditsBalance: amount, adCreditsGranted: amount },
      { licenseFeePaid: amount, paymentTransactionId, activatedAt: new Date().toISOString() }
    );
    adCreditsBalance = updated?.adCreditsBalance ?? (existing.adCreditsBalance || 0) + amount;
  } else {
    await db.create("PartnerProfile", {
      userId,
      licenseFeePaid: amount,
      paymentTransactionId,
      adCreditsBalance: amount,
      adCreditsGranted: amount,
      activatedAt: new Date().toISOString(),
      totalReferrals: 0,
      totalEarnings: 0,
    });
  }

  const buyer = await db.findById("users", userId);

  // District Partner override — 20% of the license fee, per the V4 chart's
  // "Digital Partner" line, credited to whichever Agency's territory the
  // buyer's state/district resolves to.
  try {
    const rate = num((global.settingJSON || {}).districtPartnerRates?.digitalPartnerLicense, 20);
    if (rate > 0 && amount > 0) {
      await recordAgencyCommission({
        sourceType: "DIGITAL_PARTNER_LICENSE",
        grossAmount: amount,
        ratePercentage: rate,
        state: buyer?.state || "",
        district: buyer?.district || "",
        userId,
      });
    }
  } catch (e) { /* ignore */ }

  let portalCredentials = null;
  try {
    const existingAdmin = await db.findOne("admins", { partnerUserId: userId });
    if (!existingAdmin && buyer?.email) {
      const tempPassword = crypto.randomBytes(9).toString("hex");
      await db.create("admins", {
        _id: "admin_partner_" + Date.now(),
        name: buyer.fullName || buyer.email,
        email: String(buyer.email).trim().toLowerCase(),
        password: bcrypt.hashSync(tempPassword, 10),
        role: "DIGITAL_PARTNER_ADMIN",
        partnerUserId: userId,
        isDefaultPassword: true,
      });
      portalCredentials = { email: buyer.email, password: tempPassword };
    }
  } catch (e) {
    console.error("Digital Partner portal account creation failed:", e.message);
  }

  return { isDigitalPartner: true, adCreditsBalance, portalCredentials, buyer };
}

// Hands a Digital Partner a fresh portal password without touching their
// license/wallet — for when Super Admin needs to (re)issue login access
// (lost password, or the partner never picked up their one-time reveal).
async function regeneratePortalPassword(userId) {
  const admin = await db.findOne("admins", { partnerUserId: userId });
  if (!admin) return null;

  const tempPassword = crypto.randomBytes(9).toString("hex");
  await db.update("admins", admin._id || admin.id, {
    password: bcrypt.hashSync(tempPassword, 10),
    isDefaultPassword: true,
  });
  return { email: admin.email, password: tempPassword };
}

module.exports = { grantDigitalPartnerLicense, regeneratePortalPassword };
