const mongoose = require("../util/mongooseShim");

const { LIVE_TYPE } = require("../types/constant");

const liveUserSchema = new mongoose.Schema(
  {
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    image: { type: String, default: "" },
    channel: { type: String, default: "" },
    view: { type: Number, default: 0 },

    title: { type: String, trim: true, default: "" },
    channelId: { type: String, trim: true, default: "" },
    channelName: { type: String, trim: true, default: "" },
    thumbnail: { type: String, trim: true, default: "" },
    liveType: { type: Number, enum: LIVE_TYPE }, //1.public 2.private

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    liveHistoryId: { type: mongoose.Schema.Types.ObjectId, ref: "LiveHistory" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

liveUserSchema.index({ userId: 1 });
liveUserSchema.index({ liveHistoryId: 1 });

module.exports = mongoose.model("LiveUser", liveUserSchema);
