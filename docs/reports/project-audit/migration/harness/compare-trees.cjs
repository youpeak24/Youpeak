// Read-only tree comparison between the C: and E: copies.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const C = 'C:/Users/User/Desktop/Legendary One/youpeak/source';
const E = 'E:/Legendary One/youpeak/source';
const OUT = process.argv[2];

// Directories treated as dependency/generated caches (reported separately, never merged).
const CACHE_DIRS = new Set(['node_modules', '.dart_tool', 'build', '.gradle', '.wrangler', '.firebase',
  '.next', '.cache', 'Pods', '.symlinks', 'ephemeral', '.cxx', '.pub-cache', '.idea']);

function walk(root) {
  const files = new Map();
  const caches = new Map();
  (function rec(rel) {
    let entries;
    try { entries = fs.readdirSync(path.join(root, rel), { withFileTypes: true }); } catch { return; }
    for (const d of entries) {
      const r = rel ? rel + '/' + d.name : d.name;
      if (d.isDirectory()) {
        if (r === '.git') continue;
        if (CACHE_DIRS.has(d.name)) { caches.set(r, true); continue; }
        rec(r);
      } else if (d.isFile()) {
        const st = fs.statSync(path.join(root, r));
        files.set(r, { size: st.size, mtime: st.mtimeMs });
      }
    }
  })('');
  return { files, caches };
}

function hash(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

const c = walk(C), e = walk(E);
const res = { identical: [], missingFromE: [], eOnly: [], different: [], cachesC: [...c.caches.keys()], cachesE: [...e.caches.keys()] };
for (const [r, ci] of c.files) {
  const ei = e.files.get(r);
  if (!ei) { res.missingFromE.push({ path: r, size: ci.size, mtime: new Date(ci.mtime).toISOString() }); continue; }
  const hc = hash(path.join(C, r)), he = hash(path.join(E, r));
  if (hc === he) res.identical.push(r);
  else res.different.push({ path: r, sizeC: ci.size, sizeE: ei.size, mtimeC: new Date(ci.mtime).toISOString(), mtimeE: new Date(ei.mtime).toISOString() });
}
for (const [r, ei] of e.files) if (!c.files.has(r)) res.eOnly.push({ path: r, size: ei.size, mtime: new Date(ei.mtime).toISOString() });
fs.writeFileSync(OUT, JSON.stringify(res, null, 2));
console.log(`files C=${c.files.size} E=${e.files.size}`);
console.log(`identical=${res.identical.length} missingFromE=${res.missingFromE.length} eOnly=${res.eOnly.length} different=${res.different.length}`);
