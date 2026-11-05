// Web earning + responsive layout capture against the isolated local stack
// (emulator Firestore/Auth, local backend). No production service involved.
// argv: buildDir port label outDir [--web-off] [--routes]
//   --web-off  store allowWebTasking=false in the emulator settings (and the
//              published app policy) first: the production state that
//              produced the reported "Tasks paused" screen.
//   --routes   also capture the library/profile/wallet/settings routes.
const L = require('./lib.cjs');
const fs = require('fs');
const path = require('path');

const SIZES = [[1920, 1080], [1366, 768], [768, 1024], [390, 844]];
const FS = 'http://127.0.0.1:8095/v1/projects/demo-youpeak-local/databases/(default)/documents';
const owner = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

const [dir, port, label, out] = process.argv.slice(2);
const webOff = process.argv.includes('--web-off');
const withRoutes = process.argv.includes('--routes');
fs.mkdirSync(out, { recursive: true });
const results = [];
const record = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(ok ? 'PASS' : 'FAIL', name, JSON.stringify(detail ?? '').slice(0, 300)); };

async function setWebTasking(on) {
  const a = await fetch(`${FS}/settings/default_settings?updateMask.fieldPaths=allowWebTasking`, {
    method: 'PATCH', headers: owner, body: JSON.stringify({ fields: { allowWebTasking: { booleanValue: on } } }),
  });
  const b = await fetch(`${FS}/system_configs/app_policy?updateMask.fieldPaths=security.allowWebTasking`, {
    method: 'PATCH', headers: owner, body: JSON.stringify({ fields: { security: { mapValue: { fields: { allowWebTasking: { booleanValue: on } } } } } }),
  });
  if (!a.ok || !b.ok) throw new Error(`setWebTasking ${a.status} ${b.status}`);
}

async function userByEmail(email) {
  const res = await fetch(`${FS}:runQuery`, {
    method: 'POST', headers: owner,
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'users' }], where: { fieldFilter: { field: { fieldPath: 'email' }, op: 'EQUAL', value: { stringValue: email } } } } }),
  });
  const rows = (await res.json()).filter((r) => r.document);
  if (!rows.length) return null;
  const d = rows[0].document;
  const v = (f) => { const x = d.fields[f]; return x ? Number(x.integerValue ?? x.doubleValue ?? 0) : 0; };
  return { id: d.name.split('/').pop(), coin: v('coin'), attestation: d.fields.taskAttestation?.mapValue?.fields ?? null };
}

async function histories(userId) {
  const res = await fetch(`${FS}:runQuery`, {
    method: 'POST', headers: owner,
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'histories' }], where: { fieldFilter: { field: { fieldPath: 'userId' }, op: 'EQUAL', value: { stringValue: userId } } } } }),
  });
  return (await res.json()).filter((r) => r.document).map((r) => {
    const f = r.document.fields;
    return { type: Number(f.type?.integerValue ?? -1), coin: Number(f.coin?.integerValue ?? f.coin?.doubleValue ?? 0) };
  });
}

async function labels(page) {
  return [...new Set((await L.nodes(page)).map((n) => n.label).filter(Boolean))].slice(0, 80);
}

// Horizontal page overflow: anything the Flutter view paints beyond the window.
async function overflow(page) {
  return page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth }));
}

