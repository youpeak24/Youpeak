const mongoose = require("../util/mongooseShim");

const { WITHDRAWAL_STATUS } = require("../types/constant");

const withdrawRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    channelId: { type: String, default: "" }, //channelId of the particular that user
    channelName: { type: String, default: "" }, //channelName of the particular that user
    requestAmount: { type: Number, default: 0 },
    paymentGateway: { type: String, default: "" },
    paymentDetails: { type: Array, default: [] },
    status: { type: Number, default: 1, enum: WITHDRAWAL_STATUS },
    // Atomic claim guard for admin acceptWithdrawalRequest() — independent
    // of `status`: this is what actually stops a double-click/retry from
    // debiting the user's totalEarningAmount twice. See
    // controllers/admin/withDrawalRequest.controller.js.
    accepted: { type: Boolean, default: false },
    reason: { type: String, default: "" },
    uniqueId: { type: String, unique: true, default: "" },
    requestDate: { type: String, default: "" },
    paymentDate: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

withdrawRequestSchema.index({ createdAt: -1 });
withdrawRequestSchema.index({ status: 1, createdAt: -1 });
withdrawRequestSchema.index({ userId: 1 });

module.exports = mongoose.model("WithdrawRequest", withdrawRequestSchema);
