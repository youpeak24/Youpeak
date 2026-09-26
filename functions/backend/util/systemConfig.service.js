/**
 * Publishes the app's live configuration to Firestore `system_configs/*`.
 *
 * The app listens to these documents (read-only, see firestore.rules) so an
 * admin change shows up on every phone within seconds, without an app
 * release. The documents are a PROJECTION: the source of truth stays the
 * `settings` doc (global.settingJSON) and the TASKER `membershipTiers`, and
 * every server path keeps enforcing from those — a stale or tampered client
 * copy can change what the app displays, never what it's paid.
 *
 *   tasker_tiers     per-level caps, action rewards, watch-hour targets
 *   peak_boost       enabled, limits, preset cards, split
 *   partner_program  Milestone 1 / Milestone 2 conditions + rewards
 *   payout_policy    trust-hook vs standard minimum, coin rate, monthly cap
 *   app_policy       web portal URL, heartbeat interval, anti-fraud switches
 *
 * publishSystemConfigs() is called after admin saves (settings, platform
 * config sections, tiers) and once per backend boot. It skips documents whose
 * content hasn't changed, so repeated calls cost a few reads.
 */
"use strict";

const crypto = require("crypto");
const db = require("./connection");
const { getLimits } = require("./rewardEngine");
const referralService = require("./referral.service");
const { cfg: securityCfg } = require("./taskSecurity.service");
const { portalUrl } = require("./accessGate");
const { TASKER_TIERS } = require("../types/tiers");

const COLLECTION = "system_configs";
const SCHEMA_VERSION = 1;

const num = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

function coinsPerInr(s) {
  // The coin -> ₹ converter divides by minCoinForCashOut; keep the published
  // rate identical to what a conversion actually pays.
  return num(s.minCoinForCashOut, num(s.coinsPerInr, 100)) || 100;
}

async function loadTaskerTiers() {
  try {
    const rows = await db.find("membershipTiers", { tierType: "TASKER" });
    const active = (rows || []).filter((t) => t.isActive !== false);
    if (active.length) return active.sort((a, b) => num(a.level, 0) - num(b.level, 0));
  } catch (e) { /* fall back to the code defaults */ }
  return TASKER_TIERS.slice();
}

function getPeakBoost() {
  try {
    // util/platformConfig.js owns the Peak Boost admin section and normalises it.
    return require("./platformConfig").getPeakBoostConfig();
  } catch (e) {
    const s = global.settingJSON || {};
    const pb = s.peakBoost || {};
    const split = (s.revenueSplits || {}).peakBoost || { creator: 80, platform: 20, referrer: 0 };
    return {
      enabled: pb.enabled !== false,
      minCoins: num(pb.minCoins, 100),
      maxCoins: num(pb.maxCoins, 1000000),
      presets: Array.isArray(pb.presets) ? pb.presets : [],
      split,
    };
  }
}

