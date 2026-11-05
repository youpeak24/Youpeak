// Issue 1/2: video page layout + web player controls at one viewport.
//   node video-page.cjs <width> <height> [mobile] [tag]
"use strict";
const fs = require("fs");
const path = require("path");
const { L, session, shot, openVideo, videoState, labels } = require("./lib.cjs");

(async () => {
  const width = Number(process.argv[2] || 1920), height = Number(process.argv[3] || 1080);
  const mobile = process.argv[4] === "mobile";
  const tag = process.argv[5] || "after";
  const res = { width, height, mobile, checks: {} };
  const app = await session({ width, height, mobile, tag: `video-${width}` });
  const { page } = app;
  try {
    await openVideo(app, "video_101");
    await shot(page, `${tag}/video-${width}-loaded`);
    const s0 = await videoState(page);
    res.checks.videoElement = s0;
    res.labels = (await labels(page)).slice(0, 60);
    if (s0) {
      const [x, y, w, h] = s0.rect;
      const cx = x + w / 2, cy = y + h / 2;
      // Hover shows the controls.
      if (!mobile) { await page.mouse.move(cx - 50, cy - 30); await L.sleep(400); await page.mouse.move(cx, cy); await L.sleep(600); }
      else { await page.touchscreen.tap(cx, cy + h / 4); await L.sleep(700); }
      await shot(page, `${tag}/video-${width}-controls`);
      res.labels2 = (await labels(page)).filter((l) => /play|pause|forward|back|mute|volume|full screen|seek|speed|\d+x|:\d\d/i.test(l));
      // Click / tap the picture: play <-> pause.
      const before = (await videoState(page)).paused;
      if (!mobile) { await page.mouse.click(cx + w / 5, cy); }
      else { const play = (await L.nodes(page)).find((n) => /^(Play|Pause)/.test(n.label)); if (play) await page.touchscreen.tap(play.x, play.y); }
      await L.sleep(1500);
      const after = (await videoState(page)).paused;
      res.checks.togglePlay = { before, after, toggled: before !== after };
      // +10 s by keyboard (desktop) or button (mobile).
      const t1 = (await videoState(page)).t;
      if (!mobile) { await page.keyboard.press("ArrowRight"); }
      else { const f = (await L.nodes(page)).find((n) => /Forward 10/.test(n.label)); if (f) await page.touchscreen.tap(f.x, f.y); }
      await L.sleep(1200);
      const t2 = (await videoState(page)).t;
      res.checks.skip10 = { t1, t2, moved: t2 - t1 };
      // Mute.
      if (!mobile) { await page.keyboard.press("KeyM"); await L.sleep(500); }
      res.checks.mute = await videoState(page);
      await shot(page, `${tag}/video-${width}-after-actions`);
      // Scroll to details.
      await page.mouse.move(cx, cy + h / 2 + 200);
      await page.mouse.wheel({ deltaY: 500 }); await L.sleep(1200);
      await shot(page, `${tag}/video-${width}-details`);
    }
    res.consoleErrors = app.prepared.consoleErrors.slice(0, 20);
    res.failed = app.prepared.failed.slice(0, 20);
  } catch (e) {
    res.error = e.message;
    await shot(page, `${tag}/video-${width}-error`).catch(() => {});
  } finally {
    const out = path.join(__dirname, "..", "evidence");
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, `video-page-${tag}-${width}.json`), JSON.stringify(res, null, 2));
    console.log(JSON.stringify(res, null, 2).slice(0, 4000));
    await app.close();
    process.exit(0);
  }
})();
