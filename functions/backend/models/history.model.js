const { HISTORY_TYPE } = require("../types/constant");

const mongoose = require("../util/mongooseShim");

const historySchema = new mongoose.Schema(
  {
    otherUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, //sender
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, //receiver
    coinplan: { type: mongoose.Schema.Types.ObjectId, ref: "CoinPlan", default: null },
    premiumPlan: { type: mongoose.Schema.Types.ObjectId, ref: "PremiumPlan", default: null },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", default: null },
    channelId: { type: String, trim: true, default: "" },
    paymentGateway: { type: String, default: "" },
    type: { type: Number, enum: HISTORY_TYPE },
    coin: { type: Number, default: 0 },
    rewardCoins: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    uniqueId: { type: String, unique: true, trim: true, default: "" },
    date: { type: String, default: "" },
    // Atomic claim guard for rewardEngine.reverseReward() (e.g. un-liking a
    // video) — prevents two concurrent reversals of the same row from
    // subtracting the reward coins twice. See util/rewardEngine.js.
    reversed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

historySchema.index({ createdAt: -1 });
historySchema.index({ userId: 1 });

module.exports = new mongoose.model("History", historySchema);
