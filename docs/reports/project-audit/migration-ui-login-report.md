# YouPeak — Migration, Desktop UI and Admin Login Report

| | |
|---|---|
| Date | 2026-10-02 → 2026-10-03 |
| Active project (all work, runs and builds) | `E:\Legendary One\youpeak\source` |
| Previous copy (reference only, read-only) | `C:\Users\User\Desktop\Legendary One\youpeak\source` — **no longer present** at final verification (see §1.6) |
| Git | branch `fix/deploy-readiness`, HEAD `894b2f4e` (no commits made by this task) |
| Evidence folder | `reports/project-audit/migration/` |

## Status at a glance

| Area | Result |
|---|---|
| **Migration completeness** | **Complete.** E: had 25 files missing and 19 stale versus C: (incl. 7 Phase 2 backend source files). All recovered/merged after backup; post-check: E: = C: except intentional generated-output differences. No E:-only work was overwritten. |
| **UI verification** | **Done in the browser** (headless Chrome, release and debug builds, 1920 / 1366 / 768 / 390). All 8 screenshot issues fixed and re-verified; 23/23 interaction & state checks pass; debug-mode run: 0 layout overflows / 0 framework exceptions across 8 pages × 4 widths. |
| **Local admin login verification** | **Verified locally** with isolated test accounts: 7/7 browser flows + role/authorization matrix pass. Root cause of "Network Error" identified and fixed. **The real administrator account was not tested** (no production access by design). |
| **Remaining production readiness work** | See §9: production admin env/config check by the owner, Cloudflare delivery not exercised, dev-only Auth SDK lookup quirk, unresolved items carried from Phase 2. |

Additional defects found and fixed while verifying (not in the original screenshots, but blocking the verification): a Phase 2 sign-in regression (§3.9), a sign-in crash for users without an age on phone builds (§3.10), an endless Tasker spinner (§3.7), an endless Notifications skeleton (§3.6), dead arrow keys and trackpad swipes on desktop Bites (§3.3), and a production-credential fallback in `npm start` (§2.3).

---

## 1. Migration reconciliation (C: → E:)

### 1.1 Method
- Recorded both working trees before any change: `migration/worktree-C-before.txt`, `migration/worktree-E-before.txt` (326 / 304 `git status` entries).
- SHA-256 comparison of every file in both trees (`migration/harness/compare-trees.cjs`), excluding only dependency/generated cache directories (`node_modules`, `.dart_tool`, `build`, `.gradle`, `.wrangler`, `.firebase`, `Pods`, `.idea`, `ephemeral`), which were listed separately (identical sets on both sides) and regenerated rather than merged.
- Hidden files (`.env*`, `.firebaserc`, `.gitignore`, service-account files) were included in the comparison; **no secret values were read into reports** (only key names / `project_id`).
- Every differing file was diffed line-by-line (CR-insensitive) before choosing a side; modification times were not used as the decision.

### 1.2 Findings before reconciliation
| Class | Count | Notes |
|---|---|---|
| Identical | 1,904 | — |
| Missing from E: | 25 | 7 Phase 2 backend source files (`mediaAudit` controller/route, `optionalAppUser`, `withholdLockedPlayback`, `safeUser`, `uploadGrants`, `withdrawalLedger`), 8 emulator suites (`02`–`09`), 7 Phase 2 evidence files, the Phase 2 final report, 2 emulator run logs |
| Different | 19 | 9 backend source, 2 unit tests, 6 audit reports, 2 generated (`firestore-debug.log`, `tests/emulator/out/results.json`) |
| E:-only | 0 | — |

Every E:-side difference was pre-Phase-2 code that the C: version replaced with the documented Phase 2 fix (withdrawal reservation ledger, transactional rewards, upload grants/F-28 media ownership, payment state machine). E: was internally inconsistent (e.g. its `payment.controller.js` already matched Phase 2 while its webhook test still mocked the old API).

