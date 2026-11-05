/**
 * Upload ownership (Phase 2, media lifecycle). A Cloudflare URL on the right
 * host is not proof that the caller uploaded it: any user could publish
 * someone else's object key or Stream UID as their own video.
 *
 *   recordGrant()       when the server issues an upload (presigned R2 PUT,
 *                       Stream direct upload, or a multipart upload it stored
 *                       itself): uploadGrants/<provider>_<sha256(ref)> with
 *                       owner, provider, object key / Stream UID, expected
 *                       content type and a publish-by time.
 *   verifyOwnedUpload() before a video is created or its file replaced: the
 *                       grant must exist, belong to the caller, be unused and
 *                       not expired. Uploads made before grants existed fall
 *                       back to the multipart owner record
 *                       (videos_metadata/<fileName>.uploadedBy).
 *   r2ObjectExists()    HEAD the object — the PUT really completed.
 *   markGrantUsed()     binds the grant to the video, so the same upload
 *                       can't be published twice.
 *   publishedVideoFor() the video an upload already became, for the same
 *                       owner: publishing is idempotent, so a retry after a
 *                       lost reply returns that video instead of an error.
 *   claimGrant()        atomically takes the grant for one publish attempt, so
 *                       two requests racing on the same upload cannot both
 *                       create a video.
 *   cleanupExpired()    deletes uploads that were never published (and the
 *                       bookkeeping of old grants) after a grace period.
 */
"use strict";

const crypto = require("crypto");
const db = require("./connection");

const PUBLISH_WINDOW_MS = 24 * 3600e3;

const grantId = (provider, ref) => `${provider}_${crypto.createHash("sha256").update(String(ref)).digest("hex").slice(0, 40)}`;

async function recordGrant({ provider, ref, ownerId, ownerType = "user", contentType = "", kind = "" }) {
  if (!provider || !ref || !ownerId) return null;
  const id = grantId(provider, ref);
  const now = Date.now();
  await db.getDb().collection("uploadGrants").doc(id).set({
    _id: id, provider, ref: String(ref), ownerId: String(ownerId), ownerType, contentType, kind,
    createdAt: new Date(now).toISOString(), publishBy: new Date(now + PUBLISH_WINDOW_MS).toISOString(),
    usedByVideoId: null,
  });
  return id;
}

/** Object key of a public R2 URL (path without the leading slash, decoded). */
function r2KeyFromUrl(url) {
  try {
    return decodeURIComponent(new URL(url).pathname.replace(/^\/+/, ""));
  } catch (_) {
    return null;
  }
}

/**
 * @returns {Promise<{ok:true, grant?:object, legacy?:boolean} | {ok:false, code:string, message:string}>}
 */
async function verifyOwnedUpload({ provider, ref, ownerId, allowVideoId = null, now = Date.now() }) {
  if (!provider || !ref || !ownerId) return { ok: false, code: "UPLOAD_NOT_FOUND", message: "Upload the video first." };
  const grant = await db.findById("uploadGrants", grantId(provider, ref));
  if (grant) {
    if (String(grant.ownerId) !== String(ownerId)) return { ok: false, code: "UPLOAD_NOT_OWNED", message: "This upload belongs to another account." };
    if (grant.usedByVideoId && String(grant.usedByVideoId) !== String(allowVideoId || "")) {
      return { ok: false, code: "UPLOAD_ALREADY_USED", message: "This upload is already published." };
    }
    if (!grant.usedByVideoId && Date.parse(grant.publishBy || "") < now) {
      return { ok: false, code: "UPLOAD_EXPIRED", message: "This upload has expired. Please upload the video again." };
    }
    return { ok: true, grant };
  }
  if (provider === "r2") {
    // Multipart uploads stored before grants existed carry their owner here.
    const fileName = String(ref).split("/").pop();
    const meta = await db.findById("videos_metadata", fileName).catch(() => null);
    if (meta && String(meta.uploadedBy || "") === String(ownerId)) return { ok: true, legacy: true };
  }
  return { ok: false, code: "UPLOAD_NOT_FOUND", message: "Upload not found for this account. Please upload the video again." };
}

/**
 * What R2 holds under [key]: {exists, size}, or null when R2 can't be asked
 * (not configured).
 */
async function r2ObjectInfo(key) {
  const cloudflare = require("./cloudflareStorage.service");
  if (!cloudflare.isConfigured()) return null;
  const { HeadObjectCommand } = require("@aws-sdk/client-s3");
  try {
    const head = await cloudflare.getS3Client().send(new HeadObjectCommand({ Bucket: cloudflare.r2BucketName, Key: key }));
    return { exists: true, size: Number(head.ContentLength) || 0 };
  } catch (e) {
    if (e && (e.name === "NotFound" || e.$metadata?.httpStatusCode === 404)) return { exists: false, size: 0 };
    throw e;
  }
}

/** true / false, or null when R2 can't be asked (not configured). */
async function r2ObjectExists(key) {
  const cloudflare = require("./cloudflareStorage.service");
  if (!cloudflare.isConfigured()) return null;
  const { HeadObjectCommand } = require("@aws-sdk/client-s3");
  try {
    await cloudflare.getS3Client().send(new HeadObjectCommand({ Bucket: cloudflare.r2BucketName, Key: key }));
    return true;
  } catch (e) {
    if (e && (e.name === "NotFound" || e.$metadata?.httpStatusCode === 404)) return false;
    throw e;
  }
}

