// Local emulator only (demo-youpeak-local). Adds promotion fixtures on top of
// functionality-fixes/harness/seed-populated.cjs so the promotion screens can
// be captured with populated, internally consistent data:
//   - the test viewer's channel: one running Weekly Mega campaign (3 counted
//     impressions, each backed by a promotionImpressions row), one ended
//     Starter campaign, an unpromoted public video and a Bite;
//   - a second local creator with a running Boost Plan campaign, so the
//     viewer's Home shows the "Promoted" spot (and can be Peak Boosted).
// Every document carries isTestFixture: true. Refuses anything but the emulator.
"use strict";
const { execFileSync } = require("child_process");
const path = require("path");

const FS = "http://127.0.0.1:8095/v1/projects/demo-youpeak-local/databases/(default)/documents";
const H = { Authorization: "Bearer owner", "Content-Type": "application/json" };
const ME = "local_app_user";
const CREATOR = "local_promo_creator";
const MEDIA = "http://127.0.0.1:5056";

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

const PLANS = {
  starter_plan: { id: "starter_plan", name: "Starter Plan", priceINR: 49, currency: "INR", impressionsMin: 2000, impressionsMax: 2500, durationDays: 1, targeting: "Global", category: "Daily" },
  boost_plan: { id: "boost_plan", name: "Boost Plan", priceINR: 249, currency: "INR", impressionsMin: 3000, impressionsMax: 8000, durationDays: 4, targeting: "Global", category: "Daily" },
  weekly_mega_plan: { id: "weekly_mega_plan", name: "Weekly Mega Plan", priceINR: 1000, currency: "INR", impressionsMin: 50000, impressionsMax: 75000, durationDays: 7, targeting: "Global", category: "Weekly" },
};

(async () => {
  const probe = await fetch("http://127.0.0.1:8095/").catch(() => null);
  if (!probe) throw new Error("Firestore emulator not reachable on 127.0.0.1:8095 — refusing.");
  execFileSync(process.execPath, [path.join(__dirname, "../../functionality-fixes/harness/seed-populated.cjs")], { stdio: "inherit" });

  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const day = 864e5;
  const fx = { isTestFixture: true };
  const base = { isActive: true, videoType: 1, videoTime: 6, videoPrivacyType: 1, commentType: 1, audienceType: 1, visibilityType: 1, scheduleType: 2, moderationStatus: "approved",
    videoUrl: `${MEDIA}/fixture-bite-landscape.webm`, videoImage: `${MEDIA}/fixture-bite-landscape.jpg`, like: 0, dislike: 0, ...fx };

  await set("users", ME, { coin: 12000 }, true);
  await set("videos", "lv_promo_ready", { ...base, userId: ME, channelId: ME, title: "Sunrise trek — ready to promote", createdAt: iso(now - 1800e3) });
  await set("videos", "lv_promo_old", { ...base, userId: ME, channelId: ME, title: "Old cooking clip", createdAt: iso(now - 20 * day) });
  await set("videos", "lv_bite", { ...base, userId: ME, channelId: ME, videoType: 2, title: "My Bite", createdAt: iso(now - 4000e3) });

  await set("users", CREATOR, {
    fullName: "Local Promo Creator", email: "promo-creator@youpeak.test", isActive: true, isBlock: false, isChannel: true, channelId: CREATOR, channelType: 1,
    coin: 0, image: "", createdAt: iso(now - 30 * day), ...fx,
  });
  await set("videos", "lc_promo_video", { ...base, userId: CREATOR, channelId: CREATOR, title: "Street food tour (promoted fixture)", createdAt: iso(now - 3 * day) });

  async function campaign(id, { userId, videoId, plan, start, end, status, delivered, events }) {
    const p = PLANS[plan];
    await set("videoPromotions", id, {
      userId, videoId, planId: p.id, planName: p.name, planSnapshot: { ...p, snapshotAt: iso(start) }, planPriceINR: p.priceINR, planDurationDays: p.durationDays,
      impressionsTargetMin: p.impressionsMin, impressionsTargetMax: p.impressionsMax, impressionsDelivered: delivered,
      paymentGatewayRef: `ptxn_local_${id}`, paymentStatus: "paid", status, approvedByAdmin: false,
      startedAt: iso(start), expiresAt: iso(end), createdAt: iso(start - 60e3), updatedAt: iso(now), ...(status === "expired" ? { endedAt: iso(end) } : {}), ...fx,
    });
    let n = 0;
    for (const [type, at] of events) await set("videoPromotionEvents", `${id}_${type}_${++n}`, { campaignId: id, type, by: type === "activated" ? "payment" : "system", at: iso(at), createdAt: iso(at), ...fx });
    await set("promotionVideoLocks", videoId, { videoId, campaignId: id, endsAt: iso(end), updatedAt: iso(now), ...fx });
    await set("videos", videoId, { isPromoted: status === "active" }, true);
  }

  const aStart = now - 2 * day;
  await campaign("promo_local_running", { userId: ME, videoId: "lv_public", plan: "weekly_mega_plan", start: aStart, end: aStart + 7 * day, status: "active", delivered: 3, events: [["activated", aStart]] });
  // Each counted impression has its dedupe row (one viewer, one India day).
  const dayStr = (ms) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(ms));
  for (const [i, v] of ["local_fixture_viewer_1", "local_fixture_viewer_2", "local_fixture_viewer_3"].entries()) {
    const at = aStart + (i + 1) * 3600e3;
    await set("promotionImpressions", `promo_local_running_${v}_${dayStr(at)}`, { campaignId: "promo_local_running", viewerId: v, day: dayStr(at), at: iso(at), ...fx });
  }
  const bStart = now - 12 * day;
  await campaign("promo_local_ended", { userId: ME, videoId: "lv_promo_old", plan: "starter_plan", start: bStart, end: bStart + day, status: "expired", delivered: 0, events: [["activated", bStart], ["expired", bStart + day]] });
  const cStart = now - day;
  await campaign("promo_local_other", { userId: CREATOR, videoId: "lc_promo_video", plan: "boost_plan", start: cStart, end: cStart + 4 * day, status: "active", delivered: 0, events: [["activated", cStart]] });
  console.log("promotion fixtures seeded");
})().catch((e) => { console.error(e.message); process.exit(1); });
