/**
 * YouPeak – Full Firestore User Controller (replaces Mongoose version)
 * All 100% Firebase Cloud Firestore. No MongoDB/Mongoose references.
 */

"use strict";

const db = require("../../util/connection");
const visibility = require("../../util/videoVisibility");
const channelService = require("../../util/channel.service");
const { stripCredentials, publicChannel } = require("../../util/safeUser");
const Cryptr = require("cryptr");
const bcrypt = require("bcryptjs");
// Legacy key — used only for reading pre-migration passwords (F-19).
const cryptr = new Cryptr(process.env.USER_PW_SECRET || "myTotallySecretKey");
const BCRYPT_ROUNDS = 10;

// F-19: verify plain against bcrypt hash or legacy cryptr ciphertext.
async function verifyOldPassword(plain, stored) {
  if (!stored) return false;
  if (stored.startsWith("$2")) return bcrypt.compare(plain, stored);
  try { return cryptr.decrypt(stored) === plain; } catch { return false; }
}
const { generateUniqueId } = require("../../util/generateUniqueId");
const { generateReferralCode } = require("../../util/generateReferralCode");
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");
const rewardEngine = require("../../util/rewardEngine");
const watchLedger = require("../../util/watchLedger.service");
const { lockMessage, adRewardRefusal } = require("../../util/taskSecurity.service");
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

    // Rewarded ads are app-only: no web ad flow the server can verify.
    const refusal = adRewardRefusal(req);
    if (refusal) return res.status(200).json({ status: false, code: refusal.code, message: refusal.message });

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
        message: progress.reason === "SECURITY_LOCK" ? lockMessage(progress.lock.reasons) : progress.message || "User not found.",
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
    // bindAppUser() has already replaced userId with the signed-in user.
    const userId = req.query.userId;
    if (!userId) return res.status(200).json({ status: false, message: "userId is required." });

    // "Create your channel": validated, idempotent and name-safe in one
    // transaction (util/channel.service.js). The channel is the caller's own
    // profile, so ownership comes from the verified token, not from the body.
    if (req.body && req.body.isChannel === true) {
      const created = await channelService.createChannel(userId, req.body);
      // Input problems answer 200 + status:false like the rest of this API: the
      // published app builds only read the message from a 200 response.
      if (!created.ok) return res.status(created.status === 400 || created.status === 409 ? 200 : created.status).json({ status: false, code: created.code, message: created.message });
      return res.status(200).json({
        status: true,
        code: created.alreadyExists ? "CHANNEL_EXISTS" : "CHANNEL_CREATED",
        message: created.alreadyExists ? "You already have a channel." : "Channel created successfully.",
        alreadyExists: created.alreadyExists,
        channelId: created.user.channelId,
        user: created.user,
      });
    }

    const user = await db.findById("users", userId);
    if (!user) return res.status(200).json({ status: false, message: "User not found." });

    const updates = {};
    const allowedFields = ["fullName","nickName","image","gender","age","mobileNumber","country","descriptionOfChannel","channelType","subscriptionCost","videoUnlockCost"];
    allowedFields.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
    // The app sends form values as strings; the channel model reads numbers.
    if (updates.channelType !== undefined) {
      const channelType = Number(updates.channelType);
      if (channelType !== 1 && channelType !== 2) return res.status(200).json({ status: false, code: "CHANNEL_TYPE_INVALID", message: "Choose a public or a private channel." });
      updates.channelType = channelType;
    }
    for (const field of ["subscriptionCost", "videoUnlockCost"]) {
      if (updates[field] === undefined) continue;
      const amount = Number(updates[field]);
      if (!Number.isFinite(amount) || amount < 0) return res.status(200).json({ status: false, code: "COST_INVALID", message: "Enter a valid amount." });
      updates[field] = amount;
    }
    if (updates.fullName !== undefined) {
      const name = channelService.normalizeName(updates.fullName);
      if (name.length < channelService.NAME_MIN || name.length > channelService.NAME_MAX) {
        return res.status(200).json({ status: false, code: "CHANNEL_NAME_INVALID", message: "Enter a channel name between " + channelService.NAME_MIN + " and " + channelService.NAME_MAX + " characters." });
      }
      if (name !== user.fullName) {
        const duplicate = await db.findOne("users", { fullName: name });
        if (duplicate && String(duplicate._id || duplicate.id) !== String(userId)) {
          return res.status(200).json({ status: false, code: "CHANNEL_NAME_TAKEN", message: "The provided channelName is already in use. Please choose a different one." });
        }
      }
      updates.fullName = name;
    }
    updates.updatedAt = new Date().toISOString();

    const updatedUser = await db.update("users", userId, updates);
    return res.status(200).json({ status: true, message: "User updated successfully.", user: stripCredentials(updatedUser) });
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

    // F-19: accept both bcrypt hash (passwordHash) and legacy cryptr (password)
    const stored = user.passwordHash || user.password || "";
    const ok = await verifyOldPassword(oldPassword, stored);
    if (!ok) {
      return res.status(200).json({ status: false, message: "Old password doesn't match." });
    }
    await db.update("users", userId, { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS), password: null });
    return res.status(200).json({ status: true, message: "Password updated." });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Set Password ─────────────────────────────────────────────────────────────
