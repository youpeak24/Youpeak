const mongoose = require("../util/mongooseShim");

/**
 * Video Promotion Plans Model
 * Per DOC-20260826-WA0214 (Creator Growth & Promotion Plans):
 *
 * Plan Name         | Price  | Duration  | Impressions
 * Starter Plan      | ₹49    | 1 Day     | Targeted
 * Basic Plan        | ₹99    | 2 Days    | Targeted
 * Pro Starter       | ₹199   | 2 Days    | Targeted
 * Boost Plan        | ₹249   | 4 Days    | Targeted
 * Weekly Mega       | ₹1,000 | 7 Days    | Targeted
 * Monthly Pro       | ₹3,000 | 30 Days   | Targeted
 */
const videoPromotionSchema = new mongoose.Schema(
  {
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Plan details
    planName: {
      type: String,
      required: true,
      enum: ["Starter Plan", "Basic Plan", "Pro Starter", "Boost Plan", "Weekly Mega", "Monthly Pro"],
    },
    planPriceINR: { type: Number, required: true }, // ₹49, ₹99, ₹199, ₹249, ₹1000, ₹3000
    planDurationDays: { type: Number, required: true }, // 1, 2, 2, 4, 7, 30

    // Campaign status
    status: {
      type: String,
      enum: ["pending_payment", "active", "expired", "rejected"],
      default: "pending_payment",
    },
    paymentGatewayRef: { type: String, default: null }, // Razorpay/PhonePe ref

    // Campaign window
    startedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },

    // Admin approval
    approvedByAdmin: { type: Boolean, default: false },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

videoPromotionSchema.index({ userId: 1 });
videoPromotionSchema.index({ videoId: 1 });
videoPromotionSchema.index({ status: 1 });
videoPromotionSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("VideoPromotion", videoPromotionSchema);
