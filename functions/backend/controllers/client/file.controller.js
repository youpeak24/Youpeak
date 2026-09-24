"use strict";

const fs = require("fs");
const cloudflareStorageService = require("../../util/cloudflareStorage.service");
const videoPipeline = require("../../util/videoPipeline.service");
const imageStorage = require("../../util/imageStorage.service");
const firebaseSyncService = require("../../util/firebaseSync.service");

const VIDEO_EXT = /\.(mp4|mov|m3u8|webm|avi|mkv|flv|wmv|3gp|m4v)$/i;
// Server-side push to Stream only for small files; large videos must use the
// direct-upload URL (getStreamUploadUrl) so they never touch our function.
const MAX_SERVER_SIDE_VIDEO_BYTES = 40 * 1024 * 1024; // 40 MB

function isVideoFile(file, name) {
  return (
    file.storageProvider === "cloudflareR2" ||
    (file.mimetype && file.mimetype.startsWith("video/")) ||
    VIDEO_EXT.test(file.originalname || name || "")
  );
}

// ── One-time Cloudflare Stream direct-upload URL (preferred path for the app) ──
exports.getStreamUploadUrl = async (req, res) => {
  try {
    if (!videoPipeline.isConfigured()) {
      return res.status(200).json({ status: false, message: "Video streaming is not configured." });
    }
    const b = { ...req.query, ...req.body };
    const maxDurationSeconds = Number(b.maxDurationSeconds) || 3600;
    const meta = { userId: String(b.userId || ""), kind: b.kind || "video" };

    const up = await videoPipeline.createDirectUpload({ maxDurationSeconds, meta });
    return res.status(200).json({
      status: true,
      message: "Upload URL created.",
      uploadURL: up.uploadURL,
      streamUid: up.uid,
      hlsUrl: up.hlsUrl,
      thumbnailUrl: up.thumbnailUrl,
    });
  } catch (error) {
    console.error("getStreamUploadUrl error:", error.response?.data || error.message);
    return res.status(200).json({ status: false, message: "Could not create upload URL." });
  }
};

// ── Direct-to-R2 presigned upload URL (videos/shorts) ──
// The client PUTs the raw file straight to R2 with this URL — our function
// never sees the file body, so Vercel's 4.5MB request-body cap never applies.
// Always available since it only needs R2 (already configured), unlike
// getStreamUploadUrl which needs Cloudflare Stream credentials.
exports.getDirectUploadUrl = async (req, res) => {
  try {
    if (!cloudflareStorageService.isConfigured()) {
      return res.status(200).json({ status: false, message: "Storage is not configured." });
    }
    const b = { ...req.query, ...req.body };
    const folder =
      String(b.folderStructure || "misc")
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "")
        .slice(0, 40) || "misc";
    const ext = String(b.keyName || "").match(/\.[a-z0-9]+$/i)?.[0] || ".mp4";
    const destinationKey = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const contentType = b.contentType || "video/mp4";

    const { uploadURL, publicUrl } = await cloudflareStorageService.getPresignedPutUrl(destinationKey, contentType);
    return res.status(200).json({ status: true, message: "Upload URL created.", uploadURL, publicUrl, key: destinationKey });
  } catch (error) {
    console.error("getDirectUploadUrl error:", error.message);
    return res.status(200).json({ status: false, message: "Could not create upload URL." });
  }
};

// ── Legacy multipart upload (images + fallback for small videos) ──
exports.uploadContent = async (req, res) => {
  try {
    if (!req.body?.folderStructure) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }
    if (!req?.file) {
      return res.status(200).json({ status: false, message: "Please upload valid files." });
    }

    const fileName = req.generatedFileName || req.file.filename || req.file.key;
    // Normalise to a safe lowercase slug so different clients can't create
    // parallel folders (Videos/ vs videos/) or escape the prefix.
    const folder =
      String(req.body.folderStructure || "misc")
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "")
        .slice(0, 40) || "misc";
    const filePath = req.file.path;
    const isVideo = isVideoFile(req.file, fileName);

    // ── VIDEO / SHORTS ──
    if (isVideo) {
      const size = req.file.size || (filePath && fs.existsSync(filePath) ? fs.statSync(filePath).size : 0);

      // 1. small enough + Stream configured -> push straight to Cloudflare Stream
      if (videoPipeline.isConfigured() && size > 0 && size <= MAX_SERVER_SIDE_VIDEO_BYTES) {
        try {
          const r = await videoPipeline.uploadFromPath(filePath, { meta: { folder, fileName } });
          cleanupTmp(filePath);
          return res.status(200).json({
            status: true,
            message: "Video sent to Cloudflare Stream for transcoding.",
            storageProvider: "stream",
            streamUid: r.uid,
            streamStatus: r.status || "queued",
            url: r.hlsUrl,
            hlsUrl: r.hlsUrl,
            thumbnailUrl: r.thumbnailUrl,
          });
        } catch (streamErr) {
          console.error("Stream upload failed, falling back to R2:", streamErr.response?.data || streamErr.message);
        }
      }

      // 2. fallback -> raw object in R2 (played directly, no adaptive quality)
      const r2Url = await cloudflareStorageService.uploadToCloudflareR2(
        filePath, `${folder}/${fileName}`, req.file.mimetype
      );
      cleanupTmp(filePath);
      const url = r2Url || `${process.env.baseURL || ""}/uploads/${fileName}`;

      // Optionally hand it to Stream to transcode from the R2 URL.
      let streamUid = null;
      if (videoPipeline.isConfigured() && r2Url) {
        try {
          const copy = await videoPipeline.copyFromUrl(r2Url, { meta: { folder, fileName } });
          streamUid = copy.uid;
        } catch (e) { /* leave as raw R2 */ }
      }

      await firebaseSyncService.syncMetadata("videos_metadata", fileName, {
        fileName, url, storageProvider: streamUid ? "stream" : "r2", streamUid,
        mimeType: req.file.mimetype, size, folderStructure: folder,
      });

      return res.status(200).json({
        status: true,
        message: streamUid ? "Video stored in R2 and queued for Stream transcoding." : "Video uploaded to Cloudflare R2.",
        storageProvider: streamUid ? "stream" : "r2",
        streamUid,
        url: streamUid ? videoPipeline.playbackUrls(streamUid).hlsUrl : url,
        rawVideoUrl: url,
      });
    }

    // ── IMAGES / OTHER → Firebase Storage ──
    let url = null;
    let provider = "local";
    if (imageStorage.isConfigured()) {
      try {
        url = await imageStorage.uploadImage(filePath, folder, fileName, req.file.mimetype);
        provider = "firebase";
      } catch (e) {
        console.error("Firebase Storage upload failed:", e.message);
      }
    }
    // last-resort fallback so the request never fails outright
    if (!url && cloudflareStorageService.isConfigured()) {
      url = await cloudflareStorageService.uploadToCloudflareR2(filePath, `${folder}/${fileName}`, req.file.mimetype);
      provider = "r2";
    }
    cleanupTmp(filePath);
    url = url || `${process.env.baseURL || ""}/uploads/${fileName}`;

    await firebaseSyncService.syncMetadata("app_assets", fileName, {
      fileName, url, storageProvider: provider,
      mimeType: req.file.mimetype, size: req.file.size, folderStructure: folder,
    });

    return res.status(200).json({ status: true, message: "Asset uploaded.", storageProvider: provider, url });
  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

function cleanupTmp(p) {
  try { if (p && fs.existsSync(p)) fs.unlinkSync(p); } catch (e) { /* ignore */ }
}
