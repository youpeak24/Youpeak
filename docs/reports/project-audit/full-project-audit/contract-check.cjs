// Static contract check: parameters the Flutter app sends vs parameters the backend handler reads.
// Heuristic (regex based): flags (a) params the app sends that the handler never reads, and
// (b) params the handler requires (`!req.query.x` / `!req.body.x` guards) that the app never sends.
"use strict";
const fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "../../..");
const lib = path.join(root, "youpeak/lib");
const ctl = path.join(root, "functions/backend/controllers/client");
const constants = fs.readFileSync(path.join(lib, "core/constants/app_constant.dart"), "utf8");
const constMap = Object.fromEntries([...constants.matchAll(/static\s+(?:const\s+|final\s+)?(?:String\s+)?(\w+)\s*=\s*"((?:client|admin)\/[^"$]+)"/g)].map((m) => [m[1], m[2]]));
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith(".dart")) files.push(p); } })(lib);
const handlers = {};
for (const f of fs.readdirSync(ctl)) {
  const src = fs.readFileSync(path.join(ctl, f), "utf8");
  for (const m of src.matchAll(/exports\.(\w+)\s*=\s*(?:async\s*)?\(/g)) {
    const start = m.index;
    const next = src.indexOf("\nexports.", start + 10);
    (handlers[m[1]] = handlers[m[1]] || []).push({ file: f, body: src.slice(start, next === -1 ? undefined : next) });
  }
}
const readParams = (body) => {
  const read = new Set(), required = new Set();
  for (const m of body.matchAll(/req\.(?:query|body|params)\??\.(\w+)/g)) read.add(m[1]);
  for (const m of body.matchAll(/(?:const|let|var)\s*\{([^}]+)\}\s*=\s*(?:req\.(?:query|body)|req\??\.(?:query|body)\s*\|\|\s*\{\})/g)) for (const n of m[1].split(",")) read.add(n.split(":")[0].split("=")[0].trim());
  for (const m of body.matchAll(/!\s*req\.(?:query|body)\??\.(\w+)/g)) required.add(m[1]);
  for (const m of body.matchAll(/!\s*(\w+)\s*(?:\|\||\))/g)) if (read.has(m[1])) required.add(m[1]);
  return { read, required };
};
const rows = [];
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/Constant\.(\w+)/g)) {
    const p = constMap[m[1]]; if (!p || !p.startsWith("client/")) continue;
    const fn = p.split("/").pop();
    const cands = handlers[fn]; if (!cands || cands.length !== 1) continue;
    // window of the dart file around the usage
    const win = src.slice(Math.max(0, m.index - 200), m.index + 1800);
    const sent = new Set();
    for (const q of win.matchAll(/[?&](\w+)=\$/g)) sent.add(q[1]);
    for (const q of win.matchAll(/["'](\w+)["']\s*:\s*(?!\s*["'])/g)) sent.add(q[1]);
    const { read, required } = readParams(cands[0].body);
    const unread = [...sent].filter((s) => !read.has(s) && !/^(key|Authorization|Content-Type)$/i.test(s));
    const missing = [...required].filter((r) => !sent.has(r) && r !== "userId");
    if (unread.length || missing.length) rows.push({ app: path.relative(root, f).replace(/\\/g, "/"), endpoint: p, unreadByServer: unread, requiredButNotSent: missing });
  }
}
const seen = new Set();
const out = rows.filter((r) => { const k = r.app + r.endpoint; if (seen.has(k)) return false; seen.add(k); return true; });
fs.writeFileSync(path.join(__dirname, "contract-check.json"), JSON.stringify(out, null, 1));
console.log("endpoints with a possible contract mismatch:", out.length);
for (const r of out) console.log(r.endpoint.padEnd(52), "unread:", r.unreadByServer.join(",") || "-", "| required-not-sent:", r.requiredButNotSent.join(",") || "-", "|", r.app.split("/").slice(-2).join("/"));
