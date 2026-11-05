"use strict";
const db = require("./connection");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { planAgencyCommission } = require("./revenueCommission.service");
const firebaseAdmin = require("./firebaseAdmin");
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
  effectKey = null,
}) {
  const amount = num(amountInr);
  const buyer = await db.findById("users", userId);

  const owningAgencyId =
    agencyId || (await resolveAgency({ state: buyer?.state || "", district: buyer?.district || "" })) || null;

  // Activation, Ad Credits top-up and the franchise commission commit in ONE
  // transaction with an idempotency marker (licenseGrants/<effectKey>), so a
  // retried payment callback can't top the credits up twice and a crash can't
  // leave a partner active without credits (Phase 2, F-22).
  const key = effectKey || `dpl_${paymentTransactionId || `manual_${userId}_${Date.now()}`}`;
  const fs = db.getDb();
  const profileCol = db.normalizeCollectionName("PartnerProfile");
  const existing = await db.findOne("PartnerProfile", { userId });
  const profileRef = fs.collection(profileCol).doc(existing ? String(existing._id || existing.id) : `pp_${userId}`);
  const markerRef = fs.collection("licenseGrants").doc(key);

  let commissionPlan = null;
  const rate = num((global.settingJSON || {}).districtPartnerRates?.digitalPartnerLicense, 20);
  if (rate > 0 && amount > 0) {
    // District Franchise override on the licence fee (V4 chart "Digital
    // Partner" line, districtPartnerRates.digitalPartnerLicense).
    commissionPlan = await planAgencyCommission({
      agencyId: owningAgencyId || undefined,
      sourceType: "DIGITAL_PARTNER_LICENSE",
      grossAmount: amount,
      ratePercentage: rate,
      state: buyer?.state || "",
      district: buyer?.district || "",
      userId,
      id: `agc_${key}`,
      extra: {
        partnerUserId: String(userId),
        verificationStatus: feeRecordedByAdminId ? "UNVERIFIED" : "VERIFIED",
        recordedByAdminId: feeRecordedByAdminId || null,
        paymentTransactionId,
      },
    }).catch((e) => { console.error("Digital Partner licence commission plan failed:", e.message); return null; });
  }

  const granted = await db.withTimeout(fs.runTransaction(async (tx) => {
    const [marker, profileSnap] = await Promise.all([tx.get(markerRef), tx.get(profileRef)]);
    if (marker.exists) return { replayed: true, adCreditsBalance: Number(profileSnap.data()?.adCreditsBalance) || 0, commission: null };
    const now = new Date().toISOString();
    tx.set(fs.collection("users").doc(String(userId)), {
      isDigitalPartner: true,
      partnerStatus: "ACTIVE",
      agencyId: owningAgencyId,
      partnerSince: buyer?.partnerSince && buyer?.isDigitalPartner ? buyer.partnerSince : now,
      updatedAt: now,
    }, { merge: true });
    const before = profileSnap.exists ? Number(profileSnap.data().adCreditsBalance) || 0 : 0;
    if (profileSnap.exists) {
      tx.update(profileRef, {
        adCreditsBalance: firebaseAdmin.firestore.FieldValue.increment(amount),
        adCreditsGranted: firebaseAdmin.firestore.FieldValue.increment(amount),
        licenseFeePaid: firebaseAdmin.firestore.FieldValue.increment(amount),
        paymentTransactionId, agencyId: owningAgencyId, activatedAt: now, updatedAt: now,
      });
    } else {
      tx.create(profileRef, {
        _id: profileRef.id, id: profileRef.id, userId, agencyId: owningAgencyId, licenseFeePaid: amount, paymentTransactionId,
        adCreditsBalance: amount, adCreditsGranted: amount, activatedAt: now, totalReferrals: 0, totalEarnings: 0, createdAt: now, updatedAt: now,
      });
    }
    if (commissionPlan) tx.create(fs.collection(db.normalizeCollectionName("agencyCommissions")).doc(commissionPlan.id), commissionPlan.doc);
    tx.create(markerRef, { _id: key, userId: String(userId), amountInr: amount, paymentTransactionId, commission: commissionPlan ? commissionPlan.id : null, createdAt: now });
    return { replayed: false, adCreditsBalance: before + amount, commission: commissionPlan ? commissionPlan.doc : null };
  }));
  const adCreditsBalance = granted.adCreditsBalance;
  const commission = granted.commission;

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
