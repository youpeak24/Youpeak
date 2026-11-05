const Report = require("../../models/report.model");

//import model
const Video = require("../../models/video.model");
const Notification = require("../../models/notification.model");
const VideoComment = require("../../models/videoComment.model");
const SaveToWatchLater = require("../../models/saveToWatchLater.model");
const LikeHistoryOfVideo = require("../../models/likeHistoryOfVideo.model");
const PlayList = require("../../models/playList.model");
const LikeHistoryOfVideoComment = require("../../models/likeHistoryOfVideoComment.model");
const WatchHistory = require("../../models/watchHistory.model");
const PlaybackSession = require("../../models/playbackSession.model");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//get all reports of the video or shorts
exports.getReports = async (req, res) => {
  try {
    if (!req.query.videoType || !req.query.start || !req.query.limit || !req.query.startDate || !req.query.endDate) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });
    }

    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (start - 1) * limit;

    const search = req.query.search?.trim();
    const searchRegex = search ? new RegExp(search, "i") : null;

    let matchQuery = {
      videoType: Number(req.query.videoType),
    };

    if (req.query.startDate !== "All" && req.query.endDate !== "All") {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);

      matchQuery.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const result = await Report.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          totalReports: [{ $count: "count" }],
          reports: [
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                pipeline: [
                  // {
                  //   $match: {
                  //     isActive: true,
                  //     isBlock: false,
                  //   },
                  // },
                  {
                    $project: {
                      uniqueId: 1,
                      fullName: 1,
                      nickName: 1,
                      image: 1,
                    },
                  },
                ],
                as: "user",
              },
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

            {
              $lookup: {
                from: "videos",
                localField: "videoId",
                foreignField: "_id",
                pipeline: [
                  // {
                  //   $match: {
                  //     isActive: true,
                  //   },
                  // },
                  {
                    $project: {
                      title: 1,
                      videoImage: 1,
                      uniqueVideoId: 1,
                    },
                  },
                ],
                as: "video",
              },
            },
            { $unwind: { path: "$video", preserveNullAndEmptyArrays: true } },

            ...(search
              ? [
                  {
                    $match: {
                      $or: [
                        { reportType: { $regex: searchRegex } },
                        { "user.uniqueId": { $regex: searchRegex } },
                        { "user.fullName": { $regex: searchRegex } },
                        { "user.nickName": { $regex: searchRegex } },
                        { "video.title": { $regex: searchRegex } },
                        { "video.uniqueVideoId": { $regex: searchRegex } },
                      ],
                    },
                  },
                ]
              : []),

            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },

            {
              $project: {
                reportType: 1,
                createdAt: 1,
                uniqueId: "$user.uniqueId",
                fullName: "$user.fullName",
                nickName: "$user.nickName",
                image: "$user.image",
                videoTitle: "$video.title",
                videoImage: "$video.videoImage",
                uniqueVideoId: "$video.uniqueVideoId",
              },
            },
          ],
        },
      },
    ]);

    const data = result[0];

    return res.status(200).json({
      status: true,
      message: "Reports fetched successfully.",
      totalReports: data.totalReports.length ? data.totalReports[0].count : 0,
      reports: data.reports || [],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete reports of the video by admin (multiple or single)
exports.deleteVideoReport = async (req, res) => {
  try {
    const { reportId } = req.query || {};

    if (!reportId) {
      return res.status(200).json({ status: false, message: "reportId must be required!" });
    }

    const reportIds = reportId.split(",");

    const reports = await Report.find({ _id: { $in: reportIds } })
      .select("videoId")
      .lean();

    if (!reports.length) {
      return res.status(404).json({ status: false, message: "No reports of the video found with the provided IDs." });
    }

    const videoIds = [...new Set(reports.map((r) => r.videoId.toString()))];

    const videos = await Video.find({ _id: { $in: videoIds } })
      .select("_id videoImage videoUrl")
      .lean();

    res.status(200).json({
      status: true,
      message: "Selected reports and associated video data have been successfully deleted.",
    });

    const comments = await VideoComment.find({
      videoId: { $in: videoIds },
    })
      .select("_id")
      .lean();

    const commentIds = comments.map((c) => c._id);

    await Promise.all(
      videos.map(async (video) => {
        if (video.videoImage) {
          await deleteFromStorage(video.videoImage);
        }

        if (video.videoUrl) {
          await deleteFromStorage(video.videoUrl);
        }
      }),
    );

    await Promise.all([
      Notification.deleteMany({ videoId: { $in: videoIds } }),
      LikeHistoryOfVideo.deleteMany({ videoId: { $in: videoIds } }),
      commentIds.length ? LikeHistoryOfVideoComment.deleteMany({ videoCommentId: { $in: commentIds } }) : null,
      VideoComment.deleteMany({ videoId: { $in: videoIds } }),
      Report.deleteMany({ videoId: { $in: videoIds } }),
      SaveToWatchLater.deleteMany({ videoId: { $in: videoIds } }),
      WatchHistory.deleteMany({ videoId: { $in: videoIds } }),
      PlaybackSession.deleteMany({ videoId: { $in: videoIds } }),
      PlayList.updateMany({ videoId: { $in: videoIds } }, { $pull: { videoId: { $in: videoIds } } }),
      Video.deleteMany({ _id: { $in: videoIds } }),
      Report.deleteMany({ _id: { $in: reportIds } }),
    ]);
  } catch (error) {
    console.log("deleteVideoReport Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
