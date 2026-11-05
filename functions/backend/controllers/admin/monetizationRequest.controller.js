const MonetizationRequest = require("../../models/monetizationRequest.model");
const WatchHistory = require("../../models/watchHistory.model");
const Notification = require("../../models/notification.model");

//generateHistoryUniqueId
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

//import model
const User = require("../../models/user.model");

//private key
const admin = require("../../util/privateKey");

//get all monetization requests
exports.getAllMonetizationRequests = async (req, res) => {
  try {
    if (!req.query.startDate || !req.query.endDate || !req.query.type) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const skip = (start - 1) * limit;

    const search = req.query.search?.trim();
    const searchRegex = search ? new RegExp(search, "i") : null;

    let matchQuery = {};

    if (req.query.type !== "All") {
      matchQuery.status = parseInt(req.query.type);
    }

    if (req.query.startDate !== "All" && req.query.endDate !== "All") {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);

      matchQuery.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const result = await MonetizationRequest.aggregate([
      { $match: matchQuery },

      {
        $facet: {
          total: [{ $count: "count" }],
          request: [
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      fullName: 1,
                      nickName: 1,
                      uniqueId: 1,
                      image: 1,
                    },
                  },
                ],
                as: "userId",
              },
            },
            { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },
            ...(search
              ? [
                  {
                    $match: {
                      $or: [{ "userId.fullName": { $regex: searchRegex } }, { "userId.nickName": { $regex: searchRegex } }, { "userId.uniqueId": { $regex: searchRegex } }],
                    },
                  },
                ]
              : []),
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
        },
      },
    ]);

    const data = result[0];

    return res.status(200).json({
      status: true,
      message: "Retrive monetization requests.",
      total: data.total.length > 0 ? data.total[0].count : 0,
      request: data.request || [],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//accept or decline monetization request
exports.handleMonetizationRequest = async (req, res) => {
  try {
    if (!req.query.monetizationRequestId || !req.query.type) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    if (Number(req.query.type) == 3 && !req.query.reason) {
      return res.status(200).json({ status: false, message: "Reason must be requried when request declined by the admin." });
    }

    const monetizationRequest = await MonetizationRequest.findById(req.query.monetizationRequestId);
    if (!monetizationRequest) {
      return res.status(200).json({ status: false, message: "Monetization request does not found!" });
    }

    const user = await User.findOne({ _id: monetizationRequest.userId }).select("_id isBlock channelId fcmToken").lean();
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin!" });
    }

    if (Number(req.query.type) == 2) {
      if (monetizationRequest.status == 2) {
        return res.status(200).json({ status: false, message: "Monetization request already accepted by the admin." });
      }

      if (monetizationRequest.status == 3) {
        return res.status(200).json({ status: false, message: "Monetization request already declined by the admin." });
      }

      res.status(200).json({
        status: true,
        message: "Monetization request accepted by the admin.",
      });

      await Promise.all([
        User.updateOne(
          { _id: user._id },
          {
            $set: {
              isMonetization: true,
              // totalWatchTime: 0,
              // totalCurrentWatchTime: 0,
              totalWithdrawableAmount: 0,
              totalEarningAmount: 0,
            },
          },
        ),
        MonetizationRequest.updateOne({ _id: monetizationRequest._id }, { $set: { status: 2 } }),
        WatchHistory.deleteMany({ videoChannelId: user.channelId }),
      ]);

      if (user.fcmToken && user.fcmToken !== null) {
        const payload = {
          token: user.fcmToken,
          notification: {
            title: "✅ Monetization Request Approved ✅",
            body: "Good news! Your monetization request has been approved. You can now start earning from your content. Thank you for your patience!",
          },
        };

        const adminPromise = await admin;
        adminPromise
          .messaging()
          .send(payload)
          .then(async (response) => {
            console.log("Successfully sent with response: ", response);
          })
          .catch((error) => {
            console.log("Error sending message:      ", error);
          });
      }
    } else if (Number(req.query.type) == 3) {
      if (monetizationRequest.status == 3) {
        return res.status(200).json({ status: false, message: "Monetization request already declined by the admin." });
      }

      if (monetizationRequest.status == 2) {
        return res.status(200).json({ status: false, message: "Monetization request already accepted by the admin." });
      }

      res.status(200).json({
        status: true,
        message: "Monetization request declined by the admin.",
      });

      // Declining changes nothing about the creator's monetization state —
      // they were never monetized and still aren't — so unlike acceptance
      // there is no "fresh start" to reset for. The previous version reset
      // totalWithdrawableAmount/totalEarningAmount to 0 and wiped
      // WatchHistory here too, apparently copy-pasted from the accept
      // branch above: a declined creator would lose real, already-accrued
      // watch-history/earning data for no reason tied to the decline itself.
      await Promise.all([
        User.updateOne({ _id: user._id }, { $set: { isMonetization: false } }),
        MonetizationRequest.updateOne({ _id: monetizationRequest._id }, { $set: { status: 3, reason: req.query.reason?.trim() } }),
      ]);

      if (user.fcmToken && user.fcmToken !== null) {
        const payload = {
          token: user.fcmToken,
          notification: {
            title: "⚠️ Monetization Request Rejected ⚠️",
            body: "Your monetization request has been reviewed and unfortunately declined. Please check the feedback provided and contact support for any further assistance.",
          },
        };

        const adminPromise = await admin;
        adminPromise
          .messaging()
          .send(payload)
          .then(async (response) => {
            console.log("Successfully sent with response: ", response);
          })
          .catch((error) => {
            console.log("Error sending message:      ", error);
          });
      }
    } else {
      return res.status(200).json({ status: false, message: "type must be passed valid." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
