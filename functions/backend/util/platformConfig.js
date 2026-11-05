/**
 * Platform config — the business parameters the Super Admin edits from the
 * "Platform Config" pages (rewards, partner program, Peak Boost, promotion
 * rate card, payouts, moderation, ad credit packs).
 *
 * Values live in the one `settings` document every server path already reads
 * through global.settingJSON (util/loadSettings.js) — nothing here forks that
 * source of truth. Each section below lists the settings paths it owns plus the
 * field metadata (type, bounds, unit). The same metadata is:
 *   • used here to validate every write, and
 *   • sent to the admin panel, which builds its forms and Zod schemas from it,
 * so the two sides can't drift apart.
 *
 * Tier ladders (Tasker levels, Creator VIP passes) are documents in the
 * `membershipTiers` collection, edited through controllers/admin/membershipTier.
 */
"use strict";

const db = require("./connection");
const defaults = require("../setting");
const { loadSettings } = require("./loadSettings");

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ── Field builders ──────────────────────────────────────────────────────────
const int = (path, label, opts = {}) => ({ path, label, type: "number", integer: true, min: 0, ...opts });
const dec = (path, label, opts = {}) => ({ path, label, type: "number", min: 0, ...opts });
const pct = (path, label, opts = {}) => dec(path, label, { max: 100, unit: "%", ...opts });
const bool = (path, label, opts = {}) => ({ path, label, type: "boolean", ...opts });
const text = (path, label, opts = {}) => ({ path, label, type: "text", minLength: 1, maxLength: 60, ...opts });
const url = (path, label, opts = {}) => ({ path, label, type: "url", maxLength: 300, ...opts });
const select = (path, label, options, opts = {}) => ({ path, label, type: "select", options, ...opts });
const list = (path, label, item, opts = {}) => ({ path, label, type: "list", item, minItems: 1, maxItems: 20, ...opts });

const COINS = { unit: "coins", max: 10000000 };

