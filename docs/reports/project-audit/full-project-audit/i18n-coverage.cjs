// Translation coverage of the Flutter app: AppStrings keys vs each language map; keys used in code but undefined.
const fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "../../../youpeak/lib");
const strings = fs.readFileSync(path.join(root, "core/constants/app_string.dart"), "utf8");
const keys = [...strings.matchAll(/static (?:String|final String|const String) (\w+) = "([^"]*)"/g)].map((m) => ({ name: m[1], val: m[2] }));
const dir = path.join(root, "core/localization/languages");
const entryRe = /^\s*"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/gm;
const load = (f) => new Map([...fs.readFileSync(path.join(dir, f), "utf8").matchAll(entryRe)].map((m) => [m[1], m[2]]));
const en = load("language_en.dart");
const rows = [];
for (const f of fs.readdirSync(dir).sort()) {
  const map = load(f);
  let same = 0, tot = 0;
  for (const [k, v] of en) if (map.has(k)) { tot++; if (map.get(k) === v) same++; }
  rows.push({ lang: f.replace("language_", "").replace(".dart", ""), entries: map.size, appStringsMissing: keys.filter((k) => !map.has(k.val)).length, identicalToEnglishPct: tot ? Math.round((100 * same) / tot) : 0 });
}
console.log("AppStrings entries:", keys.length, "| English map entries:", en.size);
console.table(rows);
const missEn = keys.filter((k) => !en.has(k.val)).map((k) => k.val);
console.log("AppStrings keys with no English text (render as the raw key):", missEn.length, missEn.slice(0, 30).join(", "));
// keys referenced as AppStrings.x.tr where x is not defined
const names = new Set(keys.map((k) => k.name));
const used = new Set();
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith(".dart")) for (const m of fs.readFileSync(p, "utf8").matchAll(/AppStrings\.(\w+)/g)) used.add(m[1]); } })(root);
console.log("AppStrings.* referenced but not defined:", [...used].filter((n) => !names.has(n)).join(", ") || "none");
// literal English strings passed to Text()/toast in UI (not localized)
let literal = 0, files = 0;
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!p.includes("localization")) walk(p); } else if (p.endsWith(".dart")) { const t = fs.readFileSync(p, "utf8"); const n = [...t.matchAll(/(?:Text|CustomToast\.show|CustomToast\.celebrate)\(\s*"([A-Z][^"$]{6,})"/g)].length; if (n) { literal += n; files++; } } } })(path.join(root, "features"));
console.log("hard-coded English literals in Text()/toast calls under features/:", literal, "in", files, "files");
