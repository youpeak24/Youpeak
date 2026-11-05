const mongoose = require("../util/mongooseShim");

const userWiseDownloadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userWiseDownloadSchema.index({ userId: 1 });
userWiseDownloadSchema.index({ videoId: 1 });

module.exports = mongoose.model("UserWiseDownload", userWiseDownloadSchema);
