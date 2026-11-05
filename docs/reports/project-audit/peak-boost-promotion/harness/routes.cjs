// Captures the Peak Boost / Video Promotion screens at 1920 / 1366 / 768 / 390
// on the isolated local stack (emulators + local API + fixture media; data from
// seed-promotion.cjs). Navigates at desktop width, then resizes and captures.
//   NODE_PATH=<scratch tools>/node_modules node routes.cjs [tag] [only,comma,list]
//   FIXED_WIDTH=390 ... : a fresh phone-width session (no resizing).
"use strict";
const fs = require("fs");
const path = require("path");
const L = require("../../web-tasking/harness/lib.cjs");
const E = require("../../web-release/harness/e2e-lib.cjs");

// PROMO_BUILD=web_fixes_local captures the previous (pre-change) app for "before" shots.
const BUILD = path.resolve(__dirname, "../../../../youpeak/build", process.env.PROMO_BUILD || "web_promo_local");
const OUT = path.join(__dirname, "..", "screenshots");
const FIXED = Number(process.env.FIXED_WIDTH || 0);
const WIDTHS = FIXED ? [[FIXED, FIXED < 600 ? 844 : 1024]] : [[1920, 1080], [1366, 768], [768, 1024], [390, 844]];

async function session({ width, height, mobile = false, port = 7311, email = "viewer@youpeak.test", tag }) {
  const cacheFile = path.join(__dirname, `.coords-${width}x${height}${mobile ? "-m" : ""}.json`);
  const coords = await E.probeSignInCoords({ dir: BUILD, port, width, height, mobile, cacheFile });
  const profile = path.join(require("os").tmpdir(), `yp-promo-${tag || width}-${Date.now()}`);
  const app = await E.openApp({ dir: BUILD, port, width, height, profile, withExternal: false, log: null });
  if (mobile) await app.page.setViewport({ width, height, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await app.page.goto(app.origin, { waitUntil: "domcontentloaded" });
  await app.page.waitForSelector("flt-semantics-placeholder, flutter-view", { timeout: 90000 });
  await L.sleep(8000);
  await E.signInByCoords(app.page, coords, email);
  return app;
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file });
  return file;
}

const labels = async (page) => [...new Set((await L.nodes(page)).map((n) => n.label).filter(Boolean))];

