// Channel creation and video upload in the Flutter web app, against the
// isolated local stack (Firestore/Auth/Storage emulators, local API, and a
// fake R2 with a CORS switch). Test accounts only.
// argv: buildDir port outDir label [--only=E1,E3]
const E = require('./e2e-lib.cjs');
const { L } = E;
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');
const bcrypt = createRequire(path.resolve(__dirname, '../../../../functions/backend/index.js'))('bcryptjs');

const [dir, portArg, out, label] = process.argv.slice(2);
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').replace('--only=', '').split(',').filter(Boolean);
const port = Number(portArg);
fs.mkdirSync(out, { recursive: true });
const FIXTURE = path.resolve(__dirname, '../../../../local-dev/fixtures/fixture-bite-landscape.webm');
const FAKE = 'https://127.0.0.1:5099';
const results = [];
const W = 1366, H = 768;

const fsValue = (v) => (v === null || v === undefined ? { nullValue: null } : typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : { stringValue: String(v) });
async function putUser(id, extra = {}) {
  const doc = {
    _id: id, id, fullName: `E2E ${id}`, nickName: id, email: `${id}@youpeak.test`, loginType: 4, passwordHash: bcrypt.hashSync('Test@1234', 10),
    identity: `e2e-${id}`, fcmToken: '', image: '', coin: 0, isActive: true, isBlock: false, isChannel: false, paymentStatus: true,
    uniqueId: `E2E-${id}`, referralCode: id.toUpperCase().slice(0, 10), createdAt: new Date().toISOString(), ...extra,
  };
  const fields = Object.fromEntries(Object.entries(doc).map(([k, v]) => [k, fsValue(v)]));
  const r = await fetch(`${E.FS}/users/${id}`, { method: 'PATCH', headers: E.owner, body: JSON.stringify({ fields }) });
  if (!r.ok) throw new Error('seed user failed ' + r.status);
}
async function fakeObjects() { return (await fetch(`${FAKE}/__objects`)).json(); }
async function fakeReset() { await fetch(`${FAKE}/__reset`, { method: 'POST' }); }
async function fakeMode(m) { await fetch(`${FAKE}/__mode`, { method: 'POST', body: JSON.stringify(m) }); }
async function videosOf(userId) { return (await E.query('videos', 'userId', userId)).map((d) => ({ title: d.fields.title?.stringValue, url: d.fields.videoUrl?.stringValue, image: d.fields.videoImage?.stringValue, provider: d.fields.storageProvider?.stringValue })); }
async function channelNames(ownerId) { return (await E.query('channelNames', 'ownerId', ownerId)).length; }

