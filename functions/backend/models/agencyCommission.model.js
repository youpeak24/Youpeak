const mongoose = require("../util/mongooseShim");

const agencyCommissionSchema = new mongoose.Schema(
  {
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", required: true },
    // Mirrors the District Partner commission chart (DOC-20260826-WA0000):
    // Video Unlocks 10% (capped), VIP Creator Onboarding 20%, Local Business
    // Ads 30% — kept as distinct values so agency reports can break out each
    // revenue stream instead of lumping them together.
    sourceType: {
      type: String,
      enum: [
        "AD_IMPRESSION", "DOWNLOAD", "COIN_PURCHASE", "PREMIUM_SUBSCRIPTION",
        "VIDEO_UNLOCK", "VIP_CREATOR_ONBOARDING", "LOCAL_BUSINESS_ADS",
        "PAID_CHANNEL", // legacy catch-all, kept for old rows
      ],
      required: true,
    },
    grossAmount: { type: Number, required: true },
    commissionRatePercentage: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    state: { type: String, default: "" },
    district: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    payoutStatus: { type: String, enum: ["PENDING", "APPROVED", "PAID"], default: "PENDING" },
    paidAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

agencyCommissionSchema.index({ agencyId: 1, createdAt: -1 });
agencyCommissionSchema.index({ payoutStatus: 1 });

module.exports = mongoose.model("AgencyCommission", agencyCommissionSchema);
