# YouPeak — Web Task Earning + Responsive Layout: Report

| | |
|---|---|
| Workspace | `E:\Legendary One\youpeak\source`, branch `fix/deploy-readiness`, HEAD `894b2f4e` (nothing committed, pushed or deployed) |
| Dates | 2026-10-05 → 2026-10-06 |
| Evidence | `reports/project-audit/web-tasking/` (screenshots, test logs, harness, route inventory) |
| Baseline | `web-tasking/git-status-before.txt`: all earlier uncommitted work was preserved |
| Production | Untouched. All writes went to the isolated emulators (`demo-youpeak-local`, `demo-youpeak-audit`) with test accounts |

## 1. Summary

**Web earning now works and is decided by the server.** A signed-in browser attests as `platform: "web"` with no device claims. The server unlocks it unless:
- an admin has switched web earning off, or
- the request comes from a datacenter/VPN network.

Every reward request is still checked on the server against that state, the daily caps, pacing and per-video dedupe. These are the same account-level limits as the app.

What earns on the web:
- check-in
- likes
- comments
- watch time

**Rewarded ads stay app-only.** Two facts rule them out in a browser:
- AdMob has no web SDK.
- Google's web rewarded ads cannot be verified server-side.

So browser ad claims are refused, and the page says so honestly.

**Layout:**
- **Every page a signed-in person opens on a desktop window now keeps the sidebar.** That includes the "Tasks paused" page from the screenshot. Pages are shown at a width chosen per page.
- **The lock page explains each reason and doesn't loop.** It never offers "Check again" when re-checking can't help, and it unlocks by itself when the cause clears.

**Fixed along the way:** several real earning bugs found while tracing the flow (§4.3).

**Still blocked or not yet verified:**
- Live earning needs an authorized admin setting change plus a backend and web deploy (§9).
- Ads on the web need a product/provider decision (§5).

## 2. Root causes of the reported screens

| Screen | Cause |
|---|---|
| Tasker dashboard: *"Tasks and rewards are available in the YouPeak mobile app only."* | Three layers kept the browser locked. (1) The client added a local `WEB_PLATFORM` lock whenever `app_policy.security.allowWebTasking` was false, and its default was false. (2) The backend default `setting.js allowWebTasking` was false, and the admin form stores that value in the Firestore `settings` doc. (3) The server returned `WEB_PLATFORM` for any web attestation. Flipping the flag alone would also have let the browser record a fabricated `isPhysicalDevice: true` device-integrity claim, and would have left the ad-claim and legacy endpoints open to farming (§4.3). |
| "Tasks paused" in a ~600px column with no sidebar | `Get.to(() => TaskLockGate(...))` creates the route `/TaskLockGate`. Only 13 routes were registered for the desktop shell, so every other page, including this one, fell back to `AppPageFrame`: a lone 600px column on a grey backdrop. |
| Endless "Check again" | `recheck()` returned immediately (with no feedback) if a check was running. The button was shown for every reason, including ones a re-check can't change (admin switch, device bound to another account, bot cooldown). The dashboard banner also used the dashboard's own lock snapshot. That snapshot was loaded before the session's attestation finished and was never refreshed, so it could stay red after the server had already cleared the session. |

Reproduced locally before any fix: `web-tasking/screenshots/before/11-earn-1920.png` (pre-task build, `allowWebTasking` stored false, as in production).

## 3. Route inventory

All 73 page classes pushed with `Get.to/off/offAll` are listed in `web-tasking/route-inventory.md` (generated from the source by `harness/route-inventory.cjs`), with:
- where each page is opened from
- its desktop placement
- its task-gate status

How the web layout now places a route (`AppLayout.shellWidthFor`, `lib/core/platform/app_layout.dart`):

| Placement on a ≥900px window | Routes |
|---|---|
| Own desktop layout (wide route) | MainHomePageView (all tabs: Home, Bites, Subscription, Library), NormalVideoDetailsView |
| Branded split (sign-in / onboarding) | OnBoardIngScreen, LetsYouInView, LoginView, PhoneLoginView, SignUpView, SignUpOtpView, ForgotPasswordView, ForgotPasswordOtpView, CreateNewPasswordView, FillProfileView, ActivationLockView |
| Full window | SplashScreenView (`/`), ShortsVideoDetailsView (Bites vertical player), PreviewShortsView, CreateShortView, GoLiveView, LivePage |
| Shell + sidebar, page width | SearchView 1200 · TaskerDashboardView 1180 · ProfileView 1120 · History, Watch Later, Your Videos, Downloads, Playlists, Playlist preview, Subscribed channels, Channel 960 · NotificationPageView, SettingsView, HelpCenterView 760 |
| Shell + sidebar, 600px readable column (default) | Every other page: wallet, withdraw, withdrawal history, coin history, convert/buy coins, passes, Earn Rewards and **TaskLockGate**, edit profile, upload and its sub-pages, create channel, referral, monetization and so on |

