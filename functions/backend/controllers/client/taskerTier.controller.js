const MembershipTier = require("../../models/membershipTier.model");
const User = require("../../models/user.model");

// Get available TASKER tiers ("Starter Pass" ladder — daily engagement limits
// and earning caps). Unlike CREATOR tiers, these are not subscriber-gated —
// any Tasker may buy any paid tier directly (that's the point of a paid
// "instant skip" pass alongside the free, watch-hour-based progression).
exports.getAvailableTaskerTiers = async (req, res) => {
  try {
    const userId = req.query.userId || (req.body && req.body.userId);
    const user = await User.findById(userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found!" });

    const all = await MembershipTier.find({ tierType: "TASKER", isActive: true }).sort({ level: 1 });
    const currentTierId = user.membershipTierId ? String(user.membershipTierId) : null;

    const tiers = all.map((tier) => ({
      ...tier,
      isCurrentTier: currentTierId === String(tier._id || tier.id),
    }));

    return res.status(200).json({
      status: true,
      message: "Tasker tiers fetched successfully!",
      totalWatchTime: user.totalWatchTime || 0,
      tiers,
    });
  } catch (error) {
    console.error("Error fetching tasker tiers:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};
