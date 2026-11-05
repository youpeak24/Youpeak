// Builds reports/project-audit/full-project-audit-report.md from the registers and the ledger.
const fs = require("fs"), path = require("path");
const ch = require("./register-critical-high.cjs");
const ml = require("./register-medium-low.cjs");
const L = JSON.parse(fs.readFileSync(path.join(__dirname, "ledger.json"), "utf8"));
const n = (x) => x.toLocaleString("en-US");
const all = [...ch, ...ml];
const order = { Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4 };
const count = (s, k) => all.filter((f) => f.sev === s && (!k || f.kind === k)).length;
const defects = all.filter((f) => f.kind !== "Positive" && f.kind !== "Blocked");
const sevCounts = ["Critical", "High", "Medium", "Low", "Info"].map((s) => [s, defects.filter((f) => f.sev === s).length]);
const evName = { E: "emulator run", S: "static read", D: "deployed (read-only)", G: "git history", M: "demo-stack browser run" };
const ev = (e) => String(e).split(/\s*\+\s*/).map((x) => evName[x] || x).join(" + ");

// ledger totals
let tot = { f: 0, l: 0, r: 0, rl: 0, p: 0, pl: 0, s: 0, sl: 0 };
for (const v of Object.values(L)) { tot.f++; tot.l += v.lines || 0; if (v.status === "reviewed") { tot.r++; tot.rl += v.lines || 0; } else if (v.status === "partial") { tot.p++; tot.pl += v.lines || 0; } else { tot.s++; tot.sl += v.lines || 0; } }
const pct = (a, b) => (Math.round((1000 * a) / b) / 10).toFixed(1) + "%";

