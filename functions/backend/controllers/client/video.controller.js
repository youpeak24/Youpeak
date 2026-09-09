const Video = require("../../models/video.model");

//import model
const User = require("../../models/user.model");
const SoundList = require("../../models/soundsList.model");
const UserWiseSubscription = require("../../models/userWiseSubscription.model");
const Notification = require("../../models/notification.model");
const SearchHistory = require("../../models/searchHistory.model");
const LikeHistoryOfVideo = require("../../models/likeHistoryOfVideo.model");
const WatchHistory = require("../../models/watchHistory.model");
const SaveToWatchLater = require("../../models/saveToWatchLater.model");
const History = require("../../models/history.model");
const VideoComment = require("../../models/videoComment.model");
const Report = require("../../models/report.model");
const LikeHistoryOfVideoComment = require("../../models/likeHistoryOfVideoComment.model");
const PlayList = require("../../models/playList.model");
const VideoUnlock = require("../../models/videoUnlock.model");
const PlaybackSession = require("../../models/playbackSession.model");

//deleteFromStorage
const { deleteFromStorage } = require("../../util/storageHelper");

//private key
const admin = require("../../util/privateKey");

//momemt
const moment = require("moment");

//mongoose
const mongoose = require("../../util/mongooseShim");

//day.js
const dayjs = require("dayjs");

//uuid
const uuid = require("uuid");

//generateUniqueVideoId
const { generateUniqueVideoId } = require("../../util/generateUniqueVideoId");

//generateHistoryUniqueId
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

//reward engine (daily caps + coin crediting)
const rewardEngine = require("../../util/rewardEngine");

//firestore connection (direct doc updates)
const db = require("../../util/connection");

