const mongoose = require("../util/mongooseShim");

const keywordBlacklistSchema = new mongoose.Schema(
  {
    keyword: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["anti_national", "hate_speech", "violence", "defamation"],
      default: "anti_national",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

keywordBlacklistSchema.index({ keyword: 1 }, { unique: true });

module.exports = mongoose.model("KeywordBlacklist", keywordBlacklistSchema);
