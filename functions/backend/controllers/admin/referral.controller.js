const ReferralHistory = require("../../models/referralHistory.model");
const User = require("../../models/user.model");

// Fetch referral history logs
exports.getReferralLogs = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const count = await ReferralHistory.countDocuments();
    const logs = await ReferralHistory.find()
      .populate("referrerId", "fullName email referralCode referralCount")
      .populate("referredUserId", "fullName email createdAt")
      .skip((start - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({ status: true, message: "Referral logs fetched!", total: count, logs });
  } catch (error) {
    console.error("Error fetching referral logs:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

// Fetch top referrers leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const topReferrers = await User.find({ referralCount: { $gt: 0 } })
      .select("fullName email referralCode referralCount referralRewardCoin image")
      .sort({ referralCount: -1 })
      .limit(20);

    return res.status(200).json({ status: true, message: "Referral leaderboard fetched!", topReferrers });
  } catch (error) {
    console.error("Error fetching referral leaderboard:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};