async function buildSystemConfigs() {
  const s = global.settingJSON || {};
  const rate = coinsPerInr(s);
  const tiers = await loadTaskerTiers();

  // Caps come from getLimits() — the function creditReward() enforces with —
  // so the app can't show a number the server doesn't apply. The lowest
  // level is evaluated as a user with no tier assigned, which is what every
  // free tasker is until they upgrade.
  const tierDocs = [];
  let base = null;
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    const tierId = String(t._id || t.id || "");
    const limits = await getLimits(i === 0 ? {} : { membershipTierId: tierId });
    if (i === 0) base = limits;
    const dailyCapCoins = num(limits.dailyEarningCapInCoins, 0);
    tierDocs.push({
      id: tierId,
      rank: i,
      level: num(t.level, i + 1),
      name: t.tierName || `Level ${i}`,
      membershipPriceInr: num(t.membershipPrice, 0),
      watchHoursToUpgrade: num(t.watchHoursToUpgrade, 0),
      dailyCapCoins,
      dailyAdLimit: num(limits.maxAdsPerDay, 20),
      dailyLikeLimit: num(limits.maxLikesPerDay, 0),
      dailyDislikeLimit: num(limits.maxDislikesPerDay, 0),
      dailyCommentLimit: num(limits.maxCommentsPerDay, 0),
      monthlyIncomeCapInr: num(t.monthlyIncomeCapInINR, Math.round((dailyCapCoins / rate) * 30)),
    });
  }
  base = base || (await getLimits({}));

  const referral = referralService.cfg();
  const sec = securityCfg();
  const pb = getPeakBoost();
  const capBoost = s.taskerCapBoost || {};

  return {
    tasker_tiers: {
      coinsPerInr: rate,
      universalDailyAdLimit: num(s.maxAdPerDay, 20),
      capBoostCoins: capBoost.enabled === false ? 0 : num(capBoost.coins, 500),
      rewards: {
        likeCoins: base.reward.like,
        dislikeCoins: base.reward.dislike,
        commentCoins: base.reward.comment,
        adCoins: base.reward.ad,
        engagementWatchMinutes: base.minWatchMinutesForEngagementReward,
        engagementWatchBonusCoins: base.reward.engagementWatch,
      },
      tiers: tierDocs,
    },
    peak_boost: {
      enabled: pb.enabled,
      minCoins: pb.minCoins,
      maxCoins: pb.maxCoins,
      creatorPercent: num(pb.split.creator, 80),
      platformPercent: num(pb.split.platform, 20),
      referrerPercent: num(pb.split.referrer, 0),
      presets: (pb.presets || [])
        .map((p) => ({ name: String(p.name || p.label || ""), coins: num(p.coins, 0) }))
        .filter((p) => p.name && p.coins > 0),
    },
    partner_program: {
      licenseFeeInr: num(s.digitalPartnerLicenseFeeINR, 25000),
      milestone1: { rewardCoins: referral.stage1Coins, holdHours: referral.stage1HoldHours },
      milestone2: {
        rewardCoins: referral.stage2Coins,
        watchMinutes: referral.stage2WatchMinutes,
        windowDays: referral.stage2WindowDays,
        holdHours: referral.stage2HoldHours,
      },
      referralLinkHost: String(s.referralLinkHost || "youpeak.app"),
    },
    payout_policy: {
      coinsPerInr: rate,
      trustHookMinInr: num(s.firstWithdrawalMinimumInr, 100),
      standardMinInr: num(s.minWithdrawalRequestedAmount, 500),
      enforceTierMonthlyCap: s.enforceTierMonthlyWithdrawalCap !== false,
      methods: ["UPI", "BANK"],
    },
    app_policy: {
      membershipPortalUrl: portalUrl(),
      joiningFeeInr: num(s.joiningFeeINR, 0),
      heartbeatIntervalSeconds: num(s.watchHeartbeatIntervalSeconds, 10),
      minSecondsBetweenRewardActions: num(s.minSecondsBetweenRewardActions, 3),
      security: {
        requireDeviceAttestation: sec.requireAttestation,
        attestationTtlHours: sec.ttlMs / 3600e3,
        blockVpn: sec.blockVpn,
        blockEmulator: sec.blockEmulator,
        blockRooted: sec.blockRooted,
        oneAccountPerDevice: sec.oneAccountPerDevice,
        allowWebTasking: sec.allowWeb,
      },
    },
  };
}

function hashOf(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
}

/**
 * Rebuild and write every system_configs doc whose content changed.
 * Never throws — a failed publish must not fail the admin save that caused it.
 * @returns {Promise<{published:string[], skipped:string[], error?:string}>}
 */
async function publishSystemConfigs() {
  const result = { published: [], skipped: [] };
  try {
    const firestore = db.getDb();
    if (!firestore) throw new Error("Firestore is not initialised");
    const docs = await buildSystemConfigs();
    const now = new Date().toISOString();
    for (const [id, content] of Object.entries(docs)) {
      const ref = firestore.collection(COLLECTION).doc(id);
      const contentHash = hashOf(content);
      const current = await db.withTimeout(ref.get());
      if (current.exists && current.data().contentHash === contentHash) {
        result.skipped.push(id);
        continue;
      }
      await db.withTimeout(ref.set({ ...content, schemaVersion: SCHEMA_VERSION, contentHash, publishedAt: now }));
      result.published.push(id);
    }
  } catch (e) {
    console.error("publishSystemConfigs failed:", e.message);
    result.error = e.message;
  }
  return result;
}

/**
 * Where `user` sits on the Tasker ladder.
 * @returns {Promise<{ladder:object[], current:object, rank:number, next:object|null}>}
 */
async function taskerLadderPosition(user) {
  const ladder = await loadTaskerTiers();
  const tierId = user && user.membershipTierId ? String(user.membershipTierId) : "";
  let rank = ladder.findIndex((t) => String(t._id || t.id) === tierId);
  if (rank < 0) rank = 0;
  return { ladder, current: ladder[rank], rank, next: ladder[rank + 1] || null };
}

module.exports = {
  buildSystemConfigs,
  publishSystemConfigs,
  loadTaskerTiers,
  taskerLadderPosition,
  coinsPerInr,
  getPeakBoost,
  COLLECTION,
};