### 1.3 Actions (full log: `migration/reconciliation-applied.txt`)
- **Backup first:** the 19 differing E: files, byte-verified, at `E:\Legendary One\youpeak\_migration_backup_20261002\e-before\` (+ `compare-before.json`, `compare-after.json`, `applied.txt`). Outside the git tree; intact.
- **Recovered** 23 files from C:; **merged** 17 (C: version adopted after review).
- **Generated output not merged:** `firestore-debug.log`, `tests/emulator/out/results.json`. C:'s historical emulator logs/results were preserved as evidence in `reports/project-audit/phase2/historical-emulator-out/` (not in `out/`, which the next run overwrites).
- **No destructive mirroring, no reset, no `.git` replacement.** Both repos had identical history (227 commits, same branches/HEAD); each had one different Codex tool checkpoint ref — E:'s kept, C:'s (`refs/codex/...` → `b92480ee`) not imported.

### 1.4 Post-reconciliation check
Re-hash: E: identical to C: except the 2 generated files, the 2 historical logs moved to the evidence folder, and the new evidence files. **Unresolved conflicts: none.**

### 1.5 Running processes and paths
- Admin dev server on :3000 and an existing `flutter run -d chrome` were confirmed to run from **E:**; nothing ran from C:. No backend was running at all (see §5).
- Old C: paths remain only in: Flutter build caches (`.dart_tool/flutter_build/*`, babel cache — regenerated), git-ignored iOS/macOS generated xcconfig files (regenerated on the first macOS build; unused on Windows), and historical audit reports (kept as evidence). `android/local.properties` points at the Android/Flutter SDKs on C: — legitimate, unchanged. `flutter pub get` left `pubspec.lock` unchanged (its 1-line difference from HEAD predates this task).

### 1.6 Notes the owner should know
- **The C: copy was not found at final verification** (2026-10-03). This task only ever read from it (hashing, diffing, copying C:→E:). `E:\Legendary One\youpeak\` now also contains `safe source`, `sub source`, `zip` folders not created by this task. Nothing from C: is missing on E: (§1.4); the only C:-only item not carried over is the Codex checkpoint ref above.
- Two files on E: were changed **outside this task** after reconciliation and were left untouched: `DEPLOYMENT.md` (modified 2026-10-03 14:14) and new `youpeak/web/vercel.json` (13:57; an SPA rewrite). Please review them.

---

## 2. Verification of the E: project

### 2.1 Test and build results

| Suite | Phase 2 baseline | E: after reconciliation | **Final** | Evidence |
|---|---|---|---|---|
| `npm run test:emulator` | 101 | 101/101 | **101/101** | `migration/emulator-test-final.txt` |
| `npm test` (backend unit) | 20 | 20/20 | **26/26** (+6 new) | `migration/node-test-final.txt` |
| `flutter test --no-pub` | 65 | 65/65 | **91/91** (+26 new) | `migration/flutter-test-final.txt` |
| Dart analyzer | 0 E / 85 W / 814 I | 0 / 85 / 814 | **0 / 85 / 814** | `migration/dart-analysis-final.txt` |
| Admin production build | pass | — | **pass** (compiled, no warnings) | `migration/admin-build-final.txt` |
| Flutter web production build | pass | — | **pass**; bundle contains 0 local/emulator hosts, targets `https://api.youpeak.app/` | `migration/flutter-web-build-final.txt` |

All historical counts were reproduced on E: before any change; no historical test was missing or unreproducible. One emulator run executed **concurrently with a Flutter build and two browsers** failed 2 Peak Boost concurrency tests (PB-05, PB-06) with backend `GCP_TIMEOUT` (8 s) on contended emulator transactions — those boosts failed closed (nothing charged). The clean rerun passed 101/101. Both logs are kept (`emulator-test-final-under-load.txt`). No test was modified to pass.

### 2.2 Isolation of tests and local runs
- Emulator suite: fails closed unless both emulators and a `demo-*` project are set; blanks all `.env` keys; uses a throwaway key (unchanged, verified).
- Local stack (`node local-dev/start.js`): Firestore + **Auth** emulators, project `demo-youpeak-local`, throwaway service account, blank Cloudflare/email credentials.
- Browser checks ran with a request policy allowing only loopback services plus Flutter's static assets (CanvasKit, Firebase JS SDK, Google Fonts); every other request was aborted and logged (see §4.4).

### 2.3 Production-credential fallback closed
Plain `npm start` / `npm run dev` (`functions/backend/server.js`) loaded `serviceAccountKey.json` for the **live** project `youpeak-9ff65`. New `functions/backend/util/localServerGuard.js` (called from `server.js` only — production runs `api/index.js` on Vercel and is unaffected) refuses to start unless: emulator + `demo-*` project, or `NODE_ENV=production`, or an explicit `ALLOW_LIVE_FIREBASE=true`. Verified: plain start exits with code 1 before any Firebase/network activity; the local stack starts normally. 6 unit tests.

---

## 3. Root causes and fixes

### 3.1 Screenshot 1 — yellow underlines (onboarding)
- **Cause:** the desktop brand panel (`_DesktopBrandPanel`, `core/platform/app_layout.dart`) is drawn *beside* the page's Scaffold with **no `Material` ancestor**, so its `Text` inherited `MaterialApp`'s fallback style (monospace, yellow double underline). Same in debug and release.
- **Fix:** wrap the panel in a transparent `Material`; set the brand texts to Urbanist (the app's font). No global style changes; real links and focus indicators untouched.
- **Verified:** release and debug builds after full reload — `screenshots/compare/compare-01-onboarding.png`.

### 3.2 Screenshots 2–7 — narrow column / lost navigation (shared cause)
- **Cause:** (a) the Library and Bites tabs were explicitly wrapped in a 600 px `AppPageFrame`; (b) Search, Notifications, Tasker and Profile were opened with `Get.to`, i.e. as full-window routes — they lost the sidebar and `AdaptivePageTransition` squeezed them into the 600 px phone column.
- **Fix (shared):** "shell routes" — on windows ≥ 900 px, registered pages render **beside the same sidebar** (`AppLayout.registerShellRoute`, `ShellPageContent`, `buildDesktopShell`); the sidebar stays put while content cross-fades; the active item is highlighted; sidebar links replace (not stack) shell pages; tab taps return to the main screen; the Create button works from any shell page. Page state survives resizing across the breakpoint (route-keyed subtree). Phone/tablet (< 900 px) behaviour is unchanged.
- **Page widths:** Search 1200, Notifications 760, Profile 1120, Tasker 1180; nearby phone-layout pages reached from them (History, Watch Later, Your Videos, Playlists, Create Playlist, Downloads, Edit Profile, Earn Rewards, Tasker Tiers) keep the sidebar at the phone column width.
- **Per page:**
  - **Library:** history card grid (16:9 thumbnails, up to 8, "View All") beside a library/playlists panel; proper empty state ("Videos you watch will appear here."). Tablet: "View All" now aligns right.
  - **Search:** search bar at a readable width; results as a responsive card grid with the Bites shelf after the first row; channel and history lists at reading width. Phone layout unchanged.
  - **Notifications:** readable 760 px list in the shell.
  - **Profile:** account overview + plan cards (left) beside the menu panel (right).
  - **Tasker:** two-column dashboard (earnings summary | daily limits & actions); single column order unchanged below 900 px.

### 3.3 Screenshot 3 — Bites desktop experience
- 9:16 player **sized from the available height** (24 px padding, width capped at 560), centered beside the sidebar on the page background — no white strip on black.
- **Deliberate fit:** portrait sources (≤ 4:5) fill the frame (cover); square/landscape sources are **letterboxed (contain)** instead of being cropped to a sliver (`bitesVideoFit`).
- Like / dislike / comment / share / more in a column **beside** the player; creator, Subscribe, caption and hashtags over a gradient at the bottom of the frame; play/pause and **sound** buttons on the frame (mute persists across Bites).
- One active video: verified exactly one `<video>` playing, neighbours paused.
- Navigation: wheel, **trackpad**, ArrowUp/Down, PageUp/Down. Two real defects found and fixed:
  - *Arrow keys were dead* after opening Bites from the sidebar (focus stayed on the sidebar tile) → `PageKeyTurner` now claims focus on appear and on click.
  - *Trackpad swipes never turned a page* (or bounced back): during a page animation Flutter ignores pointers inside the pages, so the rest of the swipe hit the `PageView` itself, cancelled the turn and snapped back → `TurnAwareScrollPhysics` refuses user offsets only while a turn animates. The gesture gate now uses input-event timestamps (350 ms gap = new gesture, ≥ 600 ms between turns), so one swipe = one Bite. Verified in release with a 90-event synthetic swipe in both directions, plus unit tests.
- Comments open as a centered 640 px sheet (Material 3) with the video paused; phone sheet unchanged.
- **"shortsNotAvailable" raw key:** `DataNotFoundUi` now translates its title (fixes 5 call sites), English text "No Bites yet." / "No videos yet.".
- Tablet (768): phone player now fills the width (was 600 px with an empty strip).
- Playback was verified with **local test fixtures only** (§4.3) — this verifies UI/player behaviour, **not** Cloudflare storage or delivery.

### 3.4 Loading / empty / error states (screenshots 5 and 7)
Reproduced and verified by forcing slow, empty, failed and 401 responses *inside the test browser only* (backend untouched): `screenshots/states/`.

### 3.6 Notifications — endless skeleton (screenshot 5)
- **Causes:** `Database.loginUserId!` was evaluated **outside** the `try` — with no login id (exactly the state produced by §3.9) it threw, `mainNotifications` stayed `null`, and the skeleton showed forever; `http.get` had no timeout; every error (incl. 401) was shown as "no notifications".
- **Fix:** request built inside `try`, 15 s timeout, failure kind recorded; page shows "Please sign in again" + Sign in (missing/expired session), "Couldn't load your notifications…" + Retry (network/server), or "No notifications yet." (genuinely empty).

### 3.7 Tasker — endless spinner (screenshot 7)
- **Cause:** Riverpod 3 retries a failing provider by default — up to 10 times with 0.2–6.4 s back-off (~40 s; minutes when requests time out) — and keeps it in the *loading* state meanwhile, so failures looked like an infinite spinner. Also retried auth errors. The token step (`getIdToken`) had no timeout.
- **Fix:** `taskerDashboardProvider` no longer auto-retries; the existing error UI ("Couldn't reach YouPeak…" + Try again, or "Sign in" for auth errors) appears immediately; no balance is shown on failure. `AppApiClient` bounds the token step with the request timeout. Tests confirm one failed fetch = one attempt (and fail without the fix).

### 3.8 Bites load failure
Request now times out (15 s) and a failure shows "Couldn't load Bites…" + Retry instead of "No Bites yet."; Retry recovers.

### 3.9 Phase 2 regression — fresh sign-in failed (found during verification)
After a successful email sign-in and Firebase custom-token exchange, the follow-up `client/user/profile` and referral calls were sent **without a token** (401): `AppSession.idToken()` requires `Database.loginUserId`, which only the profile call itself set. Fresh sign-ins (email, Google, phone) were stranded on the login page. **Fix:** `AppSession.establish` records the verified uid as `loginUserId` once the custom-token sign-in succeeds (onboarding/fill-profile routing is unaffected — it is keyed on `isNewUser`). Verified end-to-end in release.

### 3.10 Sign-in crash on phone builds for users without an age (found during verification)
The backend stores `age: ""` for users who never entered one; `SignUpModel` (and two reward models) cast it to `int?`. Flutter **web release** omits that check, but **debug and Android/iOS release builds throw** a `TypeError` inside `SignUpApi`, so such users get "Something went wrong" and cannot sign in. **Fix:** lenient parsing (same as `GetProfileModel` already did). Test reproduces the exact `TypeError` without the fix.

### 3.11 Screenshot 8 — admin "Network Error"
- **Diagnosis (reproduced, `screenshots/admin/admin-00-before-3000-network-error.png`):** the admin on :3000 was started with plain `npm start` and no `REACT_APP_BASE_URL`, so it calls `http://localhost:5001/admin/admin/login`. **No backend was running** — the CORS preflight failed with `ERR_CONNECTION_REFUSED`, and axios' bare "Network Error" was shown. Not a credential problem; no request ever reached a server. (Starting the old backend on 5001 with `npm run dev` would have used the **live** Firebase project — now blocked, §2.3.) CORS, route prefix (`admin/admin/login`) and JSON parsing were checked and are correct against a running backend.
- **Fix:** `describeApiError` names the unreachable API (and on localhost, how to start the isolated stack); used by admin sign-in. Run the admin through `node local-dev/start.js` (admin :3055 → API :5055).
- Password compatibility (unchanged, reviewed): bcrypt, with legacy cryptr (keyed by the backend `secretKey`) and plaintext rows upgraded on successful login; JWT signed with `JWT_SECRET`.

---

## 4. Visual and regression evidence

### 4.1 Before/after screenshots — `reports/project-audit/migration/screenshots/`
- `compare/compare-0X-*.png` — one sheet per screen: before vs after at 1920, 1366, 768 and 390.
- `before/`, `after/` — full-resolution images (`01-onboarding` … `07-tasker`, `-1920/-1366/-768/-390`), plus `after/04-search-results-*.png`.
- Captured at 100% zoom (DPR 1); 1366/768/390 were reached by **resizing the live window** from 1920 (also covers resize behaviour). Text scaling: the app forces `TextScaler.linear(0.8)` globally (pre-existing, unchanged; see §9).
- **Before-capture note:** the original build could not complete a fresh sign-in (§3.9). To show its logged-in layouts, the before-run simulated an existing user (same Firebase session + `loginUserId`/`isNewUser` in local storage). The after-run signed in through the real UI with no simulation.

### 4.2 Interaction / state checks (final bundle) — `screenshots/states/states.json`, **23/23 pass**
Fresh email sign-in; one Bite playing; ArrowDown/ArrowUp step one Bite; wheel notch = one Bite; long trackpad swipe forward/back = exactly one Bite; mute + carry-over; pause/play; landscape letterbox; comments open; slow load leaves loading; localized empty Bites; Bites error + Retry recovery; Notifications empty / error + Retry / 401 + Sign in; Tasker live data / error + Try again with no balance; Library panel.

### 4.3 Test fixtures (clearly test-only)
`local-dev/fixtures/` — three locally generated clips + posters, each visibly stamped **"LOCAL TEST FIXTURE"** (two 9:16, one 16:9), served from `127.0.0.1:5056` and seeded as `storageProvider: "local-test-fixture"`, `isTestFixture: true` in the **emulator only**. The demo seed previously pointed at public sample clips labelled `r2`/`stream`; locally these are now replaced by the fixtures. No production or external records were created.

### 4.4 Network isolation during browser checks
Blocked (logged, investigated, not app failures): `accounts.google.com/gsi/client` (Google Sign-In script, only for "Continue with Google"), `images.unsplash.com` (demo avatar images in seed data → placeholders), and one `OPTIONS identitytoolkit.googleapis.com/v1/accounts:lookup` — see §9.3. Admin checks additionally allowed public CDN assets the admin `index.html` loads (Bootstrap, jQuery, Font Awesome). Other failed requests were normal cancellations on reload/navigation. No console errors other than the blocked requests.

### 4.5 Debug-mode check — `screenshots/debug/debug-check.json`
Debug build (assertions on) on the isolated stack: Library, Bites, Search, Notifications, Profile, Tasker, Home, Subscription each opened from the sidebar and resized 1920 → 1366 → 768 → 390: **0 RenderFlex overflows, 0 framework exceptions**.

### 4.6 New automated tests
Backend: `tests/localServerGuard.test.cjs` (6). Flutter: `test/core/local_emulators_test.dart` (4), `test/core/desktop_shell_layout_test.dart` (4), `test/core/app_api_client_test.dart` (+2), `test/features/bites_desktop_test.dart` (12), `test/features/tasker_dashboard_state_test.dart` (2), `test/features/sign_up_model_test.dart` (2). Admin: `src/util/apiError.test.js` (4, Jest — passes; not part of the root `npm test`).

---

## 5. Local admin login verification
Isolated stack, local test accounts only (`screenshots/admin/admin-verify.json`, `migration/admin-api-authz.txt`):

| Check | Result |
|---|---|
| Invalid password → "Invalid email or password.", stays on login | ✅ |
| Valid local super-admin → dashboard (`/admin/mainDashboard`) | ✅ |
| Session survives refresh | ✅ |
| Sign-out (with confirmation) clears session | ✅ |
| Dashboard URL without session → `/login` | ✅ |
| Sign in again in the same tab after sign-out | ✅ |
| Backend unavailable (:3000 → :5001) → names the unreachable API | ✅ |
| Admin API with no / garbage / app-user token → 401 | ✅ |
| District admin on super-admin endpoint → 403; own portal → 200 | ✅ |

**Not verified: the real administrator account** — by design (no production access). See §9.1 for what the owner needs to check.

---

## 6. Development-only switches
`AUTH_EMULATOR` / `FIRESTORE_EMULATOR` dart-defines (`youpeak/lib/core/config/local_emulators.dart`) are honoured only when the emulator host **and** `API_BASE_URL` are loopback; production builds never set them, and the production bundle was checked to contain no local hosts. 4 unit tests.

---

## 7. Files changed by this task
**Reconciliation (C: → E:):** 23 recovered + 17 merged — listed in `migration/reconciliation-applied.txt`.

**Backend:** `functions/backend/server.js`, `functions/backend/util/localServerGuard.js` (new), `tests/localServerGuard.test.cjs` (new).

**Admin:** `admin/frontend/src/util/apiError.js` (new), `src/util/apiError.test.js` (new), `src/Component/store/admin/admin.action.js`.

**Local stack:** `local-dev/start.js`, `seed.js`, `config.js`, `firebase.json`, `README.md`, `fixtures/*` (6 new files).

**Flutter app (`youpeak/lib/`):** `main.dart`; `core/config/local_emulators.dart` (new); `core/platform/app_layout.dart`, `wheel_page_turner.dart`; `core/network/app_session.dart`, `app_api_client.dart`; `core/constants/app_string.dart`; `core/localization/languages/language_en.dart`; `shared/widgets/data_not_found_ui.dart`, `adaptive_video_list.dart` (new); `features/main/view/main_home_view.dart`, `wide_side_nav.dart`; `features/library/view/nav_library_page.dart`; `features/search/view/search_view.dart`; `features/notifications/{api/notification_api.dart, controller/notification_controller.dart, view/notification_view.dart}`; `features/profile/view/profile_view.dart`; `features/tasker/presentation/{tasker_dashboard_provider.dart, tasker_dashboard_view.dart}`; `features/bites/{api/get_shorts_video_api.dart, controller/nav_shorts_controller.dart, view/nav_shorts_view.dart, view/nav_shorts_details_view.dart, view/preview_shorts_view.dart, view/bites_desktop.dart (new)}`; `features/auth/model/sign_up_model.dart`; `features/monetization/model/video_engagement_reward_model.dart`; `features/rewards/model/earn_coin_from_watch_ad_model.dart`.

**Flutter tests:** listed in §4.6.

**Reports/evidence:** `reports/project-audit/migration/**`, this report.

Not changed by this task (changed externally): `DEPLOYMENT.md`, `youpeak/web/vercel.json`. Not committed — all changes are in the working tree.

---

## 8. Local startup and verified URLs
```
cd "E:\Legendary One\youpeak\source"
node local-dev/start.js --reset          # emulators + seed + backend + admin
```
| Service | URL | Verified |
|---|---|---|
| Admin panel (isolated) | http://localhost:3055/login | ✅ sign-in flows |
| Backend API (emulator, `demo-youpeak-local`) | http://localhost:5055/health | ✅ |
| Emulator UI | http://127.0.0.1:4005/ | ✅ |
| Test-fixture media | http://127.0.0.1:5056/ | ✅ range requests |
| Flutter web app (release build served locally) | built with the dart-defines in `local-dev/README.md` | ✅ all checks |

Logins (local only, password `Test@1234`): `superadmin@youpeak.test`, `district@youpeak.test`, `partner@youpeak.test` (admin); `viewer@youpeak.test` (app, "Sign in with password"). Flutter web dev run: see `local-dev/README.md`.

The standalone admin on **:3000** (plain `npm start`) still targets `http://localhost:5001/`, where nothing should run locally; it now shows a message pointing to the isolated stack instead of "Network Error".

---

## 9. Remaining external blockers and limitations
1. **Real admin account (owner action):** the production login was not exercised. If production admin sign-in also fails, check in the Vercel admin deployment: (a) the admin is served from the same origin as the API or `REACT_APP_BASE_URL` points at the API with HTTPS; (b) `REACT_APP_SECRET_KEY` equals the backend `secretKey`; (c) backend `JWT_SECRET` is set; (d) the admin's email in the `admins` collection is stored **lower-case** (lookup is exact on the lower-cased input); (e) legacy (cryptr) admin passwords only verify with the production `secretKey`. Do not reset the account automatically; an owner-performed reset via the existing `SEED_ADMIN_*` bootstrap or password-reset flow is the safe route if needed.
2. **Cloudflare delivery not exercised:** Bites playback was verified with local fixtures only. Stream/R2 delivery, HLS on desktop browsers, and signed/private delivery remain to be tested against a staging Cloudflare account.
3. **Dev-only external request:** when a saved session is restored, FlutterFire initialises Firebase Auth inside `Firebase.initializeApp`, before the app can switch to the emulator, so one `accounts:lookup` goes to Google's real Identity Toolkit (blocked in tests; carries only an emulator token; no data). Production is unaffected. A fully offline local web run would need a separate demo Firebase web config.
4. **Tablet (768 px):** pushed pages keep the original 600 px phone column (the desktop shell starts at the existing 900 px breakpoint) — unchanged by design; tab pages use the full width.
5. **Text scaling:** the app forces `TextScaler.linear(0.8)` for all users (pre-existing; ignores browser/OS text size). Not changed — a product decision.
6. **Comments on desktop** open as a centered sheet, not an Instagram-style side panel (optional follow-up).
7. **Login screen semantics:** in browsers with accessibility semantics active, Flutter's semantic text fields could not receive focus in headless Chrome (sign-in was driven with semantics off). Worth a manual screen-reader check.
8. **Carried from Phase 2 (unchanged here):** unresolved business-policy items in `reports/project-audit/phase2/REMEDIATION_QUEUE.md`; no deployment, credential rotation, real payments or notifications were performed.
9. **C: copy:** no longer present (§1.6); the E: backup and evidence are intact.
