/**
 * Channel creation for the signed-in user (client/user/update with
 * isChannel:true — the "Create your channel" button).
 *
 * The channel is the user's own profile document (channelId === userId, which
 * is what every channel query assumes). Creation is one Firestore
 * transaction so that:
 *
 *   - a double tap or a retry after a lost response creates nothing twice: a
 *     user that already has a channel gets that channel back (alreadyExists);
 *   - two people racing for the same name cannot both win: the name is
 *     reserved in channelNames/<hash of the lower-cased name> inside the same
 *     transaction as the profile write (users that picked a name before
 *     reservations existed are found by an equality query);
 *   - the owner is always the authenticated caller (the route is behind
 *     bindAppUser(), the controller passes req.appUserId — never a body id).
 *
 * Numbers are stored as numbers: the app's channel model reads channelType
 * and the costs as int, and a string "1" used to make the whole Channel
 * Details response unreadable.
 */
"use strict";

const crypto = require("crypto");
const db = require("./connection");
const { stripCredentials } = require("./safeUser");

const NAME_MIN = 2;
const NAME_MAX = 30;
const DESCRIPTION_MAX = 500;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

const normalizeName = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ");
const nameKey = (name) => crypto.createHash("sha256").update(normalizeName(name).toLowerCase()).digest("hex").slice(0, 40);

function fail(status, code, message) {
  return { ok: false, status, code, message };
}

/** Validates the channel fields of a request body. */
function validateChannelInput(body = {}) {
  const fullName = normalizeName(body.fullName);
  if (!fullName) return fail(400, "CHANNEL_NAME_REQUIRED", "Enter a channel name.");
  if (fullName.length < NAME_MIN) return fail(400, "CHANNEL_NAME_TOO_SHORT", `The channel name needs at least ${NAME_MIN} characters.`);
  if (fullName.length > NAME_MAX) return fail(400, "CHANNEL_NAME_TOO_LONG", `The channel name can have at most ${NAME_MAX} characters.`);
  if (CONTROL_CHARS.test(fullName)) return fail(400, "CHANNEL_NAME_INVALID", "The channel name contains characters that aren't allowed.");

  const descriptionOfChannel = String(body.descriptionOfChannel ?? "").trim();
  if (!descriptionOfChannel) return fail(400, "CHANNEL_DESCRIPTION_REQUIRED", "Tell viewers what your channel is about.");
  if (descriptionOfChannel.length > DESCRIPTION_MAX) return fail(400, "CHANNEL_DESCRIPTION_TOO_LONG", `The description can have at most ${DESCRIPTION_MAX} characters.`);

  const rawType = body.channelType === undefined || body.channelType === "" ? 1 : Number(body.channelType);
  if (rawType !== 1 && rawType !== 2) return fail(400, "CHANNEL_TYPE_INVALID", "Choose a public or a private channel.");

  return { ok: true, fullName, descriptionOfChannel, channelType: rawType };
}

const NAME_TAKEN = () => fail(409, "CHANNEL_NAME_TAKEN", "The provided channelName is already in use. Please choose a different one.");

const isContention = (e) => e && (e.code === 10 || e.code === 4 || /ABORTED|contention|DEADLINE|GCP_TIMEOUT/i.test(String(e.message || e.code)));

async function withContentionRetry(run, attempts = 4) {
  for (let i = 1; ; i++) {
    try {
      return await run();
    } catch (e) {
      if (!isContention(e) || i >= attempts) {
        if (isContention(e)) return fail(503, "CHANNEL_BUSY", "Your channel is being created. Please try again in a moment.");
        throw e;
      }
      await new Promise((r) => setTimeout(r, 60 * i + Math.floor(Math.random() * 60)));
    }
  }
}

/**
 * Creates the channel for [userId], or returns the one it already has.
 * @returns {Promise<{ok:true, created:boolean, alreadyExists:boolean, user:object} | {ok:false,status:number,code:string,message:string}>}
 */
async function createChannel(userId, body) {
  const input = validateChannelInput(body);
  if (!input.ok) return input;
  if (!userId) return fail(401, "AUTH_REQUIRED", "Please sign in again.");

  const fs = db.getDb();
  const userRef = fs.collection("users").doc(String(userId));
  const nameRef = fs.collection("channelNames").doc(nameKey(input.fullName));

  // Parallel taps contend for the same documents; Firestore aborts the losers.
  // Run the transaction again: it then finds the channel that was just made.
  const outcome = await withContentionRetry(() => db.withTimeout(fs.runTransaction(async (tx) => {
    const [userSnap, nameSnap] = await Promise.all([tx.get(userRef), tx.get(nameRef)]);
    if (!userSnap.exists) return fail(404, "USER_NOT_FOUND", "User not found.");
    const user = userSnap.data();
    if (user.isActive === false) return fail(403, "USER_INACTIVE", "This account is not active.");
    if (user.isBlock) return fail(403, "USER_BLOCKED", "You are blocked by the admin.");

    // Retry, double tap or a second tab: hand back the channel that exists.
    if (user.isChannel === true && user.channelId) {
      return { ok: true, created: false, alreadyExists: true, user: { ...user, _id: userSnap.id } };
    }

    if (nameSnap.exists && String(nameSnap.data().ownerId) !== String(userId)) return NAME_TAKEN();
    // Names taken before reservations existed (or by a plain profile name).
    const sameName = await tx.get(fs.collection("users").where("fullName", "==", input.fullName).limit(3));
    if (sameName.docs.some((d) => d.id !== userSnap.id)) return NAME_TAKEN();

    const now = new Date().toISOString();
    const changes = {
      fullName: input.fullName,
      descriptionOfChannel: input.descriptionOfChannel,
      channelType: input.channelType,
      isChannel: true,
      channelId: String(userId),
      channelCreatedAt: now,
      updatedAt: now,
    };
    // Prices are the creator's choice (Subscription Plan). Creating a channel
    // sets none: a default unlock price would list every free video in the
    // Premium shelf. Existing values stored as strings become numbers.
    for (const field of ["subscriptionCost", "videoUnlockCost"]) {
      const value = Number(user[field]);
      if (user[field] !== undefined && user[field] !== null && user[field] !== "" && Number.isFinite(value) && typeof user[field] !== "number") changes[field] = value;
    }
    tx.set(nameRef, { _id: nameRef.id, ownerId: String(userId), name: input.fullName, createdAt: now });
    tx.update(userRef, changes);
    return { ok: true, created: true, alreadyExists: false, user: { ...user, ...changes, _id: userSnap.id } };
  })));

  if (outcome.ok) outcome.user = stripCredentials(outcome.user);
  return outcome;
}

module.exports = { createChannel, validateChannelInput, normalizeName, nameKey, NAME_MIN, NAME_MAX, DESCRIPTION_MAX };
