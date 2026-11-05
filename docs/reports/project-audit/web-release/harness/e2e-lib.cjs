// Shared browser helpers for the release e2e scripts (local, isolated stack).
// puppeteer-core is resolved from NODE_PATH.
const path = require('path');
const http = require('http');
const fs = require('fs');
const puppeteer = require('puppeteer-core');
const L = require('../../web-tasking/harness/lib.cjs');

const FS = 'http://127.0.0.1:8095/v1/projects/demo-youpeak-local/databases/(default)/documents';
const owner = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

async function launch({ width = 1366, height = 768, userDataDir } = {}) {
  return puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    protocolTimeout: 180000,
    // The fake R2 uses a throwaway self-signed certificate.
    args: [`--window-size=${width},${height}`, '--autoplay-policy=no-user-gesture-required', '--force-device-scale-factor=1', '--mute-audio', '--ignore-certificate-errors'],
    defaultViewport: { width, height, deviceScaleFactor: 1 },
    ...(userDataDir ? { userDataDir } : {}),
  });
}

async function openApp({ dir, port, width = 1366, height = 768, profile, withExternal = true, log }) {
  const server = await L.serveDir(dir, port);
  let ext = null;
  if (withExternal) {
    ext = http.createServer((q, r) => { r.setHeader('Content-Type', 'text/html'); r.end('<title>EXTERNAL</title><h1>external page</h1>'); });
    await new Promise((r) => ext.listen(port + 1, '127.0.0.1', r));
  }
  if (profile) fs.rmSync(profile, { recursive: true, force: true });
  const browser = await launch({ width, height, userDataDir: profile });
  const prepared = await L.preparePage(browser, { log, extraAllow: [] });
  const { page } = prepared;
  await page.evaluateOnNewDocument(() => {
    const s = document.createElement('style');
    s.textContent = '.firebase-emulator-warning{display:none!important}';
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s));
  });
  const origin = `http://127.0.0.1:${port}/`;
  const app = {
    browser, page, prepared, origin, server, ext,
    // semantics:false keeps Flutter's accessibility tree off: the browser's
    // text fields only take typed input in that mode, so sign-in is done
    // by coordinates first and semantics are switched on afterwards.
    async goExternalThenApp({ semantics = true } = {}) {
      if (ext) await page.goto(`http://127.0.0.1:${port + 1}/`);
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('flt-semantics-placeholder, flutter-view', { timeout: 90000 });
      await L.sleep(8000);
      if (semantics) await ensureSemantics(page);
    },
    async close() { await browser.close(); server.close(); if (ext) ext.close(); },
  };
  return app;
}

// Flutter's "Enable accessibility" placeholder reacts to a click in a desktop
// window but needs a touch tap when the page emulates a phone.
async function ensureSemantics(page) {
  const on = () => page.evaluate(() => document.querySelectorAll('flt-semantics').length > 0);
  if (await on()) return;
  await page.evaluate(() => document.querySelector('flt-semantics-placeholder')?.click());
  await L.sleep(500);
  if (await on()) return;
  const r = await page.evaluate(() => { const b = document.querySelector('flt-semantics-placeholder')?.getBoundingClientRect(); return b ? [b.x + b.width / 2, b.y + b.height / 2] : null; });
  if (r) { await page.touchscreen.tap(Math.max(r[0], 1), Math.max(r[1], 1)); await L.sleep(800); }
}

async function labels(page, max = 30) {
  try { return [...new Set((await L.nodes(page)).map((n) => n.label).filter(Boolean))].slice(0, max); } catch (_) { return []; }
}

async function hist(page) {
  return page.evaluate(() => ({ href: location.href, len: history.length, state: JSON.stringify(history.state)?.slice(0, 80) }));
}

// Onboarding (3 x Next) -> "Sign in with password" -> credentials -> Sign in.
async function signInWithPassword(page, email = 'viewer@youpeak.test', password = 'Test@1234') {
  for (let i = 0; i < 3; i++) {
    const n = await L.findNode(page, 'Next', { timeout: 4000 }).catch(() => null);
    if (!n) break;
    await page.mouse.click(n.x, n.y); await L.sleep(900);
  }
  await L.tap(page, 'Sign in with password', { timeout: 15000, after: 1500 });
  await L.typeInto(page, 'Email', email);
  await L.typeInto(page, 'Password', password);
  const btn = await L.findNode(page, 'Sign in', { role: 'button', timeout: 8000 }).catch(() => L.findNode(page, 'Sign in', { timeout: 8000 }));
  await page.mouse.click(btn.x, btn.y);
  await L.sleep(9000);
}

// Where the sign-in controls are for a viewport, read once from a throwaway
// session with semantics on (cached in the out dir).
async function probeSignInCoords({ dir, port, width, height, mobile, cacheFile }) {
  if (cacheFile && fs.existsSync(cacheFile)) return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  const app = await openApp({ dir, port, width, height, withExternal: false, profile: undefined });
  if (mobile) await app.page.setViewport({ width, height, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await app.goExternalThenApp();
  const { page } = app;
  const next = await L.findNode(page, 'Next', { timeout: 20000 });
  for (let i = 0; i < 3; i++) { const n = await L.findNode(page, 'Next', { timeout: 4000 }); await page.mouse.click(n.x, n.y); await L.sleep(900); }
  const pw = await L.findNode(page, 'Sign in with password', { timeout: 15000 });
  await page.mouse.click(pw.x, pw.y); await L.sleep(1500);
  const email = await L.findNode(page, 'Email'); const pass = await L.findNode(page, 'Password');
  const sign = (await L.nodes(page)).filter((n) => n.label === 'Sign in').pop();
  const coords = { next: [next.x, next.y], password: [pw.x, pw.y], email: [email.x, email.y], pass: [pass.x, pass.y], signIn: [sign.x, sign.y] };
  await app.close();
  if (cacheFile) fs.writeFileSync(cacheFile, JSON.stringify(coords));
  return coords;
}

// Sign in with the local test account using coordinates (semantics off).
async function signInByCoords(page, coords, email = 'viewer@youpeak.test', password = 'Test@1234') {
  for (let i = 0; i < 3; i++) { await page.mouse.click(...coords.next); await L.sleep(1000); }
  await page.mouse.click(...coords.password); await L.sleep(1500);
  await page.mouse.click(...coords.email); await L.sleep(600); await page.keyboard.type(email, { delay: 20 });
  await page.mouse.click(...coords.pass); await L.sleep(600); await page.keyboard.type(password, { delay: 20 });
  await page.mouse.click(...coords.signIn);
  await L.sleep(10000);
  await ensureSemantics(page);
}

async function userDoc(id) {
  const res = await fetch(`${FS}/users/${id}`, { headers: owner });
  if (!res.ok) return null;
  const d = await res.json();
  const out = {};
  for (const [k, v] of Object.entries(d.fields || {})) out[k] = v.stringValue ?? v.integerValue ?? v.doubleValue ?? v.booleanValue ?? null;
  return out;
}

async function query(collection, field, value) {
  const res = await fetch(`${FS}:runQuery`, {
    method: 'POST', headers: owner,
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: collection }], where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { stringValue: value } } } } }),
  });
  return (await res.json()).filter((r) => r.document).map((r) => r.document);
}

async function fakeR2(mode) {
  if (mode) await fetch('https://127.0.0.1:5099/__mode', { method: 'POST', body: JSON.stringify(mode) });
}

module.exports = { ensureSemantics, probeSignInCoords, signInByCoords, L, launch, openApp, labels, hist, signInWithPassword, userDoc, query, FS, owner };