const SECTIONS = [
  {
    key: "tasker_rewards",
    title: "Tasker Rewards",
    description: "Coin conversion, per-action rewards and the daily engagement bonus. Per-tier caps are in the tier table below.",
    fields: [
      int("coinsPerInr", "Coins per ₹1", { min: 1, max: 10000, help: "100 coins = ₹1 at launch. Every ₹ amount shown in the app is derived from this." }),
      int("likeVideoRewardCoins", "Like", COINS),
      int("dislikeVideoRewardCoins", "Unlike / dislike", COINS),
      int("commentingRewardCoins", "Comment", COINS),
      int("adRewardCoins", "Rewarded ad view", { ...COINS, help: "Per ad, until the tier's daily coin cap is reached." }),
      int("watchingVideoRewardCoins", "Video watched", COINS),
      int("maxAdPerDay", "Ads per day (every tier)", { max: 1000 }),
      int("minWatchMinutesForEngagementReward", "Daily engagement target", { unit: "minutes", min: 1, max: 1440 }),
      int("engagementWatchRewardCoins", "Daily engagement bonus", COINS),
      bool("taskerCapBoost.enabled", "+500 cap boost active", { help: "Tier caps are stored with the boost included (e.g. Free = 500 + 500). Turning this off removes the boost amount from every tier's daily cap." }),
      int("taskerCapBoost.coins", "Boost included in tier caps", COINS),
      int("referralRewardCoins", "Free tier direct referral bonus", COINS),
      pct("paidTierReferralPercentage", "Paid tier direct referral bonus", { help: "Share of a referred user's Starter Pass / VIP Pass price paid to whoever referred them." }),
      pct("taskerEarningsReferralPercentage", "Tasker onboarding commission", { help: "Extra, platform-funded bonus to a Tasker's referrer on every reward that Tasker earns." }),
    ],
    checks: [],
  },
  {
    key: "partner_program",
    title: "Partner Program",
    description: "Digital Partner license, the two-stage referral milestones, and the District Franchise commission chart.",
    fields: [
      int("digitalPartnerLicenseFeeINR", "Digital Partner license fee (incl. GST)", { unit: "₹", max: 1000000, help: "The partner's ad-credit balance is credited with the amount paid." }),
      int("referralStage1Coins", "Milestone 1 reward — verified install", COINS),
      int("referralStage1HoldHours", "Milestone 1 audit hold", { unit: "hours", max: 720 }),
      int("referralStage2Coins", "Milestone 2 reward — engagement", COINS),
      int("referralStage2WatchMinutes", "Milestone 2 watch-time target", { unit: "minutes", min: 1, max: 10000 }),
      int("referralStage2WindowDays", "Milestone 2 window (expires after)", { unit: "days", min: 1, max: 365 }),
      int("referralStage2HoldHours", "Milestone 2 audit hold", { unit: "hours", max: 720 }),
      int("maxReferralsPerDayPerUser", "Max referrals per partner per day", { min: 1, max: 10000 }),
      bool("referralDeviceDedup", "Reject referrals from an already-seen device"),
      pct("districtPartnerRates.adRevenue", "District Franchise — ad revenue override"),
      pct("districtPartnerRates.videoUnlock", "District Franchise — video unlocks"),
      int("districtPartnerUnlockCapINR", "Video unlock commission cap", { unit: "₹", max: 10000000 }),
      pct("districtPartnerRates.taskerOnboarding", "District Franchise — Tasker Starter Pass sales"),
      pct("districtPartnerRates.tierUpgrade", "District Franchise — Creator VIP Pass sales"),
      pct("districtPartnerRates.digitalPartnerLicense", "District Franchise — Digital Partner licenses"),
      pct("districtPartnerRates.localBusinessAds", "District Franchise — local business ads"),
      pct("digitalPartnerRates.localBusinessAds", "Digital Partner — local business ads (direct)"),
    ],
    checks: [
      {
        type: "sumMax",
        paths: ["districtPartnerRates.localBusinessAds", "digitalPartnerRates.localBusinessAds"],
        max: 100,
        message: "District Franchise + Digital Partner shares of local business ads can't exceed 100%.",
      },
    ],
  },
  {
    key: "peak_boost",
    title: "Peak Boost",
    description: "Fan-to-creator coin tipping. Each boost is split between the creator and the platform in one atomic transaction.",
    fields: [
      bool("peakBoost.enabled", "Peak Boost enabled"),
      int("peakBoost.minCoins", "Minimum boost", { ...COINS, min: 1 }),
      int("peakBoost.maxCoins", "Maximum boost", { ...COINS, min: 1 }),
      pct("revenueSplits.peakBoost.creator", "Creator share"),
      pct("revenueSplits.peakBoost.platform", "Platform share"),
      pct("revenueSplits.peakBoost.referrer", "Referrer share"),
      list("peakBoost.presets", "Preset cards", [text("name", "Name"), int("coins", "Amount", { ...COINS, min: 1 })]),
    ],
    checks: [
      { type: "sum", paths: ["revenueSplits.peakBoost.creator", "revenueSplits.peakBoost.platform", "revenueSplits.peakBoost.referrer"], equals: 100, message: "Creator + platform + referrer shares must add up to 100%." },
      { type: "lte", a: "peakBoost.minCoins", b: "peakBoost.maxCoins", message: "Minimum boost can't be more than the maximum." },
      { type: "listWithin", list: "peakBoost.presets", field: "coins", min: "peakBoost.minCoins", max: "peakBoost.maxCoins", message: "Every preset must be between the minimum and maximum boost." },
      { type: "listUnique", list: "peakBoost.presets", field: "name", message: "Preset names must be unique." },
    ],
  },
  {
    key: "promotion_rate_card",
    title: "Video Promotion Rate Card",
    description: "Paid promotion packages creators can buy for a video. Changes apply to new purchases; running campaigns keep the terms they were bought on.",
    fields: [
      list("promotionPlans", "Plans", [
        text("id", "Plan id (stable; don't change once sold)"),
        text("name", "Plan name"),
        text("targeting", "Targeting"),
        text("category", "Category (Daily / Weekly / Monthly)"),
        int("priceINR", "Price", { unit: "₹", min: 1, max: 10000000 }),
        int("impressionsMin", "Impressions from", { max: 1000000000 }),
        int("impressionsMax", "Impressions to", { max: 1000000000 }),
        int("durationDays", "Duration", { unit: "days", min: 1, max: 365 }),
        bool("isActive", "On sale"),
      ]),
    ],
    checks: [
      { type: "listLte", list: "promotionPlans", a: "impressionsMin", b: "impressionsMax", message: "“Impressions from” can't be more than “Impressions to”." },
      { type: "listUnique", list: "promotionPlans", field: "name", message: "Plan names must be unique." },
      { type: "listUnique", list: "promotionPlans", field: "id", message: "Plan ids must be unique." },
    ],
  },
  {
    key: "payout_policy",
    title: "Payout Policy",
    description: "Withdrawal thresholds. The first-ever payout uses the lower trust-hook minimum so users can confirm their payout details work.",
    fields: [
      int("firstWithdrawalMinimumInr", "First payout minimum (trust hook)", { unit: "₹", min: 1, max: 1000000 }),
      int("minWithdrawalRequestedAmount", "Standard payout minimum", { unit: "₹", min: 1, max: 1000000 }),
      int("partnerMinWithdrawalInr", "Digital Partner payout minimum", { unit: "₹", min: 1, max: 1000000, help: "Applies to a Digital Partner's second and later payouts. Their first payout uses the trust-hook minimum like everyone else." }),
      select("partnerPayoutDay", "Digital Partner payout day", WEEKDAYS, { help: "Shown to partners. Payouts themselves are approved from Withdraw Requests." }),
      int("minConvertCoin", "Minimum coins per coin → ₹ conversion", COINS),
      bool("enforceTierMonthlyWithdrawalCap", "Cap each Tasker withdrawal at the tier's monthly income", { help: "Tier estimated monthly income = daily ₹ cap × 30 unless the tier sets its own." }),
    ],
    checks: [
      { type: "lte", a: "firstWithdrawalMinimumInr", b: "minWithdrawalRequestedAmount", message: "The first-payout minimum should not be higher than the standard minimum." },
    ],
  },
  {
    key: "moderation",
    title: "Moderation & Duplicate Detection",
    description: "Thresholds for the user-report auto-hold, the IT Rules 2021 takedown deadline, and duplicate-content fingerprinting.",
    fields: [
      bool("moderationEnabled", "Keyword screening + report auto-hold enabled"),
      int("reportAutoHoldThreshold", "Reports that auto-hold a video", { min: 1, max: 1000 }),
      int("reportAutoHoldWindowHours", "…within", { unit: "hours", min: 1, max: 720 }),
      int("grievanceSlaHours", "Takedown / grievance deadline", { unit: "hours", min: 1, max: 720 }),
      bool("copyrightEngineEnabled", "Duplicate detection enabled", { help: "Needs the fingerprint worker running." }),
      dec("copyrightAudioMatchThreshold", "Audio fingerprint similarity to flag", { min: 0.5, max: 1, step: 0.01, help: "0.85 = flag at more than 85% Chromaprint similarity." }),
      int("copyrightFrameHammingThreshold", "Frame pHash Hamming distance to flag (below)", { max: 64 }),
      int("copyrightMinFrameMatches", "Matching frames needed", { min: 1, max: 100 }),
    ],
    checks: [],
  },
  {
    key: "task_security",
    title: "Anti-Fraud & Task Security",
    description: "Device checks that gate Tasker rewards, and the watch-time heartbeat that meters them.",
    fields: [
      bool("requireDeviceAttestationForTasks", "Require a fresh device check before rewarding tasks"),
      int("taskAttestationTtlHours", "Device check valid for", { unit: "hours", min: 1, max: 720 }),
      bool("blockTasksOnVpn", "Block tasks on VPN / proxy"),
      bool("blockTasksOnEmulator", "Block tasks on emulators"),
      bool("blockTasksOnRootedDevice", "Block tasks on rooted / jailbroken devices"),
      bool("oneTaskerAccountPerDevice", "One Tasker account per device"),
      bool("allowWebTasking", "Allow tasking from the web app", { help: "Web earning checks the signed-in account and the network (no device checks are possible in a browser). Same daily caps as the app; rewarded ads stay app-only." }),
      int("minSecondsBetweenRewardActions", "Minimum gap between reward actions", { unit: "seconds", max: 3600 }),
      int("watchHeartbeatIntervalSeconds", "Watch heartbeat interval", { unit: "seconds", min: 1, max: 300 }),
      int("watchHeartbeatMaxCreditSeconds", "Max watch time credited per heartbeat", { unit: "seconds", min: 1, max: 600 }),
      url("membershipPortalUrl", "Membership & payment portal", { help: "The app sends users here to pay for passes and licenses (store-billing compliance)." }),
    ],
    checks: [
      { type: "lte", a: "watchHeartbeatIntervalSeconds", b: "watchHeartbeatMaxCreditSeconds", message: "Credit per heartbeat must cover at least one heartbeat interval." },
    ],
  },
  {
    key: "ad_credit_packs",
    title: "Ad Credit Packs",
    description: "Top-up packages for ad credits. “Credits” is what the buyer receives in total, bonus included.",
    fields: [
      list("adCreditPacks", "Packs", [
        text("id", "Stable Pack ID"),
        text("name", "Pack name"),
        dec("credits", "Credits (incl. bonus)", { min: 1, max: 100000000, step: 0.01 }),
        dec("baseCredits", "Base credits", { min: 0, max: 100000000, step: 0.01 }),
        dec("bonusCredits", "Bonus credits", { min: 0, max: 100000000, step: 0.01 }),
        pct("bonusPercent", "Bonus label"),
        dec("priceINR", "Price", { unit: "₹", min: 1, max: 100000000, step: 0.01 }),
        int("validityDays", "Validity (days)", { min: 1, max: 3650 }),
        bool("isActive", "On sale"),
      ]),
      int("adCreditValidityDays", "Credit validity", { unit: "days", min: 1, max: 3650 }),
    ],
    checks: [
      { type: "listUnique", list: "adCreditPacks", field: "id", message: "Pack IDs must be unique." },
      { type: "listUnique", list: "adCreditPacks", field: "name", message: "Pack names must be unique." },
    ],
  },
];

