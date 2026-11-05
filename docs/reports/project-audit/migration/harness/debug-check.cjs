// Debug-build check: Flutter reports layout overflow and framework exceptions
// to the console only in debug mode. Visits each affected page and resizes it
// through the four widths. argv: url outDir
const L = require('./lib.cjs');
const fs = require('fs');
const path = require('path');
const [url, out] = process.argv.slice(2);
const SIZES = [[1920, 1080], [1366, 768], [768, 1024], [390, 844]];
const PAGES = ['Library', 'Bites', 'Search', 'Notifications', 'Profile', 'Tasker', 'Home', 'Subscription'];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const profile = path.join(out, '..', 'profile-debug');
  fs.rmSync(profile, { recursive: true, force: true });
  const browser = await L.launch({ width: 1920, height: 1080, userDataDir: profile, protocolTimeout: 900000 });
  const problems = [];
  const wheelLog = [];
  let where = 'startup';
  const { page, blocked } = await L.preparePage(browser, {
    log: (l) => { if (l.includes('[wheel]')) wheelLog.push(l.slice(0, 120)); if (/Login|SignUp|GetProfile|AppSession|Error/i.test(l) && where === 'sign-in') console.log('  console:', l.slice(0, 160)); if (/overflow|EXCEPTION CAUGHT|Another exception|was thrown|Assertion failed|setState\(\) called after dispose/i.test(l)) problems.push(`[${where}] ${l.slice(0, 300)}`); },
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 300000 });
  await page.waitForSelector('flutter-view', { timeout: 300000 });
  await L.sleep(25000);
  where = 'onboarding';
  for (const [w, h] of SIZES) { await page.setViewport({ width: w, height: h }); await L.sleep(2500); }
  await page.setViewport({ width: 1920, height: 1080 }); await L.sleep(2500);
  where = 'sign-in';
  for (let i = 0; i < 3; i++) { await page.mouse.click(1580, 1047); await L.sleep(1500); }
  await page.mouse.click(1580, 811); await L.sleep(3000);
  await page.mouse.click(1585, 432); await L.sleep(800); await page.keyboard.type('viewer@youpeak.test', { delay: 30 });
  await page.mouse.click(1585, 528); await L.sleep(800); await page.keyboard.type('Test@1234', { delay: 30 });
  page.on('response', (r) => { if (where === 'sign-in' && /:(5055|9095)\//.test(r.url()) && r.request().method() !== 'OPTIONS') console.log('  ', r.status(), r.url().split('?')[0].slice(-60)); });
  await page.mouse.click(1580, 639);
  await L.sleep(45000);
  await page.screenshot({ path: `${out}/debug-after-login.png` });
  // Trackpad investigation (semantics still off): notch, then a small-delta burst.
  where = 'wheel';
  await page.mouse.click(85, 223); await L.sleep(15000);
  await page.mouse.move(1034, 540);
  await page.mouse.wheel({ deltaY: 120 }); await L.sleep(4000);
  wheelLog.push('--- burst');
  for (let i = 0; i < 40; i++) { await page.mouse.wheel({ deltaY: 20 }); await L.sleep(16); }
  await L.sleep(4000);
  console.log('WHEEL LOG'); for (const l of wheelLog.slice(0, 60)) console.log('  ', l);
  await L.enableSemantics(page);
  const visited = [];
  for (const label of PAGES) {
    where = label;
    await page.setViewport({ width: 1920, height: 1080 }); await L.sleep(2000);
    try {
      await L.tap(page, label, { role: 'button', timeout: 30000, after: 6000 });
    } catch (e) {
      problems.push(`[${label}] could not open: ${e.message}`);
      continue;
    }
    for (const [w, h] of SIZES) { await page.setViewport({ width: w, height: h }); await L.sleep(3000); }
    await page.screenshot({ path: `${out}/debug-${label.toLowerCase()}-390.png` });
    visited.push(label);
    // Back to the main screen at desktop width for the next sidebar tap.
    await page.setViewport({ width: 1920, height: 1080 }); await L.sleep(2500);
    try { await L.tap(page, 'Home', { role: 'button', timeout: 8000, after: 2500 }); } catch (e) { await page.goBack().catch(() => {}); await L.sleep(3000); }
  }
  fs.writeFileSync(`${out}/debug-check.json`, JSON.stringify({ visited, problems, blocked: [...new Set(blocked)] }, null, 1));
  console.log('visited', visited);
  console.log('problems', problems.length);
  for (const p of problems.slice(0, 30)) console.log(' ', p);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
