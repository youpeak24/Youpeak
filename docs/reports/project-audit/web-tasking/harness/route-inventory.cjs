// Route inventory from the source: every page pushed with Get.to/off/offAll,
// where it is opened from, and how the web layout places it on a desktop
// window (AppLayout registrations in lib/main.dart registerWideRoutes).
// Writes ../route-inventory.json and prints a markdown table.
const fs = require('fs');
const path = require('path');

const lib = path.resolve(__dirname, '../../../../youpeak/lib');
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.dart')) files.push(p); } })(lib);
const src = Object.fromEntries(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));
const rel = (f) => path.relative(path.resolve(lib, '..'), f).replace(/\\/g, '/');

// Pushed page classes and their callers.
const pushRe = /Get\.(to|off|offAll)\(\s*(?:\(\)\s*=>\s*)?(?:const\s+)?([A-Z][A-Za-z0-9_]*)\s*\(/g;
const routes = {};
for (const [f, s] of Object.entries(src)) {
  const code = s.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  let m;
  while ((m = pushRe.exec(code))) {
    const cls = m[2];
    (routes[cls] ||= { callers: new Set() }).callers.add(rel(f).replace(/^lib\//, ''));
  }
}
routes.SplashScreenView = { callers: new Set(['main.dart (home)']) };

// Registrations.
const main = src[path.join(lib, 'main.dart')];
const reg = main.slice(main.indexOf('void registerWideRoutes()'));
const wide = [...reg.matchAll(/registerWideRoute\((\w+)\)/g)].map((m) => m[1]);
const shell = {};
for (const m of reg.matchAll(/registerShellRoute\((\w+), maxContentWidth: (\d+)\)/g)) shell[m[1]] = Number(m[2]);
const listBlock = (marker) => { const i = reg.indexOf(marker); if (i < 0) return []; const j = reg.indexOf(']', i); return [...reg.slice(i, j).matchAll(/\b([A-Z]\w+)\b/g)].map((x) => x[1]); };
for (const cls of listBlock('// Library and channel lists')) if (/View|Page/.test(cls)) shell[cls] = 960;
for (const cls of listBlock('// Lists of settings and help')) if (/View|Page/.test(cls)) shell[cls] = 760;
const branded = listBlock('for (final page in [\n    OnBoardIngScreen').concat([...reg.matchAll(/registerBrandedRoute/g)].length ? [] : []);
const brandedList = (() => { const i = reg.indexOf('OnBoardIngScreen'); const j = reg.indexOf(']', i); return [...reg.slice(i - 5, j).matchAll(/\b([A-Z]\w+)\b/g)].map((x) => x[1]); })();
const fullscreen = (() => { const i = reg.indexOf('[ShortsVideoDetailsView'); const j = reg.indexOf(']', i); return [...reg.slice(i, j).matchAll(/\b([A-Z]\w+)\b/g)].map((x) => x[1]); })();

const gated = new Set();
for (const [, s] of Object.entries(src)) for (const m of s.matchAll(/TaskLockGate\(child: (?:const )?(\w+)\(/g)) gated.add(m[1]);

const rows = Object.keys(routes).sort().map((cls) => {
  const file = Object.keys(src).find((f) => new RegExp(`class ${cls}\\b`).test(src[f]));
  let placement;
  if (cls === 'SplashScreenView') placement = 'full window (splash)';
  else if (wide.includes(cls)) placement = 'own desktop layout (wide route)';
  else if (brandedList.includes(cls)) placement = 'branded split (sign-in/onboarding)';
  else if (fullscreen.includes(cls)) placement = 'full window (camera/live/Bites player)';
  else if (shell[cls]) placement = `shell + sidebar, ${shell[cls]}px`;
  else placement = 'shell + sidebar, 600px phone column';
  return {
    page: cls,
    file: file ? rel(file) : '(not found)',
    openedFrom: [...routes[cls].callers].sort(),
    desktop: placement,
    below900: brandedList.includes(cls) ? 'full width' : (wide.includes(cls) || fullscreen.includes(cls) || cls === 'SplashScreenView') ? 'full width' : '600px column (full width under 600px)',
    taskGate: cls === 'TaskLockGate' ? 'is the gate' : gated.has(cls) ? 'behind TaskLockGate' : (/Tasker|EarnReward/.test(cls) ? 'shows server lock state' : '—'),
  };
});
fs.writeFileSync(path.join(__dirname, '..', 'route-inventory.json'), JSON.stringify(rows, null, 1));
console.log(`| Page | Opened from | Desktop (≥900px, signed in) | Task gate |\n|---|---|---|---|`);
for (const r of rows) console.log(`| ${r.page} | ${r.openedFrom.slice(0, 3).join(', ')}${r.openedFrom.length > 3 ? ` +${r.openedFrom.length - 3}` : ''} | ${r.desktop} | ${r.taskGate} |`);
console.error(`${rows.length} routes; wide ${wide.length}, branded ${brandedList.length}, fullscreen ${fullscreen.length}, shell-registered ${Object.keys(shell).length}`);
