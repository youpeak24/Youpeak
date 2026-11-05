/**
 * YouPeak – Pure Firestore User Controller
 * Handles: store (login/signup), checkUser, updateProfile, getProfile
 * All MongoDB/Mongoose code removed – 100% Firebase Cloud Firestore
 */

"use strict";

const db = require("../../util/connection");
const Cryptr = require("cryptr");
const bcrypt = require("bcryptjs");
// Legacy key — used only for reading pre-migration passwords.
const cryptr = new Cryptr(process.env.USER_PW_SECRET || "myTotallySecretKey");
const BCRYPT_ROUNDS = 10;
const { generateUniqueId } = require("../../util/generateUniqueId");
const { generateReferralCode } = require("../../util/generateReferralCode");
const admin = require("../../util/privateKey");
const firebaseAdmin = require("../../util/firebaseAdmin");
const { accessGateFor } = require("../../util/accessGate");

const LOGIN_TYPE_PHONE = 5;
// Google (2), Apple (3), legacy social (1) and phone (5) sign in with Firebase
// on the device; the server trusts only what the verified ID token says.
const FIREBASE_LOGIN_TYPES = new Set([1, 2, 3, LOGIN_TYPE_PHONE]);

async function verifyFirebaseLogin(idToken) {
  if (typeof idToken !== "string" || !idToken) return null;
  try {
    return await firebaseAdmin.auth().verifyIdToken(idToken);
  } catch (e) {
    return null;
  }
}

// A Firebase custom token whose uid is the YouPeak user id. The app signs in
// with it, and its ID tokens then authenticate the per-user routes
// (middleware/appUser.middleware.js). Minted only after this login has been
// verified (Firebase ID token, or the email+password check).
async function mintAppSession(userId) {
  try {
    return await firebaseAdmin.auth().createCustomToken(String(userId));
  } catch (e) {
    console.error("createCustomToken failed:", e.message);
    return null;
  }
}

// ─── helper: generate a referral code that is unique in Firestore ─────────
async function uniqueReferralCode() {
  let code;
  let safe = false;
  while (!safe) {
    code = generateReferralCode();
    const existing = await db.findOne("users", { referralCode: code });
    if (!existing) safe = true;
  }
  return code;
}