const SECTION_BY_KEY = Object.fromEntries(SECTIONS.map((s) => [s.key, s]));

// ── Path helpers ────────────────────────────────────────────────────────────
function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function setPath(obj, path, value) {
  const keys = path.split(".");
  let o = obj;
  for (const k of keys.slice(0, -1)) {
    if (!o[k] || typeof o[k] !== "object" || Array.isArray(o[k])) o[k] = {};
    o = o[k];
  }
  o[keys[keys.length - 1]] = value;
}

function currentSettings() {
  return global.settingJSON || defaults;
}

function readValues(section, settings = currentSettings()) {
  const values = {};
  for (const f of section.fields) {
    const v = getPath(settings, f.path);
    values[f.path] = v === undefined ? getPath(defaults, f.path) : v;
  }
  return values;
}

// ── Validation ──────────────────────────────────────────────────────────────
function validateScalar(field, raw) {
  if (field.type === "boolean") {
    if (typeof raw !== "boolean") return { error: "Must be on or off." };
    return { value: raw };
  }
  if (field.type === "text") {
    if (typeof raw !== "string") return { error: "Must be text." };
    const v = raw.trim();
    if (v.length < field.minLength) return { error: "Required." };
    if (v.length > field.maxLength) return { error: `At most ${field.maxLength} characters.` };
    return { value: v };
  }
  if (field.type === "url") {
    if (typeof raw !== "string") return { error: "Must be a URL." };
    const v = raw.trim();
    if (!/^https:\/\/[^\s/$.?#][^\s]*$/i.test(v)) return { error: "Must be a full https:// URL." };
    if (v.length > field.maxLength) return { error: `At most ${field.maxLength} characters.` };
    return { value: v };
  }
  if (field.type === "select") {
    if (!field.options.includes(raw)) return { error: `Must be one of: ${field.options.join(", ")}.` };
    return { value: raw };
  }
  // number
  const v = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
  if (typeof v !== "number" || !Number.isFinite(v)) return { error: "Must be a number." };
  if (field.integer && !Number.isInteger(v)) return { error: "Must be a whole number." };
  if (field.min != null && v < field.min) return { error: `Must be at least ${field.min}.` };
  if (field.max != null && v > field.max) return { error: `Must be at most ${field.max}.` };
  return { value: v };
}

/**
 * Validate a full set of values for one section.
 * @returns {{ ok: boolean, errors: Object<string,string>, clean: Object }}
 *   errors are keyed by field path (list items: "path.index.field"); a
 *   section-level failure is keyed "_section".
 */
function validateSection(section, input) {
  const errors = {};
  const clean = {};

  for (const f of section.fields) {
    const raw = input ? input[f.path] : undefined;
    if (raw === undefined || raw === null || raw === "") {
      errors[f.path] = "Required.";
      continue;
    }
    if (f.type === "list") {
      if (!Array.isArray(raw)) { errors[f.path] = "Must be a list."; continue; }
      if (raw.length < f.minItems) { errors[f.path] = `Add at least ${f.minItems}.`; continue; }
      if (raw.length > f.maxItems) { errors[f.path] = `At most ${f.maxItems} entries.`; continue; }
      clean[f.path] = raw.map((item, i) => {
        const out = {};
        for (const sub of f.item) {
          const r = validateScalar(sub, item ? item[sub.path] : undefined);
          if (r.error) errors[`${f.path}.${i}.${sub.path}`] = r.error;
          else out[sub.path] = r.value;
        }
        return out;
      });
      continue;
    }
    const r = validateScalar(f, raw);
    if (r.error) errors[f.path] = r.error;
    else clean[f.path] = r.value;
  }

  if (Object.keys(errors).length === 0) {
    for (const c of section.checks || []) {
      const message = checkFails(c, clean);
      if (message) errors[c.list || c.a || (c.paths && c.paths[0]) || "_section"] = message;
    }
  }

  return { ok: Object.keys(errors).length === 0, errors, clean };
}

// Returns the check's message when it fails, else null. Mirrored client-side
// in admin/frontend/src/Component/Pages/PlatformConfig/configSchema.js.
function checkFails(c, v) {
  switch (c.type) {
    case "sum": {
      const total = c.paths.reduce((s, p) => s + Number(v[p] || 0), 0);
      return Math.abs(total - c.equals) > 1e-9 ? c.message : null;
    }
    case "sumMax": {
      const total = c.paths.reduce((s, p) => s + Number(v[p] || 0), 0);
      return total > c.max ? c.message : null;
    }
    case "lte":
      return Number(v[c.a]) > Number(v[c.b]) ? c.message : null;
    case "listLte":
      return (v[c.list] || []).some((it) => Number(it[c.a]) > Number(it[c.b])) ? c.message : null;
    case "listWithin": {
      const lo = Number(v[c.min]);
      const hi = Number(v[c.max]);
      return (v[c.list] || []).some((it) => Number(it[c.field]) < lo || Number(it[c.field]) > hi) ? c.message : null;
    }
    case "listUnique": {
      const seen = new Set();
      for (const it of v[c.list] || []) {
        const k = String(it[c.field] ?? "").trim().toLowerCase();
        if (!k) continue; // blank (e.g. ids on plans saved before ids existed)
        if (seen.has(k)) return c.message;
        seen.add(k);
      }
      return null;
    }
    default:
      return null;
  }
}

// Values that other settings are derived from.
function derivedPatch(sectionKey, clean) {
  if (sectionKey === "tasker_rewards") {
    return { coinToInrRate: 1 / clean.coinsPerInr };
  }
  return {};
}

// ── Read / write ────────────────────────────────────────────────────────────
async function lastChanges(limit = 1) {
  const rows = await db.find("configAuditLogs", {}, { sort: { createdAt: -1 }, limit: 200 }).catch(() => []);
  const bySection = {};
  for (const r of rows) {
    (bySection[r.section] = bySection[r.section] || []).push(r);
  }
  for (const k of Object.keys(bySection)) bySection[k] = bySection[k].slice(0, limit);
  return bySection;
}

function describeSection(section, settings) {
  const { key, title, description, fields, checks } = section;
  return { key, title, description, fields, checks, values: readValues(section, settings) };
}

async function getAll() {
  const settings = await loadSettings(true);
  const changes = await lastChanges(1);
  return {
    updatedAt: settings.updatedAt || null,
    sections: SECTIONS.map((s) => ({ ...describeSection(s, settings), lastChange: (changes[s.key] || [])[0] || null })),
  };
}

/**
 * Validate and save one section. Only that section's paths are written.
 * @returns {{ ok: true, section } | { ok: false, errors }}
 */
async function saveSection(sectionKey, input, admin) {
  const section = SECTION_BY_KEY[sectionKey];
  if (!section) return { ok: false, notFound: true, errors: { _section: "Unknown config section." } };

  const { ok, errors, clean } = validateSection(section, input);
  if (!ok) return { ok: false, errors };

  const before = readValues(section, await loadSettings(true));
  const changes = section.fields
    .filter((f) => JSON.stringify(before[f.path]) !== JSON.stringify(clean[f.path]))
    .map((f) => ({ path: f.path, label: f.label, from: before[f.path] ?? null, to: clean[f.path] }));

  if (changes.length > 0) {
    // Nested maps are merged by db.update (set with merge:true), so writing
    // { revenueSplits: { peakBoost: {...} } } leaves the other splits alone.
    // Lists are replaced whole, which is what an edited list means.
    const patch = {};
    for (const f of section.fields) setPath(patch, f.path, clean[f.path]);
    Object.assign(patch, derivedPatch(sectionKey, clean));

    const existing = await db.findOne("settings", {});
    if (existing) await db.update("settings", existing._id || existing.id, patch);
    else await db.create("settings", patch, "default_settings");

    await db.create("configAuditLogs", {
      section: sectionKey,
      sectionTitle: section.title,
      changes,
      adminId: String(admin?._id || admin?.id || ""),
      adminName: admin?.name || admin?.email || "",
      createdAt: new Date().toISOString(),
    }).catch((e) => console.error("configAuditLogs write failed:", e.message));
  }

  const settings = await loadSettings(true);
  if (changes.length > 0) await publishToClients();
  return { ok: true, changed: changes.length, section: describeSection(section, settings) };
}

// Mirror the new values into the system_configs/* docs the app listens to
// (util/systemConfig.service.js). Loaded lazily and never fatal: the settings
// doc above is the source of truth and is already saved.
async function publishToClients() {
  try {
    const { publishSystemConfigs } = require("./systemConfig.service");
    if (typeof publishSystemConfigs === "function") await publishSystemConfigs();
  } catch (e) {
    console.error("publishSystemConfigs failed:", e.message);
  }
}

async function history(sectionKey, limit = 20) {
  const query = sectionKey ? { section: sectionKey } : {};
  return db.find("configAuditLogs", query, { sort: { createdAt: -1 }, limit });
}

// ── Readers used by the rest of the backend ─────────────────────────────────
function getPromotionPlans({ activeOnly = false } = {}) {
  const plans = currentSettings().promotionPlans || defaults.promotionPlans || [];
  return activeOnly ? plans.filter((p) => p.isActive !== false) : plans;
}

function findPromotionPlan(name) {
  const key = String(name || "").trim().toLowerCase();
  return getPromotionPlans().find((p) => String(p.name).trim().toLowerCase() === key) || null;
}

function getPeakBoostConfig() {
  const s = currentSettings();
  const pb = { ...(defaults.peakBoost || {}), ...(s.peakBoost || {}) };
  const split = { ...defaults.revenueSplits.peakBoost, ...((s.revenueSplits || {}).peakBoost || {}) };
  return {
    enabled: pb.enabled === true,
    minCoins: Number(pb.minCoins) || 100,
    maxCoins: Number(pb.maxCoins) || 1000000,
    presets: Array.isArray(pb.presets) ? pb.presets : [],
    split: { creator: Number(split.creator) || 0, platform: Number(split.platform) || 0, referrer: Number(split.referrer) || 0 },
  };
}

module.exports = {
  SECTIONS,
  WEEKDAYS,
  getAll,
  saveSection,
  history,
  validateSection,
  getPromotionPlans,
  findPromotionPlan,
  getPeakBoostConfig,
};
