const MembershipTier = require("../../models/membershipTier.model");
const User = require("../../models/user.model");
const db = require("../../util/connection");
const referralService = require("../../util/referral.service");

// Get available CREATOR tiers with subscriber-qualification flags
exports.getAvailableCreatorTiers = async (req, res) => {
  try {
    const userId = req.query.userId || (req.body && req.body.userId);
    const user = await User.findById(userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found!" });

    const all = await MembershipTier.find({ tierType: "CREATOR", isActive: true }).sort({ level: 1 });
    const userSubscribers = user.totalSubscribers || 0;
    const currentTierId = user.activeCreatorTierId ? String(user.activeCreatorTierId) : null;

    const tiers = all.map((tier) => ({
      ...tier,
      isEligible: userSubscribers >= (tier.minSubscribersRequired || 0) &&
        (tier.maxSubscribers == null || userSubscribers <= tier.maxSubscribers),
      isCurrentTier: currentTierId === String(tier._id || tier.id),
      userSubscribers,
    }));

    return res.status(200).json({
      status: true,
      message: "Creator tiers fetched successfully!",
      userSubscribers,
      tiers,
    });
  } catch (error) {
    console.error("Error fetching creator tiers:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

// Assign a CREATOR tier once the subscriber (and, later, payment) conditions pass.
exports.upgradeCreatorTier = async (req, res) => {
  try {
    const { userId, tierId } = req.body || {};
    if (!userId || !tierId) {
      return res.status(200).json({ status: false, message: "User ID and Tier ID are required!" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found!" });

    const tier = await MembershipTier.findById(tierId);
    if (!tier || tier.tierType !== "CREATOR" || !tier.isActive) {
      return res.status(200).json({ status: false, message: "Invalid or inactive creator tier!" });
    }

    const userSubscribers = user.totalSubscribers || 0;
    const minRequired = tier.minSubscribersRequired || 0;
    if (userSubscribers < minRequired) {
      return res.status(200).json({
        status: false,
        message: `Qualification failed! You need at least ${minRequired} subscribers for ${tier.tierName}. You have ${userSubscribers}.`,
      });
    }

    // Paid VIP passes require a completed payment for THIS exact tier.
    // `user.paymentStatus` is an unrelated one-time joining-fee flag (and is
    // never client-settable — see userFirestore.controller.js) so it must
    // NOT be used as a stand-in for "paid for this tier". Verify a real,
    // paid paymentTransactions record instead — the normal path is
    // POST /client/payment/createOrder (purpose=tier_upgrade) -> Razorpay ->
    // /client/payment/verify, which calls fulfilTierUpgrade() and already
    // assigns activeCreatorTierId directly; this endpoint just re-confirms
    // that assignment idempotently once a paid transaction exists.
    if ((tier.membershipPrice || 0) > 0) {
      const paidTxn = await db.findOne("paymentTransactions", {
        userId: String(user._id || user.id),
        tierId: String(tier._id || tier.id),
        purpose: "tier_upgrade",
        status: "paid",
      });
      if (!paidTxn) {
        return res.status(200).json({
          status: false,
          message: `${tier.tierName} is a paid pass. Please complete the payment first.`,
          requiresPayment: true,
          priceInINR: tier.membershipPrice,
        });
      }
    }

    const updated = await db.update("users", user._id || user.id, {
      activeCreatorTierId: tier._id || tier.id,
      isMonetization: true,
    });

    // YP-TC §1.5: referrer of a paying member gets a % of the pass price.
    let referralBonus = null;
    if ((tier.membershipPrice || 0) > 0) {
      try {
        const r = await referralService.handlePaidTierReferral({
          buyerId: String(user._id || user.id),
          tierPriceInr: tier.membershipPrice,
          tierName: tier.tierName,
        });
        if (r.ok) referralBonus = { coins: r.bonusCoins, percentage: r.percentage };
      } catch (e) {
        console.error("paid-tier referral bonus error:", e.message);
      }
    }

    return res.status(200).json({
      status: true,
      message: `Upgraded to ${tier.tierName}! Ad revenue share is now ${tier.creatorRevenueSharePercentage}%.`,
      user: updated,
      tier,
      referralBonus,
    });
  } catch (error) {
    console.error("Error upgrading creator tier:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};
