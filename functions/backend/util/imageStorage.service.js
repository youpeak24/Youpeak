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

function bucketName() {
  const s = global.settingJSON || {};
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    s.firebaseStorageBucket ||
    `${process.env.FIREBASE_PROJECT_ID || "youpeak-9ff65"}.appspot.com`
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
  if (!localPath || !fs.existsSync(localPath)) return null;
  const bkt = admin.storage().bucket(bucketName());
  const safeFolder = String(folder || "misc").replace(/[^a-zA-Z0-9/_-]/g, "");
  const destination = `public/${safeFolder}/${fileName || path.basename(localPath)}`;

  await bkt.upload(localPath, {
    destination,
    resumable: false,
    metadata: { contentType: contentType || undefined, cacheControl: "public, max-age=31536000" },
  });
  try { await bkt.file(destination).makePublic(); } catch (e) { /* uniform bucket-level access */ }

  return `https://storage.googleapis.com/${bucketName()}/${destination}`;
}

async function deleteByUrl(url) {
  try {
    if (!url || !url.includes("storage.googleapis.com")) return false;
    const bkt = admin.storage().bucket(bucketName());
    const prefix = `https://storage.googleapis.com/${bucketName()}/`;
    if (!url.startsWith(prefix)) return false;
    await bkt.file(decodeURIComponent(url.slice(prefix.length))).delete();
    return true;
  } catch (e) {
    console.error("imageStorage.deleteByUrl:", e.message);
    return false;
  }
}

module.exports = { isConfigured, uploadImage, deleteByUrl, bucketName };
