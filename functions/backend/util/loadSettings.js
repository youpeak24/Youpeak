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
const TTL_MS = Number(process.env.SETTINGS_TTL_MS) || 5 * 60 * 1000;

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
function settingsMiddleware(req, res, next) {
  loadSettings().finally(() => next());
}

module.exports = { loadSettings, settingsMiddleware, deepMerge };
