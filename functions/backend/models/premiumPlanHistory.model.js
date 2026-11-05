const mongoose = require("../util/mongooseShim");

const PremiumPlanHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    premiumPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "PremiumPlan" },
    paymentGateway: { type: String },
    date: { type: String },
    // Snapshot of the plan's price/validity AT PURCHASE TIME — the admin
    // "Order History" table must show what was actually paid, not the
    // plan's current price or the user's current (possibly since-renewed
    // or since-changed) active plan. See controllers/client/premiumPlan.controller.js.
    amount: { type: Number, default: 0 },
    validity: { type: Number, default: 0 },
    validityType: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

PremiumPlanHistorySchema.index({ userId: 1 });
PremiumPlanHistorySchema.index({ premiumPlanId: 1 });

module.exports = mongoose.model("PremiumPlanHistory", PremiumPlanHistorySchema);
