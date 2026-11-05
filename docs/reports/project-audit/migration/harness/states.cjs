// After-build checks: Bites playback/interaction on desktop, and loading /
// empty / error states of Bites, Notifications and Tasker. Responses are
// altered ONLY inside this test browser (request interception); the local
// backend and its data are untouched. argv: buildDir port outDir
const L = require('./lib.cjs');
const fs = require('fs');
const path = require('path');

const [dir, port, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const url = `http://127.0.0.1:${port}/`;
const results = [];
const record = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(ok ? 'PASS' : 'FAIL', name, JSON.stringify(detail ?? '').slice(0, 400)); };
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };

// Test-browser-only response overrides, switched per scenario.
let mode = null;
async function override(req) {
  const u = req.url();
  if (!mode || req.method() === 'OPTIONS') return false;
  const match = (re) => re.test(u);
  if (mode === 'bites-fail' && match(/client\/video\/getShorts/)) { await req.abort('failed'); return true; }
  if (mode === 'bites-empty' && match(/client\/video\/getShorts/)) { await req.respond({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify({ status: true, message: 'ok', total: 0, shorts: [] }) }); return true; }
  if (mode === 'bites-slow' && match(/client\/video\/getShorts/)) { await L.sleep(6000); return false; }
  if (mode === 'notif-fail' && match(/client\/notification/)) { await req.abort('failed'); return true; }
  if (mode === 'notif-401' && match(/client\/notification/)) { await req.respond({ status: 401, headers: CORS, contentType: 'application/json', body: JSON.stringify({ status: false, code: 'AUTH_REQUIRED', message: 'Please sign in again to continue.' }) }); return true; }
  if (mode === 'tasker-fail' && match(/client\/tasker\/dashboard/)) { await req.abort('failed'); return true; }
  return false;
}

async function videos(page) {
  return page.evaluate(() => [...document.querySelectorAll('video')].map((v) => ({ src: (v.currentSrc || v.src || '').split('/').pop(), paused: v.paused, muted: v.muted, volume: v.volume, t: Number(v.currentTime.toFixed(2)), vw: v.videoWidth, vh: v.videoHeight })));
}
const playing = async (page) => (await videos(page)).filter((v) => !v.paused).map((v) => v.src);
const labels = async (page) => [...new Set((await L.nodes(page)).map((n) => n.label).filter(Boolean))];

async function openFresh(page, navLabel, settle = 5000) {
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await L.enableSemantics(page);
  await L.sleep(6000);
  await L.tap(page, navLabel, { role: 'button', timeout: 30000, after: settle });
}

