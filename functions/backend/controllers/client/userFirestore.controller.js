/**
 * YouPeak – Pure Firestore User Controller
 * Handles: store (login/signup), checkUser, updateProfile, getProfile
 * All MongoDB/Mongoose code removed – 100% Firebase Cloud Firestore
 */

"use strict";

const db = require("../../util/connection");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("myTotallySecretKey");
const { generateUniqueId } = require("../../util/generateUniqueId");
const { generateReferralCode } = require("../../util/generateReferralCode");
const admin = require("../../util/privateKey");

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
    password: body.password ? cryptr.encrypt(body.password) : existing.password || "",
    identity: body.identity || existing.identity || "",
    fcmToken: body.fcmToken || existing.fcmToken || "",
    socialMediaLinks: {
      instagramLink: body.instagramLink || existing.socialMediaLinks?.instagramLink || "",
      facebookLink: body.facebookLink || existing.socialMediaLinks?.facebookLink || "",
      twitterLink: body.twitterLink || existing.socialMediaLinks?.twitterLink || "",
      websiteLink: body.websiteLink || existing.socialMediaLinks?.websiteLink || "",
    },
    channelType: body.channelType || existing.channelType || "0",
    isActive: existing.isActive !== undefined ? existing.isActive : true,
    isBlock: existing.isBlock || false,
    paymentStatus: existing.paymentStatus !== undefined ? existing.paymentStatus : (body.paymentStatus !== undefined ? body.paymentStatus : false),
    payment_status: existing.paymentStatus !== undefined ? existing.paymentStatus : (body.paymentStatus !== undefined ? body.paymentStatus : false),
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/user/login   →  login OR signup
// ─────────────────────────────────────────────────────────────────────────────
exports.store = async (req, res) => {
  try {
    const { loginType, identity, fcmToken, email, password } = req.body;

    if (!identity || loginType === undefined || !fcmToken) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    let existingUser = null;

    if (loginType === 1 || loginType === 2 || loginType === 3) {
      // Google / Apple / Social
      if (!email) {
        return res.status(200).json({ status: false, message: "email must be required." });
      }
      existingUser = await db.findOne("users", { email: email.trim() });
    } else if (loginType === 4) {
      // Email + Password
      if (!email || !password) {
        return res.status(200).json({ status: false, message: "email and password both must be required." });
      }
      const found = await db.findOne("users", { email: email.trim(), loginType: 4 });
      if (found) {
        try {
          const decrypted = cryptr.decrypt(found.password || "");
          if (decrypted !== password) {
            return res.status(200).json({ status: false, message: "Oops ! Password doesn't match." });
          }
        } catch {
          return res.status(200).json({ status: false, message: "Oops ! Password doesn't match." });
        }
        existingUser = found;
      }
    } else {
      return res.status(200).json({ status: false, message: "loginType must be passed valid." });
    }

    if (existingUser) {
      // ── EXISTING USER LOGIN ──
      if (existingUser.isBlock) {
        return res.status(200).json({ status: false, message: "You are blocked by the admin." });
      }

      const updates = buildUserData(existingUser, req.body);
      if (!updates.uniqueId) {
        updates.uniqueId = await generateUniqueId();
      }

      const updatedUser = await db.update("users", existingUser._id || existingUser.id, updates);
      // Return password decrypted for client compatibility
      const returnUser = { ...updatedUser };
      if (req.body.password) returnUser.password = req.body.password;

      return res.status(200).json({ status: true, message: "User login Successfully.", user: returnUser, signUp: false });
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
        req.body
      );
      newUserData.uniqueId = uniqueId;
      newUserData.coin = bonusCoins;
      newUserData.loginRewardCoin = bonusCoins;
      newUserData.totalRewardCoin = bonusCoins;
      newUserData.referralCode = referralCode;
      newUserData.createdAt = new Date().toISOString();

      const createdUser = await db.create("users", newUserData);

      // Return password decrypted for client
      const returnUser = { ...createdUser };
      if (req.body.password) returnUser.password = req.body.password;

      res.status(200).json({ status: true, message: "User Signup Successfully.", user: returnUser, signUp: true });

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
      let decrypted = "";
      try { decrypted = cryptr.decrypt(user.password || ""); } catch {}
      if (decrypted !== password) {
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
    if (req.body.age) updates.age = req.body.age;
    if (req.body.mobileNumber) updates.mobileNumber = req.body.mobileNumber;
    if (req.body.country) updates.country = req.body.country;
    if (req.body.ipAddress) updates.ipAddress = req.body.ipAddress;
    if (req.body.channelType) updates.channelType = req.body.channelType;
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

    return res.status(200).json({ status: true, message: "Success", user: updatedUser });
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
      return res.status(200).json({ status: false, message: "User does not found!" });
    }
    if (!user.isActive) {
      return res.status(200).json({ status: false, message: "User does not found!" });
    }
    if (user.isBlock) {
      return res.status(200).json({ status: false, message: "you are blocked by the admin." });
    }

    const userObj = {
      ...user,
      paymentStatus: user.paymentStatus || false,
      payment_status: user.paymentStatus || false,
    };

    return res.status(200).json({ status: true, message: "Retrieve profile of the user.", user: userObj });
  } catch (error) {
    console.error("getProfile error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
