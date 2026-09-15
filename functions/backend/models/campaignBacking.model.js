const mongoose = require("../util/mongooseShim");

// One fan's real-money backing of a CreatorFundingCampaign. Never
// transferable, never tradeable, carries no ownership/share concept —
// just a receipt plus which perk it unlocked.
const campaignBackingSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "CreatorFundingCampaign", required: true },
    backerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amountInr: { type: Number, required: true },
    paymentTransactionId: { type: String, default: "" },
    perkUnlocked: { type: String, default: "" },
    status: { type: String, enum: ["ACTIVE", "REFUNDED"], default: "ACTIVE" },
    refundedAt: { type: String, default: null },
    refundCoins: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

campaignBackingSchema.index({ campaignId: 1 });
campaignBackingSchema.index({ backerId: 1 });

module.exports = mongoose.model("CampaignBacking", campaignBackingSchema);
