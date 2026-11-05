const mongoose = require("../util/mongooseShim");

const premiumPlanSchema = new mongoose.Schema(
  {
    amount: { type: Number, default: 0 },
    validity: { type: Number, default: 0 },
    validityType: { type: String, default: null },
    planBenefit: { type: Array },
    productKey: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("PremiumPlan", premiumPlanSchema);
