// Runs the whole admin panel locally, fully isolated from production:
//   Firestore emulator (+ its UI) -> seed -> backend API -> admin web app.
//
//   node local-dev/start.js           start (keeps data from the last run)
//   node local-dev/start.js --reset   start with a fresh copy of the demo data
//
// Stop with Ctrl+C — the emulator saves its data to local-dev/emulator-data/ on exit.
"use strict";

const { spawn, execSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const net = require("net");
const path = require("path");
const cfg = require("./config");

const isWin = process.platform === "win32";
const children = [];
let shuttingDown = false;

function log(name, chunk) {
  for (const line of String(chunk).split(/\r?\n/)) if (line.trim()) console.log(`[${name}] ${line}`);
}

function run(name, cmd, args, opts) {
  const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...opts });
  child.stdout.on("data", (d) => log(name, d));
  child.stderr.on("data", (d) => log(name, d));
  child.on("exit", (code) => {
    if (!shuttingDown) {
      console.error(`\n[${name}] exited unexpectedly (code ${code}) — stopping everything.`);
      shutdown(1);
    }
  });
  children.push(child);
  return child;
}

function portInUse(port) {
  return new Promise((resolve) => {
    const s = net.connect({ port, host: "127.0.0.1" });
    s.once("connect", () => { s.destroy(); resolve(true); });
    s.once("error", () => resolve(false));
  });
}

async function waitForPort(port, label, timeoutMs = 180000) {
  const start = Date.now();
  while (!(await portInUse(port))) {
    if (shuttingDown) throw new Error("stopped");
    if (Date.now() - start > timeoutMs) throw new Error(`${label} did not start on port ${port}`);
    await new Promise((r) => setTimeout(r, 500));
  }
}

function shutdown(code, graceful = false) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("\nStopping local stack…");
  const alive = () => children.filter((c) => c.exitCode === null && c.signalCode === null);
  // Ctrl+C already reaches every child in this console; give them time to exit
  // cleanly (the emulator exports its data), then force-kill whatever is left.
  if (!isWin) alive().forEach((c) => c.kill("SIGINT"));
  const deadline = Date.now() + (graceful ? 20000 : 0);
  const timer = setInterval(() => {
    const left = alive();
    if (!left.length || Date.now() > deadline) {
      clearInterval(timer);
      for (const c of left) {
        try {
          if (isWin) execSync(`taskkill /pid ${c.pid} /T /F`, { stdio: "ignore" });
          else c.kill("SIGKILL");
        } catch (e) { /* already gone */ }
      }
      process.exit(code);
    }
  }, 300);
}
process.on("SIGINT", () => shutdown(0, true));
process.on("SIGTERM", () => shutdown(0, true));

// A throwaway service account: firebase-admin needs one to initialise, and a
// fake key guarantees nothing local can authenticate against real Google APIs
// (Firestore goes to the emulator; FCM/Storage calls simply fail).
function fakeServiceAccount() {
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  return JSON.stringify({
    type: "service_account",
    project_id: cfg.PROJECT_ID,
    private_key_id: "local-dev",
    private_key: privateKey,
    client_email: `local-dev@${cfg.PROJECT_ID}.iam.gserviceaccount.com`,
    client_id: "0",
    token_uri: "https://oauth2.googleapis.com/token",
  });
}

