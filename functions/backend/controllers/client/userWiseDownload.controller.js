const UserWiseDownload = require("../../models/userWiseDownload.model");
const visibility = require("../../util/videoVisibility");

//import model
const User = require("../../models/user.model");
const Video = require("../../models/video.model");

//day.js
const dayjs = require("dayjs");

//when video download by the user then user wise downloaded video history created
exports.downloadVideoHistory = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.videoId)
      return res.status(200).json({
        status: false,
        message: "Oops ! Invalid details!!",
      });

    const [user, video, downloadVideoHistoryExist] = await Promise.all([
      User.findOne({ _id: req.query.userId, isActive: true }),
      Video.findOne({ _id: req.query.videoId, isActive: true }),
      UserWiseDownload.findOne({
        userId: req.query.userId,
        videoId: req.query.videoId,
      }),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "video does not found!!" });
    }

    if (downloadVideoHistoryExist) {
      return res.status(200).json({
        status: true,
        message: "Video downloaded already exists! ",
      });
    } else {
      const downloadVideoHistory = new UserWiseDownload();

      downloadVideoHistory.userId = user._id;
      downloadVideoHistory.videoId = video._id;
      await downloadVideoHistory.save();

      return res.status(200).json({
        status: true,
        message: "Success",
        downloadVideoHistory,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error!!",
    });
  }
};

//get user wise downloadVideoHistory
exports.getdownloadVideoHistory = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });
    }

    let now = dayjs();
    const [user, userWiseDownload] = await Promise.all([
      User.findOne({ _id: req.query.userId, isActive: true }),
      UserWiseDownload.aggregate([
        {
          $match: { userId: req.query.userId },
        },
        {
          $lookup: {
            from: "videos",
            localField: "videoId",
            foreignField: "_id",
            // F-12: a video made private / held / taken down since it was saved drops out.
            pipeline: [{ $match: visibility.savedItemMatch() }],
            as: "video",
          },
        },
        {
          $unwind: "$video",
        },
        {
          $lookup: {
            from: "users",
            localField: "video.channelId",
            foreignField: "channelId",
            as: "channel",
          },
        },
        {
          $unwind: "$channel",
        },
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
            views: { $size: "$views" },
            channelName: "$channel.fullName",
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
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    return res.status(200).json({ status: true, message: "get the history for that user!", getdownloadVideoHistory: userWiseDownload });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error!!",
    });
  }
};
