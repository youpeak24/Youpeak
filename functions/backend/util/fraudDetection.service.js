"use strict";
const db = require("./connection");

const evaluateFraudRisk = async ({ userId, riskType, details = "", ipAddress = "" }) => {
  try {
    const setting = (global.settingJSON) || (await db.findOne("settings", {})) || {};
    if (setting && setting.fraudDetectionEnabled === false) return null;

    const user = await db.findById("users", userId);
    if (!user) return null;

    let riskScore = 50;
    if (riskType === "MULTIPLE_ACCOUNTS_SAME_IP") riskScore = 75;
    if (riskType === "ABNORMAL_AD_CLICK_SPEED") riskScore = 85;
    if (riskType === "SUSPICIOUS_REFERRAL_FARMING") riskScore = 80;
    if (riskType === "EXCEEDED_DAILY_LIMIT_VELOCITY") riskScore = 60;
    if (riskType === "VPN_PROXY_USAGE") riskScore = 95;

    let actionTaken = "FLAGGED";
    const userUpdates = {};

    // VPN/proxy usage is an unconditional hard rule (YP-TC §4.1/4.2: "will be
    // immediately and permanently locked/frozen") — it auto-blocks regardless
    // of the general autoBlockHighRiskFraud toggle, unlike the other,
    // softer/reviewable risk types below.
    if (riskType === "VPN_PROXY_USAGE") {
      actionTaken = "AUTO_BLOCKED";
      userUpdates.isBlock = true;
      userUpdates.isRestricted = true;
      userUpdates.restrictionReason = "Auto-blocked: VPN/proxy/masked-network usage is strictly prohibited (YP-TC §4.1).";
    } else if (setting && setting.autoBlockHighRiskFraud && riskScore >= 80) {
      actionTaken = "AUTO_BLOCKED";
      userUpdates.isBlock = true;
      userUpdates.isRestricted = true;
      userUpdates.restrictionReason = `Auto-blocked due to high risk fraud score: ${riskType}`;
    } else {
      const flags = (user.fraudFlags || 0) + 1;
      userUpdates.fraudFlags = flags;
      if (flags >= 3) {
        userUpdates.isRestricted = true;
        userUpdates.restrictionReason = "Multiple fraud alerts triggered";
      }
    }

    await db.update("users", userId, userUpdates);

    const fraudRecord = await db.create("fraudAlerts", {
      userId: user._id || user.id,
      riskType,
      riskScore,
      details,
      ipAddress: ipAddress || user.ipAddress || "",
      actionTaken,
      createdAt: new Date().toISOString(),
    });

    return fraudRecord;
  } catch (error) {
    console.error("Error evaluating fraud risk:", error);
    return null;
  }
};

module.exports = { evaluateFraudRisk };
