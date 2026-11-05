const FraudAlert = require("../../models/fraudAlert.model");
const User = require("../../models/user.model");

// Fetch fraud alert list
exports.getAlerts = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const count = await FraudAlert.countDocuments();
    const alerts = await FraudAlert.find()
      .populate("userId", "fullName email mobileNumber isBlock isRestricted fraudFlags")
      .skip((start - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({ status: true, message: "Fraud alerts fetched!", total: count, alerts });
  } catch (error) {
    console.error("Error fetching fraud alerts:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

// Update user restriction / lock account
exports.toggleUserRestriction = async (req, res) => {
  try {
    const { userId, isRestricted, isBlock, restrictionReason } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found!" });
    }

    if (isRestricted !== undefined) user.isRestricted = isRestricted;
    if (isBlock !== undefined) user.isBlock = isBlock;
    if (restrictionReason) user.restrictionReason = restrictionReason;

    await user.save();
    return res.status(200).json({ status: true, message: "User account restrictions updated!", user });
  } catch (error) {
    console.error("Error toggling user restriction:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};
