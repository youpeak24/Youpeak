// Before/after comparison sheets: one PNG per screen, rows = before/after,
// columns = 1920 / 1366 / 768 / 390. argv: beforeDir afterDir outDir
const L = require('./lib.cjs');
const fs = require('fs');
const path = require('path');
const [beforeDir, afterDir, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const screens = [
  ['01-onboarding', 'Screenshot 1 — onboarding / yellow underline'],
  ['02-library', 'Screenshot 2 — Library'],
  ['03-bites', 'Screenshot 3 — Bites'],
  ['04-search', 'Screenshot 4 — Search'],
  ['05-notifications', 'Screenshot 5 — Notifications'],
  ['06-profile', 'Screenshot 6 — Profile'],
  ['07-tasker', 'Screenshot 7 — Tasker'],
];
const widths = [1920, 1366, 768, 390];
const img = (file) => (fs.existsSync(file) ? `data:image/png;base64,${fs.readFileSync(file).toString('base64')}` : '');
(async () => {
  const browser = await L.launch({ width: 2000, height: 1000 });
  const page = await browser.newPage();
  for (const [stem, title] of screens) {
    const cell = (dir, w) => { const src = img(path.join(dir, `${stem}-${w}.png`)); return `<td>${src ? `<img src="${src}">` : '<i>missing</i>'}<div>${w}px</div></td>`; };
    const html = `<html><body style="font:14px sans-serif;margin:12px;background:#fff">
      <h2 style="margin:4px 0 10px">${title}</h2>
      <table style="border-collapse:collapse"><tr><th></th>${widths.map((w) => `<th>${w}px</th>`).join('')}</tr>
      <tr><th style="padding-right:8px">BEFORE</th>${widths.map((w) => cell(beforeDir, w)).join('')}</tr>
      <tr><th style="padding-right:8px">AFTER</th>${widths.map((w) => cell(afterDir, w)).join('')}</tr></table>
      <style>td{vertical-align:top;padding:4px;border:1px solid #ddd;text-align:center} img{height:300px;display:block}</style></body></html>`;
    await page.setContent(html, { waitUntil: 'load' });
    const body = await page.$('body');
    await body.screenshot({ path: path.join(outDir, `compare-${stem}.png`) });
    console.log('wrote', `compare-${stem}.png`);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
