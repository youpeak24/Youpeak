
---

## 6. Feature inventory

Discovered from code (routes, screens, services, jobs, rules). "Tests" lists the repository suites (R-…) and audit suites (A-…) that exercise the feature; "Gaps" lists finding IDs. Platforms: **W** consumer web (www.youpeak.app), **A/I** Android/iOS app, **Adm** admin SPA.

### 6.1 Consumer app (Flutter, GetX + Riverpod)

| Feature | Intended behaviour and source | Screens / APIs / storage | Roles · platforms | Validation | Tests · result | Gaps |
|---|---|---|---|---|---|---|
| Sign-in / sign-up | E-mail+password (bcrypt), phone OTP (Firebase), Google; backend issues a Firebase custom token → ID-token session | features/auth/*; `client/user/login`, `checkUser`, `otp/*`; Firestore users; Firebase Auth | all · W A/I | e-mail/phone checks client+server; OTP 4 digits | R-02 PW-01..10, R-01 SEC-06..10 pass; A-02 AP-01..06 fail | P-01, P-03..P-06, FL-9, FL-14 |
| Feeds, search, subscriptions | Home (all/new/popular/live), Bites, search, subscribed feed | features/home, bites, search, subscriptions; `client/video/*` aggregates | all · W A/I | server pagination | R-02/03 VIS-* pass; A-05/06/07 feed checks fail | CF-01, FEED-1, SEARCH-1, PERF-1, FL-22 |
| Playback and watch tracking | HLS/MP4 player; heartbeat every 10 s with foreground/unmuted/≤2×/no-seek seconds; server credits ≤ wall clock | features/video, watch_tracking; `client/watch/heartbeat` | tasker · W A/I | accumulator + server caps | R-07 RW-03/06, R-10 WEB-08/15 pass; Flutter accumulator tests pass | AF-3, WH-1 (legacy call), FL-10 |
| Upload video / create Bite | Presigned PUT to R2 (or Stream); publish needs an upload grant | features/upload, bites; `client/file/direct-upload-url`, `createVideo` | creator · W A/I | host/grant checks server-side | R-08 MED-01..06 pass | UP-1, FL-19, FL-24, ME-1/2 |
| Channel, playlists | Create channel, channel page, playlists | features/channel, playlist; `client/user/update`, `detailsOfChannel`, `playlist/*` | creator/viewer · W A/I | name uniqueness | A-09 ID-02 passes; ID-01/03, PL-01..03 fail | ID-1, FL-25, CHN-1 |
| Library | Watch history, watch later, downloads, playlists | features/library; `watchHistory`, `saveToWatchLater`, `userWiseDownload` | user | – | A-07: history/download endpoints 500 | CF-01, WH-2 |
| Comments, likes, reports, grievance | Like/dislike/comment earn coins (caps); 5 reports/24 h hold; IT-Rules grievance with 36 h SLA | features/comments, report, settings; `videoComment/*`, `report/*`, `grievance/*` | user | caps server-side | R-01 FIN-*, R-09 REQ-0111/0035 pass; A-06 RW-01, RW-04 fail | RW-1, CF-01, GR-1, FL-23, AFE-17 |
| Live streaming | Go live (Zego), live list, chat/views over Socket.IO | features/live; `liveUser/*`, socket.js | creator · A/I | – | not testable here | LIVE-1..3 |
| Tasker rewards and tiers | Ads (≤ 20/day), daily check-in, 2/2/5-coin actions, 120 min → 500 coins, daily caps by tier incl. +500, lifetime watch-hour or pass upgrades | features/rewards, tasker, tiers; `user/handleAdWatchReward`, `dailyCoinReward/*`, `tasker/dashboard`, `watch/heartbeat` | tasker · A/I (ads), W (non-ad) | caps/pacing/dedupe server-side | R-01 FIN-02..05, R-07 RW-01..07, R-10 WEB-* pass | AF-1, RW-1, CU-4, FL-7, FL-8 |
| Wallet and withdrawal | Coins ↔ ₹ at 100:1; first payout ₹100 then ₹500; tier monthly cap; admin approval | features/wallet, coins, payout; `withdrawalRequest/*`, `payout/request` | tasker/creator/partner | amount/UPI/IFSC validated client+server | R-06 WD-01..09 pass; A-03 MS-03 fails | PAY-4, RW-1, AD-4, FIN-1, RC-C |
| Purchases | Coin plans, premium plans, video promotion via Razorpay createOrder→verify; passes/licence via portal | features/coins, premium, video_promotion; `payment/*` | user · W A/I | server order + signature | R-05 PF-01..12 pass; A-04 PY-01..04 fail | PAY-1, PAY-5, DEP-4, DEP-5, FL-1, SUBS-1 |
| Referral and Digital Partner dashboard | Stage-1/Stage-2 rewards, holds, device dedupe, partner dashboard | features/referral, auth deep links; `user/validateAndApplyReferralCode`, `partner/dashboard` | user/partner | fraud flags | R-01 FRAUD-01..05, R-09 REQ-0040 pass; A-03 MS-06 fails | RF-1..5, PD-1, DL-1, FL-11, FL-20 |
| Peak Boost | Coin tip, 80/20 split, atomic, idempotent | peak_boost; `POST client/peakBoost` | viewer→creator | min/max, requestId | R-04 PB-01..09 pass | – (configurable referrer share beyond spec) |
| Monetisation, creator tiers, funding | Monetisation request/approval, VIP passes, funding campaigns | features/monetization, tiers; `monetizationRequest/*`, `creatorTier/*`, `creatorFunding/*` | creator | admin criteria | not covered by suites | MON-1, MON-2, SUBS-1, CU-3 |
| Settings, languages, help, notifications | 20 languages, FAQ/contact, push, privacy policy | features/settings, help_center, notifications; `translation/*` | all | – | i18n script; analyzer | RC-A, DL-2/2b, i18n gaps (122 missing keys per language, 128 hard-coded literals) |

### 6.2 Admin panel (React SPA, same-origin `/admin/*` API)

| Panel / role | Features (SPA routes) | Source | Tests · result | Gaps |
|---|---|---|---|---|
| Super Admin (33 routes) | Dashboard, users, channels, videos, Bites, sounds, reports, premium & coin plans and histories, withdrawal requests, monetisation requests, ad/daily reward settings, settings, Platform Config (7 pages), membership tiers, fraud, referral mgmt, moderation queue, duplicate screening, video promotions, franchises, digital partners, franchise/partner reports, earnings | Pages/*, Component/store/* | A-07 admin reads 45 pass; sweep 132 views clean | AFE-4..8, AFE-14, AFE-17, SM-2, XSS-1, MON-1 |
| District Franchise (AGENCY_ADMIN; 6 routes) | Dashboard, own partners CRUD/suspend/remove, referrals, reports, profile | Pages/Franchise, Agency, PartnerNetwork | A-08 AZ-01..06 pass; sweep 24 views clean | PN-1..4, XSS-1, AFE-12 |
| Digital Partner (DIGITAL_PARTNER_ADMIN; 7 routes) | Dashboard + referral code/QR/link, referrals, reward history, wallet convert/withdraw, local-business ads, own report | Pages/DigitalPartner, PartnerNetwork | A-08 AZ-02/05/10 pass; sweep 28 views clean | LB-1/2, CP-1, AFE-10/11 |

### 6.3 Backend, jobs, rules and infrastructure

| Area | What exists | Tests · result | Gaps |
|---|---|---|---|
| API | Express app via `api/index.js` (Vercel) and `functions/index.js`; 332 routes; key + Firebase ID token + admin JWT layers | R-01..10, A-01..10 | D-01, D-02, A-01..A-03, CF-01 |
| Scheduled jobs | Vercel cron `/api/cron/daily` (referral release, maintenance); no midnight settlement | AZ-09 (rejects unsigned) | AD-4, AD-5, RF-4 |
| Webhooks | Razorpay `/payment/webhook/:gateway`, Cloudflare Stream `/stream/webhook` | R-05 PF-01..08 pass | DEP-4 |
| Fingerprint worker | FFmpeg/fpcalc/pHash off-Vercel; copyright flagging | static only | MOD-2 (no transcript screening) |
| Rules / config | `firestore.rules`, `storage.rules`, root `vercel.json` (admin+API), `youpeak/web/vercel.json` (consumer) | static read; deployed rules not verifiable | DEP-7 (blocked), DEP-2, DL-1 |
| Seed/import scripts | DB/*.js | not run | SCR-1 |

---

## 7. Cross-panel comparison matrix

How the same business object appears in each surface, and what I verified. **C** consumer app, **A** Super Admin, **P** Digital Partner panel, **F** District Franchise panel.

| Object | C | A | P | F | Verified behaviour | Findings |
|---|---|---|---|---|---|---|
| User id | 13-digit epoch-ms `_id` (guessable); `uniqueId` for display | same ids in lists/exports | `userId` in URLs | `userId` in URLs | franchise/partner calls are scoped by the admin record, not by the id supplied (AZ-03/05) | P-01 (ids), D-04 |
| Channel id | owner id (via update) or uuid (via first upload) | channel list uses users | – | – | uuid channels fail on channel page/playlists | ID-1 |
| Coin balance | `user.coin` (profile, wallet, tasker dashboard) | users table | partner wallet ("same wallet as app") | – | same field; dashboard value refreshes on pull; static `GetProfileApi.profileModel` cache | D-02, CU-1 |
| Withdrawable ₹ | `totalEarningAmount` / `totalWithdrawableAmount` | withdrawal requests | partner wallet (min ₹100 first / ₹500 later) | – | reserve/settle ledger consistent in tests (WD-01..09); legacy fields mixed | MON-1, PAY-4, CU-1 |
| Partner earnings | `getDashboard.totalEarningsInr` (released stage coins) | `digitalPartner.report.referralEarningsInr` (referralRewardCoin × rate) | `earnings.referralInr` | `rewardInrReleased` | four definitions differ | CP-1, CP-2 |
| Ad credits | shown after Starter Pass | partner licence grants | balance shown | commission row UNVERIFIED | credits created without verified payment; no consumer | PN-2 |
| Franchise commission | – | commissions list; verify/mark paid (super only) | – | own commissions (read-only) | scope forced to caller (AZ-04/06); rows rarely created (no district) | PN-1, DS-1 |
| Referral status | referral history | referral management | referrals list/rewards | referrals + partner flags | stages and holds consistent with Partner Terms; passive 20 % beyond V9 | RF-1..5 |
| Settings / limits | live Firestore `system_configs/*` listener | Platform Config → publishes to `system_configs` | – | – | app shows config; server enforces own 5-minute-cached copy | CACHE-1, SET-1 |
| Role/scope enforcement | key + ID token; userId must match token (AZ-08) | JWT + allow-list | allow-list of 7 pages | allow-list of 6 pages | backend refuses cross-role calls; UI redirects before mount | XSS-1 (only boundary crossing found) |
| Cache / refresh | profile/config statics in memory; pull-to-refresh | redux per page, no polling | reload after mutation | reload after mutation | stale until action; no websocket refresh | CACHE-1, AFE-14 |

---

## 8. Requirements versus implementation

Sources: `E:\\Legendary One\\documents\\` (Terms V1/V2/V9, Creator V6 intro pricing, Peak Partner terms, Peak Boost spec V4, Architecture Split/Blueprint, Moderation/Copyright/HLS tasks, District Partner chart, TRS `text.txt`, `work flow.txt`). Conflicting versions are **not resolved** here; they are listed as RC-1..RC-10 in `requirements-baseline.md`.

| # | Requirement | Status | Evidence | Findings |
|---|---|---|---|---|
| 1 | 100 coins = ₹1 | Implemented; several constants | `coinsPerInr 100` in setting.js, app defaults, admin UI; R-06 WD-06 passes | CU-1 |
| 2 | Like 2 / unlike 2 / comment 5 coins; unlike reverses | Implemented | R-07 RW-04, R-09 REQ-0035, R-10 WEB-06/07 | RW-1 (cap bypass via convert) |
| 3 | 120 min/day → 500 coins, within daily cap | Implemented | R-07 RW-03/07 | AF-3 |
| 4 | ≤ 20 rewarded ads/day, all tiers | Server cap implemented; completion unverified | R-01 FIN-02 | AF-1 |
| 5 | Tier caps incl. +500 (1,000/2,500/4,500/12,500/17,167), action caps, prices | Implemented as V9 | `types/tiers.js`, Flutter defaults, R-07 RW-07 | RC-C (Free monthly cap vs ₹500 min) |
| 6 | Upgrade by lifetime watch hours (50/100/200/400) OR verified Starter Pass; hours preserved | Hours path implemented and tested; Starter Pass purchase not possible | R-07 RW-06 (2,999+1 → L1 at 3,000 min kept); R-05 PF-09/10 | DEP-5, RC-10 |
| 7 | Referral: Free 250 coins; paid 10 % of Starter Pass; single tier | Over-delivered/conflicting | setting.js | RF-1..RF-5 |
| 8 | Midnight coin→₹ settlement | **Not implemented** (documented) | cron.controller.js | AD-4 |
| 9 | VPN/proxy → permanent lock | Pause only; heuristic list | taskSecurity.service.js | AF-1, AF-2 |
| 10 | Peak Partner: Stage 1 ₹100 (24 h), Stage 2 ₹100 (100 min/7 d, 48 h), 1 account/device, ₹500 min, Monday payout | Mostly implemented; payout manual; stage-2 window wrong | R-01 REQ-PP-05, FRAUD-*; code | RF-3, AD-4 |
| 11 | Peak Boost 80/20, atomic, ledger, min 100 | Implemented | R-04 PB-01..09 | – |
| 12 | Moderation: 5 reports/24 h hold, keyword screen, admin queue, 36 h grievance | Backend implemented; no grievance/admin screens for grievances; transcript screening absent | R-09 REQ-0111 | AFE-17, GR-1, MOD-2 |
| 13 | Copyright fingerprint >85 % / pHash <10 → flag, demonetise | Engine present (off by default); flagged videos still earn | static | MOD-1 |
| 14 | HLS from Cloudflare Stream/R2, no raw MP4 streaming | Upload/grant flow implemented; delivery policy partly redirect; public R2 domain needed | R-08; earlier review REVIEW.md | ME-1..3 |
| 15 | Architecture: videos/Bites on Cloudflare, other data on Firebase, web on Vercel; youpeak.app / www / admin / api | **Live** (DNS, HTTPS, Vercel); Cloudflare delivery not verifiable without credentials | deployed probes | DL-1, DEP-2/3, DEP-7 (blocked) |
| 16 | Digital Partner licence ₹25,000 → ad-credit wallet; District commission chart (10 % unlocks cap ₹1,000, 20 % VIP, 30 % local ads) | Partly implemented; unverified credits; attribution broken; rates differ | MS-04/05 | PN-1, PN-2, PN-5, PN-6, DS-1 |
| 17 | Creator VIP passes with 60–80 % ad-revenue share by subscriber band | Sold but not delivered | static | SUBS-1, REV-1 |
| 18 | Video promotion plans | Sold but not delivered | static | SUBS-1 |
| 19 | No joining/franchise/partner logic inside the store app (Architecture Split) vs Starter Pass in-app (V9) | Conflict (RC-5); app contains purchases and partner dashboard | static | FL-1, FL-2 |

**Requirement conflicts needing an owner decision:** RC-1 (V1/V2 vs V9 caps — implemented as V9), RC-3 (Creator pass prices/thresholds), RC-4 (₹500 vs ₹100-then-₹500 minimum), RC-5 (where payments live), RC-6 (partner holds), RC-8 (district commission formula), RC-10 (watch-hour interpretation: implemented as cumulative lifetime hours, which is what the brief states).

---

## 9. Tests, analyzers and builds

Full table and logs: `test-and-build-results.md`. Summary: `npm test` 28/28; repository emulator suites 115/115; Flutter analyzer 0 errors / 84 warnings / 814 infos; Flutter tests 107/107; admin tests 4/4; admin production build OK (836 kB gzip main bundle); audit suites 107/158 expectations met (53 defects demonstrated); Flutter web/APK builds not run. The repository's tests do not touch the legacy endpoints that fail my suites (createWatchHistory, coinToAmountConverter on purchased coins, createCoinPlanHistory, playlists, channel pages, admin translations, partner password rotation), which is why they pass while the defects exist.

---

## 10. Responsive, accessibility and UI-state results

Details and screenshots: `responsive-and-ui.md`, `screenshots/`. Deployed admin sign-in and consumer onboarding/sign-in: no overflow at 1920/1366/768/390 px. Admin panel on the demo stack: 184 role/route/width views, no overflow/exception/HTTP ≥ 400; offline, invalid-token, back and refresh behave; unknown super-admin route is blank (AFE-19); dashboard donut clipped at 1366 px and misleading chart axes (AFE-20). Accessibility: Flutter web has no semantics tree until activated (A11Y-1), almost no semantic labels in the Flutter source (A11Y-2), up to 35 unlabelled controls per admin config page (AFE-21), empty admin `<title>` (AFE-18). Translations: 122 of 504 keys missing in each of 19 languages (English fallback), 128 hard-coded English strings. **Not tested:** Android/iOS devices, TalkBack/VoiceOver, colour contrast, keyboard order, RTL, dark theme, signed-in consumer screens on the deployed web app, admin on the deployed host.

---

## 11. Deployed environment observations (read-only, 6 Oct 2026)

| Item | Observation | Finding |
|---|---|---|
| Domains | youpeak.app → 308 → www.youpeak.app (Flutter web); admin.youpeak.app (React); api.youpeak.app (`/api/ping` liveness only) — all Vercel, HTTPS | DEP-1 |
| Headers | Only HSTS; no CSP / frame-ancestors / nosniff / Referrer-Policy | DEP-2 |
| CORS | Preflight from `https://evil.example` → 204 with `Access-Control-Allow-Origin: https://evil.example` and `Allow-Credentials: true` | A-02 |
| Payment webhook | `POST /payment/webhook/razorpay` (bogus body) → 400 `no_webhook_secret` | DEP-4 |
| Membership portal | `https://youpeak.in` → 404; `partners.youpeak.in` does not resolve | DEP-5 |
| Protected endpoints | client/setting without key, cron, internal fingerprint → 401 | DEP-6 |
| Firestore (anonymous REST list) | users/admins/paymentTransactions/withDrawRequests/settings/system_configs → 403 (repo rules allow public get/list on system_configs; deployed rules unverified) | DEP-7 (blocked) |
| Deep-link files | apex 308; iOS AASA empty; Android assetlinks lists package `com.YouPeak.Live1` | DL-1 |
| Policy pages | /privacy, /terms render the sign-in screen; default policy URL serves a stale Flutter template | DL-2, DL-2b |
| Grievance officer | placeholder name/e-mail, empty phone | DEP-8 |
| Assets | main.dart.js 6.4 MB (1.78 MB br), max-age=0 | WEB-1 |

---

## 12. Untested areas and blocked checks

- **Blocked by access/policy:** production Firestore content and rules; Vercel/Razorpay/Cloudflare/AdMob/Branch/Google Cloud/store consoles; GitHub repository visibility; whether production still uses the secrets exposed in git history; whether production settings override the unsafe defaults.
- **Not tested:** real payments, real ad completion, Zego live, push notifications, Firebase phone/Google/Apple sign-in, R2/Stream uploads with real credentials, Android/iOS builds and devices, load/soak/cost, accessibility with assistive technology, contrast, dark theme, RTL, deployed signed-in flows.
- **Static-only conclusions** (marked "static read"): MON-1, GR-1, UP-1, LIVE-1/2, PLAT-1, AD-4, SUBS-1, SCR-1 and most Medium items. They should be reproduced on emulator or preview deployments before being treated as proven.
- **Code not read line by line:** see §13.

---

## 13. Coverage ledger summary

Ledger (`ledger.md`, `ledger.json`): {{LEDGER_TOTALS}}.

| Status | Meaning |
|---|---|
| reviewed | read in full (directly or via a condensed dump with imports/blank/log lines removed) and assessed |
| partial | relevant sections only (notes per file); for repository tests this means check titles/intent, not source |
| scan-only | **not read line by line**: analyzer, builds/tests, pattern scans and, for admin pages, the rendered sweep |

Read in full: essentially all backend code (utilities, middleware, models, routes, controllers; `client/video.controller.js` only partially), the admin SPA's role/auth/API/withdrawal/partner/wallet pages, all 83 Flutter API/data files, Flutter security/network/payment/deep-link/reward/payout/upload/auth/ads/config files, infrastructure and build scripts. **Scan-only (explicit gap):** ~350 Flutter UI/model/language files and ~180 admin pages/components/stores. Excluded from the ledger (3,935 git-visible files): earlier reports and this audit's output (3,315), binary assets (386), Flutter native runner/generated files (197), JSON data/manifests (31), lockfiles (6); never opened: `node_modules`, `admin/frontend/build`, `.dart_tool`, emulator data and the ignored credential files.

I did **not** reach complete coverage and the percentages above should be read as the real figure. To finish: read the scan-only groups in this order — Flutter wallet/coins/premium/payout/tasker views and controllers, admin Settings/Earnings/User pages and redux stores, then the remaining Flutter views and models.

---

## 14. Remediation plan (recommended fix order)

| Phase | Actions | Findings | Verification |
|---|---|---|---|
| **0 — today (no code needed)** | Rotate the Firebase service-account key, `JWT_SECRET`, DB credentials; revoke old keys; confirm repo visibility; set the Razorpay webhook secret; disable `createCoinPlanHistory`, `premiumPlan/createHistory`, `processRazorpayPayment`, `createWatchHistory`, `coinToAmountConverter` (GET) at the router/WAF level until fixed | SEC-1, PAY-1, PAY-4, WH-1, DEP-4 | old key/JWT rejected; webhook returns 200 for a signed test event; the five routes answer 410 |
| **1 — week 1: stop the bleeding** | Fix the shim (operators, upsert, transactions for balances) or throw on unsupported operators; whitelisted DTOs for channel/search endpoints and random ids for new users; strip `html:` XSS sink and tighten e-mail validation; require auth + rate limits on grievances and login/OTP; CORS allow-list and security headers | D-01, D-02, P-01, XSS-1, GR-1, P-04, P-06, A-02, DEP-2 | audit suites 01, 02, 03, 10 turn green; CSP report-only shows no violations |
| **2 — weeks 2–3: release blockers** | Payment recovery (persist order, verify when unmounted, status poll, admin reconcile screen); decide and build the membership portal or in-app purchase; channel identity migration (ID-1) and comments/history/download fixes (CF-01); partner/franchise credit and attribution rules (PN-1/2, DS-1, LB-1); monetisation approval bug (MON-1); deep-link files (DL-1); real AdMob ids and iOS metadata (MOB-1/3); privacy/terms pages (DL-2) | PAY-5, DEP-5, ID-1, CF-01, PN-1, PN-2, MON-1, DL-1, MOB-1, DL-2 | suites 04, 05, 06, 07, 09 green; Android Digital Asset Links and Apple AASA validators pass; a Starter Pass can be bought end-to-end |
| **3 — product decisions** | Resolve RC-1..RC-10 with the document owners; align referral rules (RF-1); decide payout automation (AD-4); implement or withdraw creator pass revenue share, promotion delivery and ad-credit consumption (SUBS-1, AC-1, REV-1, PROMO-1) | RF-1, AD-4, SUBS-1 | written decision per RC; tests per rule |
| **4 — hardening** | Server-verified device attestation and AdMob SSV (AF-1); durations from Cloudflare metadata (UP-1); live end endpoint or off-Vercel sockets (LIVE-2); `waitUntil`/pre-response persistence (PLAT-1); performance rewrite of hot feeds (PERF-1); admin token storage + CSP; accessibility passes; admin UI for grievances/reconcile (AFE-17); guards on DB scripts (SCR-1) | AF-1, UP-1, LIVE-2, PLAT-1, PERF-1, AFE-17, SCR-1 | preview-deployment tests; load test p95; screen-reader pass |
| **5 — finish the audit** | Read the scan-only groups (§13) and run the blocked checks with owner access (production settings/rules, consoles, devices) | – | ledger shows 0 scan-only in money/auth paths |

---

## 15. Artifacts (all under `reports/project-audit/full-project-audit/`)

| File | Purpose |
|---|---|
| `../full-project-audit-report.md` | this report |
| `findings-register.json` | all findings, machine-readable (generated) |
| `findings-draft*.md` (18 files) | working notes with line-level evidence behind every finding |
| `ledger.md`, `ledger.json`, `gen-ledger-md.cjs`, `mark.cjs` | coverage ledger |
| `route-inventory.md`, `gen-route-inventory.cjs` | 332 routes with middleware chain and auth level |
| `requirements-baseline.md` | requirements extracted from the documents, conflicts RC-1..RC-10 |
| `test-and-build-results.md`, `logs/` | commands, results, raw logs |
| `audit-tests/` | emulator suites 01–10, runner, and browser scripts (`cdp-*.cjs`) |
| `responsive-and-ui.md`, `screenshots/` | viewport and UI-state evidence |
| `i18n-coverage.cjs`, `contract-check.cjs/.json`, `check-register-paths.cjs` | static analysis helpers |
| `gen-report.cjs`, `register-*.cjs`, `report-static-sections.md` | sources the report is generated from |

Repository side effects of this audit: none to tracked source. The repository's own emulator run writes `tests/emulator/out/results.json` (`tests/` is untracked). Earlier reports in `reports/project-audit/` (REVIEW.md of 1 Oct 2026 etc.) were read for context and left unchanged; where they disagree with this report (for example "responses never include credentials", or the API host not resolving) this report reflects the later, tested state.
