// Shared harness for the Firestore/Auth emulator suites.
//
// Fails closed: refuses to run unless both emulators are configured and the
// project id is a demo-* project, sets every functions/backend/.env key to an
// empty value first (dotenv never overrides an existing variable) and uses a
// freshly generated throwaway service-account key, so the real key on disk
// and real secrets are never loaded. Run through `npm run test:emulator`.
"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const PROJECT = process.env.GCLOUD_PROJECT || "demo-youpeak-audit";
// BACKEND_DIR points the suites at another copy of the backend (e.g. a replica of
// a deployed build, to replay the app's requests against what production runs).
const BACKEND = process.env.BACKEND_DIR ? path.resolve(process.env.BACKEND_DIR) : path.resolve(__dirname, "../../backend");

function guard() {
  const bad = [];
  if (!process.env.FIRESTORE_EMULATOR_HOST) bad.push("FIRESTORE_EMULATOR_HOST");
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) bad.push("FIREBASE_AUTH_EMULATOR_HOST");
  if (!/^demo-/.test(PROJECT)) bad.push("GCLOUD_PROJECT must be a demo-* project");
  if (bad.length) {
    console.error(`Refusing to run outside the emulator: ${bad.join(", ")}`);
    process.exit(2);
  }
}

function isolateEnv() {
  // Blank every key named in the local .env / .env.example (names only — values are never read).
  for (const name of [".env", ".env.example"]) {
    const file = path.join(BACKEND, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = "";
    }
  }
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  Object.assign(process.env, {
    FIREBASE_SERVICE_ACCOUNT: JSON.stringify({ type: "service_account", project_id: PROJECT, private_key: privateKey, client_email: `test@${PROJECT}.iam.gserviceaccount.com` }),
    GCLOUD_PROJECT: PROJECT,
    secretKey: "test-app-key",
    JWT_SECRET: "test-jwt",
    CRON_SECRET: "test-cron",
    SETTINGS_TTL_MS: "1",
    NODE_ENV: "test",
    RAZORPAY_KEY_ID: "rzp_test_dummy",
    RAZORPAY_KEY_SECRET: "test-razorpay-secret",
    RAZORPAY_WEBHOOK_SECRET: "test-webhook-secret",
  });
}

async function boot() {
  guard();
  isolateEnv();
  const app = require(path.join(BACKEND, "index.js"));
  const admin = require(path.join(BACKEND, "util/firebaseAdmin"));
  if (!String(admin.app().options.projectId || "").startsWith("demo-")) {
    console.error("Firebase initialised against a non-demo project — aborting.");
    process.exit(2);
  }
  const db = require(path.join(BACKEND, "util/connection"));
  const { loadSettings } = require(path.join(BACKEND, "util/loadSettings"));
  const rewardEngine = require(path.join(BACKEND, "util/rewardEngine"));
  const fsdb = db.getDb();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const today = rewardEngine.todayStr();
  const nowIso = () => new Date().toISOString();
  const attest = () => ({ at: nowIso(), signals: { platform: "android", deviceId: "present", isPhysicalDevice: true }, deviceConflict: false });

  const h = {
    app, admin, db, fsdb, base, today, nowIso, BACKEND,
    req: (rel) => require(path.join(BACKEND, rel)),
    async setSettings(over) {
      await fsdb.collection("settings").doc("main").set(over, { merge: true });
      await loadSettings(true);
    },
    async seedUser(id, extra = {}) {
      await fsdb.collection("users").doc(id).set({
        _id: id, id, fullName: id, email: `${id}@test.local`, isActive: true, isBlock: false,
        coin: 0, totalEarningAmount: 0, totalRewardCoin: 0, loginRewardCoin: 0, isNewUser: false,
        lastActivityDate: today, taskAttestation: attest(), createdAt: nowIso(), ...extra,
      });
    },
    async set(col, id, data) { await fsdb.collection(col).doc(id).set({ _id: id, id, ...data }); },
    async get(col, id) { const s = await fsdb.collection(col).doc(id).get(); return s.exists ? s.data() : null; },
    getUser: (id) => h.get("users", id),
    async where(col, field, value) { return (await fsdb.collection(col).where(field, "==", value).get()).docs.map((d) => d.data()); },
    async idToken(uid) {
      const custom = await admin.auth().createCustomToken(uid);
      const r = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: custom, returnSecureToken: true }),
      });
      const j = await r.json();
      if (!j.idToken) throw new Error("no idToken: " + JSON.stringify(j));
      return j.idToken;
    },
    async call(method, p, { token, body, headers = {}, raw } = {}) {
      const hd = { key: "test-app-key", "content-type": "application/json", ...headers };
      if (token) hd.authorization = `Bearer ${token}`;
      const r = await fetch(base + p, { method, headers: hd, body: raw !== undefined ? raw : body ? JSON.stringify(body) : undefined });
      let json = {};
      try { json = await r.json(); } catch (_) {}
      return { status: r.status, json };
    },
    mockRes() {
      let resolve;
      const done = new Promise((r) => (resolve = r));
      const res = { statusCode: 200, headersSent: false, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; this.headersSent = true; resolve(b); return this; } };
      return { res, done };
    },
    close() { server.close(); },
  };
  return h;
}

function runner() {
  const results = [];
  async function check(id, name, fn) {
    const t0 = Date.now();
    try {
      await fn();
      results.push({ id, name, ok: true, ms: Date.now() - t0 });
      console.log(`PASS ${id} ${name}`);
    } catch (e) {
      results.push({ id, name, ok: false, ms: Date.now() - t0, error: e.message });
      console.log(`FAIL ${id} ${name}\n     ${String(e.message).split("\n").join("\n     ")}`);
    }
  }
  return { results, check };
}

module.exports = { boot, runner, assert };