async function markGrantUsed({ provider, ref, videoId }) {
  const id = grantId(provider, ref);
  const grant = await db.findById("uploadGrants", id);
  if (grant) await db.update("uploadGrants", id, { usedByVideoId: String(videoId), usedAt: new Date().toISOString() });
}

const CLAIM_WINDOW_MS = 60e3;

/** The video this caller already published from [ref], or null. */
async function publishedVideoFor({ provider, ref, ownerId }) {
  if (!provider || !ref || !ownerId) return null;
  const grant = await db.findById("uploadGrants", grantId(provider, ref));
  if (!grant || !grant.usedByVideoId || String(grant.ownerId) !== String(ownerId)) return null;
  const video = await db.findById("videos", grant.usedByVideoId).catch(() => null);
  return video && String(video.userId?._id || video.userId || "") === String(ownerId) ? video : null;
}

/**
 * Takes the grant for one publish attempt. Only one attempt can hold it at a
 * time (it lapses after a minute, for a request that died). Uploads from
 * before grants existed have no grant to take and pass.
 * @returns {Promise<{ok:true, claimId:string|null} | {ok:false, code:string, message:string}>}
 */
async function claimGrant({ provider, ref, ownerId, now = Date.now() }) {
  const id = grantId(provider, ref);
  const fs = db.getDb();
  const ref_ = fs.collection("uploadGrants").doc(id);
  const claimId = crypto.randomBytes(8).toString("hex");
  return db.withTimeout(fs.runTransaction(async (tx) => {
    const snap = await tx.get(ref_);
    if (!snap.exists) return { ok: true, claimId: null };
    const grant = snap.data();
    if (String(grant.ownerId) !== String(ownerId)) return { ok: false, code: "UPLOAD_NOT_OWNED", message: "This upload belongs to another account." };
    if (grant.usedByVideoId) return { ok: false, code: "UPLOAD_ALREADY_USED", message: "This upload is already published." };
    if (grant.claimedAt && now - Date.parse(grant.claimedAt) < CLAIM_WINDOW_MS) {
      return { ok: false, code: "UPLOAD_IN_PROGRESS", message: "This video is already being published. Please wait a moment." };
    }
    tx.update(ref_, { claimId, claimedAt: new Date(now).toISOString() });
    return { ok: true, claimId };
  }));
}

/** Gives the grant back after a failed attempt so the retry can take it. */
async function releaseClaim({ provider, ref, claimId }) {
  if (!claimId) return;
  const id = grantId(provider, ref);
  const grant = await db.findById("uploadGrants", id).catch(() => null);
  if (grant && grant.claimId === claimId && !grant.usedByVideoId) await db.update("uploadGrants", id, { claimId: null, claimedAt: null });
}

const CLEANUP_GRACE_MS = 72 * 3600e3;

/**
 * Removes what an abandoned upload left behind. A grant is looked at once its
 * publish window plus the grace period has passed (3 days after the upload):
 *   - published: only the grant record is dropped (the video keeps the file);
 *   - never published and no video points at the file: the file is deleted
 *     from Cloudflare, then the grant record.
 * Uploads that predate grants have no record here and are never touched.
 */
async function cleanupExpired({ limit = 100, now = Date.now(), deleteMedia, referencedByVideo } = {}) {
  const cutoff = new Date(now - CLEANUP_GRACE_MS).toISOString();
  const snap = await db.withTimeout(db.getDb().collection("uploadGrants").where("publishBy", "<", cutoff).orderBy("publishBy").limit(limit).get());
  const remove = deleteMedia || (async (grant) => {
    if (grant.provider === "stream") return require("./videoPipeline.service").deleteVideo(grant.ref);
    return require("./mediaCleanup").deleteR2Object(grant.ref);
  });
  const referenced = referencedByVideo || (async (grant) => {
    if (grant.provider !== "r2") return false;
    const cloudflare = require("./cloudflareStorage.service");
    const { r2PublicUrl } = require("./mediaPolicy");
    const publicUrl = r2PublicUrl(cloudflare.r2PublicDomain, grant.ref);
    const [byUrl, byRaw] = await Promise.all([db.find("videos", { videoUrl: publicUrl }), db.find("videos", { rawVideoUrl: publicUrl })]);
    return byUrl.length + byRaw.length > 0;
  });
  const out = { checked: snap.size, deletedFiles: 0, droppedRecords: 0, keptReferenced: 0, failed: 0 };
  for (const doc of snap.docs) {
    const grant = doc.data();
    try {
      if (!grant.usedByVideoId) {
        if (await referenced(grant)) { out.keptReferenced++; continue; }
        if (!(await remove(grant))) { out.failed++; continue; }
        out.deletedFiles++;
      }
      await doc.ref.delete();
      out.droppedRecords++;
    } catch (e) {
      out.failed++;
      console.error("uploadGrants.cleanupExpired:", e.message);
    }
  }
  return out;
}

module.exports = { publishedVideoFor, claimGrant, releaseClaim, cleanupExpired, r2ObjectInfo, CLAIM_WINDOW_MS, CLEANUP_GRACE_MS, recordGrant, verifyOwnedUpload, r2ObjectExists, markGrantUsed, r2KeyFromUrl, grantId, PUBLISH_WINDOW_MS };
