const VideoComment = require("../../models/videoComment.model");

const mongoose = require("../../util/mongooseShim");

//import model
const User = require("../../models/user.model");
const Video = require("../../models/video.model");
const LikeHistoryOfVideoComment = require("../../models/likeHistoryOfVideoComment.model");
const History = require("../../models/history.model");
const Notification = require("../../models/notification.model");

//private key
const admin = require("../../util/privateKey");

//generateHistoryUniqueId
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

//reward engine (daily caps + coin crediting)
const rewardEngine = require("../../util/rewardEngine");

//content moderation (IT Rules 2021 keyword screening) — was only ever wired
//to video title/description/transcript; comments are free-form user text
//with zero upload friction and were never screened at all.
const moderation = require("../../util/moderation.service");

//day.js
const dayjs = require("dayjs");

const crypto = require("crypto");
const db = require("../../util/connection");
const visibility = require("../../util/videoVisibility");

// Upload form "Comments" policy (videos.commentType, 1-based):
// 1 allow all · 2 disabled · 3 hold potentially inappropriate (the keyword
// screen below refuses those) · 4 hold all for review.
const COMMENTS_DISABLED = 2;
const HOLD_ALL_FOR_REVIEW = 4;
const MAX_COMMENT_LENGTH = 1000;

//create user wise comment for video
exports.createComment = async (req, res) => {
  try {
    const { userId, videoId } = req.body;
    const commentText = req.body.commentText?.trim();

    if (!userId || !videoId || !commentText) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    const [user, video, alreadyCommented] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }).lean(),
      Video.findById(videoId).lean(),
      VideoComment.exists({ userId, videoId }),
    ]);
    if (commentText.length > MAX_COMMENT_LENGTH) {
      return res.status(200).json({ status: false, code: "COMMENT_TOO_LONG", message: `Comments can be at most ${MAX_COMMENT_LENGTH} characters.` });
    }

    if (!user) {
      return res.status(200).json({
        status: false,
        message: "User does not exist!",
      });
    }

    if (user.isBlock) {
      return res.status(200).json({
        status: false,
        message: "You are blocked by admin!",
      });
    }

    if (!video || !visibility.canView(video, userId)) {
      return res.status(200).json({
        status: false,
        message: "Video not found!",
      });
    }

    // The upload form stores the comment policy as a number or a numeric
    // string; compare numerically (=== 2 missed "2" and let comments through).
    if (Number(video.commentType) === COMMENTS_DISABLED) {
      return res.status(200).json({
        status: false,
        code: "COMMENTS_DISABLED",
        message: "Comments are disabled for this video.",
      });
    }

    const screening = moderation.cfg().enabled ? await moderation.screenText(commentText) : { flagged: false };
    if (screening.flagged) {
      console.warn(`Comment blocked by keyword filter: user=${userId} video=${videoId} matched=${screening.matched.join(",")}`);
      return res.status(200).json({
        status: false,
        message: "Your comment contains content that isn't allowed. Please revise it.",
      });
    }

    // "Hold all comments for review": a viewer's comment is stored but shown
    // only to its author and the video's owner.
    const held = Number(video.commentType) === HOLD_ALL_FOR_REVIEW && String(video.userId) !== String(userId);
    const fields = {
      userId: String(userId),
      videoId: String(videoId),
      channelId: video.channelId || null,
      videoType: video.videoType,
      commentText,
      recursiveCommentId: null,
      like: 0,
      dislike: 0,
      totalReplies: 0,
      ...(held ? { status: "held" } : {}),
    };

    // Idempotent create: a retry or double tap carrying the same requestId
    // returns the first comment instead of posting it twice. Older apps
    // without a requestId get the same text within 30 s de-duplicated.
    const requestId = String(req.body.requestId || "").trim().slice(0, 64);
    let videoComment;
    if (requestId) {
      const id = "vc_" + crypto.createHash("sha1").update(`${userId}|${videoId}|${requestId}`).digest("hex").slice(0, 28);
      const once = await db.createOnce("VideoComment", id, fields);
      if (!once.created) {
        const existing = await VideoComment.findById(id).lean();
        return res.status(200).json({ status: true, duplicate: true, message: "Comment added successfully.", data: existing, coinsEarned: 0, rewardStatus: "DUPLICATE", held: existing?.status === "held" });
      }
      videoComment = once.doc;
    } else {
      const recent = (await VideoComment.find({ userId: String(userId), videoId: String(videoId) }).lean())
        .find((c) => c.commentText === commentText && Date.now() - new Date(c.createdAt).getTime() < 30000);
      if (recent) {
        return res.status(200).json({ status: true, duplicate: true, message: "Comment added successfully.", data: recent, coinsEarned: 0, rewardStatus: "DUPLICATE", held: recent.status === "held" });
      }
      videoComment = await VideoComment.create(fields);
    }

    // Reward only on the user's FIRST comment for this video, and only within
    // the daily comment cap + daily earning cap. Server decides the amount.
    let coinsEarned = 0;
    let rewardStatus = "SKIPPED";
    if (!alreadyCommented) {
      const r = await rewardEngine.creditReward({
        userId,
        kind: "comment",
        historyType: rewardEngine.HISTORY_TYPE.VIDEO_COMMENT,
        countField: "dailyCommentsToday",
        capField: "maxCommentsPerDay",
        dedupeVideoId: videoId,
        meta: { videoId },
      });
      coinsEarned = r.ok ? r.credited : 0;
      rewardStatus = r.reason;

      if (coinsEarned > 0 && user.fcmToken) {
        try {
          admin.messaging().send({
            token: user.fcmToken,
            notification: {
              title: "🚀 You've Earned Coins for Your Comment! 🌟",
              body: `You earned ${coinsEarned} coins for commenting on a video! 🎬💬`,
            },
            data: { type: "ENGAGEMENT_COMMENTING_REWARD" },
          }).catch(() => {});
        } catch (e) {}
      }
    }

    return res.status(200).json({
      status: true,
      message: held ? "Your comment will appear after the creator reviews it." : "Comment added successfully.",
      data: videoComment,
      held,
      coinsEarned,
      rewardStatus,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//create like or dislike for comment
exports.likeOrDislike = async (req, res) => {
  try {
    console.log("🔔 likeOrDislike API called");
    console.log("➡️ Request Query:", req.query);

    const { userId, videoCommentId, likeOrDislike } = req.query || {};

    if (!userId || !videoCommentId || !likeOrDislike) {
      console.log("❌ Missing required params");
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    const validTypes = ["like", "dislike", "likeremove", "dislikeremove"];
    if (!validTypes.includes(likeOrDislike)) {
      console.log("❌ Invalid likeOrDislike type:", likeOrDislike);
      return res.status(200).json({ status: false, message: "Invalid likeOrDislike type!" });
    }

    const [user, videoComment, existingHistory] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }),
      VideoComment.findById(videoCommentId),
      LikeHistoryOfVideoComment.findOne({
        userId,
        videoCommentId,
        $or: [{ likeOrDislike: "like" }, { likeOrDislike: "dislike" }],
      }),
    ]);

    console.log("👤 User:", user?._id || "not found");
    console.log("💬 VideoComment:", videoComment?._id || "not found");
    console.log("📜 Existing History:", existingHistory?.likeOrDislike || "none");

    if (!user) return res.status(200).json({ status: false, message: "User not found!" });
    if (user.isBlock) return res.status(200).json({ status: false, message: "You are blocked by admin!" });
    if (!videoComment) return res.status(200).json({ status: false, message: "Video comment not found!" });

    /* ===================== LIKE REMOVE ===================== */
    if (likeOrDislike === "likeremove") {
      console.log("🗑️ Processing likeremove request");

      if (existingHistory?.likeOrDislike === "like") {
        console.log("⬇️ Decreasing like count");
        videoComment.like = Math.max(0, videoComment.like - 1);

        await Promise.all([videoComment.save(), LikeHistoryOfVideoComment.deleteOne({ _id: existingHistory._id })]);

        console.log("✅ Like removed successfully");
      } else {
        console.log("⚠️ No existing like to remove");
      }

      return res.status(200).json({ status: true, message: "Like removed successfully", isLike: false });
    }

    /* ===================== DISLIKE REMOVE ===================== */
    if (likeOrDislike === "dislikeremove") {
      console.log("🗑️ Processing dislikeremove request");

      if (existingHistory?.likeOrDislike === "dislike") {
        console.log("⬇️ Decreasing dislike count");
        videoComment.dislike = Math.max(0, videoComment.dislike - 1);

        await Promise.all([videoComment.save(), LikeHistoryOfVideoComment.deleteOne({ _id: existingHistory._id })]);

        console.log("✅ Dislike removed successfully");
      } else {
        console.log("⚠️ No existing dislike to remove");
      }

      return res.status(200).json({ status: true, message: "Dislike removed successfully", isLike: false });
    }

    /* ===================== LIKE ===================== */
    if (likeOrDislike === "like") {
      console.log("👍 Processing like request");

      if (existingHistory?.likeOrDislike === "like") {
        console.log("⚠️ Already liked");
        return res.status(200).json({ status: true, message: "Already liked", isLike: true });
      }

      videoComment.like += 1;
      if (existingHistory?.likeOrDislike === "dislike") {
        console.log("↔️ Switching dislike → like");
        videoComment.dislike = Math.max(0, videoComment.dislike - 1);
      }

      await Promise.all([
        videoComment.save(),
        LikeHistoryOfVideoComment.deleteOne({ userId, videoCommentId, likeOrDislike: "dislike" }),
        LikeHistoryOfVideoComment.create({ userId, videoCommentId, likeOrDislike: "like" }),
      ]);

      console.log("✅ Like completed successfully");
      return res.status(200).json({ status: true, message: "Comment liked successfully", isLike: true });
    }

    /* ===================== DISLIKE ===================== */
    if (likeOrDislike === "dislike") {
      console.log("👎 Processing dislike request");

      if (existingHistory?.likeOrDislike === "dislike") {
        console.log("⚠️ Already disliked");
        return res.status(200).json({ status: true, message: "Already disliked", isLike: false });
      }

      videoComment.dislike += 1;
      if (existingHistory?.likeOrDislike === "like") {
        console.log("↔️ Switching like → dislike");
        videoComment.like = Math.max(0, videoComment.like - 1);
      }

      await Promise.all([
        videoComment.save(),
        LikeHistoryOfVideoComment.deleteOne({ userId, videoCommentId, likeOrDislike: "like" }),
        LikeHistoryOfVideoComment.create({ userId, videoCommentId, likeOrDislike: "dislike" }),
      ]);

      console.log("✅ Dislike completed successfully");
      return res.status(200).json({ status: true, message: "Comment disliked successfully", isLike: false });
    }
  } catch (error) {
    console.error("API ERROR:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get commentType wise all comments for particular video (top, mostLiked, newest)
exports.getComments = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.videoId || !req.query.commentType) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });
    }

    const userObjectId = new mongoose.Types.ObjectId(req.query.userId);
    const videoObjectId = new mongoose.Types.ObjectId(req.query.videoId);

    const page = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let now = dayjs();

    let sortStage = {};
    if (req.query.commentType === "top") sortStage = { totalReplies: -1 };
    else if (req.query.commentType === "mostLiked") sortStage = { like: -1 };
    else if (req.query.commentType === "newest") sortStage = { createdAt: -1 };
    else {
      return res.status(200).json({ status: false, message: "commentType must be passed valid!" });
    }

    const video = await Video.findById(req.query.videoId).lean();
    const viewerId = req.appUserId || null;
    if (!video || !visibility.canView(video, viewerId)) {
      return res.status(200).json({ status: false, message: "Video not found!" });
    }
    const isOwner = !!viewerId && String(video.userId) === String(viewerId);
    // Held comments are visible to their author and to the video's owner only.
    const heldFilter = isOwner ? {} : { $or: [{ status: { $ne: "held" } }, ...(viewerId ? [{ userId: String(viewerId) }] : [])] };

    const result = await VideoComment.aggregate([
      {
        $match: { videoId: videoObjectId, recursiveCommentId: null, ...heldFilter },
      },
      {
        $facet: {
          videoComment: [
            // Ties (same reply/like count) fall back to newest first, so pages are stable.
            { $sort: { ...sortStage, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                pipeline: [{ $project: { fullName: 1, image: 1, channelId: 1 } }],
                as: "user",
              },
            },
            { $unwind: "$user" },
            {
              $lookup: {
                from: "likehistoryofvideocomments",
                let: {
                  videoCommentId: "$_id",
                  userId: userObjectId,
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [{ $eq: ["$videoCommentId", "$$videoCommentId"] }, { $eq: ["$userId", "$$userId"] }],
                      },
                    },
                  },
                ],
                as: "likeHistory",
              },
            },
            {
              $unwind: {
                path: "$likeHistory",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                userId: "$user._id",
                status: 1, // "held" (hold-for-review) is shown to its author and the owner
                fullName: "$user.fullName",
                userImage: "$user.image",
                channelId: "$user.channelId",
                commentText: 1,
                like: 1,
                dislike: 1,
                totalReplies: 1,
                createdAt: 1,
                recursiveCommentId: 1,
                videoId: 1,
                isLike: {
                  $cond: [{ $eq: ["$likeHistory.likeOrDislike", "like"] }, true, false],
                },
                isDislike: {
                  $cond: [{ $eq: ["$likeHistory.likeOrDislike", "dislike"] }, true, false],
                },
                time: {
                  $let: {
                    vars: {
                      timeDiff: { $subtract: [now.toDate(), "$createdAt"] },
                    },
                    in: {
                      $concat: [
                        {
                          $switch: {
                            branches: [
                              {
                                case: { $gte: ["$$timeDiff", 31536000000] },
                                then: {
                                  $concat: [
                                    {
                                      $toString: {
                                        $floor: { $divide: ["$$timeDiff", 31536000000] },
                                      },
                                    },
                                    " years ago",
                                  ],
                                },
                              },
                              {
                                case: { $gte: ["$$timeDiff", 2592000000] },
                                then: {
                                  $concat: [
                                    {
                                      $toString: {
                                        $floor: { $divide: ["$$timeDiff", 2592000000] },
                                      },
                                    },
                                    " months ago",
                                  ],
                                },
                              },
                              {
                                case: { $gte: ["$$timeDiff", 604800000] },
                                then: {
                                  $concat: [
                                    {
                                      $toString: {
                                        $floor: { $divide: ["$$timeDiff", 604800000] },
                                      },
                                    },
                                    " weeks ago",
                                  ],
                                },
                              },
                              {
                                case: { $gte: ["$$timeDiff", 86400000] },
                                then: {
                                  $concat: [
                                    {
                                      $toString: {
                                        $floor: { $divide: ["$$timeDiff", 86400000] },
                                      },
                                    },
                                    " days ago",
                                  ],
                                },
                              },
                              {
                                case: { $gte: ["$$timeDiff", 3600000] },
                                then: {
                                  $concat: [
                                    {
                                      $toString: {
                                        $floor: { $divide: ["$$timeDiff", 3600000] },
                                      },
                                    },
                                    " hours ago",
                                  ],
                                },
                              },
                              {
                                case: { $gte: ["$$timeDiff", 60000] },
                                then: {
                                  $concat: [
                                    {
                                      $toString: {
                                        $floor: { $divide: ["$$timeDiff", 60000] },
                                      },
                                    },
                                    " minutes ago",
                                  ],
                                },
                              },
                              {
                                case: { $gte: ["$$timeDiff", 1000] },
                                then: {
                                  $concat: [
                                    {
                                      $toString: {
                                        $floor: { $divide: ["$$timeDiff", 1000] },
                                      },
                                    },
                                    " seconds ago",
                                  ],
                                },
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
          ],
          totalCount: [{ $count: "total" }],
        },
      },
    ]);

    const videoComment = result[0].videoComment.map((c) => ({
      ...c,
      isHeld: c.status === "held",
      // Management actions the server will accept from this viewer.
      canDelete: !!viewerId && (String(c.userId?._id || c.userId) === String(viewerId) || isOwner),
    }));
    const total = result[0].totalCount[0]?.total || 0;

    return res.status(200).json({
      status: true,
      message: "finally, get commentType wise all comments for particular video!",
      total,
      commentsDisabled: Number(video.commentType) === COMMENTS_DISABLED,
      videoComment,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//create user wise reply to particular comment of particular video
exports.createCommentReply = async (req, res) => {
  try {
    if (!req.body.userId || !req.body.videoId || !req.body.commentText || !req.body.videoCommentId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });
    }

    const [user, video, videoCommentAlreadyExist] = await Promise.all([
      User.findOne({ _id: req.body.userId, isActive: true }),
      Video.findOne({ _id: req.body.videoId, isActive: true }),
      VideoComment.findById(req.body.videoCommentId),
    ]);

    if (!user) {
      return res.status(404).json({ status: false, message: "user does not found!!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "video does not found!!" });
    }

    if (!videoCommentAlreadyExist || String(videoCommentAlreadyExist.videoId) !== String(video._id) || !visibility.canView(video, req.body.userId)) {
      return res.status(200).json({ status: false, message: "videoComment does not found!" });
    }
    if (Number(video.commentType) === COMMENTS_DISABLED) {
      return res.status(200).json({ status: false, code: "COMMENTS_DISABLED", message: "Comments are disabled for this video." });
    }
    if (!req.body.commentText.trim() || req.body.commentText.trim().length > MAX_COMMENT_LENGTH) {
      return res.status(200).json({ status: false, code: "COMMENT_INVALID", message: `Replies must be 1–${MAX_COMMENT_LENGTH} characters.` });
    }

    const replyText = req.body.commentText?.trim();
    const screening = moderation.cfg().enabled ? await moderation.screenText(replyText) : { flagged: false };
    if (screening.flagged) {
      console.warn(`Comment reply blocked by keyword filter: user=${req.body.userId} video=${req.body.videoId} matched=${screening.matched.join(",")}`);
      return res.status(200).json({
        status: false,
        message: "Your reply contains content that isn't allowed. Please revise it.",
      });
    }

    const videoComment = new VideoComment();

    videoComment.userId = user._id;
    videoComment.videoId = video._id;
    videoComment.commentText = replyText;
    videoComment.recursiveCommentId = videoCommentAlreadyExist._id;

    await videoComment.save();
    // Atomic counter (two replies at once used to overwrite each other's +1).
    await VideoComment.updateOne({ _id: videoCommentAlreadyExist._id }, { $inc: { totalReplies: 1 } });

    return res.status(200).json({ status: true, message: "Comment reply given by user for that video!", videoComment });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get all replies for particular comment
exports.repliesOfVideoComment = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.videoId || !req.query.recursiveCommentId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const videoId = new mongoose.Types.ObjectId(req.query.videoId);
    const recursiveCommentId = new mongoose.Types.ObjectId(req.query.recursiveCommentId);

    const page = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [user, video, replyOfVideoComment] = await Promise.all([
      User.findOne({ _id: req.query.userId, isActive: true }),
      Video.findOne({ _id: req.query.videoId, isActive: true }),
      VideoComment.findOne({ recursiveCommentId: req.query.recursiveCommentId }),
    ]);

    if (!user) {
      return res.status(404).json({ status: false, message: "user does not found!!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "video does not found!" });
    }

    if (!replyOfVideoComment) {
      return res.status(200).json({ status: false, message: "replyOfVideoComment does not found!" });
    }

    let now = dayjs();

    const result = await VideoComment.aggregate([
      {
        $match: {
          videoId: videoId,
          recursiveCommentId: recursiveCommentId,
        },
      },
      {
        $facet: {
          repliesOfComment: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                pipeline: [{ $project: { fullName: 1, image: 1 } }],
                as: "user",
              },
            },
            { $unwind: "$user" },
            {
              $lookup: {
                from: "likehistoryofvideocomments",
                let: { videoCommentId: "$_id", userId: userId },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [{ $eq: ["$videoCommentId", "$$videoCommentId"] }, { $eq: ["$userId", "$$userId"] }],
                      },
                    },
                  },
                ],
                as: "likeHistory",
              },
            },
            {
              $unwind: {
                path: "$likeHistory",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                userId: "$user._id",
                fullName: "$user.fullName",
                userImage: "$user.image",
                commentText: 1,
                like: 1,
                dislike: 1,
                totalReplies: 1,
                createdAt: 1,
                recursiveCommentId: 1,
                videoId: 1,
                isLike: {
                  $cond: [{ $eq: ["$likeHistory.likeOrDislike", "like"] }, true, false],
                },
                isDislike: {
                  $cond: [{ $eq: ["$likeHistory.likeOrDislike", "dislike"] }, true, false],
                },
                time: {
                  $let: {
                    vars: { timeDiff: { $subtract: [now.toDate(), "$createdAt"] } },
                    in: {
                      $concat: [
                        {
                          $switch: {
                            branches: [
                              { case: { $gte: ["$$timeDiff", 31536000000] }, then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 31536000000] } } }, " years ago"] } },
                              { case: { $gte: ["$$timeDiff", 2592000000] }, then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 2592000000] } } }, " months ago"] } },
                              { case: { $gte: ["$$timeDiff", 604800000] }, then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 604800000] } } }, " weeks ago"] } },
                              { case: { $gte: ["$$timeDiff", 86400000] }, then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 86400000] } } }, " days ago"] } },
                              { case: { $gte: ["$$timeDiff", 3600000] }, then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 3600000] } } }, " hours ago"] } },
                              { case: { $gte: ["$$timeDiff", 60000] }, then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 60000] } } }, " minutes ago"] } },
                              { case: { $gte: ["$$timeDiff", 1000] }, then: { $concat: [{ $toString: { $floor: { $divide: ["$$timeDiff", 1000] } } }, " seconds ago"] } },
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
          ],
          totalCount: [{ $count: "total" }],
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "finally, get originalVideoComment and all replies of particular comment for that video!",
      total: result[0].totalCount[0]?.total || 0,
      repliesOfComment: result[0].repliesOfComment,
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Delete a comment (or reply): its author, or the owner of the video it is on.
// A top-level comment takes its replies and their like records with it.
exports.deleteComment = async (req, res) => {
  try {
    const userId = req.appUserId;
    const commentId = String(req.query.commentId || req.body?.commentId || "");
    if (!userId || !commentId) return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });

    const comment = await VideoComment.findById(commentId).lean();
    if (!comment) return res.status(200).json({ status: true, message: "Comment already deleted.", deleted: false });
    const video = await Video.findById(comment.videoId).lean();
    const isAuthor = String(comment.userId) === String(userId);
    const isVideoOwner = !!video && String(video.userId) === String(userId);
    if (!isAuthor && !isVideoOwner) {
      return res.status(403).json({ status: false, code: "NOT_ALLOWED", message: "You can only delete your own comments or comments on your videos." });
    }

    const replies = comment.recursiveCommentId ? [] : await VideoComment.find({ recursiveCommentId: String(comment._id) }).lean();
    const ids = [String(comment._id), ...replies.map((r) => String(r._id))];
    await LikeHistoryOfVideoComment.deleteMany({ videoCommentId: { $in: ids } });
    await VideoComment.deleteMany({ _id: { $in: ids } });
    if (comment.recursiveCommentId) {
      const parent = await VideoComment.findById(String(comment.recursiveCommentId)).lean();
      if (parent && Number(parent.totalReplies) > 0) {
        await VideoComment.updateOne({ _id: parent._id }, { $inc: { totalReplies: -1 } });
      }
    }
    return res.status(200).json({ status: true, message: "Comment deleted.", deleted: true, deletedCount: ids.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
