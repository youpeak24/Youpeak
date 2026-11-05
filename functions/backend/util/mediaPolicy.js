"use strict";
const VIDEO_EXTENSION = /\.(mp4|mov|webm|avi|mkv|flv|wmv|3gp|m4v|m3u8)$/i;
function isVideoFile(file = {}) {
  return /^video\//i.test(file.mimetype || "") || VIDEO_EXTENSION.test(file.originalname || file.filename || "");
}
function safeFolder(value) {
  return String(value || "misc").toLowerCase().replace(/[^a-z0-9_-]+/g, "").slice(0, 40) || "misc";
}
// An S3 API origin requires signatures; it is not a public playback CDN.
function publicR2Origin(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
        url.pathname !== "/" || /(^|\.)r2\.cloudflarestorage\.com$/i.test(url.hostname)) return null;
    return url.origin;
  } catch (_) { return null; }
}
function r2PublicUrl(domain, key) {
  const origin = publicR2Origin(domain);
  if (!origin) {
    const error = new Error("Configure a public Cloudflare R2 custom domain or r2.dev URL; the S3 API endpoint cannot serve unsigned videos.");
    error.code = "R2_DELIVERY_NOT_CONFIGURED";
    throw error;
  }
  if (typeof key !== "string" || !key || key.split("/").some((part) => !part || part === "." || part === "..")) throw new Error("Invalid media object key.");
  return `${origin}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
function videoLocation(value, { r2PublicDomain, streamCustomerCode } = {}) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.hash || url.search) return null;
    if (url.origin === publicR2Origin(r2PublicDomain) && url.pathname.length > 1) return { storageProvider: "r2", streamStatus: "r2", rawVideoUrl: url.href, videoUrl: url.href };
    const streamHost = streamCustomerCode ? `customer-${streamCustomerCode}.cloudflarestream.com` : "videodelivery.net";
    const match = url.pathname.match(/^\/([a-f0-9]{32})\/manifest\/video\.m3u8$/i);
    if ((url.hostname === streamHost || url.hostname === "videodelivery.net") && match) {
      return { storageProvider: "stream", streamStatus: "inprogress", streamUid: match[1], hlsUrl: url.href, videoUrl: url.href };
    }
  } catch (_) { /* invalid URL */ }
  return null;
}
// Largest single video accepted (uploaded straight to R2 with a presigned PUT).
const MAX_VIDEO_BYTES = Number(process.env.MAX_VIDEO_BYTES) > 0 ? Number(process.env.MAX_VIDEO_BYTES) : 2 * 1024 * 1024 * 1024;
module.exports = { MAX_VIDEO_BYTES, isVideoFile, safeFolder, publicR2Origin, r2PublicUrl, videoLocation };