(async () => {
  const ports = [
    [cfg.FIRESTORE_PORT, "Firestore emulator"],
    [cfg.EMULATOR_UI_PORT, "Emulator UI"],
    [cfg.BACKEND_PORT, "Backend"],
    [cfg.FRONTEND_PORT, "Admin web app"],
  ];
  for (const [port, label] of ports) {
    if (await portInUse(port)) {
      console.error(`Port ${port} (${label}) is already in use — is the local stack already running?`);
      process.exit(1);
    }
  }

  const emulatorHost = `127.0.0.1:${cfg.FIRESTORE_PORT}`;

  // 1. Firestore emulator (firebase-tools 13 — v14+ needs Java 21).
  const hasExport = fs.existsSync(path.join(cfg.DATA_DIR, "firebase-export-metadata.json"));
  const fbArgs = [
    "-y", "firebase-tools@13", "emulators:start", "--only", "firestore",
    "--project", cfg.PROJECT_ID, "--config", "firebase.json",
    "--export-on-exit", "emulator-data",
    ...(hasExport && !process.argv.includes("--reset") ? ["--import", "emulator-data"] : []),
  ];
  run("emulator", "npx", fbArgs, { cwd: __dirname, shell: isWin });
  await waitForPort(cfg.FIRESTORE_PORT, "Firestore emulator");

  // 2. Seed demo data + test logins.
  execSync(`"${process.execPath}" seed.js ${process.argv.includes("--reset") ? "--reset" : ""}`, {
    cwd: __dirname,
    stdio: "inherit",
    env: { ...process.env, FIRESTORE_EMULATOR_HOST: emulatorHost },
  });

  // 3. Backend API. Env set here wins over functions/backend/.env (dotenv never
  //    overrides), so the real Cloudflare/email credentials in .env stay unused.
  run("backend", process.execPath, ["server.js"], {
    cwd: cfg.BACKEND_DIR,
    env: {
      ...process.env,
      NODE_ENV: "development",
      PORT: String(cfg.BACKEND_PORT),
      baseURL: `http://localhost:${cfg.BACKEND_PORT}`,
      secretKey: cfg.SECRET_KEY,
      JWT_SECRET: cfg.JWT_SECRET,
      FIRESTORE_EMULATOR_HOST: emulatorHost,
      FIREBASE_STORAGE_EMULATOR_HOST: "127.0.0.1:9199",
      STORAGE_EMULATOR_HOST: "http://127.0.0.1:9199",
      FIREBASE_SERVICE_ACCOUNT: fakeServiceAccount(),
      FIREBASE_PROJECT_ID: cfg.PROJECT_ID,
      GCLOUD_PROJECT: cfg.PROJECT_ID,
      ALLOW_LOCAL_DB_FALLBACK: "false",
      CLOUDFLARE_ACCOUNT_ID: "",
      CLOUDFLARE_API_TOKEN: "",
      CLOUDFLARE_R2_ACCESS_KEY: "",
      CLOUDFLARE_R2_SECRET_KEY: "",
      CLOUDFLARE_R2_PUBLIC_DOMAIN: "",
      CLOUDFLARE_STREAM_CUSTOMER_CODE: "",
      EMAIL: "",
      MONGODB_CONNECTION_STRING: "",
      SEED_ADMIN_EMAIL: "",
      SEED_ADMIN_PASSWORD: "",
    },
  });
  await waitForPort(cfg.BACKEND_PORT, "Backend");

  // 4. Admin web app (CRA dev server, hot reload).
  run("admin-web", process.execPath, [path.join("node_modules", "react-scripts", "scripts", "start.js")], {
    cwd: cfg.FRONTEND_DIR,
    env: {
      ...process.env,
      PORT: String(cfg.FRONTEND_PORT),
      BROWSER: "none",
      REACT_APP_BASE_URL: `http://localhost:${cfg.BACKEND_PORT}/`,
      REACT_APP_SECRET_KEY: cfg.SECRET_KEY,
      ESLINT_NO_DEV_ERRORS: "true",
    },
  });
  await waitForPort(cfg.FRONTEND_PORT, "Admin web app", 300000);

  const a = cfg.ACCOUNTS;
  console.log(`
==================================================================
 YouPeak admin panel — running locally (isolated test data)

 Admin panel login : http://localhost:${cfg.FRONTEND_PORT}/login
 Backend API       : http://localhost:${cfg.BACKEND_PORT}/health
 Database viewer   : http://127.0.0.1:${cfg.EMULATOR_UI_PORT}/firestore

 Password for every account: ${cfg.PASSWORD}
   ${a.super.label.padEnd(30)} ${a.super.email}
   ${a.district.label.padEnd(30)} ${a.district.email}
   ${a.partner.label.padEnd(30)} ${a.partner.email}

 Ctrl+C to stop. Data persists in local-dev/emulator-data/.
==================================================================
`);
})().catch((e) => {
  if (e.message !== "stopped") console.error("Local stack failed to start:", e.message);
  shutdown(1);
});
