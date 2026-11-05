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

// India-time calendar for the current week (Mon=1 … Sun=7).
const istFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
function istWeek(now = new Date()) {
  const today = istFormat.format(now); // YYYY-MM-DD
  const [y, m, d] = today.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  const todayDay = ((new Date(base).getUTCDay() + 6) % 7) + 1;
  const iso = (t) => new Date(t).toISOString().slice(0, 10);
  const dates = Array.from({ length: 7 }, (_, i) => iso(base + (i + 1 - todayDay) * 86400000));
  return { today, todayDay, dates, yesterday: iso(base - 86400000) };
}
exports._istWeek = istWeek;

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

    // One calendar for display and for the check-in itself: India time.
    // (This compared an India-time check-in date with the UTC date, so for
    // 5½ hours a day a done check-in showed as open; and only today's check-in
    // counted, so this week's earlier check-ins showed as "Lost".)
    // Check-ins store India wall-clock time; its first 10 characters are the India date.
    const cal = istWeek();
    const collected = Array.isArray(userCheckIn?.rewardsCollected) ? userCheckIn.rewardsCollected : [];
    const checkInDates = new Set(collected.map((r) => String(r.checkInDate || "").slice(0, 10)).filter(Boolean));

    // One entry per weekday (duplicate config rows used to repeat days).
    const byDay = new Map();
    for (const r of dailyRewards) if (!byDay.has(Number(r.day))) byDay.set(Number(r.day), r);
    const checkInStatus = [...byDay.values()].sort((x, y) => Number(x.day) - Number(y.day)).map((rewardDay) => {
      const date = cal.dates[Number(rewardDay.day) - 1] || null;
      const isCheckIn = !!date && checkInDates.has(date);
      return {
        day: rewardDay.day,
        reward: rewardDay.dailyRewardCoin,
        date, // India date of this weekday in the current week (YYYY-MM-DD)
        isToday: Number(rewardDay.day) === cal.todayDay,
        isPast: !!date && date < cal.today,
        isCheckIn,
        checkInDate: isCheckIn ? date : null,
      };
    });

    // A streak broken by a missed day shows as 0 until the next check-in.
    const lastDate = String(userCheckIn?.lastCheckInDate || "").slice(0, 10);
    const streak = lastDate === cal.today || lastDate === cal.yesterday ? Number(userCheckIn?.consecutiveDays) || 0 : 0;

    return res.status(200).json({
      status: true,
      message: "Retrieve DailyRewardCoin Successfully",
      data: checkInStatus,
      today: cal.today,
      todayDay: cal.todayDay,
      checkedInToday: lastDate === cal.today,
      streak,
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

    // India time, whatever the server's clock zone: dates are stored as
    // India wall-clock time ("…Z"), as before, so their first 10 characters
    // are the India date.
    const cal = istWeek();
    const istWallIso = new Date(Date.now() + 5.5 * 3600e3).toISOString();
    const dayOfWeek = cal.todayDay; // Mon=1 … Sun=7

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
    if (String(userCheckIn?.lastCheckInDate || "").slice(0, 10) === cal.today) {
      return res.status(200).json({ status: false, message: "You have already checked in today.", isCheckIn: true });
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
    // Refused (task-security lock, unpaid activation, blocked, too fast):
    // nothing was credited, so don't record a check-in or report success.
    // (This used to answer "Check-in successful" with 0 coins.) Only the
    // daily coin cap still counts the day for the streak, with 0 coins.
    if (!r.ok && r.reason !== "EARNING_CAP") {
      return res.status(200).json({ status: false, code: r.reason, message: r.message || "Check-in isn't available right now.", isCheckIn: false });
    }

    // Streak accounting
    // A missed day restarts the streak.
    const lastDay = String(userCheckIn?.lastCheckInDate || "").slice(0, 10);
    const consecutiveDays = lastDay === cal.yesterday ? (Number(userCheckIn.consecutiveDays) || 0) + 1 : 1;

    // Recent entries only (the week view needs 7 days; this grew forever).
    const rewardsCollected = Array.isArray(userCheckIn?.rewardsCollected) ? userCheckIn.rewardsCollected.slice(-60) : [];
    rewardsCollected.push({
      day: dayOfWeek,
      isCheckIn: true,
      reward: rewardCoin,
      checkInDate: istWallIso,
    });

    const checkInDoc = {
      userId,
      lastCheckInDate: istWallIso,
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
      message: r.ok ? "Check-in successful" : "Checked in. Today's coin cap is already reached, so no coins were added.",
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
