// Captures the reported screens at 1920 / 1366 / 768 / 390 on the local
// isolated stack: navigate once (desktop), then resize and capture each width.
//   node routes.cjs [tag]
"use strict";
const fs = require("fs");
const path = require("path");
const { L, E, session, shot, openVideo, labels } = require("./lib.cjs");

// FIXED_WIDTH=390 (or 768): a fresh session at that width, no resizing (legacy
// phone layouts read the window size at first build).
const FIXED = Number(process.env.FIXED_WIDTH || 0);
const WIDTHS = FIXED ? [[FIXED, FIXED < 600 ? 844 : 1024]] : [[1920, 1080], [1366, 768], [768, 1024], [390, 844]];
const FIXTURE = path.resolve(__dirname, "../../../../local-dev/fixtures/fixture-bite-landscape.webm");

(async () => {
  const tag = process.argv[2] || "after";
  const only = (process.argv[3] || "").split(",").filter(Boolean);
  const app = FIXED
    ? await session({ width: FIXED, height: FIXED < 600 ? 844 : 1024, mobile: FIXED < 600, tag: "routes-" + FIXED })
    : await session({ width: 1366, height: 768, tag: "routes" });
  const { page } = app;
  const out = {};

  async function capture(name) {
    const rec = {};
    for (const [w, h] of WIDTHS) {
      if (!FIXED) {
        // Width only: toggling mobile emulation reloads the page in Chrome.
        await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
        await L.sleep(1800);
      }
      const o = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, bodyW: document.body.scrollWidth }));
      const ls = await labels(page).catch(() => []);
      rec[w] = { overflow: Math.max(o.scrollW, o.bodyW) > w + 1, sidebar: ["Home", "Library", "Tasker"].every((l) => ls.includes(l)), labels: ls.slice(0, 45) };
      await shot(page, `${tag}/${name}-${w}`);
    }
    if (!FIXED) { await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 }); await L.sleep(1500); }
    out[name] = rec;
    console.log(name, JSON.stringify(Object.fromEntries(Object.entries(rec).map(([w, r]) => [w, { overflow: r.overflow, sidebar: r.sidebar }]))));
  }
  async function home() {
    if (FIXED) {
      // Phone/tablet: no sidebar on inner pages; start each route from a fresh load.
      await page.goto(app.origin, { waitUntil: "domcontentloaded" });
      await L.sleep(10000);
      await E.ensureSemantics(page);
      return;
    }
    await L.tap(page, "Home", { after: 2500 }).catch(() => {});
  }
  const TASKER = FIXED ? "Tasker dashboard" : "Tasker";
  async function step(name, fn) {
    if (only.length && !only.includes(name)) return;
    const before = app.prepared.consoleErrors.length;
    try {
      await fn();
      await capture(name);
    } catch (e) {
      out[name] = { error: e.message };
      console.log(name, "ERROR", e.message);
      await shot(page, `${tag}/${name}-error`).catch(() => {});
    }
    const errs = app.prepared.consoleErrors.slice(before).filter((e) => !/ERR_BLOCKED_BY_CLIENT|ERR_NETWORK_CHANGED/.test(e));
    if (errs.length) { (out[name] = out[name] || {}).errors = errs; console.log(name, "ERRORS", JSON.stringify(errs).slice(0, 600)); }
    await home();
  }

  await step("tasker", async () => { await L.tap(page, TASKER, { after: 4000 }); });
  await step("earn", async () => { await L.tap(page, TASKER, { after: 4000 }); await L.tap(page, /Check in & daily tasks/, { after: 6000 }); });
  await step("starter-pass", async () => { await L.tap(page, TASKER, { after: 4000 }); await L.tap(page, /^Starter Pass$/, { after: 5000 }); });
  await step("notifications", async () => { await L.tap(page, "Notifications", { after: 5000 }); });
  await step("library", async () => { await L.tap(page, "Library", { after: 4000 }); });
  await step("watch-later", async () => { await L.tap(page, "Library", { after: 3000 }); await L.tap(page, /^Watch Later$/, { after: 5000 }); });
  await step("my-playlists", async () => { await L.tap(page, "Library", { after: 3000 }); await L.tap(page, /^My Playlist$/, { after: 6000 }); });
  await step("your-videos", async () => { await L.tap(page, "Library", { after: 3000 }); await L.tap(page, /^Your Videos$/, { after: 6000 }); });
  await step("search", async () => {
    await L.tap(page, FIXED ? "Search videos..." : "Search", { after: 3000 });
    await L.typeField(page, /Search/, "Welcome").catch(async () => { await page.keyboard.type("Welcome", { delay: 30 }); });
    await page.keyboard.press("Enter");
    await L.sleep(4000);
  });
  await step("upload-form", async () => {
    await L.tap(page, "Create", { role: "button", after: 1500 });
    const up = await L.findNode(page, "Upload a Video");
    const [chooser] = await Promise.all([page.waitForFileChooser({ timeout: 15000 }), page.mouse.click(up.x, up.y)]);
    await chooser.accept([FIXTURE]);
    await L.sleep(7000);
  });
  await step("video", async () => { await openVideo(app, "video_101"); });

  out.consoleErrors = app.prepared.consoleErrors.filter((e) => !/ERR_BLOCKED_BY_CLIENT/.test(e)).slice(0, 30);
  const dir = path.join(__dirname, "..", "evidence");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `routes-${tag}.json`), JSON.stringify(out, null, 2));
  console.log("consoleErrors", JSON.stringify(out.consoleErrors).slice(0, 1500));
  await app.close();
  process.exit(0);
})().catch((e) => { console.error("HARNESS", e); process.exit(1); });
