const mongoose = require("../util/mongooseShim");

const playbackSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
    videoUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    videoChannelId: { type: String, default: "" },
    progress: { type: Number, default: 0 }, //Seconds
    videoDuration: { type: Number, required: true }, //Seconds
    isFinished: { type: Boolean, default: false },
    watchCount: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

playbackSessionSchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model("PlaybackSession", playbackSessionSchema);
