"use strict";
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { randomUUID } = require("crypto");
const staging = path.join(os.tmpdir(), "youpeak-uploads");
// Leave room for multipart fields inside Vercel's 4.5 MB body limit.
// Larger videos use direct-to-Cloudflare upload, not this function.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => fs.mkdir(staging, { recursive: true }, (error) => cb(error, staging)),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase().replace(/[^a-z0-9.]/g, "").slice(0, 12);
    req.generatedFileName = `${randomUUID()}${ext}`;
    cb(null, req.generatedFileName);
  },
});
const receive = multer({ storage, limits: { fileSize: 4 * 1024 * 1024, files: 1, fields: 12, fieldSize: 16 * 1024 } }).single("content");
module.exports = (req, res, next) => receive(req, res, (error) => {
  if (!error) return next();
  const large = error.code === "LIMIT_FILE_SIZE";
  return res.status(large ? 413 : 400).json({ status: false, code: large ? "UPLOAD_TOO_LARGE" : "INVALID_UPLOAD", message: large ? "Use direct upload for videos. Other files must be smaller than 4 MB." : "Please upload one valid file." });
});
