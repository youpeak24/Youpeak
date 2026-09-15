const mongoose = require("../util/mongooseShim");

// A local business ad campaign sourced by a Digital Partner (ground-level
// sourcing) or a District Partner. Real money the business paid the partner
// for the campaign (collected offline — no in-app "Local Business" account
// exists) gets split between the sourcing partner, their District Partner,
// and the platform once admin approves the creative.
const localBusinessAdSchema = new mongoose.Schema(
  {
    submittedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // the Digital Partner
    businessName: { type: String, required: true, trim: true },
    businessContact: { type: String, default: "" },
    category: { type: String, default: "" },
    creativeUrl: { type: String, required: true },
    creativeType: { type: String, enum: ["image", "video"], default: "image" },
    targetState: { type: String, default: "" },
    targetDistrict: { type: String, default: "" },
    adBudgetInr: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    startAt: { type: String, default: null },
    endAt: { type: String, default: null },
    status: { type: String, enum: ["PENDING_REVIEW", "REJECTED", "ACTIVE", "COMPLETED"], default: "PENDING_REVIEW" },
    moderationNote: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    reviewedAt: { type: String, default: null },
    impressionCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    digitalPartnerCommissionCoins: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

localBusinessAdSchema.index({ submittedByUserId: 1, createdAt: -1 });
localBusinessAdSchema.index({ status: 1, targetState: 1, targetDistrict: 1 });

module.exports = mongoose.model("LocalBusinessAd", localBusinessAdSchema);
