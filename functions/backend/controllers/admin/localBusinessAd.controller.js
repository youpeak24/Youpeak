/**
 * Local Business Ads — admin moderation endpoints.
 *   GET  /admin/localBusinessAd/list                 -> moderation queue
 *   POST /admin/localBusinessAd/approve { adId }      -> goes ACTIVE, commissions credited
 *   POST /admin/localBusinessAd/reject  { adId, moderationNote }
 *
 * Approval is the ONLY place money moves for this feature (see
 * models/localBusinessAd.model.js header) — a partner submitting an ad
 * never earns anything until an admin has actually reviewed the creative.
 * Split (live settings, setting.js districtPartnerRates/digitalPartnerRates,
 * key "localBusinessAds"): Digital Partner 50% direct + District Partner 30%
 * override + platform keeps the remaining 20%.
 */
"use strict";

const db = require("../../util/connection");
const { recordAgencyCommission } = require("../../util/revenueCommission.service");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

exports.list = async (req, res) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    const rows = await db.find("localBusinessAds", q, { sort: { createdAt: -1 }, limit: Number(req.query.limit) || 100 });

    const partnerIds = [...new Set(rows.map((r) => r.submittedByUserId).filter(Boolean))];
    const partners = partnerIds.length ? await Promise.all(partnerIds.map((id) => db.findById("users", id).catch(() => null))) : [];
    const byId = {};
    partners.forEach((u, i) => { if (u) byId[partnerIds[i]] = u; });

    const ads = rows.map((ad) => ({
      ...ad,
      submittedBy: byId[ad.submittedByUserId]
        ? { _id: byId[ad.submittedByUserId]._id || byId[ad.submittedByUserId].id, fullName: byId[ad.submittedByUserId].fullName, email: byId[ad.submittedByUserId].email }
        : null,
    }));

    return res.status(200).json({ status: true, total: ads.length, ads });
  } catch (error) {
    console.error("admin.localBusinessAd.list error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.approve = async (req, res) => {
  try {
    const adId = req.body?.adId;
    if (!adId) return res.status(200).json({ status: false, message: "adId is required." });

    const ad = await db.findById("localBusinessAds", adId);
    if (!ad) return res.status(200).json({ status: false, message: "Ad not found." });
    if (ad.status !== "PENDING_REVIEW") {
      return res.status(200).json({ status: false, message: `This ad is already ${ad.status}.` });
    }

    const partner = await db.findById("users", ad.submittedByUserId);
    if (!partner) return res.status(200).json({ status: false, message: "Submitting partner not found." });

    // Atomic claim — the status check above is only a fast pre-check. Two
    // concurrent approve calls for the same ad (a double-click, or a
    // retried request) can both read status PENDING_REVIEW before either
    // write lands; without this, both would pass and both would credit
    // commission. Only the caller that wins this transaction may proceed.
    const claim = await db.claimOnce("localBusinessAds", ad._id || ad.id, "commissionCredited");
    if (!claim.claimed) {
      return res.status(200).json({ status: false, message: "This ad is already being processed or was already approved." });
    }

    const s = global.settingJSON || {};
    const gross = num(ad.adBudgetInr);
    const digitalPartnerRate = num(s.digitalPartnerRates?.localBusinessAds, 50);
    const districtPartnerRate = num(s.districtPartnerRates?.localBusinessAds, 30);

    // Digital Partner's own direct cut, credited as coins (same INR->coin
    // conversion used everywhere else money becomes wallet balance).
    let digitalPartnerCommissionCoins = 0;
    if (digitalPartnerRate > 0 && gross > 0) {
      const coinRate = num(s.coinToInrRate, 0.01);
      const directAmountInr = Number(((gross * digitalPartnerRate) / 100).toFixed(2));
      digitalPartnerCommissionCoins = Math.round(directAmountInr / coinRate);
      await db.incrementFields("users", partner._id || partner.id, { coin: digitalPartnerCommissionCoins });
    }

    // District Partner override — same helper every other commission type
    // uses, so it resolves the agency by the ad's target region.
    if (districtPartnerRate > 0 && gross > 0) {
      try {
        await recordAgencyCommission({
          sourceType: "LOCAL_BUSINESS_ADS",
          grossAmount: gross,
          ratePercentage: districtPartnerRate,
          state: ad.targetState || partner.state || "",
          district: ad.targetDistrict || partner.district || "",
          userId: ad.submittedByUserId,
        });
      } catch (e) { /* ignore — commission is best-effort, ad approval must still succeed */ }
    }

    const now = new Date();
    const startAt = now.toISOString();
    const endAt = new Date(now.getTime() + num(ad.durationDays, 1) * 86400000).toISOString();

    const updated = await db.update("localBusinessAds", ad._id || ad.id, {
      status: "ACTIVE",
      startAt,
      endAt,
      reviewedBy: req.admin?._id || null,
      reviewedAt: now.toISOString(),
      digitalPartnerCommissionCoins,
    });

    return res.status(200).json({ status: true, message: "Ad approved and now live.", ad: updated });
  } catch (error) {
    console.error("admin.localBusinessAd.approve error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.reject = async (req, res) => {
  try {
    const { adId, moderationNote } = req.body || {};
    if (!adId) return res.status(200).json({ status: false, message: "adId is required." });

    const ad = await db.findById("localBusinessAds", adId);
    if (!ad) return res.status(200).json({ status: false, message: "Ad not found." });
    if (ad.status !== "PENDING_REVIEW") {
      return res.status(200).json({ status: false, message: `This ad is already ${ad.status}.` });
    }

    const updated = await db.update("localBusinessAds", ad._id || ad.id, {
      status: "REJECTED",
      moderationNote: String(moderationNote || "").trim().slice(0, 500),
      reviewedBy: req.admin?._id || null,
      reviewedAt: new Date().toISOString(),
    });

    return res.status(200).json({ status: true, message: "Ad rejected.", ad: updated });
  } catch (error) {
    console.error("admin.localBusinessAd.reject error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};
