// Before/after screenshot capture of the affected screens at four sizes.
// argv: buildDir port label outDir
const L = require('./lib.cjs');
const fs = require('fs');
const path = require('path');

const SIZES = [[1920, 1080], [1366, 768], [768, 1024], [390, 844]];
// [file stem, sidebar label, extra settle ms]
const PAGES = [
  ['02-library', 'Library', 2500],
  ['03-bites', 'Bites', 5000],
  ['04-search', 'Search', 2500],
  ['05-notifications', 'Notifications', 6000],
  ['06-profile', 'Profile', 4000],
  ['07-tasker', 'Tasker', 6000],
];

async function videoState(page) {
  return page.evaluate(() => [...document.querySelectorAll('video')].map((v) => {
    const r = v.getBoundingClientRect();
    return { src: (v.currentSrc || v.src || '').split('/').pop(), paused: v.paused, muted: v.muted, t: Number(v.currentTime.toFixed(2)), vw: v.videoWidth, vh: v.videoHeight, fit: getComputedStyle(v).objectFit, box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] };
  }));
}

async function labels(page) {
  return [...new Set((await L.nodes(page)).map((n) => n.label).filter(Boolean))].slice(0, 60);
}

(async () => {
  const [dir, port, label, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const profile = path.join(out, '..', `profile-${label}`);
  fs.rmSync(profile, { recursive: true, force: true });
  const server = await L.serveDir(dir, Number(port));
  const browser = await L.launch({ width: 1920, height: 1080, userDataDir: profile });
  const evidence = { label, pages: {}, blocked: [], consoleErrors: [], failed: [] };
  let { page, blocked, consoleErrors, failed } = await L.preparePage(browser);
  const url = `http://127.0.0.1:${port}/`;

  // 1. Onboarding (fresh profile) at all sizes.
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('flt-semantics-placeholder, flutter-view', { timeout: 90000 });
  await L.sleep(7000);
  for (const [w, h] of SIZES) {
    await page.setViewport({ width: w, height: h });
    await L.sleep(1500);
    await page.screenshot({ path: `${out}/01-onboarding-${w}.png` });
  }

  // 2. Sign in at 1920x1080 by coordinates (semantics off: see notes).
  await page.setViewport({ width: 1920, height: 1080 });
  await L.sleep(1500);
  for (let i = 0; i < 3; i++) { await page.mouse.click(1580, 1047); await L.sleep(900); }
  await page.mouse.click(1580, 811); await L.sleep(1500);
  await page.mouse.click(1585, 432); await L.sleep(500); await page.keyboard.type('viewer@youpeak.test', { delay: 20 });
  await page.mouse.click(1585, 528); await L.sleep(500); await page.keyboard.type('Test@1234', { delay: 20 });
  await page.screenshot({ path: `${out}/00-login-filled-1920.png` });
  await page.mouse.click(1580, 639);
  await L.sleep(9000);
  await page.screenshot({ path: `${out}/00-home-after-login-1920.png` });
  evidence.loginLandedOn = (await labels(page)).slice(0, 12);
  // --seed-session (before-build only): the original build cannot finish a
  // fresh sign-in (profile call sent without a token -> 401), so simulate an
  // existing user who signed in earlier: same Firebase session, plus the
  // loginUserId / isNewUser keys a completed sign-in leaves in GetStorage.
  if (process.argv.includes('--seed-session')) {
    evidence.seededSession = await page.evaluate(() => {
      const store = JSON.parse(localStorage.getItem('GetStorage') || '{}');
      const before = { loginUserId: store.loginUserId ?? null, isNewUser: store.isNewUser ?? null };
      store.loginUserId = 'local_app_user';
      store.isNewUser = false;
      localStorage.setItem('GetStorage', JSON.stringify(store));
      return before;
    });
  }

  // 3. Each page: open from the desktop navigation, then resize in place.
  for (const [stem, navLabel, settle] of PAGES) {
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await L.enableSemantics(page);
    await L.sleep(6000);
    const rec = { nav: navLabel, sizes: {} };
    try {
      await L.tap(page, navLabel, { role: 'button', timeout: 30000, after: settle });
    } catch (e) {
      rec.navError = e.message;
    }
    for (const [w, h] of SIZES) {
      if (w !== 1920) { await page.setViewport({ width: w, height: h }); await L.sleep(2000); }
      await page.screenshot({ path: `${out}/${stem}-${w}.png` });
      rec.sizes[w] = { labels: await labels(page), videos: await videoState(page) };
    }
    evidence.pages[stem] = rec;
  }

  evidence.blocked = [...new Set(blocked)];
  evidence.failed = [...new Set(failed)];
  evidence.consoleErrors = [...new Set(consoleErrors)];
  fs.writeFileSync(`${out}/evidence.json`, JSON.stringify(evidence, null, 1));
  console.log('done', label, 'blocked', evidence.blocked, 'failed', evidence.failed.slice(0, 10), 'consoleErrors', evidence.consoleErrors.slice(0, 10));
  await browser.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
