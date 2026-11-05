/**
 * Video promotion — paid distribution of a creator's own video
 * (DOC-20260826-WA0214, "Creator Growth & Video Promotion" rate card).
 *
 * Not Peak Boost: Peak Boost is a viewer tipping a creator with coins.
 *
 * What a promotion delivers (and nothing more is claimed to the buyer):
 *   - From the moment its payment is verified until the plan's duration ends,
 *     the video is eligible for the "Promoted" slot on the Home feed, shown to
 *     signed-in viewers everywhere ("Global" targeting = no region filter).
 *   - Campaigns are served in order of how far behind they are on their
 *     estimated delivery (pacing), so short and long plans both progress.
 *   - Serving stops at the plan's upper impression estimate or when the
 *     duration ends, whichever comes first. The impression range is an
 *     ESTIMATE, not a guarantee — delivery depends on how many viewers use
 *     the app during the campaign.
 *
 * Impression policy (counted by the server, never by the client alone):
 *   - an impression = a signed-in viewer had the Promoted card on screen
 *     (the app reports it once the card has been visible for ~1 second);
 *   - the report must carry a placement token the server issued to THAT
 *     viewer for THAT campaign in the last 30 minutes (HMAC-signed);
 *   - at most one impression per viewer per campaign per India-time day;
 *   - the video's owner never counts; nothing counts outside the campaign
 *     window or after the upper estimate is reached.
 */
"use strict";

const crypto = require("crypto");
const db = require("./connection");
const visibility = require("./videoVisibility");
const { getPromotionPlans } = require("./platformConfig");

const CAMPAIGNS = "videoPromotions";
const EVENTS = "videoPromotionEvents";
const IMPRESSIONS = "promotionImpressions";
const TOKEN_TTL_MS = 30 * 60 * 1000;

const slug = (s) => String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const istDay = (ms = Date.now()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(ms));

// Older stored names (before they matched the rate card) resolve to the same plan.
const LEGACY_IDS = { weekly_mega: "weekly_mega_plan", monthly_pro: "monthly_pro_plan" };

function categoryFor(days) {
  if (days >= 28) return "Monthly";
  if (days >= 7) return "Weekly";
  return "Daily";
}

/** The authoritative catalogue: admin settings (Platform Config → Video Promotion), normalised. */
function catalogue({ activeOnly = false } = {}) {
  return getPromotionPlans({ activeOnly }).map((p) => {
    const durationDays = num(p.durationDays, 1);
    const id = p.id ? slug(p.id) : (LEGACY_IDS[slug(p.name)] || slug(p.name));
    return {
      id,
      name: String(p.name || ""),
      priceINR: num(p.priceINR),
      currency: "INR",
      impressionsMin: num(p.impressionsMin),
      impressionsMax: num(p.impressionsMax),
      durationDays,
      targeting: p.targeting || "Global",
      category: p.category || categoryFor(durationDays),
      isActive: p.isActive !== false,
    };
  });
}

/** By stable id (preferred) or by plan name (older app versions). */
function findPlan({ planId, planName } = {}) {
  const all = catalogue();
  if (planId) {
    const key = LEGACY_IDS[slug(planId)] || slug(planId);
    return all.find((p) => p.id === key) || null;
  }
  if (planName) {
    const key = slug(planName);
    return all.find((p) => slug(p.name) === key || p.id === (LEGACY_IDS[key] || key)) || null;
  }
  return null;
}

/** The terms stored on the order and the campaign (a later rate-card edit never changes them). */
function snapshot(plan) {
  const { id, name, priceINR, currency, impressionsMin, impressionsMax, durationDays, targeting, category } = plan;
  return { id, name, priceINR, currency, impressionsMin, impressionsMax, durationDays, targeting, category, snapshotAt: new Date().toISOString() };
}

/** Why this video can't be promoted by this user right now, or null. */
async function ineligibility(video, userId) {
  if (!video) return "Video not found.";
  if (String(visibility.ownerOf(video)) !== String(userId)) return "You can only promote your own videos.";
  if (Number(video.videoType) !== 1) return "Only normal videos can be promoted (not Bites).";
  if (!visibility.isPubliclyListable(video)) return "Only public, published videos can be promoted (not private, unlisted, scheduled or under review).";
  const running = await activeCampaignFor(String(video._id || video.id));
  if (running) return `This video already has an active promotion until ${running.expiresAt}.`;
  return null;
}

