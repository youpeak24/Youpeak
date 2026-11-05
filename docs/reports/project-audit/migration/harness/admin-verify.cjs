// Local admin login verification against the isolated stack (admin :3055,
// API :5055) plus the unavailable-backend case on the standalone :3000 app.
// Uses only the seeded local test accounts. argv: outDir
const L = require('./lib.cjs');
const fs = require('fs');

// Public static libraries the admin index.html loads (not YouPeak services).
const CDN = [/^https:\/\/cdn\.jsdelivr\.net\//, /^https:\/\/code\.jquery\.com\//, /^https:\/\/cdnjs\.cloudflare\.com\//];
const SUPER = { email: 'superadmin@youpeak.test', password: 'Test@1234' };
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const results = [];
const record = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(ok ? 'PASS' : 'FAIL', name, detail ? JSON.stringify(detail).slice(0, 300) : ''); };

async function toasts(page) {
  return page.$$eval('.Toastify__toast', (els) => els.map((e) => e.textContent.trim()));
}
async function clearToasts(page) {
  await page.evaluate(() => document.querySelectorAll('.Toastify__toast').forEach((t) => t.remove()));
}
async function signIn(page, email, password) {
  await page.waitForSelector('input[type=password]', { timeout: 60000 });
  await page.$eval('input[type=email]', (e) => { e.focus(); e.select(); });
  await page.keyboard.press('Backspace');
  await page.type('input[type=email]', email);
  await page.$eval('input[type=password]', (e) => { e.focus(); e.select(); });
  await page.keyboard.press('Backspace');
  await page.type('input[type=password]', password);
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const t = (await b.evaluate((e) => e.textContent || '')).trim().toLowerCase();
    if (/^(sign in|log ?in|login)$/.test(t)) { await b.click(); return; }
  }
  throw new Error('sign-in button not found');
}

(async () => {
  const browser = await L.launch({ width: 1366, height: 768 });
  const { page, blocked, consoleErrors } = await L.preparePage(browser, { extraAllow: CDN });
  const loginRequests = [];
  page.on('request', (r) => { if (/admin\/admin\/login/.test(r.url()) && r.method() === 'POST') loginRequests.push(r.url()); });

  // 1. Invalid credentials.
  await page.goto('http://localhost:3055/login', { waitUntil: 'networkidle2', timeout: 180000 });
  await signIn(page, SUPER.email, 'wrong-password');
  await L.sleep(2500);
  let t = await toasts(page);
  record('invalid password shows an error and stays on login', page.url().endsWith('/login') && t.some((x) => /invalid email or password/i.test(x)), { url: page.url(), toasts: t });
  await page.screenshot({ path: `${out}/admin-01-invalid-password.png` });
  await clearToasts(page);

  // 2. Valid local super admin -> dashboard.
  await signIn(page, SUPER.email, SUPER.password);
  await page.waitForFunction(() => location.pathname.startsWith('/admin/'), { timeout: 30000 }).catch(() => {});
  await L.sleep(4000);
  t = await toasts(page);
  const session = await page.evaluate(() => ({ token: !!sessionStorage.getItem('token'), isAuth: sessionStorage.getItem('isAuth') }));
  record('valid sign-in opens the dashboard', /\/admin\/mainDashboard/.test(page.url()) && session.token, { url: page.url(), toasts: t, session });
  await page.screenshot({ path: `${out}/admin-02-dashboard.png` });

  // 3. Session survives a refresh.
  await page.reload({ waitUntil: 'networkidle2' });
  await L.sleep(3000);
  record('session survives a page refresh', /\/admin\/mainDashboard/.test(page.url()), { url: page.url() });
  await page.screenshot({ path: `${out}/admin-03-after-refresh.png` });

  // 4. Sign out through the profile menu (with its confirmation dialog).
  await page.click('.navbar-profile-trigger');
  await L.sleep(500);
  await page.click('.navbar-profile-logout');
  await page.waitForSelector('.swal2-confirm', { timeout: 10000 });
  await page.click('.swal2-confirm');
  await L.sleep(2500);
  const afterLogout = await page.evaluate(() => ({ path: location.pathname, token: sessionStorage.getItem('token') }));
  record('sign-out returns to login and clears the session', !afterLogout.token && /\/login|^\/$/.test(afterLogout.path), afterLogout);
  await page.screenshot({ path: `${out}/admin-04-signed-out.png` });

  // 5. Protected route without a session redirects to login.
  await page.goto('http://localhost:3055/admin/mainDashboard', { waitUntil: 'networkidle2' });
  await L.sleep(2000);
  record('dashboard URL without a session redirects to login', /\/login$/.test(page.url()), { url: page.url() });

  // 6. Sign in again in the same tab (after sign-out cleared the axios key header).
  await clearToasts(page);
  await signIn(page, SUPER.email, SUPER.password);
  await page.waitForFunction(() => location.pathname.startsWith('/admin/'), { timeout: 30000 }).catch(() => {});
  await L.sleep(3000);
  record('sign-in again after sign-out (same tab) works', /\/admin\/mainDashboard/.test(page.url()), { url: page.url(), toasts: await toasts(page) });

  // 7. Backend unavailable: the standalone :3000 app points at :5001 where nothing runs.
  const p2 = await L.preparePage(browser, { extraAllow: CDN });
  await p2.page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 180000 });
  await signIn(p2.page, 'nobody@example.invalid', 'not-a-real-password');
  await L.sleep(4000);
  const t2 = await toasts(p2.page);
  record('unreachable backend shows which API could not be reached', t2.some((x) => /Cannot reach the API at http:\/\/localhost:5001\//.test(x)), { toasts: t2 });
  await p2.page.screenshot({ path: `${out}/admin-05-backend-unavailable-3000.png` });

  fs.writeFileSync(`${out}/admin-verify.json`, JSON.stringify({ results, loginRequests, blocked: [...new Set([...blocked, ...p2.blocked])], consoleErrors: [...new Set([...consoleErrors, ...p2.consoleErrors])].slice(0, 30) }, null, 1));
  await browser.close();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
