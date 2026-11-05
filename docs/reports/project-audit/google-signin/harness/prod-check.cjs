// (a) deployed site: does the live client/setting response contain secret
//     field names? (names only, never values)
// (b) new production build served from an unauthorized origin (127.0.0.1):
//     Google click -> real Firebase "unauthorized-domain" -> new message.
// Read-only: no account is signed in, nothing is written.
const puppeteer = require('puppeteer-core');
const L = require('./lib.cjs');
const fs = require('fs');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SECRET_NAMES = ['private_key', 'privateKey', 'private_key_id', 'client_email', 'clientEmail', 'secretKey', 'JWT_SECRET', 'r2SecretAccessKey', 'cloudflareR2SecretKey', 'cloudflareApiToken', 'razorpayKeySecret', 'stripeSecretKey'];

async function launch(w, h) {
  return puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', defaultViewport: { width: w, height: h, deviceScaleFactor: 1 }, args: [`--window-size=${w},${h}`] });
}
function keysDeep(o, out = new Set()) { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { out.add(k); keysDeep(v, out); } return out; }

(async () => {
  const [dir, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const report = {};

  // (a)
  {
    const b = await launch(1920, 1080);
    const p = await b.newPage();
    let found = null;
    p.on('response', async (r) => { if (/api\.youpeak\.app\/client\/setting/.test(r.url()) && r.request().method() === 'GET') { try { const j = await r.json(); const ks = keysDeep(j); found = { status: r.status(), secretFieldNamesPresent: SECRET_NAMES.filter((n) => ks.has(n)), totalKeys: ks.size }; } catch (e) { found = { status: r.status(), parseError: true }; } } });
    await p.goto('https://youpeak-web.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 120000 });
    for (let i = 0; i < 60 && !found; i++) await sleep(500);
    report.liveClientSetting = found;
    await b.close();
  }

  // (b)
  {
    const server = await L.serveDir(dir, 5087);
    const b = await launch(1920, 1080);
    const p = await b.newPage();
    const log = [];
    p.on('console', (m) => { const t = m.text(); if (/GOOGLE_SIGNIN_DEBUG/.test(t)) log.push(t.slice(0, 200)); });
    await p.goto('http://127.0.0.1:5087/', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('flutter-view', { timeout: 90000 });
    await sleep(15000);
    await p.evaluate(() => { window.__toasts = []; new MutationObserver(() => document.querySelectorAll('.toastify').forEach((t) => { const x = t.textContent.trim(); if (x && !window.__toasts.includes(x)) window.__toasts.push(x); })).observe(document.body, { childList: true, subtree: true }); });
    for (let i = 0; i < 3; i++) { await p.mouse.click(1580, 1047); await sleep(1000); }
    await sleep(1500);
    await p.mouse.click(1580, 674);
    await sleep(2500);
    await p.screenshot({ path: `${out}/prod-build-unauthorized-domain.png` });
    await sleep(4000);
    report.unauthorizedOrigin = { origin: 'http://127.0.0.1:5087', console: log, toasts: await p.evaluate(() => window.__toasts) };
    await b.close(); server.close();
  }
  fs.writeFileSync(`${out}/prod-check.json`, JSON.stringify(report, null, 1));
  console.log(JSON.stringify(report, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
