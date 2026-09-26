/**
 * Tasker anti-fraud gate — decides whether a user may earn task rewards
 * (ads / likes / comments / watch time) right now.
 *
 * The app attests on launch, on resume and whenever its network changes
 * (POST client/security/attest) with what it can see on the device: VPN or
 * proxy active, emulator, rooted/jailbroken, and its device id. The server
 * adds what the client can't fake as easily: the request IP's datacenter
 * check and a one-tasker-account-per-device binding.
 *
 * Honest limit: every device signal here is self-reported by the app, so a
 * modified client can lie about it. The binding and IP check are server-side,
 * and the stored `integrityToken` field is where a Play Integrity / App Attest
 * verdict should be verified once those are set up in Google Cloud / Apple.
 *
 * Signals are stored raw and turned into lock reasons at check time, so an
 * admin changing a block* setting applies immediately, not at the next attest.
 */
"use strict";

const crypto = require("crypto");
const db = require("./connection");
const { isLikelyVpnOrProxy } = require("./vpnDetection.service");

const REASON = {
  ATTESTATION_REQUIRED: "ATTESTATION_REQUIRED",
  WEB_PLATFORM: "WEB_PLATFORM",
  EMULATOR: "EMULATOR",
  ROOTED: "ROOTED",
  VPN: "VPN",
  PROXY: "PROXY",
  DATACENTER_IP: "DATACENTER_IP",
  NO_DEVICE_ID: "NO_DEVICE_ID",
  DEVICE_LINKED_TO_OTHER_ACCOUNT: "DEVICE_LINKED_TO_OTHER_ACCOUNT",
};

const PLATFORMS = new Set(["android", "ios", "web"]);

function cfg() {
  const s = global.settingJSON || {};
  const ttl = Number(s.taskAttestationTtlHours);
  return {
    requireAttestation: s.requireDeviceAttestationForTasks !== false,
    ttlMs: (Number.isFinite(ttl) && ttl > 0 ? ttl : 24) * 3600e3,
    blockVpn: s.blockTasksOnVpn !== false,
    blockEmulator: s.blockTasksOnEmulator !== false,
    blockRooted: s.blockTasksOnRootedDevice !== false,
    oneAccountPerDevice: s.oneTaskerAccountPerDevice !== false,
    allowWeb: s.allowWebTasking === true,
  };
}

