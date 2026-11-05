// Search results layout (semantics off so typing works). argv: buildDir port outDir
const L = require('./lib.cjs');
const fs = require('fs');
const path = require('path');
(async () => {
  const [dir, port, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const server = await L.serveDir(dir, Number(port));
  const profile = path.join(out, '..', 'profile-search');
  fs.rmSync(profile, { recursive: true, force: true });
  const browser = await L.launch({ width: 1920, height: 1080, userDataDir: profile });
  const { page } = await L.preparePage(browser);
  const searches = [];
  page.on('response', async (r) => { if (/client\/(video|user)\/search/i.test(r.url()) && r.request().method() !== 'OPTIONS') searches.push(`${r.status()} ${r.url().split('?')[0].split('/').slice(-2).join('/')}`); });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('flutter-view', { timeout: 90000 });
  await L.sleep(14000);
  for (let i = 0; i < 3; i++) { await page.mouse.click(1580, 1047); await L.sleep(900); }
  await page.mouse.click(1580, 811); await L.sleep(1500);
  await page.mouse.click(1585, 432); await L.sleep(500); await page.keyboard.type('viewer@youpeak.test', { delay: 20 });
  await page.mouse.click(1585, 528); await L.sleep(500); await page.keyboard.type('Test@1234', { delay: 20 });
  await page.mouse.click(1580, 639);
  await L.sleep(10000);
  await page.mouse.click(85, 398); // sidebar: Search
  await L.sleep(3000);
  await page.mouse.click(1070, 22); // search field
  await L.sleep(600);
  await page.keyboard.type('a', { delay: 40 });
  await L.sleep(400);
  await page.keyboard.press('Enter');
  await L.sleep(5000);
  for (const [w, h] of [[1920, 1080], [1366, 768], [768, 1024], [390, 844]]) {
    await page.setViewport({ width: w, height: h });
    await L.sleep(2500);
    await page.screenshot({ path: `${out}/04-search-results-${w}.png` });
  }
  console.log('search requests', searches);
  await browser.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
