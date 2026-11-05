const mongoose = require("../util/mongooseShim");

const CoinPlanHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    coinplanId: { type: mongoose.Schema.Types.ObjectId, ref: "CoinPlan" },
    paymentGateway: { type: String },
    paymentId: { type: String, default: "" }, // gateway payment id — dedup key, prevents replaying one verified payment
    orderId: { type: String, default: "" },
    date: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

CoinPlanHistorySchema.index({ userId: 1 });
CoinPlanHistorySchema.index({ coinplanId: 1 });

module.exports = mongoose.model("CoinPlanHistory", CoinPlanHistorySchema);