let ui = null; // coordinates of the controls, read once with semantics on
async function probeUi() {
  const cache = `${out}/ui-coords.json`;
  if (fs.existsSync(cache)) return JSON.parse(fs.readFileSync(cache, 'utf8'));
  const sign = await E.probeSignInCoords({ dir, port: port + 7, width: W, height: H, cacheFile: `${out}/coords.json` });
  await putUser('e2e_probe');
  const app = await E.openApp({ dir, port: port + 8, width: W, height: H, profile: `${out}/pp`, withExternal: false });
  await app.goExternalThenApp({ semantics: false });
  await E.signInByCoords(app.page, sign, 'e2e_probe@youpeak.test');
  const { page } = app;
  const at = async (m, o = {}) => { const n = await L.findNode(page, m, o); return [n.x, n.y]; };
  const coords = { sign };
  coords.profile = await at('Profile', { role: 'button' });
  coords.create = await at('Create', { role: 'button' });
  await L.tap(page, 'Profile', { role: 'button', after: 3000 });
  coords.createChannel = await at(/^Create Your Channel$/);
  await L.tap(page, /^Create Your Channel$/, { after: 3000 });
  const name = (await L.nodes(page)).find((n) => n.label === 'Channel Name'); const desc = (await L.nodes(page)).find((n) => n.label === 'Tell us about yourself...');
  coords.chName = [name.x, name.y]; coords.chDesc = [desc.x, desc.y]; coords.chContinue = await at('Continue', { role: 'button' });
  await page.goBack().catch(() => {}); await L.sleep(1500);
  await L.tap(page, 'Home', { role: 'button', pick: 'last', after: 2000 }).catch(() => {});
  await L.tap(page, 'Create', { role: 'button', after: 1500 });
  coords.uploadItem = await at('Upload a Video');
  await app.close();
  // The upload page needs a channel to publish, but not to open: read its controls.
  await putUser('e2e_probe2', { isChannel: true, channelId: 'e2e_probe2', fullName: 'E2E Probe2', channelType: 1, subscriptionCost: 10, videoUnlockCost: 10 });
  const app2 = await E.openApp({ dir, port: port + 9, width: W, height: H, profile: `${out}/pp2`, withExternal: false });
  await app2.goExternalThenApp({ semantics: false });
  await E.signInByCoords(app2.page, sign, 'e2e_probe2@youpeak.test');
  await L.tap(app2.page, 'Create', { role: 'button', after: 1500 });
  const up = await L.findNode(app2.page, 'Upload a Video');
  const [chooser] = await Promise.all([app2.page.waitForFileChooser({ timeout: 15000 }), app2.page.mouse.click(up.x, up.y)]);
  await chooser.accept([FIXTURE]);
  await L.sleep(6000);
  const nodes = await L.nodes(app2.page);
  const title = nodes.find((n) => n.label === 'Your title here...'); const btn = nodes.find((n) => n.label === 'Upload Video' && n.role === 'button');
  coords.title = [title.x, title.y]; coords.uploadBtn = [btn.x, btn.y];
  await app2.close();
  fs.writeFileSync(cache, JSON.stringify(coords));
  return coords;
}

async function withApp(userId, fn, { semantics = false } = {}) {
  const app = await E.openApp({ dir, port, width: W, height: H, profile: `${out}/p-${userId}`, withExternal: false });
  const toasts = [];
  await app.page.evaluateOnNewDocument(() => {
    window.__toasts = [];
    document.addEventListener('DOMContentLoaded', () => new MutationObserver(() => document.querySelectorAll('.toastify').forEach((t) => { const x = t.textContent.trim(); if (x && !window.__toasts.includes(x)) window.__toasts.push(x); })).observe(document.body, { childList: true, subtree: true }));
  });
  const stepLog = [];
  try {
    await app.goExternalThenApp({ semantics: false });
    await E.signInByCoords(app.page, ui.sign, `${userId}@youpeak.test`);
    return await fn({
      app, page: app.page, step: (s) => stepLog.push(s),
      shoot: async (name) => { await app.page.screenshot({ path: `${out}/${name}.png` }); },
      toasts: () => app.page.evaluate(() => window.__toasts || []),
      click: async (xy, after = 800) => { await app.page.mouse.click(...xy); await L.sleep(after); },
      type: async (xy, text) => { await app.page.mouse.click(...xy); await L.sleep(500); await app.page.keyboard.type(text, { delay: 20 }); },
    });
  } finally {
    results.at(-1).errors = app.prepared.consoleErrors.filter((e) => !/ERR_BLOCKED_BY_CLIENT/.test(e)).slice(0, 5);
    results.at(-1).blocked = app.prepared.blocked.slice(0, 10);
    results.at(-1).failed = app.prepared.failed.slice(0, 10);
    await app.close();
  }
}

async function scenario(id, name, fn) {
  if (only.length && !only.includes(id)) return;
  const rec = { id, name, ok: true, notes: [] };
  results.push(rec);
  const expect = (cond, text) => { if (!cond) { rec.ok = false; rec.notes.push('EXPECTED: ' + text); } };
  try { await fn(expect, rec); } catch (e) { rec.ok = false; rec.notes.push('ERROR: ' + e.message.slice(0, 300)); }
  console.log(`${rec.ok ? 'PASS' : 'FAIL'} ${id} ${name}${rec.notes.length ? '\n     ' + rec.notes.join('\n     ') : ''}${rec.info ? '\n     ' + JSON.stringify(rec.info) : ''}`);
}

