# Full project audit — artifact index

Start with `../full-project-audit-report.md` (main report). Everything else here is evidence:

- `findings-register.json` — every finding (generated); `findings-draft*.md` — notes with line-level evidence.
- `ledger.md` / `ledger.json` — file-by-file coverage (reviewed / partial / scan-only) and exclusions.
- `route-inventory.md` — 332 backend routes with middleware and auth level.
- `requirements-baseline.md` — requirements from the documents and conflicts RC-1..RC-10.
- `test-and-build-results.md`, `logs/` — every command run and its output.
- `audit-tests/` — emulator audit suites 01–10 (`run.sh <filter> <log>`), plus `cdp-*.cjs` browser scripts.
- `responsive-and-ui.md`, `screenshots/` — viewport, accessibility and UI-state evidence.
- `gen-report.cjs`, `register-*.cjs`, `report-static-sections.md` — regenerate the main report (`node gen-report.cjs`).

No secrets are stored in any of these files. Mutating tests ran only on emulators / the documented demo stack.