async function activeCampaignFor(videoId, now = Date.now()) {
  const rows = await db.find(CAMPAIGNS, { videoId: String(videoId) });
  return rows.find((c) => effectiveStatus(c, now) === "active") || null;
}

/**
 * Status shown to people: paid campaigns are "active" between start and end;
 * "completed" once the upper estimate is delivered; "expired" after the end;
 * "paused"/"rejected" by an admin.
 */
function effectiveStatus(c, now = Date.now()) {
  const s = String(c.status || "").toLowerCase();
  if (s === "rejected" || s === "paused") return s;
  if (num(c.impressionsDelivered) >= num(c.impressionsTargetMax, Infinity) && num(c.impressionsTargetMax) > 0) return "completed";
  const end = Date.parse(c.expiresAt || "");
  if (Number.isFinite(end) && now >= end) return "expired";
  const start = Date.parse(c.startedAt || "");
  if (Number.isFinite(start) && now < start) return "scheduled";
  return s === "active" ? "active" : s || "unknown";
}

// ── Audit trail ─────────────────────────────────────────────────────────────
function eventDoc(campaignId, type, by, extra = {}) {
  const at = new Date().toISOString();
  const id = `${campaignId}_${type}_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  return { id, data: { _id: id, id, campaignId, type, by: by || "system", at, ...extra, createdAt: at } };
}
async function logEvent(campaignId, type, by, extra) {
  const e = eventDoc(campaignId, type, by, extra);
  await db.create(EVENTS, e.data, e.id);
}

// ── Placement tokens (HMAC) ─────────────────────────────────────────────────
function tokenSecret() {
  return String(process.env.PROMOTION_TOKEN_SECRET || process.env.JWT_SECRET || process.env.secretKey || "youpeak-promotion-dev");
}
function signToken(campaignId, viewerId, issuedAt = Date.now()) {
  const payload = `${campaignId}.${viewerId}.${issuedAt}`;
  const mac = crypto.createHmac("sha256", tokenSecret()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${mac}`;
}
function readToken(token) {
  const [p, mac] = String(token || "").split(".");
  if (!p || !mac) return null;
  const payload = Buffer.from(p, "base64url").toString("utf8");
  const expected = crypto.createHmac("sha256", tokenSecret()).update(payload).digest("base64url");
  const a = Buffer.from(mac), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const [campaignId, viewerId, issuedAt] = payload.split(".");
  return { campaignId, viewerId, issuedAt: Number(issuedAt) };
}

/**
 * Up to [limit] promoted videos for this viewer, with placement tokens.
 * Pacing: the campaign furthest behind its expected delivery of the LOWER
 * estimate (spread evenly over its duration) is served first.
 */
async function placements(viewerId, { limit = 2, now = Date.now() } = {}) {
  const rows = await db.find(CAMPAIGNS, { status: "active" });
  const live = rows.filter((c) => effectiveStatus(c, now) === "active" && String(c.userId) !== String(viewerId || ""));
  const scored = [];
  for (const c of live) {
    const video = await db.findById("videos", String(c.videoId)).catch(() => null);
    if (!video || !visibility.isPubliclyListable(video)) continue;
    const start = Date.parse(c.startedAt), end = Date.parse(c.expiresAt);
    const elapsed = Math.min(1, Math.max(0, (now - start) / Math.max(1, end - start)));
    const expected = num(c.impressionsTargetMin) * elapsed;
    const deficit = expected - num(c.impressionsDelivered);
    scored.push({ c, video, deficit, tie: Math.random() });
  }
  scored.sort((a, b) => b.deficit - a.deficit || a.tie - b.tie);
  return scored.slice(0, Math.max(0, Math.min(5, limit))).map(({ c, video }) => ({
    campaignId: String(c._id || c.id),
    placementToken: viewerId ? signToken(String(c._id || c.id), String(viewerId), now) : null,
    video: {
      _id: String(video._id || video.id), title: video.title || "", videoImage: video.videoImage || "", videoUrl: video.videoUrl || "",
      videoTime: num(video.videoTime), videoType: num(video.videoType, 1), channelId: video.channelId || "", userId: String(visibility.ownerOf(video)),
    },
  }));
}

