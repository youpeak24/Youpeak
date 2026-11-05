/**
 * Load the admin-managed `settings` document from Firestore into
 * global.settingJSON, merged over the static defaults in ../setting.js.
 *
 * The rest of the codebase reads global.settingJSON everywhere but nothing was
 * populating it from Firestore on boot — so on a fresh (serverless) instance
 * every runtime setting fell back to the static file, and things stored only in
 * the settings doc (payment keys, zego config, currency, app links, …) were
 * invisible. This fixes that.
 */
"use strict";

const db = require("./connection");
const defaults = require("../setting");

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge(base, override) {
  const out = { ...base };
  for (const [k, v] of Object.entries(override || {})) {
    if (v === undefined || v === null) continue;
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out;
}

let lastLoadedAt = 0;
// Short enough that an admin config change reaches every warm serverless
// instance within half a minute; one small doc read per instance per 30 s.
const TTL_MS = Number(process.env.SETTINGS_TTL_MS) || 30 * 1000;

async function loadSettings(force = false) {
  if (!force && Date.now() - lastLoadedAt < TTL_MS && global.settingJSON) {
    return global.settingJSON;
  }
  try {
    const doc = await db.findOne("settings", {});
    global.settingJSON = doc ? deepMerge(defaults, doc) : { ...defaults };
  } catch (e) {
    if (!global.settingJSON) global.settingJSON = { ...defaults };
    console.warn("loadSettings: using defaults —", e.message);
  }
  lastLoadedAt = Date.now();
  return global.settingJSON;
}

// Ensure global.settingJSON is never undefined, even before the first async load.
if (!global.settingJSON) global.settingJSON = { ...defaults };

// Express middleware: refresh settings (respecting the TTL) before handling.
//
// Cron routes are skipped: they authenticate with CRON_SECRET first and then load settings themselves, so an
// unauthenticated request to /cron/* performs no database access at all.
const CRON_PATH = /^\/(?:api\/)?cron(?:\/|$)/i;

function settingsMiddleware(req, res, next) {
  const path = String(req.originalUrl || req.url || "").split("?")[0];
  if (CRON_PATH.test(path)) return next();
  loadSettings().finally(() => next());
}

module.exports = { loadSettings, settingsMiddleware, deepMerge };
