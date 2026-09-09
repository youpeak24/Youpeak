//dns resolution fix for Node 18+ & Firebase Cloud Functions
const dns = require("dns");

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

//express
const express = require("express");
const app = express();

//cors
const cors = require("cors");

app.use(cors({ origin: true, credentials: true }));
app.options("*", cors());

// Webhooks need the raw body for signature verification — handle them before
// the JSON parser consumes the stream.
const RAW_WEBHOOK_PATHS = [
  "/payment/webhook", "/api/payment/webhook",
  "/stream/webhook", "/api/stream/webhook",
];
app.use(RAW_WEBHOOK_PATHS, express.raw({ type: "*/*", limit: "5mb" }));

// Safe Body Parser for Vercel Serverless Function Bridge
app.use((req, res, next) => {
  if (Buffer.isBuffer(req.body)) return next(); // raw webhook body, leave it
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string") {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {}
    }
    return next();
  }
  express.json({ limit: "50mb", verify: (r, _res, buf) => { r.rawBody = buf; } })(req, res, (err) => {
    next();
  });
});

app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    return next();
  }
  express.urlencoded({ limit: "50mb", extended: true })(req, res, (err) => {
    next();
  });
});

//logging middleware
var logger = require("morgan");
app.use(logger("dev"));

//path
const path = require("path");

//dotenv
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("./util/validateEnv")();

//connection.js (100% Firebase Firestore)
const db = require("./util/connection");

//fs
const fs = require("fs");

//settings: static defaults + the admin-managed Firestore settings doc
const settingJson = require("./setting");
const { loadSettings, settingsMiddleware } = require("./util/loadSettings");
global.settingJSON = { ...settingJson };
loadSettings(true).catch(() => {}); // warm it on boot
global.updateSettingFile = (settingData) => { global.settingJSON = settingData; };

// keep global.settingJSON fresh (respects SETTINGS_TTL_MS) before each request
app.use(settingsMiddleware);

const routes = require("./routes/index");
app.use("/", routes);
app.use("/api", routes);

app.get("/.well-known/assetlinks.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).json(global?.settingJSON?.androidAssetLinks || []);
});

app.get("/.well-known/apple-app-site-association", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).json(global?.settingJSON?.appleAppSiteAssociation || {});
});

// Cloudflare R2 Video Stream Proxy Route (with Range support for video players).
// Legacy path for raw MP4 objects still in R2 — new uploads use Cloudflare Stream.
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const cloudflareStorage = require("./util/cloudflareStorage.service");

app.get(["/uploads/videos/:filename", "/uploads/Videos/:filename", "/videos/:filename", "/video/stream/:filename"], async (req, res, next) => {
  try {
    if (!cloudflareStorage.isConfigured()) return next();
    const filename = req.params.filename;
    const r2Key = filename.includes("/") ? filename : `videos/${filename}`;
    const range = req.headers.range;

    const cmdInput = { Bucket: cloudflareStorage.r2BucketName, Key: r2Key };
    if (range) cmdInput.Range = range;

    const cmd = new GetObjectCommand(cmdInput);
    const r2Res = await cloudflareStorage.getS3Client().send(cmd);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");

    if (range && r2Res.ContentRange) {
      res.status(206);
      res.setHeader("Content-Range", r2Res.ContentRange);
      res.setHeader("Accept-Ranges", "bytes");
    } else {
      res.status(200);
    }

    res.setHeader("Content-Type", r2Res.ContentType || "video/mp4");
    if (r2Res.ContentLength) {
      res.setHeader("Content-Length", r2Res.ContentLength);
    }

    r2Res.Body.pipe(res);
  } catch (err) {
    next();
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// Global Express Error Handler to catch all unhandled errors and return JSON
app.use((err, req, res, next) => {
  console.error("Express Global Error:", err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(200).json({
    status: false,
    message: err.message || "An unexpected error occurred",
  });
});

module.exports = app;
