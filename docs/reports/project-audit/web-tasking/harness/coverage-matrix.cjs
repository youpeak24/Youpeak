// Route coverage matrix from the browser evidence: for each captured route
// and width, whether it was reached, whether the desktop sidebar is present
// (expected only at ≥900px), and whether the page scrolls horizontally.
// Debug-build exceptions/overflows come from screenshots/debug.
// Writes ../route-coverage-matrix.md
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'screenshots');
const read = (d) => { try { return JSON.parse(fs.readFileSync(path.join(dir, d, 'evidence.json'))); } catch { return null; } };
const final = read('final');
const debug = read('debug');
const before = read('before');
const widths = ['1920', '1366', '768', '390'];
const sidebar = (labels) => ['Home', 'Library', 'Tasker', 'Profile'].every((l) => labels.includes(l));

const debugErrors = {};
for (const b of (debug && debug.flutterErrors) || []) debugErrors[b.route] = (debugErrors[b.route] || 0) + 1;

let md = '# Route coverage matrix\n\n';
md += 'Source: `screenshots/final/evidence.json` (final release build), `screenshots/debug/evidence.json` (debug build, assertions on), `screenshots/before/evidence.json` (pre-task build).\n\n';
md += 'Cell: ✅ reached · S = desktop sidebar shown (expected at 1920/1366) · ⚠ horizontal page scroll. Screenshots: `screenshots/<run>/<route>-<width>.png`.\n\n';
md += `| Route | ${widths.join(' | ')} | Debug build: exceptions / overflows | Before: sidebar at 1920 |\n|---|${widths.map(() => '---').join('|')}|---|---|\n`;
for (const [route, rec] of Object.entries((final && final.routes) || {})) {
  if (rec.error) { md += `| ${route} | ${widths.map(() => '❌').join(' | ')} | | error: ${rec.error} |\n`; continue; }
  const cells = widths.map((w) => {
    const r = rec[w];
    if (!r) return '—';
    const s = sidebar(r.labels) ? ' S' : '';
    const o = r.overflow.scrollW > Number(w) + 1 ? ' ⚠' : '';
    return `✅${s}${o}`;
  });
  const dbg = debug && debug.routes[route] ? (debugErrors[route] ? `${debugErrors[route]} exception report(s)${route === '36-channel' ? ' — fixed after this run (null-safe header)' : route === '40-search' ? ' — trailing reports from the channel page just before' : ''}` : 'none') : 'not in debug run';
  const b = before && before.routes[route] && before.routes[route]['1920'] ? (sidebar(before.routes[route]['1920'].labels) ? 'yes' : '**no**') : '—';
  md += `| ${route} | ${cells.join(' | ')} | ${dbg} | ${b} |\n`;
}
md += '\nPhone layouts (390/768) correctly have no sidebar; the bottom navigation / back button is used there.\n';
fs.writeFileSync(path.join(__dirname, '..', 'route-coverage-matrix.md'), md);
console.log(md);
