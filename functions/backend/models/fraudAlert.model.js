const mongoose = require("../util/mongooseShim");

const fraudAlertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    riskType: {
      type: String,
      enum: [
        "MULTIPLE_ACCOUNTS_SAME_IP",
        "ABNORMAL_AD_CLICK_SPEED",
        "SUSPICIOUS_REFERRAL_FARMING",
        "VPN_PROXY_USAGE",
        "EXCEEDED_DAILY_LIMIT_VELOCITY",
      ],
      required: true,
    },
    riskScore: { type: Number, default: 50, min: 0, max: 100 },
    details: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    actionTaken: {
      type: String,
      enum: ["FLAGGED", "RESTRICTED", "AUTO_BLOCKED", "RESOLVED"],
      default: "FLAGGED",
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

fraudAlertSchema.index({ userId: 1 });
fraudAlertSchema.index({ actionTaken: 1 });

module.exports = mongoose.model("FraudAlert", fraudAlertSchema);
