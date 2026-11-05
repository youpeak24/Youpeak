"use strict";
const db = require("./connection");
const { resolveAgency } = require("./geofence.service");

/**
 * Work out a District Partner (agency) commission row without writing it.
 * Callers that must commit it atomically with other writes (payment
 * fulfilment, revenue settlement) put the returned { id, doc } into their own
 * Firestore transaction; a deterministic `id` makes a retry a no-op.
 *
 * @param {object} p
 * @param {string} [p.agencyId]        explicit agency; else resolved by district/state/geo
 * @param {string} p.sourceType        AD_IMPRESSION | DOWNLOAD | COIN_PURCHASE | PREMIUM_SUBSCRIPTION | PAID_CHANNEL | ...
 * @param {number} p.grossAmount       gross revenue in INR for this event
 * @param {number} [p.ratePercentage]  commission rate; else the agency's own rate; else 10
 * @param {number} [p.capInr]          optional cap on the commission amount
 * @param {string} [p.state] @param {string} [p.district]
 * @param {string} [p.userId]
 * @param {object} [p.extra]           extra ledger fields (e.g. verificationStatus, partnerUserId)
 * @param {string} [p.id]              deterministic document id (idempotency key)
 * @returns {Promise<{id:string, doc:object}|null>}
 */
async function planAgencyCommission({ agencyId, sourceType, grossAmount, ratePercentage, capInr, state = "", district = "", userId = null, extra = {}, id } = {}) {
  const gross = Number(grossAmount);
  if (!gross || gross <= 0) return null;

  let targetAgencyId = agencyId;
  if (!targetAgencyId) targetAgencyId = await resolveAgency({ district, state });
  if (!targetAgencyId) return null;

  const agency = await db.findById("agencies", targetAgencyId);
  if (!agency || agency.isActive === false) return null;

  const rate = ratePercentage != null ? Number(ratePercentage) : Number(agency.commissionRatePercentage) || 10;
  let commissionAmount = Number(((gross * rate) / 100).toFixed(2));
  if (capInr != null && commissionAmount > Number(capInr)) commissionAmount = Number(capInr);

  const docId = id || `agc_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  return {
    id: docId,
    doc: {
      _id: docId,
      id: docId,
      agencyId: agency._id || agency.id,
      sourceType,
      grossAmount: gross,
      commissionRatePercentage: rate,
      commissionAmount,
      state: state || agency.state || "",
      district: district || agency.district || "",
      userId,
      payoutStatus: "PENDING",
      ...extra,
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * Record a District Partner (agency) commission row (see planAgencyCommission).
 * With a deterministic `id`, a second call for the same event creates nothing.
 * @returns {Promise<object|null>} the created commission doc, or null
 */
const recordAgencyCommission = async (p = {}) => {
  try {
    const plan = await planAgencyCommission(p);
    if (!plan) return null;
    if (p.id) {
      const claim = await db.createOnce("agencyCommissions", plan.id, plan.doc);
      return claim.created ? claim.doc : null;
    }
    return await db.create("agencyCommissions", plan.doc);
  } catch (error) {
    console.error("Error recording agency commission:", error.message);
    return null;
  }
};

module.exports = { recordAgencyCommission, planAgencyCommission };
