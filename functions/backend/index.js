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
loadSettings(true)
  .then(() => require("./util/systemConfig.service").publishSystemConfigs())
  .catch(() => {}); // warm it on boot
global.updateSettingFile = (settingData) => { global.settingJSON = settingData; };

// keep global.settingJSON fresh (respects SETTINGS_TTL_MS) before each request
app.use(settingsMiddleware);

const routes = require("./routes/index");
app.use("/", routes);
app.use("/api", routes);

// ── Deep-link verification (Android App Links / iOS Universal Links) ──
// The settings doc still holds the original template's placeholders
// (package "com.demo", a fake fingerprint, appID "W5T948BC35.com.demo"), so
// anything referencing com.demo is ignored in favour of YouPeak's real
// identity. Env vars override for when the Play App Signing key or the iOS
// team/bundle ID are known. Only /share is claimed — the same domain also
// serves the admin panel and API, which must keep opening in the browser.
const ANDROID_PACKAGE = process.env.ANDROID_APP_PACKAGE || "com.YouPeak.Live1";
// SHA-256 of youpeak-release-key.jks (android/key.properties). A Play Store
// install is re-signed by Google — add that key's fingerprint here too
// (comma-separated) or App Links won't verify for Play installs.
const ANDROID_CERT_SHA256 = (process.env.ANDROID_CERT_SHA256 ||
  "50:C0:A1:30:DE:3B:E1:0A:29:6B:85:52:0F:F2:C2:70:C0:C0:70:64:27:23:37:2E:56:4E:7E:D9:A0:C0:F9:86")
  .split(",").map((s) => s.trim()).filter(Boolean);
const IOS_APP_IDS = (process.env.IOS_APP_IDS || "").split(",").map((s) => s.trim()).filter(Boolean); // TEAMID.bundle.id
const isTemplatePlaceholder = (v) => JSON.stringify(v || "").includes("com.demo");

app.get("/.well-known/assetlinks.json", (req, res) => {
  const configured = global?.settingJSON?.androidAssetLinks;
  if (Array.isArray(configured) && configured.length && !isTemplatePlaceholder(configured)) {
    return res.status(200).json(configured);
  }
  return res.status(200).json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: { namespace: "android_app", package_name: ANDROID_PACKAGE, sha256_cert_fingerprints: ANDROID_CERT_SHA256 },
    },
  ]);
});

app.get("/.well-known/apple-app-site-association", (req, res) => {
  const configured = global?.settingJSON?.appleAppSiteAssociation;
  if (configured && configured.applinks && !isTemplatePlaceholder(configured)) {
    return res.status(200).json(configured);
  }
  return res.status(200).json({
    applinks: {
      apps: [],
      details: IOS_APP_IDS.map((appID) => ({ appID, paths: ["/share", "/share/*"] })),
    },
  });
});

// Landing page for shared links (https://youpeak.app/share?…). With the app
// installed and App Links verified, the OS opens the app and this never
// loads; without it, it tries the youpeak:// scheme, then offers the
// download link. Previously /share fell through to the admin panel's
// index.html, so a shared video opened the admin login screen.
app.get("/share", (req, res) => {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query || {})) if (typeof v === "string") params.set(k, v);
  const appLink = `youpeak://open?${params.toString()}`;
  const downloadLink = global?.settingJSON?.androidAppLink || "";
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Open in YouPeak</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a}
  .card{width:min(360px,calc(100% - 32px));background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:28px 24px;text-align:center}
  h1{font-size:20px;margin:0 0 8px}p{font-size:14px;color:#64748b;margin:0 0 20px;line-height:1.5}
  a.btn{display:block;padding:12px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;margin-top:10px}
  .primary{background:#059669;color:#fff}.secondary{border:1px solid #e2e8f0;color:#0f172a}
</style></head><body><div class="card">
<h1>YouPeak</h1><p>This video opens in the YouPeak app.</p>
<a class="btn primary" href="${esc(appLink)}">Open in the app</a>
${downloadLink ? `<a class="btn secondary" href="${esc(downloadLink)}">Download YouPeak</a>` : ""}
</div><script>setTimeout(function(){location.href=${JSON.stringify(appLink).replace(/</g, "\\u003c")};},300);</script>
</body></html>`);
});

app.get(["/uploads/videos/:filename", "/uploads/shorts/:filename", "/uploads/bites/:filename", "/videos/:filename", "/video/stream/:filename"], require("./controllers/client/mediaDelivery.controller").redirect);

// Never advertise ephemeral serverless files as persistent application media.
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) app.use("/uploads", express.static(path.join(__dirname, "uploads")));
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
