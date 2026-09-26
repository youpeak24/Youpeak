/**
 * YouPeak – device attestation for task rewards.
 *
 * POST client/security/attest
 *   { platform, deviceId, isPhysicalDevice, isRooted, vpnActive, proxyActive, appVersion, integrityToken? }
 *
 * See util/taskSecurity.service.js for what is checked and what it can't prove.
 */
"use strict";

const { attestDevice, clientIp, lockMessage } = require("../../util/taskSecurity.service");

exports.attest = async (req, res) => {
  try {
    const state = await attestDevice(req.appUser, req.body || {}, clientIp(req));
    return res.status(200).json({
      status: true,
      taskingAllowed: !state.locked,
      reasons: state.reasons,
      message: state.locked ? lockMessage(state.reasons) : null,
      attestedAt: state.attestedAt,
    });
  } catch (error) {
    console.error("security attest error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
