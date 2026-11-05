const { VIDEO_TYPE } = require("../types/constant");
const { VISIBILITY_TYPE } = require("../types/constant");
const { AUDIENCE_TYPE } = require("../types/constant");
const { COMMENT_TYPE } = require("../types/constant");
const { SCHEDULE_TYPE } = require("../types/constant");
const { VIDEO_PRIVACY_TYPE } = require("../types/constant");

const mongoose = require("../util/mongooseShim");

const videoSchema = new mongoose.Schema(
  {
    uniqueVideoId: { type: String, default: null },
    title: { type: String },
    description: { type: String },
    hashTag: [{ type: String }],
    videoType: { type: Number, enum: VIDEO_TYPE },
    videoPrivacyType: { type: Number, default: 1, enum: VIDEO_PRIVACY_TYPE }, //1.free 2.paid
    videoTime: { type: Number, min: 0 }, //Seconds
    videoUrl: { type: String }, // playable URL — the HLS .m3u8 once Stream is ready, else the raw R2 URL
    videoImage: { type: String },

    // ── Cloudflare Stream / HLS ──
    streamUid: { type: String, default: null },        // Cloudflare Stream video id
    hlsUrl: { type: String, default: null },           // …/manifest/video.m3u8
    dashUrl: { type: String, default: null },          // …/manifest/video.mpd
    videoDuration: { type: Number, default: 0 },       // seconds, from Stream
    availableResolutions: { type: String, default: "" },
    // pendingupload | queued | inprogress | ready | error | r2 (raw, not transcoded)
    streamStatus: { type: String, default: null },
    storageProvider: { type: String, default: "stream" }, // stream | r2 | local
    rawVideoUrl: { type: String, default: null },       // original R2 object, if any
    visibilityType: { type: Number, default: 1, enum: VISIBILITY_TYPE },
    audienceType: { type: Number, default: 2, enum: AUDIENCE_TYPE },
    commentType: { type: Number, default: 1, enum: COMMENT_TYPE },
    scheduleType: { type: Number, default: 2, enum: SCHEDULE_TYPE },
    scheduleTime: { type: String }, //if scheduleType 1 then SCHEDULED, if scheduleType 2 then NOW
    location: { type: String },
    locationCoordinates: {
      latitude: { type: String },
      longitude: { type: String },
    },

    soundListId: { type: mongoose.Schema.Types.ObjectId, ref: "SoundList", default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    channelId: { type: String, trim: true },

    isActive: { type: Boolean, default: true },
    isAddByAdmin: { type: Boolean, default: false },

    shareCount: { type: Number, default: 0 }, //when user share the video then shareCount increased
    like: { type: Number, default: 0 },
    dislike: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },

    creatorEarnedAmountInINR: { type: Number, default: 0 }, // total accumulated creator earnings for this video
    isEarningCapped: { type: Boolean, default: false }, // true when video creator earnings hit max cap
    isPromoted: { type: Boolean, default: false }, // true if video is currently part of an active VideoPromotion campaign

    // --- Content Moderation Engine (India IT Rules 2021) ---
    moderationStatus: { type: String, enum: ["approved", "pending_review", "rejected"], default: "approved" },
    isFlaggedAntiNational: { type: Boolean, default: false },
    flaggedKeywords: [{ type: String }],

    // --- Copyright & Duplicate Video Detection Engine ---
    isCopyrightFlagged: { type: Boolean, default: false }, // true if duplicate audio/video hash found (>85% match)
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

videoSchema.index({ uniqueVideoId: 1 });
videoSchema.index({ userId: 1 });
videoSchema.index({ soundListId: 1 });

module.exports = mongoose.model("Video", videoSchema);
