/**
 * Content moderation (India IT Rules 2021 – Vercel-safe part).
 *
 *  • keyword screening of a video's text (+ optional transcript)
 *  • report-threshold auto-hold  (>= N reports in a rolling window -> pending_review)
 *  • monetisation gate           (copyright-flagged or not-approved -> no earnings)
 *
 * Audio transcription (Whisper) and copyright fingerprinting run in a separate
 * worker — see util/copyright.service + tools/worker/fingerprintWorker.js.
 */
"use strict";

const db = require("../util/connection");

function cfg() {
  const s = global.settingJSON || {};
  const n = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
  return {
    enabled: s.moderationEnabled !== false,
    reportThreshold: n(s.reportAutoHoldThreshold, 5),
    reportWindowHours: n(s.reportAutoHoldWindowHours, 24),
    grievanceSlaHours: n(s.grievanceSlaHours, 36),
  };
}

let _kwCache = { at: 0, list: [] };
async function blacklist() {
  if (Date.now() - _kwCache.at < 60_000 && _kwCache.list.length) return _kwCache.list;
  try {
    const rows = await db.find("KeywordBlacklist", {});
    _kwCache = {
      at: Date.now(),
      list: rows.map((r) => ({ keyword: String(r.keyword || "").toLowerCase().trim(), category: r.category || "anti_national" }))
        .filter((r) => r.keyword),
    };
  } catch (e) {
    /* keep previous cache */
  }
  return _kwCache.list;
}

/** Screen a blob of text against the keyword blacklist. */
async function screenText(text) {
  if (!text) return { flagged: false, matched: [], categories: [] };
  const hay = String(text).toLowerCase();
  const matched = [];
  const categories = new Set();
  for (const { keyword, category } of await blacklist()) {
    // word-ish boundary match to avoid "assassin" matching "ass"
    const re = new RegExp(`(^|[^a-z0-9])${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i");
    if (re.test(hay)) {
      matched.push(keyword);
      categories.add(category);
    }
  }
  return { flagged: matched.length > 0, matched, categories: Array.from(categories) };
}

/**
 * Screen a video's metadata (+ optional transcript). If it hits the blacklist,
 * push it to the moderation queue. Returns the screening result.
 */
async function screenVideo({ videoId, title = "", description = "", hashTags = [], transcript = "" }) {
  if (!cfg().enabled) return { flagged: false };
  const combined = [title, description, (hashTags || []).join(" "), transcript].join("  ");
  const r = await screenText(combined);
  if (r.flagged && videoId) {
    await db.update("videos", videoId, {
      moderationStatus: "pending_review",
      isFlaggedAntiNational: r.categories.includes("anti_national"),
      flaggedKeywords: r.matched,
      moderationFlaggedAt: new Date().toISOString(),
      moderationFlagSource: transcript ? "transcript+text" : "text",
      moderationFlagCategories: r.categories,
      // What the reviewer checks the matched keywords against.
      moderationTranscript: transcript ? String(transcript).slice(0, 5000) : null,
    });
  }
  return r;
}

/** Rolling-window report count -> auto-hold. Call after each new report. */
async function applyReportAutoHold(videoId) {
  const c = cfg();
  if (!c.enabled || !videoId) return { held: false };
  const since = Date.now() - c.reportWindowHours * 3600e3;
  const reports = await db.find("reports", { videoId });
  const recent = reports.filter((r) => {
    const t = r.createdAt ? new Date(r.createdAt).getTime() : Date.now();
    return t >= since;
  });
  if (recent.length >= c.reportThreshold) {
    const video = await db.findById("videos", videoId);
    if (video && video.moderationStatus !== "rejected" && video.moderationStatus !== "pending_review") {
      await db.update("videos", videoId, {
        moderationStatus: "pending_review",
        moderationFlaggedAt: new Date().toISOString(),
        moderationFlagSource: "reports",
        recentReportCount: recent.length,
      });
    }
    return { held: true, reportCount: recent.length };
  }
  return { held: false, reportCount: recent.length };
}

/** May this video earn coins / ad revenue? */
function isMonetizable(video) {
  if (!video) return false;
  if (video.isCopyrightFlagged) return false;
  if (video.moderationStatus && video.moderationStatus !== "approved") return false;
  if (video.isActive === false) return false;
  return true;
}

/** Should this video be shown in public feeds? */
function isPubliclyVisible(video) {
  if (!video) return false;
  if (video.isActive === false) return false;
  const bad = ["pending_review", "rejected"];
  return !bad.includes(video.moderationStatus);
}

/** Drop hidden videos from a feed result set. */
function filterVisible(videos) {
  if (!Array.isArray(videos)) return videos;
  return videos.filter(isPubliclyVisible);
}

module.exports = { cfg, screenText, screenVideo, applyReportAutoHold, isMonetizable, isPubliclyVisible, filterVisible };
