// Read-only inventory and syntax/relative-import scan. No application boot,
// database connections, secret contents, dependency code or generated bundles.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const parser = require('../Admin_Panel/frontend/node_modules/@babel/parser');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'docs/reports/project-audit');
fs.mkdirSync(out, { recursive: true });
const all = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8', maxBuffer: 25e6 }).trim().split('\n'))];
const files = []; const failures = []; const unresolved = [];
for (const name of all) {
  if (!/\.(js|jsx|mjs|cjs|ts|tsx|dart|rules)$/.test(name) || /(^|\/)(node_modules|build|assets|vendor|reports)\//.test(name)) continue;
  const file = path.join(root, name); if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  const entry = { file: name, lines: text.split(/\r?\n/).length, sha256: crypto.createHash('sha256').update(text).digest('hex'), review: name.endsWith('.dart') ? 'Dart analyzer/test coverage; not individually manually reviewed' : 'Inventory/static scan; not individually manually reviewed' };
  if (/\.(js|jsx|mjs|cjs)$/.test(name)) {
    try { parser.parse(text, { sourceType: 'unambiguous', plugins: ['jsx'], allowReturnOutsideFunction: true }); entry.syntax = 'passed'; }
    catch (e) { entry.syntax = 'failed'; failures.push({ file: name, line: e.loc?.line, message: e.reasonCode }); }
    for (const match of text.matchAll(/require\(["'](\.[^"']+)["']\)/g)) {
      const base = path.resolve(path.dirname(file), match[1]);
      if (![base, base + '.js', base + '.json', path.join(base, 'index.js')].some(p => fs.existsSync(p))) {
        unresolved.push({ file: name, line: text.slice(0, match.index).split('\n').length, target: match[1], note: /serviceAccountKey/.test(match[1]) ? 'Optional local credential lookup; production uses environment' : 'Needs review: static literal require target not found' });
      }
    }
  }
  files.push(entry);
}
const byRoot = {};
for (const f of files) { const key = f.file.split('/')[0]; const row = byRoot[key] ||= { files: 0, lines: 0 }; row.files++; row.lines += f.lines; }
const summary = { generatedAt: new Date().toISOString(), scope: 'Git-visible first-party code; binary assets, secrets, dependencies and build outputs excluded', files: files.length, lines: files.reduce((n,f) => n + f.lines, 0), byRoot, syntaxFailures: failures, unresolvedRelativeRequires: unresolved };
fs.writeFileSync(path.join(out, 'source-inventory.json'), JSON.stringify({ ...summary, entries: files }, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (failures.length) process.exitCode = 1;
