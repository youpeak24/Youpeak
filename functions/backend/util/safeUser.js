/**
 * Credential fields never leave the server (F-19): legacy cryptr/plain
 * `password`, the bcrypt `passwordHash` and the reset grant. Use on every
 * user object a client, admin, partner or creator response serialises.
 */
"use strict";

const CREDENTIAL_FIELDS = ["password", "passwordHash", "passwordResetGrantUntil"];

function stripCredentials(user) {
  if (!user || typeof user !== "object") return user;
  const out = { ...user };
  for (const f of CREDENTIAL_FIELDS) delete out[f];
  return out;
}

// The public face of a channel/profile (P-01): what any visitor may see.
// Whitelisted, so new private fields (e-mail, phone, push tokens, device ids,
// balances, IPs, credentials) never leak by default.
const PUBLIC_CHANNEL_FIELDS = ["_id", "id", "fullName", "nickName", "image", "channelId", "isChannel", "channelType",
  "descriptionOfChannel", "socialMediaLinks", "subscriptionCost", "videoUnlockCost", "isVerified", "country", "date", "createdAt"];

function publicChannel(user) {
  if (!user || typeof user !== "object") return user;
  const out = {};
  for (const f of PUBLIC_CHANNEL_FIELDS) if (user[f] !== undefined) out[f] = user[f];
  if (out._id === undefined && out.id !== undefined) out._id = out.id;
  return out;
}

module.exports = { stripCredentials, CREDENTIAL_FIELDS, publicChannel, PUBLIC_CHANNEL_FIELDS };
