const MembershipTier = require("../../models/membershipTier.model");
const User = require("../../models/user.model");
const db = require("../../util/connection");
const creatorPass = require("../../util/creatorPass");

// Get available CREATOR tiers with subscriber-qualification flags and this
// creator's prices (3-month / annual, intro or standard).
exports.getAvailableCreatorTiers = async (req, res) => {
  try {
    const userId = req.query.userId || (req.body && req.body.userId);
    const user = await User.findById(userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found!" });

    const all = await MembershipTier.find({ tierType: "CREATOR", isActive: true }).sort({ level: 1 });
    const userSubscribers = user.totalSubscribers || 0;
    const passActive = creatorPass.isPassActive(user);
    const currentTierId = passActive ? String(user.activeCreatorTierId) : null;

    const tiers = await Promise.all(all.map(async (tier) => {
      const pricing = await creatorPass.pricingFor(tier, String(user._id || user.id));
      const isCurrentTier = currentTierId === String(tier._id || tier.id);
      return {
        ...tier,
        isEligible: userSubscribers >= (tier.minSubscribersRequired || 0) &&
          (tier.maxSubscribers == null || userSubscribers <= tier.maxSubscribers),
        isCurrentTier,
        passExpiresAt: isCurrentTier ? user.creatorPassExpiresAt || null : null,
        introPricing: pricing.introPricing,
        billingOptions: pricing.options,
        userSubscribers,
      };
    }));

    return res.status(200).json({
      status: true,
      message: "Creator tiers fetched successfully!",
      userSubscribers,
      activePass: passActive
        ? { tierId: currentTierId, expiresAt: user.creatorPassExpiresAt || null, billingPeriod: user.creatorPassBillingPeriod || null }
        : null,
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
    //
    // Timed passes (3-month / annual) re-confirm only while the paid period
    // is still running — otherwise an expired pass could be revived for free.
    // Legacy one-time purchases (no billingPeriod) never expire.
    let passExpiresAt = null;
    if (creatorPass.isTimedTier(tier) || (tier.membershipPrice || 0) > 0) {
      const now = Date.now();
      const paidTxns = await db.find("paymentTransactions", {
        userId: String(user._id || user.id),
        tierId: String(tier._id || tier.id),
        purpose: "tier_upgrade",
        status: "paid",
      });
      const isLifetime = (t) => !t.billingPeriod || t.billingPeriod === "lifetime";
      const live = paidTxns.filter((t) => isLifetime(t) || Date.parse(t.passExpiresAt) > now);
      if (live.length === 0) {
        const pricing = await creatorPass.pricingFor(tier, String(user._id || user.id));
        return res.status(200).json({
          status: false,
          message: `${tier.tierName} is a paid pass. Please complete the payment first.`,
          requiresPayment: true,
          priceInINR: pricing.options[0]?.priceINR ?? tier.membershipPrice,
          billingOptions: pricing.options,
        });
      }
      passExpiresAt = live.some(isLifetime)
        ? null
        : live.map((t) => t.passExpiresAt).sort().pop();
    }

    const updated = await db.update("users", user._id || user.id, {
      activeCreatorTierId: tier._id || tier.id,
      creatorPassExpiresAt: passExpiresAt,
      isMonetization: true,
    });

    // The paid-tier referral bonus (YP-TC §1.5) is paid once per payment, in
    // payment.controller.js fulfilTierUpgrade — not here. Paying it here too
    // credited the referrer again on every call to this endpoint.
    return res.status(200).json({
      status: true,
      message: `Upgraded to ${tier.tierName}! Ad revenue share is now ${tier.creatorRevenueSharePercentage}%.`,
      user: updated,
      tier,
      passExpiresAt,
      referralBonus: null,
    });
  } catch (error) {
    console.error("Error upgrading creator tier:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};
