const mongoose = require("../util/mongooseShim");

/**
 * One row per payment attempt (any gateway, any purpose).
 * purpose: joining_fee | tier_upgrade | coin_plan | premium_plan | video_promotion
 */
const paymentTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    gateway: { type: String, default: "razorpay" },
    purpose: { type: String, required: true },

    amountInr: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    orderId: { type: String, default: null },   // gateway order id
    paymentId: { type: String, default: null }, // gateway payment id
    receipt: { type: String, default: null },

    // purpose-specific target
    tierId: { type: String, default: null },
    coinPlanId: { type: String, default: null },
    premiumPlanId: { type: String, default: null },
    meta: { type: Object, default: {} },

    status: { type: String, enum: ["created", "paid", "failed", "refunded"], default: "created" },
    fulfilled: { type: Boolean, default: false },
    fulfilledAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    verifiedVia: { type: String, default: null }, // "callback" | "webhook" | "admin"
  },
  { timestamps: true, versionKey: false }
);

paymentTransactionSchema.index({ userId: 1, createdAt: -1 });
paymentTransactionSchema.index({ orderId: 1 });
paymentTransactionSchema.index({ status: 1 });

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
