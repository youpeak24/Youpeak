/**
 * YouPeak – Pure Firestore Client Report & Content Moderation Controller
 * Implements IT Rules 2021: Auto-holds video (moderationStatus = "pending_review") when >= 5 reports received in 24 hours.
 */

"use strict";

const db = require("../../util/connection");

exports.reportToVideo = async (req, res) => {
  try {
    const { userId, videoId, reportType } = req.query;

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

    // IT Rules 2021 Auto-hold logic: If >= 5 reports in 24 hours, set moderationStatus = "pending_review"
    const allReportsForVideo = await db.find("reports", { videoId });
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReports = allReportsForVideo.filter((r) => {
      const created = r.createdAt ? new Date(r.createdAt) : new Date();
      return created >= twentyFourHoursAgo;
    });

    if (recentReports.length >= 5) {
      await db.update("videos", videoId, { moderationStatus: "pending_review" });
    }

    return res.status(200).json({
      status: true,
      message: "Video reported successfully.",
      reportToVideo,
    });
  } catch (error) {
    console.error("Report To Video Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