**Below 900px:** phone layout, full width under 600px and a centered 600px column from 600–900px.

**Signed-out visitors:** they never get the sidebar on pages reached before sign-in (`AppLayout.shellAvailable`).

**Task gate:** Earn Rewards is behind `TaskLockGate` from all three entry points (Tasker dashboard, Peak Boost "get coins", and **Profile**; Profile was ungated before this change).

**Dialogs and bottom sheets** use their own routes and are not placed in the shell.

## 4. Web earning

### 4.1 Trace

```
browser sign-in (Firebase Auth)
  → POST client/security/attest  {platform:"web", appVersion}   (requireAppUser; no device fields)
      server stores {platform:"web", deviceId:"", deviceIntegrity:"unavailable-in-browser", datacenterIp}
      reasons = WEB_PLATFORM if allowWebTasking off, DATACENTER_IP if blockTasksOnVpn and IP is a datacenter/VPN
  → reward request (check-in / like / comment / heartbeat), Firebase ID token required (bindAppUser/requireAppUser)
      rewardEngine.creditReward: blocked user → activation gate → taskLockState (same reasons, re-evaluated
      against current settings) → pacing → per-video dedupe id → Firestore transaction (daily count + coin cap,
      IST day reset) → history row
  → app refreshes coins / dashboard; Tasker dashboard re-loads when the lock state changes
```

### 4.2 What earns from the browser

| Action | Web | Server enforcement | Verified |
|---|---|---|---|
| Daily check-in | ✅ | Once per IST day; 8 parallel tabs → one credit; the server picks the amount | Emulator WEB-05; browser (300 coins, then 330 on the next IST day; a second tap pays nothing) |
| Like | ✅ | Once per video (parallel double-click → one credit); unlike reverses; `dailyMaxLikes` shared with the app | WEB-06, WEB-12 |
| Comment | ✅ | First comment per video only; shared daily cap | WEB-07 |
| Watch time | ✅ | Wall-clock bound per user (also across 3 tabs). Muted, background and >2x playback earn 0. **New:** credit can't exceed how far the playback position moved forward | WEB-08, WEB-15; browser: 42 s credited for 65 s playing, 0 with the tab hidden, 0 while paused |
| Rewarded ads | ❌ app only | Browser requests refused (`AD_REWARD_APP_ONLY`) on both ad endpoints, before anything is credited | WEB-09 (also a native claim still works: WEB-10); browser shows "App only" |
| Lifetime hours / level-ups / 2-hour bonus | ✅ | Same ledger as the app (`watchLedger.service.js`) | Existing suites 07-rewards |
| Withdrawals and passes | Unchanged | Same server rules as the app (thresholds, monthly cap, pending check); pass purchase goes to the membership portal (store-billing rules) | Existing suites; wallet page checked in the browser |

### 4.3 Bugs found and fixed while tracing

1. **Check-in reported success without paying.** A locked or activation-gated account got "Check-in successful" and a recorded check-in with 0 coins. It now returns the real refusal (`code`, message). Hitting the daily coin cap still counts the streak and says so. The app now shows the credited amount instead of the list price.
2. **Legacy like/comment reward endpoints paid on request alone** (no proof, no per-video dedupe), so they could be farmed up to the cap. They now pay only for a real like or comment, under the same dedupe key as the main path.
3. **Browser ad claims were accepted** by `handleAdWatchReward` and `userTaskReward/adWatch` from any browser, with no ad shown. They are now refused.
4. **Mobile ad reward fired on dismiss**, even when the ad was skipped before `onUserEarnedReward`. It is now claimed only after the SDK's earned-reward callback.
5. **Frozen playback was paid.** If the media element was paused outside the app's controller (browser media controls, media keys), the player still said "playing" and the position stood still. Each 10-second beat was credited. This was found by the browser test, which saw 36 s credited while paused. Fixed in both places:
   - The client accumulator rejects a non-advancing position.
   - The server bounds a beat by how far the reported position moved forward.
   - Loop restarts and seek-backs are still bounded by the wall clock, so looping Bites are not under-paid.
