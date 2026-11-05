// Debug build (assertions on) served by `flutter run -d web-server`: open
// Channel Details for (1) a channel created with the new flow, (2) a legacy
// profile whose channel fields are strings / missing, and record every
// framework exception or overflow report the app prints.
// argv: url outDir coordsJson
const E = require('./e2e-lib.cjs'); const { L } = E;
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');
const bcrypt = createRequire(path.resolve(__dirname, '../../../../functions/backend/index.js'))('bcryptjs');

const [url, out, coordsFile] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const coords = JSON.parse(fs.readFileSync(coordsFile, 'utf8'));
const fsValue = (v) => (v === null || v === undefined ? { nullValue: null } : typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? { integerValue: String(v) } : { stringValue: String(v) });
async function putUser(id, extra) {
  const doc = { _id: id, id, fullName: `E2E ${id}`, nickName: id, identity: `e2e-${id}`, fcmToken: '', image: '', uniqueId: `E2E-${id}`, referralCode: id.toUpperCase().slice(0, 10), isNewUser: false, email: `${id}@youpeak.test`, loginType: 4, passwordHash: bcrypt.hashSync('Test@1234', 10), isActive: true, isBlock: false, coin: 0, paymentStatus: true, createdAt: new Date().toISOString(), ...extra };
  const fields = Object.fromEntries(Object.entries(doc).map(([k, v]) => [k, fsValue(v)]));
  const r = await fetch(`${E.FS}/users/${id}`, { method: 'PATCH', headers: E.owner, body: JSON.stringify({ fields }) });
  if (!r.ok) throw new Error('seed ' + r.status);
}

(async () => {
  // Legacy-shaped channel: numbers stored as strings, costs missing.
  await putUser('e2e_legacy', { isChannel: true, channelId: 'e2e_legacy', fullName: 'Legacy Strings', channelType: '1', subscriptionCost: '10' });
  const reports = [];
  let current = 'start';
  let browser, page;
  const attach = () => page.on('console', (m) => {
    const t = m.text();
    if (/EXCEPTION CAUGHT BY|Another exception was thrown|RenderFlex overflowed|Null check operator|is not a subtype/.test(t)) reports.push({ at: current, text: t.slice(0, 400) });
  });
  const attachErrors = () => page.on('pageerror', (e) => reports.push({ at: current, text: 'pageerror: ' + e.message.slice(0, 300) }));
  const results = {};
  // One browser per account: reloading under the debug server breaks its
  // injected client.js (a dev-tool limitation, not the app).
  const visit = async (who, tag) => {
    if (browser) await browser.close();
    browser = await E.launch({ width: 1366, height: 768, userDataDir: `${out}/p-${tag}` });
    page = await browser.newPage();
    attach(); attachErrors();
    current = `${tag}:load`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('flutter-view', { timeout: 180000 });
    await L.sleep(25000); // debug builds start slowly
    current = `${tag}:sign-in`;
    await E.signInByCoords(page, coords, `${who}@youpeak.test`);
    await L.sleep(4000);
    current = `${tag}:profile`;
    await L.tap(page, 'Profile', { role: 'button', timeout: 30000, after: 4000 });
    current = `${tag}:channel-details`;
    const before = reports.length;
    await L.tap(page, 'Your Channel', { timeout: 20000, after: 9000 });
    await page.screenshot({ path: `${out}/${tag}-channel-details.png` });
    const labels = await E.labels(page, 40);
    results[tag] = { tabsShown: ['HOME', 'PLAYLISTS'].every((l) => labels.includes(l)), reportsOnChannelPage: reports.length - before };
  };
  try {
    if (!process.argv.includes('--legacy-only')) await visit('e2e_a', 'created-channel');
    await visit('e2e_legacy', 'legacy-channel');
  } catch (e) {
    results.error = e.message.slice(0, 300);
    if (page) await page.screenshot({ path: `${out}/error.png` }).catch(() => {});
  }
  fs.writeFileSync(`${out}/debug-results.json`, JSON.stringify({ results, reports }, null, 2));
  console.log(JSON.stringify(results, null, 1));
  console.log(`framework reports: ${reports.length}`);
  for (const r of reports.slice(0, 10)) console.log(' ', r.at, '|', r.text.slice(0, 200));
  await browser.close();
})();
