const mongoose = require("../util/mongooseShim");

const userWiseSubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    channelId: { type: String, default: null },
    isPublic: { type: Boolean, default: true }, // true for public, false for private
    expiryDate: { type: Date, default: null }, // only for paid
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userWiseSubscriptionSchema.index({ userId: 1 });
userWiseSubscriptionSchema.index({ channelId: 1 });
userWiseSubscriptionSchema.index({ userId: 1, channelId: 1 });
userWiseSubscriptionSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("UserWiseSubscription", userWiseSubscriptionSchema);
