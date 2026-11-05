const mongoose = require("../util/mongooseShim");

const advertiseSchema = new mongoose.Schema(
  {
    isGoogle: { type: Boolean, default: false },
    android: {
      google: {
        interstitial: { type: String, default: "android_interstitial_id" },
        native: { type: String, default: "android_native_id" },
        nativeAdVideo: { type: String, default: "android_native_id" },
        reward: { type: String, default: "android_reward_id" },
        videoAdUrl: { type: String, default: "android_video_ad_url__id" },
      },
    },
    ios: {
      google: {
        interstitial: { type: String, default: "ios_interstitial_id" },
        native: { type: String, default: "ios_native_id" },
        nativeAdVideo: { type: String, default: "ios_native_id" },
        reward: { type: String, default: "ios_reward_id" },
        videoAdUrl: { type: String, default: "ios_video_ad_url__id" },
      },
    },
    imaTagsUrl: { type: [String], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

advertiseSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Advertise", advertiseSchema);
