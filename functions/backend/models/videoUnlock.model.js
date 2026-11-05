const mongoose = require("../util/mongooseShim");

const videoUnlockSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
    videoOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    unlockCost: { type: Number, default: 0 },
    unlockedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

videoUnlockSchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model("VideoUnlock", videoUnlockSchema);