(async () => {
  await setWebTasking(!webOff);
  // dir may be a running dev server URL (debug build via flutter run).
  const server = /^https?:/.test(dir) ? { close() {}, closeAllConnections() {} } : await L.serveDir(dir, Number(port));
  const profile = path.join(out, '..', `profile-${label}`);
  fs.rmSync(profile, { recursive: true, force: true });
  const browser = await L.launch({ width: 1920, height: 1080, userDataDir: profile });
  // Debug builds report exceptions and RenderFlex overflows as console logs
  // framed by "EXCEPTION CAUGHT ..." and a line of ═; keep each block, by route.
  const flutterErrors = [];
  let currentStem = 'sign-in';
  let block = null;
  const { page, blocked, consoleErrors, failed } = await L.preparePage(browser, {
    log: (l) => {
      const line = l.replace(/^[console.w+] /, '');
      if (/EXCEPTION CAUGHT BY|Another exception was thrown/.test(line)) {
        block = { route: currentStem, lines: [line.slice(0, 1200)] };
        flutterErrors.push(block);
        if (/Another exception/.test(line)) block = null;
        return;
      }
      if (block) {
        if (/^═+$/.test(line.trim()) || block.lines.length >= 14) { block = null; return; }
        if (line.trim()) block.lines.push(line.slice(0, 240));
      }
    },
  });
  // Test-only: hide the Firebase SDK's emulator banner (fixed to the bottom).
  await page.evaluateOnNewDocument(() => {
    const s = document.createElement('style');
    s.textContent = '.firebase-emulator-warning{display:none!important}';
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s));
  });
  const url = /^https?:/.test(dir) ? dir : `http://127.0.0.1:${port}/`;
  const evidence = { label, webOff, routes: {}, results };

  async function shoot(stem, { sizes = SIZES } = {}) {
    const rec = {};
    for (const [w, h] of sizes) {
      await page.setViewport({ width: w, height: h });
      await L.sleep(w === 1920 ? 800 : 2000);
      await page.screenshot({ path: `${out}/${stem}-${w}.png` });
      rec[w] = { labels: await labels(page), overflow: await overflow(page) };
      if (rec[w].overflow.scrollW > w + 1) record(`${stem} no horizontal page scroll at ${w}`, false, rec[w].overflow);
    }
    await page.setViewport({ width: 1920, height: 1080 });
    await L.sleep(1200);
    evidence.routes[stem] = rec;
    return rec;
  }

  async function fromNav(navLabel, settle = 4000) {
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await L.enableSemantics(page);
    await L.sleep(6000);
    await L.tap(page, navLabel, { role: 'button', timeout: 30000, after: settle });
  }

  async function step(stem, fn) {
    currentStem = stem;
    try { await fn(); } catch (e) { record(`${stem} reachable`, false, e.message); evidence.routes[stem] = { error: e.message }; }
  }

  // 1. Sign in (fresh profile: onboarding, then email + password).
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('flt-semantics-placeholder, flutter-view', { timeout: 90000 });
  await L.sleep(7000);
  for (let i = 0; i < 3; i++) { await page.mouse.click(1580, 1047); await L.sleep(900); }
  await page.mouse.click(1580, 811); await L.sleep(1500);
  await page.mouse.click(1585, 432); await L.sleep(500); await page.keyboard.type('viewer@youpeak.test', { delay: 20 });
  await page.mouse.click(1585, 528); await L.sleep(500); await page.keyboard.type('Test@1234', { delay: 20 });
  await page.mouse.click(1580, 639);
  await L.sleep(9000);
  const user0 = await userByEmail('viewer@youpeak.test');
  record('signed in (backend user exists)', !!user0, user0 && { id: user0.id, coin: user0.coin });
  if (!user0) throw new Error('sign-in failed');

  // 2. Tasker dashboard.
  await step('10-tasker', async () => {
    await fromNav('Tasker', 7000);
    const rec = await shoot('10-tasker');
    const text = rec[1920].labels.join(' | ');
    evidence.taskerText = text;
    const att = (await userByEmail('viewer@youpeak.test')).attestation;
    record('browser attested without device claims', !!att && att.signals?.mapValue?.fields?.deviceId?.stringValue === '' && att.signals?.mapValue?.fields?.platform?.stringValue === 'web',
      att && Object.fromEntries(Object.entries(att.signals?.mapValue?.fields ?? {}).map(([k, v]) => [k, Object.values(v)[0]])));
    if (webOff) {
      record('web off: dashboard explains it', /Earning on the website is switched off/.test(text), text.slice(0, 200));
      record('web off: no Check again loop offered', !/Check again/.test(text));
    } else {
      record('web on: no lock banner', !/switched off|mobile app only|We need to verify/.test(text));
      record('web on: ads labelled app-only', /In the mobile app/.test(text));
    }
  });

  // 3. The earning page (Earn Rewards behind the task lock).
  await step('11-earn', async () => {
    await fromNav('Tasker', 7000);
    await L.tap(page, /^(Check in & daily tasks|Watch ads & do tasks)$/, { timeout: 20000, after: 6000 });
    const rec = await shoot('11-earn');
    const text = rec[1920].labels.join(' | ');
    evidence.earnText = text;
    const sidebar = ['Home', 'Library', 'Tasker'].every((l) => rec[1920].labels.includes(l));
    record('earning page keeps the desktop sidebar at 1920', sidebar);
    if (webOff) {
      record('web off: lock page explains, offers Go back, not Check again', /Earning on the website is switched off/.test(text) && /Go back/.test(text) && !/Check again/.test(text), text.slice(0, 300));
      return;
    }
    record('web on: Earn Rewards open (not locked)', !/Earning paused|Tasks paused/.test(text), text.slice(0, 200));
    record('web on: rewarded ads explained as app-only, no Play button', /Rewarded ads are available in the YouPeak mobile app/.test(text) && !/(^| [|] )Play( [|] |$)/.test(text));

    if (process.argv.includes('--no-checkin')) return;
    // Check-in from the browser: credited once, by the server.
    const before = await userByEmail('viewer@youpeak.test');
    const h0 = await histories(before.id);
    await L.tap(page, /^Check In$/i, { timeout: 15000, after: 5000 });
    await page.screenshot({ path: `${out}/12-checkin-done-1920.png` });
    await page.keyboard.press('Escape'); await L.sleep(1500);
    const after = await userByEmail('viewer@youpeak.test');
    const h1 = await histories(before.id);
    record('check-in from the browser credits coins', after.coin > before.coin, { before: before.coin, after: after.coin, newHistories: h1.length - h0.length });
    // A second tap the same day must not pay again.
    try { await L.tap(page, /^Check In$/i, { timeout: 5000, after: 4000 }); } catch (e) { /* dialog may cover it */ }
    const again = await userByEmail('viewer@youpeak.test');
    record('second check-in the same day pays nothing', again.coin === after.coin, { after: after.coin, again: again.coin });
  });

  if (withRoutes) {
    const viaLibrary = [['20-history', /^(View All)$/], ['21-your-videos', 'Your Videos'], ['22-playlists', 'Playlists'], ['23-watch-later', 'Watch Later']];
    for (const [stem, target] of viaLibrary) {
      await step(stem, async () => {
        await fromNav('Library', 4000);
        await L.tap(page, target, { timeout: 15000, after: 4000 });
        await shoot(stem);
      });
    }
    const viaProfile = [['30-wallet', 'My Wallet'], ['31-settings', 'Settings'], ['32-help', 'Help Center'], ['33-time-watched', 'Time Watched'], ['34-earn-from-profile', 'Earn Rewards'], ['35-create-channel', 'Create Your Channel']];
    for (const [stem, target] of viaProfile) {
      await step(stem, async () => {
        await fromNav('Profile', 5000);
        await L.tap(page, target, { timeout: 15000, after: 5000 });
        await shoot(stem);
      });
    }
    await step('36-channel', async () => {
      await fromNav('Home', 5000);
      await L.tap(page, /^Welcome to YouPeak/, { timeout: 15000, after: 12000 });
      await shoot('36-channel');
    });
    for (const [stem, nav] of [['40-search', 'Search'], ['41-notifications', 'Notifications'], ['42-profile', 'Profile'], ['43-library', 'Library'], ['44-home', 'Home']]) {
      await step(stem, async () => { await fromNav(nav, 5000); await shoot(stem); });
    }
  }

  evidence.blocked = [...new Set(blocked)];
  evidence.failed = [...new Set(failed)];
  evidence.consoleErrors = [...new Set(consoleErrors)];
  evidence.flutterErrors = flutterErrors;
  record('no Flutter exceptions or overflows reported', flutterErrors.length === 0, flutterErrors.map((b) => b.route + ': ' + b.lines.slice(0, 3).join(' / ')).slice(0, 8));
  fs.writeFileSync(`${out}/evidence.json`, JSON.stringify(evidence, null, 1));
  console.log('done', label, 'blocked', evidence.blocked.slice(0, 10), 'failed', evidence.failed.slice(0, 10), 'consoleErrors', evidence.consoleErrors.slice(0, 10));
  await Promise.race([browser.close(), L.sleep(10000)]);
  server.closeAllConnections(); server.close();
  await setWebTasking(true);
  process.exit(0);
})().catch(async (e) => { console.error(e); try { await setWebTasking(true); } catch (_) {} process.exit(1); });
