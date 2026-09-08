/**
 * YouPeak – Full Firestore User Controller (replaces Mongoose version)
 * All 100% Firebase Cloud Firestore. No MongoDB/Mongoose references.
 */

"use strict";

const db = require("../../util/connection");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("myTotallySecretKey");
const { generateUniqueId } = require("../../util/generateUniqueId");
const { generateReferralCode } = require("../../util/generateReferralCode");

// ─── Re-export everything from the Firestore controller ──────────────────────
const firestoreCtrl = require("./userFirestore.controller");
exports.store          = firestoreCtrl.store;
exports.checkUser      = firestoreCtrl.checkUser;
exports.updateProfile  = firestoreCtrl.updateProfile;
exports.getProfile     = firestoreCtrl.getProfile;

// ─── Referral Code Validation ─────────────────────────────────────────────────
// Per Youpeak Peak Partner Terms & Payout Guidelines:
//   Stage 1: ₹100 (10,000 coins) when referred user completes OTP verification
//   Stage 2: ₹100 (10,000 coins) when referred user watches 100 min within 7 days
exports.validateAndApplyReferralCode = async (req, res) => {
  try {
    const userId = req.query.userId;
    const { referralCode } = req.body;
    if (!userId || !referralCode) {
      return res.status(200).json({ status: false, message: "userId and referralCode are required." });
    }
    const user = await db.findById("users", userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found." });

    if (user.referralApplied) {
      return res.status(200).json({ status: false, message: "Referral code already applied." });
    }

    const referrer = await db.findOne("users", { referralCode: referralCode.trim() });
    if (!referrer) {
      return res.status(200).json({ status: false, message: "Invalid referral code." });
    }
    if ((referrer._id || referrer.id) === userId) {
      return res.status(200).json({ status: false, message: "You cannot use your own referral code." });
    }

    // Stage 1: Credit 10,000 coins = ₹100 to referrer immediately on OTP verification
    const STAGE1_COINS = 10000; // ₹100 at 100 coins = ₹1

    // Update referred user: mark referral as applied
    await db.update("users", userId, {
      referralApplied: true,
      isReferral: true,
    });

    // Update referrer: credit Stage 1 coins + increment referral count
    const referrerId = referrer._id || referrer.id;
    await db.update("users", referrerId, {
      coin: ((referrer.coin) || 0) + STAGE1_COINS,
      referralRewardCoin: ((referrer.referralRewardCoin) || 0) + STAGE1_COINS,
      totalRewardCoin: ((referrer.totalRewardCoin) || 0) + STAGE1_COINS,
      referralCount: ((referrer.referralCount) || 0) + 1,
    });

    // Create ReferralHistory record for Stage 2 tracking (7-day deadline)
    const stage2Deadline = new Date();
    stage2Deadline.setDate(stage2Deadline.getDate() + 7);

    try {
      const ReferralHistory = require("../../models/referralHistory.model");
      await ReferralHistory.create({
        referrerId: referrerId,
        referredUserId: userId,
        referralCode: referralCode.trim(),
        ipAddress: req.ip || "",
        stage1Completed: true,
        stage1CompletedAt: new Date(),
        stage1RewardCoins: STAGE1_COINS,
        stage2Completed: false,
        stage2RewardCoins: 0,
        stage2DeadlineAt: stage2Deadline,
        totalRewardCoinsGiven: STAGE1_COINS,
        status: "STAGE1_DONE",
      });
    } catch (histErr) {
      console.error("ReferralHistory create error:", histErr.message);
    }

    return res.status(200).json({
      status: true,
      message: "Referral code applied! Stage 1 bonus (₹100 = 10,000 coins) credited to referrer.",
      stage1CoinsAwarded: STAGE1_COINS,
    });
  } catch (error) {
    console.error("validateAndApplyReferralCode error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Ad Watch Reward ──────────────────────────────────────────────────────────
exports.handleAdWatchReward = async (req, res) => {
  try {
    const userId = req.query.userId;
    const { coinEarnedFromAd, adId } = req.body;
    if (!userId) return res.status(200).json({ status: false, message: "userId is required." });

    const user = await db.findById("users", userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found." });

    const coins = Number(coinEarnedFromAd) || 0;
    await db.update("users", userId, { coin: (user.coin || 0) + coins, totalRewardCoin: (user.totalRewardCoin || 0) + coins });
    await db.create("histories", {
      userId, coin: coins, type: 1, date: new Date().toISOString(), adId: adId || ""
    });
    return res.status(200).json({ status: true, message: "Ad reward applied." });
  } catch (error) {
    console.error("handleAdWatchReward error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Engagement Video Reward ──────────────────────────────────────────────────
exports.handleEngagementVideoWatchReward = async (req, res) => {
  try {
    const userId = req.query.userId;
    const { videoId, totalWatchTime } = req.body;
    if (!userId) return res.status(200).json({ status: false, message: "userId is required." });

    const setting = global.settingJSON || {};
    const rewardCoins = setting.videoWatchRewardCoin || 10;
    const user = await db.findById("users", userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found." });

    await db.update("users", userId, { coin: (user.coin || 0) + rewardCoins, totalRewardCoin: (user.totalRewardCoin || 0) + rewardCoins });
    return res.status(200).json({ status: true, message: "Engagement reward applied.", coin: rewardCoins });
  } catch (error) {
    console.error("handleEngagementVideoWatchReward error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Update Channel ───────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(200).json({ status: false, message: "userId is required." });

    const user = await db.findById("users", userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found." });

    const updates = {};
    const allowedFields = ["fullName","nickName","image","gender","age","mobileNumber","country","descriptionOfChannel","channelType","subscriptionCost","videoUnlockCost","isChannel"];
    allowedFields.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
    updates.updatedAt = new Date().toISOString();

    const updatedUser = await db.update("users", userId, updates);
    return res.status(200).json({ status: true, message: "User updated successfully.", user: updatedUser });
  } catch (error) {
    console.error("update error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Update Password ──────────────────────────────────────────────────────────
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.query.userId;
    const { oldPassword, newPassword } = req.body;
    const user = await db.findById("users", userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found." });

    let decrypted = "";
    try { decrypted = cryptr.decrypt(user.password || ""); } catch {}
    if (decrypted !== oldPassword) {
      return res.status(200).json({ status: false, message: "Old password doesn't match." });
    }
    await db.update("users", userId, { password: cryptr.encrypt(newPassword) });
    return res.status(200).json({ status: true, message: "Password updated." });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Set Password ─────────────────────────────────────────────────────────────
exports.setPassword = async (req, res) => {
  try {
    const userId = req.query.userId;
    const { newPassword } = req.body;
    await db.update("users", userId, { password: cryptr.encrypt(newPassword), loginType: 4 });
    return res.status(200).json({ status: true, message: "Password set successfully." });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Channel Details ──────────────────────────────────────────────────────────
exports.detailsOfChannel = async (req, res) => {
  try {
    const { channelId, userId } = req.query;
    if (!channelId) return res.status(200).json({ status: false, message: "channelId is required." });

    const channel = await db.findById("users", channelId);
    if (!channel) return res.status(200).json({ status: false, message: "Channel not found." });

    // Subscriber count
    const subscribers = await db.find("userWiseSubscriptions", { channelId });
    const isSubscribed = userId ? subscribers.some(s => s.userId === userId) : false;

    return res.status(200).json({
      status: true,
      message: "Success",
      channel: { ...channel, totalSubscriber: subscribers.length, isSubscribed }
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Videos of Channel ────────────────────────────────────────────────────────
exports.videosOfChannel = async (req, res) => {
  try {
    const { channelId, videoType, start = 0, limit = 20 } = req.query;
    if (!channelId) return res.status(200).json({ status: false, message: "channelId is required." });

    let query = { userId: channelId, isActive: true };
    if (videoType) query.videoType = Number(videoType);

    const videos = await db.find("videos", query);
    const paginated = videos.slice(Number(start), Number(start) + Number(limit));
    return res.status(200).json({ status: true, message: "Success", video: paginated, total: videos.length });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── PlayLists of Channel ─────────────────────────────────────────────────────
exports.playListsOfChannel = async (req, res) => {
  try {
    const { channelId, start = 0, limit = 20 } = req.query;
    if (!channelId) return res.status(200).json({ status: false, message: "channelId is required." });

    const playlists = await db.find("playLists", { userId: channelId });
    const paginated = playlists.slice(Number(start), Number(start) + Number(limit));
    return res.status(200).json({ status: true, message: "Success", playList: paginated, total: playlists.length });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Get PlayList Videos ──────────────────────────────────────────────────────
exports.getPlayListVideos = async (req, res) => {
  try {
    const { playListId, start = 0, limit = 20 } = req.query;
    if (!playListId) return res.status(200).json({ status: false, message: "playListId is required." });

    const videos = await db.find("videos", { playListId });
    const paginated = videos.slice(Number(start), Number(start) + Number(limit));
    return res.status(200).json({ status: true, message: "Success", video: paginated, total: videos.length });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── About of Channel ─────────────────────────────────────────────────────────
exports.aboutOfChannel = async (req, res) => {
  try {
    const { channelId } = req.query;
    if (!channelId) return res.status(200).json({ status: false, message: "channelId is required." });

    const channel = await db.findById("users", channelId);
    if (!channel) return res.status(200).json({ status: false, message: "Channel not found." });

    return res.status(200).json({ status: true, message: "Success", channel });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Search Channel ───────────────────────────────────────────────────────────
exports.searchChannel = async (req, res) => {
  try {
    const { searchString, start = 0, limit = 20 } = req.body;
    if (!searchString) return res.status(200).json({ status: true, message: "Success", channel: [], total: 0 });

    const allUsers = await db.find("users", { isActive: true });
    const lower = searchString.toLowerCase();
    const matched = allUsers.filter(u =>
      (u.fullName || "").toLowerCase().includes(lower) ||
      (u.nickName || "").toLowerCase().includes(lower)
    );
    const paginated = matched.slice(Number(start), Number(start) + Number(limit));
    return res.status(200).json({ status: true, message: "Success", channel: paginated, total: matched.length });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Delete User Account ──────────────────────────────────────────────────────
exports.deleteUserAccount = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(200).json({ status: false, message: "userId is required." });
    await db.update("users", userId, { isActive: false, deletedAt: new Date().toISOString() });
    return res.status(200).json({ status: true, message: "Account deleted successfully." });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Load Referral History ────────────────────────────────────────────────────
exports.loadReferralHistoryByUser = async (req, res) => {
  try {
    const userId = req.query.userId;
    const records = await db.find("referralHistories", { userId });
    return res.status(200).json({ status: true, message: "Success", history: records, total: records.length });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Coin History ─────────────────────────────────────────────────────────────
exports.retriveCoinHistoryByUser = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    const records = await db.find("histories", { userId });
    return res.status(200).json({ status: true, message: "Success", history: records, total: records.length });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Wallet History ───────────────────────────────────────────────────────────
exports.fetchWalletHistoryByUser = async (req, res) => {
  try {
    const { userId, start = 0, limit = 20 } = req.query;
    const records = await db.find("walletHistories", { userId });
    const paginated = records.slice(Number(start), Number(start) + Number(limit));
    return res.status(200).json({ status: true, message: "Success", history: paginated, total: records.length });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};
