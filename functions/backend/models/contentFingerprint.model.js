const mongoose = require("../util/mongooseShim");

const contentFingerprintSchema = new mongoose.Schema(
  {
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
    audioHash: { type: String, default: null }, // Chromaprint audio vector
    frameHashes: [{ type: String }], // Array of pHash strings for video frames
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

contentFingerprintSchema.index({ videoId: 1 });
// In a real postgres environment, we'd use pgvector or hamming distance indexes.
// Here we just store it. Audio matches require vector distance calculation.

module.exports = mongoose.model("ContentFingerprint", contentFingerprintSchema);