/**
 * Count one impression (see the policy above). Idempotent per viewer/campaign/day.
 * @returns {{ok:boolean, counted:boolean, reason?:string, delivered?:number}}
 */
async function recordImpression(viewerId, token, now = Date.now()) {
  const t = readToken(token);
  if (!t || String(t.viewerId) !== String(viewerId)) return { ok: false, counted: false, reason: "BAD_TOKEN" };
  if (!(now - t.issuedAt >= 0 && now - t.issuedAt <= TOKEN_TTL_MS)) return { ok: false, counted: false, reason: "TOKEN_EXPIRED" };
  const fs = db.getDb();
  const campRef = fs.collection(db.normalizeCollectionName(CAMPAIGNS)).doc(t.campaignId);
  const impRef = fs.collection(IMPRESSIONS).doc(`${t.campaignId}_${viewerId}_${istDay(now)}`);
  return db.withTimeout(fs.runTransaction(async (tx) => {
    const [cs, is] = await Promise.all([tx.get(campRef), tx.get(impRef)]);
    if (!cs.exists) return { ok: false, counted: false, reason: "NOT_FOUND" };
    const c = cs.data();
    if (String(c.userId) === String(viewerId)) return { ok: true, counted: false, reason: "OWNER" };
    if (effectiveStatus(c, now) !== "active") return { ok: true, counted: false, reason: "NOT_ACTIVE" };
    if (is.exists) return { ok: true, counted: false, reason: "ALREADY_COUNTED_TODAY", delivered: num(c.impressionsDelivered) };
    const delivered = num(c.impressionsDelivered) + 1;
    const iso = new Date(now).toISOString();
    tx.create(impRef, { _id: impRef.id, id: impRef.id, campaignId: t.campaignId, viewerId: String(viewerId), day: istDay(now), at: iso });
    tx.update(campRef, { impressionsDelivered: delivered, lastImpressionAt: iso, updatedAt: iso });
    return { ok: true, counted: true, delivered };
  }));
}

/** Daily cron + on demand: end campaigns whose time is over; clear the video flag. */
async function expireDue(now = Date.now()) {
  const rows = await db.find(CAMPAIGNS, { status: "active" });
  let ended = 0;
  for (const c of rows) {
    const s = effectiveStatus(c, now);
    if (s !== "expired" && s !== "completed") continue;
    const id = String(c._id || c.id);
    await db.update(CAMPAIGNS, id, { status: s, endedAt: new Date(now).toISOString() });
    await logEvent(id, s, "system");
    if (!(await activeCampaignFor(String(c.videoId), now))) await db.update("videos", String(c.videoId), { isPromoted: false }).catch(() => {});
    ended++;
  }
  return ended;
}

/** A campaign as shown to its owner (and admins). */
async function present(c, now = Date.now()) {
  const video = await db.findById("videos", String(c.videoId)).catch(() => null);
  const min = num(c.impressionsTargetMin), max = num(c.impressionsTargetMax), delivered = num(c.impressionsDelivered);
  return {
    _id: String(c._id || c.id),
    videoId: String(c.videoId),
    video: video ? { _id: String(video._id || video.id), title: video.title || "", videoImage: video.videoImage || "" } : null,
    plan: c.planSnapshot || { name: c.planName, priceINR: num(c.planPriceINR), durationDays: num(c.planDurationDays), impressionsMin: min, impressionsMax: max },
    planName: c.planName,
    planPriceINR: num(c.planPriceINR),
    status: effectiveStatus(c, now),
    paymentStatus: c.paymentGatewayRef ? "paid" : "unknown",
    startedAt: c.startedAt || null,
    expiresAt: c.expiresAt || null,
    impressionsDelivered: delivered,
    impressionsTargetMin: min,
    impressionsTargetMax: max,
    // Progress toward the LOWER estimate (an estimate, not a guarantee).
    progressToMinEstimate: min > 0 ? Math.min(1, delivered / min) : null,
    rejectionReason: c.rejectionReason || null,
    createdAt: c.createdAt || null,
  };
}

module.exports = {
  catalogue, findPlan, snapshot, ineligibility, activeCampaignFor, effectiveStatus,
  placements, recordImpression, expireDue, present, logEvent, eventDoc, signToken, readToken, istDay,
  CAMPAIGNS, EVENTS, IMPRESSIONS,
};
