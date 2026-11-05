/**
 * Public catalog for the web membership portal (the landing page).
 *
 *   GET /client/portal/catalog      (client key only - no sign-in needed)
 *
 * The portal is where store-compliant purchases happen: Starter Passes
 * (TASKER tiers), Creator VIP Passes (CREATOR tiers), the Digital Partner
 * license and ad credit packs. It must show the SAME prices the server will
 * charge, so it reads them from here instead of hard-coding them.
 *
 * Only public display fields are returned - never a secret, and never a
 * per-user value (eligibility is added client-side from the signed-in
 * /creatorTier and /taskerTier endpoints).
 */
"use strict";

const db = require("../../util/connection");
const creatorPass = require("../../util/creatorPass");
const adCreditWallet = require("../../util/adCreditWallet.service");
const payment = require("../../util/payment.service");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const idOf = (t) => String(t._id || t.id);

const publicTier = (t) => ({
  id: idOf(t),
  tierType: t.tierType,
  level: num(t.level, 1),
  name: t.tierName || t.name || "",
  description: t.description || "",
  priceINR: num(t.membershipPrice),
  adCreditsGranted: num(t.adCreditsGranted),
  watchHoursToUpgrade: num(t.watchHoursToUpgrade),
  dailyAdLimit: t.dailyAdLimit != null ? num(t.dailyAdLimit) : null,
  dailyEarningCapInINR: t.dailyEarningCapInINR != null ? num(t.dailyEarningCapInINR) : null,
  minSubscribersRequired: num(t.minSubscribersRequired),
  maxSubscribers: t.maxSubscribers == null ? null : num(t.maxSubscribers),
  creatorRevenueSharePercentage: t.creatorRevenueSharePercentage != null ? num(t.creatorRevenueSharePercentage) : null,
});

exports.catalog = async (req, res) => {
  try {
    const s = global.settingJSON || {};
    const all = await db.find("membershipTiers", { isActive: true });
    const byLevel = (a, b) => num(a.level, 1) - num(b.level, 1);

    const tasker = all.filter((t) => t.tierType === "TASKER").sort(byLevel).map(publicTier);

    const creator = [];
    for (const t of all.filter((x) => x.tierType === "CREATOR").sort(byLevel)) {
      // userId null: the public price table (intro offer while seats remain).
      const pricing = await creatorPass.pricingFor(t, null);
      creator.push({ ...publicTier(t), introPricing: pricing.introPricing, billingOptions: pricing.options });
    }

    let packs = [];
    try {
      packs = adCreditWallet.getPacks().filter((p) => p.isActive && p.priceINR > 0).map((p) => ({
        id: p.id, name: p.name, credits: p.credits, bonusPercent: p.bonusPercent, priceINR: p.priceINR, validityDays: p.validityDays,
      }));
    } catch (e) { /* the pack catalog is optional */ }

    const gateway = payment.describeConfig("razorpay");
    const webEnabled = s.razorpayWebEnabled !== undefined ? s.razorpayWebEnabled : s.razorPaySwitch;

    return res.status(200).json({
      status: true,
      message: "Portal catalog.",
      payments: {
        // True only when an admin has Razorpay on for the web AND keys exist.
        enabled: Boolean(gateway.configured) && webEnabled !== false,
        gateway: "razorpay",
        // Public key id (the Checkout key); the secret never leaves the server.
        keyId: gateway.configured ? payment.gatewayConfig("razorpay").keyId : null,
        mode: gateway.mode || null,
      },
      joiningFeeINR: num(s.joiningFeeINR),
      digitalPartner: { enabled: num(s.digitalPartnerLicenseFeeINR, 25000) > 0, licenseFeeINR: num(s.digitalPartnerLicenseFeeINR, 25000) },
      taskerTiers: tasker,
      creatorTiers: creator,
      adCreditPacks: packs,
    });
  } catch (error) {
    console.error("portal catalog error:", error);
    return res.status(200).json({ status: false, message: "Could not load the catalog." });
  }
};
