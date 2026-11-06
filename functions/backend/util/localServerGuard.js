/**
 * Safety guard for the LOCAL standalone server (server.js — `npm start` /
 * `npm run dev`). Production runs functions/api/index.js on Vercel and never loads this.
 *
 * Without it, a plain local start picks up serviceAccountKey.json and talks
 * to the real Firebase project. The server now starts only when one of these
 * holds:
 *   • it is pointed at the Firestore emulator with a demo-* project
 *     (what tools/local-dev/start.js and the test harness do);
 *   • NODE_ENV=production (an intentional production-style host);
 *   • ALLOW_LIVE_FIREBASE=true (an explicit, deliberate override).
 */
"use strict";

const path = require("path");

// Project id the backend would use — same order as util/firebaseAdmin.js,
// without initialising Firebase or reading any secret beyond project_id.
function resolveProjectId(env = process.env, readKey = defaultReadKey) {
  if (env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
      if (sa && sa.project_id) return String(sa.project_id);
    } catch (e) { /* invalid JSON: firebaseAdmin falls through to the key files */ }
  }
  for (const rel of ["../serviceAccountKey.json", "../../serviceAccountKey.json", "../../../serviceAccountKey.json"]) {
    const projectId = readKey(path.join(__dirname, rel));
    if (projectId) return projectId;
  }
  return env.FIREBASE_PROJECT_ID || env.GCP_PROJECT || env.GCLOUD_PROJECT || "youpeak-9ff65";
}

function defaultReadKey(file) {
  try {
    return String(require(file).project_id || "") || null;
  } catch (e) {
    return null;
  }
}

function checkLocalServer(env = process.env, readKey = defaultReadKey) {
  if (env.NODE_ENV === "production") return { ok: true, reason: "NODE_ENV=production" };
  if (env.ALLOW_LIVE_FIREBASE === "true") return { ok: true, reason: "ALLOW_LIVE_FIREBASE=true" };
  const projectId = resolveProjectId(env, readKey);
  if (env.FIRESTORE_EMULATOR_HOST && /^demo-/.test(projectId)) return { ok: true, reason: `emulator (${projectId})` };
  return { ok: false, projectId };
}

function guardLocalServer() {
  const result = checkLocalServer();
  if (result.ok) return;
  console.error(
    `\n⛔ Refusing to start: this local server would use the live Firebase project "${result.projectId}".\n` +
      "   Run the isolated local stack instead:  node tools/local-dev/start.js\n" +
      "   (or set ALLOW_LIVE_FIREBASE=true if you really mean to use live data).\n"
  );
  process.exit(1);
}

module.exports = guardLocalServer;
module.exports.checkLocalServer = checkLocalServer;
module.exports.resolveProjectId = resolveProjectId;