(async () => {
  const server = await L.serveDir(dir, Number(port));
  const profile = path.join(out, '..', 'profile-states');
  fs.rmSync(profile, { recursive: true, force: true });
  const browser = await L.launch({ width: 1920, height: 1080, userDataDir: profile });
  const { page, blocked, consoleErrors } = await L.preparePage(browser, { override });

  // Sign in through the real UI (semantics off for text entry).
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('flutter-view', { timeout: 90000 });
  await L.sleep(14000);
  for (let i = 0; i < 3; i++) { await page.mouse.click(1580, 1047); await L.sleep(900); }
  await page.mouse.click(1580, 811); await L.sleep(1500);
  await page.mouse.click(1585, 432); await L.sleep(500); await page.keyboard.type('viewer@youpeak.test', { delay: 20 });
  await page.mouse.click(1585, 528); await L.sleep(500); await page.keyboard.type('Test@1234', { delay: 20 });
  await page.mouse.click(1580, 639);
  await L.sleep(10000);
  await L.enableSemantics(page);
  const home = await labels(page);
  record('fresh email sign-in reaches the main screen', home.includes('Bites') && home.includes('Library'), home.slice(0, 10));

  // ---- Bites playback on desktop ----
  await openFresh(page, 'Bites', 7000);
  let v = await videos(page);
  let p = await playing(page);
  record('exactly one Bite plays (any preloaded neighbour is paused)', p.length === 1 && v.filter((x) => x.paused).length === v.length - 1, v);
  await page.screenshot({ path: `${out}/bites-1-playing.png` });

  // Learn the feed order with the keyboard (it is shuffled per load).
  const order = [p[0]];
  for (let i = 0; i < 2; i++) { await page.keyboard.press('ArrowDown'); await L.sleep(2500); order.push((await playing(page))[0]); }
  record('ArrowDown steps through the Bites one at a time', new Set(order).size === 3, order);
  for (let i = 0; i < 2; i++) { await page.keyboard.press('ArrowUp'); await L.sleep(2500); }
  p = await playing(page);
  record('ArrowUp steps back to the first Bite', p[0] === order[0], { now: p, expected: order[0] });

  await page.mouse.move(1034, 540);
  await page.mouse.wheel({ deltaY: 120 });
  await L.sleep(2500);
  p = await playing(page);
  record('one wheel notch moves to the next Bite', p.length === 1 && p[0] === order[1], { now: p, expected: order[1] });
  await page.mouse.wheel({ deltaY: -120 });
  await L.sleep(2500);

  // Trackpad-like inertial burst (90 events over ~1.5 s, with the dispatch
  // stalls headless Chrome adds while the page is busy) from the first Bite:
  // must land on the second, not skip to the third.
  for (let i = 0; i < 90; i++) { await page.mouse.wheel({ deltaY: 20 }); await L.sleep(16); }
  await L.sleep(2500);
  p = await playing(page);
  record('a long trackpad swipe forward moves exactly one Bite', p.length === 1 && p[0] === order[1], { now: p, expected: order[1], order });
  await page.screenshot({ path: `${out}/bites-2-after-swipe.png` });
  for (let i = 0; i < 90; i++) { await page.mouse.wheel({ deltaY: -20 }); await L.sleep(16); }
  await L.sleep(2500);
  p = await playing(page);
  record('a long trackpad swipe back moves exactly one Bite', p.length === 1 && p[0] === order[0], { now: p, expected: order[0] });

  await L.tap(page, 'Mute', { timeout: 10000, after: 800 });
  v = await videos(page);
  const active = v.find((x) => !x.paused);
  record('sound control mutes the active Bite', !!active && (active.muted || active.volume === 0), active);
  await page.keyboard.press('ArrowDown');
  await L.sleep(2500);
  v = await videos(page);
  const next = v.find((x) => !x.paused);
  record('mute carries over to the next Bite', !!next && (next.muted || next.volume === 0), next);
  await L.tap(page, 'Unmute', { timeout: 10000, after: 800 });

  await L.tap(page, 'Pause', { timeout: 10000, after: 1200 });
  p = await playing(page);
  record('pause control pauses playback', p.length === 0, await videos(page));
  await page.screenshot({ path: `${out}/bites-3-paused.png` });
  await L.tap(page, 'Play', { timeout: 10000, after: 1500 });
  p = await playing(page);
  record('play control resumes playback', p.length === 1, p);

  // Find and screenshot the landscape fixture (letterboxed, not cropped).
  for (let i = 0; i < 3; i++) {
    const cur = await playing(page);
    if (cur[0] === 'fixture-bite-landscape.webm') break;
    await page.keyboard.press('ArrowDown'); await L.sleep(2500);
  }
  p = await playing(page);
  await page.screenshot({ path: `${out}/bites-4-landscape-contain.png` });
  record('landscape fixture reached for the contain check', p[0] === 'fixture-bite-landscape.webm', p);

  await L.tap(page, 'Comments', { timeout: 10000, after: 2500 });
  await page.screenshot({ path: `${out}/bites-5-comments-1920.png` });
  const commentLabels = await labels(page);
  record('comments panel opens on desktop', commentLabels.some((l) => /comments/i.test(l)), commentLabels.slice(0, 12));
  await page.keyboard.press('Escape'); await L.sleep(1000);

  // Bites at the other sizes with real content.
  for (const [w, h] of [[1366, 768], [768, 1024], [390, 844]]) {
    await page.setViewport({ width: w, height: h });
    await L.sleep(2500);
    await page.screenshot({ path: `${out}/bites-playing-${w}.png` });
  }

  // ---- Loading / empty / error states ----
  mode = 'bites-slow';
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await L.enableSemantics(page); await L.sleep(6000);
  await L.tap(page, 'Bites', { role: 'button', after: 1500 });
  await page.screenshot({ path: `${out}/state-bites-loading.png` });
  await L.sleep(9000);
  record('Bites leaves the loading state after a slow response', (await playing(page)).length === 1, await videos(page));

  mode = 'bites-empty';
  await openFresh(page, 'Bites', 5000);
  let lb = await labels(page);
  await page.screenshot({ path: `${out}/state-bites-empty.png` });
  record('Bites empty state is localized ("No Bites yet.")', lb.some((l) => l.includes('No Bites yet.')) && !lb.some((l) => l.includes('shortsNotAvailable')), lb.slice(-6));

  mode = 'bites-fail';
  await openFresh(page, 'Bites', 5000);
  lb = await labels(page);
  await page.screenshot({ path: `${out}/state-bites-error.png` });
  record('Bites network failure shows an error with Retry', lb.some((l) => /Couldn't load Bites/.test(l)) && lb.some((l) => /^Retry$/.test(l)), lb.slice(-6));
  mode = null;
  await L.tap(page, 'Retry', { role: 'button', after: 6000 });
  record('Retry recovers Bites once the server answers', (await playing(page)).length === 1, await videos(page));

  mode = null;
  await openFresh(page, 'Notifications', 6000);
  lb = await labels(page);
  await page.screenshot({ path: `${out}/state-notifications-empty.png` });
  record('Notifications finish loading: empty inbox shows "No notifications yet."', lb.some((l) => l.includes('No notifications yet.')), lb.slice(-6));

  mode = 'notif-fail';
  await openFresh(page, 'Notifications', 6000);
  lb = await labels(page);
  await page.screenshot({ path: `${out}/state-notifications-error.png` });
  record('Notifications network failure shows an error with Retry', lb.some((l) => /Couldn't load your notifications/.test(l)) && lb.includes('Retry'), lb.slice(-6));

  mode = 'notif-401';
  await openFresh(page, 'Notifications', 6000);
  lb = await labels(page);
  await page.screenshot({ path: `${out}/state-notifications-401.png` });
  record('Notifications 401 asks the user to sign in again', lb.some((l) => /Please sign in again/.test(l)) && lb.includes('Sign in'), lb.slice(-6));

  mode = null;
  await openFresh(page, 'Tasker', 7000);
  lb = await labels(page);
  record('Tasker finishes loading with live (local) data', lb.some((l) => /Lifetime Watch Hours/.test(l)), lb.slice(-8));

  mode = 'tasker-fail';
  await openFresh(page, 'Tasker', 7000);
  lb = await labels(page);
  await page.screenshot({ path: `${out}/state-tasker-error.png` });
  record('Tasker network failure shows an error with Try again (no fake balance)', lb.some((l) => /Couldn't reach YouPeak/.test(l)) && lb.includes('Try again') && !lb.some((l) => /Lifetime Watch Hours/.test(l)), lb.slice(-6));
  mode = null;

  // Library after watching Bites in this session (history entries, if recorded).
  await openFresh(page, 'Library', 4000);
  lb = await labels(page);
  await page.screenshot({ path: `${out}/library-after-watching-1920.png` });
  record('Library desktop panel lists the library destinations', ['Your Videos', 'New Playlist', 'Watch Later'].every((x) => lb.includes(x)), lb.slice(-12));

  fs.writeFileSync(`${out}/states.json`, JSON.stringify({ results, blocked: [...new Set(blocked)], consoleErrors: [...new Set(consoleErrors)].slice(0, 40) }, null, 1));
  console.log('blocked', [...new Set(blocked)]);
  await browser.close(); server.close();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
