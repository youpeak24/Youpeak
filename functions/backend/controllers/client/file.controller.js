"use strict";
const fs = require("fs");
const { randomUUID } = require("crypto");
const cloudflare = require("../../util/cloudflareStorage.service");
const pipeline = require("../../util/videoPipeline.service");
const firebaseAssets = require("../../util/imageStorage.service");
const metadata = require("../../util/firebaseSync.service");
const { isVideoFile, safeFolder, r2PublicUrl, MAX_VIDEO_BYTES } = require("../../util/mediaPolicy");
const uploadGrants = require("../../util/uploadGrants");

exports.getStreamUploadUrl = async (req, res) => {
  try {
    if (!pipeline.isConfigured()) return res.status(503).json({ status: false, code: "STREAM_NOT_CONFIGURED", message: "Video streaming is not configured." });
    const body = { ...req.query, ...req.body };
    const duration = body.maxDurationSeconds === undefined ? 3600 : Number(body.maxDurationSeconds);
    if (!Number.isInteger(duration) || duration < 1 || duration > 21600) return res.status(400).json({ status: false, message: "Video duration must be between 1 and 21600 seconds." });
    const up = await pipeline.createDirectUpload({ maxDurationSeconds: duration, meta: { userId: String(req.appUserId || req.admin?._id || ""), kind: body.kind === "short" ? "short" : "video" } });
    await uploadGrants.recordGrant({ provider: "stream", ref: up.uid, ...{ ownerId: String(req.appUserId || req.admin?._id || ""), ownerType: req.appUserId ? "user" : "admin" }, contentType: "video/*", kind: body.kind === "short" ? "short" : "video" });
    return res.status(200).json({ status: true, message: "Upload URL created.", uploadURL: up.uploadURL, streamUid: up.uid, hlsUrl: up.hlsUrl, thumbnailUrl: up.thumbnailUrl });
  } catch (error) {
    console.error("Stream upload URL failed:", error.code || error.message);
    return res.status(502).json({ status: false, message: "Could not create upload URL." });
  }
};

exports.getDirectUploadUrl = async (req, res) => {
  try {
    if (!cloudflare.isConfigured()) return res.status(503).json({ status: false, code: "R2_NOT_CONFIGURED", message: "Video storage is not configured." });
    const body = { ...req.query, ...req.body };
    const contentType = String(body.contentType || "video/mp4").toLowerCase();
    const extensions = { "video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov", "video/x-m4v": ".m4v", "video/x-matroska": ".mkv", "video/3gpp": ".3gp", "video/x-msvideo": ".avi" };
    if (!extensions[contentType]) return res.status(400).json({ status: false, code: "INVALID_VIDEO_TYPE", message: "This endpoint accepts video files only." });
    // The size is declared by the app (older apps don't send it). R2 can't
    // enforce it on a presigned PUT, so publishing re-checks the stored object.
    if (body.fileSize !== undefined) {
      const size = Number(body.fileSize);
      if (!Number.isFinite(size) || size <= 0) return res.status(400).json({ status: false, code: "INVALID_FILE_SIZE", message: "The video file is empty." });
      if (size > MAX_VIDEO_BYTES) return res.status(413).json({ status: false, code: "FILE_TOO_LARGE", message: `Videos can be at most ${Math.floor(MAX_VIDEO_BYTES / (1024 * 1024 * 1024))} GB.` });
    }
    const key = `${safeFolder(body.folderStructure)}/${randomUUID()}${extensions[contentType]}`;
    const { uploadURL, publicUrl } = await cloudflare.getPresignedPutUrl(key, contentType);
    await uploadGrants.recordGrant({ provider: "r2", ref: key, ...{ ownerId: String(req.appUserId || req.admin?._id || ""), ownerType: req.appUserId ? "user" : "admin" }, contentType });
    return res.status(200).json({ status: true, message: "Upload URL created.", storageProvider: "r2", uploadURL, publicUrl, key, expiresInSeconds: 900, maxBytes: MAX_VIDEO_BYTES });
  } catch (error) {
    console.error("R2 upload URL failed:", error.code || error.message);
    const config = error.code === "R2_DELIVERY_NOT_CONFIGURED";
    return res.status(config ? 503 : 502).json({ status: false, code: config ? error.code : "UPLOAD_UNAVAILABLE", message: config ? "The video delivery domain needs configuration. Please contact support." : "Could not create upload URL." });
  }
};

// The app gave up on an upload (cancelled, or it failed before publishing):
// delete this caller's own unpublished files right away instead of waiting
// for the daily cleanup. Only unused uploads that belong to the caller are
// removed (video.controller discardOwnUpload), so this cannot delete a video
// that was published.
exports.abandonUpload = async (req, res) => {
  try {
    const { discardOwnUpload } = require("./video.controller")._internal;
    for (const url of [req.body?.videoUrl, req.body?.imageUrl]) {
      if (typeof url === "string" && url.length > 0 && url.length < 2048) await discardOwnUpload(req, url);
    }
    return res.status(200).json({ status: true, message: "Upload discarded." });
  } catch (error) {
    console.error("Abandon upload failed:", error.code || error.message);
    return res.status(502).json({ status: false, message: "Could not discard the upload." });
  }
};

// Both admin and app use this policy. /tmp is staging, never persistence.
exports.uploadContent = async (req, res) => {
  const localPath = req.file?.path;
  try {
    if (!req.body?.folderStructure || !req.file || !localPath) return res.status(400).json({ status: false, message: "Please upload a valid file and folder." });
    const fileName = req.generatedFileName || req.file.filename;
    const folder = safeFolder(req.body.folderStructure);
    const video = isVideoFile(req.file);
    let result;
    if (video) {
      if (!cloudflare.isConfigured()) return res.status(503).json({ status: false, message: "Video storage is not configured." });
      r2PublicUrl(cloudflare.r2PublicDomain, `${folder}/${fileName}`);
      const url = await cloudflare.uploadToCloudflareR2(localPath, `${folder}/${fileName}`, req.file.mimetype);
      if (!url) throw new Error("Cloudflare upload failed.");
      result = { url, storageProvider: "r2" };
      await uploadGrants.recordGrant({ provider: "r2", ref: `${folder}/${fileName}`, ...{ ownerId: String(req.appUserId || req.admin?._id || ""), ownerType: req.appUserId ? "user" : "admin" }, contentType: req.file.mimetype });
    } else {
      if (!firebaseAssets.isConfigured()) return res.status(503).json({ status: false, message: "Asset storage is not configured." });
      const url = await firebaseAssets.uploadImage(localPath, folder, fileName, req.file.mimetype);
      if (!url) throw new Error("Firebase asset upload failed.");
      result = { url, storageProvider: "firebase" };
    }
    const synced = await metadata.syncMetadata(video ? "videos_metadata" : "app_assets", fileName, {
      fileName, ...result, mimeType: req.file.mimetype, size: req.file.size, folderStructure: folder,
      uploadedBy: String(req.appUserId || req.admin?._id || ""),
    });
    if (!synced) throw new Error("Upload metadata could not be saved.");
    return res.status(200).json({ status: true, message: "File uploaded.", ...result });
  } catch (error) {
    console.error("Media upload failed:", error.code || error.message);
    return res.status(502).json({ status: false, message: "Upload could not be completed. Please try again." });
  } finally {
    if (localPath) { try { await fs.promises.unlink(localPath); } catch (_) { /* already removed */ } }
  }
};
