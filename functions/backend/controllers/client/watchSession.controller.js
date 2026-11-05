/**
 * YouPeak – playback heartbeat (watch-time tracking).
 *
 * The app sends one heartbeat every watchHeartbeatIntervalSeconds while a
 * video is really playing: foreground, unmuted, at ≤ 2x speed. The server
 * re-checks those conditions, then credits through util/watchLedger.service.js,
 * which never credits more than the wall-clock time since the user's last
 * credited report. Lifetime watch hours (never reset on level-up), the daily
 * 2-hour bonus, Milestone 2 and the free level-up all hang off that ledger.
 */
"use strict";

const db = require("../../util/connection");
const { recordWatchProgress } = require("../../util/watchLedger.service");
const { lockMessage } = require("../../util/taskSecurity.service");
const viewLedger = require("../../util/viewLedger.service");
const { payCreatorForViewing } = require("./watchHistory.controller");

const MAX_PLAYBACK_RATE = 2;

// A heartbeat names the same video ~6 times a minute; don't re-read it each time.
const knownVideos = new Map();
const VIDEO_CACHE_MS = 10 * 60 * 1000;

// Returns the (cached) video document, or null if it doesn't exist / is inactive.
async function activeVideo(videoId) {
  const cached = knownVideos.get(videoId);
  if (cached && cached.until > Date.now()) return cached.video;
  const video = await db.findById("videos", videoId);
  if (!video || video.isActive === false) return null;
  if (knownVideos.size > 5000) knownVideos.clear();
  knownVideos.set(videoId, { until: Date.now() + VIDEO_CACHE_MS, video });
  return video;
}

exports.heartbeat = async (req, res) => {
  try {
    const body = req.body || {};
    const videoId = typeof body.videoId === "string" ? body.videoId.trim() : "";
    const playedSeconds = Number(body.playedSeconds);
    const playbackRate = Number(body.playbackRate ?? 1);

    if (!videoId || videoId.length > 64 || !Number.isFinite(playedSeconds) || playedSeconds < 0 || playedSeconds > 120) {
      return res.status(200).json({ status: false, code: "INVALID_HEARTBEAT", message: "Invalid heartbeat." });
    }

    // Not genuine viewing: muted, fast-forwarded, or the app isn't on screen.
    let ignored = null;
    if (body.muted === true) ignored = "MUTED";
    else if (!Number.isFinite(playbackRate) || playbackRate > MAX_PLAYBACK_RATE) ignored = "FAST_PLAYBACK";
    else if (body.foreground === false) ignored = "BACKGROUND";
    if (ignored) {
      return res.status(200).json({ status: true, creditedSeconds: 0, ignored });
    }

    const video = await activeVideo(videoId);
    if (!video) {
      return res.status(200).json({ status: false, code: "VIDEO_NOT_FOUND", message: "Video not found." });
    }


    const maxSeconds = Number((global.settingJSON || {}).watchHeartbeatMaxCreditSeconds) || 15;
    const positionSeconds = Number(body.positionSeconds);
    const progress = await recordWatchProgress(req.appUser, playedSeconds, {
      maxSeconds,
      playback: Number.isFinite(positionSeconds) && positionSeconds >= 0 ? { videoId, positionSeconds } : null,
    });
    // Views and creator earnings come from verified viewing of THIS video,
    // whether or not the viewer can earn coins themselves (viewLedger). After
    // the reward claim, so that claim's wall-clock bound isn't delayed.
    try {
      const viewing = await viewLedger.recordViewing({ userId: req.appUserId, video, seconds: playedSeconds });
      if (viewing.viewCounted) await payCreatorForViewing({ userId: req.appUserId, video });
    } catch (e) {
      console.error("heartbeat view ledger:", e.message);
    }

    if (!progress.ok) {
      if (progress.reason === "SECURITY_LOCK") {
        return res.status(200).json({
          status: false,
          code: "SECURITY_LOCK",
          reasons: progress.lock.reasons,
          message: lockMessage(progress.lock.reasons),
        });
      }
      return res.status(200).json({ status: false, code: progress.reason, message: progress.message || "Account not found." });
    }

    return res.status(200).json({
      status: true,
      creditedSeconds: progress.creditedSeconds,
      watchMinutesToday: progress.watchMinutesToday,
      milestoneMinutes: progress.milestoneMinutes,
      milestoneReached: progress.milestoneReached,
      milestoneCoins: progress.milestoneCoins,
      lifetimeWatchMinutes: progress.lifetimeWatchMinutes,
      lifetimeWatchHours: progress.lifetimeWatchHours,
      dailyEarningCoinsToday: progress.dailyEarningCoinsToday,
      dailyCapCoins: progress.limits.dailyEarningCapInCoins,
      dailyCapReached: progress.dailyCapReached,
      coin: progress.coin,
      tierUpgraded: progress.tierUpgraded,
      newTierId: progress.newTierId,
      newTierName: progress.newTierName,
    });
  } catch (error) {
    console.error("watch heartbeat error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