(async () => {
  const tag = process.argv[2] || "after";
  const only = (process.argv[3] || "").split(",").filter(Boolean);
  const app = FIXED
    ? await session({ width: FIXED, height: FIXED < 600 ? 844 : 1024, mobile: FIXED < 600, tag: "promo-" + FIXED })
    : await session({ width: 1366, height: 768, tag: "promo" });
  const { page } = app;
  const out = {};

  // Tap a semantics node, scrolling the page content down until it exists.
  async function tapScroll(match, { after = 2500, tries = 8 } = {}) {
    for (let i = 0; i < tries; i++) {
      try {
        const vp = page.viewport();
        const n = await L.findNode(page, match, { timeout: 2500 });
        if (n.y > 40 && n.y < vp.height - 30) { await page.mouse.click(n.x, n.y); await L.sleep(after); return n; }
        await page.mouse.move(vp.width * 0.6, vp.height * 0.6);
        await page.mouse.wheel({ deltaY: n.y > vp.height ? 350 : -350 });
      } catch (_) {
        const vp = page.viewport();
        await page.mouse.move(vp.width * 0.6, vp.height * 0.6);
        await page.mouse.wheel({ deltaY: 400 });
      }
      await L.sleep(700);
    }
    throw new Error(`could not reach ${match}`);
  }
  async function scrollDown(px) {
    const vp = page.viewport();
    await page.mouse.move(vp.width * 0.6, vp.height * 0.6);
    for (let i = 0; i < Math.ceil(px / 400); i++) { await page.mouse.wheel({ deltaY: 400 }); await L.sleep(250); }
    await L.sleep(1200);
  }

  async function capture(name, { lower = 0 } = {}) {
    const rec = {};
    for (const [w, h] of WIDTHS) {
      if (!FIXED) { await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 }); await L.sleep(1800); }
      const o = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, bodyW: document.body.scrollWidth }));
      const ls = await labels(page).catch(() => []);
      rec[w] = { overflow: Math.max(o.scrollW, o.bodyW) > w + 1, sidebar: ["Home", "Library", "Tasker"].every((l) => ls.includes(l)), labels: ls.slice(0, 60) };
      await shot(page, `${tag}/${name}-${w}`);
      if (lower) { await scrollDown(lower); await shot(page, `${tag}/${name}-lower-${w}`); await scrollDown(-lower).catch(() => {}); }
    }
    if (!FIXED) { await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 }); await L.sleep(1500); }
    out[name] = rec;
    console.log(name, JSON.stringify(Object.fromEntries(Object.entries(rec).map(([w, r]) => [w, { overflow: r.overflow, sidebar: r.sidebar }]))));
  }

  async function step(name, fn, opts) {
    if (only.length && !only.includes(name)) return;
    const before = app.prepared.consoleErrors.length;
    try {
      await fn();
      await capture(name, opts);
    } catch (e) {
      out[name] = { error: e.message };
      console.log(name, "ERROR", e.message);
      await shot(page, `${tag}/${name}-error`).catch(() => {});
    }
    const errs = app.prepared.consoleErrors.slice(before).filter((e) => !/ERR_BLOCKED_BY_CLIENT|ERR_NETWORK_CHANGED|identitytoolkit/.test(e));
    if (errs.length) { (out[name] = out[name] || {}).errors = errs; console.log(name, "ERRORS", JSON.stringify(errs).slice(0, 600)); }
  }
  async function fresh() {
    await page.goto(app.origin, { waitUntil: "domcontentloaded" });
    await L.sleep(10000);
    await E.ensureSemantics(page);
  }
  const PROFILE = FIXED ? /^Profile$|^Tab 5 of 5|Profile/ : "Profile";
  async function openHub() {
    await fresh();
    await L.tap(page, PROFILE, { after: 4000 });
    await tapScroll(/^Promote Video$/, { after: 5000 });
  }

  if (process.env.PROMO_BUILD) {
    // Previous app: the old page, its video picker and its plan picker.
    await step("old-promote-page", openHub);
    await step("old-plan-picker", async () => {
      await openHub(); await tapScroll(/^Promote a Video$/, { after: 6000 });
      await tapScroll(/^Sunrise trek — ready to promote$/, { after: 3000 });
    });
    const f = path.join(OUT, tag, "routes-before.json");
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, JSON.stringify(out, null, 2));
    await app.close();
    return;
  }
  await step("home-promoted", async () => { await fresh(); await L.findNode(page, /^Promoted video:/, { timeout: 20000 }); });
  await step("promote-hub", openHub, { lower: 1100 });
  await step("promote-flow-video", async () => { await openHub(); await tapScroll(/^Promote a Video$/, { after: 5000 }); });
  await step("promote-flow-plans", async () => {
    await openHub(); await tapScroll(/^Promote a Video$/, { after: 5000 });
    await tapScroll(/^Sunrise trek — ready to promote$/, { after: 3000 });
  });
  await step("promote-plan-details", async () => {
    await openHub(); await tapScroll(/^Promote a Video$/, { after: 5000 });
    await tapScroll(/^Sunrise trek — ready to promote$/, { after: 3000 });
    await tapScroll(/^Weekly Mega Plan,/, { after: 2500 });
  });
  await step("promote-review", async () => {
    await openHub(); await tapScroll(/^Promote a Video$/, { after: 5000 });
    await tapScroll(/^Sunrise trek — ready to promote$/, { after: 3000 });
    await tapScroll(/^Weekly Mega Plan,/, { after: 2500 });
    await tapScroll(/^Choose Weekly Mega Plan$/, { after: 3000 });
  });
  async function toReview() {
    await openHub(); await tapScroll(/^Promote a Video$/, { after: 5000 });
    await tapScroll(/^Sunrise trek — ready to promote$/, { after: 3000 });
    await tapScroll(/^Starter Plan,/, { after: 2500 });
    await tapScroll(/^Choose Starter Plan$/, { after: 3000 });
  }
  // LOCAL EMULATOR settings only. The API caches settings for 30 s.
  async function razorpaySwitch(on) {
    const FSU = "http://127.0.0.1:8095/v1/projects/demo-youpeak-local/databases/(default)/documents/settings/main?updateMask.fieldPaths=razorPaySwitch";
    const r = await fetch(FSU, { method: "PATCH", headers: { Authorization: "Bearer owner", "Content-Type": "application/json" }, body: JSON.stringify({ fields: { razorPaySwitch: { booleanValue: on } } }) });
    if (!r.ok) throw new Error("settings patch " + r.status);
    await L.sleep(32000);
  }
  // Admin switched Razorpay off: no checkout offered.
  await step("promote-pay-gated", async () => { await razorpaySwitch(false); await toReview(); });
  // Switch on (LOCAL EMULATOR settings only); the local API has no Razorpay
  // keys, so the server refuses the order and the page says nothing was charged.
  await step("promote-pay-refused", async () => {
    await razorpaySwitch(true);
    await toReview();
    await tapScroll(/Pay ₹49/, { after: 5000 });
  });
  await step("campaign-details", async () => { await openHub(); await tapScroll(/^My public free video, Weekly Mega Plan/, { after: 5000 }); });
  await step("campaign-ended", async () => { await openHub(); await tapScroll(/^Old cooking clip, Starter Plan/, { after: 5000 }); });
  await step("peak-boost-sheet", async () => {
    await page.goto(`${app.origin}share?pageRoutes=NormalVideo&id=lc_promo_video`, { waitUntil: "domcontentloaded" });
    await L.sleep(12000);
    await E.ensureSemantics(page);
    await tapScroll(/Peak Boost/, { after: 3000 });
  });

  const file = path.join(OUT, tag, `routes${FIXED ? "-" + FIXED : ""}.json`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  await app.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
