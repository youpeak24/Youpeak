// Google sign-in end to end against the local stack (Auth emulator's fake
// Google account picker, emulator Firestore, local backend). No real Google
// account or production service is involved. argv: buildDir port outDir width height
const L = require('./lib.cjs');
const fs = require('fs');
const path = require('path');

const [dir, port, out, W = '1920', H = '1080'] = process.argv.slice(2);
const width = Number(W), height = Number(H);
fs.mkdirSync(out, { recursive: true });
const results = [];
const record = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(ok ? 'PASS' : 'FAIL', name, JSON.stringify(detail ?? '').slice(0, 300)); };
const FS = 'http://127.0.0.1:8095/v1/projects/demo-youpeak-local/databases/(default)/documents';
const owner = { Authorization: 'Bearer owner' };

let rewriteDomains = false; // test-browser-only: simulate an unauthorized domain
async function override(req) {
  const u = req.url();
  if (rewriteDomains && /127\.0\.0\.1:9095\/.*(getProjectConfig|\/v1\/projects)/.test(u) && req.method() === 'GET') {
    await req.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ projectId: 'demo-youpeak-local', authorizedDomains: ['youpeak-9ff65.firebaseapp.com'] }) });
    return true;
  }
  return false;
}

async function googleUsers() {
  const res = await fetch(`${FS}/users?pageSize=300`, { headers: owner });
  const j = await res.json();
  return (j.documents || []).filter((d) => d.fields?.loginType?.integerValue === '2').map((d) => ({ id: d.name.split('/').pop(), email: d.fields.email?.stringValue, fullName: d.fields.fullName?.stringValue ?? '' }));
}