//video Unlocked
exports.unlockPrivateVideo = async (req, res) => {
  try {
    const { userId, videoId } = req.query;

    if (!userId || !videoId) {
      return res.status(200).json({
        status: false,
        message: "Invalid user or video details provided.",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const videoObjectId = new mongoose.Types.ObjectId(videoId);

    const [user, video] = await Promise.all([
      User.findOne({ _id: userObjectId, isActive: true }).select("_id coin isBlock fcmToken").lean(),
      Video.findOne({
        _id: videoObjectId,
        videoPrivacyType: 2, // private
        isActive: true,
      })
        .select("_id userId")
        .lean(),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "Private video not found." });
    }

    if (video.userId.toString() === userObjectId.toString()) {
      console.log("❌ Prevent unlocking own video");
      return res.status(200).json({ status: false, message: "You cannot unlock your own private video." });
    }

    const [alreadyUnlocked, videoOwner] = await Promise.all([
      VideoUnlock.exists({
        userId: userObjectId,
        videoId: videoObjectId,
      }),
      User.findOne({ _id: video.userId }).select("_id videoUnlockCost fcmToken").lean(),
    ]);

    if (!videoOwner) {
      return res.status(200).json({ status: false, message: "Video owner not found." });
    }

    if (alreadyUnlocked) {
      return res.status(200).json({
        status: false,
        message: "Video already unlocked.",
        isUnlocked: true,
      });
    }

    const unlockCost = Number(videoOwner?.videoUnlockCost || 0);

    if (unlockCost <= 0) {
      return res.status(200).json({ status: false, message: "Invalid unlock cost." });
    }

    if (user.coin < unlockCost) {
      return res.status(200).json({ status: false, message: "Insufficient coin balance." });
    }

    const [uniqueIdUser, uniqueIdOwner] = await Promise.all([generateHistoryUniqueId(), generateHistoryUniqueId()]);

    await Promise.all([
      /* store unlock */
      VideoUnlock.create({
        userId: userObjectId,
        videoId: videoObjectId,
        videoOwnerId: video.userId,
        unlockCost: unlockCost,
        unlockedAt: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }),

      /* deduct coins from user */
      User.updateOne({ _id: userObjectId }, { $inc: { coin: -unlockCost } }),

      /* add coins to video owner */
      User.updateOne({ _id: video.userId }, { $inc: { coin: unlockCost } }),

      /* history for owner */
      History.create({
        userId: video.userId,
        videoId: videoObjectId,
        uniqueId: uniqueIdOwner,
        coin: unlockCost,
        type: 9,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }),

      /* history for user */
      History.create({
        otherUserId: userObjectId,
        videoId: videoObjectId,
        uniqueId: uniqueIdUser,
        coin: unlockCost,
        type: 9,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }),
    ]);

    res.status(200).json({
      status: true,
      message: "Video unlocked successfully.",
      isUnlocked: true,
    });

    if (user.fcmToken) {
      try {
        const adminInstance = await admin;
        await adminInstance.messaging().send({
          token: user.fcmToken,
          notification: {
            title: "🔓 Video Unlocked!",
            body: `You unlocked a private video for ${unlockCost} coins! Enjoy the content! 🎬✨`,
          },
          data: {
            type: "VIDEO_UNLOCKED",
          },
        });
      } catch (err) {
        console.error("FCM error:", err.message);
      }
    }

    if (videoOwner.fcmToken) {
      try {
        const adminInstance = await admin;
        await adminInstance.messaging().send({
          token: videoOwner.fcmToken,
          notification: {
            title: "🎉 Private Video Unlocked!",
            body: `Your private video has been unlocked by a viewer. You’ve received ${unlockCost} coins in your wallet.`,
          },
          data: {
            type: "VIDEO_UNLOCK_RECEIVED",
            videoId: videoObjectId.toString(),
            coins: unlockCost.toString(),
          },
        });
      } catch (err) {
        console.error("Owner FCM error:", err.message);
      }
    }
  } catch (error) {
    console.error("unlockPrivateVideo error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//channel name verify when upload viodeo or shorts
exports.verifyChannelname = async (req, res) => {
  try {
    if (!req.body.fullName) {
      return res.status(200).json({ status: false, message: "Invalid input. Please provide valid details!" });
    }

    //Check if the new channelName is different from the current one
    const isDuplicateFullName = await User.findOne({ fullName: req.body.fullName.trim() });

    if (isDuplicateFullName) {
      return res.status(200).json({ status: false, message: "This channel name is already taken. Please try another one." });
    } else {
      return res.status(200).json({ status: true, message: "This channel name is available. You may proceed to use it." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//upload (normal videos or shorts) by the user
exports.createVideo = async (req, res) => {
  try {
    if (
      !req.body.title ||
      //!req.body.description ||
      //!req.body.hashTag ||
      !req.body.videoType ||
      !req.body.videoTime ||
      !req.body.visibilityType ||
      !req.body.audienceType ||
      !req.body.commentType ||
      !req.body.scheduleType ||
      //!req.body.location ||
      //!req.body.latitude ||
      //!req.body.longitude ||
      !req.body.userId ||
      !req.body.videoPrivacyType ||
      //!req.body.channelId ||
      !req.body.videoUrl ||
      !req.body.videoImage
    ) {
      if (req.body.videoImage) {
        await deleteFromStorage(req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await deleteFromStorage(req.body.videoUrl);
      }

      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    if (req.body.scheduleType == 1 && !req.body.scheduleTime) {
      if (req.body.videoImage) {
        await deleteFromStorage(req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await deleteFromStorage(req.body.videoUrl);
      }

      return res.status(200).json({ status: false, message: "scheduleTime must be required!" });
    }

    if (req.body.videoType == 2) {
      if (settingJSON.durationOfShorts < parseInt(req.body.videoTime)) {
        if (req.body.videoImage) {
          await deleteFromStorage(req.body.videoImage);
        }

        if (req.body.videoUrl) {
          await deleteFromStorage(req.body.videoUrl);
        }
        return res.status(200).json({ status: false, message: "your duration of Shorts greater than decided by admin!" });
      }
    }

    if (req?.body?.soundListId) {
      var soundList = await SoundList.findById(req?.body?.soundListId);
      if (!soundList) {
        if (req.body.videoImage) {
          await deleteFromStorage(req.body.videoImage);
        }

        if (req.body.videoUrl) {
          await deleteFromStorage(req.body.videoUrl);
        }

        return res.status(200).json({ status: false, message: "soundList does not found!" });
      }
    }

    const [uniqueVideoId, user] = await Promise.all([generateUniqueVideoId(), User.findOne({ _id: req.body.userId, isActive: true, isAddByAdmin: false })]);

    if (!user) {
      if (req.body.videoImage) {
        await deleteFromStorage(req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await deleteFromStorage(req.body.videoUrl);
      }
      return res.status(200).json({ status: false, message: "user does not found!" });
    }

    if (user.isBlock) {
      if (req.body.videoImage) {
        await deleteFromStorage(req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await deleteFromStorage(req.body.videoUrl);
      }

      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    const video = new Video();

    if (!user.isChannel) {
      console.log("User don't have channel:  ", req?.body?.channelType);

      if (req.body.fullName && req.body.fullName !== user.fullName) {
        //Check if the new channelName is different from the current one
        const isDuplicateFullName = await User.findOne({ fullName: req.body.fullName.trim() });
        if (isDuplicateFullName) {
          if (req.body.videoImage) {
            await deleteFromStorage(req.body.videoImage);
          }

          if (req.body.videoUrl) {
            await deleteFromStorage(req.body.videoUrl);
          }

          return res.status(200).json({ status: false, message: "The provided channelName is already in use. Please choose a different one." });
        }

        user.fullName = req.body.fullName ? req.body.fullName.trim() : user.fullName; //channelName
      }

      user.channelId = uuid.v4();
      user.isChannel = true;
      user.channelType = parseInt(req?.body?.channelType) || 1;
      user.subscriptionCost = 10;
      user.videoUnlockCost = 10;

      user.descriptionOfChannel = req.body.descriptionOfChannel ? req.body.descriptionOfChannel : user.descriptionOfChannel;
      user.socialMediaLinks.instagramLink = req.body.instagramLink ? req.body.instagramLink : user.socialMediaLinks.instagramLink;
      user.socialMediaLinks.facebookLink = req.body.facebookLink ? req.body.facebookLink : user.socialMediaLinks.facebookLink;
      user.socialMediaLinks.twitterLink = req.body.twitterLink ? req.body.twitterLink : user.socialMediaLinks.twitterLink;
      user.socialMediaLinks.websiteLink = req.body.websiteLink ? req.body.websiteLink : user.socialMediaLinks.websiteLink;

      video.channelId = user.channelId;
    }

    let channel;
    if (req.body.channelId) {
      console.log("User have channel");

      channel = await User.findOne({ channelId: user.channelId });
      if (!channel) {
        if (req.body.videoImage) {
          await deleteFromStorage(req.body.videoImage);
        }

        if (req.body.videoUrl) {
          await deleteFromStorage(req.body.videoUrl);
        }

        return res.status(200).json({ status: false, message: "Channel does not found!" });
      }

      if (user.channelId !== req.body.channelId) {
        if (req.body.videoImage) {
          await deleteFromStorage(req.body.videoImage);
        }

        if (req.body.videoUrl) {
          await deleteFromStorage(req.body.videoUrl);
        }

        return res.status(200).json({ status: false, message: "Video has been uploaded only by own channelId." });
      }

      video.channelId = channel.channelId;
    }

    if (req?.body?.scheduleType) {
      video.scheduleType = req?.body?.scheduleType;

      if (req?.body?.scheduleType == 1) {
        video.scheduleTime = moment(req?.body?.scheduleTime).toISOString(); //e.g."2023-07-11T18:00:00.000Z"
      } else if (req?.body?.scheduleType == 2) {
        video.scheduleTime = "";
      } else {
        if (req.body.videoImage) {
          await deleteFromStorage(req.body.videoImage);
        }

        if (req.body.videoUrl) {
          await deleteFromStorage(req.body.videoUrl);
        }

        return res.status(200).json({ status: false, message: "scheduleType must be passed valid!" });
      }
    }

    video.title = req?.body?.title.trim();
    video.description = req?.body?.description.trim();
    video.videoType = req?.body?.videoType;
    video.videoTime = req?.body?.videoTime;
    video.videoUrl = req?.body?.videoUrl;
    video.videoImage = req?.body?.videoImage;
    video.visibilityType = req?.body?.visibilityType;
    video.audienceType = req?.body?.audienceType;
    video.commentType = req?.body?.commentType;
    video.scheduleType = req?.body?.scheduleType;
    video.videoPrivacyType = parseInt(req?.body?.videoPrivacyType);

    video.location = req?.body?.location?.toLowerCase();
    video.locationCoordinates.latitude = req?.body?.latitude;
    video.locationCoordinates.longitude = req?.body?.longitude;
    video.soundListId = soundList?._id;
    video.userId = user._id;
    video.isAddByAdmin = false;

    const multiplehashTag = req.body.hashTag ? req?.body?.hashTag.toString().split(",") : [];
    video.hashTag = multiplehashTag;

    video.uniqueVideoId = uniqueVideoId;

    await Promise.all([user.save(), video.save()]);

    const data = await Video.findById(video._id).populate([
      { path: "soundListId", select: "soundTitle soundLink" },
      { path: "userId", select: "fullName nickName" },
    ]);

    res.status(200).json({
      status: true,
      message: "Normal video or shorts has been uploaded by the user!",
      video: data,
    });

    //if user don't have channel then send notification to that user
    if (!user.isChannel) {
      if (user.fcmToken && user.fcmToken !== null) {
        const payload = {
          token: user.fcmToken,
          notification: {
            title: "🚀 Channel Creation Successful! 🚀",
            body: "Your channel has been successfully created. Start uploading content and turn your creativity into earnings today! 📈",
          },
        };

        const adminPromise = await admin;
        adminPromise
          .messaging()
          .send(payload)
          .then((response) => {
            console.log("Successfully sent with response: ", response);
          })
          .catch((error) => {
            console.log("Error sending message: ", error);
          });
      }
    }

    //if user subscribed that channel then send notification to that users
    console.log("req.body.channelId: ", req.body.channelId);

    const channelSubscribedByUsers = await UserWiseSubscription.find({
      channelId: req.body.channelId.toString(),
      userId: { $ne: user._id },
    }).distinct("userId");

    console.log("channelSubscribedByUsers:", channelSubscribedByUsers);

    await Promise.all(
      channelSubscribedByUsers.map(async (userId) => {
        const user = await User.findById(userId);

        if (user._id.toString() !== req.body.userId.toString()) {
          if (user.fcmToken) {
            const payload = {
              token: user.fcmToken,
              notification: {
                title: "🔔 New Video Alert! 🔔",
                body: "Hey there! We're excited to share our latest video. Don't miss out Click here to watch the video now!",
              },
            };

            const adminPromise = await admin;
            adminPromise
              .messaging()
              .send(payload)
              .then(async (response) => {
                console.log("Successfully sent with response: ", response);

                const notification = new Notification();
                notification.title = "🔔 New Video Alert! 🔔";
                notification.message = "Hey there! We're excited to share our latest video. Don't miss out Click here to watch the video now!";
                notification.userId = user?._id;
                notification.videoId = video?._id;
                notification.channelImage = channel?.image || "";
                notification.videoImage = video?.videoImage;
                await notification.save();
              })
              .catch((error) => {
                console.log("Error sending message:      ", error);
              });
          }
        }
      }),
    );
  } catch (error) {
    if (req.body.videoImage) {
      await deleteFromStorage(req.body.videoImage);
    }

    if (req.body.videoUrl) {
      await deleteFromStorage(req.body.videoUrl);
    }

    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//when user share (normal videos or shorts) then shareCount increased
exports.shareCount = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.videoId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const [user, video] = await Promise.all([User.findOne({ _id: req.query.userId, isActive: true }), Video.findOne({ _id: req.query.videoId, isActive: true })]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "video does not found!!" });
    }

    video.shareCount += 1;
    await video.save();

    return res.status(200).json({ status: true, message: "When user share video then shareCount increased!", video });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get shorts from home page directly
exports.shortsOfUser = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.videoId) {
      return res.status(200).json({ status: false, message: "userId and videoId must be requried." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const user = await User.findOne({ _id: userId, isActive: true });
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    let shorts = await Video.aggregate([
      {
        $match: {
          isActive: true,
          scheduleType: 2,
          visibilityType: 1,
          videoType: 2,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channelId",
          foreignField: "channelId",
          as: "channel",
        },
      },
      {
        $unwind: {
          path: "$channel",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "videocomments",
          localField: "_id",
          foreignField: "videoId",
          pipeline: [{ $match: { recursiveCommentId: null } }],
          as: "totalComments",
        },
      },
      {
        $lookup: {
          from: "likehistoryofvideos",
          localField: "_id",
          foreignField: "videoId",
          pipeline: [{ $match: { userId: user._id } }, { $limit: 1 }],
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
        $lookup: {
          from: "watchhistories",
          localField: "_id",
          foreignField: "videoId",
          as: "views",
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
          localField: "_id",
          foreignField: "videoId",
          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
          as: "unlockData",
        },
      },
      {
        $addFields: {
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
                  { $eq: ["$videoPrivacyType", 1] }, // free video
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
          like: 1,
          dislike: 1,
          shareCount: 1,
          title: 1,
          videoType: 1,
          videoTime: 1,
          videoUrl: 1,
          videoImage: 1,
          description: 1,
          hashTag: 1,
          userId: 1,
          channelId: 1,
          videoPrivacyType: 1,
          createdAt: 1,
          channelType: "$channel.channelType",
          subscriptionCost: "$channel.subscriptionCost",
          videoUnlockCost: "$channel.videoUnlockCost",
          channelName: "$channel.fullName",
          channelImage: "$channel.image",
          totalComments: { $size: "$totalComments" },
          isSubscribed: 1,
          isLike: { $eq: ["$likeHistory.likeOrDislike", "like"] },
          isDislike: { $eq: ["$likeHistory.likeOrDislike", "dislike"] },
          views: { $size: "$views" },
        },
      },
      { $skip: (start - 1) * limit },
      { $limit: limit },
    ]);

    // Find the index of the specified videoId
    const videoIndex = shorts.findIndex((short) => short._id.toString() === req.query.videoId);

    // If the videoId is found, move it to the 0th index
    if (videoIndex !== -1) {
      const [movedVideo] = shorts.splice(videoIndex, 1);
      shorts.unshift(movedVideo);
    }

    // Adjust the skip value
    const adjustedStart = videoIndex !== -1 ? 1 : start;

    // Limit the shorts based on the new start value
    shorts = shorts.slice(adjustedStart - 1, adjustedStart - 1 + limit);

  } catch (error) {
    console.log("videosOfHome fallback to local DB:", error.message);
    try {
      const db = require("../../util/connection");
      let videos = await db.find("videos", {});
      return res.status(200).json({
        status: true,
        message: "Retrieve videos for user from local DB",
        videos: videos || [],
        total: videos.length || 0,
      });
    } catch (e) {
      return res.status(200).json({ status: true, message: "Retrieve videos for user", videos: [], total: 0 });
    }
  }
};

//get all shorts for user (shorts)
exports.getShorts = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    const hasUser = !!req.query.userId;
    const userId = hasUser ? new mongoose.Types.ObjectId(req.query.userId) : null;

    if (hasUser) {
      const user = await User.findOne({ _id: userId, isActive: true });
      if (!user) {
        return res.status(200).json({ status: false, message: "User does not found!" });
      }
      if (user.isBlock) {
        return res.status(200).json({ status: false, message: "you are blocked by admin!" });
      }
    }

    const result = await Video.aggregate([
      {
        $match: {
          isActive: true,
          scheduleType: 2,
          visibilityType: 1,
          videoType: 2,
        },
      },
      {
        $facet: {
          shorts: [
            { $sort: { createdAt: -1 } },
            { $skip: (start - 1) * limit },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                localField: "channelId",
                foreignField: "channelId",
                as: "channel",
              },
            },
            { $unwind: { path: "$channel", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "videocomments",
                localField: "_id",
                foreignField: "videoId",
                pipeline: [{ $match: { recursiveCommentId: null } }],
                as: "totalComments",
              },
            },
            {
              $lookup: {
                from: "likehistoryofvideos",
                localField: "_id",
                foreignField: "videoId",
                pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                as: "likeHistory",
              },
            },
            { $unwind: { path: "$likeHistory", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "watchhistories",
                localField: "_id",
                foreignField: "videoId",
                as: "views",
              },
            },
            {
              $lookup: {
                from: "savetowatchlaters",
                localField: "_id",
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
                localField: "_id",
                foreignField: "videoId",
                pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                as: "unlockData",
              },
            },
            {
              $addFields: {
                isUnlocked: {
                  $cond: [hasUser, { $gt: [{ $size: "$unlockData" }, 0] }, false],
                },
                isSubscribed: {
                  $cond: [hasUser, { $gt: [{ $size: "$subscription" }, 0] }, false],
                },
                isSaveToWatchLater: {
                  $cond: [hasUser, { $gt: [{ $size: "$isSaveToWatchLater" }, 0] }, false],
                },
              },
            },
            {
              $addFields: {
                videoPrivacyType: {
                  $cond: {
                    if: {
                      $or: [
                        { $eq: ["$videoPrivacyType", 1] }, // free video
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
                like: 1,
                dislike: 1,
                shareCount: 1,
                title: 1,
                videoType: 1,
                videoTime: 1,
                videoUrl: 1,
                videoImage: 1,
                description: 1,
                hashTag: 1,
                userId: 1,
                channelId: 1,
                videoPrivacyType: 1,
                commentType: 1,
                createdAt: 1,
                channelType: "$channel.channelType",
                subscriptionCost: "$channel.subscriptionCost",
                videoUnlockCost: "$channel.videoUnlockCost",
                channelName: "$channel.fullName",
                channelImage: "$channel.image",
                totalComments: { $size: "$totalComments" },
                isSubscribed: 1,
                isSaveToWatchLater: 1,
                isLike: {
                  $cond: [hasUser, { $eq: ["$likeHistory.likeOrDislike", "like"] }, false],
                },
                isDislike: {
                  $cond: [hasUser, { $eq: ["$likeHistory.likeOrDislike", "dislike"] }, false],
                },
                views: { $size: "$views" },
              },
            },
          ],
          total: [{ $count: "total" }],
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Retrive shorts for user.",
      total: result[0]?.total[0]?.total || 0,
      shorts: result[0]?.shorts || [],
    });
  } catch (error) {
    console.error("getShorts fallback to local DB:", error.message);
    try {
      const db = require("../../util/connection");
      let allVideos = await db.find("videos", {});
      let shorts = allVideos.filter((v) => Number(v.videoType) === 2 || String(v._id).startsWith("short_"));
      if (shorts.length === 0) shorts = allVideos;
      return res.status(200).json({
        status: true,
        message: "Retrieve shorts for user from local DB",
        total: shorts.length,
        shorts: shorts,
      });
    } catch (e) {
      return res.status(200).json({ status: true, message: "Retrieve shorts for user", total: 0, shorts: [] });
    }
  }
};

//get all normal videos for user (home)
exports.getVideos = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    if (!req.query.userId) {
      const db = require("../../util/connection");
      let allVideos = await db.find("videos", {});
      let normalVideos = allVideos.filter((v) => Number(v.videoType) === 1 || String(v._id).startsWith("video_"));
      if (normalVideos.length === 0) normalVideos = allVideos;
      return res.status(200).json({ status: true, message: "Retrieve videos for the user.", videos: normalVideos });
    }

    let now = dayjs();

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const [user, videos] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }).select("isBlock").lean(),
      Video.aggregate([
        {
          $match: {
            isActive: true,
            videoType: 1,
            scheduleType: 2,
            visibilityType: 1,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "channelId",
            foreignField: "channelId",
            as: "channel",
          },
        },
        {
          $unwind: {
            path: "$channel",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "watchhistories",
            localField: "_id",
            foreignField: "videoId",
            as: "views",
          },
        },
        {
          $lookup: {
            from: "savetowatchlaters",
            localField: "_id",
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
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "unlockData",
          },
        },
        {
          $addFields: {
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
                    { $eq: ["$videoPrivacyType", 1] }, // free video
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
            _id: 1,
            title: 1,
            videoType: 1,
            videoTime: 1,
            videoUrl: 1,
            videoImage: 1,
            scheduleType: 1,
            scheduleTime: 1,
            userId: 1, //videoUserId
            channelId: 1, //videoChannelId
            videoPrivacyType: 1,
            views: { $size: "$views" },
            channelType: "$channel.channelType",
            subscriptionCost: "$channel.subscriptionCost",
            videoUnlockCost: "$channel.videoUnlockCost",
            channelName: "$channel.fullName",
            channelImage: "$channel.image",
            isSaveToWatchLater: 1,
            isSubscribed: 1,
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
        { $sort: { time: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin." });
    }

    return res.status(200).json({ status: true, message: "Retrive videos for the user.", videos: videos });
  } catch (error) {
    console.log("getVideos fallback to local DB:", error.message);
    try {
      const db = require("../../util/connection");
      let allVideos = await db.find("videos", {});
      let normalVideos = allVideos.filter((v) => Number(v.videoType) === 1 || String(v._id).startsWith("video_"));
      if (normalVideos.length === 0) normalVideos = allVideos;
      return res.status(200).json({ status: true, message: "Retrieve videos for the user from local DB.", videos: normalVideos });
    } catch (e) {
      return res.status(200).json({ status: true, message: "Retrieve videos for the user.", videos: [] });
    }
  }
};

//get channel details of shorts for user
exports.channeldetailsOfShorts = async (req, res) => {
  try {
    if (!req.query.channelId || !req.query.userId || !req.query.start || !req.query.limit) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    const [channel, user, totalShortsOfChannel, isSubscribedChannel] = await Promise.all([
      User.findOne({ channelId: req.query.channelId }),
      User.findOne({ _id: req.query.userId, isActive: true }),
      Video.countDocuments({ channelId: req.query.channelId, videoType: 2 }),
      UserWiseSubscription.findOne({ $and: [{ userId: req.query.userId }, { channelId: req.query.channelId }] }),
    ]);

    if (!channel) {
      return res.status(200).json({ status: false, message: "channel does not found!" });
    }

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    const [isSubscribed, channelName, channelImage, totalSubscribers, data] = await Promise.all([
      isSubscribedChannel ? true : false,
      channel.fullName,
      channel.image,
      UserWiseSubscription.countDocuments({ channelId: channel.channelId }),
      Video.aggregate([
        {
          $match: {
            channelId: channel.channelId,
            videoType: 2,
            scheduleType: 2,
            visibilityType: 1,
          },
        },
        {
          $lookup: {
            from: "watchhistories",
            localField: "_id",
            foreignField: "videoId",
            as: "views",
          },
        },
        {
          $project: {
            title: 1,
            videoType: 1,
            videoTime: 1,
            videoUrl: 1,
            videoImage: 1,
            channelId: 1,
            createdAt: 1,
            views: { $size: "$views" },
          },
        },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    return res.status(200).json({
      status: true,
      message: "Retrive particular channel's details for shorts!",
      totalShortsOfChannel: totalShortsOfChannel,
      totalSubscribers: totalSubscribers,
      isSubscribed: isSubscribed,
      channelName: channelName,
      channelImage: channelImage,
      detailsOfShorts: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get type wise videos for user (home)
exports.videosOfHome = async (req, res) => {
  try {
    let now = dayjs();

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    if (!req.query.type) {
      return res.status(200).json({ status: false, message: "type must be requried." });
    }

    const type = req.query.type.trim().toLowerCase();
    const userId = req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId) ? new mongoose.Types.ObjectId(req.query.userId) : null;

    let user = null;
    if (userId) {
      user = await User.findOne({ _id: userId, isActive: true }).select("_id isBlock").lean();

      if (!user) {
        return res.status(200).json({
          status: false,
          message: "User does not found!",
        });
      }

      if (user.isBlock) {
        return res.status(200).json({
          status: false,
          message: "You are blocked by admin!",
        });
      }
    }

    if (type === "all") {
      let seed;
      if (start === 1) {
        seed =
          (userId
            ? userId
                .toString()
                .split("")
                .reduce((a, c) => a + c.charCodeAt(0), 0)
            : Math.floor(Math.random() * 1000000)) + Date.now();
      } else {
        if (!req.query.seed) {
          console.log("Seed is required for pagination beyond first page.");
          return res.status(200).json({
            status: false,
            message: "Seed is required for pagination beyond first page.",
          });
        }

        seed = Number(req.query.seed);

        if (!Number.isInteger(seed) || seed <= 0) {
          return res.status(200).json({
            status: false,
            message: "Invalid seed value.",
          });
        }
      }

      const [videos, shorts] = await Promise.all([
        Video.aggregate([
          {
            $match: {
              isActive: true,
              scheduleType: 2,
              visibilityType: 1,
              videoType: 1,
            },
          },
          {
            $facet: {
              data: [
                {
                  $addFields: {
                    randomSortField: {
                      $mod: [
                        {
                          $abs: {
                            $multiply: [{ $toLong: { $toDate: "$_id" } }, seed],
                          },
                        },
                        1234567,
                      ],
                    },
                  },
                },
                {
                  $sort: {
                    randomSortField: 1,
                    _id: 1,
                  },
                },
                { $skip: (start - 1) * limit },
                { $limit: limit },

                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    as: "channel",
                  },
                },
                { $unwind: { path: "$channel", preserveNullAndEmptyArrays: true } },

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                    ]
                  : []),

                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    as: "views",
                  },
                },

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
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
                    _id: 1,
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    scheduleType: 1,
                    scheduleTime: 1,
                    videoPrivacyType: 1,
                    userId: 1, //videoUserId
                    channelId: 1, //videoChannelId
                    views: { $size: "$views" },
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    videoUnlockCost: "$channel.videoUnlockCost",
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
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
        ]),
        Video.aggregate([
          {
            $match: {
              isActive: true,
              scheduleType: 2,
              visibilityType: 1,
              videoType: 2,
            },
          },
          {
            $facet: {
              data: [
                {
                  $addFields: {
                    randomSortField: {
                      $mod: [
                        {
                          $abs: {
                            $multiply: [{ $toLong: { $toDate: "$_id" } }, seed],
                          },
                        },
                        1234567,
                      ],
                    },
                  },
                },
                {
                  $sort: {
                    randomSortField: 1,
                    _id: 1,
                  },
                },
                { $skip: (start - 1) * limit },
                { $limit: limit },
                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    as: "channel",
                  },
                },
                {
                  $unwind: {
                    path: "$channel",
                    preserveNullAndEmptyArrays: true,
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                    ]
                  : []),

                {
                  $lookup: {
                    from: "videocomments",
                    localField: "_id",
                    foreignField: "videoId",
                    pipeline: [{ $match: { recursiveCommentId: null } }],
                    as: "totalComments",
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "likehistoryofvideos",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "likeHistory",
                        },
                      },
                      {
                        $unwind: { path: "$likeHistory", preserveNullAndEmptyArrays: true },
                      },
                    ]
                  : []),

                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    as: "views",
                  },
                },

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
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
                    _id: 1,
                    like: 1,
                    dislike: 1,
                    shareCount: 1,
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    description: 1,
                    hashTag: 1,
                    userId: 1, //videoUserId
                    channelId: 1, //videoChannelId
                    commentType: 1,
                    videoPrivacyType: 1,
                    createdAt: 1,
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    videoUnlockCost: "$channel.videoUnlockCost",
                    totalComments: { $size: "$totalComments" },
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    isLike: {
                      $eq: [{ $ifNull: ["$likeHistory.likeOrDislike", null] }, "like"],
                    },
                    isDislike: {
                      $eq: [{ $ifNull: ["$likeHistory.likeOrDislike", null] }, "dislike"],
                    },
                    views: { $size: "$views" },
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
        ]),
      ]);

      return res.status(200).json({
        status: true,
        message: "Retrive videos for the user!",
        seed,
        totalVideos: videos[0]?.total || 0,
        totalShorts: shorts[0]?.total || 0,
        data: {
          videos: videos[0]?.data || [],
          shorts: shorts[0]?.data || [],
        },
      });
    } else if (type === "popular") {
      const [videos, shorts] = await Promise.all([
        Video.aggregate([
          {
            $match: {
              isActive: true,
              scheduleType: 2,
              visibilityType: 1,
              videoType: 1,
            },
          },
          {
            $facet: {
              data: [
                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    as: "views",
                  },
                },
                { $sort: { views: -1 } },
                { $skip: (start - 1) * limit },
                { $limit: limit },
                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    as: "channel",
                  },
                },
                {
                  $unwind: {
                    path: "$channel",
                    preserveNullAndEmptyArrays: true,
                  },
                },

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                    ]
                  : []),

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
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
                    _id: 1,
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    scheduleType: 1,
                    scheduleTime: 1,
                    userId: 1, //videoUserId
                    channelId: 1, //videoChannelId
                    videoPrivacyType: 1,
                    views: { $size: "$views" },
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    videoUnlockCost: "$channel.videoUnlockCost",
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
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
        ]),
        Video.aggregate([
          {
            $match: {
              isActive: true,
              scheduleType: 2,
              visibilityType: 1,
              videoType: 2,
            },
          },
          {
            $facet: {
              data: [
                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    as: "views",
                  },
                },
                { $sort: { views: -1 } },
                { $skip: (start - 1) * limit },
                { $limit: limit },

                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    as: "channel",
                  },
                },
                {
                  $unwind: {
                    path: "$channel",
                    preserveNullAndEmptyArrays: true,
                  },
                },

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                    ]
                  : []),
                {
                  $lookup: {
                    from: "videocomments",
                    localField: "_id",
                    foreignField: "videoId",
                    pipeline: [{ $match: { recursiveCommentId: null } }],
                    as: "totalComments",
                  },
                },

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "likehistoryofvideos",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "likeHistory",
                        },
                      },

                      {
                        $unwind: { path: "$likeHistory", preserveNullAndEmptyArrays: true },
                      },
                    ]
                  : []),

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
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
                    like: 1,
                    dislike: 1,
                    shareCount: 1,
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    description: 1,
                    hashTag: 1,
                    userId: 1,
                    channelId: 1,
                    commentType: 1,
                    videoPrivacyType: 1,
                    createdAt: 1,
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    videoUnlockCost: "$channel.videoUnlockCost",
                    totalComments: { $size: "$totalComments" },
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    isLike: {
                      $eq: [{ $ifNull: ["$likeHistory.likeOrDislike", null] }, "like"],
                    },
                    isDislike: {
                      $eq: [{ $ifNull: ["$likeHistory.likeOrDislike", null] }, "dislike"],
                    },
                    views: { $size: "$views" },
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
        ]),
      ]);

      return res.status(200).json({
        status: true,
        message: "Retrieve popular videos successfully!",
        totalVideos: videos[0]?.total || 0,
        totalShorts: shorts[0]?.total || 0,
        data: {
          videos: videos[0]?.data || [],
          shorts: shorts[0]?.data || [],
        },
      });
    } else if (type === "new") {
      const [videos, shorts] = await Promise.all([
        Video.aggregate([
          {
            $match: {
              isActive: true,
              scheduleType: 2,
              visibilityType: 1,
              videoType: 1,
            },
          },
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: (start - 1) * limit },
                { $limit: limit },
                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    as: "channel",
                  },
                },
                {
                  $unwind: {
                    path: "$channel",
                    preserveNullAndEmptyArrays: true,
                  },
                },

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                    ]
                  : []),
                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    as: "views",
                  },
                },

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
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
                    _id: 1,
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    scheduleType: 1,
                    scheduleTime: 1,
                    videoPrivacyType: 1,
                    userId: 1, //videoUserId
                    channelId: 1, //videoChannelId
                    createdAt: 1,
                    views: { $size: "$views" },
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    videoUnlockCost: "$channel.videoUnlockCost",
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
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
        ]),
        Video.aggregate([
          {
            $match: {
              isActive: true,
              scheduleType: 2,
              visibilityType: 1,
              videoType: 2,
            },
          },
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: (start - 1) * limit },
                { $limit: limit },
                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    as: "channel",
                  },
                },
                {
                  $unwind: {
                    path: "$channel",
                    preserveNullAndEmptyArrays: true,
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                    ]
                  : []),

                {
                  $lookup: {
                    from: "videocomments",
                    localField: "_id",
                    foreignField: "videoId",
                    pipeline: [{ $match: { recursiveCommentId: null } }],
                    as: "totalComments",
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "likehistoryofvideos",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "likeHistory",
                        },
                      },

                      {
                        $unwind: { path: "$likeHistory", preserveNullAndEmptyArrays: true },
                      },
                    ]
                  : []),

                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    as: "views",
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),

                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
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
                    like: 1,
                    dislike: 1,
                    shareCount: 1,
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    description: 1,
                    hashTag: 1,
                    userId: 1,
                    channelId: 1,
                    commentType: 1,
                    videoPrivacyType: 1,
                    createdAt: 1,
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    videoUnlockCost: "$channel.videoUnlockCost",
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    totalComments: 1,
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    isLike: {
                      $eq: [{ $ifNull: ["$likeHistory.likeOrDislike", null] }, "like"],
                    },
                    isDislike: {
                      $eq: [{ $ifNull: ["$likeHistory.likeOrDislike", null] }, "dislike"],
                    },
                    views: { $size: "$views" },
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
        ]),
      ]);

      return res.status(200).json({
        status: true,
        message: "Retrieve latest videos successfully!",
        totalVideos: videos[0]?.total || 0,
        totalShorts: shorts[0]?.total || 0,
        data: {
          videos: videos[0]?.data || [],
          shorts: shorts[0]?.data || [],
        },
      });
    } else if (type === "publiclive") {
      const matchUser = {
        isBlock: false,
        isLive: true,
      };

      if (userId) {
        matchUser._id = { $ne: new mongoose.Types.ObjectId(userId) };
      }

      const publicLive = await User.aggregate([
        { $match: matchUser },
        {
          $lookup: {
            from: "liveusers",
            localField: "_id",
            foreignField: "userId",
            as: "liveUser",
          },
        },
        { $unwind: "$liveUser" },
        { $match: { "liveUser.liveType": 1 } },
        {
          $project: {
            _id: 1,
            fullName: 1,
            nickName: 1,
            image: 1,
            channelId: 1,
            thumbnail: "$liveUser.thumbnail",
            title: "$liveUser.title",
            liveHistoryId: "$liveUser.liveHistoryId",
            view: "$liveUser.view",
          },
        },
        {
          $facet: {
            data: [{ $skip: (start - 1) * limit }, { $limit: limit }],
            total: [{ $count: "count" }],
          },
        },
      ]);

      const data = publicLive[0]?.data || [];
      const total = publicLive[0]?.total[0]?.count || 0;

      return res.status(200).json({
        status: true,
        message: "Retrieve public live users successfully!",
        total,
        data,
      });
    } else {
      return res.status(200).json({ status: false, message: "Invalid type value." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get particular nornmal ( videos or shorts )'s details for user
exports.detailsOfVideo = async (req, res) => {
  try {
    if (!req.query.userId || !req.query.videoId || !req.query.videoType)
      return res.status(200).json({
        status: false,
        message: "Oops ! Invalid details.",
      });

    let now = dayjs();

    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const videoId = new mongoose.Types.ObjectId(req.query.videoId);
    const videoType = Number(req.query.videoType);

    const [user, video, data] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }),
      Video.findOne({ _id: videoId, videoType: videoType, isActive: true, scheduleType: 2, visibilityType: 1 }),
      Video.aggregate([
        {
          $match: {
            _id: videoId,
            videoType: videoType,
            scheduleType: 2,
            visibilityType: 1,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "channelId",
            foreignField: "channelId",
            as: "channel",
          },
        },
        {
          $unwind: "$channel",
        },
        {
          $lookup: {
            from: "videocomments",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { recursiveCommentId: null } }],
            as: "totalComments",
          },
        },
        {
          $lookup: {
            from: "userwisesubscriptions",
            localField: "channelId",
            foreignField: "channelId",
            as: "totalSubscribers",
          },
        },
        {
          $lookup: {
            from: "watchhistories",
            localField: "_id",
            foreignField: "videoId",
            as: "views",
          },
        },
        {
          $lookup: {
            from: "userwisesubscriptions",
            localField: "channelId",
            foreignField: "channelId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "subscription",
          },
        },
        {
          $lookup: {
            from: "likehistoryofvideos",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
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
          $lookup: {
            from: "savetowatchlaters",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "isSaveToWatchLater",
          },
        },
        {
          $lookup: {
            from: "videounlocks",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "unlockData",
          },
        },
        {
          $addFields: {
            isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
            isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
            isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
          },
        },
        {
          $addFields: {
            videoPrivacyType: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ["$videoPrivacyType", 1] }, // free video
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
            shareCount: 1,
            userId: 1,
            title: 1,
            videoType: 1,
            videoTime: 1,
            videoUrl: 1,
            videoImage: 1,
            description: 1,
            hashTag: 1,
            like: 1,
            dislike: 1,
            videoPrivacyType: 1,
            channelId: 1,
            commentType: 1,
            createdAt: 1,
            channelType: "$channel.channelType",
            subscriptionCost: "$channel.subscriptionCost",
            videoUnlockCost: "$channel.videoUnlockCost",
            channelName: "$channel.fullName",
            channelImage: "$channel.image",
            totalComments: { $size: "$totalComments" },
            totalSubscribers: { $size: "$totalSubscribers" },
            views: { $size: "$views" },
            isSubscribed: 1,
            isSaveToWatchLater: 1,
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
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin." });
    }

    if (!video) {
      return res.status(200).json({ status: false, message: "video does not found." });
    }

    return res.status(200).json({
      status: true,
      message: "Retrive particular video's details for user.",
      detailsOfVideo: data[0],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//create like or dislike for video (normal video or short)
exports.likeOrDislikeOfVideo = async (req, res) => {
  try {
    console.log("🔔 likeOrDislikeOfVideo API called");
    console.log("➡️ Request Query:", req.query);

    const { userId, videoId, likeOrDislike } = req.query;

    if (!userId || !videoId || !likeOrDislike) {
      console.log("❌ Missing required params");
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const validTypes = ["like", "dislike", "likeremove", "dislikeremove"];
    if (!validTypes.includes(likeOrDislike)) {
      console.log("❌ Invalid likeOrDislike type:", likeOrDislike);
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    console.log("🔍 Fetching user, video & history");

    const [user, video, existingHistory] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }),
      Video.findById(videoId),
      // one like/dislike record per (user, video)
      LikeHistoryOfVideo.findOne({ userId, videoId }),
    ]);

    console.log("👤 User:", user?._id);
    console.log("🎬 Video:", video?._id);
    console.log("📜 Existing History:", existingHistory?.likeOrDislike || "none");

    if (!user) return res.status(200).json({ status: false, message: "user does not found!" });
    if (user.isBlock) return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    if (!video) return res.status(200).json({ status: false, message: "video does not found!" });

    let like = Number(video.like) || 0;
    let dislike = Number(video.dislike) || 0;
    const setCounts = () => db.update("videos", videoId, { like, dislike });
    const current = existingHistory?.likeOrDislike || null;

    /* ===================== LIKE REMOVE ===================== */
    if (likeOrDislike === "likeremove") {
      if (current === "like") {
        like = Math.max(0, like - 1);
        await setCounts();
        await LikeHistoryOfVideo.deleteOne({ userId, videoId, likeOrDislike: "like" });
        const rev = await rewardEngine.reverseReward({
          userId, videoId,
          historyType: rewardEngine.HISTORY_TYPE.VIDEO_LIKE,
          countField: "dailyLikesToday",
        });
        if (rev.reversed) console.log("💰 Like coins reversed:", rev.reversed);
      }
      return res.status(200).json({ status: true, message: "Like removed successfully", isLike: false, like, dislike });
    }

    /* ===================== DISLIKE REMOVE ===================== */
    if (likeOrDislike === "dislikeremove") {
      if (current === "dislike") {
        dislike = Math.max(0, dislike - 1);
        await setCounts();
        await LikeHistoryOfVideo.deleteOne({ userId, videoId, likeOrDislike: "dislike" });
        const rev = await rewardEngine.reverseReward({
          userId, videoId,
          historyType: rewardEngine.HISTORY_TYPE.VIDEO_DISLIKE,
          countField: "dailyDislikesToday",
        });
        if (rev.reversed) console.log("💰 Dislike coins reversed:", rev.reversed);
      }
      return res.status(200).json({ status: true, message: "Dislike removed successfully", isLike: false, like, dislike });
    }

    /* ===================== LIKE ===================== */
    if (likeOrDislike === "like") {
      if (current === "like") {
        return res.status(200).json({ status: true, message: "Already liked", isLike: true, like, dislike });
      }

      like += 1;
      if (current === "dislike") {
        dislike = Math.max(0, dislike - 1);
        await rewardEngine.reverseReward({
          userId, videoId,
          historyType: rewardEngine.HISTORY_TYPE.VIDEO_DISLIKE,
          countField: "dailyDislikesToday",
        });
      }

      await setCounts();
      await LikeHistoryOfVideo.deleteOne({ userId, videoId, likeOrDislike: "dislike" });
      await LikeHistoryOfVideo.create({ userId, videoId, channelId: video.channelId, likeOrDislike: "like" });

      // Coins: server-decided, once per video, capped by maxLikesPerDay + daily earning cap.
      const likeReward = await rewardEngine.creditReward({
        userId,
        kind: "like",
        historyType: rewardEngine.HISTORY_TYPE.VIDEO_LIKE,
        countField: "dailyLikesToday",
        capField: "maxLikesPerDay",
        dedupeVideoId: videoId,
        meta: { videoId },
      });
      const coinsEarned = likeReward.ok ? likeReward.credited : 0;
      console.log("💰 Like reward:", coinsEarned, likeReward.reason, "→", user?.fullName);

      if (user.fcmToken && coinsEarned > 0) {
        try {
          admin.messaging().send({
            token: user.fcmToken,
            notification: { title: "👍 You've Earned Coins!", body: `You earned ${coinsEarned} coins for liking a video 🎬💰` },
            data: { type: "ENGAGEMENT_LIKING_REWARD" },
          }).catch(() => {});
        } catch (e) {}
      }

      try {
        const videoUser = await User.findById(video.userId);
        if (videoUser?.fcmToken) {
          admin.messaging().send({
            token: videoUser.fcmToken,
            notification: { title: "🌟 New Like!", body: "Someone liked your video 👍🎥" },
            data: { type: "VIDEO_LIKING_NOTIFICATION" },
          }).catch(() => {});
        }
      } catch (e) {}

      return res.status(200).json({
        status: true,
        message: "Video liked successfully",
        isLike: true,
        like,
        dislike,
        coinsEarned,
        rewardStatus: likeReward.reason,
      });
    }

    /* ===================== DISLIKE ===================== */
    if (likeOrDislike === "dislike") {
      if (current === "dislike") {
        return res.status(200).json({ status: true, message: "Already disliked", isLike: false, like, dislike });
      }

      dislike += 1;
      if (current === "like") {
        like = Math.max(0, like - 1);
        await rewardEngine.reverseReward({
          userId, videoId,
          historyType: rewardEngine.HISTORY_TYPE.VIDEO_LIKE,
          countField: "dailyLikesToday",
        });
      }

      await setCounts();
      await LikeHistoryOfVideo.deleteOne({ userId, videoId, likeOrDislike: "like" });
      await LikeHistoryOfVideo.create({ userId, videoId, channelId: video.channelId, likeOrDislike: "dislike" });

      // Dislike reward (YP-TC-2026-FINAL: 2 coins; set dislikeVideoRewardCoins=0 in settings to disable)
      const dislikeReward = await rewardEngine.creditReward({
        userId,
        kind: "dislike",
        historyType: rewardEngine.HISTORY_TYPE.VIDEO_DISLIKE,
        countField: "dailyDislikesToday",
        capField: "maxDislikesPerDay",
        dedupeVideoId: videoId,
        meta: { videoId },
      });
      const coinsEarned = dislikeReward.ok ? dislikeReward.credited : 0;
      console.log("✅ Dislike completed. Reward:", coinsEarned, dislikeReward.reason);

      return res.status(200).json({
        status: true,
        message: "Video disliked successfully",
        isLike: false,
        like,
        dislike,
        coinsEarned,
        rewardStatus: dislikeReward.reason,
      });
    }
  } catch (error) {
    console.error("API ERROR:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get all more like this (normal videos or shorts)
exports.getAllLikeThis = async (req, res) => {
  try {
    if (!req.query.videoId || !req.query.userId) {
      return res.status(200).json({ status: false, message: "videoId and userId must be required." });
    }

    const { videoId, start = 1, limit = 10 } = req.query || {};
    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const skip = (start - 1) * limit;

    const [user, currentVideo] = await Promise.all([User.findOne({ _id: userId, isActive: true }), Video.findById(videoId).select("_id hashTag videoType")]);

    if (!user) {
      return res.status(200).json({ status: false, message: "user does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin." });
    }

    if (!currentVideo) {
      return res.status(200).json({ status: false, message: "Video not found" });
    }

    const hashTags = currentVideo.hashTag || [];

    const data = await Video.aggregate([
      {
        $match: {
          _id: { $ne: currentVideo._id },
          videoType: { $eq: currentVideo.videoType },
          scheduleType: 2,
          visibilityType: 1,
          hashTag: { $in: hashTags },
        },
      },
      {
        $facet: {
          paginatedData: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      fullName: 1,
                      image: 1,
                      channelId: 1,
                      subscriptionCost: 1,
                      videoUnlockCost: 1,
                      channelType: 1,
                    },
                  },
                ],
                as: "owner",
              },
            },
            {
              $unwind: {
                path: "$owner",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $lookup: {
                from: "watchhistories",
                localField: "_id",
                foreignField: "videoId",
                as: "views",
              },
            },
            {
              $lookup: {
                from: "savetowatchlaters",
                localField: "_id",
                foreignField: "videoId",
                pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                as: "isSaveToWatchLater",
              },
            },
            {
              $lookup: {
                from: "userwisesubscriptions",
                localField: "channelId",
                foreignField: "channelId",
                pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                as: "subscription",
              },
            },
            {
              $lookup: {
                from: "videounlocks",
                localField: "_id",
                foreignField: "videoId",
                pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                as: "unlockData",
              },
            },
            {
              $addFields: {
                isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
              },
            },
            {
              $addFields: {
                totalViews: { $ifNull: [{ $arrayElemAt: ["$views.count", 0] }, 0] },
                videoPrivacyType: {
                  $cond: {
                    if: {
                      $or: [
                        { $eq: ["$videoPrivacyType", 1] }, // free video
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
                time: {
                  $let: {
                    vars: {
                      diff: { $subtract: [new Date(), "$createdAt"] },
                    },
                    in: {
                      $switch: {
                        branches: [
                          {
                            case: { $gte: ["$$diff", 31536000000] },
                            then: {
                              $concat: [{ $toString: { $floor: { $divide: ["$$diff", 31536000000] } } }, " years ago"],
                            },
                          },
                          {
                            case: { $gte: ["$$diff", 2592000000] },
                            then: {
                              $concat: [{ $toString: { $floor: { $divide: ["$$diff", 2592000000] } } }, " months ago"],
                            },
                          },
                          {
                            case: { $gte: ["$$diff", 86400000] },
                            then: {
                              $concat: [{ $toString: { $floor: { $divide: ["$$diff", 86400000] } } }, " days ago"],
                            },
                          },
                        ],
                        default: "Just now",
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                title: 1,
                videoImage: 1,
                videoUrl: 1,
                videoTime: 1,
                videoType: 1,
                channelId: 1,
                videoPrivacyType: 1,
                user: {
                  fullName: "$owner.fullName",
                  image: "$owner.image",
                  channelId: "$owner.channelId",
                  subscriptionCost: "$owner.subscriptionCost",
                  videoUnlockCost: "$owner.videoUnlockCost",
                  channelType: "$owner.channelType",
                },
                totalViews: 1,
                time: 1,
                isSavedToWatchLater: 1,
                isSubscribedChannel: "$isSubscribed",
                createdAt: 1,
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const videos = data[0].paginatedData;
    const total = data[0].totalCount[0]?.count || 0;

    return res.status(200).json({
      status: true,
      message: "Similar videos fetched",
      total,
      data: videos,
    });
  } catch (error) {
    console.error("getAllLikeThis error:", error);
    return res.status(500).json({ status: false, message: "Something went wrong" });
  }
};

//search (normal videos or shorts) for user
exports.search = async (req, res) => {
  try {
    if (!req.body.searchString || !req.body.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    let now = dayjs();
    const userId = new mongoose.Types.ObjectId(req.body.userId);

    const [user, response] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }),
      Video.aggregate([
        {
          $match: {
            isActive: true,
            scheduleType: 2,
            visibilityType: 1,
            $or: [{ title: { $regex: req.body.searchString?.trim(), $options: "i" } }, { description: { $regex: req.body.searchString?.trim(), $options: "i" } }],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "channelId",
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
            localField: "_id",
            foreignField: "videoId",
            as: "views",
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
            from: "savetowatchlaters",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "isSaveToWatchLater",
          },
        },
        {
          $lookup: {
            from: "videounlocks",
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "unlockData",
          },
        },
        {
          $addFields: {
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
                    { $eq: ["$videoPrivacyType", 1] }, // free video
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
            title: 1,
            videoType: 1,
            videoTime: 1,
            videoUrl: 1,
            videoImage: 1,
            description: 1,
            channelId: 1,
            videoPrivacyType: 1,
            createdAt: 1,
            channelType: "$channel.channelType",
            subscriptionCost: "$channel.subscriptionCost",
            videoUnlockCost: "$channel.videoUnlockCost",
            channelName: "$channel.fullName",
            channelImage: "$channel.image",
            isSubscribed: 1,
            isSaveToWatchLater: 1,
            views: { $size: "$views" },
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
      // SearchHistory.create({
      //   userId: userId,
      //   searchString: req?.body?.searchString,
      // }),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin." });
    }

    return res.status(200).json({ status: true, message: "Success", searchData: response });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//previous search (normal videos or shorts) for user
exports.searchData = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({
        status: false,
        message: "Oops! Invalid details!",
      });
    }

    const user = await User.findOne({ _id: req.query.userId, isActive: true });
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin." });
    }

    const lastSearchedData = await SearchHistory.find({ userId: user.id })
      .sort({ createdAt: -1 }) //Sort by most recently searched
      .limit(20);

    return res.status(200).json({
      status: true,
      message: "Success",
      lastSearchedData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//search shorts for user
exports.searchShorts = async (req, res) => {
  try {
    if (!req.body.searchString || !req.body.userId) {
      return res.status(200).json({
        status: false,
        message: "Oops! Invalid details!",
      });
    }

    let now = dayjs();
    const userId = new mongoose.Types.ObjectId(req.body.userId);

    const [user, response] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }).select("_id isBlock"),
      Video.aggregate([
        {
          $match: {
            $and: [
              {
                $or: [{ title: { $regex: req.body.searchString?.trim(), $options: "i" } }, { description: { $regex: req.body.searchString?.trim(), $options: "i" } }],
              },
              { isActive: true },
              { videoType: 2 },
              { scheduleType: 2 },
              { visibilityType: 2 },
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "channelId",
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
            localField: "_id",
            foreignField: "videoId",
            as: "views",
          },
        },
        {
          $lookup: {
            from: "savetowatchlaters",
            localField: "_id",
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
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "unlockData",
          },
        },
        {
          $addFields: {
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
                    { $eq: ["$videoPrivacyType", 1] }, // free video
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
            title: 1,
            videoType: 1,
            videoTime: 1,
            videoUrl: 1,
            videoImage: 1,
            description: 1,
            videoPrivacyType: 1,
            createdAt: 1,
            channelType: "$channel.channelType",
            subscriptionCost: "$channel.subscriptionCost",
            videoUnlockCost: "$channel.videoUnlockCost",
            channelName: "$channel.fullName",
            channelImage: "$channel.image",
            isSubscribed: 1,
            views: { $size: "$views" },
            isSaveToWatchLater: 1,
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
      // SearchHistory.create({
      //   userId: userId,
      //   searchString: req?.body?.searchString,
      // }),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin." });
    }

    return res.status(200).json({ status: true, message: "Success", searchShortsData: response });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//type wise searching (All OR videos OR shorts)
exports.searchChannelVideoShortsByUser = async (req, res) => {
  try {
    const { start = 1, limit = 10 } = req.query || {};

    if (!req.query.searchString) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    let now = dayjs();
    const type = req.query.type.trim().toLowerCase() || "all";
    const searchString = req.query.searchString.trim();
    const userId = req.query.userId ? new mongoose.Types.ObjectId(req.query.userId) : null;
    const skip = (Number(start) - 1) * Number(limit);

    if (type === "all") {
      const [user, channel, videos, shorts, historyEntry] = await Promise.all([
        userId ? User.findOne({ _id: userId, isActive: true }).select("_id isBlock").lean() : Promise.resolve(null),
        User.aggregate([
          {
            $match: {
              channelId: { $ne: null },
              fullName: { $regex: searchString, $options: "i" },
            },
          },
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: Number(limit) },
                {
                  $lookup: {
                    from: "videos",
                    localField: "channelId",
                    foreignField: "channelId",
                    as: "totalVideos",
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                    ]
                  : []),

                {
                  $lookup: {
                    from: "userwisesubscriptions",
                    localField: "channelId",
                    foreignField: "channelId",
                    as: "totalSubscribers",
                  },
                },
                {
                  $project: {
                    channelId: 1,
                    fullName: 1,
                    image: 1,
                    channelType: 1,
                    subscriptionCost: 1,
                    videoUnlockCost: 1,
                    createdAt: 1,
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    totalVideos: { $size: "$totalVideos" },
                    totalSubscribers: { $size: "$totalSubscribers" },
                  },
                },
              ],
              total: [{ $count: "count" }],
            },
          },
        ]),
        Video.aggregate([
          {
            $match: {
              isActive: true,
              scheduleType: 2,
              visibilityType: 1,
              videoType: 1,
              $or: [{ title: { $regex: searchString, $options: "i" } }, { description: { $regex: searchString, $options: "i" } }],
            },
          },
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: Number(limit) },
                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    pipeline: [{ $project: { fullName: 1, image: 1, channelType: 1, subscriptionCost: 1, videoUnlockCost: 1 } }],
                    as: "channel",
                  },
                },
                { $unwind: "$channel" },
                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    pipeline: [{ $count: "count" }],
                    as: "viewsData",
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
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
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    description: 1,
                    channelId: 1,
                    videoPrivacyType: 1,
                    createdAt: 1,
                    subscriptionCost: "$channel.subscriptionCost",
                    videoUnlockCost: "$channel.videoUnlockCost",
                    channelType: "$channel.channelType",
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    views: { $ifNull: [{ $arrayElemAt: ["$viewsData.count", 0] }, 0] },
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
              ],
              total: [{ $count: "count" }],
            },
          },
        ]),
        Video.aggregate([
          {
            $match: {
              isActive: true,
              scheduleType: 2,
              visibilityType: 1,
              videoType: 2,
              $or: [{ title: { $regex: searchString, $options: "i" } }, { description: { $regex: searchString, $options: "i" } }],
            },
          },
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: Number(limit) },
                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    pipeline: [{ $project: { fullName: 1, image: 1, channelType: 1, subscriptionCost: 1, videoUnlockCost: 1 } }],
                    as: "channel",
                  },
                },
                { $unwind: "$channel" },
                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    pipeline: [{ $count: "count" }],
                    as: "viewsData",
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
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
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    description: 1,
                    channelId: 1,
                    videoPrivacyType: 1,
                    createdAt: 1,
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    videoUnlockCost: "$channel.videoUnlockCost",
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    views: { $ifNull: [{ $arrayElemAt: ["$viewsData.count", 0] }, 0] },
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
              ],
              total: [{ $count: "count" }],
            },
          },
        ]),
        // SearchHistory.create({
        //   userId: userId,
        //   searchString: searchString,
        // }),
      ]);

      if (userId) {
        if (!user) {
          return res.status(200).json({ status: false, message: "User does not found." });
        }

        if (user.isBlock) {
          return res.status(200).json({ status: false, message: "you are blocked by admin." });
        }
      }

      return res.status(200).json({
        status: true,
        message: "Success",
        searchData: {
          totalChannel: channel[0]?.total[0]?.count || 0,
          channel: channel,
          totalVideos: videos[0]?.total[0]?.count || 0,
          videos: videos[0]?.data || [],
          totalShorts: shorts[0]?.total[0]?.count || 0,
          shorts: shorts[0]?.data || [],
        },
      });
    } else if (type === "videos") {
      const [user, shorts, historyEntry] = await Promise.all([
        userId ? User.findOne({ _id: userId, isActive: true }).select("_id isBlock").lean() : Promise.resolve(null),
        Video.aggregate([
          {
            $match: {
              $and: [
                {
                  $or: [{ title: { $regex: searchString, $options: "i" } }, { description: { $regex: searchString, $options: "i" } }],
                },
                { isActive: true },
                { videoType: 1 },
                { scheduleType: 2 },
                { visibilityType: 2 },
              ],
            },
          },
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: Number(limit) },
                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    pipeline: [{ $project: { fullName: 1, image: 1, channelType: 1, subscriptionCost: 1, videoUnlockCost: 1 } }],
                    as: "channel",
                  },
                },
                { $unwind: "$channel" },
                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    pipeline: [{ $count: "count" }],
                    as: "viewsData",
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
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
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    description: 1,
                    videoPrivacyType: 1,
                    createdAt: 1,
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    videoUnlockCost: "$channel.videoUnlockCost",
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    views: { $ifNull: [{ $arrayElemAt: ["$viewsData.count", 0] }, 0] },
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
              ],
              total: [{ $count: "count" }],
            },
          },
        ]),
        // SearchHistory.create({
        //   userId: userId,
        //   searchString: req?.body?.searchString,
        // }),
      ]);

      if (userId) {
        if (!user) {
          return res.status(200).json({ status: false, message: "User does not found." });
        }

        if (user.isBlock) {
          return res.status(200).json({ status: false, message: "you are blocked by admin." });
        }
      }

      return res.status(200).json({
        status: true,
        message: "Success",
        searchData: shorts,
        total: shorts[0]?.total[0]?.count || 0,
      });
    } else if (type === "shorts") {
      const [user, videos, historyEntry] = await Promise.all([
        userId ? User.findOne({ _id: userId, isActive: true }).select("_id isBlock").lean() : Promise.resolve(null),
        Video.aggregate([
          {
            $match: {
              $and: [
                {
                  $or: [{ title: { $regex: searchString, $options: "i" } }, { description: { $regex: searchString, $options: "i" } }],
                },
                { isActive: true },
                { videoType: 2 },
                { scheduleType: 2 },
                { visibilityType: 2 },
              ],
            },
          },
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: Number(limit) },
                {
                  $lookup: {
                    from: "users",
                    localField: "channelId",
                    foreignField: "channelId",
                    pipeline: [{ $project: { fullName: 1, image: 1, channelType: 1, subscriptionCost: 1, videoUnlockCost: 1 } }],
                    as: "channel",
                  },
                },
                { $unwind: "$channel" },
                {
                  $lookup: {
                    from: "watchhistories",
                    localField: "_id",
                    foreignField: "videoId",
                    pipeline: [{ $count: "count" }],
                    as: "viewsData",
                  },
                },
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "userwisesubscriptions",
                          localField: "channelId",
                          foreignField: "channelId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "subscription",
                        },
                      },
                      {
                        $lookup: {
                          from: "savetowatchlaters",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "isSaveToWatchLater",
                        },
                      },
                    ]
                  : []),
                ...(userId
                  ? [
                      {
                        $lookup: {
                          from: "videounlocks",
                          localField: "_id",
                          foreignField: "videoId",
                          pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
                          as: "unlockData",
                        },
                      },
                    ]
                  : []),
                {
                  $addFields: {
                    isSaveToWatchLater: { $gt: [{ $size: { $ifNull: ["$isSaveToWatchLater", []] } }, 0] },
                    isSubscribed: { $gt: [{ $size: { $ifNull: ["$subscription", []] } }, 0] },
                    isUnlocked: { $gt: [{ $size: { $ifNull: ["$unlockData", []] } }, 0] },
                  },
                },
                {
                  $addFields: {
                    videoPrivacyType: {
                      $cond: {
                        if: {
                          $or: [
                            { $eq: ["$videoPrivacyType", 1] }, // free video
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
                    title: 1,
                    videoType: 1,
                    videoTime: 1,
                    videoUrl: 1,
                    videoImage: 1,
                    description: 1,
                    videoPrivacyType: 1,
                    createdAt: 1,
                    channelType: "$channel.channelType",
                    subscriptionCost: "$channel.subscriptionCost",
                    videoUnlockCost: "$channel.videoUnlockCost",
                    channelName: "$channel.fullName",
                    channelImage: "$channel.image",
                    isSubscribed: 1,
                    isSaveToWatchLater: 1,
                    views: { $ifNull: [{ $arrayElemAt: ["$viewsData.count", 0] }, 0] },
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
              ],
              total: [{ $count: "count" }],
            },
          },
        ]),
        // SearchHistory.create({
        //   userId: userId,
        //   searchString: req?.body?.searchString,
        // }),
      ]);

      if (userId) {
        if (!user) {
          return res.status(200).json({ status: false, message: "User does not found." });
        }

        if (user.isBlock) {
          return res.status(200).json({ status: false, message: "you are blocked by admin." });
        }
      }

      return res.status(200).json({
        status: true,
        message: "Success",
        searchData: videos,
        total: videos[0]?.total[0]?.count || 0,
      });
    } else {
      return res.status(200).json({ status: false, message: "type must be passed valid!" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//clear all searchHistory for particular user
exports.clearAllSearchHistory = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    const user = await User.findOne({ _id: req.query.userId, isActive: true });
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    const clearSearchHistory = await SearchHistory.deleteMany({ userId: user._id });

    if (clearSearchHistory.deletedCount > 0) {
      return res.status(200).json({
        status: true,
        message: "Successfully cleared all search history for the user!",
      });
    } else {
      return res.status(200).json({
        status: false,
        message: "Search history not found for the user!",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//update (normal videos or shorts) by user
exports.modifyVideo = async (req, res) => {
  try {
    if (!req.query.videoId || !req.query.userId || !req.query.channelId || !req.query.videoType) {
      if (req.body.videoImage) {
        await deleteFromStorage(req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await deleteFromStorage(req.body.videoUrl);
      }

      return res.status(200).json({ status: false, message: "OOps ! Invalid details!" });
    }

    const [user, video] = await Promise.all([
      User.findOne({ _id: req.query.userId, isActive: true }).select("isBlock channelId").lean(),
      Video.findOne({ _id: req.query.videoId, isActive: true, videoType: Number(req.query.videoType) }),
    ]);

    if (!user) {
      if (req.body.videoImage) {
        await deleteFromStorage(req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await deleteFromStorage(req.body.videoUrl);
      }

      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      if (req.body.videoImage) {
        await deleteFromStorage(req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await deleteFromStorage(req.body.videoUrl);
      }

      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    const channel = await User.findOne({ channelId: user.channelId });
    if (!channel) {
      if (req.body.videoImage) {
        await deleteFromStorage(req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await deleteFromStorage(req.body.videoUrl);
      }

      return res.status(200).json({ status: false, message: "channel does not found!" });
    }

    if (user.channelId !== req.query.channelId) {
      if (req.body.videoImage) {
        await deleteFromStorage(req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await deleteFromStorage(req.body.videoUrl);
      }

      return res.status(200).json({ status: false, message: "video has been updated only by own channelId." });
    }

    if (!video) {
      if (req.body.videoImage) {
        await deleteFromStorage(req.body.videoImage);
      }

      if (req.body.videoUrl) {
        await deleteFromStorage(req.body.videoUrl);
      }

      return res.status(200).json({ status: false, message: "video does not found!" });
    }

    res.status(200).json({
      status: true,
      message: "Video has been updated!",
    });

    video.title = req?.body?.title ? req?.body?.title?.trim() : video.title;
    video.description = req?.body?.description ? req?.body?.description?.trim() : video.description;

    if (Number(req.query.videoType) === 2) {
      if (req?.body?.videoTime) {
        if (global.settingJSON.durationOfShorts < Number(req?.body?.videoTime)) {
          if (req.body.videoImage) {
            await deleteFromStorage(req.body.videoImage);
          }

          if (req.body.videoUrl) {
            await deleteFromStorage(req.body.videoUrl);
          }

          return res.status(200).json({ status: false, message: "your duration of Shorts greater than decided by the admin." });
        }

        video.videoTime = req?.body?.videoTime ? req?.body?.videoTime : video.videoTime;
      }
    }

    video.visibilityType = req?.body?.visibilityType ? req?.body?.visibilityType : video.visibilityType;
    video.audienceType = req?.body?.audienceType ? req?.body?.audienceType : video.audienceType;
    video.commentType = req?.body?.commentType ? req?.body?.commentType : video.commentType;

    if (req?.body?.scheduleType) {
      video.scheduleType = req?.body?.scheduleType ? req?.body?.scheduleType : video.scheduleType;

      if (req?.body?.scheduleType == 1) {
        video.scheduleTime = req?.body?.scheduleTime ? moment(req?.body?.scheduleTime).toDate() : video.scheduleTime; //e.g."2023-07-11T18:00:00.000Z"
      } else if (req?.body?.scheduleType == 2) {
        video.scheduleTime = "";
      } else {
        if (req.body.videoImage) {
          await deleteFromStorage(req.body.videoImage);
        }

        if (req.body.videoUrl) {
          await deleteFromStorage(req.body.videoUrl);
        }

        return res.status(200).json({ status: false, message: "scheduleType must be passed valid!" });
      }
    }

    video.location = req?.body?.location ? req?.body?.location : video.location;
    video.locationCoordinates.latitude = req?.body?.latitude ? req?.body?.latitude : video.latitude;
    video.locationCoordinates.longitude = req?.body?.longitude ? req?.body?.longitude : video.longitude;

    const multiplehashTag = req?.body?.hashTag ? req?.body?.hashTag.toString().split(",") : video.hashTag;
    video.hashTag = multiplehashTag;

    if (req?.body?.videoImage) {
      if (video.videoImage) {
        await deleteFromStorage(video.videoImage);
      }
      video.videoImage = req?.body?.videoImage ? req?.body?.videoImage : video.videoImage;
    }

    if (req?.body?.videoUrl) {
      if (video.videoUrl) {
        await deleteFromStorage(video.videoUrl);
      }
      video.videoUrl = req?.body?.videoUrl ? req?.body?.videoUrl : video.videoUrl;
    }

    await video.save();
  } catch (error) {
    if (req.body.videoImage) {
      await deleteFromStorage(req.body.videoImage);
    }

    if (req.body.videoUrl) {
      await deleteFromStorage(req.body.videoUrl);
    }
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//delete (normal videos or shorts) by user
exports.deleteVideoRecord = async (req, res) => {
  try {
    if (!req.query.videoId) {
      return res.status(200).json({ status: false, message: "videoId must be required!" });
    }

    const videoIds = req.query.videoId.split(",");

    const videos = await Video.find({ _id: { $in: videoIds } }).lean();

    if (!videos.length) {
      return res.status(200).json({ status: false, message: "No videos found with the provided IDs." });
    }

    res.status(200).json({
      status: true,
      message: "Video has been deleted by the admin.",
    });

    await Promise.all(
      videos.map(async (video) => {
        if (video.videoImage) {
          await deleteFromStorage(video.videoImage);
        }

        if (video.videoUrl) {
          await deleteFromStorage(video.videoUrl);
        }

        const comments = await VideoComment.find({ videoId: video._id }).select("_id").lean();
        const commentIds = comments.map((c) => c._id);

        await Promise.all([
          Notification.deleteMany({ videoId: video._id }),
          LikeHistoryOfVideo.deleteMany({ videoId: video._id }),
          commentIds.length ? LikeHistoryOfVideoComment.deleteMany({ videoCommentId: { $in: commentIds } }) : null,
          VideoComment.deleteMany({ videoId: video._id }),
          Report.deleteMany({ videoId: video._id }),
          SaveToWatchLater.deleteMany({ videoId: video._id }),
          WatchHistory.deleteMany({ videoId: video._id }),
          PlaybackSession.deleteMany({ videoId: video._id }),
          PlayList.updateMany({ videoId: video._id }, { $pull: { videoId: video._id } }),
          Video.deleteOne({ _id: video._id }),
        ]);
      }),
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get top 10 videos based on views
exports.getTopViewedVideos = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details." });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const user = await User.findOne({ _id: userId, isActive: true }).select("isBlock").lean();

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by admin." });
    }

    const videos = await Video.aggregate([
      {
        $match: {
          userId,
          isActive: true,
          videoType: 1,
          scheduleType: 2,
          visibilityType: 1,
        },
      },
      {
        $lookup: {
          from: "watchhistories",
          localField: "_id",
          foreignField: "videoId",
          as: "views",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { channelId: "$channelId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$channelId", "$$channelId"],
                },
              },
            },
            {
              $project: {
                _id: 0,
                fullName: 1,
                image: 1,
                channelType: 1,
              },
            },
          ],
          as: "channel",
        },
      },
      {
        $unwind: {
          path: "$channel",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          viewsCount: { $size: "$views" },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          videoUrl: 1,
          videoImage: 1,
          videoTime: 1,
          views: "$viewsCount",
          channelId: 1,
          channelName: "$channel.fullName",
          channelImage: "$channel.image",
          channelType: "$channel.channelType",
          createdAt: 1,
        },
      },
      { $match: { views: { $gt: 0 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]);

    return res.status(200).json({
      status: true,
      message: "Top viewed videos fetched successfully.",
      videos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get all normal videos for user (at the time of added to playlist or watch later or history)
exports.getVideoList = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const search = req.query.search?.trim() || "";

    const userId = req?.query?.userId || null;

    const pipeline = [
      {
        $match: {
          isActive: true,
          videoType: 1,
          scheduleType: 2,
          visibilityType: 1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channelId",
          foreignField: "channelId",
          pipeline: [
            {
              $project: {
                _id: 0,
                fullName: 1,
                image: 1,
                channelType: 1,
                subscriptionCost: 1,
              },
            },
          ],
          as: "channel",
        },
      },
      {
        $unwind: {
          path: "$channel",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: "watchhistories",
          localField: "_id",
          foreignField: "videoId",
          as: "views",
        },
      },
    ];

    if (userId) {
      pipeline.push(
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
            localField: "_id",
            foreignField: "videoId",
            pipeline: [{ $match: { userId: userId } }, { $limit: 1 }],
            as: "unlockData",
          },
        },
        {
          $addFields: {
            isSubscribed: { $gt: [{ $size: "$subscription" }, 0] },
            isUnlocked: { $gt: [{ $size: "$unlockData" }, 0] },
          },
        },
      );
    } else {
      pipeline.push({
        $addFields: {
          isSubscribed: false,
          isUnlocked: false,
        },
      });
    }

    pipeline.push({
      $addFields: {
        videoPrivacyType: {
          $cond: {
            if: {
              $or: [
                { $eq: ["$videoPrivacyType", 1] }, // free
                "$isUnlocked",
                {
                  $and: [{ $eq: ["$channel.channelType", 2] }, "$isSubscribed"],
                },
              ],
            },
            then: 1,
            else: 2,
          },
        },
      },
    });

    if (search) {
      pipeline.push({
        $match: {
          $or: [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }, { "channel.fullName": { $regex: search, $options: "i" } }],
        },
      });
    }

    pipeline.push({
      $facet: {
        videos: [
          {
            $project: {
              _id: 1,
              title: 1,
              description: 1,
              videoType: 1,
              videoTime: 1,
              videoUrl: 1,
              videoImage: 1,
              scheduleType: 1,
              scheduleTime: 1,
              createdAt: 1,
              userId: 1,
              channelId: 1,

              channelName: "$channel.fullName",
              channelType: "$channel.channelType",
              channelImage: "$channel.image",
              subscriptionCost: "$channel.subscriptionCost",

              videoPrivacyType: 1,
              isSubscribed: 1,
              views: { $size: "$views" },
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: (start - 1) * limit },
          { $limit: limit },
        ],
        totalCount: [{ $count: "count" }],
      },
    });

    const result = await Video.aggregate(pipeline);

    const videos = result[0]?.videos || [];
    const total = result[0]?.totalCount[0]?.count || 0;

    return res.status(200).json({
      status: true,
      message: "Retrieve videos for the user.",
      total,
      videos,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//get own videos/shorts
exports.getUserVideos = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const { userId, videoType } = req.query;

    if (!userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const objectUserId = new mongoose.Types.ObjectId(userId);

    const matchFilter = {
      isActive: true,
      userId: objectUserId,
    };

    if (videoType !== undefined) {
      matchFilter.videoType = parseInt(videoType);
    }

    const [user, result] = await Promise.all([
      User.findOne({ _id: objectUserId, isActive: true }).select("isBlock").lean(),
      Video.aggregate([
        { $match: matchFilter },
        {
          $facet: {
            videos: [
              { $sort: { createdAt: -1 } },
              { $skip: (start - 1) * limit },
              { $limit: limit },

              {
                $lookup: {
                  from: "videocomments",
                  localField: "_id",
                  foreignField: "videoId",
                  pipeline: [{ $match: { recursiveCommentId: null } }],
                  as: "totalComments",
                },
              },
              {
                $lookup: {
                  from: "likehistoryofvideos",
                  localField: "_id",
                  foreignField: "videoId",
                  pipeline: [{ $match: { userId: objectUserId } }, { $limit: 1 }],
                  as: "likeHistory",
                },
              },
              {
                $lookup: {
                  from: "watchhistories",
                  localField: "_id",
                  foreignField: "videoId",
                  as: "views",
                },
              },
              {
                $lookup: {
                  from: "videounlocks",
                  localField: "_id",
                  foreignField: "videoId",
                  pipeline: [{ $match: { userId: objectUserId } }, { $limit: 1 }],
                  as: "unlockData",
                },
              },
              {
                $addFields: {
                  isUnlocked: { $gt: [{ $size: "$unlockData" }, 0] },
                  totalComments: { $size: "$totalComments" },
                  views: { $size: "$views" },
                },
              },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  description: 1,
                  hashTag: 1,
                  location: 1,
                  videoType: 1,
                  videoTime: 1,
                  videoUrl: 1,
                  videoImage: 1,
                  scheduleType: 1,
                  scheduleTime: 1,
                  userId: 1,
                  channelId: 1,
                  videoPrivacyType: 1,
                  totalComments: 1,
                  views: 1,
                  createdAt: 1,
                },
              },
            ],

            totalCount: [{ $count: "count" }],
          },
        },

        {
          $project: {
            videos: 1,
            total: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
          },
        },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin." });
    }

    return res.status(200).json({
      status: true,
      message: "Retrieve videos for the user.",
      videos: result[0]?.videos || [],
      total: result[0]?.total || 0,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
