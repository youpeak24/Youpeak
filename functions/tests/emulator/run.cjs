// Runs every suite in tests/emulator/suites against ONE backend instance on the
// Firestore/Auth emulators. Optional args filter suites by file-name substring.
//   npm run test:emulator                 (all suites)
//   EMULATOR_SUITES=02,05 npm run test:emulator   (only suites whose file name contains 02 or 05)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { boot, runner, assert } = require("./harness.cjs");

(async () => {
  const filters = [...process.argv.slice(2), ...String(process.env.EMULATOR_SUITES || "").split(",")].map((x) => x.trim()).filter(Boolean);
  const dir = path.join(__dirname, "suites");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".cjs")).sort()
    .filter((f) => !filters.length || filters.some((x) => f.includes(x)));
  const h = await boot();
  const { results, check } = runner();
  for (const f of files) {
    console.log(`\n=== ${f}`);
    const suite = require(path.join(dir, f));
    await suite(h, (id, name, fn) => check(`${f.replace(/\.cjs$/, "")}:${id}`, name, fn), assert);
  }
  h.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\nRESULT ${results.length - failed.length}/${results.length} passed (${files.length} suites)`);
  fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
  fs.writeFileSync(path.join(__dirname, "out", "results.json"), JSON.stringify({ ranAt: new Date().toISOString(), suites: files, results }, null, 2));
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error("HARNESS ERROR", e); process.exit(3); });
