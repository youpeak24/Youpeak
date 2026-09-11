const mongoose = require("../util/mongooseShim");

/**
 * Digital Partner Program (TRS, executed 2026-09-11).
 *
 * "Digital Partner" = the existing Peak Partner referral engine
 * (referral.service.js — unchanged, still open to every user, not gated on
 * this profile) PLUS a paid license + a self-serve local-ad wallet. One row
 * per user who has bought the license; look it up by userId.
 */
const partnerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    licenseFeePaid: { type: Number, default: 0 },
    paymentTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentTransaction", default: null },
    adCreditsBalance: { type: Number, default: 0 },
    adCreditsGranted: { type: Number, default: 0 }, // lifetime granted, for audit
    totalReferrals: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }, // INR, Stage 1 + Stage 2 payouts credited via this partner's code
    activatedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

partnerProfileSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("PartnerProfile", partnerProfileSchema);
