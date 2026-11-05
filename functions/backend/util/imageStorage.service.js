/**
 * Non-video asset storage → Firebase Cloud Storage.
 *
 * Per the platform split: videos/shorts live on Cloudflare, everything else
 * (profile images, thumbnails, channel art, sounds, …) lives on Firebase.
 *
 * Bucket: FIREBASE_STORAGE_BUCKET env, else "<projectId>.appspot.com".
 * Objects are uploaded under `public/` and made publicly readable
 * (storage.rules allows read on public/**; all writes go through the Admin SDK).
 */
"use strict";

const fs = require("fs");
const path = require("path");
const admin = require("./firebaseAdmin");
const { randomUUID } = require("crypto");
const { getDownloadURL } = require("firebase-admin/storage");

function bucketName() {
  const s = global.settingJSON || {};
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    s.firebaseStorageBucket ||
    `${process.env.FIREBASE_PROJECT_ID || "youpeak-9ff65"}.firebasestorage.app`
  );
}

function isConfigured() {
  try {
    return Boolean(admin.apps && admin.apps.length && bucketName());
  } catch (e) {
    return false;
  }
}

/**
 * Upload a local file to Firebase Storage under public/<folder>/<name>.
 * @returns {Promise<string|null>} public HTTPS URL
 */
async function uploadImage(localPath, folder, fileName, contentType) {
  if (!localPath || !fs.existsSync(localPath)) throw new Error("Asset file is missing.");
  const bkt = admin.storage().bucket(bucketName());
  const safeFolder = String(folder || "misc").replace(/[^a-zA-Z0-9/_-]/g, "");
  const destination = `public/${safeFolder}/${fileName || path.basename(localPath)}`;

  await bkt.upload(localPath, {
    destination,
    resumable: false,
    metadata: { contentType: contentType || undefined, cacheControl: "public, max-age=31536000", metadata: { firebaseStorageDownloadTokens: randomUUID() } },
  });
  // Storage rules do not make a GCS URL public; token download URLs work
  // without per-object ACLs, including uniform bucket-level access.
  return getDownloadURL(bkt.file(destination));
}

async function deleteByUrl(url) {
  try {
    if (!url) return false;
    const bkt = admin.storage().bucket(bucketName());
    const parsed = new URL(url);
    const prefix = `/v0/b/${bucketName()}/o/`;
    let object;
    if (parsed.hostname === "firebasestorage.googleapis.com" && parsed.pathname.startsWith(prefix)) {
      object = decodeURIComponent(parsed.pathname.slice(prefix.length));
    } else if (parsed.hostname === "storage.googleapis.com" && parsed.pathname.startsWith(`/${bucketName()}/`)) {
      object = decodeURIComponent(parsed.pathname.slice(bucketName().length + 2));
    } else return false;
    if (!object.startsWith("public/")) return false;
    await bkt.file(object).delete();
    return true;
  } catch (e) {
    console.error("imageStorage.deleteByUrl:", e.message);
    return false;
  }
}

module.exports = { isConfigured, uploadImage, deleteByUrl, bucketName };
