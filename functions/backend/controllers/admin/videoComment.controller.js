const VideoComment = require("../../models/videoComment.model");

//import model
const Video = require("../../models/video.model");

//get particular video's comment
exports.getComment = async (req, res) => {
  try {
    if (!req.query.videoId || !req.query.start || !req.query.limit) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });
    }

    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const videoId = new mongoose.Types.ObjectId(req.query.videoId);

    const videoExists = await Video.exists({
      _id: videoId,
      isActive: true,
    });

    if (!videoExists) {
      return res.status(200).json({ status: false, message: "video does not found!" });
    }

    const result = await VideoComment.aggregate([
      {
        $match: {
          videoId: videoId,
          recursiveCommentId: null,
        },
      },
      {
        $facet: {
          totalComments: [{ $count: "count" }],
          videoComment: [
            { $sort: { createdAt: -1 } },
            { $skip: (start - 1) * limit },
            { $limit: limit },

            {
              $lookup: {
                from: "videos",
                let: { videoId: "$videoId" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$videoId"] },
                      isActive: true,
                    },
                  },
                  {
                    $project: {
                      title: 1,
                      uniqueVideoId: 1,
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
                let: { userId: "$userId" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$userId"] },
                    },
                  },
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
            { $unwind: "$user" },

            {
              $project: {
                videoTitle: "$video.title",
                uniqueVideoId: "$video.uniqueVideoId",
                uniqueId: "$user.uniqueId",
                fullName: "$user.fullName",
                nickName: "$user.nickName",
                userImage: "$user.image",
                commentText: 1,
                createdAt: 1,
                videoId: 1,
                userId: 1,
              },
            },
          ],
        },
      },
    ]);

    const data = result[0];

    return res.status(200).json({
      status: true,
      message: "Comments fetched successfully.",
      total: data.totalComments.length > 0 ? data.totalComments[0].count : 0,
      videoComment: data.videoComment,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get all videos's comment
exports.commentsOfVideos = async (req, res) => {
  try {
    if (!req.query.start || !req.query.limit || !req.query.startDate || !req.query.endDate || !req.query.videoType) {
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

    const result = await VideoComment.aggregate([
      { $match: matchQuery },

      {
        $facet: {
          totalComments: [{ $count: "count" }],
          commentsOfVideos: [
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                pipeline: [
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
                  {
                    $project: {
                      title: 1,
                      uniqueVideoId: 1,
                    },
                  },
                ],
                as: "video",
              },
            },

            {
              $unwind: { path: "$video", preserveNullAndEmptyArrays: true },
            },

            ...(search
              ? [
                  {
                    $match: {
                      $or: [
                        { commentText: { $regex: searchRegex } },
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
                videoTitle: "$video.title",
                uniqueVideoId: "$video.uniqueVideoId",
                uniqueId: "$user.uniqueId",
                fullName: "$user.fullName",
                nickName: "$user.nickName",
                userImage: "$user.image",
                commentText: 1,
                videoId: 1,
                userId: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
    ]);

    const data = result[0];

    return res.status(200).json({
      status: true,
      message: "Comments retrieved successfully.",
      totalComments: data.totalComments.length ? data.totalComments[0].count : 0,
      commentsOfVideos: data.commentsOfVideos || [],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//delete videoComment by admin (multiple or single)
exports.deleteVideoComment = async (req, res) => {
  try {
    const { videoCommentId } = req.query;

    if (!videoCommentId) {
      return res.status(200).json({ status: false, message: "videoCommentId is required!" });
    }

    const videoCommentIds = videoCommentId.split(",");

    const result = await VideoComment.deleteMany({
      _id: { $in: videoCommentIds },
    });

    if (!result.deletedCount) {
      return res.status(200).json({ status: false, message: "No videoComments found with the provided IDs." });
    }

    return res.status(200).json({
      status: true,
      message: `${result.deletedCount} videoComments deleted by admin.`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
