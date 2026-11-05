const mongoose = require("../util/mongooseShim");

const otpSchema = new mongoose.Schema(
  {
    email: { type: String },
    otp: { type: Number }, // null once used, expired or locked out
    expiresAt: { type: Date, required: true },
    // Brute-force limits (controllers/client/otp.controller.js)
    failedAttempts: { type: Number, default: 0 },
    issuedInWindow: { type: Number, default: 0 },
    windowStartedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OTP", otpSchema);
