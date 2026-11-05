const MonetizationRequest = require("../../models/monetizationRequest.model");

//import models
const User = require("../../models/user.model");
const UserWiseSubscription = require("../../models/userWiseSubscription.model");
const WatchHistory = require("../../models/watchHistory.model");
const Notification = require("../../models/notification.model");

//private key
const admin = require("../../util/privateKey");

//monetization request made by particular user
exports.createMonetizationRequest = async (req, res) => {
  try {
    if (!settingJSON || !settingJSON.minSubScriber || !settingJSON.minWatchTime) {
      return res.status(200).json({
        status: false,
        message: "minSubScriber and minWatchTime not configured in settings.",
      });
    }

    if (!settingJSON.isMonetization) {
      return res.status(200).json({
        status: false,
        message: "Apologies ! The administrator has disabled the monetization settings.",
      });
    }

    const { userId } = req.query || {};

    if (!userId) {
      return res.status(200).json({ status: false, message: "Invalid details!" });
    }

    const user = await User.findOne(
      { _id: userId, isActive: true },
      {
        isBlock: 1,
        isChannel: 1,
        isMonetization: 1,
        channelId: 1,
        fullName: 1,
        totalWatchTime: 1,
        fcmToken: 1,
      },
    ).lean();

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    if (!user.isChannel) {
      return res.status(200).json({ status: false, message: "channel of that user does not created please firstly create channel of that user!" });
    }

    // if (!user.isMonetization) {
    //   return res.status(200).json({ status: false, message: "Oops ! Monetization is not allowed for your account." });
    // }

    if (user.isMonetization === true) {
      return res.status(200).json({ status: false, message: "Monetization is already enabled for your account." });
    }

    const existRequest = await MonetizationRequest.findOne({ userId }, { status: 1 }).lean();

    if (existRequest?.status === 1) {
      return res.status(200).json({
        status: false,
        message: "Your monetization request is already under review.",
      });
    }

    if (existRequest?.status === 2) {
      return res.status(200).json({
        status: false,
        message: "Your monetization is already approved.",
      });
    }

    const totalSubscribers = await UserWiseSubscription.countDocuments({ channelId: user.channelId });

    const watchTimeInMinutes = Math.floor(Number(user.totalWatchTime || 0));
    const totalWatchTimeInHours = Math.floor(watchTimeInMinutes / 60);
    const minWatchTime = settingJSON?.minWatchTime;
    const minSubScriber = settingJSON?.minSubScriber;

    // If rejected before → update instead of delete + create
    const monetizationRequest = await MonetizationRequest.findOneAndUpdate(
      { userId },
      {
        userId,
        channelId: user.channelId,
        channelName: user.fullName,
        totalSubScribers: totalSubscribers,
        totalWatchTime: watchTimeInMinutes,
        totalWatchTimeInHours,
        minWatchTime: minWatchTime,
        minSubScriber: minSubScriber,
        status: 1,
        requestDate: new Date(),
      },
      { upsert: true, new: true },
    );

    res.status(200).json({
      status: true,
      message: "Monetization request submitted successfully.",
      monetizationRequest,
    });

    if (user.fcmToken && user.fcmToken !== null) {
      const payload = {
        token: user.fcmToken,
        notification: {
          title: "📈 Monetization Request Submitted 📈",
          body: "Your request is under review. We will notify you soon.",
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
          console.log("Error sending message:      ", error);
        });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get monetization for the particular user (after monetiization on)
exports.getMonetizationForUser = async (req, res) => {
  try {
    const { userId } = req.query || {};

    if (!userId) {
      return res.status(200).json({ status: false, message: "Invalid details!" });
    }

    if (!req.query.startDate || !req.query.endDate) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const user = await User.findOne({ _id: userId, isActive: true }, { isBlock: 1, channelId: 1 }).lean();

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    let dateFilterQuery = {};
    if (req?.query?.startDate !== "All" && req?.query?.endDate !== "All") {
      const startDate = new Date(req?.query?.startDate);
      const endDate = new Date(req?.query?.endDate);
      endDate.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    const [channel, totalSubscribers, dateWiseotalSubscribers, totalViewsOfthatChannelVideos, watchHistoryResults] = await Promise.all([
      User.findOne({ channelId: user.channelId }).select("fullName image channelId totalWithdrawableAmount"),
      UserWiseSubscription.countDocuments({ channelId: user.channelId }),
      UserWiseSubscription.countDocuments({ channelId: user.channelId, ...dateFilterQuery }),
      WatchHistory.countDocuments({ videoChannelId: user.channelId, ...dateFilterQuery }),
      WatchHistory.aggregate([
        { $match: { videoChannelId: user.channelId, ...dateFilterQuery } },
        {
          $group: {
            _id: null,
            totalWatchTime: { $sum: "$totalWatchTime" },
          },
        },
      ]),
    ]);

    // const totalWatchTimeMinutes = watchHistoryResults.length > 0 ? watchHistoryResults[0].totalWatchTime : 0;
    // const totalWatchTimeHours = totalWatchTimeMinutes / 60; // Convert total watch time from minutes to hours

    console.log("totalSubscribers: ", totalSubscribers);

    const totalWatchTimeSeconds = watchHistoryResults.length > 0 ? watchHistoryResults[0].totalWatchTime : 0;
    console.log("totalWatchTimeSeconds: ", totalWatchTimeSeconds);

    const totalWatchTimeHours = (totalWatchTimeSeconds / 3600).toFixed(2); // Convert total watch time from seconds to hours
    console.log("totalWatchTimeHours: ", totalWatchTimeHours);

    return res.status(200).json({
      status: true,
      message: "Retrive Monetization of the particular user.",
      monetizationOfChannel: {
        channel,
        totalSubscribers,
        dateWiseotalSubscribers,
        totalViewsOfthatChannelVideos,
        totalWatchTime: totalWatchTimeHours,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get minimum criteria and actual result of particular user (check monetization for user)
exports.getMonetization = async (req, res) => {
  try {
    const { userId } = req.query || {};

    if (!userId) {
      return res.status(200).json({ status: false, message: "Invalid details!" });
    }

    const user = await User.findOne({ _id: userId, isActive: true }, { isBlock: 1, channelId: 1 }).lean();

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    if (!settingJSON || !settingJSON.minSubScriber || !settingJSON.minWatchTime) {
      return res.status(200).json({
        status: false,
        message: "minSubScriber and minWatchTime not configured in settings.",
      });
    }

    const [totalSubscribers, watchHistoryResults] = await Promise.all([
      UserWiseSubscription.countDocuments({ channelId: user.channelId }),
      WatchHistory.aggregate([
        { $match: { videoChannelId: user.channelId } },
        {
          $group: {
            _id: null,
            totalWatchTime: { $sum: "$totalWatchTime" },
          },
        },
      ]),
    ]);

    // const totalWatchTimeMinutes = watchHistoryResults.length > 0 ? watchHistoryResults[0].totalWatchTime : 0;
    // const totalWatchTimeHours = totalWatchTimeMinutes / 60; // Convert total watch time from minutes to hours

    const totalWatchTimeSeconds = watchHistoryResults.length > 0 ? watchHistoryResults[0].totalWatchTime : 0;
    const totalWatchTimeHours = (totalWatchTimeSeconds / 3600).toFixed(2); // Convert total watch time from seconds to hours

    const isMonetization = totalSubscribers >= settingJSON.minSubScriber && totalWatchTimeHours >= settingJSON.minWatchTime;

    const dataOfMonetization = {
      minWatchTime: settingJSON.minWatchTime,
      minSubScriber: settingJSON.minSubScriber,
      totalSubscribers: totalSubscribers,
      totalWatchTime: totalWatchTimeHours,
      isMonetization,
      // isMonetization: user.isMonetization,
    };

    return res.status(200).json({
      status: true,
      message: "Retrive Monetization of the particular user.",
      dataOfMonetization: dataOfMonetization,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
