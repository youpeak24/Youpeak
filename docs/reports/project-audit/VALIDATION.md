# Validation — 1 October 2026

| Check | Result |
|---|---|
| `npm test` | 20 passed, 0 failed; isolated media and webhook regression tests |
| `node scripts/audit-source.cjs` | 937 files / 150,010 lines in captured inventory; 0 JS/JSX syntax failures, 0 missing literal relative require targets |
| `npm run build` | React admin production build passed; main JS approximately 836 KB gzip; bundle-size, large-SVG and Node deprecation warnings |
| `flutter test --no-pub` | 65 tests passed during the audit |
| `dart analyze --format machine` | 0 errors, 85 warnings, 814 infos; analyzer is not clean |
| `flutter build web --no-pub` | Passed; output `youpeak/build/web`; JavaScript web build only |
| Flutter WebAssembly dry run | Incompatibilities reported in Zego, connectivity, GetStorage and socket interop dependencies; WASM readiness not established |
| `git diff --check` | Passed; Git reported line-ending conversion warnings |
| API DNS retry | `api.youpeak.app`: `ENOTFOUND`; production endpoint not verified |

No deployment or production write was performed. Passing isolated tests/builds does not establish end-to-end correctness, production configuration, or safe financial settlement. See [remaining blockers](REVIEW.md#remaining-release-blockers).

Inventory counts reflect the captured scan, not manually reviewed line counts. Re-run the inventory after further code edits. Build outputs do not contain a newly verified production API configuration.

## Phase 2 — 1 October 2026

| Check | Result |
|---|---|
| `npm run test:emulator` (Firestore + Auth emulators, 9 suites) | 101/101 passed — 25 Phase 1 tests recovered into the repo + 76 new |
| `npm test` | 20/20 passed (two tests updated to the new design) |
| `flutter test --no-pub` | 65/65 passed |
| `flutter build web --no-pub` | Passed |
| React admin `npm run build` | Passed; main JS 836 kB gzip (+369 B) |
| `dart analyze` (lib, test) | 0 errors, 85 warnings, 814 infos — unchanged |
| `node --check` (276 backend/api/worker files) | 0 failures |
| `node scripts/audit-source.cjs` | 956 files / 152,522 lines; 0 syntax failures, 0 unresolved requires |
| `git diff --check` (Phase 2 files) | Clean |
| Emulator harness without emulators | Refuses to run (exit 2) |

No deployment or production write was performed in Phase 2.
