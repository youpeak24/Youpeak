const Video = require("../../models/video.model");
const mongoose = require("../../util/mongooseShim");

// 1. Get Copyright Flagged Content Queue
exports.getFlaggedContent = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const skip = (start - 1) * limit;

    const queue = await Video.find({ isCopyrightFlagged: true })
      .populate("userId", "fullName nickName email image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Video.countDocuments({ isCopyrightFlagged: true });

    return res.status(200).json({
      status: true,
      message: "Flagged content fetched successfully.",
      total,
      queue,
    });
  } catch (error) {
    console.error("Error fetching flagged content:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 2. Admin Action on Copyright Flagged Video
exports.actionOnFlaggedContent = async (req, res) => {
  try {
    const { videoId, action } = req.body || {}; // action: "override" or "takedown"

    if (!videoId || !["override", "takedown"].includes(action)) {
      return res.status(200).json({ status: false, message: "Invalid action." });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(200).json({ status: false, message: "Video not found." });
    }

    if (action === "override") {
      // Admin approves override; remove flag
      video.isCopyrightFlagged = false;
      await video.save();
    } else if (action === "takedown") {
      // Execute permanent takedown
      video.isActive = false;
      video.isCopyrightFlagged = true; // keep it flagged
      await video.save();
    }

    return res.status(200).json({
      status: true,
      message: `Video successfully processed with action: ${action}.`,
      video,
    });
  } catch (error) {
    console.error("Error processing flagged content:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
