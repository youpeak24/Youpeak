/**
 * YouPeak – Full Firestore User Controller (replaces Mongoose version)
 * All 100% Firebase Cloud Firestore. No MongoDB/Mongoose references.
 */

"use strict";

const db = require("../../util/connection");
const Cryptr = require("cryptr");
// TODO(step-4): migrate user passwords to bcrypt (verify-and-rehash on login).
// Key is overridable so it can be rotated once that migration exists.
const cryptr = new Cryptr(process.env.USER_PW_SECRET || "myTotallySecretKey");
const { generateUniqueId } = require("../../util/generateUniqueId");
const { generateReferralCode } = require("../../util/generateReferralCode");
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");
const rewardEngine = require("../../util/rewardEngine");
const watchLedger = require("../../util/watchLedger.service");
const { lockMessage } = require("../../util/taskSecurity.service");
const referralService = require("../../util/referral.service");

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
    const userId = req.query.userId || req.body.userId;
    const referralCode = req.body.referralCode || req.query.referralCode;

    const result = await referralService.applyReferralCode({
      referredUserId: userId,
      referralCode,
      ipAddress: (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip || "",
    });

    return res.status(200).json({
      status: !!result.ok,
      message: result.message,
      flagged: result.flagged || false,
      stage1CoinsPending: result.stage1CoinsPending || 0,
      holdHours: result.holdHours || 0,
    });
  } catch (error) {
    console.error("validateAndApplyReferralCode error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Ad Watch Reward ──────────────────────────────────────────────────────────
// Server decides the coin amount and enforces the 20-ads/day + daily-earning caps.
// `coinEarnedFromAd` from the client is IGNORED for crediting (kept only as a
// fraud-analysis breadcrumb in the history record).
exports.handleAdWatchReward = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    const { coinEarnedFromAd, adId } = req.body;

    const result = await rewardEngine.creditReward({
      userId,
      kind: "ad",
      historyType: rewardEngine.HISTORY_TYPE.AD_WATCH,
      countField: "dailyAdCountToday",
      capField: "maxAdsPerDay",
      meta: { adId: adId || "", claimedByClient: Number(coinEarnedFromAd) || 0 },
    });

    if (!result.ok) {
      return res.status(200).json({ status: false, message: result.message, ...(result.counts || {}) });
    }

    return res.status(200).json({
      status: true,
      message: result.message,
      coinsEarned: result.credited,
      data: {
        coin: result.user.coin,
        watchAds: { count: result.counts.dailyAdCountToday, date: rewardEngine.todayStr() },
      },
      dailyAdCountToday: result.counts.dailyAdCountToday,
      maxAdsPerDay: result.limits.maxAdsPerDay,
      dailyEarningCoinsToday: result.counts.dailyEarningCoinsToday,
      dailyMaxCapInCoins: result.limits.dailyEarningCapInCoins,
    });
  } catch (error) {
    console.error("handleAdWatchReward error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Engagement Video Watch Reward (2h/day milestone -> 500 coins) ─────────────
exports.handleEngagementVideoWatchReward = async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    const reported = Number(req.body.totalWatchTime ?? req.query.totalWatchTime ?? 0);
    if (!userId) return res.status(200).json({ status: false, message: "userId is required." });
    if (!Number.isFinite(reported) || reported <= 0) {
      return res.status(200).json({ status: false, message: "Invalid watch time." });
    }

    const user = await db.findById("users", userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found." });
    if (user.isBlock) return res.status(200).json({ status: false, message: "You are blocked by the admin." });

    // Installed app builds send the video's length in SECONDS here, which was
    // read as minutes. Whatever the unit, the ledger credits at most the
    // wall-clock time since this user's previous watch report
    // (util/watchLedger.service.js); newer builds use client/watch/heartbeat.
    const progress = await watchLedger.recordWatchProgress(user, Math.min(reported, 180) * 60, {
      maxSeconds: 180 * 60,
      countVideoWatch: true,
    });
    if (!progress.ok) {
      return res.status(200).json({
        status: false,
        code: progress.reason,
        message: progress.reason === "SECURITY_LOCK" ? lockMessage(progress.lock.reasons) : "User not found.",
      });
    }

    return res.status(200).json({
      status: true,
      milestoneReached: progress.milestoneReached,
      message: progress.milestoneReached
        ? (progress.milestoneCoins > 0
            ? `2-hour watch milestone reached! Earned ${progress.milestoneCoins} coins.`
            : "2-hour milestone reached — today's earning cap is already met.")
        : "Watch time updated.",
      coinsEarned: progress.milestoneCoins,
      data: { coin: progress.coin },
      totalWatchMinutesToday: progress.watchMinutesToday,
      minutesUntilMilestone: progress.minutesUntilMilestone,
      dailyEarningCoinsToday: progress.dailyEarningCoinsToday,
      dailyMaxCapInCoins: progress.limits.dailyEarningCapInCoins,
    });
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

    // channelId is never generated anywhere else in the codebase, and every
    // other query that uses it (videosOfChannel, subscriptions, monetization)
    // treats it as the channel owner's own userId — videos are saved with
    // userId: <uploader's own id>, never a separate channel id. So on first
    // becoming a channel, self-reference it; without this the app's own
    // "isChannel && channelId != null" gate could never pass for a real user.
    if (updates.isChannel === true && !user.channelId) {
      updates.channelId = userId;
    }

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
// The Flutter client (ChannelHomeModel.fromJson) reads channelName,
// channelImage, totalVideosOfChannel, totalSubscribers, isSubscribed,
// channelType, subscriptionCost, videoUnlockCost and detailsOfChannel (the
// video list) all at the TOP LEVEL of this response. This used to nest
// everything under a `channel` key instead (with `totalSubscriber`,
// singular, never even `totalSubscribers`) and never returned a video list
// at all — every field the client read came back null, and the app
// force-unwraps totalVideosOfChannel while rendering the header, so the
// whole channel page crashed to a blank/grey screen for every channel,
// every time, regardless of whose channel or how many videos it had.
exports.detailsOfChannel = async (req, res) => {
  try {
    const { channelId, userId, start = 1, limit = 20 } = req.query;
    if (!channelId) return res.status(200).json({ status: false, message: "channelId is required." });

    const channel = await db.findById("users", channelId);
    if (!channel) return res.status(200).json({ status: false, message: "Channel not found." });

    const [subscribers, videos] = await Promise.all([
      db.find("userWiseSubscriptions", { channelId }),
      db.find("videos", { userId: channelId, isActive: true }),
    ]);
    const isSubscribed = userId ? subscribers.some((s) => s.userId === userId) : false;

    const startNum = Math.max(Number(start) || 1, 1);
    const limitNum = Number(limit) || 20;
    const paginated = videos.slice((startNum - 1) * limitNum, startNum * limitNum);

    const detailsOfChannel = paginated.map((v) => ({
      _id: v._id || v.id,
      channelId: v.channelId,
      title: v.title,
      videoType: v.videoType,
      videoTime: v.videoTime,
      videoUrl: v.videoUrl,
      videoImage: v.videoImage,
      videoPrivacyType: v.videoPrivacyType,
      createdAt: v.createdAt,
      channelType: channel.channelType,
      subscriptionCost: channel.subscriptionCost,
      videoUnlockCost: channel.videoUnlockCost,
      views: v.views || v.totalViews || 0,
      isSubscribed,
      isSaveToWatchLater: false,
      time: v.createdAt,
    }));

    return res.status(200).json({
      status: true,
      message: "Success",
      channelName: channel.fullName || "",
      channelImage: channel.image || "",
      channelType: channel.channelType,
      subscriptionCost: channel.subscriptionCost,
      videoUnlockCost: channel.videoUnlockCost,
      totalSubscribers: subscribers.length,
      totalVideosOfChannel: videos.length,
      isSubscribed,
      detailsOfChannel,
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
// referralHistories rows key off referrerId/referredUserId (Peak Partner
// two-stage tracking), not userId — and the app's model (unchanged) expects
// {status, message, data:[{_id, userId:{_id,fullName,nickName}, type, coin,
// date, createdAt}]}, the shape of a generic "history" log row. Query the
// right field and reshape each row into that exact format instead of
// changing the (already-shipped) app model.
exports.loadReferralHistoryByUser = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(200).json({ status: false, message: "userId is required." });

    const records = await db.find("referralHistories", { referrerId: String(userId) }, { sort: { createdAt: -1 } });

    const referredIds = [...new Set(records.map((r) => r.referredUserId).filter(Boolean))];
    const referredUsers = referredIds.length
      ? await Promise.all(referredIds.map((id) => db.findById("users", id).catch(() => null)))
      : [];
    const userById = {};
    referredUsers.forEach((u, i) => { if (u) userById[referredIds[i]] = u; });

    const data = records.map((r) => {
      const u = userById[r.referredUserId];
      return {
        _id: r._id || r.id,
        userId: {
          _id: r.referredUserId || "",
          fullName: u?.fullName || "Youpeak User",
          nickName: u?.nickName || "",
        },
        type: 4, // HISTORY_TYPE.REFERRAL_REWARD, kept for display consistency
        coin: Number(r.totalRewardCoinsGiven) || 0,
        stage1Completed: !!r.stage1Completed,
        stage2Completed: !!r.stage2Completed,
        status: r.status || "",
        date: r.createdAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt || r.createdAt,
      };
    });

    return res.status(200).json({ status: true, message: "Success", data, history: data, total: data.length });
  } catch (error) {
    console.error("loadReferralHistoryByUser error:", error);
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