async function openCreateChannelForm(c) {
  await c.click(ui.profile, 3000);
  await c.click(ui.createChannel, 3000);
}

// Waits for toasts / screen text to settle and returns what a person would see.
async function readScreen(c, wait = 4000) {
  await L.sleep(wait);
  await E.ensureSemantics(c.page);
  return { labels: await E.labels(c.page, 40), toasts: await c.toasts() };
}

(async () => {
  console.log(`# ${label}`);
  ui = await probeUi();
  await fakeReset();

  await scenario('E1', 'channel creation: success, immediate navigation to the channel, server record', async (expect, rec) => {
    await putUser('e2e_a');
    await withApp('e2e_a', async (c) => {
      await openCreateChannelForm(c);
      await c.type(ui.chName, 'E2E Channel One');
      await c.type(ui.chDesc, 'Videos made for the release test');
      await c.shoot('e1-form-filled');
      await c.click(ui.chContinue, 1500);
      const screen = await readScreen(c, 7000);
      await c.shoot('e1-after-create');
      rec.info = { toasts: screen.toasts, labels: screen.labels.slice(0, 12) };
      const u = await E.userDoc('e2e_a');
      expect(u && u.isChannel === true, 'isChannel true on the server');
      expect(u && u.channelId === 'e2e_a', 'channelId = the creator\'s own id');
      expect(u && u.fullName === 'E2E Channel One', 'channel name saved');
      expect(u && Number(u.channelType) === 1, 'channelType stored as a number');
      // The channel page is recognised by its tabs (its header text is painted, not exposed as semantics; see the screenshot).
      expect(['HOME', 'PLAYLISTS'].every((l) => screen.labels.includes(l)), 'the new channel page is shown right away');
      expect((await channelNames('e2e_a')) === 1, 'exactly one name reservation');
    });
  });

  await scenario('E2', 'channel details after refresh and a later login', async (expect, rec) => {
    await withApp('e2e_a', async (c) => {
      // Fresh session (second browser profile): sign in again, open Profile -> channel.
      await c.click(ui.profile, 3000);
      const screen = await readScreen(c, 3000);
      rec.info = { profile: screen.labels.slice(0, 40) };
      const channelEntry = screen.labels.find((l) => l === 'Your Channel');
      expect(!!channelEntry, 'profile offers the channel (or shows its name)');
      await c.shoot('e2-profile');
      if (channelEntry) {
        await L.tap(c.page, channelEntry, { timeout: 8000, after: 5000 });
        const ch = await readScreen(c, 3000);
        await c.shoot('e2-channel-details');
        expect(['HOME', 'PLAYLISTS'].every((l) => ch.labels.includes(l)), 'channel details open after a new login');
        await c.page.reload({ waitUntil: 'domcontentloaded' });
        await L.sleep(9000);
        await E.ensureSemantics(c.page);
        const after = await E.labels(c.page, 12);
        rec.info.afterRefresh = after.slice(0, 8);
        expect(!after.some((l) => /Let.s you in|Login to Your Account/.test(l)), 'refresh keeps the session');
      }
    });
  });

  await scenario('E3', 'double tap on Continue creates exactly one channel', async (expect, rec) => {
    await putUser('e2e_b');
    await withApp('e2e_b', async (c) => {
      await openCreateChannelForm(c);
      await c.type(ui.chName, 'E2E Double Tap');
      await c.type(ui.chDesc, 'double tap test');
      await c.page.mouse.click(...ui.chContinue); await c.page.mouse.click(...ui.chContinue);
      await c.page.mouse.click(...ui.chContinue);
      const screen = await readScreen(c, 8000);
      rec.info = { toasts: screen.toasts, labels: screen.labels.slice(0, 8) };
      const u = await E.userDoc('e2e_b');
      expect(u && u.isChannel === true && u.fullName === 'E2E Double Tap', 'one channel with the typed name');
      expect((await channelNames('e2e_b')) === 1, 'one name reservation');
      expect(['HOME', 'PLAYLISTS'].every((l) => screen.labels.includes(l)), 'lands on the channel');
    });
  });

  await scenario('E4', 'validation and name conflicts: nothing is created, the reason is shown', async (expect, rec) => {
    await putUser('e2e_c');
    await withApp('e2e_c', async (c) => {
      await openCreateChannelForm(c);
      await c.click(ui.chContinue, 1500);                               // everything empty
      const empty = await c.toasts();
      await c.type(ui.chName, 'x'); await c.type(ui.chDesc, 'some description');
      await c.click(ui.chContinue, 1500);                               // 1-character name
      const short = await c.toasts();
      rec.info = { empty, short };
      expect(empty.length > 0, 'a message for empty fields');
      expect(short.some((t) => /at least 2/i.test(t)), 'a message for a too-short name');
    });
    // A name another account already uses, in a fresh form.
    await withApp('e2e_c', async (c) => {
      await openCreateChannelForm(c);
      await c.type(ui.chName, 'E2E Channel One');
      await c.type(ui.chDesc, 'some description');
      await c.click(ui.chContinue, 5000);
      const taken = await c.toasts();
      await c.shoot('e4-name-taken');
      rec.info.taken = taken;
      expect(taken.some((t) => /taken|already/i.test(t)), 'a message that the name is taken');
    });
    const u = await E.userDoc('e2e_c');
    expect(!(u && u.isChannel === true), 'no channel created by invalid requests');
  });

  const uploadFlow = async (c, title) => {
    await c.click(ui.create, 1500);
    await c.click([683, 413], 0).catch(() => {});
  };

  await scenario('E5', 'upload to Cloudflare (R2): progress, completion, one video record, file in storage', async (expect, rec) => {
    await fakeReset();
    await withApp('e2e_a', async (c) => {
      await c.click(ui.create, 1500);
      const [chooser] = await Promise.all([c.page.waitForFileChooser({ timeout: 15000 }), c.page.mouse.click(683, 413)]);
      await chooser.accept([FIXTURE]);
      await L.sleep(7000);
      await c.type(ui.title, 'E2E upload ok');
      await c.shoot('e5-upload-form');
      await c.click(ui.uploadBtn, 500);
      // The banner shows while it runs; sample it, then wait for the result.
      await E.ensureSemantics(c.page);
      const seen = new Set();
      for (let i = 0; i < 40; i++) { for (const l of await E.labels(c.page, 40)) if (/Upload|Publishing|Saving|Preparing|%/.test(l)) seen.add(l); if (!(await E.labels(c.page, 40)).some((l) => /Cancel/.test(l)) && i > 3) break; await L.sleep(500); }
      await L.sleep(3000);
      const toasts = await c.toasts();
      await c.shoot('e5-after-upload');
      const vids = await videosOf('e2e_a');
      const objs = await fakeObjects();
      rec.info = { banner: [...seen], toasts, videos: vids, r2: objs.map((o) => ({ key: o.key.replace(/[0-9a-f-]{36}/, '<uuid>'), size: o.size, type: o.type })) };
      expect(vids.filter((v) => v.title === 'E2E upload ok').length === 1, 'exactly one video record');
      expect(vids[0] && /127\.0\.0\.1:5099\//.test(vids[0].url || ''), 'the video URL points at the R2 public domain');
      expect(vids.every((v) => v.provider === 'r2'), 'stored as R2');
      expect(objs.length === 1 && objs[0].size > 100000, 'one file of the real size reached storage');
      expect(vids[0] && vids[0].image && !/5099/.test(vids[0].image), 'the thumbnail is not in R2 (Firebase Storage)');
    });
  });

  await scenario('E6', 'a storage hiccup (two 500s) is retried automatically and still yields one video', async (expect, rec) => {
    await fakeReset();
    await fakeMode({ failNext: '500', failCount: 2 });
    await withApp('e2e_a', async (c) => {
      await c.click(ui.create, 1500);
      const [chooser] = await Promise.all([c.page.waitForFileChooser({ timeout: 15000 }), c.page.mouse.click(683, 413)]);
      await chooser.accept([FIXTURE]);
      await L.sleep(7000);
      await c.type(ui.title, 'E2E upload retry');
      await c.click(ui.uploadBtn, 500);
      await L.sleep(30000);
      const vids = (await videosOf('e2e_a')).filter((v) => v.title === 'E2E upload retry');
      const toasts = await c.toasts();
      rec.info = { toasts, videos: vids.length, puts: (await (await fetch(`${FAKE}/__mode`, { method: 'POST', body: '{}' })).json()).puts };
      expect(vids.length === 1, 'exactly one video after the retries');
      expect(rec.info.puts === 3, 'two failed attempts then one that worked');
    });
  });

  await scenario('E7', 'blocked storage (CORS): an accurate message, no video record, Retry works once fixed, no duplicate', async (expect, rec) => {
    await fakeReset();
    await fakeMode({ cors: false });
    await withApp('e2e_a', async (c) => {
      await c.click(ui.create, 1500);
      const [chooser] = await Promise.all([c.page.waitForFileChooser({ timeout: 15000 }), c.page.mouse.click(683, 413)]);
      await chooser.accept([FIXTURE]);
      await L.sleep(7000);
      await c.type(ui.title, 'E2E upload cors');
      await c.click(ui.uploadBtn, 500);
      await L.sleep(30000);
      await E.ensureSemantics(c.page);
      const failed = await E.labels(c.page, 40);
      const toasts = await c.toasts();
      await c.shoot('e7-failed-banner');
      rec.info = { banner: failed.filter((l) => /storage|upload|Retry|Dismiss/i.test(l)), toasts };
      expect(toasts.some((t) => /video storage/i.test(t)) || failed.some((l) => /video storage/i.test(l)), 'message names the video storage, not "Something went wrong"');
      expect(!toasts.concat(failed).some((t) => /^Something went wrong/i.test(t)), 'no generic message');
      expect((await videosOf('e2e_a')).filter((v) => v.title === 'E2E upload cors').length === 0, 'nothing published');
      expect(failed.includes('Retry'), 'a Retry action is offered');
      await fakeMode({ cors: true });
      await L.tap(c.page, 'Retry', { timeout: 8000, after: 15000 });
      const vids = (await videosOf('e2e_a')).filter((v) => v.title === 'E2E upload cors');
      rec.info.afterRetry = vids.length;
      expect(vids.length === 1, 'Retry publishes exactly one video');
    });
  });

  await scenario('E8', 'cancel during an upload: stops, publishes nothing, leaves no orphan', async (expect, rec) => {
    await fakeReset();
    await fakeMode({ stall: true });
    await withApp('e2e_a', async (c) => {
      await c.click(ui.create, 1500);
      const [chooser] = await Promise.all([c.page.waitForFileChooser({ timeout: 15000 }), c.page.mouse.click(683, 413)]);
      await chooser.accept([FIXTURE]);
      await L.sleep(7000);
      await c.type(ui.title, 'E2E upload cancel');
      await c.click(ui.uploadBtn, 500);
      await L.sleep(6000);
      await E.ensureSemantics(c.page);
      const during = await E.labels(c.page, 40);
      await c.shoot('e8-uploading');
      await L.tap(c.page, 'Cancel', { timeout: 8000, after: 5000 });
      const toasts = await c.toasts();
      rec.info = { during: during.filter((l) => /Upload|%|Cancel/.test(l)), toasts };
      expect(during.includes('Cancel'), 'a Cancel action is shown while uploading');
      expect((await videosOf('e2e_a')).filter((v) => v.title === 'E2E upload cancel').length === 0, 'no video published');
      expect(toasts.some((t) => /cancel/i.test(t)), 'the user is told it was cancelled');
    });
    await fakeMode({ stall: false });
  });

  fs.writeFileSync(`${out}/e2e-results.json`, JSON.stringify({ label, results }, null, 2));
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nRESULT ${results.length - failed}/${results.length} passed`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
