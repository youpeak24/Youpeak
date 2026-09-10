/**
 * YouPeak – Pure Firestore Client Report & Content Moderation Controller
 * Implements IT Rules 2021: Auto-holds video (moderationStatus = "pending_review") when >= 5 reports received in 24 hours.
 */

"use strict";

const db = require("../../util/connection");
const moderation = require("../../util/moderation.service");

exports.reportToVideo = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    const videoId = req.query.videoId || req.body.videoId;
    const reportType = req.query.reportType || req.body.reportType;

    if (!userId || !videoId || !reportType) {
      return res.status(200).json({
        status: false,
        message: "Invalid request. userId, videoId and reportType are required.",
      });
    }

    const user = await db.findById("users", userId);
    if (!user || !user.isActive) {
      return res.status(200).json({ status: false, message: "User not found or inactive." });
    }
    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "Your account has been blocked by admin." });
    }

    const video = await db.findById("videos", videoId);
    if (!video || video.isActive === false) {
      return res.status(200).json({ status: false, message: "Video not found or inactive." });
    }

    const existingReport = await db.findOne("reports", { userId, videoId });
    if (existingReport) {
      return res.status(200).json({ status: false, message: "You have already reported this video." });
    }

    const reportData = {
      userId,
      videoId,
      videoType: video.videoType || 1,
      reportType,
      createdAt: new Date().toISOString(),
    };

    const reportToVideo = await db.create("reports", reportData);

    // IT Rules 2021 rolling-window auto-hold (config: reportAutoHoldThreshold / WindowHours)
    const hold = await moderation.applyReportAutoHold(videoId);

    return res.status(200).json({
      status: true,
      message: "Video reported successfully.",
      reportToVideo,
      underReview: hold.held || false,
    });
  } catch (error) {
    console.error("Report To Video Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
