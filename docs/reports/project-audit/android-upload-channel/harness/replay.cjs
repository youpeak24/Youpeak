// Replays the requests the Android app makes for (a) "Your Channel" and
// (b) Create → upload, with real emulator-issued ID tokens, against the backend
// that BACKEND_DIR points at (default: the working tree). Run once with
// BACKEND_DIR=<replica of the deployed build> and once without, then compare.
//
//   BACKEND_DIR=... npx firebase-tools@13 emulators:exec --config tests/emulator/firebase.json \
//     --only firestore,auth --project demo-youpeak-audit "node reports/.../replay.cjs [label]"
//
// Output is a table of status / code / message and the TOP-LEVEL KEYS of each
// reply — never tokens, keys or user data. Emulator + throwaway data only.
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { boot } = require(path.resolve(__dirname, "../../../../tests/emulator/harness.cjs"));

(async () => {
  const label = process.argv[2] || (process.env.BACKEND_DIR ? "replica" : "working-tree");
  const h = await boot();
  const { call, seedUser, idToken, set, nowIso } = h;
  const rows = [];
  const pub = { isActive: true, videoType: 1, scheduleType: 2, visibilityType: 1, moderationStatus: "approved", videoPrivacyType: 1 };

  // Owner with a channel (channelId === own id, as the app and server use it),
  // a user without one, and a third user.
  await seedUser("rp_owner", { isChannel: true, channelId: "rp_owner", fullName: "Replay Owner", channelType: 1, descriptionOfChannel: "d", subscriptionCost: 10, videoUnlockCost: 10 });
  await seedUser("rp_nochan", { isChannel: false });
  await seedUser("rp_other", { isChannel: true, channelId: "rp_other", fullName: "Replay Other" });
  await set("videos", "rp_v1", { userId: "rp_owner", channelId: "rp_owner", title: "public", createdAt: nowIso(), videoUrl: "http://x/v.mp4", videoImage: "http://x/i.jpg", videoTime: 5, ...pub });
  await set("videos", "rp_v2", { userId: "rp_owner", channelId: "rp_owner", title: "private", createdAt: nowIso(), ...pub, visibilityType: 2 });
  const tOwner = await idToken("rp_owner"), tNo = await idToken("rp_nochan"), tOther = await idToken("rp_other");

  const shape = (j) => Object.keys(j || {}).sort().join(",");
  async function hit(name, method, p, { token, body, anonymous = false } = {}) {
    const r = await call(method, p, { token: anonymous ? undefined : token, body });
    const j = r.json || {};
    rows.push({ name, method, path: p.split("?")[0], status: r.status, ok: j.status, code: j.code || "", message: String(j.message || j.error || "").slice(0, 70), keys: shape(j) });
    return r;
  }
  const own = "channelId=rp_owner&userId=rp_owner";

  // ── Profile → Your Channel ───────────────────────────────────────────────
  await hit("profile (owner)", "GET", "/client/user/profile?userId=rp_owner", { token: tOwner });
  await hit("profile (no token)", "GET", "/client/user/profile?userId=rp_owner", { anonymous: true });
  await hit("profile (other's token)", "GET", "/client/user/profile?userId=rp_owner", { token: tOther });
  await hit("channel home (owner)", "GET", `/client/user/detailsOfChannel?${own}&start=1&limit=20`, { token: tOwner });
  await hit("channel home (no token)", "GET", `/client/user/detailsOfChannel?${own}&start=1&limit=20`, { anonymous: true });
  await hit("channel home (bad token)", "GET", `/client/user/detailsOfChannel?${own}&start=1&limit=20`, { token: tOwner.slice(0, -6) + "AAAAAA" });
  await hit("channel home (other's token, userId=owner)", "GET", `/client/user/detailsOfChannel?${own}&start=1&limit=20`, { token: tOther });
  await hit("channel home (channelId empty)", "GET", "/client/user/detailsOfChannel?channelId=&userId=rp_nochan&start=1&limit=20", { token: tNo });
  await hit("channel home (unknown channel)", "GET", "/client/user/detailsOfChannel?channelId=nobody&userId=rp_owner&start=1&limit=20", { token: tOwner });
  await hit("channel videos tab", "GET", "/client/user/videosOfChannel?userId=rp_owner&channelId=rp_owner&start=1&limit=20&videoType=1", { token: tOwner });
  await hit("channel playlists tab", "GET", "/client/user/playListsOfChannel?channelId=rp_owner&userId=rp_owner&start=1&limit=20", { token: tOwner });
  await hit("channel about tab", "GET", "/client/user/aboutOfChannel?channelId=rp_owner", { token: tOwner });

  // ── Create → upload ──────────────────────────────────────────────────────
  const grantBody = { folderStructure: "normalVideo", keyName: "1.mp4", contentType: "video/mp4", fileSize: 1048576 };
  await hit("direct-upload-url (owner)", "POST", "/client/file/direct-upload-url", { token: tOwner, body: grantBody });
  await hit("direct-upload-url (no token)", "POST", "/client/file/direct-upload-url", { anonymous: true, body: grantBody });
  const publish = (channelId, userId, videoUrl) => ({
    title: "t", description: "", hashTag: [], videoType: 1, videoTime: 5, visibilityType: 1, audienceType: 1, commentType: 1, scheduleType: 0,
    location: "", latitude: "0", longitude: "0", userId, channelId, fullName: "", descriptionOfChannel: "",
    videoUrl, videoImage: "http://x/i.jpg", videoPrivacyType: 1, channelType: "1",
  });
  await hit("createVideo (no token)", "POST", "/client/video/createVideo", { anonymous: true, body: publish("rp_owner", "rp_owner", "https://videos.youpeak.app/x.mp4") });
  await hit("createVideo (owner, not an uploaded object)", "POST", "/client/video/createVideo", { token: tOwner, body: publish("rp_owner", "rp_owner", "https://videos.youpeak.app/x.mp4") });
  await hit("createVideo (other's token, owner's ids)", "POST", "/client/video/createVideo", { token: tOther, body: publish("rp_owner", "rp_owner", "https://videos.youpeak.app/x.mp4") });
  await hit("createVideo (no channel yet, empty channelId)", "POST", "/client/video/createVideo", { token: tNo, body: publish("", "rp_nochan", "https://videos.youpeak.app/x.mp4") });

  console.log(`\n=== ${label} ===`);
  console.table(rows.map(({ name, status, ok, code, message }) => ({ request: name, http: status, status: ok, code, message })));
  console.log("response top-level keys:");
  for (const r of rows) console.log(`  ${r.name.padEnd(48)} ${r.keys}`);
  const out = path.join(__dirname, "..", "logs", `replay-${label}.json`);
  fs.writeFileSync(out, JSON.stringify(rows, null, 2));
  h.close();
  process.exit(0);
})().catch((e) => { console.error("REPLAY ERROR", e && e.message); process.exit(3); });
