const Video = require("../../models/video.model");
const KeywordBlacklist = require("../../models/keywordBlacklist.model");
const Report = require("../../models/report.model");
const mongoose = require("../../util/mongooseShim");

// 1. Get Moderation Queue (Videos pending review)
exports.getModerationQueue = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const skip = (start - 1) * limit;

    const queue = await Video.find({ moderationStatus: "pending_review" })
      .populate("userId", "fullName nickName email image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Video.countDocuments({ moderationStatus: "pending_review" });

    // Enhance with report count for each video in the queue
    const enhancedQueue = await Promise.all(
      queue.map(async (video) => {
        const reportCount = await Report.countDocuments({ videoId: video._id });
        return {
          ...video.toObject(),
          reportCount,
        };
      })
    );

    return res.status(200).json({
      status: true,
      message: "Moderation queue fetched successfully.",
      total,
      queue: enhancedQueue,
    });
  } catch (error) {
    console.error("Error fetching moderation queue:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 2. Admin Action on Video (Approve or Reject/Takedown)
// IT Rules 2021 mandates takedown within 36 hours for certain flagged content
exports.moderateVideo = async (req, res) => {
  try {
    const { videoId, action, reason } = req.body || {};

    if (!videoId || !["approve", "reject"].includes(action)) {
      return res.status(200).json({ status: false, message: "Invalid moderation action." });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(200).json({ status: false, message: "Video not found." });
    }

    if (action === "approve") {
      video.moderationStatus = "approved";
      video.isFlaggedAntiNational = false;
      video.flaggedKeywords = [];
      await video.save();
    } else if (action === "reject") {
      video.moderationStatus = "rejected";
      video.isActive = false; // Takedown
      await video.save();
      // Optionally notify the user about the takedown reason here
    }

    return res.status(200).json({
      status: true,
      message: `Video successfully ${action}d.`,
      video,
    });
  } catch (error) {
    console.error("Error moderating video:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// 3. Keyword Blacklist Management
exports.getKeywords = async (req, res) => {
  try {
    const keywords = await KeywordBlacklist.find().sort({ createdAt: -1 });
    return res.status(200).json({
      status: true,
      message: "Keywords fetched successfully.",
      keywords,
    });
  } catch (error) {
    console.error("Error fetching keywords:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

exports.addKeyword = async (req, res) => {
  try {
    const { keyword, category } = req.body || {};
    if (!keyword) {
      return res.status(200).json({ status: false, message: "Keyword is required." });
    }

    const newKeyword = await KeywordBlacklist.create({
      keyword: keyword.trim().toLowerCase(),
      category: category || "anti_national",
    });

    return res.status(200).json({
      status: true,
      message: "Keyword added to blacklist.",
      keyword: newKeyword,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ status: false, message: "Keyword already exists." });
    }
    console.error("Error adding keyword:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

exports.deleteKeyword = async (req, res) => {
  try {
    const { keywordId } = req.query;
    if (!keywordId) {
      return res.status(200).json({ status: false, message: "Keyword ID is required." });
    }

    await KeywordBlacklist.findByIdAndDelete(keywordId);
    return res.status(200).json({
      status: true,
      message: "Keyword removed successfully.",
    });
  } catch (error) {
    console.error("Error deleting keyword:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
