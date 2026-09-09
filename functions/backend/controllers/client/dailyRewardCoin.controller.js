const DailyRewardCoin = require("../../models/dailyRewardCoin.model");

//import model
const User = require("../../models/user.model");
const History = require("../../models/history.model");
const CheckIn = require("../../models/checkIn.model");
const Notification = require("../../models/notification.model");

//generateHistoryUniqueId
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");

//reward engine (daily caps + coin crediting)
const rewardEngine = require("../../util/rewardEngine");

//mongoose
const mongoose = require("../../util/mongooseShim");

//private key
const admin = require("../../util/privateKey");

//get daily reward coin
exports.getDailyRewardCoinByUser = async (req, res) => {
  try {
    const { userId } = req.query || {};

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(200).json({ status: false, message: "Invalid userId!" });
    }

    const objectUserId = new mongoose.Types.ObjectId(userId);

    const [user, userCheckIn, dailyRewards] = await Promise.all([
      User.findOne({ _id: objectUserId, isActive: true }).select("_id isBlock coin").lean(),
      CheckIn.findOne({ userId: objectUserId }).select("rewardsCollected consecutiveDays").lean(),
      DailyRewardCoin.find({}).select("day dailyRewardCoin").sort({ day: 1 }).lean(),
    ]);

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found!" });
    }

    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    }

    if (!dailyRewards || dailyRewards.length === 0) {
      return res.status(200).json({ status: false, message: "Daily reward configuration missing. Please contact admin." });
    }

    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD' format
    console.log("Today's Date: ", today);
    console.log("userCheckIn: ", userCheckIn);

    const checkInStatus = dailyRewards.map((rewardDay) => {
      const userReward = userCheckIn?.rewardsCollected?.find((r) => r.day === rewardDay.day);

      let isCheckIn = false;
      let checkInDate = null;

      if (userReward?.checkInDate) {
        const rewardDate = new Date(userReward.checkInDate).toISOString().slice(0, 10);

        if (rewardDate === today) {
          console.log("User has checked in today for day ", rewardDay.day);
          isCheckIn = true;
          checkInDate = rewardDate;
        }
      }

      return {
        day: rewardDay.day,
        reward: rewardDay.dailyRewardCoin,
        isCheckIn,
        checkInDate,
      };
    });

    return res.status(200).json({
      status: true,
      message: "Retrieve DailyRewardCoin Successfully",
      data: checkInStatus,
      streak: userCheckIn?.consecutiveDays || 0,
      totalCoins: user?.coin || 0,
    });
  } catch (error) {
    console.error("❌ getDailyRewardCoinByUser error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//earn coin from daily check In
exports.handleDailyCheckInReward = async (req, res) => {
  try {
    const userId = req.query.userId || (req.body && req.body.userId);
    if (!userId) {
      return res.status(200).json({ status: false, message: "Invalid details!" });
    }

    const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const startOfDay = new Date(istNow); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(istNow); endOfDay.setHours(23, 59, 59, 999);
    const dayOfWeek = ((istNow.getDay() + 6) % 7) + 1; // Mon=1 … Sun=7

    const [user, userCheckIn, rewardForToday] = await Promise.all([
      User.findOne({ _id: userId, isActive: true }),
      CheckIn.findOne({ userId }),
      // Server decides the amount — the client no longer picks it.
      DailyRewardCoin.findOne({ day: dayOfWeek }),
    ]);

    if (!user) return res.status(200).json({ status: false, message: "User not found!" });
    if (user.isBlock) return res.status(200).json({ status: false, message: "You are blocked by the admin." });
    if (!rewardForToday) return res.status(200).json({ status: false, message: "No reward configured for today." });

    // Already checked in today?
    if (userCheckIn?.lastCheckInDate) {
      const last = new Date(userCheckIn.lastCheckInDate);
      if (last >= startOfDay && last <= endOfDay) {
        return res.status(200).json({ status: false, message: "You have already checked in today.", isCheckIn: true });
      }
    }

    const rewardCoin = Math.max(0, Number(rewardForToday.dailyRewardCoin) || 0);

    // Credit via the engine — enforces 1 check-in / day + the daily earning cap.
    const r = await rewardEngine.creditReward({
      userId,
      kind: "checkin",
      historyType: rewardEngine.HISTORY_TYPE.DAILY_CHECKIN,
      countField: "dailyCheckInsToday",
      capField: "maxCheckInsPerDay",
      fixedCoins: rewardCoin,
      meta: { day: dayOfWeek },
    });

    if (!r.ok && r.reason === "COUNT_LIMIT") {
      return res.status(200).json({ status: false, message: "You have already checked in today.", isCheckIn: true });
    }

    // Streak accounting
    let consecutiveDays = 1;
    if (userCheckIn?.lastCheckInDate) {
      const lastDate = new Date(userCheckIn.lastCheckInDate);
      lastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((startOfDay - lastDate) / 86400000);
      if (diffDays === 1) consecutiveDays = (userCheckIn.consecutiveDays || 0) + 1;
    }

    const rewardsCollected = Array.isArray(userCheckIn?.rewardsCollected) ? userCheckIn.rewardsCollected.slice() : [];
    rewardsCollected.push({
      day: dayOfWeek,
      isCheckIn: true,
      reward: rewardCoin,
      checkInDate: istNow.toISOString(),
    });

    const checkInDoc = {
      userId,
      lastCheckInDate: istNow.toISOString(),
      consecutiveDays,
      rewardsCollected,
    };
    if (userCheckIn && (userCheckIn._id || userCheckIn.id)) {
      await CheckIn.findByIdAndUpdate(userCheckIn._id || userCheckIn.id, { $set: checkInDoc });
    } else {
      await CheckIn.create(checkInDoc);
    }

    if (user.fcmToken && r.ok && r.credited > 0) {
      try {
        admin.messaging().send({
          token: user.fcmToken,
          notification: {
            title: "🌟 Daily Check-in Reward Unlocked! 💰",
            body: `You earned ${r.credited} coins today! Come back tomorrow 🎉`,
          },
          data: { type: "DAILY_CHECKIN_REWARD" },
        }).catch(() => {});
      } catch (e) {}
    }

    return res.status(200).json({
      status: true,
      message: "Check-in successful",
      isCheckIn: true,
      coinsEarned: r.ok ? r.credited : 0,
      rewardStatus: r.reason,
      streak: consecutiveDays,
      totalCoins: r.ok ? r.user.coin : (user.coin || 0),
    });
  } catch (error) {
    console.log("ERROR:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
