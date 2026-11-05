const mongoose = require("../util/mongooseShim");

const { MONETIZATIONREQUEST_STATUS } = require("../types/constant");

const monetizationRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    channelId: { type: String, default: "" }, //channelId of the particular that user
    channelName: { type: String, default: "" }, //channelName of the particular that user

    totalSubScribers: { type: Number, default: 0 }, //total subScriber at request time
    totalWatchTime: { type: Number, default: 0 }, //total watch time of the all videos of the particular channel at request time in minutes
    totalWatchTimeInHours: { type: Number, default: 0 }, //total watch time of the all videos of the particular channel at request time in hours
    minWatchTime: { type: Number, default: 0 }, //minimum watch time requried by admin at request time in hours
    minSubScriber: { type: Number, default: 0 }, //minimum subscriber requried by admin at request time

    status: { type: Number, default: 1, enum: MONETIZATIONREQUEST_STATUS },
    reason: { type: String, default: "" },
    requestDate: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("MonetizationRequest", monetizationRequestSchema);
