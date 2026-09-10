const db = require("../../util/connection");

// Get Settings / index
exports.get = async (req, res) => {
  try {
    let setting = await db.findOne("settings", {});
    if (!setting) {
      setting = await db.create("settings", {
        appName: "YouPeak",
        appLogo: "https://youpeak-9ff65.web.app/logo.png",
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
    return res.status(200).json({ status: true, message: "Success", setting });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

exports.index = exports.get;

// Update Settings
exports.update = async (req, res) => {
  try {
    let setting = await db.findOne("settings", {});
    let updated;
    if (setting) {
      updated = await db.update("settings", setting._id || setting.id, req.body);
    } else {
      updated = await db.create("settings", req.body, "default_settings");
    }
    try { await require("../../util/loadSettings").loadSettings(true); } catch (e) { global.settingJSON = updated; }
    return res.status(200).json({ status: true, message: "Setting updated successfully", setting: global.settingJSON });
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
    return res.status(200).json({ status: true, message: "Setting updated successfully", setting: global.settingJSON });
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
