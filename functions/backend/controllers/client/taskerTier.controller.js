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
    // No stored tier (or a non-Tasker one) means the Free Tasker level (1).
    const currentTierId = user.membershipTierId ? String(user.membershipTierId) : null;
    const stored = currentTierId ? all.find((t) => String(t._id || t.id) === currentTierId) : null;
    const currentLevel = stored ? Number(stored.level) || 1 : 1;
    const watchMinutes = Number(user.totalWatchTime) || 0;

    const tiers = all.map((tier) => {
      const level = Number(tier.level) || 1;
      const hours = Number(tier.watchHoursToUpgrade) || 0;
      return {
        ...tier,
        isCurrentTier: level === currentLevel,
        isIncluded: level < currentLevel, // below the current level: nothing to buy
        // A paid pass above the current level can be bought (payment.controller
        // refuses the same or a lower level server-side, too).
        canPurchase: level > currentLevel && Number(tier.membershipPrice) > 0,
        // Free path: cumulative lifetime watch hours (either path qualifies).
        watchHoursRemaining: level > currentLevel && hours > 0 ? Math.max(0, Number((hours - watchMinutes / 60).toFixed(1))) : 0,
      };
    });

    return res.status(200).json({
      status: true,
      message: "Tasker tiers fetched successfully!",
      totalWatchTime: watchMinutes,
      currentLevel,
      tiers,
    });
  } catch (error) {
    console.error("Error fetching tasker tiers:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};
