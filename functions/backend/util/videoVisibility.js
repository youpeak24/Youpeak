/**
 * Who may see a video — the one policy every client feed, search, related
 * list, channel list, playlist and detail endpoint applies.
 *
 *   visibilityType  1 PUBLIC · 2 PRIVATE (owner only) · 3 UNLISTED (by link, never listed)
 *   scheduleType    2 = published (1 = scheduled, not yet public)
 *   moderationStatus "pending_review" (held: ≥5 reports in 24 h, or a blacklist match)
 *                    and "rejected" (taken down) are hidden from the public
 *                    (Content Moderation spec: "temporarily hide the video from public feed").
 *   isCopyrightFlagged  hidden from the public as well: the copyright spec's
 *                    flow is "match → flag, no match → publish normally", and
 *                    every existing feed already excluded flagged videos.
 *   isActive false   deactivated by the owner/admin — hidden from everyone on
 *                    client routes (admins use the admin panel).
 *
 * videoPrivacyType 2 (coin-locked "private" video) is a different concept: it
 * is listed publicly and its playback URL is withheld until unlocked — that
 * is handled where the URL is issued, not here.
 *
 * The owner always sees their own active videos (private, scheduled, held,
 * flagged), so they can manage them.
 */
"use strict";

const HIDDEN_MODERATION = ["pending_review", "rejected"];

/** $match conditions for anything listed to the public (feeds, search, related, channel pages). */
function publicListingMatch() {
  return {
    isActive: true,
    scheduleType: 2,
    visibilityType: 1,
    moderationStatus: { $nin: HIDDEN_MODERATION },
    isCopyrightFlagged: { $ne: true },
  };
}

/**
 * $match for a video looked up from a viewer's own saved list (watch history,
 * watch later, downloads, playback sessions): still openable by link —
 * active, published, public or unlisted, not held/rejected/flagged.
 */
function savedItemMatch() {
  return {
    isActive: true,
    scheduleType: 2,
    visibilityType: { $in: [1, 3] },
    moderationStatus: { $nin: HIDDEN_MODERATION },
    isCopyrightFlagged: { $ne: true },
  };
}

const ownerOf = (video) => String((video && video.userId && (video.userId._id || video.userId)) || "");

function isPubliclyListable(video) {
  return !!video && video.isActive !== false && Number(video.scheduleType) === 2 && Number(video.visibilityType || 1) === 1 &&
    !HIDDEN_MODERATION.includes(video.moderationStatus) && video.isCopyrightFlagged !== true;
}

/** Can this viewer open this video directly (detail page / shared link / playback)? */
function canView(video, viewerId) {
  if (!video || video.isActive === false) return false;
  if (viewerId && ownerOf(video) === String(viewerId)) return true;
  const visibility = Number(video.visibilityType || 1);
  if (visibility !== 1 && visibility !== 3) return false; // PRIVATE: owner only
  if (Number(video.scheduleType) !== 2) return false;
  if (HIDDEN_MODERATION.includes(video.moderationStatus)) return false;
  if (video.isCopyrightFlagged === true) return false;
  return true;
}

/** Keep only listable videos, plus the viewer's own when `includeOwn` (their channel page). */
function filterListable(videos, viewerId, { includeOwn = false } = {}) {
  if (!Array.isArray(videos)) return [];
  return videos.filter((v) => isPubliclyListable(v) || (includeOwn && viewerId && v && v.isActive !== false && ownerOf(v) === String(viewerId)));
}

// Fields that are moderation/internal bookkeeping and never part of a client response.
const INTERNAL_FIELDS = ["moderationTranscript", "flaggedKeywords", "moderationFlagSource", "moderationFlagCategories",
  "copyrightMatchedVideoId", "copyrightMatchVia", "copyrightMatchScore", "recentReportCount"];

function stripInternal(video) {
  if (!video || typeof video !== "object") return video;
  const out = { ...video };
  for (const f of INTERNAL_FIELDS) delete out[f];
  return out;
}

module.exports = { HIDDEN_MODERATION, publicListingMatch, savedItemMatch, isPubliclyListable, canView, filterListable, stripInternal, ownerOf };