6. **Heartbeats stayed off for the rest of a video after one `SECURITY_LOCK`**, even after the lock cleared. They now resume.
7. **"Earn More" card clipped its third row** (Starter Pass) because of a fixed height, at every width. The white title over the header art was also illegible.
8. **Channel Details crashed to a grey screen** whenever the channel response lacked `totalVideosOfChannel` (e.g. a `status:false` reply; `!` null-assert). Found by the debug-mode pass; now null-safe.

### 4.4 Lock page and dashboard (`task_lock_gate.dart`, `security_signals.dart`, `security_service.dart`)

- **Reasons:** each reason has its message plus what the person can do.
- **"Check again":**
  - Shown only for reasons a re-check can clear (verification pending, VPN/proxy, datacenter network).
  - While a check runs it shows "Checking…"; if still locked it shows "Still paused · retry in 15s".
  - A press while a check is running joins that check instead of being dropped.
- **Other reasons:** they get "Go back". The bot cooldown shows "Earning resumes at 2:35 PM."
- **Automatic re-checks:**
  - While locked, the service re-checks with the server every minute, so the page unlocks by itself. Browser test: unlocked 45 s after the admin switch was turned back on, with no tap.
  - Window focus in a browser no longer triggers a server attestation unless one is due or the session is locked.
- **Dashboard:** it uses the session's own server-verified state over its load-time snapshot, refreshes when the lock changes, and labels the ad row "In the mobile app". Its link reads "Check in & daily tasks" on the web.

## 5. Rewarded ads in the browser: provider facts and the decision needed