let md = `# YouPeak — full project audit report

**Audit date:** 6 October 2026 · **Branch audited:** \`fix/deploy-readiness\` (working tree with existing uncommitted changes preserved) · **Project root:** \`E:\\Legendary One\\youpeak\\source\\\` · **Author:** Claude (audit agent)

This is an evidence-based audit. No source file, production setting, DNS record, payment, credential or production data was changed; nothing was committed, pushed or deployed. Mutating tests ran only on throw-away Firestore/Auth emulators and the repository's documented demo stack. Observations are labelled by evidence class: **emulator run**, **static read**, **deployed (read-only)** (GET/OPTIONS/navigation, no login, no writes), **git history**, **demo-stack browser run**. Secrets are not printed anywhere in this report or its artifacts.

Companion artifacts are in \`reports/project-audit/full-project-audit/\` (see §15).

---

## 1. Executive assessment

**Verdict: the platform is not ready to take real money or personal data at public scale.** The deployed domain split works (consumer web, admin and API answer on Vercel) and much of the money engine is well built, but there are open ways to create money without paying, to destroy data, and to read other users' credentials, and several advertised products cannot be bought or are never delivered. I make no claim of "zero bugs", "secure" or "production ready".

**What is good (verified):**
- Role isolation between Super Admin, District Franchise and Digital Partner holds under test (suite 08: 11/12 controls; the failing one is a URL-prefix quirk). Suspended partners lose access on the next request.
- The reward engine, withdrawal ledger, Peak Boost, media upload grants and the webhook-driven payment state machine are covered by the repository's own emulator suites (115/115 pass), including concurrency cases (40 parallel ads never exceed 20/day; double approvals pay once).
- The Flutter client watch accumulator and API client are carefully built; admin and consumer sign-in render correctly at 1920/1366/768/390 px; 184 admin role/route/width views loaded without errors.
- The tier ladders in code match Terms V9 exactly (daily caps 1,000/2,500/4,500/12,500/17,167 coins incl. the +500 boost, prices ₹999/2,499/4,999/9,999, upgrade hours 0/50/100/200/400, 20 ads/day, likes 5/10/20/40/60, comments 2/5/10/20/30).

**Release blockers (fix before any public launch), in order:**
1. **SEC-1** — Firebase Admin key, \`JWT_SECRET\`, shared key and DB connection string are in pushed git history; values in history equal the current local ones. Rotate everything and purge.
2. **D-01** — the Firestore shim drops all Mongo operators: any registered user can delete every video record in one request; admin report deletion wipes the platform.
3. **P-01** — public endpoints return other users' password hashes, e-mails, push tokens and device ids; user ids are guessable timestamps.
4. **PAY-1** — coins can be credited for any gateway proof (₹1 → 1,100,000 coins demonstrated), replayed 6×, premium activated with no payment; **PAY-4** turns purchased coins into withdrawable cash.
5. **WH-1** — creator earnings can be minted by repeating a call the shipped app makes on every video.
6. **XSS-1**, **ID-1**, **CF-01** — franchise→super-admin stored XSS; channel pages/playlists broken for channels created by upload; comments, history and download screens return HTTP 500.
7. **DEP-4/PAY-5** — no webhook secret in production and the app abandons paid orders if the screen closes; **DEP-5** — the membership portal returns 404 so no pass can be bought.
8. **PN-1/PN-2, SUBS-1** — franchise commissions are misattributed or never created, credits can be minted, and creator-pass/promotion benefits are not delivered.

**Numbers:** ${all.filter((f) => f.kind !== "Positive" && f.kind !== "Blocked").length} findings (${sevCounts.map(([s, c]) => `${c} ${s}`).join(", ")}) plus ${count("Info", "Positive")} positive controls and ${count("Info", "Blocked")} blocked checks. My emulator audit suites ran 158 expectations: 107 met, 53 defects demonstrated. Coverage: ${tot.f} application files / ${n(tot.l)} lines in the ledger; **${tot.r} files (${pct(tot.rl, tot.l)} of lines) read in full, ${tot.p} partly read (${pct(tot.pl, tot.l)}), ${tot.s} files (${pct(tot.sl, tot.l)}) scan-only** — mostly Flutter UI/models/language maps and admin pages. I do not claim complete coverage (§13).

---

## 2. Scope, method and limits

- **Inventory:** 332 backend routes (\`route-inventory.md\`), 1,047 application-owned source/config files in the coverage ledger (\`ledger.md\`), 3,935 excluded files (generated, binary, vendored, earlier reports — §13).
- **Static review:** backend read almost completely (all utilities, middleware, models, all controllers except the near-duplicate feed pipelines in \`client/video.controller.js\`); admin SPA role/auth/withdrawal/partner pages and API layer; Flutter security, network, payment, deep-link, reward, payout, upload, auth and API files; infrastructure files; scripts; documents under \`E:\\Legendary One\\documents\\\` (requirements baseline in \`requirements-baseline.md\`).
- **Emulator tests:** ten audit suites (\`audit-tests/\`) on Firestore+Auth emulators with a \`demo-*\` project; the repository's own suites; Flutter and admin tests; analyzer; admin build (\`test-and-build-results.md\`).
- **Deployed checks (read-only):** DNS/HTTPS, headers, CORS preflight, webhook/cron/internal endpoints, well-known files, deep-link paths, public pages at four viewports.
- **Browser sweep:** headless Edge through the DevTools protocol against the deployed public pages and, with demo accounts, against the admin SPA on the local demo stack (\`responsive-and-ui.md\`).
- **Not possible / refused:** reading production Firestore (\`system_configs\`) was refused by the permission policy and I did not pursue another route — **BLOCKED**; Vercel/Razorpay/Cloudflare/AdMob/Google Cloud/store consoles; real devices; repository visibility on GitHub; load testing. I did not log in to production, attempt seeded credentials, simulate ad completion, or call payment/withdrawal endpoints on production.
- **Corrections to my own earlier notes** are recorded where they matter (e.g. FL-3 narrowed: two "legacy" endpoints are used by the shipped app; AFE-14 loader hang withdrawn; the first unused-admin-route list wrongly included \`platformConfig/:section\`).

- **Concurrent edits:** while I worked, another process was running the demo stack/Flutter dev server and three source files changed on disk that I did not touch (\`functions/backend/util/watchLedger.service.js\`, \`tests/emulator/suites/10-web-tasking.cjs\`, \`youpeak/lib/features/channel/view/your_channel_view.dart\`, modified 6 Oct 2026). Findings that cite those files reflect what I read earlier in the day; re-check them after the other work lands. I did not stop or alter that process; the only process I stopped was my own admin dev server on port 3055.

Severity: **Critical** = exploitable now by any registered user/anonymous caller with financial loss, data destruction, credential exposure, or exposed secrets; **High** = serious financial/security/functional failure with a realistic trigger, or a core requirement not met; **Medium** = limited impact, hardening, or conditional; **Low/Info** = minor, informational, positive or blocked.

---

## 3. Findings overview

| Severity | Count |
|---|---|
${sevCounts.map(([s, c]) => `| ${s} | ${c} |`).join("\n")}

Kinds: Defect = reproduced or unambiguous in code; Risk = plausible, not reproduced; Requirement = behaviour differs from a written requirement or a product is not delivered; Blocked = could not be checked; Positive = control that works.

| ID | Sev | Kind | Evidence | Title |
|---|---|---|---|---|
`;
for (const f of [...all].filter((f) => f.kind !== "Positive" && f.kind !== "Blocked").sort((a, b) => order[a.sev] - order[b.sev])) md += `| ${f.id} | ${f.sev} | ${f.kind} | ${ev(f.ev)} | ${f.title.replace(/\|/g, "/")} |\n`;

