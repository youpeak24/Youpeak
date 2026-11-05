const mongoose = require("../util/mongooseShim");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    title: { type: String, default: "" },
    message: { type: String, default: "" },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", default: null },
    channelImage: { type: String, default: "" },
    videoImage: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

notificationSchema.index({ userId: 1 });
notificationSchema.index({ videoId: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
