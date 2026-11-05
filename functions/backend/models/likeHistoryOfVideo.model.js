const mongoose = require("../util/mongooseShim");

const likeHistoryOfVideoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
    channelId: { type: String, default: null },
    likeOrDislike: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

likeHistoryOfVideoSchema.index({ userId: 1 });
likeHistoryOfVideoSchema.index({ videoId: 1 });
likeHistoryOfVideoSchema.index({ likeOrDislike: 1 });

module.exports = mongoose.model("LikeHistoryOfVideo", likeHistoryOfVideoSchema);
