const WithdrawRequest = require("../../models/withDrawRequest.model");

//import model
const User = require("../../models/user.model");
const Notification = require("../../models/notification.model");

//moment
const moment = require("moment");

//private key
const admin = require("../../util/privateKey");

//firestore connection (atomic claim + balance spend)
const db = require("../../util/connection");

exports.index = async (req, res) => {
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

    const result = await WithdrawRequest.aggregate([
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
                      image: 1,
                      uniqueId: 1,
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
      message: "Withdrawal request fetch successfully!",
      total: data.total.length ? data.total[0].count : 0,
      request: data.request || [],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

exports.acceptWithdrawalRequest = async (req, res) => {
  try {
    if (!req.query.requestId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const request = await WithdrawRequest.findById(req.query.requestId);
    if (!request) {
      return res.status(200).json({ status: false, message: "Withdrawal Request does not found!" });
    }

    if (request.status == 2) {
      return res.status(200).json({ status: false, message: "Withdrawal request already accepted by the admin." });
    }

    if (request.status == 3) {
      return res.status(200).json({ status: false, message: "Withdrawal request already declined by the admin." });
    }

    const user = await User.findOne({ _id: request.userId }).select("_id isBlock totalEarningAmount fcmToken");
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    const requestAmount = parseFloat(request.requestAmount || 0);
    if (requestAmount <= 0) {
      console.log("🔴 VALIDATION: insufficient balance");
      return res.status(200).json({ status: false, message: "Invalid withdrawal amount." });
    }

    if (!user.totalEarningAmount || user.totalEarningAmount < requestAmount) {
      return res.status(200).json({ status: false, message: "User does not have enough balance to withdraw this amount." });
    }

    // Atomic claim — two concurrent "accept" clicks on the SAME withdrawal
    // request (a double-click, or a retried request) must only deduct the
    // user's balance once. The status === 2/3 checks above read a snapshot
    // that can already be stale by the time this runs — this is what
    // actually prevents the double accept, not those checks.
    const claim = await db.claimOnce("withDrawRequests", request._id || request.id, "accepted");
    if (!claim.claimed) {
      return res.status(200).json({ status: false, message: "Withdrawal request already accepted by the admin." });
    }

    const paymentDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    await db.update("withDrawRequests", request._id || request.id, { status: 2, paymentDate });

    res.status(200).json({
      status: true,
      message: "Withdrawal request accepted and paid to particular user.",
      request: { ...(request.toObject ? request.toObject() : request), status: 2, paymentDate },
    });

    // Atomic guarded debit — refuses (no write) rather than driving the
    // balance negative if it's somehow short by the time this runs.
    const spend = await db.spendBalance("users", String(user._id), "totalEarningAmount", requestAmount);
    if (!spend.ok) {
      console.error(`acceptWithdrawalRequest: totalEarningAmount debit failed for user ${user._id}, request ${request._id || request.id}: ${spend.reason}`);
    }

    if (user.fcmToken && user.fcmToken !== null) {
      const payload = {
        token: user.fcmToken,
        notification: {
          title: "🔔 Withdrawal Request Accepted! 🔔",
          body: "Good news! Your withdrawal request has been accepted and is being processed. Thank you for using our service!",
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
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

exports.declineWithdrawalRequest = async (req, res) => {
  try {
    if (!req.query.requestId || !req.query.reason) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const request = await WithdrawRequest.findById(req.query.requestId);
    if (!request) {
      return res.status(200).json({ status: false, message: "Withdrawal Request does not found!" });
    }

    if (request.status == 3) {
      return res.status(200).json({ status: false, message: "Withdrawal request already declined by the admin." });
    }

    if (request.status == 2) {
      return res.status(200).json({ status: false, message: "Withdrawal request already accepted by the admin." });
    }

    const user = await User.findOne({ _id: request.userId }).select("_id isBlock fcmToken");
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    res.status(200).json({
      status: true,
      message: "Withdrawal Request has been declined by the admin.",
    });

    await WithdrawRequest.updateOne(
      { _id: request._id },
      {
        $set: {
          status: 3,
          reason: req.query.reason?.trim(),
          paymentDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        },
      },
    );

    if (user.fcmToken && user.fcmToken !== null) {
      const payload = {
        token: user?.fcmToken,
        notification: {
          title: "🔔 Withdrawal Request Declined! 🔔",
          body: "We're sorry, but your withdrawal request has been declined. Please contact support for more information.",
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
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
