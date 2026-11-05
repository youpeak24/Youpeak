// Routes the 18-route harness doesn't reach, at 1920/1366/768/390: the Peak
// Boost sheet, the upload form, Channel Details of a channel made with the new
// flow, and the create-channel form opened from Upload. Local stack only.
// argv: buildDir port outDir coordsJson [--only=peakboost]
const E = require('./e2e-lib.cjs'); const { L } = E;
const fs = require('fs');
const path = require('path');

const [dir, portArg, out, coordsFile] = process.argv.slice(2);
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').replace('--only=', '').split(',').filter(Boolean);
const port = Number(portArg);
fs.mkdirSync(out, { recursive: true });
const coords = JSON.parse(fs.readFileSync(coordsFile, 'utf8'));
const FIXTURE = path.resolve(__dirname, '../../../../local-dev/fixtures/fixture-bite-landscape.webm');
const SIZES = [[1920, 1080], [1366, 768], [768, 1024], [390, 844]];
const evidence = {};

async function capture(page, stem, extra = {}) {
  const rec = {};
  for (const [w, h] of SIZES) {
    await page.setViewport({ width: w, height: h, isMobile: w < 600, hasTouch: w < 600 });
    await L.sleep(w === 1366 ? 1200 : 2200);
    await E.ensureSemantics(page);
    await page.screenshot({ path: `${out}/${stem}-${w}.png` });
    const labels = await E.labels(page, 80);
    const o = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth }));
    rec[w] = { overflow: o.scrollW > w + 1, sidebar: ['Home', 'Library', 'Tasker'].every((l) => labels.includes(l)), labels: labels.slice(0, 40), ...extra };
  }
  await page.setViewport({ width: 1366, height: 768 });
  await L.sleep(1200);
  evidence[stem] = rec;
  console.log(stem, Object.entries(rec).map(([w, r]) => `${w}:${r.overflow ? 'OVERFLOW' : 'ok'}${r.sidebar ? '+S' : ''}`).join(' '));
  return rec;
}

async function session(email, fn) {
  const app = await E.openApp({ dir, port, width: 1366, height: 768, profile: `${out}/p-${email.split('@')[0]}`, withExternal: false });
  try {
    await app.goExternalThenApp({ semantics: false });
    await E.signInByCoords(app.page, coords, email);
    await fn(app.page, app);
  } catch (e) {
    console.log('ERROR', email, e.message.slice(0, 200));
    evidence[`error-${email}`] = e.message.slice(0, 300);
  } finally {
    await app.close();
  }
}
const want = (k) => !only.length || only.includes(k);

(async () => {
  if (want('peakboost')) await session('viewer@youpeak.test', async (page) => {
    // Open the first long-form video on Home and its Peak Boost sheet.
    const card = (await L.nodes(page)).find((n) => /views/.test(n.label) && n.w > 300);
    if (!card) throw new Error('no video card on Home');
    await page.mouse.click(card.x, card.y); await L.sleep(7000);
    await page.screenshot({ path: `${out}/pb-video-page.png` });
    // The card's avatar opens the channel; open one of its videos from there.
    const vid = (await L.nodes(page)).find((n) => /^E2E upload ok/.test(n.label));
    if (vid) { await page.mouse.click(vid.x, vid.y - 120); await L.sleep(8000); } // the thumbnail above the title
    await page.screenshot({ path: `${out}/pb-video-page.png` });
    // The button sits in the action row under the player (1366x768 layout).
    const pb = (await L.nodes(page)).find((n) => /Peak Boost/.test(n.label));
    await page.mouse.click(pb ? pb.x : 469, pb ? pb.y : 623);
    await L.sleep(3000);
    const rec = await capture(page, '50-peak-boost-sheet');
    const text = rec[1366].labels.join(' | ');
    evidence.peakBoostText = { hasFeeText: /goes to the creator|platform fee/.test(text), hasNoRefund: /Boosts can.t be refunded/.test(text) };
    console.log('peak boost text', JSON.stringify(evidence.peakBoostText));
  });

  if (want('upload')) await session('e2e_a@youpeak.test', async (page) => {
    await L.tap(page, 'Create', { role: 'button', after: 1500 });
    const up = await L.findNode(page, 'Upload a Video');
    const [chooser] = await Promise.all([page.waitForFileChooser({ timeout: 15000 }), page.mouse.click(up.x, up.y)]);
    await chooser.accept([FIXTURE]);
    await L.sleep(7000);
    await capture(page, '51-upload-form');
  });

  if (want('channel')) await session('e2e_a@youpeak.test', async (page) => {
    await L.tap(page, 'Profile', { role: 'button', after: 3000 });
    await L.tap(page, 'Your Channel', { after: 6000 });
    await capture(page, '52-channel-details-new-channel');
  });

  if (want('create-from-upload')) await session('e2e_c@youpeak.test', async (page) => {
    // No channel yet: Upload -> fill title -> Upload Video opens "Create your channel".
    await L.tap(page, 'Create', { role: 'button', after: 1500 });
    const up = await L.findNode(page, 'Upload a Video');
    const [chooser] = await Promise.all([page.waitForFileChooser({ timeout: 15000 }), page.mouse.click(up.x, up.y)]);
    await chooser.accept([FIXTURE]);
    await L.sleep(7000);
    await capture(page, '53-upload-form-no-channel');
  });

  fs.writeFileSync(`${out}/extra-evidence.json`, JSON.stringify(evidence, null, 2));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
