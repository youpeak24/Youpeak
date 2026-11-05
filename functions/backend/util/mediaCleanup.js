/**
 * Deleting files this app stored: Cloudflare R2 (videos, Bites) and Firebase
 * Storage (images). The older storageHelper only knows local files, DigitalOcean
 * Spaces and AWS, so on its own it silently skipped every R2 and Firebase URL
 * ("Unknown storage") and an abandoned upload was never removed.
 */
"use strict";

const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const cloudflare = require("./cloudflareStorage.service");
const imageStorage = require("./imageStorage.service");
const { publicR2Origin } = require("./mediaPolicy");

/** Object key if [url] is a public R2 URL of this deployment, else null. */
function r2KeyOf(url) {
  try {
    const origin = publicR2Origin(cloudflare.r2PublicDomain);
    const parsed = new URL(url);
    if (!origin || parsed.origin !== origin || parsed.pathname.length < 2) return null;
    return decodeURIComponent(parsed.pathname.slice(1));
  } catch (_) {
    return null;
  }
}

/** Deletes an R2 object by key. Idempotent: a missing object counts as deleted. */
async function deleteR2Object(key) {
  if (!key || !cloudflare.isConfigured()) return false;
  try {
    await cloudflare.getS3Client().send(new DeleteObjectCommand({ Bucket: cloudflare.r2BucketName, Key: key }));
    return true;
  } catch (e) {
    console.error("deleteR2Object:", e.name || e.message);
    return false;
  }
}

/**
 * Deletes the stored file behind a URL this app issued (R2 or Firebase
 * Storage). Anything else is left alone.
 * @returns {Promise<boolean>} true when something was deleted
 */
async function deleteMediaByUrl(url) {
  if (!url) return false;
  const key = r2KeyOf(url);
  if (key) return deleteR2Object(key);
  return imageStorage.deleteByUrl(url);
}

module.exports = { deleteMediaByUrl, deleteR2Object, r2KeyOf };
