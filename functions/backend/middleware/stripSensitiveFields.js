/**
 * Defense in depth for P-01: no client-API response may carry credentials,
 * push tokens, device ids or IP addresses — for anyone, including the
 * caller's own profile (the app never reads them back). Many aggregate
 * pipelines $lookup the whole `users` document; a missed $project there used
 * to hand those fields to any holder of the public app key.
 *
 * Wraps res.json for the client router and deletes these keys at any depth.
 * Contact details (email, mobileNumber) are only kept on the verified
 * caller's own user object; on anyone else's they are removed too.
 */
"use strict";

const ALWAYS = ["password", "passwordHash", "passwordResetGrantUntil", "fcmToken", "identity", "ipAddress", "deviceId", "paymentGatewayRef"];
const OTHERS_ONLY = ["email", "mobileNumber", "currentLat", "currentLng"];
const MAX_DEPTH = 10;

// A user document: it has a profile name and at least one account-only field.
const looksLikeUser = (o) =>
  ("fullName" in o || "nickName" in o) && ("loginType" in o || "email" in o || "mobileNumber" in o || "uniqueId" in o || "referralCode" in o);

function scrub(node, viewerId, depth = 0, seen = new Set(), keepContact = false) {
  if (!node || typeof node !== "object" || depth > MAX_DEPTH || seen.has(node)) return;
  seen.add(node);
  if (Array.isArray(node)) { for (const v of node) scrub(v, viewerId, depth + 1, seen, keepContact); return; }
  for (const f of ALWAYS) if (f in node) delete node[f];
  if (!keepContact && looksLikeUser(node)) {
    const id = String(node._id || node.id || "");
    if (!viewerId || id !== String(viewerId)) for (const f of OTHERS_ONLY) if (f in node) delete node[f];
  }
  for (const v of Object.values(node)) if (v && typeof v === "object") scrub(v, viewerId, depth + 1, seen, keepContact);
}

// Sign-in replies describe the caller's own account before a session exists.
const OWN_ACCOUNT_PATHS = /\/client\/user\/(login|checkUser|setPassword)\b/;

function stripSensitiveFields(req, res, next) {
  const json = res.json.bind(res);
  res.json = (body) => {
    try {
      const ownAccount = OWN_ACCOUNT_PATHS.test(req.originalUrl || "");
      scrub(body, ownAccount ? "*own*" : req.appUserId, 0, new Set(), ownAccount);
    } catch (e) { console.error("stripSensitiveFields:", e.message); }
    return json(body);
  };
  next();
}

module.exports = stripSensitiveFields;
module.exports.scrub = scrub;
module.exports.ALWAYS = ALWAYS;
