const mongoose = require("../util/mongooseShim");

const likeHistoryOfVideoCommentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    videoCommentId: { type: mongoose.Schema.Types.ObjectId, ref: "VideoComment" },
    likeOrDislike: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

likeHistoryOfVideoCommentSchema.index({ userId: 1 });
likeHistoryOfVideoCommentSchema.index({ videoCommentId: 1 });
likeHistoryOfVideoCommentSchema.index({ likeOrDislike: 1 });

module.exports = mongoose.model("LikeHistoryOfVideoComment", likeHistoryOfVideoCommentSchema);
