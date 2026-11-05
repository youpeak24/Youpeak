// Verifies that every file path cited in the findings registers exists in the repository.
const fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "../../..");
const all = [];
(function w(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (["node_modules", "build", ".git", ".dart_tool", "reports", "emulator-data"].includes(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) w(p); else all.push(path.relative(root, p).split(path.sep).join("/"));
  }
})(root);
const regs = [...require("./register-critical-high.cjs"), ...require("./register-medium-low.cjs")];
const missing = new Set();
const re = /([A-Za-z0-9_\-\/\.]+\.(?:js|dart|json|xml|plist|gradle|md|yaml|cjs|ps1|html))(?=[:\s,;)(]|$)/g;
for (const r of regs) {
  const s = (r.where || "") + " ";
  for (const m of s.matchAll(re)) {
    const f = m[1];
    if (f.startsWith("http") || f.includes("youpeak.app")) continue;
    if (!all.some((a) => a === f || a.endsWith("/" + f))) missing.add(`${r.id} -> ${f}`);
  }
}
console.log(missing.size ? [...missing].join("\n") : "all cited paths exist");
