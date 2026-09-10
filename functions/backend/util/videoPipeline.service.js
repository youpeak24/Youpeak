/**
 * Cloudflare Stream video pipeline.
 *
 * Flow:
 *   1. app asks for a one-time direct-upload URL  -> createDirectUpload()
 *   2. app PUTs the raw file straight to Cloudflare (never through our server)
 *   3. Cloudflare transcodes to HLS/DASH; a webhook (or getStatus poll) marks
 *      the video ready with hlsUrl / duration / thumbnail
 *
 * Small server-side files can also be pushed with uploadFromPath() (used by the
 * legacy /client/file/upload-file route as a fallback).
 *
 * Credentials come from cloudflareStorage._cfg() (env-first, then settings doc):
 *   CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_STREAM_CUSTOMER_CODE
 *   CLOUDFLARE_STREAM_WEBHOOK_SECRET
 */
"use strict";

const axios = require("axios");
const fs = require("fs");
const crypto = require("crypto");
const cf = require("./cloudflareStorage.service");

const API = "https://api.cloudflare.com/client/v4";

function cfg() {
  const c = cf._cfg();
  return {
    accountId: c.accountId,
    apiToken: c.apiToken,
    customerCode: c.streamCustomerCode,
    webhookSecret:
      process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET ||
      (global.settingJSON || {}).cloudflareStreamWebhookSecret || "",
  };
}

function isConfigured() {
  const c = cfg();
  return Boolean(c.accountId && c.apiToken);
}

function playbackUrls(uid) {
  const code = cfg().customerCode;
  const base = code
    ? `https://customer-${code}.cloudflarestream.com/${uid}`
    : `https://videodelivery.net/${uid}`;
  return {
    hlsUrl: `${base}/manifest/video.m3u8`,
    dashUrl: `${base}/manifest/video.mpd`,
    thumbnailUrl: `${base}/thumbnails/thumbnail.jpg`,
    iframe: `${base}/iframe`,
  };
}

function authHeaders(json = true) {
  const c = cfg();
  return json
    ? { Authorization: `Bearer ${c.apiToken}`, "Content-Type": "application/json" }
    : { Authorization: `Bearer ${c.apiToken}` };
}

/** One-time direct-creator-upload URL. `meta` is attached to the Stream video. */
async function createDirectUpload({ maxDurationSeconds = 3600, meta = {}, requireSignedURLs = false } = {}) {
  if (!isConfigured()) throw new Error("Cloudflare Stream is not configured.");
  const c = cfg();
  const { data } = await axios.post(
    `${API}/accounts/${c.accountId}/stream/direct_upload`,
    { maxDurationSeconds, requireSignedURLs, meta },
    { headers: authHeaders() }
  );
  const uid = data.result.uid;
  return { uploadURL: data.result.uploadURL, uid, ...playbackUrls(uid) };
}

/** Push a local file to Stream (server-side). Best for small files only. */
async function uploadFromPath(filePath, { meta = {} } = {}) {
  if (!isConfigured()) throw new Error("Cloudflare Stream is not configured.");
  const c = cfg();
  const FormData = require("form-data") ; // provided by axios' deps in most setups
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  if (meta && Object.keys(meta).length) form.append("meta", JSON.stringify(meta));

  const { data } = await axios.post(
    `${API}/accounts/${c.accountId}/stream`,
    form,
    { headers: { ...authHeaders(false), ...form.getHeaders() }, maxBodyLength: Infinity, maxContentLength: Infinity }
  );
  const v = data.result;
  return {
    uid: v.uid,
    status: v.status && v.status.state,
    duration: v.duration || null,
    ...playbackUrls(v.uid),
  };
}

/** Tell Stream to ingest a video from a publicly reachable URL (e.g. an R2 object). */
async function copyFromUrl(url, { meta = {} } = {}) {
  if (!isConfigured()) throw new Error("Cloudflare Stream is not configured.");
  const c = cfg();
  const { data } = await axios.post(
    `${API}/accounts/${c.accountId}/stream/copy`,
    { url, meta },
    { headers: authHeaders() }
  );
  const v = data.result;
  return { uid: v.uid, status: v.status && v.status.state, ...playbackUrls(v.uid) };
}

/** Poll a Stream video's transcode status. */
async function getStatus(uid) {
  if (!isConfigured()) throw new Error("Cloudflare Stream is not configured.");
  const c = cfg();
  const { data } = await axios.get(`${API}/accounts/${c.accountId}/stream/${uid}`, { headers: authHeaders(false) });
  const v = data.result;
  return {
    uid: v.uid,
    ready: v.readyToStream === true,
    state: v.status && v.status.state, // pendingupload | queued | inprogress | ready | error
    duration: v.duration || null,
    thumbnail: v.thumbnail || null,
    playback: v.playback || null,
    input: v.input || null,
    ...playbackUrls(v.uid),
  };
}

async function deleteVideo(uid) {
  if (!uid || !isConfigured()) return false;
  const c = cfg();
  try {
    await axios.delete(`${API}/accounts/${c.accountId}/stream/${uid}`, { headers: authHeaders(false) });
    return true;
  } catch (e) {
    console.error("Stream delete failed:", e.response?.data || e.message);
    return false;
  }
}

/**
 * Verify a Cloudflare Stream webhook. CF signs with:
 *   Webhook-Signature: time=<ts>,sig1=<hmac_sha256(ts + "." + body, secret)>
 */
function verifyWebhook({ rawBody, headers }) {
  const c = cfg();
  const raw = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody || "");
  if (!c.webhookSecret) return { valid: false, reason: "no_webhook_secret" };

  const header = headers["webhook-signature"] || headers["Webhook-Signature"] || "";
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=").map((x) => x.trim())));
  const ts = parts.time;
  const sig = parts.sig1;
  if (!ts || !sig) return { valid: false, reason: "bad_header" };

  const expected = crypto.createHmac("sha256", c.webhookSecret).update(`${ts}.${raw}`).digest("hex");
  const ok = expected.length === sig.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  if (!ok) return { valid: false, reason: "bad_signature" };

  let body;
  try { body = JSON.parse(raw); } catch (e) { return { valid: false, reason: "bad_json" }; }
  const uid = body.uid;
  const state = body.status && body.status.state;
  return {
    valid: true,
    uid,
    ready: body.readyToStream === true || state === "ready",
    state,
    duration: body.duration || null,
    thumbnail: body.thumbnail || null,
    meta: body.meta || {},
    ...playbackUrls(uid || ""),
  };
}

module.exports = { isConfigured, playbackUrls, createDirectUpload, uploadFromPath, copyFromUrl, getStatus, deleteVideo, verifyWebhook };
