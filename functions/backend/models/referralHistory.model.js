const mongoose = require("../util/mongooseShim");

/**
 * Referral History Model
 * Per Youpeak Peak Partner Terms & Payout Guidelines:
 *  - Stage 1: ₹100 bonus when referred user completes OTP verification
 *  - Stage 2: ₹100 bonus when referred user watches 100 minutes within 7 days of signup
 *
 * Standard coin rate: 100 Coins = ₹1, so ₹100 = 10,000 Coins
 */
const referralHistorySchema = new mongoose.Schema(
  {
    referrerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    referralCode: { type: String, required: true },
    ipAddress: { type: String, default: "" },

    // Stage 1: OTP Verified (Coin credit for referrer on referred user's first login)
    stage1Completed: { type: Boolean, default: false },
    stage1CompletedAt: { type: Date, default: null },
    stage1RewardCoins: { type: Number, default: 0 }, // 10,000 coins = ₹100

    // Stage 2: 100 Min Watch Time within 7 Days
    stage2Completed: { type: Boolean, default: false },
    stage2CompletedAt: { type: Date, default: null },
    stage2RewardCoins: { type: Number, default: 0 }, // 10,000 coins = ₹100

    // Deadline: Stage 2 must be completed within 7 days of stage 1
    stage2DeadlineAt: { type: Date, default: null },

    // Total reward coins given so far (sum of stage1 + stage2)
    totalRewardCoinsGiven: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["PENDING", "STAGE1_DONE", "STAGE2_DONE", "EXPIRED", "FLAGGED_SUSPICIOUS"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

referralHistorySchema.index({ referrerId: 1 });
referralHistorySchema.index({ referredUserId: 1 });
referralHistorySchema.index({ status: 1 });
referralHistorySchema.index({ stage2DeadlineAt: 1 });

module.exports = mongoose.model("ReferralHistory", referralHistorySchema);
