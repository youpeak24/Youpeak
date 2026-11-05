# Tests, analyzers, builds and audit suites — results

All runs are local. Mutating tests ran only against throw-away Firestore/Auth emulators (`demo-*` projects, ports 8396/9396) or the documented demo stack (`local-dev`, demo data). Nothing here wrote to the production Firebase project, payment gateways, Cloudflare or DNS. Logs are under `logs/`.

## 1. Existing repository checks

| Check | Command (from repo root unless noted) | Result | Log |
|---|---|---|---|
| Backend unit/contract tests | `npm test` (node:test; `tests/*.test.cjs`) | **28 / 28 pass** | `logs/npm-test.txt` |
| Backend emulator suites (10 suites, 115 checks) | `npm run test:emulator` (= `npx -y firebase-tools@13 emulators:exec --config tests/emulator/firebase.json --only firestore,auth --project demo-youpeak-audit "node tests/emulator/run.cjs"`) | **115 / 115 pass** (security, visibility, bcrypt, Peak Boost, payments, withdrawals, rewards, media, requirements, web tasking) | `logs/emulator-test.txt` |
| Flutter analyzer | `flutter analyze` (in `youpeak/`) | **0 errors, 84 warnings, 814 infos** (exit 1 because infos are reported). Warnings: 42 unused_import, 18 invalid_null_aware_operator, 13 dead_null_aware_expression, rest misc. | `logs/flutter-analyze.txt` |
| Flutter tests | `flutter test` (in `youpeak/`) | **107 / 107 pass** (security signals, accumulator, tasker state, system configs, API client, sign-up model, widgets) | `logs/flutter-test.txt` |
| Admin SPA tests | `CI=true npm test -- --watchAll=false` (in `admin/frontend/`) | **4 / 4 pass** — the only test file in the SPA (`util/apiError.test.js`) | `logs/admin-test.txt` |
| Admin SPA production build | `CI=true npm run build` | **Compiled successfully**; main bundle 836 kB gzip (CRA warns it is too large; no code splitting) | `logs/admin-build.txt` |
| Flutter web / Android builds | `scripts/build-consumer-web.ps1`, `scripts/build-consumer-apk.ps1` | **not run** (need the client key and, for Android, `key.properties`; building would also not prove store acceptance) | – |
| Backend boot check | `npm run check` | not run separately (the emulator suites boot the full Express app) | – |

Notes: the Java 17 JDK in this environment only works with firebase-tools 13 (the globally installed CLI needs Java 21), hence `npx -y firebase-tools@13`. The repository's own test run writes `tests/emulator/out/results.json` (untracked; `tests/` is untracked).

## 2. Audit suites added by this audit (all emulator-only)

Located in `audit-tests/` (`run.sh <filter> <log>` runs one suite inside throw-away emulators and frees the ports afterwards). Suites 01–06 and 09–10 are written as *defect demonstrators*: each check states the correct behaviour, so "0 met" means the defect reproduced. Suite 07 is a smoke test (does the endpoint answer?); suite 08 contains positive controls (isolation should hold).

| Suite | Topic | Expectations met | Defects demonstrated | Log |
|---|---|---|---|---|
| 01-data-layer | Firestore shim: `$in/$gte` dropped, id collisions, guarded spends, stale save, upsert, `$round` | 0 / 8 | 8 | `audit-data-layer.txt` |
| 02-auth-privacy | public endpoints returning raw user docs, duplicate e-mail sign-up, login throttling, soft delete, OTP | 0 / 6 | 6 | `audit-02-auth-privacy.txt` |
| 03-money-and-scope | single-video delete wipes all videos, date-range filters, purchased coins convertible, franchise attribution, partner licence fee credits, GET dashboard rotates password | 0 / 6 | 6 | `audit-03-money-scope.txt` |
| 04-payments | coin-plan credit without matching order, replay, premium plan without payment, arbitrary-amount orders | 0 / 4 | 4 | `audit-04-payments.txt` |
| 05-collections-and-feeds | collection-name mismatches (isSubscribed, views), hanging `shortsOfUser`, feed ordering | 0 / 5 | 5 | `audit-05-collections.txt` |
| 06-rewards-and-history | like→convert→unlike cap bypass, creator earnings re-credit, orphan playback rows, comment/history 500s | 0 / 6 | 6 | `audit-06-rewards.txt` |
| 07-endpoint-smoke | 104 client+admin endpoints with seeded data | 94 / 104 | 10 (4 real failures: comments list, replies, watch history, download history; 6 seed-dependent empty states) | `audit-07-smoke.txt` |
| 08-authorization | role isolation positive controls (franchise/partner/user/admin tokens, cron, webhooks) | 11 / 12 | 1 (AZ-12: `/api/admin/...` prefix is refused for restricted roles; the SPA uses same-origin `/admin/...`, so functional only) | `audit-08-authz.txt` |
| 09-playlists (+ channel identity) | playlist creation with `$in`, channel page for uuid channelId, channel playlists, pagination | 2 / 7 | 5 | `audit-09-playlists.txt` |
| 10-xss-sink | franchise-planted HTML e-mail echoed to the Super Admin | 0 / 2 | 2 | `audit-10-xss-sink.txt` |
| **Total** | | **107 / 158** | **53** | |

Browser/DOM scripts (read-only against public deployed pages, or against the demo stack): `cdp-shots.cjs`, `cdp-flow.cjs`, `cdp-admin.cjs`, `cdp-admin-states.cjs` — results in `responsive-and-ui.md` and `screenshots/`.

## 3. Static tooling
- `gen-route-inventory.cjs` → `route-inventory.md`: 332 backend routes (181 admin-JWT, 87 user-token, 32 shared-key + optional token, 20 shared-key only, 12 self-authenticating with no route-level guard).
- `i18n-coverage.cjs` → `logs/i18n-coverage.txt`: 504 `AppStrings` keys; 19 non-English maps each lack 122 of them (English fallback exists); 128 hard-coded English literals in 36 UI files. (The tool's "referenced but not defined" list was a false positive — those names are static getters — and is not reported.)
- `contract-check.cjs` → `contract-check.json`: weak regex heuristic for app-vs-backend parameter mismatches; used for triage only (see findings-draft-16).
- `gen-ledger-md.cjs` → `ledger.md`.
- Pattern metrics (Flutter and admin SPA) are in findings-draft-17 (FL-26, AFE-25, A11Y-2).

## 4. Not run / not possible here
- Android/iOS devices and store builds; push notifications; Zego live streaming; AdMob ads; Razorpay live checkout; Cloudflare R2/Stream uploads with real credentials; real Firebase Auth phone/Google/Apple sign-in; production Firestore reads (the permission policy refused a read of `system_configs`; I did not look for another route).
- Load, soak and cost tests (the shim loads whole collections per request — PERF-1 is analytical, not measured).
- Accessibility with real assistive technology; colour contrast; keyboard focus order.
