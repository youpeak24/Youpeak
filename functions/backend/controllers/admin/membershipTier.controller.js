const MembershipTier = require("../../models/membershipTier.model");
const db = require("../../util/connection");
const { ALL_TIERS } = require("../../types/tiers");

const TIER_FIELDS = [
  "tierName", "level", "tierType",
  "dailyEarningCapInCoins", "dailyEarningCapInINR", "dailyAdLimit",
  "dailyLikeLimit", "dailyCommentLimit", "coinMultiplier", "adCreditsGranted",
  "membershipPrice", "creatorRevenueSharePercentage", "companyRevenueSharePercentage",
  "minSubscribersRequired", "maxSubscribers", "maxEarningPerVideoInINR",
  "upgradeFeeInINR", "description", "isDefault", "isActive",
];

// Create or update a tier (keyed by tierType + level)
exports.store = async (req, res) => {
  try {
    const body = req.body || {};
    const tierName = body.tierName;
    const level = body.level;
    const tierType = body.tierType === "CREATOR" ? "CREATOR" : "TASKER";

    if (!tierName || level === undefined || level === null) {
      return res.status(200).json({ status: false, message: "Tier name and level are required!" });
    }

    const patch = {};
    for (const f of TIER_FIELDS) {
      if (body[f] !== undefined) patch[f] = body[f];
    }
    patch.tierType = tierType;

    const existing = await MembershipTier.findOne({ tierType, level: Number(level) });

    let tier;
    if (existing) {
      tier = await db.update("membershipTiers", existing._id || existing.id, patch);
    } else {
      tier = await MembershipTier.create({
        dailyEarningCapInCoins: 500,
        dailyEarningCapInINR: 5,
        dailyAdLimit: 20,
        dailyLikeLimit: 5,
        dailyCommentLimit: 2,
        coinMultiplier: 1.0,
        creatorRevenueSharePercentage: 50,
        companyRevenueSharePercentage: 50,
        isActive: true,
        ...patch,
        level: Number(level),
      });
    }

    // Only one default per tierType
    if (patch.isDefault) {
      const others = await MembershipTier.find({ tierType });
      for (const o of others) {
        if ((o._id || o.id) !== (tier._id || tier.id) && o.isDefault) {
          await db.update("membershipTiers", o._id || o.id, { isDefault: false });
        }
      }
    }

    return res.status(200).json({ status: true, message: "Membership tier saved!", tier });
  } catch (error) {
    console.error("Error saving membership tier:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

// List tiers (optionally filter by ?tierType=TASKER|CREATOR)
exports.getTiers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.tierType) filter.tierType = req.query.tierType;
    const tiers = await MembershipTier.find(filter).sort({ tierType: 1, level: 1 });
    return res.status(200).json({ status: true, message: "Tiers fetched successfully!", tiers });
  } catch (error) {
    console.error("Error fetching tiers:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

// Delete a tier
exports.destroy = async (req, res) => {
  try {
    const tierId = req.query.tierId || (req.body && req.body.tierId);
    if (!tierId) return res.status(200).json({ status: false, message: "tierId is required" });
    await MembershipTier.findByIdAndDelete(tierId);
    return res.status(200).json({ status: true, message: "Tier deleted successfully!" });
  } catch (error) {
    console.error("Error deleting tier:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

// Seed / re-seed the default tier ladders
exports.seedDefaults = async (req, res) => {
  try {
    let created = 0;
    for (const t of ALL_TIERS) {
      const exists = await MembershipTier.findById(t._id);
      if (!exists) {
        await MembershipTier.create({ ...t });
        created++;
      }
    }
    const tiers = await MembershipTier.find({}).sort({ tierType: 1, level: 1 });
    return res.status(200).json({ status: true, message: `Seeded ${created} tier(s).`, tiers });
  } catch (error) {
    console.error("Error seeding tiers:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};
