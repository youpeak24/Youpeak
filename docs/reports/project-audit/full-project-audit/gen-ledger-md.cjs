// Renders ledger.json into ledger.md (area totals, exclusions, per-file table).
const fs=require("fs"),cp=require("child_process"),path=require("path");
const root=path.resolve(__dirname,"../../..");
const L=JSON.parse(fs.readFileSync(path.join(__dirname,"ledger.json"),"utf8"));
const n=(x)=>x.toLocaleString("en-US");
const area=(k)=>k.startsWith("functions/")||k==="api/index.js"||k.startsWith("worker/")?"Backend API / worker (functions, api, worker)":k.startsWith("admin/")?"Admin SPA (React)":k.startsWith("youpeak/")?"Flutter app (consumer web + Android/iOS)":k.startsWith("tests/")?"Repository tests":k.startsWith("DB/")||k.startsWith("scripts/")||k.startsWith("local-dev/")?"Scripts, seed data, local stack":"Root config, rules and docs";
const sum={};for(const [k,v] of Object.entries(L)){const a=area(k);sum[a]=sum[a]||{files:0,lines:0,reviewed:0,rl:0,partial:0,pl:0,scan:0,sl:0};const s=sum[a];s.files++;s.lines+=v.lines||0;if(v.status==="reviewed"){s.reviewed++;s.rl+=v.lines||0}else if(v.status==="partial"){s.partial++;s.pl+=v.lines||0}else{s.scan++;s.sl+=v.lines||0}}
const tot=Object.values(sum).reduce((a,s)=>({files:a.files+s.files,lines:a.lines+s.lines,reviewed:a.reviewed+s.reviewed,rl:a.rl+s.rl,partial:a.partial+s.partial,pl:a.pl+s.pl,scan:a.scan+s.scan,sl:a.sl+s.sl}),{files:0,lines:0,reviewed:0,rl:0,partial:0,pl:0,scan:0,sl:0});
const pct=(a,b)=>b?Math.round(1000*a/b)/10+"%":"–";
let md=`# Coverage ledger (generated from ledger.json by gen-ledger-md.cjs)

Scope: git-visible, application-owned source and configuration (tracked + untracked, not ignored) — **${tot.files} files, ${n(tot.lines)} lines**.
Statuses:
- **reviewed** — read in full (directly or through a condensed dump with imports/blank lines/log lines stripped) and assessed;
- **partial** — only the relevant sections were read (noted per file);
- **scan-only** — *not read line by line*: analyzed by the Dart analyzer / build / executed tests, by pattern scans (greps, metrics) and, for admin pages, rendered in the 184-view responsive sweep. These files are **unreviewed for logic defects** and are an explicit gap.

| Area | Files | Lines | reviewed (files / lines) | partial (files / lines) | scan-only (files / lines) | reviewed+partial share of lines |
|---|---|---|---|---|---|---|
`;
for(const [a,s] of Object.entries(sum).sort()) md+=`| ${a} | ${s.files} | ${n(s.lines)} | ${s.reviewed} / ${n(s.rl)} | ${s.partial} / ${n(s.pl)} | ${s.scan} / ${n(s.sl)} | ${pct(s.rl+s.pl,s.lines)} |\n`;
md+=`| **Total** | **${tot.files}** | **${n(tot.lines)}** | **${tot.reviewed} / ${n(tot.rl)}** | **${tot.partial} / ${n(tot.pl)}** | **${tot.scan} / ${n(tot.sl)}** | **${pct(tot.rl+tot.pl,tot.lines)}** |\n`;
md+=`\nReviewed alone (excluding partial): ${pct(tot.rl,tot.lines)} of lines. Backend "partial" is dominated by \`client/video.controller.js\` (~5,000 lines of near-duplicate feed pipelines that were skimmed, not read line by line).\n`;
const all=[...new Set(cp.execSync("git ls-files --cached --others --exclude-standard",{cwd:root,encoding:"utf8",maxBuffer:50e6}).trim().split("\n"))];
const rest=all.filter(f=>!(f in L));const g={};
for(const f of rest){let c=/^reports\//.test(f)?"reports/ (earlier reports and this audit's own output)":/^youpeak\/(ios|android|macos|windows|linux)\//.test(f)?"Flutter native-platform runner/generated files (icons, gradle wrapper, xcode project, registrants)":/(package-lock\.json|pubspec\.lock)$/.test(f)?"lockfiles":/\.(png|jpg|jpeg|gif|webp|avif|ico|svg|ttf|otf|woff2?|mp4|mp3|wav|webm|riv)$/.test(f)?"binary assets (images, fonts, media)":/\.json$/.test(f)?"JSON data/config (seed data, i18n JSON, manifests)":"other";(g[c]=g[c]||[]).push(f)}
md+=`\n## Exclusions (git-visible files not in the ledger): ${rest.length}\n\n| Category | Files | Reason |\n|---|---|---|\n`;
for(const [c,a] of Object.entries(g).sort((x,y)=>y[1].length-x[1].length)) md+=`| ${c} | ${a.length} | generated, binary, vendored or not application source |\n`;
md+=`\nAlso never opened or listed: \`node_modules/\`, \`admin/frontend/build/\` (generated; rebuilt during the audit; git-ignored), \`.dart_tool/\`, emulator data, \`functions/backend/serviceAccountKey.json\`, \`functions/backend/.env\` and the root \`serviceAccountKey.json\` (ignored credential files — only equality of values with committed history was tested, nothing printed).\n`;
if(g.other) md+=`\nUncategorised exclusions: ${g.other.slice(0,40).join(", ")}${g.other.length>40?" …":""}\n`;
md+=`\n## Per-file ledger\n\n| File | Lines | Status | Note |\n|---|---|---|---|\n`;
for(const [k,v] of Object.entries(L).sort((a,b)=>a[0].localeCompare(b[0]))) md+=`| ${k} | ${v.lines||0} | ${v.status} | ${(v.notes||"").replace(/\|/g,"/").slice(0,170)} |\n`;
fs.writeFileSync(path.join(__dirname,"ledger.md"),md);
console.log(md.split("\n").slice(0,40).join("\n"));
