// Copies the admin panel's CRA build into every directory where Vercel might
// look for a "dist" output folder, then prints diagnostics.
//
// Vercel resolves the Output Directory relative to the *project root directory
// it builds in*, which is not necessarily the repo root (e.g. when the Root
// Directory project setting or framework detection points elsewhere). npm sets
// INIT_CWD to the directory the build command was invoked from, which is
// exactly that directory, so we cover both it and the repo root.
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const src = path.join(__dirname, 'frontend', 'build');

if (!fs.existsSync(path.join(src, 'index.html'))) {
  console.error('Admin build missing at ' + src);
  process.exit(1);
}

const targets = new Set([path.join(repoRoot, 'dist')]);
for (const base of [process.env.INIT_CWD, process.cwd()]) {
  if (base) targets.add(path.join(path.resolve(base), 'dist'));
}

for (const dest of targets) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log('Copied admin build to ' + dest);
}

console.log('[collect-dist] repoRoot=' + repoRoot);
console.log('[collect-dist] cwd=' + process.cwd() + ' INIT_CWD=' + (process.env.INIT_CWD || ''));
console.log('[collect-dist] vercel.json at repo root: ' + fs.existsSync(path.join(repoRoot, 'vercel.json')));
console.log('[collect-dist] repo root entries: ' + fs.readdirSync(repoRoot).join(', '));
