const WatchHistory = require("../../models/watchHistory.model");
const visibility = require("../../util/videoVisibility");
const viewLedger = require("../../util/viewLedger.service");

//import model
const User = require("../../models/user.model");
const Video = require("../../models/video.model");
const WalletHistory = require("../../models/walletHistory.model");

//mongoose
const mongoose = require("../../util/mongooseShim");

//generateHistoryUniqueId
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

// Pay a video's creator for a viewer's newly verified watch time (WH-1).
// Shared by createWatchHistory (older app versions) and the heartbeat.
async function payCreatorForViewing({ userId, video }) {
  const earningPerHour = Number((global.settingJSON || {}).earningPerHour) || 0;
  const settled = await viewLedger.settleCreatorEarning({ userId, video, earningPerHour });
  if (!settled.ok || !(settled.earnings > 0)) return settled;
  const owner = await User.findOne({ _id: String(video.userId), isActive: true }).lean();
  if (!owner) return { ...settled, ok: false, reason: "OWNER_NOT_FOUND" };
  if (owner.isMonetization) {
    await User.updateOne({ _id: owner._id }, { $inc: { totalWithdrawableAmount: settled.earnings, totalEarningAmount: settled.earnings } });
    await WalletHistory.create({
      userId: owner._id,
      uniqueId: await generateHistoryUniqueId(),
      type: 1,
      amount: settled.earnings,
      totalWatchTimeInHours: settled.seconds / 3600,
      date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    });
  } else {
    // Monetization off: the earning is held on the account, as before.
    await User.updateOne({ _id: owner._id }, { $inc: { totalWithdrawableAmount: settled.earnings } });
  }
  return settled;
}
exports.payCreatorForViewing = payCreatorForViewing;

// Older app versions call this when playback pauses after 40% of a video.
// It used to credit the creator again on every call from the playhead the
// client reported, and answered before anything was saved (WH-1). Earnings
// now come only from the server's verified viewing record (viewLedger), each
// verified second once, saved before this answers; the client's numbers are
// ignored.
exports.createWatchHistory = async (req, res) => {
  try {
    const { userId, videoId } = req.query || {};
    if (!userId || !videoId) {
      return res.status(200).json({ status: false, message: "Invalid details." });
    }

    const [viewer, video] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }).lean(),
      Video.findOne({ _id: videoId, isActive: true }).lean(),
    ]);
    if (!viewer) return res.status(200).json({ status: false, message: "User not found!" });
    if (viewer.isBlock) return res.status(200).json({ status: false, message: "You are blocked!" });
    if (!video || !visibility.canView(video, userId)) {
      return res.status(200).json({ status: false, message: "Video or owner not found!" });
    }

    const settled = await payCreatorForViewing({ userId, video });
    return res.status(200).json({
      status: true,
      message: "Watch history processed.",
      credited: settled.ok ? settled.earnings : 0,
      reason: settled.ok ? undefined : settled.reason,
    });
  } catch (error) {
    console.error("❌ createWatchHistory Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get user wise watchHistory
exports.getWatchHistory = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const [user, result] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }).select("_id isBlock").lean(),
      WatchHistory.aggregate([
        {
          $match: { userId: userId },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $lookup: {
            from: "videos",
            let: { videoId: "$videoId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$videoId"] },
                },
              },
              // F-12: a video made private / held / taken down since it was watched drops out.
              { $match: visibility.savedItemMatch() },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  videoType: 1,
                  videoTime: 1,
                  videoUrl: 1,
                  videoImage: 1,
                  channelId: 1,
                },
              },
            ],
            as: "video",
          },
        },
        { $unwind: "$video" },
        {
          $lookup: {
            from: "users",
            let: { chId: "$video.channelId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$channelId", "$$chId"] },
                },
              },
              {
                $project: {
                  fullName: 1,
                },
              },
            ],
            as: "channel",
          },
        },
        { $unwind: "$channel" },
        {
          $lookup: {
            from: "watchhistories",
            let: { videoId: "$video._id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$videoId", "$$videoId"] },
                },
              },
              { $count: "count" },
            ],
            as: "views",
          },
        },
        {
          $project: {
            videoId: "$video._id",
            videoTitle: "$video.title",
            videoType: "$video.videoType",
            videoTime: "$video.videoTime",
            videoUrl: "$video.videoUrl",
            videoImage: "$video.videoImage",
            views: { $ifNull: [{ $arrayElemAt: ["$views.count", 0] }, 0] },
            channelName: "$channel.fullName",
          },
        },
        {
          $facet: {
            watchHistory: [{ $skip: (start - 1) * limit }, { $limit: limit }],
            total: [{ $count: "count" }],
          },
        },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    const watchHistory = result[0]?.watchHistory || [];
    const total = result[0]?.total[0]?.count || 0;

    return res.status(200).json({
      status: true,
      message: "get the history for that user!",
      total,
      watchHistory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get weekly analytics of views for a particular user, counting all videos across all their channels
exports.weeklyViewsAnalytics = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query || {};

    if (!userId) {
      return res.status(200).json({ status: false, message: "userId is required" });
    }

    if (!startDate || !endDate) {
      return res.status(200).json({ status: false, message: "startDate and endDate are required" });
    }

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    eDate.setHours(23, 59, 59, 999);

    const data = await WatchHistory.aggregate([
      {
        $match: {
          videoUserId: new mongoose.Types.ObjectId(userId),
          createdAt: {
            $gte: sDate,
            $lte: eDate,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          totalViews: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalViews: 1,
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Date-wise view analytics fetched successfully",
      views: data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
