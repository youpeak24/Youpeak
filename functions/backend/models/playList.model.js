const { PLAYLIST_TYPE } = require("../types/constant");

const mongoose = require("../util/mongooseShim");

const playListSchema = new mongoose.Schema(
  {
    channelId: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    videoId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    playListName: { type: String, default: "" },
    playListType: { type: Number, enum: PLAYLIST_TYPE },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

playListSchema.index({ createdAt: -1 });
playListSchema.index({ channelId: 1 });
playListSchema.index({ userId: 1 });
playListSchema.index({ videoId: 1 });

module.exports = mongoose.model("PlayList", playListSchema);
