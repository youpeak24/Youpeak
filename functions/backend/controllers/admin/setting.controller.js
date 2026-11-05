const db = require("../../util/connection");
const { publishSystemConfigs } = require("../../util/systemConfig.service");

// Razorpay secrets are write-only from the admin panel: the browser gets a
// "…Set" flag instead of the value, and a blank / masked field on save keeps
// the stored secret rather than wiping it.
const WRITE_ONLY_SECRETS = ["razorSecretKey", "razorpayWebhookSecret"];
function hideSecrets(setting) {
  if (!setting) return setting;
  const out = { ...(typeof setting.toObject === "function" ? setting.toObject() : setting) };
  for (const k of WRITE_ONLY_SECRETS) {
    out[`${k}Set`] = Boolean(out[k]);
    delete out[k];
  }
  return out;
}
// The admin form shows the switches the app will actually apply, including
// the defaults for a settings doc saved before the switch existed.
const SWITCH_DEFAULTS = ["razorPaySwitch", "razorpayWebEnabled", "razorpayIosEnabled"];
function withSwitchDefaults(setting) {
  const defaults = require("../../setting");
  const out = { ...setting };
  for (const k of SWITCH_DEFAULTS) if (out[k] === undefined || out[k] === null) out[k] = defaults[k];
  return out;
}
const isMasked = (v) => v == null || String(v).trim() === "" || /^[*•…]+$/.test(String(v).trim());

// Get Settings / index
exports.get = async (req, res) => {
  try {
    let setting = await db.findOne("settings", {});
    if (!setting) {
      setting = await db.create("settings", {
        appName: "YouPeak",
        appLogo: "/logo.png",
        privacyPolicyLink: "https://youpeak-9ff65.web.app",
        termsOfServiceLink: "https://youpeak-9ff65.web.app",
        currencySymbol: "$",
        currencyName: "USD",
        coinValue: 1,
        minWithdrawal: 100,
        isAdmob: true,
        isStripe: true,
      }, "default_settings");
    }
    return res.status(200).json({ status: true, message: "Success", setting: hideSecrets(withSwitchDefaults(setting)) });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.index = exports.get;

// Update Settings
exports.update = async (req, res) => {
  try {
    const patch = { ...(req.body || {}) };
    for (const k of WRITE_ONLY_SECRETS) {
      if (k in patch && isMasked(patch[k])) delete patch[k];
      else if (k in patch) patch[k] = String(patch[k]).trim();
    }
    if ("razorPayId" in patch) patch.razorPayId = String(patch.razorPayId || "").trim();
    let setting = await db.findOne("settings", {});
    let updated;
    if (setting) {
      updated = await db.update("settings", setting._id || setting.id, patch);
    } else {
      updated = await db.create("settings", patch, "default_settings");
    }
    try { await require("../../util/loadSettings").loadSettings(true); } catch (e) { global.settingJSON = updated; }
    await publishSystemConfigs(); // the app's live config (system_configs/*)
    return res.status(200).json({ status: true, message: "Setting updated successfully", setting: hideSecrets(global.settingJSON) });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Handle Switch Settings
exports.handleSwitch = async (req, res) => {
  try {
    const { type } = req.query;
    let setting = await db.findOne("settings", {});
    if (!setting) {
      setting = await db.create("settings", {}, "default_settings");
    }
    const updateData = {};
    if (type) {
      updateData[type] = !setting[type];
    }
    const updated = await db.update("settings", setting._id || setting.id, updateData);
    try { await require("../../util/loadSettings").loadSettings(true); } catch (e) { global.settingJSON = updated; }
    await publishSystemConfigs(); // the app's live config (system_configs/*)
    return res.status(200).json({ status: true, message: "Setting updated successfully", setting: hideSecrets(global.settingJSON) });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Update Watermark Setting
exports.updateWatermarkSetting = async (req, res) => {
  return exports.update(req, res);
};

// Switch Storage Option
exports.switchStorageOption = async (req, res) => {
  return exports.update(req, res);
};

// Write the YP-TC-2026-FINAL economy values into the settings doc.
// Use this once to overwrite any stale template values (e.g. likeVideoRewardCoins: 100).
exports.applyEconomyDefaults = async (req, res) => {
  try {
    const defaults = require("../../setting");
    const KEYS = [
      "coinToInrRate", "coinsPerInr", "maxAdPerDay", "dailyMaxLikes", "dailyMaxComments",
      "dailyMaxDislikes", "dailyMaxCheckIns", "dailyMaxVideoWatches", "dailyMaxEarningCapInCoins",
      "minWatchMinutesForEngagementReward", "engagementWatchRewardCoins", "minCoinForCashOut",
      "commentingRewardCoins", "likeVideoRewardCoins", "dislikeVideoRewardCoins", "adRewardCoins",
      "loginRewardCoins", "referralRewardCoins", "watchingVideoRewardCoins",
      "minWithdrawalRequestedAmount", "minWithdrawalRequestedCoin", "minConvertCoin",
      "revenueSplits", "districtPartnerRates", "districtPartnerUnlockCapINR",
      "referralStage1Coins", "referralStage2Coins", "referralStage1HoldHours",
      "referralStage2HoldHours", "referralStage2WatchMinutes", "referralStage2WindowDays",
      "maxReferralsPerDayPerUser", "referralDeviceDedup", "paidTierReferralPercentage",
      "joiningFeeINR", "paymentGateway",
      "moderationEnabled", "reportAutoHoldThreshold", "reportAutoHoldWindowHours",
      "grievanceSlaHours", "copyrightEngineEnabled", "copyrightAudioMatchThreshold",
      "copyrightFrameHammingThreshold", "copyrightMinFrameMatches",
    ];
    const patch = {};
    for (const k of KEYS) if (defaults[k] !== undefined) patch[k] = defaults[k];

    let setting = await db.findOne("settings", {});
    if (setting) await db.update("settings", setting._id || setting.id, patch);
    else await db.create("settings", patch, "default_settings");

    await require("../../util/loadSettings").loadSettings(true);
    return res.status(200).json({ status: true, message: "Economy defaults applied.", applied: patch, setting: global.settingJSON });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Retrieve Links
exports.retrieveLinks = async (req, res) => {
  try {
    let setting = await db.findOne("settings", {});
    return res.status(200).json({
      status: true,
      message: "Success",
      privacyPolicyLink: setting?.privacyPolicyLink || "",
      termsOfServiceLink: setting?.termsOfServiceLink || "",
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// Rebuild the app's live config docs (system_configs/*) from the current
// settings + Tasker tiers. Runs automatically after saves and on boot; this
// is for a manual refresh (e.g. right after deploying).
exports.publishSystemConfigs = async (req, res) => {
  try {
    const { loadSettings } = require("../../util/loadSettings");
    await loadSettings(true);
    const result = await publishSystemConfigs();
    return res.status(200).json({ status: !result.error, message: result.error || "System configs published.", ...result });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};
