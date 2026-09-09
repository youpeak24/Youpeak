"use strict";

const cloudflareStorageService = require("../../util/cloudflareStorage.service");
const firebaseSyncService = require("../../util/firebaseSync.service");

// uploadContent - Strict Routing (Videos/Shorts → Cloudflare R2, Others → Firebase)
exports.uploadContent = async (req, res) => {
  try {
    if (!req.body?.folderStructure) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details." });
    }

    if (!req?.file) {
      return res.status(200).json({ status: false, message: "Please upload valid files." });
    }

    let url = "";
    const fileName = req.generatedFileName || req.file.filename || req.file.key;
    const folder = req.body.folderStructure;
    const isVideo = req.file.storageProvider === "cloudflareR2" ||
      (req.file.mimetype && req.file.mimetype.startsWith("video/")) ||
      /\.(mp4|mov|m3u8|webm|avi|mkv|flv|wmv|3gp)$/i.test(req.file.originalname || fileName);

    if (isVideo) {
      // 📹 VIDEOS & SHORTS ONLY → Cloudflare R2 Storage
      console.log(`🎬 Video file detected (${req.file.originalname}). Uploading exclusively to Cloudflare R2...`);

      const r2Url = await cloudflareStorageService.uploadToCloudflareR2(
        req.file.path,
        `${folder}/${fileName}`,
        req.file.mimetype
      );
      url = r2Url || `${process.env.baseURL || ""}/uploads/${fileName}`;

      // Save video metadata in Firebase Firestore
      await firebaseSyncService.syncMetadata("videos_metadata", fileName, {
        fileName,
        url,
        storageProvider: "Cloudflare",
        mimeType: req.file.mimetype,
        size: req.file.size,
        folderStructure: folder,
      });

      return res.status(200).json({
        status: true,
        message: "Video uploaded exclusively to Cloudflare R2!",
        storageProvider: "Cloudflare",
        url,
      });
    } else {
      // 📄 ALL OTHER DATA (images, thumbnails, etc.) → Firebase / Local
      console.log(`📄 Non-video data detected (${req.file.originalname}). Keeping on Firebase/Local...`);
      url = `${process.env.baseURL || ""}/uploads/${fileName}`;

      // Sync metadata to Firebase Firestore
      await firebaseSyncService.syncMetadata("app_assets", fileName, {
        fileName,
        url,
        storageProvider: "Firebase",
        mimeType: req.file.mimetype,
        size: req.file.size,
        folderStructure: folder,
      });

      return res.status(200).json({
        status: true,
        message: "Asset uploaded to Firebase/Local storage!",
        storageProvider: "Firebase",
        url,
      });
    }
  } catch (error) {
    console.error("Upload Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

