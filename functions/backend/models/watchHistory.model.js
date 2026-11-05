const mongoose = require("../util/mongooseShim");

const watchHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", default: null },
    videoUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    videoChannelId: { type: String, default: "" },
    totalWatchTime: { type: Number, default: 0 }, //Seconds
    videoDuration: { type: Number, required: true }, //Seconds
    totalWithdrawableAmount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

watchHistorySchema.index({ userId: 1 });
watchHistorySchema.index({ videoId: 1 });
watchHistorySchema.index({ videoUserId: 1 });
watchHistorySchema.index({ videoChannelId: 1 });

module.exports = mongoose.model("WatchHistory", watchHistorySchema);
