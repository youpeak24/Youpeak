// Browser helpers for the functionality/responsive fixes (local, isolated stack:
// emulators + local API + fixture media). Reuses the earlier tasks' helpers.
// puppeteer-core is resolved from NODE_PATH (a scratch tools folder).
"use strict";
const fs = require("fs");
const path = require("path");
const L = require("../../web-tasking/harness/lib.cjs");
const E = require("../../web-release/harness/e2e-lib.cjs");

const OUT = path.join(__dirname, "..", "screenshots");
const BUILD = path.resolve(__dirname, "../../../../youpeak/build/web_fixes_local");

async function session({ width, height, mobile = false, port = 7301, email = "viewer@youpeak.test", tag }) {
  const cacheFile = path.join(__dirname, `.coords-${width}x${height}${mobile ? "-m" : ""}.json`);
  const coords = await E.probeSignInCoords({ dir: BUILD, port, width, height, mobile, cacheFile });
  const profile = path.join(require("os").tmpdir(), `yp-ff-${tag || width}-${Date.now()}`);
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

async function openVideo(app, videoId) {
  await app.page.goto(`${app.origin}share?pageRoutes=NormalVideo&id=${videoId}`, { waitUntil: "domcontentloaded" });
  await app.page.waitForSelector("flt-semantics-placeholder, flutter-view", { timeout: 90000 });
  await L.sleep(12000);
  await E.ensureSemantics(app.page);
}

async function videoState(page) {
  return page.evaluate(() => {
    const v = document.querySelector("video");
    if (!v) return null;
    const r = v.getBoundingClientRect();
    return { paused: v.paused, t: v.currentTime, d: v.duration, muted: v.muted, volume: v.volume, rect: [r.x, r.y, r.width, r.height], pe: getComputedStyle(v).pointerEvents };
  });
}

async function labels(page) {
  return [...new Set((await L.nodes(page)).map((n) => n.label).filter(Boolean))];
}

module.exports = { L, E, session, shot, openVideo, videoState, labels, OUT, BUILD };
