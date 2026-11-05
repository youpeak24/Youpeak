// Audit-only emulator runner. Reuses the repository's fail-closed harness
// (refuses to run outside Firestore/Auth emulators with a demo-* project).
// Run from the repo root:
//   firebase-tools@13 emulators:exec --config tests/emulator/firebase.json --only firestore,auth \
//     --project demo-youpeak-audit "node reports/project-audit/full-project-audit/audit-tests/run.cjs [filter]"
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { boot, runner, assert } = require("../../../../tests/emulator/harness.cjs");
(async () => {
  const filters = process.argv.slice(2).filter(Boolean);
  const dir = path.join(__dirname, "suites");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".cjs")).sort().filter((f) => !filters.length || filters.some((x) => f.includes(x)));
  const h = await boot();
  const { results, check } = runner();
  for (const f of files) {
    console.log(`\n=== ${f}`);
    await require(path.join(dir, f))(h, (id, name, fn) => check(`${f.replace(/\.cjs$/, "")}:${id}`, name, fn), assert);
  }
  h.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\nAUDIT RESULT ${results.length - failed.length}/${results.length} expectations met (${failed.length} defects demonstrated)`);
  fs.writeFileSync(path.join(__dirname, "results.json"), JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 2));
  process.exit(0);
})().catch((e) => { console.error("HARNESS ERROR", e); process.exit(3); });
