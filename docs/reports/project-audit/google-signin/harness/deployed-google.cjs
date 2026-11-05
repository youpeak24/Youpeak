// Reproduce "Continue with Google" on a deployed origin. Read-only: no
// credentials are entered; the Google window is only observed, then closed.
// argv: origin outDir [width height]
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const redact = (u) => { try { const x = new URL(u); return x.origin + x.pathname + (x.search ? '?…' : ''); } catch { return u.slice(0, 120); } };

(async () => {
  const [origin, out, w = '1920', h = '1080'] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const width = Number(w), height = Number(h);
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', defaultViewport: { width, height, deviceScaleFactor: 1 }, args: [`--window-size=${width},${height}`],
  });
  const page = await browser.newPage();
  const log = [];
  const t0 = Date.now(); const ts = () => ((Date.now() - t0) / 1000).toFixed(1);
  page.on('console', (m) => { const t = m.text(); if (/GOOGLE|auth\/|firebase|error|Error/i.test(t)) log.push(`${ts()} console.${m.type()}: ${t.replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '<jwt>').slice(0, 300)}`); });
  page.on('pageerror', (e) => log.push(`${ts()} pageerror: ${e.message.slice(0, 300)}`));
  page.on('requestfailed', (r) => log.push(`${ts()} FAILED ${r.method()} ${redact(r.url())} ${r.failure()?.errorText}`));
  page.on('response', async (r) => {
    const u = r.url();
    if (/identitytoolkit|securetoken|firebaseapp\.com\/__\/auth|api\.youpeak\.app\/client\/user/.test(u)) {
      let body = ''; try { body = (await r.text()).replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '<jwt>').replace(/"(idToken|refreshToken|accessToken|firebaseCustomToken)":"[^"]*"/g, '"$1":"<redacted>"').slice(0, 300); } catch {}
      log.push(`${ts()} RES ${r.status()} ${r.request().method()} ${redact(u)} ${body}`);
    }
  });
  browser.on('targetcreated', async (t) => {
    log.push(`${ts()} NEW TARGET ${t.type()} ${redact(t.url())}`);
    if (t.type() === 'page') {
      const p = await t.page().catch(() => null);
      if (p) {
        p.on('framenavigated', (f) => { if (f === p.mainFrame()) log.push(`${ts()}   popup navigated ${redact(f.url())}`); });
        setTimeout(async () => { try { log.push(`${ts()}   popup title: ${await p.title()} url: ${redact(p.url())}`); await p.screenshot({ path: `${out}/popup-${width}.png` }); } catch (e) { log.push('popup shot failed ' + e.message); } }, 6000);
      }
    }
  });

  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('flutter-view', { timeout: 120000 });
  await sleep(14000);
  await page.screenshot({ path: `${out}/01-start-${width}.png` });
  // Onboarding -> Let's you in (desktop coordinates from the local build; same UI).
  if (width >= 900) {
    for (let i = 0; i < 3; i++) { await page.mouse.click(1580, 1047); await sleep(1000); }
    await sleep(1500);
    await page.screenshot({ path: `${out}/02-letsin-${width}.png` });
    log.push(`${ts()} --- click Continue with Google`);
    await page.mouse.click(1580, 674);
  } else {
    // Phone width: enable semantics to find the buttons.
    await page.evaluate(() => document.querySelector('flt-semantics-placeholder')?.click());
    await sleep(800);
    const find = async (label) => page.evaluate((label) => { for (const el of document.querySelectorAll('flt-semantics')) { if ((el.getAttribute('aria-label') || el.textContent || '').trim() === label) { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; } } return null; }, label);
    for (let i = 0; i < 3; i++) { const n = await find('Next'); if (n) { await page.mouse.click(n.x, n.y); await sleep(1000); } }
    await sleep(1500);
    await page.screenshot({ path: `${out}/02-letsin-${width}.png` });
    const g = await find('Continue with Google');
    log.push(`${ts()} --- click Continue with Google ${g ? '' : '(button not found)'}`);
    if (g) await page.mouse.click(g.x, g.y);
  }
  await sleep(12000);
  await page.screenshot({ path: `${out}/03-after-click-${width}.png` });
  fs.writeFileSync(`${out}/log-${width}.txt`, log.join('\n'));
  console.log(log.join('\n'));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
