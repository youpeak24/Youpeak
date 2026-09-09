"use strict";

const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const fs = require("fs");
const path = require("path");

const createS3Instance = (hostname, region, accessKeyId, secretAccessKey) => {
  return new S3Client({
    credentials: {
      accessKeyId: accessKeyId || "placeholder",
      secretAccessKey: secretAccessKey || "placeholder",
    },
    endpoint: hostname || "https://s3.amazonaws.com",
    region: region || "auto",
    forcePathStyle: true,
  });
};

const generateFileName = (file) => {
  const ext = path.extname(file.originalname);
  const name = path.basename(file.originalname, ext);
  const shortName = name.substring(0, 10);
  return `${Date.now()}_${shortName}${ext}`;
};

const os = require("os");
const localStoragePath = path.join(os.tmpdir(), "uploads");
try {
  if (!fs.existsSync(localStoragePath)) {
    fs.mkdirSync(localStoragePath, { recursive: true });
  }
} catch (e) {}

/**
 * Check if a file is a video based on MIME type or extension.
 * Videos & Shorts → Cloudflare R2
 * Everything else → Local/Firebase
 */
const isVideoFile = (file) => {
  if (!file) return false;
  if (file.mimetype && file.mimetype.startsWith("video/")) return true;
  const videoExts = /\.(mp4|mov|m3u8|webm|avi|mkv|flv|wmv|3gp)$/i;
  if (videoExts.test(file.originalname || "")) return true;
  return false;
};

const getActiveStorage = (file) => {
  const settings = global.settingJSON || {};
  const storage = settings.storage || {};

  // Only route VIDEO files to Cloudflare R2. All other files go to local/Firebase.
  if (isVideoFile(file)) {
    if (storage.cloudflareR2 || settings.r2AccountId || settings.r2AccessKeyId) return "cloudflareR2";
  }

  // Non-video files always go to local storage (for Firebase sync)
  if (storage.awsS3) return "aws";
  if (storage.digitalOcean) return "digitalocean";
  return "local";
};

const uploadMiddleware = (req, res, next) => {
  try {
    const settings = global.settingJSON || {};

    // Step 1: Always receive the file to local disk first
    const localStorage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, localStoragePath),
      filename: (req, file, cb) => {
        if (!req.generatedFileName) {
          req.generatedFileName = generateFileName(file);
        }
        cb(null, req.generatedFileName);
      },
    });

    const localUpload = multer({ storage: localStorage }).single("content");

    localUpload(req, res, async (err) => {
      if (err) {
        console.error("Multer local upload error:", err);
        return next(err);
      }

      if (!req.file) {
        // No file uploaded, let the controller handle the error
        return next();
      }

      // Step 2: Determine storage based on file type
      const activeStorage = getActiveStorage(req.file);

      if (activeStorage === "cloudflareR2") {
        // 📹 VIDEO files ONLY → Upload to Cloudflare R2 from local disk
        console.log(`🎬 Video detected: ${req.file.originalname} → Routing to Cloudflare R2`);
        req.file.storageProvider = "cloudflareR2";
      } else {
        // 📄 NON-VIDEO files → Stay on local disk (Firebase sync in controller)
        console.log(`📄 Non-video detected: ${req.file.originalname} → Routing to Local/Firebase`);
        req.file.storageProvider = "local";
      }

      next();
    });
  } catch (error) {
    console.error("Upload Middleware Error:", error);
    next(error);
  }
};

module.exports = uploadMiddleware;