// ─── helper: build safe user object (no Mongoose .save(), pure POJO) ─────
function buildUserData(existing, body) {
  return {
    // keep existing values as fallback
    image: body.image || existing.image || "",
    fullName: body.fullName ? body.fullName.trim() : existing.fullName || "",
    nickName: body.nickName || existing.nickName || "",
    email: body.email ? body.email.trim() : existing.email || "",
    gender: body.gender || existing.gender || "",
    age: body.age || existing.age || "",
    mobileNumber: body.mobileNumber || existing.mobileNumber || "",
    country: body.country || existing.country || "",
    ipAddress: body.ipAddress || existing.ipAddress || "",
    descriptionOfChannel: body.descriptionOfChannel || existing.descriptionOfChannel || "",
    loginType: body.loginType !== undefined ? body.loginType : existing.loginType,
    // F-19: no password field here. buildUserData is written on every login,
    // so a value here would overwrite a legacy credential before it has been
    // migrated; callers set passwordHash themselves (signup / reset / migration).
    identity: body.identity || existing.identity || "",
    fcmToken: body.fcmToken || existing.fcmToken || "",
    socialMediaLinks: {
      instagramLink: body.instagramLink || existing.socialMediaLinks?.instagramLink || "",
      facebookLink: body.facebookLink || existing.socialMediaLinks?.facebookLink || "",
      twitterLink: body.twitterLink || existing.socialMediaLinks?.twitterLink || "",
      websiteLink: body.websiteLink || existing.socialMediaLinks?.websiteLink || "",
    },
    // CHANNEL_TYPE.PUBLIC = 1 (free) is the schema default — every prior
    // version of this fell back to the string "0", which isn't a valid
    // CHANNEL_TYPE value and made subscribedUnSubscibed() treat every new
    // channel as a paid channel with no price set (permanently unsubscribable).
    channelType: Number(body.channelType) || Number(existing.channelType) || 1,
    isActive: existing.isActive !== undefined ? existing.isActive : true,
    isBlock: existing.isBlock || false,
    // SECURITY: never trust `body.paymentStatus` — this flag gates paid
    // creator-tier upgrades (see creatorTier.controller.js). It must only
    // ever be set server-side by a verified payment (fulfilJoiningFee) or
    // an admin toggle, never by client-supplied signup/update input.
    paymentStatus: existing.paymentStatus || false,
    payment_status: existing.paymentStatus || false,
    paymentVerifiedAt: existing.paymentVerifiedAt || null,
    paymentGatewayRef: existing.paymentGatewayRef || null,
    coin: existing.coin || 0,
    loginRewardCoin: existing.loginRewardCoin || 0,
    totalRewardCoin: existing.totalRewardCoin || 0,
    referralCode: existing.referralCode || "",
    uniqueId: existing.uniqueId || null,
    isNewUser: existing.isNewUser !== undefined ? existing.isNewUser : true,
    plan: existing.plan || { planStartDate: null, premiumPlanId: null },
    date: existing.date || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Strip credential fields from any user object before sending to a client ──
// F-19 (Phase 2): passwords (plaintext, cryptr-encrypted or bcrypt) must never
// leave the server through ordinary profile / login / admin serialisation.
function safeUser(u) {
  if (!u || typeof u !== "object") return u;
  const out = { ...u };
  delete out.password;
  delete out.passwordHash;
  delete out.passwordResetGrantUntil;
  return out;
}

// ─── Verify a plain-text password against a stored credential ─────────────────
// Supports both bcrypt hashes (new) and cryptr ciphertext (legacy).
// Returns { ok, rehashWith } where rehashWith is set when a legacy password
// was accepted and should be migrated to bcrypt.
async function verifyPassword(plain, stored) {
  if (!stored) return { ok: false };
  // bcrypt hashes start with "$2b$" or "$2a$"
  if (stored.startsWith("$2")) {
    const ok = await bcrypt.compare(plain, stored);
    return { ok };
  }
  // Legacy cryptr ciphertext
  try {
    const decrypted = cryptr.decrypt(stored);
    if (decrypted === plain) {
      const rehashWith = await bcrypt.hash(plain, BCRYPT_ROUNDS);
      return { ok: true, rehashWith };
    }
  } catch { /* malformed ciphertext */ }
  return { ok: false };
}

// ─── Create an email+password (loginType 4) app account server-side ──────────
// F-19 (Phase 2): uses bcrypt instead of cryptr for new passwords.
exports.createEmailPasswordAccount = async ({ fullName, email, password, mobileNumber = "", state = "", district = "" }) => {
  const bonusCoins = global.settingJSON?.loginRewardCoins ? global.settingJSON.loginRewardCoins : 5000;
  const referralCode = await uniqueReferralCode();
  const uniqueId = await generateUniqueId();

  const newUserData = buildUserData(
    {
      coin: bonusCoins,
      loginRewardCoin: bonusCoins,
      totalRewardCoin: bonusCoins,
      referralCode,
      date: new Date().toISOString(),
      isNewUser: true,
      isActive: true,
      isBlock: false,
    },
    { fullName, email, password, mobileNumber, loginType: 4 }
  );
  newUserData.uniqueId = uniqueId;
  newUserData.coin = bonusCoins;
  newUserData.loginRewardCoin = bonusCoins;
  newUserData.totalRewardCoin = bonusCoins;
  newUserData.referralCode = referralCode;
  newUserData.state = state;
  newUserData.district = district;
  newUserData.createdAt = new Date().toISOString();
  // F-19: store bcrypt hash, not cryptr ciphertext or plaintext
  if (password) newUserData.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  delete newUserData.password;

  const createdUser = await db.create("users", newUserData);
  try {
    await db.create("histories", {
      userId: createdUser._id || createdUser.id,
      coin: bonusCoins,
      uniqueId: `hist_${Date.now()}`,
      type: 3,
      date: new Date().toISOString(),
    });
  } catch (e) {
    console.log("History create note:", e.message);
  }
  return createdUser;
};

// bcrypt hash for an app (loginType 4) password — the only format new
// passwords are written in (F-19). Callers store it as users.passwordHash and
// clear users.password.
exports.hashPassword = (plain) => bcrypt.hash(String(plain), BCRYPT_ROUNDS);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/login   →  login OR signup
// ─────────────────────────────────────────────────────────────────────────────
exports.store = async (req, res) => {
  try {
    const { loginType, identity, fcmToken, password } = req.body;
    let { email } = req.body;

    if (!identity || loginType === undefined || !fcmToken) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    // SECURITY: a social/phone login used to be accepted on the email in the
    // body alone, so anyone holding the app key could sign in as any Google
    // user by knowing their address. The identity now comes only from a
    // verified Firebase ID token.
    let body = req.body;
    let verifiedPhone = null;
    if (FIREBASE_LOGIN_TYPES.has(loginType)) {
      const decoded = await verifyFirebaseLogin(req.body.idToken);
      if (!decoded) {
        return res.status(200).json({
          status: false,
          code: "AUTH_UNVERIFIED",
          message: "We couldn't verify your sign-in. Please update the app and try again.",
        });
      }
      if (loginType === LOGIN_TYPE_PHONE) {
        verifiedPhone = decoded.phone_number || null;
        if (!verifiedPhone) {
          return res.status(200).json({ status: false, code: "AUTH_UNVERIFIED", message: "Phone number could not be verified." });
        }
        email = "";
        body = { ...req.body, email: "", mobileNumber: verifiedPhone };
      } else {
        // Apple can omit the email on repeat sign-ins; the app has always
        // used "<firebase uid>@appleid.com" for that case.
        email = decoded.email || (loginType === 3 ? `${decoded.uid}@appleid.com` : "");
        if (!email) {
          return res.status(200).json({ status: false, code: "AUTH_UNVERIFIED", message: "Your account has no email address." });
        }
        body = { ...req.body, email };
      }
    }

    let existingUser = null;

    if (loginType === 1 || loginType === 2 || loginType === 3) {
      // Google / Apple / Social — email from the verified token (above)
      existingUser = await db.findOne("users", { email: email.trim() });
    } else if (loginType === LOGIN_TYPE_PHONE) {
      // Firebase phone OTP — matched on the verified number only
      existingUser = await db.findOne("users", { verifiedPhoneNumber: verifiedPhone });
    } else if (loginType === 4) {
      // Email + Password — verify against stored credential (bcrypt or legacy cryptr)
      if (!email || !password) {
        return res.status(200).json({ status: false, message: "email and password both must be required." });
      }
      const found = await db.findOne("users", { email: email.trim(), loginType: 4 });
      if (found) {
        // F-19: support both bcrypt hash (passwordHash) and legacy cryptr (password)
        const stored = found.passwordHash || found.password || "";
        const { ok, rehashWith } = await verifyPassword(password, stored);
        if (!ok) {
          return res.status(200).json({ status: false, message: "Oops ! Password doesn't match." });
        }
        existingUser = found;
        // Migrate legacy cryptr password to bcrypt on first successful login
        if (rehashWith) {
          try {
            await db.update("users", found._id || found.id, { passwordHash: rehashWith, password: null });
          } catch { /* non-fatal */ }
        }
      }
    } else {
      return res.status(200).json({ status: false, message: "loginType must be passed valid." });
    }

    if (existingUser) {
      // ── EXISTING USER LOGIN ──
      if (existingUser.isBlock) {
        return res.status(200).json({ status: false, message: "You are blocked by the admin." });
      }

      const updates = buildUserData(existingUser, body);
      if (!updates.uniqueId) {
        updates.uniqueId = await generateUniqueId();
      }
      if (verifiedPhone) {
        updates.verifiedPhoneNumber = verifiedPhone;
        updates.mobileNumber = verifiedPhone;
      }

      const userId = existingUser._id || existingUser.id;
      const updatedUser = await db.update("users", userId, updates);
      // F-19: never return password or hash in login response
      return res.status(200).json({
        status: true,
        message: "User login Successfully.",
        user: safeUser(updatedUser || existingUser),
        signUp: false,
        firebaseCustomToken: await mintAppSession(userId),
        accessGate: accessGateFor(updatedUser || existingUser),
      });
    } else {
      // ── NEW USER SIGNUP ──
      const bonusCoins = global.settingJSON?.loginRewardCoins ? global.settingJSON.loginRewardCoins : 5000;
      const referralCode = await uniqueReferralCode();
      const uniqueId = await generateUniqueId();

      const newUserData = buildUserData(
        {
          coin: bonusCoins,
          loginRewardCoin: bonusCoins,
          totalRewardCoin: bonusCoins,
          referralCode,
          date: new Date().toISOString(),
          isNewUser: true,
          isActive: true,
          isBlock: false,
        },
        body
      );
      newUserData.uniqueId = uniqueId;
      newUserData.coin = bonusCoins;
      newUserData.loginRewardCoin = bonusCoins;
      newUserData.totalRewardCoin = bonusCoins;
      newUserData.referralCode = referralCode;
      newUserData.createdAt = new Date().toISOString();
      // Email + password signup: store only the bcrypt hash (F-19).
      if (loginType === 4 && password) newUserData.passwordHash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
      if (verifiedPhone) {
        newUserData.verifiedPhoneNumber = verifiedPhone;
        newUserData.mobileNumber = verifiedPhone;
      }

      const createdUser = await db.create("users", newUserData);

      // F-19: never return password or hash in signup response
      res.status(200).json({
        status: true,
        message: "User Signup Successfully.",
        user: safeUser(createdUser),
        signUp: true,
        firebaseCustomToken: await mintAppSession(createdUser._id || createdUser.id),
        accessGate: accessGateFor(createdUser),
      });

      // Side-effect: record bonus coin history
      try {
        const historyUniqueId = `hist_${Date.now()}`;
        await db.create("histories", {
          userId: createdUser._id || createdUser.id,
          coin: bonusCoins,
          uniqueId: historyUniqueId,
          type: 3,
          date: new Date().toISOString(),
        });
      } catch (e) {
        console.log("History create note:", e.message);
      }

      // Side-effect: FCM welcome notification
      try {
        if (createdUser.fcmToken) {
          const adminApp = await admin;
          adminApp.messaging().send({
            token: createdUser.fcmToken,
            notification: {
              title: "🎁 You've Earned a Login Bonus! 🎁",
              body: "You've just received an exclusive login bonus! 🌟 Enjoy your reward!",
            },
            data: { type: "LOGINBONUS" },
          }).catch(() => {});
        }
      } catch {}
    }
  } catch (error) {
    console.error("store error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/checkUser   →  check email+password before sign-in
// ─────────────────────────────────────────────────────────────────────────────
exports.checkUser = async (req, res) => {
  try {
    const { email, password, loginType } = req.body;

    if (!email || loginType === undefined || !password) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    const user = await db.findOne("users", { email: email.trim(), loginType: 4 });

    if (user) {
      const stored = user.passwordHash || user.password || "";
      const { ok } = await verifyPassword(password, stored);
      if (!ok) {
        return res.status(200).json({ status: false, message: "Password doesn't match for this user.", isLogin: false });
      }
      return res.status(200).json({ status: true, message: "User login Successfully.", isLogin: true });
    } else {
      return res.status(200).json({ status: true, message: "User must have sign up.", isLogin: false });
    }
  } catch (error) {
    console.error("checkUser error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/user/updateProfile   →  fill profile after signup
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(200).json({ status: false, message: "userId must be required." });
    }

    const user = await db.findById("users", userId);
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }
    if (!user.isActive) {
      return res.status(200).json({ status: false, message: "User does not found." });
    }
    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    // Check for duplicate fullName (channel name)
    if (req.body.fullName && req.body.fullName.trim() !== user.fullName) {
      const duplicate = await db.findOne("users", { fullName: req.body.fullName.trim() });
      if (duplicate && (duplicate._id || duplicate.id) !== userId) {
        return res.status(200).json({ status: false, message: "The provided channelName is already in use. Please choose a different one." });
      }
    }

    const updates = {};
    if (req.body.image !== undefined) updates.image = req.body.image;
    if (req.body.fullName) updates.fullName = req.body.fullName.trim();
    if (req.body.nickName) updates.nickName = req.body.nickName;
    if (req.body.gender) updates.gender = req.body.gender;
    // Schema (and every Flutter model) declares age/channelType as numbers —
    // the app's form fields send them as strings, so coerce on the way in.
    if (req.body.age !== undefined && req.body.age !== "") {
      const age = Number(req.body.age);
      if (Number.isFinite(age)) updates.age = age;
    }
    if (req.body.mobileNumber) updates.mobileNumber = req.body.mobileNumber;
    if (req.body.country) updates.country = req.body.country;
    if (req.body.ipAddress) updates.ipAddress = req.body.ipAddress;
    if (req.body.channelType !== undefined && req.body.channelType !== "") {
      const channelType = Number(req.body.channelType);
      if (Number.isFinite(channelType)) updates.channelType = channelType;
    }
    if (req.body.descriptionOfChannel) updates.descriptionOfChannel = req.body.descriptionOfChannel;
    if (req.body.subscriptionCost !== undefined) updates.subscriptionCost = Number(req.body.subscriptionCost);
    if (req.body.videoUnlockCost !== undefined) updates.videoUnlockCost = Number(req.body.videoUnlockCost);

    // Social links
    const socialMediaLinks = user.socialMediaLinks || {};
    if (req.body.instagramLink) socialMediaLinks.instagramLink = req.body.instagramLink;
    if (req.body.facebookLink) socialMediaLinks.facebookLink = req.body.facebookLink;
    if (req.body.twitterLink) socialMediaLinks.twitterLink = req.body.twitterLink;
    if (req.body.websiteLink) socialMediaLinks.websiteLink = req.body.websiteLink;
    updates.socialMediaLinks = socialMediaLinks;

    // Mark profile as complete (not new user)
    updates.isNewUser = false;
    updates.updatedAt = new Date().toISOString();

    const updatedUser = await db.update("users", userId, updates);
    // F-19: never return password or hash in profile update response
    return res.status(200).json({ status: true, message: "Success", user: safeUser(updatedUser) });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/user/profile   →  get logged-in user profile
// ─────────────────────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const user = await db.findById("users", userId);
    if (!user) {
      return res.status(200).json({ status: false, code: "USER_NOT_FOUND", message: "User does not found!" });
    }
    if (!user.isActive) {
      return res.status(200).json({ status: false, code: "USER_NOT_FOUND", message: "User does not found!" });
    }
    if (user.isBlock) {
      return res.status(200).json({ status: false, code: "USER_BLOCKED", message: "you are blocked by the admin." });
    }

    const userObj = {
      ...safeUser(user),
      paymentStatus: user.paymentStatus || false,
      payment_status: user.paymentStatus || false,
      // Whether the app must show the web-portal activation lock screen.
      accessGate: accessGateFor(user),
    };

    return res.status(200).json({ status: true, message: "Retrieve profile of the user.", user: userObj });
  } catch (error) {
    console.error("getProfile error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
