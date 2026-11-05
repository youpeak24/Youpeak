const { WALLET_HISTORY_TYPE } = require("../types/constant");

const mongoose = require("../util/mongooseShim");

const walletHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    type: { type: Number, enum: WALLET_HISTORY_TYPE },
    coin: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    totalWatchTimeInHours: { type: Number, default: 0 }, //total watch time of the all videos of the particular channel at monetization request accept for wallet history of monetization earning
    uniqueId: { type: String, unique: true, trim: true, default: "" },
    date: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

walletHistorySchema.index({ createdAt: -1 });
walletHistorySchema.index({ userId: 1 });

module.exports = new mongoose.model("WalletHistory", walletHistorySchema);
