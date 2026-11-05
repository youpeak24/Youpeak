const PlaybackSession = require("../../models/playbackSession.model");
const visibility = require("../../util/videoVisibility");

//import model
const User = require("../../models/user.model");
const Video = require("../../models/video.model");

const mongoose = require("../../util/mongooseShim");

const dayjs = require("dayjs");

// Sync video watch progress (Heartbeat / Resume feature)
exports.syncPlayback = async (req, res) => {
  try {
    const { userId, videoId, currentSeconds } = req.body || {};

    if (!userId || !videoId || currentSeconds === undefined) {
      return res.status(200).json({ status: false, message: "Missing required tracking data." });
    }

    const [userExists, videoExists] = await Promise.all([User.findById(userId).select("_id").lean(), Video.findById(videoId).select("videoTime userId channelId").lean()]);

    if (!userExists || !videoExists) {
      return res.status(200).json({ status: false, message: "User or Video not found." });
    }

    const hasFinished = currentSeconds / videoExists.videoTime >= 0.9; // Mark as finished if user has viewed at least 90% of the video

    const updateData = {
      $set: {
        progress: currentSeconds,
        isFinished: hasFinished,
        videoDuration: videoExists.videoTime,
      },
      $setOnInsert: {
        watchCount: 1,
        videoUserId: videoExists.userId,
        videoChannelId: videoExists.channelId || "",
      },
    };

    await PlaybackSession.findOneAndUpdate({ userId, videoId }, updateData, {
      upsert: true,
      new: true,
    });

    return res.status(200).json({
      status: true,
      message: "Playback progress synchronized.",
    });
  } catch (error) {
    console.error("Sync Error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error", error: error.message });
  }
};

// Fetch user watch history with video details
exports.getMyWatchHistory = async (req, res) => {
  try {
    const userId = req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId) ? new mongoose.Types.ObjectId(req.query.userId) : null;

    if (!userId) {
      return res.status(200).json({ status: false, message: "Valid User ID is required." });
    }

    const videoType = req.query.videoType ? parseInt(req.query.videoType) : null; // videoType: 1 for Videos, 2 for Shorts

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    if (isNaN(start) || start <= 0 || isNaN(limit) || limit <= 0) {
      return res.status(200).json({
        status: false,
        message: "'start' and 'limit' must be valid positive integers.",
      });
    }

    const skip = (start - 1) * limit;
    let now = dayjs();

    const historyData = await PlaybackSession.aggregate([
      { $match: { userId: userId } },
      { $sort: { updatedAt: -1 } },
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
      { $unwind: { path: "$video", preserveNullAndEmptyArrays: true } },
      ...(videoType ? [{ $match: { "video.videoType": videoType } }] : []),
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
          as: "channelDetails",
        },
      },
      { $unwind: { path: "$channelDetails", preserveNullAndEmptyArrays: true } },
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
        $lookup: {
          from: "userwisesubscriptions",
          localField: "channelDetails.channelId",
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
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                progress: 1,
                videoDuration: 1,
                isFinished: 1,
                updatedAt: 1,
                videoId: 1,
                videoPrivacyType: 1,
                videoType: "$video.videoType",
                title: "$video.title",
                description: "$video.description",
                videoTime: "$video.videoTime",
                videoImage: "$video.videoImage",
                videoUrl: "$video.videoUrl",
                views: { $ifNull: [{ $arrayElemAt: ["$views.count", 0] }, 0] },
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
                channelName: "$channelDetails.fullName",
                channelImage: "$channelDetails.image",
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
      {
        $project: {
          data: 1,
          total: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
        },
      },
    ]);

    const result = historyData[0] || { data: [], total: 0 };

    return res.status(200).json({
      status: true,
      message: "Watch history retrieved successfully.",
      total: result.total,
      data: result.data,
    });
  } catch (error) {
    console.error("Get History Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Remove all watch history for a specific user
exports.clearAllWatchHistory = async (req, res) => {
  try {
    const { userId } = req.query || {};

    if (!userId) {
      return res.status(200).json({ status: false, message: "User ID is required." });
    }

    await PlaybackSession.deleteMany({ userId });

    return res.status(200).json({
      status: true,
      message: "Watch history cleared successfully.",
    });
  } catch (error) {
    console.error("Error clearing history:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