function clientIp(req) {
  return (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip || "";
}

function deviceHash(platform, deviceId) {
  return crypto.createHash("sha256").update(`${platform}:${deviceId}`).digest("hex");
}

/** Lock reasons for a stored attestation, under the current settings. */
function reasonsFor(attestation, c = cfg()) {
  const s = (attestation && attestation.signals) || {};
  const reasons = [];
  if (s.platform === "web" && !c.allowWeb) reasons.push(REASON.WEB_PLATFORM);
  if (c.blockEmulator && s.isPhysicalDevice === false) reasons.push(REASON.EMULATOR);
  if (c.blockRooted && s.isRooted === true) reasons.push(REASON.ROOTED);
  if (c.blockVpn && s.vpnActive === true) reasons.push(REASON.VPN);
  if (c.blockVpn && s.proxyActive === true) reasons.push(REASON.PROXY);
  if (c.blockVpn && s.datacenterIp === true) reasons.push(REASON.DATACENTER_IP);
  if (s.platform !== "web" && !s.deviceId) reasons.push(REASON.NO_DEVICE_ID);
  if (c.oneAccountPerDevice && attestation && attestation.deviceConflict) {
    reasons.push(REASON.DEVICE_LINKED_TO_OTHER_ACCOUNT);
  }
  return reasons;
}

/**
 * Whether this user's task rewards are locked right now.
 * @returns {{locked:boolean, reasons:string[], attestedAt:string|null}}
 */
function taskLockState(user) {
  const c = cfg();
  const att = user && user.taskAttestation;
  if (!c.requireAttestation) return { locked: false, reasons: [], attestedAt: (att && att.at) || null };

  const at = att && att.at ? new Date(att.at).getTime() : 0;
  if (!at || Date.now() - at > c.ttlMs) {
    return { locked: true, reasons: [REASON.ATTESTATION_REQUIRED], attestedAt: (att && att.at) || null };
  }
  const reasons = reasonsFor(att, c);
  return { locked: reasons.length > 0, reasons, attestedAt: att.at };
}

const MESSAGES = {
  [REASON.ATTESTATION_REQUIRED]: "Open the YouPeak app to verify this device before earning.",
  [REASON.WEB_PLATFORM]: "Tasks and rewards are available in the YouPeak mobile app only.",
  [REASON.EMULATOR]: "Tasks can't run on an emulator. Use a real phone.",
  [REASON.ROOTED]: "Tasks can't run on a rooted or jailbroken device.",
  [REASON.VPN]: "Turn off your VPN to continue earning.",
  [REASON.PROXY]: "Turn off your proxy to continue earning.",
  [REASON.DATACENTER_IP]: "Your network looks like a VPN or proxy. Switch to mobile data or home Wi-Fi.",
  [REASON.NO_DEVICE_ID]: "This device couldn't be verified. Update the app and try again.",
  [REASON.DEVICE_LINKED_TO_OTHER_ACCOUNT]: "This phone is already linked to another YouPeak tasker account.",
};

function lockMessage(reasons) {
  const first = (reasons || [])[0];
  return MESSAGES[first] || "Tasks are paused on this device.";
}

/**
 * Record a device attestation for `user` and return the resulting lock state.
 * `body` is the app's self-reported signals; `ip` is the request IP.
 */
async function attestDevice(user, body, ip) {
  const userId = String(user._id || user.id);
  const platform = PLATFORMS.has(String(body.platform)) ? String(body.platform) : "android";
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim().slice(0, 200) : "";

  const signals = {
    platform,
    deviceId: deviceId ? "present" : "",
    isPhysicalDevice: body.isPhysicalDevice !== false,
    isRooted: body.isRooted === true,
    vpnActive: body.vpnActive === true,
    proxyActive: body.proxyActive === true,
    datacenterIp: !!ip && isLikelyVpnOrProxy(ip),
    appVersion: typeof body.appVersion === "string" ? body.appVersion.slice(0, 32) : "",
  };

  // One tasker account per physical device: the first account to attest
  // from a device owns it; any other account attesting from it is locked out
  // of task rewards (it can still watch, subscribe, boost, ...). An admin can
  // release a device by deleting its deviceBindings doc.
  let hash = null;
  let deviceConflict = false;
  if (deviceId && platform !== "web") {
    hash = deviceHash(platform, deviceId);
    const claim = await db.createOnce("deviceBindings", hash, { userId, platform, firstIp: ip || "" });
    if (!claim.created) {
      const binding = await db.findById("deviceBindings", hash);
      deviceConflict = !!binding && String(binding.userId) !== userId;
    }
  }

  const attestation = {
    at: new Date().toISOString(),
    signals,
    deviceHash: hash,
    deviceConflict,
    ip: ip || "",
    integrityToken: typeof body.integrityToken === "string" ? "received" : "",
  };
  const previous = reasonsFor(user.taskAttestation);
  await db.update("users", userId, { taskAttestation: attestation });

  const state = taskLockState({ ...user, taskAttestation: attestation });

  // Leave a trail for the admin fraud page when a device newly trips a hard
  // integrity rule. Deliberately NOT evaluateFraudRisk(): that permanently
  // blocks the account on VPN use, while this only pauses task rewards until
  // the device is clean again.
  const newReasons = state.reasons.filter((r) => !previous.includes(r));
  const serious = newReasons.filter((r) =>
    [REASON.EMULATOR, REASON.ROOTED, REASON.DEVICE_LINKED_TO_OTHER_ACCOUNT, REASON.DATACENTER_IP].includes(r));
  if (serious.length) {
    try {
      await db.create("fraudAlerts", {
        userId,
        riskType: "DEVICE_INTEGRITY",
        riskScore: serious.includes(REASON.DEVICE_LINKED_TO_OTHER_ACCOUNT) ? 80 : 70,
        details: `Task rewards locked: ${serious.join(", ")}`,
        ipAddress: ip || "",
        actionTaken: "TASKS_LOCKED",
        createdAt: new Date().toISOString(),
      });
    } catch (e) { /* the lock itself already applies */ }
  }
  return state;
}

module.exports = { REASON, cfg, clientIp, deviceHash, reasonsFor, taskLockState, attestDevice, lockMessage };