- **Flutter plugin:** `google_mobile_ads` supports Android and iOS only ([pub.dev](https://pub.dev/packages/google_mobile_ads)).
- **Google Ad Manager web rewarded ads (GPT)** exist. In Google's own words: *"Server-side verification is an app only feature and it is unavailable for web use"*, and the publisher must deliver the reward from front-end code on the `rewardedSlotGranted` event ([Ad Manager help 9116812](https://support.google.com/admanager/answer/9116812)). Any browser ad reward would therefore rest on a client callback, which this task's rules forbid. Using it would also need an Ad Manager account, inventory approval and a product decision.
- **AdMob server-side verification (SSV)** exists for the apps ([AdMob SSV](https://developers.google.com/admob/flutter/ssv)) but is **not set up**. Native ad claims are therefore still client-reported (now gated on `onUserEarnedReward`). Recommended next step, mobile: configure an SSV callback URL on the rewarded ad unit and credit ads only from the verified callback.

**Status:** configuration/product-blocked. The web shows ads as app-only; every other task keeps earning.

## 6. Production settings that need an authorized change

1. **Firestore `settings` doc: `allowWebTasking`.** The new code default (`true`) applies only when the stored settings doc lacks the field. The admin form saves every field, so production most likely has `allowWebTasking: false` stored. After the backend deploy, an authorized admin sets: Admin → Platform Config → *Anti-Fraud & Task Security* → **"Allow tasking from the web app" = on** → Save. Saving republishes `system_configs/app_policy`, and so does every backend cold start.
2. **Backend (Vercel API project):** redeploy the working-tree `functions/backend`. The live API is the 2026-09-28 commit `894b2f4e`; none of §4 is live until then.
3. **Consumer web (Vercel `youpeak-web`):** rebuild with `scripts/build-consumer-web.ps1` (needs `YOUPEAK_API_SECRET_KEY` = the backend client key in your shell; see §8) and deploy `youpeak/build/web`.
4. **Client IP behind proxies:** the datacenter check reads the first `X-Forwarded-For` entry. That is correct for a direct Vercel deployment, because the browser calls `api.youpeak.app` directly. If `api.youpeak.app` is proxied by Cloudflare (orange cloud), confirm after deploy that a normal home connection is **not** reported as `DATACENTER_IP`. If it is, the IP should be read from `CF-Connecting-IP`. This is a small code change; I didn't make it without knowing the topology.
5. **Firebase:** no change needed for this task (Authorized Domains were already fixed for Google sign-in).
6. **Data check: ad-reward collection name.** The model `AdReward` reads the Firestore collection literally named `AdReward`, while imported and seeded data lives in `adrewards` (there's no alias for `adreward` in `firestoreDb.service.js`). Check which collection production's ad tasks are in before adding an alias, or ad tasks could disappear. Locally I added three test-only fixture documents to `AdReward`.

## 7. Tests and builds

| Check | Result | Log |
|---|---|---|
| Backend emulator suite (all 10 suites, 116 checks) | 116/116 earlier in this task. Final run after the last ledger change: 115/116; the 1 failure was PB-06 (Peak Boost, untouched) hitting an emulator `GCP_TIMEOUT` under concurrent load. Peak Boost rerun alone: 9/9. Web suite after the last change: 15/15 | `web-tasking/emulator-test-final.txt`, `emulator-peakboost-rerun.txt` |
| New web suite `tests/emulator/suites/10-web-tasking.cjs` | 15 checks (WEB-01…15) | same |
| Backend unit tests (`npm test`) | 28/28 | `web-tasking/node-test.txt` |
| Flutter tests | 107/107 | `web-tasking/flutter-test.txt` |
| Flutter analyzer | 0 errors; 84 warnings / 898 issues (baseline 85 / 899, so no new ones) | `web-tasking/flutter-analyze.txt` |
| Local release web build (local API + emulators) | builds | scratchpad only |
| Consumer build `scripts/build-consumer-web.ps1` (unchanged) | Builds and writes `build/web/vercel.json` with the production rewrites. Bundle points at `https://api.youpeak.app/`, with 0 loopback/emulator references and no key material. Validated with a placeholder client key because the real `YOUPEAK_API_SECRET_KEY` isn't available here. **Not deployable.** The previous `build/web` (rebuilt by someone else on Oct 5 18:21, with its `.vercel` link) was backed up first and restored byte-for-byte; the validation output was deleted | — |

New and updated client tests:
- lock view: retry states, no-retry reasons, bot time, short-window overflow
- dashboard: stale snapshot vs server-verified, web-off without "Check again"
- web attestation body carries no device claims
- shell placement rules
- stalled-position rejection

## 8. Browser verification (local, isolated)

Harness: `web-tasking/harness/` (headless Chrome).
- Network: loopback services and Flutter's static assets only. Every other request is blocked and logged (Google's GSI script, demo avatar images, and one known dev-only `accounts:lookup`, explained in the migration report §9.3).
- Layout: four widths (1920, 1366, 768, 390); the harness also checks for horizontal page scroll.

| Run | What it shows | Folder |
|---|---|---|
| before | Pre-task build with web earning stored off: the reported 600px "Tasks paused" page and the mobile-only dashboard banner | `screenshots/before` |
| after | Web earning on: dashboard (no banner, ads "In the mobile app"), Earn Rewards in the shell, check-in credited once, 17 routes with the sidebar and no horizontal overflow at any width | `screenshots/after` |
| after-ads | Earn Rewards with ad tasks present: each shows "App only", with no Play button | `screenshots/after-ads` |
| after-weboff | Web earning off: dashboard explains it without "Check again"; lock page inside the shell with "Go back" | `screenshots/after-weboff` |
| watch | Watch time: playing earns (bounded by wall clock), hidden tab 0, paused 0; lock page unlocks by itself | `screenshots/watch` |
| debug | Debug build (assertions on, `flutter run -d web-server`), 18 routes × 4 widths: **no overflow reports**. Exceptions appeared only on Channel Details (fixed, §4.3 #8), plus 2 trailing reports logged as the harness left that page. This ran on the code before the last two one-line edits (Channel null-safety, Profile → TaskLockGate). Later debug-server restarts never started the app (the web-server debug handshake hung), so those two edits were verified in the release pass below instead | `screenshots/debug` |
| final | Final release build: 18 routes × 4 widths all reached; desktop sidebar on every route at 1920/1366 (6 of them had none before); no horizontal overflow; Channel Details renders (was a grey crash); no exception reports | `screenshots/final`, matrix in `web-tasking/route-coverage-matrix.md` |
| Google cycle (Auth emulator test provider, no real Google account) | 8/8: a double tap opens one window; closing the window returns cleanly; a new account is created and verified by the backend → Fill Profile; the session survives a refresh; logout → sign-in screen; a returning user goes straight to Home with no duplicate account | `screenshots/google` |

## 9. Verification status

| Verified locally (emulators, test accounts) | Verified against real providers | Configuration-blocked | Not yet verified |
|---|---|---|---|
| Web eligibility, every web earning action, refusals, duplicates/tabs, shared caps, IST reset (suites), watch rules, ad refusal, lock page, layouts at 4 widths, debug overflow pass, Google sign-in/cancel/refresh/logout cycle, consumer build script (placeholder key) | Ad provider facts (official docs, §5) | Live web earning: needs the admin setting + backend and web deploy (§6). Web rewarded ads: product/provider decision (§5). Mobile ad verification: AdMob SSV setup | Production behaviour after deploy (to verify per §10). Real-device mobile flows (no device here). The datacenter check behind the production proxy (§6.4). Midnight IST reset in a real browser across midnight: covered only by the emulator checks RW-02 (first requests after midnight with yesterday's counters) and RW-06 (lifetime minutes survive the reset) |

Local emulator results are not proof of production earning.

**Observations during testing:**
- The app's sidebar logo changed from the green "YouPeak" mark to a blue "Youpeak" mark between runs (compare `screenshots/after` and `screenshots/final`). No source or asset file changed, and admin-panel requests to the local backend appeared in its log at the time, so this probably came from a settings change made through a local admin session. This task did not make it.
- `build/web` was rebuilt outside this task on Oct 5 at 18:21.

## 10. Deployment sequence (when authorized)

1. Commit the working tree on `fix/deploy-readiness` (it also carries earlier tasks' uncommitted fixes; review together).
2. Deploy the backend (Vercel API project), then check:
   - `POST /client/security/attest` from a browser returns `taskingAllowed:false, reasons:["WEB_PLATFORM"]` while the setting is still off. That's expected.
   - A browser ad claim returns `AD_REWARD_APP_ONLY`.
3. In Admin → Platform Config → Anti-Fraud & Task Security, turn on **Allow tasking from the web app** and save.
4. Build the consumer web: `$env:YOUPEAK_API_SECRET_KEY = '<backend client key>'; .\scripts\build-consumer-web.ps1`. Deploy `youpeak/build/web` to `youpeak-web`.
5. Smoke test on the live site with a real test account:
   - The dashboard has no lock banner.
   - Check-in credits once.
   - A like credits once.
   - 2 minutes of audible playback adds about 2 minutes.
   - A hidden tab adds nothing.
   - Ads show "App only".
   - The Tasks page has the sidebar.
   - A home connection is not flagged as `DATACENTER_IP`.
6. Mobile apps need no release for the server changes. The ad-reward dismiss fix (§4.3 #4) ships with the next app build.

## 11. Rollback

- **Fastest, no deploy:** set **Allow tasking from the web app** off. The web locks within a minute (shows "switched off" and "Go back"), every web reward request is refused by the server, and the app is unaffected.
- **Web build:** in Vercel, promote the previous `youpeak-web` deployment.
- **Backend:** promote the previous API deployment. This also brings back bugs §4.3 #1–3 and #5–6.
- **Data:** no migrations. The new user fields `watchPosition` and the web attestation shape are ignored by older code.

## 12. Files changed in this task

**Backend:**
- `functions/backend/util/taskSecurity.service.js`
- `setting.js`
- `util/platformConfig.js`
- `util/watchLedger.service.js`
- `controllers/client/user.controller.js`
- `userTaskReward.controller.js`
- `dailyRewardCoin.controller.js`
- `watchSession.controller.js`

**Backend tests:**
- `tests/emulator/suites/10-web-tasking.cjs` (new)
- `tests/emulator/suites/01-phase1.cjs` (FIN-04 now uses real likes)

**App:**
- `youpeak/lib/core/security/{security_service.dart, domain/security_signals.dart, presentation/task_lock_gate.dart}`
- `core/system_config/domain/system_configs.dart`
- `core/ads/google_reward_ad.dart`
- `core/platform/app_layout.dart`
- `main.dart`
- `features/rewards/{controller/earn_reward_controller.dart, model/earn_coin_from_check_in_model.dart, view/earn_reward_view.dart}`
- `features/tasker/presentation/tasker_dashboard_view.dart`
- `features/watch_tracking/{domain/watch_time_accumulator.dart, presentation/watch_heartbeat_tracker.dart}`
- `features/profile/view/profile_view.dart`
- `features/channel/view/your_channel_view.dart`

**App tests:**
- `youpeak/test/core/{security_signals_test.dart, desktop_shell_layout_test.dart}`
- `test/widgets/feature_widgets_test.dart`
- `test/features/watch_time_accumulator_test.dart`

**Evidence:** `reports/project-audit/web-tasking/**`, and this report.

**Security check made while validating the bundle:** `private_key_id` appears in the web bundle only as JSON field names in the client's settings model (`lib/core/settings/admin_settings_model.dart`). No key material is in the bundle. Both the live and the working-tree backend strip all service-account fields from `GET client/setting`. Those dead model fields could be removed in a later cleanup.

No credentials, private keys or tokens appear in code, logs or this report. The exposed Firebase private key from an earlier chat was not used.
