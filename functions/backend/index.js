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

// Safe Body Parser for Vercel Serverless Function Bridge
app.use((req, res, next) => {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string") {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {}
    }
    return next();
  }
  express.json({ limit: "50mb" })(req, res, (err) => {
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
require("dotenv").config({ path: ".env" });

//connection.js (100% Firebase Firestore)
const db = require("./util/connection");

//fs
const fs = require("fs");

//settingJson
const settingJson = require("./setting");

const os = require("os");

//Declare global variable
global.settingJSON = settingJson;

//Declare the function as a global variable to update the setting.js file
global.updateSettingFile = (settingData) => {
  try {
    const settingJSON = JSON.stringify(settingData, null, 2);
    const tmpFile = path.join(os.tmpdir(), "setting.js");
    fs.writeFileSync(tmpFile, `module.exports = ${settingJSON};`, "utf8");
  } catch (e) {}
  global.settingJSON = settingData;
};

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

// Cloudflare R2 Video Stream Proxy Route (with Range support for video players)
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const r2StreamClient = new S3Client({
  region: "auto",
  endpoint: "https://da97865a5caa8f2b10c795c92912615e.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "cdb9bca482d4459a3d9a99533d71939b",
    secretAccessKey: "9d2946e08c57db8ed33ef5d29044d066c73274b103d26d3ae43e7ba2a12582df",
  },
});

app.get(["/uploads/videos/:filename", "/uploads/Videos/:filename", "/videos/:filename", "/video/stream/:filename"], async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const r2Key = filename.includes("/") ? filename : `videos/${filename}`;
    const range = req.headers.range;

    const cmdInput = { Bucket: "youpeak-videos", Key: r2Key };
    if (range) cmdInput.Range = range;

    const cmd = new GetObjectCommand(cmdInput);
    const r2Res = await r2StreamClient.send(cmd);

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
