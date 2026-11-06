// Seeds the LOCAL Firestore emulator with demo data + one login per admin role.
// Never talks to the real project: refuses to run unless FIRESTORE_EMULATOR_HOST is set.
//
//   node tools/local-dev/seed.js          seed only if the emulator is empty
//   node tools/local-dev/seed.js --reset  wipe the emulator and reseed
"use strict";

const path = require("path");
const fs = require("fs");
const { createRequire } = require("module");
const cfg = require("./config");

const backendRequire = createRequire(path.join(cfg.BACKEND_DIR, "index.js"));
const admin = backendRequire("firebase-admin");
const bcrypt = backendRequire("bcryptjs");

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = `127.0.0.1:${cfg.FIRESTORE_PORT}`;
}
if (!/^(127\.0\.0\.1|localhost):/.test(process.env.FIRESTORE_EMULATOR_HOST)) {
  console.error("Refusing to seed: FIRESTORE_EMULATOR_HOST is not a local emulator.");
  process.exit(1);
}

if (!admin.apps.length) admin.initializeApp({ projectId: cfg.PROJECT_ID });
const db = admin.firestore();
const now = () => new Date().toISOString();
const hash = (pw) => bcrypt.hashSync(pw, 10);

function readDemo(name) {
  const file = path.join(cfg.DB_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return [];
  const rows = JSON.parse(fs.readFileSync(file, "utf8"));
  return (Array.isArray(rows) ? rows : [rows]).map((r) => {
    const doc = JSON.parse(JSON.stringify(r));
    const id = String(doc._id?.$oid || doc._id || doc.id);
    doc._id = id;
    doc.id = id;
    if (doc.createdAt?.$date) doc.createdAt = doc.createdAt.$date;
    if (doc.updatedAt?.$date) doc.updatedAt = doc.updatedAt.$date;
    return doc;
  });
}

async function wipe() {
  const res = await fetch(
    `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${cfg.PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error(`emulator wipe failed: HTTP ${res.status}`);
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    const auth = await fetch(
      `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${cfg.PROJECT_ID}/accounts`,
      { method: "DELETE" }
    );
    if (!auth.ok) throw new Error(`auth emulator wipe failed: HTTP ${auth.status}`);
  }
}

// The demo rows in ../DB point at public sample clips labelled as R2/Stream
// uploads. Locally they play the generated, clearly labelled clips in
// tools/local-dev/fixtures instead (served by start.js), marked as test fixtures.
const fixtureUrl = (name) => `http://127.0.0.1:${cfg.FIXTURE_PORT}/${name}`;
const LOCAL_MEDIA = {
  short_101: "fixture-bite-portrait-a",
  short_102: "fixture-bite-landscape",
  video_101: "fixture-bite-landscape",
  video_102: "fixture-bite-landscape",
};
function useLocalMedia(video, fixture) {
  Object.assign(video, {
    videoUrl: fixtureUrl(`${fixture}.webm`),
    videoImage: fixtureUrl(`${fixture}.jpg`),
    storageProvider: "local-test-fixture",
    isTestFixture: true,
  });
  delete video.streamUid;
  delete video.hlsUrl;
  delete video.dashUrl;
  return video;
}

// Settings from the backend's code defaults, with every credential blanked so
// nothing running locally can reach real storage, payment or email services.
function localSettings() {
  const defaults = backendRequire("./setting");
  const s = JSON.parse(JSON.stringify(defaults));
  const secretKeys = Object.keys(s).filter((k) =>
    /secret|privateKey|accessKey|apiKey|zego|^aws|^do[A-Z]|^r2|cloudflare|firebaseStorageBucket/i.test(k)
  );
  for (const k of secretKeys) s[k] = typeof s[k] === "object" && s[k] !== null ? {} : "";
  s.storage = { local: true, cloudflareR2: false, awsS3: false, digitalOcean: false };
  s._id = "default_settings";
  s.createdAt = now();
  s.updatedAt = now();
  return s;
}

async function seed() {
  const writes = [];
  const put = (col, doc) => writes.push([col, String(doc._id), doc]);

  for (const col of ["adrewards", "advertises", "channels", "currencies", "dailyrewards"]) {
    for (const doc of readDemo(col)) put(col, doc);
  }
  const videos = readDemo("videos");
  for (const v of videos) put("videos", LOCAL_MEDIA[v._id] ? useLocalMedia(v, LOCAL_MEDIA[v._id]) : v);
  // A third, portrait Bite so next/previous navigation has somewhere to go.
  const short = videos.find((v) => v._id === "short_101");
  if (short) {
    put("videos", useLocalMedia({
      ...short,
      _id: "local_short_103",
      id: "local_short_103",
      uniqueVideoId: "VID-LOCAL_SHORT_103",
      title: "Local test Bite B (portrait 9:16)",
      description: "Generated local test fixture. #Bites",
      like: 12, dislike: 0, shareCount: 1, totalViews: 40,
      createdAt: now(), updatedAt: now(),
    }, "fixture-bite-portrait-b"));
  }

  // App (viewer) login for the Flutter web app: email + password (loginType 4).
  put("users", {
    _id: cfg.APP_USER.id,
    id: cfg.APP_USER.id,
    fullName: "Local Test Viewer",
    nickName: "Local Viewer",
    email: cfg.APP_USER.email,
    loginType: 4,
    passwordHash: hash(cfg.PASSWORD),
    identity: "local-dev-browser",
    fcmToken: "",
    image: "",
    coin: 0,
    isActive: true,
    isBlock: false,
    isChannel: false,
    paymentStatus: true,
    uniqueId: "LOCAL-VIEWER",
    referralCode: "LOCALVIEWER",
    createdAt: now(),
  });

  for (const u of readDemo("users")) {
    delete u.password;
    u.fcmToken = ""; // no push notifications to anyone from a local run
    if (u._id === cfg.PARTNER_USER_ID) {
      Object.assign(u, {
        isDigitalPartner: true,
        partnerStatus: "ACTIVE",
        email: cfg.ACCOUNTS.partner.email,
        state: "Tamil Nadu",
        district: "Trichy",
        agencyId: cfg.AGENCY_ID,
      });
    }
    put("users", u);
  }

  for (const a of readDemo("agencies")) {
    if (a._id === cfg.AGENCY_ID) {
      a.email = cfg.ACCOUNTS.district.email;
      a.password = hash(cfg.PASSWORD);
    }
    put("agencies", a);
  }

  put("admins", {
    _id: "local_super_admin",
    name: "Local Super Admin",
    email: cfg.ACCOUNTS.super.email,
    password: hash(cfg.PASSWORD),
    role: "SUPER_ADMIN",
    isActive: true,
    createdAt: now(),
  });
  put("admins", {
    _id: "local_district_admin",
    name: "Trichy District Partner",
    email: cfg.ACCOUNTS.district.email,
    password: hash(cfg.PASSWORD),
    role: "AGENCY_ADMIN",
    agencyId: cfg.AGENCY_ID,
    isActive: true,
    createdAt: now(),
  });
  put("admins", {
    _id: "local_partner_admin",
    name: "Trichy Digital Partner",
    email: cfg.ACCOUNTS.partner.email,
    password: hash(cfg.PASSWORD),
    role: "DIGITAL_PARTNER_ADMIN",
    partnerUserId: cfg.PARTNER_USER_ID,
    isActive: true,
    createdAt: now(),
  });

  put("partnerProfiles", { // backend maps model "PartnerProfile" to this collection
    _id: "local_partner_profile",
    userId: cfg.PARTNER_USER_ID,
    licenseFeePaid: 5000,
    paymentTransactionId: null,
    adCreditsBalance: 5000,
    adCreditsGranted: 5000,
    activatedAt: now(),
    totalReferrals: 2,
    totalEarnings: 420,
  });

  // A couple of referrals by the Digital Partner and District Partner commissions,
  // so the partner and franchise dashboards have something to show.
  const day = 86400e3;
  put("referralHistories", {
    _id: "local_ref_1", referrerId: cfg.PARTNER_USER_ID, referredUserId: "user_104",
    referralCode: "TRICHY_PARTNER_2026", stage1Completed: true, stage1CompletedAt: now(),
    stage1RewardCoins: 1000, stage1Released: true, stage2Completed: true, stage2RewardCoins: 1000,
    stage2Released: true, totalRewardCoinsGiven: 2000, status: "COMPLETED", createdAt: now(),
  });
  put("referralHistories", {
    _id: "local_ref_2", referrerId: cfg.PARTNER_USER_ID, referredUserId: "user_105",
    referralCode: "TRICHY_PARTNER_2026", stage1Completed: true, stage1CompletedAt: now(),
    stage1RewardCoins: 1000, stage1Released: false, stage2Completed: false, stage2RewardCoins: 0,
    stage2DeadlineAt: new Date(Date.now() + 7 * day).toISOString(), stage2Released: false,
    totalRewardCoinsGiven: 0, status: "STAGE1_DONE", createdAt: now(),
  });
  [
    ["DIGITAL_PARTNER_LICENSE", 5000, 20, "PAID"],
    ["COIN_PURCHASE", 1200, 10, "PENDING"],
    ["AD_IMPRESSION", 800, 10, "PENDING"],
  ].forEach(([sourceType, gross, rate, payoutStatus], i) =>
    put("agencyCommissions", {
      _id: `local_agc_${i + 1}`, agencyId: cfg.AGENCY_ID, sourceType, grossAmount: gross,
      commissionRatePercentage: rate, commissionAmount: (gross * rate) / 100,
      state: "Tamil Nadu", district: "Trichy", userId: cfg.PARTNER_USER_ID, payoutStatus,
      createdAt: new Date(Date.now() - i * day).toISOString(),
    })
  );

  put("logins", { _id: "default_login", login: true });
  put("settings", localSettings());

  for (let i = 0; i < writes.length; i += 400) {
    const batch = db.batch();
    for (const [col, id, doc] of writes.slice(i, i + 400)) batch.set(db.collection(col).doc(id), doc);
    await batch.commit();
  }
  console.log(`Seeded ${writes.length} documents into the local emulator (${cfg.PROJECT_ID}).`);
}

(async () => {
  const reset = process.argv.includes("--reset");
  if (reset) {
    await wipe();
    console.log("Emulator wiped.");
  } else {
    const existing = await db.collection("admins").doc("local_super_admin").get();
    if (existing.exists) {
      console.log("Emulator already seeded — keeping existing data (use --reset to start fresh).");
      return;
    }
  }
  await seed();
})().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
