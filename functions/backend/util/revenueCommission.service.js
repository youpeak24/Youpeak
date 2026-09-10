"use strict";
const db = require("./connection");
const { resolveAgency } = require("./geofence.service");

/**
 * Record a District Partner (agency) commission row.
 *
 * @param {object} p
 * @param {string} [p.agencyId]        explicit agency; else resolved by district/state/geo
 * @param {string} p.sourceType        AD_IMPRESSION | DOWNLOAD | COIN_PURCHASE | PREMIUM_SUBSCRIPTION | PAID_CHANNEL
 * @param {number} p.grossAmount       gross revenue in INR for this event
 * @param {number} [p.ratePercentage]  commission rate; else the agency's own rate; else 10
 * @param {number} [p.capInr]          optional cap on the commission amount
 * @param {string} [p.state] @param {string} [p.district]
 * @param {string} [p.userId]
 * @returns {Promise<object|null>} the created commission doc, or null
 */
const recordAgencyCommission = async ({
  agencyId,
  sourceType,
  grossAmount,
  ratePercentage,
  capInr,
  state = "",
  district = "",
  userId = null,
} = {}) => {
  try {
    const gross = Number(grossAmount);
    if (!gross || gross <= 0) return null;

    let targetAgencyId = agencyId;
    if (!targetAgencyId) {
      targetAgencyId = await resolveAgency({ district, state });
    }
    if (!targetAgencyId) return null;

    const agency = await db.findById("agencies", targetAgencyId);
    if (!agency || agency.isActive === false) return null;

    const rate = ratePercentage != null
      ? Number(ratePercentage)
      : Number(agency.commissionRatePercentage) || 10;

    let commissionAmount = Number(((gross * rate) / 100).toFixed(2));
    if (capInr != null && commissionAmount > Number(capInr)) {
      commissionAmount = Number(capInr);
    }

    return await db.create("agencyCommissions", {
      _id: `agc_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      agencyId: agency._id || agency.id,
      sourceType,
      grossAmount: gross,
      commissionRatePercentage: rate,
      commissionAmount,
      state: state || agency.state || "",
      district: district || agency.district || "",
      userId,
      payoutStatus: "PENDING",
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error recording agency commission:", error.message);
    return null;
  }
};

module.exports = { recordAgencyCommission };