// Forgot-password reset. Authorised only by a just-verified email OTP
// (client/otp.controller.js verify sets passwordResetGrantUntil) — it used to
// take ?userId with nothing else, so anyone could set any account's password
// and then sign in as that user. The app sends { email, newPassword, confirmPassword }.
exports.setPassword = async (req, res) => {
  try {
    const email = String((req.body && req.body.email) || "").trim();
    const { newPassword, confirmPassword } = req.body || {};
    if (!email || !newPassword) {
      return res.status(200).json({ status: false, message: "Email and new password are required." });
    }
    if (confirmPassword !== undefined && confirmPassword !== newPassword) {
      return res.status(200).json({ status: false, message: "Passwords do not match." });
    }

    const user = await db.findOne("users", { email });
    const grantUntil = user && user.passwordResetGrantUntil ? Date.parse(user.passwordResetGrantUntil) : 0;
    if (!user || !(grantUntil > Date.now())) {
      return res.status(200).json({ status: false, message: "Please verify the OTP sent to your email first." });
    }

    await db.update("users", user._id || user.id, {
      // F-19: write bcrypt hash, never cryptr or plaintext
      passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
      password: null,
      loginType: 4,
      passwordResetGrantUntil: null,
    });
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
    if (!channelId) return res.status(200).json({ status: false, code: "CHANNEL_ID_REQUIRED", message: "channelId is required." });

    const channel = await db.findById("users", channelId);
    if (!channel) return res.status(200).json({ status: false, code: "CHANNEL_NOT_FOUND", message: "Channel not found." });

    const [subscribers, videos] = await Promise.all([
      db.find("userWiseSubscriptions", { channelId }),
      db.find("videos", { userId: channelId, isActive: true }),
    ]);
    // F-12: the public sees only listable videos; the verified owner sees all
    // of their own active ones (util/videoVisibility.js).
    const visibleVideos = visibility.filterListable(videos, req.appUserId, { includeOwn: true });
    const isSubscribed = userId ? subscribers.some((s) => s.userId === userId) : false;

    const startNum = Math.max(Number(start) || 1, 1);
    const limitNum = Number(limit) || 20;
    const paginated = visibleVideos.slice((startNum - 1) * limitNum, startNum * limitNum);

    // The app's channel model reads these as int: older profiles stored them as strings.
    const channelType = Number(channel.channelType) === 2 ? 2 : 1;
    const subscriptionCost = Math.max(0, Math.round(Number(channel.subscriptionCost) || 0));
    const videoUnlockCost = Math.max(0, Math.round(Number(channel.videoUnlockCost) || 0));

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
      channelType,
      subscriptionCost,
      videoUnlockCost,
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
      channelType,
      subscriptionCost,
      videoUnlockCost,
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
    if (!channelId) return res.status(200).json({ status: false, code: "CHANNEL_ID_REQUIRED", message: "channelId is required." });

    let query = { userId: channelId, isActive: true };
    if (videoType) query.videoType = Number(videoType);

    const videos = visibility.filterListable(await db.find("videos", query), req.appUserId, { includeOwn: true })
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    const { from, size } = pageOf(start, limit);
    const owner = await db.findById("users", channelId).catch(() => null);
    const isOwner = !!req.appUserId && String(req.appUserId) === String(channelId);
    const subscribed = !isOwner && req.appUserId
      ? (await db.find("UserWiseSubscription", { userId: String(req.appUserId), channelId: String(channelId) })).length > 0
      : false;
    const page = await Promise.all(videos.slice(from, from + size).map(async (v) => {
      const id = String(v._id || v.id);
      const views = await db.countDocuments("WatchHistory", { videoId: id });
      const paid = Number(v.videoPrivacyType) === 2;
      return {
        ...visibility.stripInternal(v),
        _id: id,
        views,
        time: relativeTime(v.createdAt),
        channelType: owner ? Number(owner.channelType) || 1 : 1,
        subscriptionCost: owner ? Number(owner.subscriptionCost) || 0 : 0,
        // Per video: free videos have no price (issue 4).
        videoUnlockCost: paid && owner ? Number(owner.videoUnlockCost) || 0 : 0,
        isSubscribed: subscribed,
        // Owner-only status shown on "Your videos".
        ...(isOwner ? {
          visibilityType: Number(v.visibilityType) || 1,
          scheduleType: Number(v.scheduleType) || 2,
          scheduleTime: v.scheduleTime || "",
          moderationStatus: v.moderationStatus || "",
        } : { visibilityType: undefined, scheduleType: undefined, scheduleTime: undefined, moderationStatus: undefined }),
      };
    }));
    // `videosTypeWiseOfChannel` is what the app parses ("Your videos" and the
    // channel's Videos/Bites tabs were empty with only `video`).
    return res.status(200).json({ status: true, message: "Success", videosTypeWiseOfChannel: page, video: page, total: videos.length });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

function relativeTime(iso, now = Date.now()) {
  const t = Date.parse(iso || "");
  if (!Number.isFinite(t)) return "";
  const min = Math.floor(Math.max(0, now - t) / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? "" : "s"} ago`;
  const y = Math.floor(d / 365);
  return `${y} year${y === 1 ? "" : "s"} ago`;
}

// The app sends 1-based page numbers (start=1, 2, …) with a page size; these
// lists used start as an item offset, so page 1 skipped the first item and
// pages overlapped. start 0 or 1 is the first page.
function pageOf(start, limit) {
  const size = Math.min(100, Math.max(1, Number(limit) || 20));
  const page = Math.max(1, Number(start) || 1);
  return { from: (page - 1) * size, size };
}

// ─── PlayLists of Channel ─────────────────────────────────────────────────────
exports.playListsOfChannel = async (req, res) => {
  try {
    const { channelId, start = 0, limit = 20 } = req.query;
    if (!channelId) return res.status(200).json({ status: false, code: "CHANNEL_ID_REQUIRED", message: "channelId is required." });

    // PLAYLIST_TYPE: 1 private, 2 public — private playlists only for their verified owner.
    const isOwner = !!req.appUserId && String(req.appUserId) === String(channelId);
    const playlists = (await db.find("playLists", { userId: channelId }))
      .filter((p) => isOwner || Number(p.playListType) === 2)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    const { from, size } = pageOf(start, limit);
    const owner = await db.findById("users", channelId).catch(() => null);
    // Each card shows its first viewable video and the count of viewable ones.
    const page = await Promise.all(playlists.slice(from, from + size).map(async (p) => {
      const ids = (p.videoId || []).map((v) => String((v && (v._id || v)) || "")).filter(Boolean);
      const loaded = (await Promise.all(ids.map((id) => db.findById("videos", id).catch(() => null)))).filter(Boolean);
      const viewable = visibility.filterListable(loaded, req.appUserId, { includeOwn: true });
      const first = viewable[0] || null;
      return {
        _id: String(p._id || p.id), channelId: p.channelId || channelId, userId: String(p.userId || ""),
        playListName: p.playListName || "", playListType: Number(p.playListType) || 1,
        channelName: owner ? owner.fullName || "" : "", channelType: owner ? Number(owner.channelType) || 1 : 1,
        createdAt: p.createdAt || null, updatedAt: p.updatedAt || null,
        videoImage: first ? first.videoImage || "" : "", videoId: first ? String(first._id || first.id) : "",
        totalVideo: viewable.length,
      };
    }));
    // `playListsOfChannel` is what the app parses (it used to get `playList`
    // only, so "My Playlist" was always empty); `playList` kept for others.
    return res.status(200).json({ status: true, message: "Success", playListsOfChannel: page, playList: page, total: playlists.length });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Get PlayList Videos ──────────────────────────────────────────────────────
exports.getPlayListVideos = async (req, res) => {
  try {
    const { playListId, start = 0, limit = 20 } = req.query;
    if (!playListId) return res.status(200).json({ status: false, message: "playListId is required." });

    // Videos live in the playlist's videoId array (videos never carry a
    // playListId, so this endpoint used to return nothing). Private playlists
    // are visible to their verified owner only; each video is filtered by
    // util/videoVisibility.js.
    const playList = await db.findById("playLists", playListId);
    const ownerId = String((playList && (playList.userId?._id || playList.userId)) || "");
    const isOwner = !!req.appUserId && ownerId === String(req.appUserId);
    if (!playList || (Number(playList.playListType) !== 2 && !isOwner)) {
      return res.status(200).json({ status: false, message: "Playlist not found." });
    }
    const ids = (playList.videoId || []).map((v) => String((v && (v._id || v)) || "")).filter(Boolean);
    const loaded = await Promise.all(ids.map((id) => db.findById("videos", id).catch(() => null)));
    const videos = visibility.filterListable(loaded.filter(Boolean), req.appUserId, { includeOwn: true });
    const { from, size } = pageOf(start, limit);
    const paginated = videos.slice(from, from + size).map(visibility.stripInternal);
    return res.status(200).json({ status: true, message: "Success", video: paginated, total: videos.length });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── About of Channel ─────────────────────────────────────────────────────────
exports.aboutOfChannel = async (req, res) => {
  try {
    const { channelId } = req.query;
    if (!channelId) return res.status(200).json({ status: false, code: "CHANNEL_ID_REQUIRED", message: "channelId is required." });

    const user = await db.findById("users", channelId);
    if (!user || user.isActive === false) return res.status(200).json({ status: false, code: "CHANNEL_NOT_FOUND", message: "Channel not found." });

    // Public fields only (P-01: this returned the whole user document —
    // password hash, e-mail, push token, device id — to anyone with the key).
    const channel = publicChannel(user);
    // Views of the channel's publicly listed videos (bounded by the channel).
    const videos = await db.find("videos", { userId: String(user._id || user.id) });
    const totalViewsOfthatChannelVideos = visibility.filterListable(videos, null)
      .reduce((sum, v) => sum + (Number(v.views) || 0), 0);
    channel.date = channel.date || channel.createdAt || "";

    // `aboutOfChannel` is the shape the app's About tab parses.
    return res.status(200).json({ status: true, message: "Success", channel, aboutOfChannel: { channel, totalViewsOfthatChannelVideos } });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// ─── Search Channel ───────────────────────────────────────────────────────────
exports.searchChannel = async (req, res) => {
  try {
    const { searchString, start = 0, limit = 20 } = req.body;
    if (!searchString) return res.status(200).json({ status: true, message: "Success", channel: [], total: 0 });

    const lower = String(searchString).trim().toLowerCase().slice(0, 100);
    if (!lower) return res.status(200).json({ status: true, message: "Success", channel: [], total: 0 });
    // Channels only (not every account), public fields only (P-01).
    const channels = await db.find("users", { isChannel: true, isActive: true });
    const matched = channels.filter(u =>
      u.isBlock !== true &&
      ((u.fullName || "").toLowerCase().includes(lower) ||
      (u.nickName || "").toLowerCase().includes(lower))
    );
    const from = Math.max(0, Number(start) || 0);
    const size = Math.min(50, Math.max(1, Number(limit) || 20));
    const paginated = matched.slice(from, from + size).map(publicChannel);
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
