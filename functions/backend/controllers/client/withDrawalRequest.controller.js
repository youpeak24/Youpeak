const WithDrawRequest = require("../../models/withDrawRequest.model");

//import model
const User = require("../../models/user.model");
const WalletHistory = require("../../models/walletHistory.model");
const Notification = require("../../models/notification.model");

//private key
const admin = require("../../util/privateKey");

//mongoose
const mongoose = require("../../util/mongooseShim");

//generateHistoryUniqueId
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

//firestore connection (atomic balance spend — see spendBalance())
const db = require("../../util/connection");

//get setting details
exports.fetchSettingDetails = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const user = await User.findOne({ _id: userId, isActive: true }).select("_id coin purchasedCoin totalEarningAmount isBlock").lean();
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    const data = {
      coin: user?.coin ?? 0,
      purchasedCoin: user?.purchasedCoin ?? 0,
      totalRewardCoin: user?.totalRewardCoin ?? 0,
      totalEarningAmount: user?.totalEarningAmount ?? 0,

      minCoinForCashOut: settingJSON?.minCoinForCashOut ?? 0,
      minConvertCoin: settingJSON?.minConvertCoin ?? 0,
      minWithdrawalRequestedAmount: settingJSON?.minWithdrawalRequestedAmount ?? 0,

      referralRewardCoins: settingJSON?.referralRewardCoins ?? 0,
      watchingVideoRewardCoins: settingJSON?.watchingVideoRewardCoins ?? 0,
      commentingRewardCoins: settingJSON?.commentingRewardCoins ?? 0,
      likeVideoRewardCoins: settingJSON?.likeVideoRewardCoins ?? 0,

      currency: settingJSON?.currency,
    };

    return res.status(200).json({
      status: true,
      message: "Success",
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//convert coin into amount at a time wallet history created and coin has been deducted (in default currency)
exports.coinToAmountConverter = async (req, res) => {
  try {
    const { coin, userId } = req.query || {};

    if (!coin || !userId) {
      return res.status(200).json({
        status: false,
        message: "Oops! Invalid details.",
      });
    }

    const coinValue = parseInt(coin, 10);

    if (isNaN(coinValue) || coinValue <= 0) {
      return res.status(200).json({
        status: false,
        message: "Coin must be greater than 0.",
      });
    }

    if (!settingJSON.minCoinForCashOut) {
      return res.status(200).json({
        status: false,
        message: "Setting not found.",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const user = await User.findOne({ _id: userObjectId, isActive: true }, { totalRewardCoin: 1, coin: 1, isBlock: 1 }).lean();
    console.log("user coinToAmountConverter: ", user);

    if (!user) {
      return res.status(200).json({
        status: false,
        message: "User not found.",
      });
    }

    if (user.isBlock) {
      return res.status(200).json({
        status: false,
        message: "You are blocked by admin!",
      });
    }

    if (user.coin < coinValue) {
      return res.status(200).json({
        status: false,
        message: "Insufficient coin balance.",
      });
    }

    // if (user.totalRewardCoin < coinValue) {
    //   return res.status(200).json({
    //     status: false,
    //     message: "Insufficient reward coin balance.",
    //   });
    // }

    // Coin → Amount conversion (2 decimal points)
    const rawAmount = coinValue / settingJSON.minCoinForCashOut;
    const amount = Number(rawAmount.toFixed(2));

    console.log("Coin → Amount conversion (2 decimal points):", amount);

    const uniqueId = await generateHistoryUniqueId();

    // Atomic debit — a plain $inc here reads the balance in JS and writes it
    // back, so two concurrent conversions (double-tap, or a script firing
    // requests in parallel) could both read the same starting balance, both
    // pass the "coin >= coinValue" guard above, and both convert — the
    // second write overwrites the first's with the same computed value, so
    // the user is debited once but paid out (WalletHistory + totalEarningAmount)
    // twice. See firestoreDb.service.js spendBalance().
    const spend = await db.spendBalance("users", userId, "coin", coinValue);
    if (!spend.ok) {
      return res.status(200).json({
        status: false,
        message: "Insufficient coin balance.",
      });
    }

    await Promise.all([
      User.updateOne({ _id: userObjectId }, { $inc: { totalEarningAmount: amount } }),
      WalletHistory.create({
        userId: userObjectId,
        uniqueId,
        coin: coinValue,
        amount,
        type: 2,
        date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      }),
    ]);

    return res.status(200).json({
      status: true,
      message: "Coin successfully converted to amount.",
      data: amount,
    });
  } catch (error) {
    console.error("coinToAmountConverter error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

//Withdraw request made by particular user (earning from monetization OR earning from coin conversion)
exports.createWithdrawRequest = async (req, res) => {
  try {
    const { userId, requestAmount, paymentGateway, paymentDetails } = req.body || {};

    if (!userId || !requestAmount || !paymentGateway || !paymentDetails?.length) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    const amount = Math.floor(Number(requestAmount));
    if (isNaN(amount) || amount <= 0) {
      return res.status(200).json({ status: false, message: "Invalid withdrawal amount." });
    }

    if (!settingJSON) {
      return res.status(500).json({
        status: false,
        message: "Settings not found!",
      });
    }

    const [user, existingRequest, priorAcceptedRequest, uniqueId] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }, "totalEarningAmount isBlock channelId fullName fcmToken").lean(),
      WithDrawRequest.findOne({
        userId,
        status: { $in: [1, 3] }, // pending or declined
      }).lean(),
      WithDrawRequest.findOne({ userId, status: 2 }).lean(), // any withdrawal ever paid out
      generateHistoryUniqueId(),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by admin!" });
    }

    if (amount > user.totalEarningAmount) {
      return res.status(200).json({ status: false, message: "Insufficient funds." });
    }

    // Tiered threshold: a lower "trial" minimum on the very first withdrawal
    // (verifies the user's payout details actually work before they commit
    // to a bigger amount), the normal minimum on every one after that.
    // Trust the admin-configured values directly rather than hard-floor
    // them — an earlier version of this ignored the admin setting entirely.
    const isFirstWithdrawal = !priorAcceptedRequest;
    const firstMinThreshold = Number(settingJSON?.firstWithdrawalMinimumInr) > 0 ? Number(settingJSON.firstWithdrawalMinimumInr) : 100;
    const normalMinThreshold = Number(settingJSON?.minWithdrawalRequestedAmount) > 0 ? Number(settingJSON.minWithdrawalRequestedAmount) : 500;
    const minThreshold = isFirstWithdrawal ? firstMinThreshold : normalMinThreshold;
    if (amount < minThreshold) {
      const coinsPerInr = Number(settingJSON?.coinsPerInr) || 100;
      const trialNote = isFirstWithdrawal ? " (your first withdrawal has a lower trial minimum)" : "";
      return res.status(200).json({ status: false, message: `Minimum withdrawal payout threshold is ₹${minThreshold} (${(minThreshold * coinsPerInr).toLocaleString("en-IN")} Coins)${trialNote}.` });
    }

    if (existingRequest?.status === 1) {
      console.log("❌ If pending request exists → block");
      return res.status(200).json({ status: false, message: "Withdrawal request already sent." });
    }

    if (existingRequest?.status === 3) {
      console.log(" If declined → delete in background (non-blocking)");
      await WithDrawRequest.deleteOne({ _id: existingRequest._id }).catch(console.error);
    }

    const cleanedPaymentDetails = paymentDetails.map((d) => d.replace(/\[|\]/g, ""));

    const newRequest = await WithDrawRequest.create({
      userId,
      channelId: user.channelId,
      channelName: user.fullName,
      requestAmount: amount,
      paymentGateway: paymentGateway.trim(),
      paymentDetails: cleanedPaymentDetails,
      uniqueId,
      requestDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    });

    res.status(200).json({
      status: true,
      message: existingRequest?.status === 3 ? "Previous declined request removed. New request created." : "Withdrawal request sent to admin.",
      withDrawRequest: newRequest,
    });

    if (user.fcmToken && user.fcmToken !== null) {
      const payload = {
        token: user.fcmToken,
        notification: {
          title: "🔔 Withdrawal Request Submitted! 🔔",
          body: "Your withdrawal request has been successfully created. We will process it shortly. Thank you for using our service!",
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
    console.error("Withdraw Error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

//get all withdraw request by particular user
exports.getWithdrawRequests = async (req, res) => {
  try {
    if (!req.query.startDate || !req.query.endDate || !req.query.userId) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    const userId = new mongoose.Types.ObjectId(req.query.userId);

    const page = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let dateFilterQuery = {};

    if (req.query.startDate !== "All" && req.query.endDate !== "All") {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    const [user, result] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }).select("_id isBlock").lean(),
      WithDrawRequest.aggregate([
        {
          $match: {
            userId: userId,
            ...dateFilterQuery,
          },
        },
        {
          $facet: {
            WithDrawRequests: [
              { $sort: { createdAt: -1 } },
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: 1,
                  userId: 1,
                  requestAmount: 1,
                  paymentGateway: 1,
                  paymentDetails: 1,
                  status: 1,
                  reason: 1,
                  uniqueId: 1,
                  requestDate: 1,
                  paymentDate: 1,
                  createdAt: 1,
                },
              },
            ],
            totalCount: [{ $count: "total" }],
          },
        },
      ]),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by admin!" });
    }

    const withdrawData = result[0]?.WithDrawRequests || [];
    const total = result[0]?.totalCount[0]?.total || 0;

    return res.status(200).json({
      status: true,
      message: "Retrive withdraw requests for that user.",
      total: total,
      WithDrawRequests: withdrawData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
