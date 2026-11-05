// Watch-time earning from a browser, and the lock page unlocking by itself,
// against the isolated local stack (local fixture videos are test-only).
// argv: buildDir port outDir backendLog
//
// Phases (credited seconds read from the server ledger, users doc:
// totalWatchTime minutes * 60 + watchSecondsCarry):
//   A  playing, tab visible          -> credited, never faster than wall clock
//   B  tab hidden (another tab open) -> nothing credited
//   C  visible again, paused         -> nothing credited
//   D  web earning switched off while the lock page is open, then on again
//      -> the page unlocks on its own, without tapping anything.
const L = require('./lib.cjs');
const fs = require('fs');
const path = require('path');

const [dir, port, out, backendLog] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const FS = 'http://127.0.0.1:8095/v1/projects/demo-youpeak-local/databases/(default)/documents';
const owner = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };
const results = [];
const record = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(ok ? 'PASS' : 'FAIL', name, JSON.stringify(detail ?? '').slice(0, 300)); };

async function setWebTasking(on) {
  await fetch(`${FS}/settings/default_settings?updateMask.fieldPaths=allowWebTasking`, { method: 'PATCH', headers: owner, body: JSON.stringify({ fields: { allowWebTasking: { booleanValue: on } } }) });
  await fetch(`${FS}/system_configs/app_policy?updateMask.fieldPaths=security.allowWebTasking`, { method: 'PATCH', headers: owner, body: JSON.stringify({ fields: { security: { mapValue: { fields: { allowWebTasking: { booleanValue: on } } } } } }) });
}

async function credited() {
  const d = await (await fetch(`${FS}/users/local_app_user`, { headers: owner })).json();
  const n = (f) => Number(d.fields?.[f]?.integerValue ?? d.fields?.[f]?.doubleValue ?? 0);
  return n('totalWatchTime') * 60 + n('watchSecondsCarry');
}

