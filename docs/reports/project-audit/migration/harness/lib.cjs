// Shared helpers for driving the Flutter web build in headless Chrome.
// Network policy: loopback services (local API, emulators, fixture server,
// static build server) plus the static assets Flutter web itself loads.
// Everything else is aborted and recorded with its full URL for review.
const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ALLOW = [
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//,
  /^wss?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//,
  /^https:\/\/www\.gstatic\.com\/(flutter-canvaskit|firebasejs)\//,
  /^https:\/\/fonts\.(gstatic|googleapis)\.com\//,
  /^data:/,
  /^blob:/,
];

function serveDir(dir, port) {
  const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.otf': 'font/otf', '.css': 'text/css', '.ico': 'image/x-icon', '.webp': 'image/webp', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.frag': 'text/plain' };
  const root = path.resolve(dir);
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(root, p);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { if (p !== '/' && process.env.DEBUG_FALLBACK) console.log('FALLBACK', p); file = path.join(root, 'index.html'); }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(port, '127.0.0.1', () => r(server)));
}

async function launch({ width = 1920, height = 1080, userDataDir, protocolTimeout = 180000 } = {}) {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    protocolTimeout,
    args: [`--window-size=${width},${height}`, '--autoplay-policy=no-user-gesture-required', '--force-device-scale-factor=1', '--mute-audio'],
    defaultViewport: { width, height, deviceScaleFactor: 1 },
    ...(userDataDir ? { userDataDir } : {}),
  });
}

async function preparePage(browser, { log, extraAllow = [], override } = {}) {
  const page = await browser.newPage();
  const blocked = [];
  const consoleErrors = [];
  const failed = [];
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    const url = req.url();
    if (override && (await override(req))) return;
    if (ALLOW.some((re) => re.test(url)) || extraAllow.some((re) => re.test(url))) return req.continue();
    blocked.push(`${req.method()} ${url.slice(0, 200)}`);
    req.abort('blockedbyclient');
  });
  page.on('requestfailed', (req) => {
    const err = req.failure()?.errorText || '';
    if (err !== 'net::ERR_BLOCKED_BY_CLIENT') failed.push(`${req.method()} ${req.url().slice(0, 160)} ${err}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400 && /localhost|127\.0\.0\.1/.test(res.url())) failed.push(`HTTP ${res.status()} ${res.url().slice(0, 160)}`);
  });
  page.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error') consoleErrors.push(t.slice(0, 400));
    if (log) log(`[console.${m.type()}] ${t.slice(0, 400)}`);
  });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message.slice(0, 400)));
  return { page, blocked, consoleErrors, failed };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Flutter web keeps its accessibility tree off until asked.
async function enableSemantics(page) {
  await page.waitForFunction(() => document.querySelector('flt-semantics-placeholder') || document.querySelector('flt-semantics'), { timeout: 90000 });
  await page.evaluate(() => {
    const p = document.querySelector('flt-semantics-placeholder');
    if (p) p.click();
  });
  await sleep(700);
}

async function nodes(page) {
  return page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('flt-semantics, input, textarea')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ').trim();
      // Text may sit in plain child elements (spans) of a semantics node; use it
      // when no nested semantics node owns it.
      const leafText = el.tagName === 'FLT-SEMANTICS' && !el.querySelector('flt-semantics') ? (el.textContent || '').trim() : '';
      const label = (el.getAttribute('aria-label') || '').trim() || own || (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? (el.getAttribute('placeholder') || '') : '') || leafText || (el.childElementCount === 0 ? (el.textContent || '').trim() : '');
      out.push({ tag: el.tagName.toLowerCase(), role: el.getAttribute('role') || '', label, x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height });
    }
    return out;
  });
}

async function findNode(page, match, { timeout = 20000, role, pick = 'first' } = {}) {
  const start = Date.now();
  const test = typeof match === 'string' ? (l) => l.toLowerCase() === match.toLowerCase() : (l) => match.test(l);
  while (Date.now() - start < timeout) {
    await enableSemanticsIfNeeded(page);
    const all = (await nodes(page)).filter((n) => test(n.label) && (!role || n.role === role));
    if (all.length) return pick === 'last' ? all[all.length - 1] : all[0];
    await sleep(300);
  }
  throw new Error(`semantics node not found: ${match}`);
}

async function enableSemanticsIfNeeded(page) {
  await page.evaluate(() => {
    const p = document.querySelector('flt-semantics-placeholder');
    if (p && !document.querySelector('flt-semantics')) p.click();
  });
}

async function tap(page, match, opts = {}) {
  const n = await findNode(page, match, opts);
  await page.mouse.click(n.x, n.y);
  await sleep(opts.after ?? 700);
  return n;
}

async function typeInto(page, match, text) {
  const n = await findNode(page, match);
  await page.mouse.click(n.x, n.y);
  await sleep(300);
  await page.keyboard.type(text, { delay: 15 });
  await sleep(200);
}

module.exports = { serveDir, launch, preparePage, enableSemantics, nodes, findNode, tap, typeInto, sleep };

// Focus the semantics <input> whose row matches [match] and type into it.
async function typeField(page, match, text) {
  const label = await findNode(page, match);
  const handles = await page.$$('input, textarea');
  let best = null, bestD = 1e9;
  for (const h of handles) {
    const r = await h.boundingBox();
    if (!r) continue;
    const d = Math.abs(r.y + r.height / 2 - label.y);
    if (d < bestD) { bestD = d; best = { h, r }; }
  }
  if (!best || bestD > 40) throw new Error(`no input near ${match}`);
  await page.mouse.click(best.r.x + best.r.width / 2, best.r.y + best.r.height / 2);
  await sleep(400);
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.tagName);
  if (focused !== 'INPUT' && focused !== 'TEXTAREA') await best.h.focus();
  await page.keyboard.type(text, { delay: 25 });
  await sleep(300);
}
module.exports.typeField = typeField;
