const SaveToWatchLater = require("../../models/saveToWatchLater.model");
const visibility = require("../../util/videoVisibility");
const engagement = require("../../util/engagement.service");

//import model
const User = require("../../models/user.model");
const Video = require("../../models/video.model");

//mongoose
const mongoose = require("../../util/mongooseShim");

//day.js
const dayjs = require("dayjs");

//user wise add video to saveToWatchLater
exports.addVideoToWatchLater = async (req, res) => {
  const logTag = "[WATCH_LATER_TOGGLE]";

  try {
    const { userId, videoId } = req.query;

    console.log(`${logTag} Request`, { userId, videoId });

    if (!userId || !videoId) {
      console.warn(`${logTag} Missing params`);
      return res.status(200).json({ status: false, message: "Oops! Invalid details!!" });
    }

    const [user, video] = await Promise.all([User.findOne({ _id: userId, isActive: true }).select("_id isBlock").lean(), Video.findOne({ _id: videoId, isActive: true }).select("_id").lean()]);

    if (!user) {
      console.warn(`${logTag} User not found`, { userId });
      return res.status(200).json({ status: false, message: "User not found!" });
    }

    if (user.isBlock) {
      console.warn(`${logTag} Blocked user attempt`, { userId });
      return res.status(200).json({ status: false, message: "You are blocked by admin!" });
    }

    if (!video) {
      console.warn(`${logTag} Video not found`, { videoId });
      return res.status(200).json({ status: false, message: "Video not found!" });
    }

    // An explicit `action=add|remove` is idempotent (a retry after a timeout
    // or a double tap leaves the same state). Without it the endpoint keeps
    // its old toggle behaviour for app versions that don't send it.
    const action = String(req.query.action || req.body?.action || "").toLowerCase();
    if (action && action !== "add" && action !== "remove") {
      return res.status(200).json({ status: false, message: "action must be add or remove." });
    }
    const saved = action ? action === "add" : !(await SaveToWatchLater.exists({ userId: String(userId), videoId: String(videoId) }));
    const r = await engagement.setWatchLater({ userId, videoId, saved });

    console.log(`${logTag} ${saved ? "Added to" : "Removed from"} watch later`, { userId, videoId, changed: r.changed });

    return res.status(200).json({
      status: true,
      message: saved ? "Video added to Watch Later" : "Video removed from Watch Later",
      isSaved: saved,
      changed: r.changed,
    });
  } catch (error) {
    console.error(`${logTag} Error`, error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get all saveToWatchLater videos for that user
exports.getSaveToWatchLater = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Invalid details!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;
    let now = dayjs();

    const user = await User.findOne({ _id: userId, isActive: true }, { isBlock: 1 }).lean();

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked!" });
    }

    const result = await SaveToWatchLater.aggregate([
      { $match: { userId: userId } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "videos",
          localField: "videoId",
          foreignField: "_id",
          pipeline: [
            // F-12: a video made private / held / taken down since it was saved drops out.
            { $match: visibility.savedItemMatch() },
            {
              $project: {
                _id: 1,
                title: 1,
                videoType: 1,
                videoTime: 1,
                videoUrl: 1,
                videoImage: 1,
                videoPrivacyType: 1,
                channelId: 1,
                createdAt: 1,
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
          localField: "video.channelId",
          foreignField: "channelId",
          pipeline: [
            {
              $project: {
                fullName: 1,
                image: 1,
                subscriptionCost: 1,
                videoUnlockCost: 1,
                channelType: 1,
                channelId: 1,
              },
            },
          ],
          as: "channel",
        },
      },
      { $unwind: "$channel" },
      {
        $lookup: {
          from: "userwisesubscriptions",
          localField: "channel.channelId",
          foreignField: "channelId",
          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
          as: "subscription",
        },
      },
      {
        $lookup: {
          from: "videounlocks",
          localField: "video._id",
          foreignField: "videoId",
          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
          as: "unlockData",
        },
      },
      {
        $addFields: {
          isSubscribed: { $gt: [{ $size: "$subscription" }, 0] },
          isUnlocked: { $gt: [{ $size: "$unlockData" }, 0] },
          storedPrivacyType: "$videoPrivacyType", // before the per-viewer recompute below
        },
      },
      {
        $addFields: {
          videoPrivacyType: {
            $cond: {
              if: {
                $or: [
                  { $eq: ["$video.videoPrivacyType", 1] }, // free video
                  "$isUnlocked", // individually unlocked
                  {
                    $and: [
                      { $eq: ["$channel.channelType", 2] }, // paid channel
                      "$isSubscribed",
                    ],
                  },
                ],
              },
              then: 1,
              else: 2,
            },
          },
        },
      },
      {
        $project: {
          userId: 1,
          videoId: "$video._id",
          videoTitle: "$video.title",
          videoType: "$video.videoType",
          videoTime: "$video.videoTime",
          videoUrl: "$video.videoUrl",
          videoImage: "$video.videoImage",
          videoPrivacyType: 1,
          channelName: "$channel.fullName",
          channelImage: "$channel.image",
          subscriptionCost: "$channel.subscriptionCost",
          // Free videos have no price, whatever the channel charges for its paid ones
          // (issue: free uploads were listed as "Premium Exclusive").
          videoUnlockCost: { $cond: [{ $eq: ["$storedPrivacyType", 2] }, "$channel.videoUnlockCost", 0] },
          isPaidVideo: { $eq: ["$storedPrivacyType", 2] },
          channelType: "$channel.channelType",
          isSubscribed: 1,
          time: {
            $let: {
              vars: {
                timeDiff: { $subtract: [now.toDate(), "$video.createdAt"] },
              },
              in: {
                $concat: [
                  {
                    $switch: {
                      branches: [
                        {
                          case: { $gte: ["$$timeDiff", 31536000000] },
                          then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } }, " years ago"] },
                        },
                        {
                          case: { $gte: ["$$timeDiff", 2592000000] },
                          then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } }, " months ago"] },
                        },
                        {
                          case: { $gte: ["$$timeDiff", 604800000] },
                          then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } }, " weeks ago"] },
                        },
                        {
                          case: { $gte: ["$$timeDiff", 86400000] },
                          then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } }, " days ago"] },
                        },
                        {
                          case: { $gte: ["$$timeDiff", 3600000] },
                          then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } }, " hours ago"] },
                        },
                        {
                          case: { $gte: ["$$timeDiff", 60000] },
                          then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } }, " minutes ago"] },
                        },
                        {
                          case: { $gte: ["$$timeDiff", 1000] },
                          then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } }, " seconds ago"] },
                        },
                        { case: true, then: "Just now" },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $facet: {
          data: [{ $skip: (start - 1) * limit }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const data = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.count || 0;

    return res.status(200).json({
      status: true,
      message: "Get saveToWatchLater videos for that user!",
      total,
      getSaveToWatchLater: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