// Heartbeats the backend has answered so far (from its request log).
function heartbeats() {
  const text = fs.readFileSync(backendLog, 'utf8').replace(/\x1b\[[0-9;]*m/g, '');
  return (text.match(/POST \/client\/watch\/heartbeat \d+/g) || []);
}

async function videoState(page) {
  return page.evaluate(() => [...document.querySelectorAll('video')].map((v) => ({ paused: v.paused, muted: v.muted, volume: v.volume, t: Number(v.currentTime.toFixed(1)) })));
}

(async () => {
  await setWebTasking(true);
  // dir may be a running dev server URL (debug build via flutter run).
  const server = /^https?:/.test(dir) ? { close() {}, closeAllConnections() {} } : await L.serveDir(dir, Number(port));
  const profile = path.join(out, '..', 'profile-watch');
  fs.rmSync(profile, { recursive: true, force: true });
  const browser = await L.launch({ width: 1920, height: 1080, userDataDir: profile });
  const { page, blocked, consoleErrors } = await L.preparePage(browser);
  await page.evaluateOnNewDocument(() => {
    const s = document.createElement('style');
    s.textContent = '.firebase-emulator-warning{display:none!important}';
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s));
  });
  const url = /^https?:/.test(dir) ? dir : `http://127.0.0.1:${port}/`;
  const evidence = { results };

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('flt-semantics-placeholder, flutter-view', { timeout: 90000 });
  await L.sleep(7000);
  for (let i = 0; i < 3; i++) { await page.mouse.click(1580, 1047); await L.sleep(900); }
  await page.mouse.click(1580, 811); await L.sleep(1500);
  await page.mouse.click(1585, 432); await L.sleep(500); await page.keyboard.type('viewer@youpeak.test', { delay: 20 });
  await page.mouse.click(1585, 528); await L.sleep(500); await page.keyboard.type('Test@1234', { delay: 20 });
  await page.mouse.click(1580, 639);
  await L.sleep(9000);

  // Open a video from Home.
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await L.enableSemantics(page);
  await L.sleep(7000);
  await L.tap(page, '09:56', { timeout: 30000, after: 8000 }); // the thumbnail's duration badge
  evidence.videoAtOpen = await videoState(page);
  await page.screenshot({ path: `${out}/50-video-open-1920.png` });
  // Test-only aid: the local fixture clip is ~6 s long, so loop it to get a
  // minute of real playback. A loop restart is a backward jump, which the
  // client accumulator rejects (counts as a seek) — looping cannot add time.
  evidence.playerNote = "fixture clip looped in the page (test-only); audible, 1x";
  // Loop the element, then press play through the app (its own controls),
  // so the app's player — not the harness — is what plays.
  await page.evaluate(() => document.querySelectorAll("video").forEach((v) => { v.loop = true; }));
  const box = await page.evaluate(() => { const r = document.querySelector("video")?.getBoundingClientRect(); return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null; });
  for (let i = 0; i < 4 && box; i++) {
    const st = (await videoState(page))[0];
    if (st && !st.paused) break;
    await page.mouse.click(box.x, box.y);
    await L.sleep(1500);
  }
  await page.screenshot({ path: `${out}/50b-video-playing-1920.png` });
  evidence.videoAfterPlay = await videoState(page);

  // A: visible playback.
  const a0 = await credited(); const hb0 = heartbeats().length; const tA = Date.now();
  await L.sleep(65000);
  const a1 = await credited(); const hb1 = heartbeats().length; const wallA = (Date.now() - tA) / 1000;
  evidence.videoDuringA = await videoState(page);
  record('A: visible playback earns watch time', a1 > a0, { creditedSeconds: +(a1 - a0).toFixed(1), wallSeconds: +wallA.toFixed(1), heartbeats: hb1 - hb0, video: evidence.videoDuringA });
  record('A: never more than wall-clock time', a1 - a0 <= wallA + 1, { creditedSeconds: +(a1 - a0).toFixed(1), wallSeconds: +wallA.toFixed(1) });

  // B: tab hidden — another tab in front.
  const other = await browser.newPage();
  await other.goto('about:blank');
  await other.bringToFront();
  await L.sleep(3000);
  evidence.hiddenState = await page.evaluate(() => document.visibilityState);
  const b0 = await credited(); const tB = Date.now();
  await L.sleep(45000);
  const b1 = await credited();
  evidence.videoDuringB = await videoState(page);
  record('B: hidden tab earns nothing', b1 - b0 <= 0.5, { visibilityState: evidence.hiddenState, creditedSeconds: +(b1 - b0).toFixed(1), wallSeconds: +((Date.now() - tB) / 1000).toFixed(1), video: evidence.videoDuringB });
  await page.bringToFront();
  await other.close();
  await L.sleep(3000);

  // C: visible but paused.
  await page.evaluate(() => document.querySelectorAll('video').forEach((v) => v.pause()));
  // Let the next heartbeat deliver the seconds genuinely played before the
  // pause, then measure.
  await L.sleep(12000);
  const c0 = await credited();
  await L.sleep(35000);
  const c1 = await credited();
  record('C: paused playback earns nothing', c1 - c0 <= 0.5, { creditedSeconds: +(c1 - c0).toFixed(1), video: await videoState(page) });
  await page.screenshot({ path: `${out}/51-video-after-phases-1920.png` });

  // D: lock page unlocks by itself when web earning comes back.
  await setWebTasking(false);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await L.enableSemantics(page);
  await L.sleep(7000);
  await L.tap(page, 'Tasker', { role: 'button', timeout: 30000, after: 7000 });
  await L.tap(page, /^(Check in & daily tasks|Watch ads & do tasks)$/, { timeout: 20000, after: 5000 });
  const lockedLabels = (await L.nodes(page)).map((n) => n.label).join(' | ');
  await page.screenshot({ path: `${out}/52-locked-1920.png` });
  record('D: lock page shown while web earning is off', /switched off/.test(lockedLabels) && !/Check again/.test(lockedLabels));
  await setWebTasking(true);
  const tD = Date.now();
  let unlocked = false;
  while (Date.now() - tD < 100000) {
    await L.sleep(5000);
    const now = (await L.nodes(page)).map((n) => n.label).join(' | ');
    if (/My Daily Tasks|Earn More/.test(now)) { unlocked = true; break; }
  }
  await page.screenshot({ path: `${out}/53-unlocked-1920.png` });
  record('D: unlocks by itself after it is switched back on (no tap)', unlocked, { afterSeconds: +((Date.now() - tD) / 1000).toFixed(0) });

  // E: Channel Details (opened from a video card's title/channel line).
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await L.enableSemantics(page);
  await L.sleep(7000);
  await L.tap(page, /^Welcome to YouPeak/, { timeout: 30000, after: 15000 });
  for (const [w, h] of [[1920, 1080], [1366, 768], [768, 1024], [390, 844]]) {
    await page.setViewport({ width: w, height: h });
    await L.sleep(2500);
    await page.screenshot({ path: `${out}/60-channel-${w}.png` });
  }
  evidence.channelLabels = (await L.nodes(page)).map((n) => n.label).filter(Boolean);

  evidence.blocked = [...new Set(blocked)];
  evidence.consoleErrors = [...new Set(consoleErrors)];
  fs.writeFileSync(`${out}/watch-evidence.json`, JSON.stringify(evidence, null, 1));
  await Promise.race([browser.close(), L.sleep(10000)]);
  server.closeAllConnections(); server.close();
  process.exit(0);
})().catch(async (e) => { console.error(e); try { await setWebTasking(true); } catch (_) {} process.exit(1); });