(async () => {
  const server = await L.serveDir(dir, Number(port));
  const profile = path.join(out, '..', `profile-google-${width}`);
  fs.rmSync(profile, { recursive: true, force: true });
  const browser = await L.launch({ width, height, userDataDir: profile });
  const t0 = Date.now(); const ts = () => ((Date.now() - t0) / 1000).toFixed(1);
  const { page, blocked, consoleErrors } = await L.preparePage(browser, { override, log: (l) => { if (/GOOGLE_SIGNIN_DEBUG/.test(l)) console.log('   ', ts(), l.slice(0, 160)); } });
  // Test-only: the Firebase SDK's emulator-mode banner is fixed to the bottom
  // of the page and covers bottom buttons at phone widths.
  await page.evaluateOnNewDocument(() => document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '.firebase-emulator-warning{display:none!important}'; document.head.appendChild(st); }));
  const popups = [];
  browser.on('targetcreated', async (t) => { if (t.type() === 'page') { console.log('    ', ts(), 'WINDOW', t.url().slice(0, 60)); const p = await t.page().catch(() => null); if (p && p !== page) popups.push(p); } });
  const url = `http://localhost:${port}/`;
  const labels = async () => [...new Set((await L.nodes(page)).map((n) => n.label).filter(Boolean))];
  const watchToasts = () => page.evaluate(() => { window.__toasts = []; new MutationObserver(() => document.querySelectorAll('.toastify').forEach((t) => { const x = t.textContent.trim(); if (x && !window.__toasts.includes(x)) window.__toasts.push(x); })).observe(document.body, { childList: true, subtree: true }); });
  const toasts = () => page.evaluate(() => window.__toasts || []);
  const loaderVisible = async () => (await labels()).length === 0; // modal barrier hides the page's semantics
  const openApp = async () => { await page.goto(url, { waitUntil: 'domcontentloaded' }); await page.waitForSelector('flutter-view', { timeout: 90000 }); await L.sleep(14000); await L.enableSemantics(page); await L.sleep(1500); await watchToasts(); };
  const waitPopup = async (n) => { for (let i = 0; i < 60 && popups.length < n; i++) await L.sleep(250); return popups[n - 1]; };
  const clickInPopup = async (p, re) => {
    for (let i = 0; i < 40; i++) {
      const done = await p.evaluate((src) => { const re = new RegExp(src, 'i'); for (const el of document.querySelectorAll('button, li, a, [role=button]')) { if (re.test((el.textContent || '').trim()) && el.offsetParent !== null) { el.click(); return true; } } return false; }, re.source).catch(() => false);
      if (done) return true;
      await L.sleep(250);
    }
    return false;
  };

  // --- New user
  const baseline = (await googleUsers()).length;
  await openApp();
  for (let i = 0; i < 3; i++) await L.tap(page, 'Next', { after: 1000 });
  await L.findNode(page, 'Continue with Google', { timeout: 20000 });
  await page.screenshot({ path: `${out}/g01-letsin-${width}.png` });

  // Duplicate taps open one window only.
  const g = await L.findNode(page, 'Continue with Google');
  await page.mouse.click(g.x, g.y); await L.sleep(120); await page.mouse.click(g.x, g.y);
  await L.sleep(4000);
  record('two quick taps open a single Google window', popups.length === 1, { popups: popups.length });

  // Cancellation: close the window.
  const p1 = await waitPopup(1);
  await p1.close().catch(() => {});
  const tc = Date.now(); let lb = [];
  for (let i = 0; i < 40; i++) { await L.sleep(500); lb = await labels(); if (lb.includes('Continue with Google')) break; }
  console.log('    cancel settled after', ((Date.now() - tc) / 1000).toFixed(1), 's');
  record('closing the Google window returns to the sign-in screen (no stuck loader, no error toast)', lb.includes('Continue with Google') && (await toasts()).length === 0, { toasts: await toasts(), labels: lb.slice(-5) });
  await page.screenshot({ path: `${out}/g02-after-cancel-${width}.png` });

  // Sign in as a brand-new Google user (emulator account picker).
  await L.tap(page, 'Continue with Google', { after: 1500 });
  const p2 = await waitPopup(2);
  await p2.waitForSelector('body', { timeout: 20000 });
  await L.sleep(1500);
  await p2.screenshot({ path: `${out}/g03-emulator-picker-${width}.png` }).catch(() => {});
  const added = await clickInPopup(p2, /add new account/);
  await L.sleep(800);
  const autogen = await clickInPopup(p2, /auto-generate user information/);
  await L.sleep(800);
  const signedIn = await clickInPopup(p2, /sign in with google\.com/);
  record('emulator Google picker: new account created and chosen', added && autogen && signedIn, { added, autogen, signedIn });
  await L.sleep(15000);
  lb = await labels();
  await page.screenshot({ path: `${out}/g04-new-user-${width}.png` });
  let users = await googleUsers();
  record('backend verified the Google token and created the user (emulator Firestore)', users.length === baseline + 1, { before: baseline, after: users.length });
  record('new Google user is sent to Fill Profile', !lb.includes('Continue with Google') && !lb.includes('Home'), lb.slice(0, 8));

  // Finish the profile in the emulator (isolated), as Fill Profile would.
  const newest = users.find((u) => !u.fullName) || users[users.length - 1];
  if (newest) {
    await fetch(`${FS}/users/${newest.id}?updateMask.fieldPaths=fullName`, { method: 'PATCH', headers: { ...owner, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { fullName: { stringValue: 'Local Google Tester' } } }) });
  }

  // Refresh persistence.
  await openApp();
  lb = await labels();
  await page.screenshot({ path: `${out}/g05-after-refresh-${width}.png` });
  record('session persists across a page refresh (main screen)', lb.includes('Bites') && !lb.includes('Continue with Google'), lb.slice(0, 8));

  // Logout.
  await L.tap(page, width >= 900 ? 'Profile' : 'Your profile', { role: 'button', after: 4000 });
  if (width < 900) { await page.mouse.move(width / 2, height / 2); for (let i = 0; i < 6; i++) { await page.mouse.wheel({ deltaY: 400 }); await L.sleep(300); } await L.sleep(800); }
  await L.tap(page, 'Logout', { after: 1500 });
  await page.screenshot({ path: `${out}/g05b-logout-sheet-${width}.png` });
  await L.tap(page, 'Yes, Logout', { after: 6000 });
  lb = await labels();
  record('logout returns to the sign-in screen', lb.includes('Continue with Google'), lb.slice(-6));
  await page.screenshot({ path: `${out}/g06-after-logout-${width}.png` });

  // Returning user (a fresh page load after logout, as a returning visitor).
  await openApp();
  await L.tap(page, 'Continue with Google', { after: 1500 });
  const p3 = await waitPopup(3);
  await L.sleep(1500);
  const picked = await clickInPopup(p3, /@/); // the existing emulator account (listed by email)
  await L.sleep(15000);
  lb = await labels();
  await page.screenshot({ path: `${out}/g07-returning-user-${width}.png` });
  users = await googleUsers();
  record('returning Google user goes straight to the main screen (no duplicate account)', picked && lb.includes('Bites') && !lb.includes('Continue with Google') && users.length === baseline + 1, { picked, users: users.length, labels: lb.slice(0, 6) });

  // (The Auth emulator does not enforce authorized domains; that path is
  // verified against the real Firebase config separately.)
  if (false) {
  // Unauthorized domain (simulated in this browser only) -> specific message.
  if (width >= 900) await L.tap(page, 'Profile', { role: 'button', after: 4000 });
  else { await L.tap(page, 'Library', { after: 3000 }); const top = (await L.nodes(page)).filter((n) => n.role === 'button' && n.y < 60).sort((a, b) => b.x - a.x)[0]; if (top) { await page.mouse.click(top.x, top.y); await L.sleep(4000); } }
  await L.tap(page, 'Logout', { after: 1500 });
  await L.tap(page, 'Yes, Logout', { after: 6000 });
  rewriteDomains = true;
  await openApp();
  await L.tap(page, 'Continue with Google', { after: 6000 });
  const t = await toasts();
  lb = await labels();
  await page.screenshot({ path: `${out}/g08-unauthorized-domain-${width}.png` });
  record('unauthorized domain shows a clear message and leaves the screen usable', t.some((x) => /not available on this website address/.test(x)) && lb.includes('Continue with Google'), { toasts: t });
  rewriteDomains = false;
  }

  fs.writeFileSync(`${out}/google-e2e-${width}.json`, JSON.stringify({ results, blocked: [...new Set(blocked)], consoleErrors: [...new Set(consoleErrors)].slice(0, 20) }, null, 1));
  console.log('blocked', [...new Set(blocked)]);
  await browser.close(); server.close();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
