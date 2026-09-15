const mongoose = require("../util/mongooseShim");

// A creator's fan-funding campaign. Backers get perks only — this field
// set intentionally has no "sharePrice"/"holderCount"/tradeable-unit
// concept anywhere. See setting.js's creatorFunding* comment for why.
const creatorFundingCampaignSchema = new mongoose.Schema(
  {
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    goalAmountInr: { type: Number, required: true },
    raisedAmountInr: { type: Number, default: 0 },
    // [{ minAmountInr: Number, title: String, description: String }] —
    // creator-defined, informational only, never automated/redeemed for cash.
    perks: { type: Array, default: [] },
    deadlineAt: { type: String, required: true },
    status: { type: String, enum: ["ACTIVE", "SUCCESSFUL", "FAILED", "CANCELLED"], default: "ACTIVE" },
    platformFeePercentage: { type: Number, default: 20 },
    backerCount: { type: Number, default: 0 },
    resolvedAt: { type: String, default: null },
    payoutCoins: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

creatorFundingCampaignSchema.index({ creatorId: 1, createdAt: -1 });
creatorFundingCampaignSchema.index({ status: 1, deadlineAt: 1 });

module.exports = mongoose.model("CreatorFundingCampaign", creatorFundingCampaignSchema);
