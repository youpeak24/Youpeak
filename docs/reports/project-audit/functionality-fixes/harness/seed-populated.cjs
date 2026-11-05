// Local emulator only (demo-youpeak-local): gives the test viewer a channel,
// own videos in each state, a playlist, a Watch Later item and notifications,
// so populated screens can be captured. Refuses anything but the emulator.
"use strict";
const FS = "http://127.0.0.1:8095/v1/projects/demo-youpeak-local/databases/(default)/documents";
const H = { Authorization: "Bearer owner", "Content-Type": "application/json" };
const ME = "local_app_user";

function enc(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
  if (typeof v === "object") return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } };
  return { stringValue: String(v) };
}
async function set(col, id, data, merge = false) {
  const fields = Object.fromEntries(Object.entries({ _id: id, id, ...data }).map(([k, v]) => [k, enc(v)]));
  const mask = merge ? "?" + Object.keys(fields).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&") : "";
  const r = await fetch(`${FS}/${col}/${id}${mask}`, { method: "PATCH", headers: H, body: JSON.stringify({ fields }) });
  if (!r.ok) throw new Error(`${col}/${id}: ${r.status} ${await r.text()}`);
}

(async () => {
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  await set("users", ME, { isChannel: true, channelId: ME, channelType: 1, fullName: "Local Viewer Channel", descriptionOfChannel: "Local test channel", videoUnlockCost: 10, subscriptionCost: 10 }, true);
  const base = { userId: ME, channelId: ME, isActive: true, videoType: 1, videoTime: 6, videoPrivacyType: 1, commentType: 1, audienceType: 1,
    videoUrl: "http://127.0.0.1:5056/fixture-bite-landscape.webm", videoImage: "http://127.0.0.1:5056/fixture-bite-landscape.jpg", like: 0, dislike: 0 };
  await set("videos", "lv_public", { ...base, title: "My public free video", visibilityType: 1, scheduleType: 2, createdAt: iso(now - 3600e3) });
  await set("videos", "lv_private", { ...base, title: "My private video", visibilityType: 2, scheduleType: 2, createdAt: iso(now - 7200e3) });
  await set("videos", "lv_scheduled", { ...base, title: "My scheduled video", visibilityType: 1, scheduleType: 1, scheduleTime: iso(now + 2 * 86400e3), createdAt: iso(now - 600e3) });
  await set("videos", "lv_paid", { ...base, title: "My paid video", visibilityType: 1, scheduleType: 2, videoPrivacyType: 2, createdAt: iso(now - 9000e3) });
  await set("PlayList", "lv_playlist", { userId: ME, channelId: ME, playListName: "Weekend watch", playListType: 1, videoId: ["video_101", "video_102"], createdAt: iso(now - 500e3) });
  await set("PlayList", "lv_playlist2", { userId: ME, channelId: ME, playListName: "Shared picks", playListType: 2, videoId: ["video_102"], createdAt: iso(now - 400e3) });
  await set("SaveToWatchLater", `${ME}_video_101`, { userId: ME, videoId: "video_101", createdAt: iso(now - 300e3) });
  const n = (id, title, minsAgo, isRead) => set("Notification", id, { userId: ME, title, message: "Hey there! A new video was posted. Tap to watch it now.", type: "NEW_VIDEO",
    videoId: "video_101", videoType: 1, videoImage: "http://127.0.0.1:5056/fixture-bite-landscape.jpg", isRead, createdAt: iso(now - minsAgo * 60e3) });
  await n("lv_n1", "🔔 New Video Alert! 🔔", 4, false);
  await n("lv_n2", "Tech Pulse Labs posted a video", 180, false);
  await n("lv_n3", "Welcome to YouPeak", 60 * 26, true);
  console.log("seeded");
})().catch((e) => { console.error(e.message); process.exit(1); });
