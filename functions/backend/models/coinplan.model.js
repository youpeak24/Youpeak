const mongoose = require("../util/mongooseShim");

const coinplanSchema = new mongoose.Schema(
  {
    amount: { type: Number, default: 0 },
    coin: { type: Number, default: 0 },
    extraCoin: { type: Number, default: 0 },
    icon: { type: String, default: "" },
    productKey: { type: String, default: "" },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

coinplanSchema.index({ coin: 1 });
coinplanSchema.index({ amount: 1 });

module.exports = new mongoose.model("CoinPlan", coinplanSchema);
