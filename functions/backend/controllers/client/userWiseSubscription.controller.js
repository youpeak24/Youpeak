const UserWiseSubscription = require("../../models/userWiseSubscription.model");

//import model
const User = require("../../models/user.model");
const WatchHistory = require("../../models/watchHistory.model");
const History = require("../../models/history.model");
const Video = require("../../models/video.model");
const PlaybackSession = require("../../models/playbackSession.model");

//generateHistoryUniqueId
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

//private key
const admin = require("../../util/privateKey");

//mongoose
const mongoose = require("../../util/mongooseShim");

//firestore connection (atomic balance spend — see spendBalance())
const db = require("../../util/connection");

const dayjs = require("dayjs");

//user wise subscribed or unSubscribed the channel
exports.subscribedUnSubscibed = async (req, res) => {
  try {
    const { userId, channelId } = req.query;

    if (!userId || !channelId) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details." });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [user, channel] = await Promise.all([
      User.findOne({ _id: userObjectId, isActive: true }).select("_id coin isBlock channelId fullName").lean(),
      User.findOne({ channelId, isActive: true }).select("_id channelId channelType subscriptionCost fcmToken isBlock").lean(),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    if (!channel) {
      return res.status(200).json({ status: false, message: "Channel not found." });
    }

    if (channel.isBlock) {
      return res.status(200).json({ status: false, message: "This channel is blocked." });
    }

    if (String(user.channelId) === String(channel.channelId)) {
      return res.status(200).json({
        status: false,
        message: "You cannot subscribe to your own channel.",
      });
    }

    const alreadySubscribed = await UserWiseSubscription.exists({
      userId: userObjectId,
      channelId: channel.channelId,
    });

    if (alreadySubscribed) {
      console.log("🔁 UNSUBSCRIBE");

      await UserWiseSubscription.deleteOne({
        userId: userObjectId,
        channelId: channel.channelId,
      });

      return res.status(200).json({
        status: true,
        message: "Successfully unsubscribed from the channel!",
        isSubscribed: false,
      });
    }

    /* ================= FREE CHANNEL ================= */
    // A channel is only "paid" when it's explicitly PRIVATE (channelType 2)
    // AND has a positive subscriptionCost. Treat everything else (missing
    // channelType, "0"/0/1, no cost set) as free — channelType defaults to
    // PUBLIC (1) in the schema, but existing/legacy user docs can have it
    // unset, which must not turn into an unpayable "paid" channel.
    const isPaidChannel = Number(channel.channelType) === 2 && Number(channel.subscriptionCost) > 0;
    if (!isPaidChannel) {
      await UserWiseSubscription.create({
        userId: userObjectId,
        channelId: channel.channelId,
        isPublic: true,
        expiryDate: null,
      });

      if (channel.fcmToken) {
        try {
          const adminInstance = await admin;
          await adminInstance.messaging().send({
            token: channel.fcmToken,
            notification: {
              title: "🌟 New Subscriber!",
              body: `🎉 ${user.fullName || "Someone"} subscribed to your channel.`,
            },
            data: { type: "NEW_SUBSCRIBER" },
          });
        } catch (err) {
          console.error("FCM error:", err.message);
        }
      }

      return res.status(200).json({
        status: true,
        message: "Successfully subscribed to the channel!",
        isSubscribed: true,
      });
    }

    /* ================= PAID CHANNEL ================= */
    const coinsRequired = Number(channel.subscriptionCost || 0);

    if (coinsRequired <= 0) {
      return res.status(200).json({
        status: false,
        message: "Invalid subscription cost.",
      });
    }

    // Atomic debit — a plain "user.coin < coinsRequired" check reads a
    // stale balance; two concurrent subscribe requests for the same paid
    // channel could both pass it and both deduct, driving the subscriber's
    // balance negative. spendBalance() refuses the whole operation (no
    // write at all) if the real-time balance can't cover it. See
    // firestoreDb.service.js spendBalance().
    const spend = await db.spendBalance("users", String(userObjectId), "coin", coinsRequired);
    if (!spend.ok) {
      return res.status(200).json({
        status: false,
        message: "Insufficient coins to subscribe to this channel.",
      });
    }

    const [uniqueIdOwner, uniqueIdUser] = await Promise.all([generateHistoryUniqueId(), generateHistoryUniqueId()]);

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const operations = [
      UserWiseSubscription.create({
        userId: userObjectId,
        channelId: channel.channelId,
        isPublic: false,
        expiryDate,
      }),
      // Add coins to channel owner (atomic — see mongooseShim.js $inc handling)
      User.updateOne({ _id: channel._id }, { $inc: { coin: coinsRequired } }),
      // Owner history (+)
      History.create({
        userId: channel._id,
        channelId: channel.channelId,
        uniqueId: uniqueIdOwner,
        coin: coinsRequired,
        type: 10,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }),
      // User history (-)  — the debit itself already happened atomically above
      History.create({
        otherUserId: userObjectId,
        channelId: channel.channelId,
        uniqueId: uniqueIdUser,
        coin: coinsRequired,
        type: 10,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }),
    ];

    await Promise.all(operations);

    if (channel.fcmToken) {
      try {
        const adminInstance = await admin;
        await adminInstance.messaging().send({
          token: channel.fcmToken,
          notification: {
            title: "🎊 Subscription Earned!",
            body: `You earned ${coinsRequired} coins from a new subscriber 💰`,
          },
          data: { type: "COINS_EARNED" },
        });
      } catch (err) {
        console.error("FCM error:", err.message);
      }
    }

    return res.status(200).json({
      status: true,
      message: "Successfully subscribed to the paid channel!",
      isSubscribed: true,
    });
  } catch (error) {
    console.error("subscribedUnSubscibed error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//get all subscription channels subscribed by that user
exports.getSubscribedChannel = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const page = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [user, result] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }, { _id: 1, isBlock: 1 }).lean(),
      UserWiseSubscription.aggregate([
        {
          $match: { userId: userId },
        },
        {
          $facet: {
            data: [
              { $sort: { createdAt: -1 } },
              { $skip: skip },
              { $limit: limit },
              {
                $lookup: {
                  from: "users",
                  localField: "channelId",
                  foreignField: "channelId",
                  pipeline: [
                    {
                      $project: {
                        _id: 0,
                        channelId: 1,
                        fullName: 1,
                        image: 1,
                      },
                    },
                  ],
                  as: "channel",
                },
              },
              {
                $unwind: "$channel",
              },
              {
                $project: {
                  _id: 0,
                  channelId: "$channel.channelId",
                  channelName: "$channel.fullName",
                  channelImage: "$channel.image",
                },
              },
            ],
            totalCount: [{ $count: "total" }],
          },
        },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({
        status: false,
        message: "user does not found!",
      });
    }

    if (user.isBlock) {
      return res.status(200).json({
        status: false,
        message: "you are blocked by admin!",
      });
    }

    const subscribedChannel = result[0].data;
    const totalSubscribedChannel = result[0].totalCount.length > 0 ? result[0].totalCount[0].total : 0;

    if (!subscribedChannel || subscribedChannel.length === 0) {
      return res.status(200).json({
        status: false,
        message: "No channels have been subscribed by that user.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Retrive subscription channels subscribed by that user!",
      totalSubscribedChannel: totalSubscribedChannel,
      subscribedChannel: subscribedChannel,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get type wise videos of the subscribed channels
exports.videoOfSubscribedChannel = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    if (!req.query.type) {
      return res.status(200).json({ status: false, message: "type must be passed!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const type = req.query.type.trim() || "all";

    if (!["today", "continueWatching", "all"].includes(type)) {
      return res.status(200).json({ status: false, message: "type must be passed valid." });
    }

    const page = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let now = dayjs();

    const user = await User.findOne({ _id: userId, isActive: true }, { _id: 1, isBlock: 1 }).lean();

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    let matchStage = { userId: user._id };

    if (type === "continueWatching") {
      const userWatchedChannels = await PlaybackSession.distinct("videoChannelId", { userId: user._id });
      matchStage.channelId = { $in: userWatchedChannels };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const aggregation = await UserWiseSubscription.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "videos",
          localField: "channelId",
          foreignField: "channelId",
          pipeline: [
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
      ...(type === "today" ? [{ $match: { "video.createdAt": { $gte: today } } }] : []),
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
          from: "watchhistories",
          localField: "video._id",
          foreignField: "videoId",
          as: "views",
        },
      },
      {
        $lookup: {
          from: "savetowatchlaters",
          localField: "video._id",
          foreignField: "videoId",
          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
          as: "isSaveToWatchLater",
        },
      },
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
          views: { $size: "$views" },
          isSaveToWatchLater: { $gt: [{ $size: "$isSaveToWatchLater" }, 0] },
          isSubscribed: { $gt: [{ $size: "$subscription" }, 0] },
          isUnlocked: { $gt: [{ $size: "$unlockData" }, 0] },
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
            { $sort: { "video.createdAt": -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                videoId: "$video._id",
                videoTitle: "$video.title",
                videoType: "$video.videoType",
                videoTime: "$video.videoTime",
                videoUrl: "$video.videoUrl",
                videoImage: "$video.videoImage",
                videoCreatedAt: "$video.createdAt",
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
                videoPrivacyType: 1,
                channelName: "$channel.fullName",
                channelId: "$channel.channelId",
                channelType: "$channel.channelType",
                subscriptionCost: "$channel.subscriptionCost",
                videoUnlockCost: "$channel.videoUnlockCost",
                channelImage: "$channel.image",
                isSaveToWatchLater: 1,
                views: 1,
              },
            },
          ],
          totalCount: [{ $count: "total" }],
        },
      },
    ]);

    const videoOfSubscribedChannel = aggregation[0].data;
    const total = aggregation[0].totalCount.length > 0 ? aggregation[0].totalCount[0].total : 0;

    return res.status(200).json({
      status: true,
      message: `Retrive videos of the subscribed channel with type is ${type}!`,
      total,
      videoOfSubscribedChannel,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