md += `\n---\n\n## 4. Critical and High findings (full detail)\n\nEach entry: where (path:lines), expected vs actual, reproduction, impact, fix and the test that proves the fix. Emulator checks refer to \`audit-tests/suites/*\` and \`logs/*\`.\n`;
for (const f of ch.sort((a, b) => order[a.sev] - order[b.sev])) {
  md += `\n### ${f.id} — ${f.title}\n**Severity:** ${f.sev} · **Kind:** ${f.kind} · **Area:** ${f.area} · **Evidence:** ${ev(f.ev)} · **Detail notes:** ${f.refs}\n\n- **Where:** ${f.where}\n- **Expected:** ${f.expected}\n- **Actual:** ${f.actual}\n- **Reproduce:** ${f.repro}\n- **Impact:** ${f.impact}\n- **Fix:** ${f.fix}\n- **Verification test:** ${f.verify}\n`;
}

md += `\n---\n\n## 5. Medium, Low, Info, blocked and positive findings\n\nShorter form; the detailed notes are in the cited \`findings-draft-*.md\` file (each contains the evidence, line references and reasoning).\n\n| ID | Sev | Kind | Evidence | Finding | Where | Fix / next step | Notes |\n|---|---|---|---|---|---|---|---|\n`;
for (const f of ml.sort((a, b) => order[a.sev] - order[b.sev])) md += `| ${f.id} | ${f.sev} | ${f.kind} | ${ev(f.ev)} | ${f.title.replace(/\|/g, "/")} | ${String(f.where).replace(/\|/g, "/")} | ${String(f.fix).replace(/\|/g, "/")} | ${f.refs} |\n`;

md += fs.readFileSync(path.join(__dirname, "report-static-sections.md"), "utf8")
  .replace("{{LEDGER_TOTALS}}", `${tot.f} files / ${n(tot.l)} lines: reviewed ${tot.r} files / ${n(tot.rl)} lines (${pct(tot.rl, tot.l)}); partial ${tot.p} / ${n(tot.pl)} (${pct(tot.pl, tot.l)}); scan-only ${tot.s} / ${n(tot.sl)} (${pct(tot.sl, tot.l)})`);

fs.writeFileSync(path.resolve(__dirname, "../full-project-audit-report.md"), md);
fs.writeFileSync(path.join(__dirname, "findings-register.json"), JSON.stringify(all, null, 1));
console.log("report lines:", md.split("\n").length, "| findings:", all.length, "| severity:", JSON.stringify(Object.fromEntries(sevCounts)));
