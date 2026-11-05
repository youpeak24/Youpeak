# YouPeak — full project audit report

**Audit date:** 6 October 2026 · **Branch audited:** `fix/deploy-readiness` (working tree with existing uncommitted changes preserved) · **Project root:** `E:\Legendary One\youpeak\source\` · **Author:** Claude (audit agent)

This is an evidence-based audit. No source file, production setting, DNS record, payment, credential or production data was changed; nothing was committed, pushed or deployed. Mutating tests ran only on throw-away Firestore/Auth emulators and the repository's documented demo stack. Observations are labelled by evidence class: **emulator run**, **static read**, **deployed (read-only)** (GET/OPTIONS/navigation, no login, no writes), **git history**, **demo-stack browser run**. Secrets are not printed anywhere in this report or its artifacts.

Companion artifacts are in `reports/project-audit/full-project-audit/` (see §15).

---

## 1. Executive assessment

**Verdict: the platform is not ready to take real money or personal data at public scale.** The deployed domain split works (consumer web, admin and API answer on Vercel) and much of the money engine is well built, but there are open ways to create money without paying, to destroy data, and to read other users' credentials, and several advertised products cannot be bought or are never delivered. I make no claim of "zero bugs", "secure" or "production ready".

**What is good (verified):**
- Role isolation between Super Admin, District Franchise and Digital Partner holds under test (suite 08: 11/12 controls; the failing one is a URL-prefix quirk). Suspended partners lose access on the next request.
- The reward engine, withdrawal ledger, Peak Boost, media upload grants and the webhook-driven payment state machine are covered by the repository's own emulator suites (115/115 pass), including concurrency cases (40 parallel ads never exceed 20/day; double approvals pay once).
- The Flutter client watch accumulator and API client are carefully built; admin and consumer sign-in render correctly at 1920/1366/768/390 px; 184 admin role/route/width views loaded without errors.
- The tier ladders in code match Terms V9 exactly (daily caps 1,000/2,500/4,500/12,500/17,167 coins incl. the +500 boost, prices ₹999/2,499/4,999/9,999, upgrade hours 0/50/100/200/400, 20 ads/day, likes 5/10/20/40/60, comments 2/5/10/20/30).

**Release blockers (fix before any public launch), in order:**
1. **SEC-1** — Firebase Admin key, `JWT_SECRET`, shared key and DB connection string are in pushed git history; values in history equal the current local ones. Rotate everything and purge.
2. **D-01** — the Firestore shim drops all Mongo operators: any registered user can delete every video record in one request; admin report deletion wipes the platform.
3. **P-01** — public endpoints return other users' password hashes, e-mails, push tokens and device ids; user ids are guessable timestamps.
4. **PAY-1** — coins can be credited for any gateway proof (₹1 → 1,100,000 coins demonstrated), replayed 6×, premium activated with no payment; **PAY-4** turns purchased coins into withdrawable cash.
5. **WH-1** — creator earnings can be minted by repeating a call the shipped app makes on every video.
6. **XSS-1**, **ID-1**, **CF-01** — franchise→super-admin stored XSS; channel pages/playlists broken for channels created by upload; comments, history and download screens return HTTP 500.
7. **DEP-4/PAY-5** — no webhook secret in production and the app abandons paid orders if the screen closes; **DEP-5** — the membership portal returns 404 so no pass can be bought.
8. **PN-1/PN-2, SUBS-1** — franchise commissions are misattributed or never created, credits can be minted, and creator-pass/promotion benefits are not delivered.

**Numbers:** 145 findings (5 Critical, 26 High, 72 Medium, 41 Low, 1 Info) plus 8 positive controls and 3 blocked checks. My emulator audit suites ran 158 expectations: 107 met, 53 defects demonstrated. Coverage: 1047 application files / 177,861 lines in the ledger; **460 files (25.5% of lines) read in full, 52 partly read (12.2%), 535 files (62.4%) scan-only** — mostly Flutter UI/models/language maps and admin pages. I do not claim complete coverage (§13).

---

## 2. Scope, method and limits

- **Inventory:** 332 backend routes (`route-inventory.md`), 1,047 application-owned source/config files in the coverage ledger (`ledger.md`), 3,935 excluded files (generated, binary, vendored, earlier reports — §13).
- **Static review:** backend read almost completely (all utilities, middleware, models, all controllers except the near-duplicate feed pipelines in `client/video.controller.js`); admin SPA role/auth/withdrawal/partner pages and API layer; Flutter security, network, payment, deep-link, reward, payout, upload, auth and API files; infrastructure files; scripts; documents under `E:\Legendary One\documents\` (requirements baseline in `requirements-baseline.md`).
- **Emulator tests:** ten audit suites (`audit-tests/`) on Firestore+Auth emulators with a `demo-*` project; the repository's own suites; Flutter and admin tests; analyzer; admin build (`test-and-build-results.md`).
- **Deployed checks (read-only):** DNS/HTTPS, headers, CORS preflight, webhook/cron/internal endpoints, well-known files, deep-link paths, public pages at four viewports.
- **Browser sweep:** headless Edge through the DevTools protocol against the deployed public pages and, with demo accounts, against the admin SPA on the local demo stack (`responsive-and-ui.md`).
- **Not possible / refused:** reading production Firestore (`system_configs`) was refused by the permission policy and I did not pursue another route — **BLOCKED**; Vercel/Razorpay/Cloudflare/AdMob/Google Cloud/store consoles; real devices; repository visibility on GitHub; load testing. I did not log in to production, attempt seeded credentials, simulate ad completion, or call payment/withdrawal endpoints on production.
- **Corrections to my own earlier notes** are recorded where they matter (e.g. FL-3 narrowed: two "legacy" endpoints are used by the shipped app; AFE-14 loader hang withdrawn; the first unused-admin-route list wrongly included `platformConfig/:section`).

- **Concurrent edits:** while I worked, another process was running the demo stack/Flutter dev server and three source files changed on disk that I did not touch (`functions/backend/util/watchLedger.service.js`, `tests/emulator/suites/10-web-tasking.cjs`, `youpeak/lib/features/channel/view/your_channel_view.dart`, modified 6 Oct 2026). Findings that cite those files reflect what I read earlier in the day; re-check them after the other work lands. I did not stop or alter that process; the only process I stopped was my own admin dev server on port 3055.

Severity: **Critical** = exploitable now by any registered user/anonymous caller with financial loss, data destruction, credential exposure, or exposed secrets; **High** = serious financial/security/functional failure with a realistic trigger, or a core requirement not met; **Medium** = limited impact, hardening, or conditional; **Low/Info** = minor, informational, positive or blocked.

---

## 3. Findings overview

| Severity | Count |
|---|---|
| Critical | 5 |
| High | 26 |
| Medium | 72 |
| Low | 41 |
| Info | 1 |

Kinds: Defect = reproduced or unambiguous in code; Risk = plausible, not reproduced; Requirement = behaviour differs from a written requirement or a product is not delivered; Blocked = could not be checked; Positive = control that works.

| ID | Sev | Kind | Evidence | Title |
|---|---|---|---|---|
| SEC-1 | Critical | Defect | git history + static read | Backend secrets and the Firebase Admin service-account key are in pushed git history |
| D-01 | Critical | Defect | emulator run + static read | The Firestore compatibility shim silently drops every Mongo operator, turning filters into whole-collection operations (any user can delete all videos) |
| PAY-1 | Critical | Defect | emulator run | Coin plans can be credited for any gateway proof, for the wrong plan and repeatedly; premium plans can be activated with no payment at all; gateway orders of arbitrary amount can be created |
| P-01 | Critical | Defect | emulator run | Public endpoints return raw user documents (password hash, e-mail, FCM token, device id) to anyone holding the public app key; user ids are guessable timestamps |
| WH-1 | Critical | Defect | emulator run + static read | Creator earnings can be minted: createWatchHistory re-credits on every call, trusts the playhead position and a creator-declared video duration |
| D-02 | High | Defect | emulator run | Guarded balance updates are check-then-act and instance.save() overwrites whole documents (double spend, lost credits) |
| PAY-4 | High | Defect | emulator run + static read | Coins bought with money can be converted to withdrawable rupees — and the shipped Convert screen does it with a state-changing GET |
| UP-1 | High | Defect | static read | Video duration is whatever the client says; it drives creator earnings, the Bites length limit and the 90 % 'finished' flag |
| RW-1 | High | Defect | emulator run | Daily like/earning caps can be bypassed with like → convert → unlike cycles |
| XSS-1 | High | Defect | emulator run + static read | A District Franchise login can plant HTML that the Super Admin's browser renders (stored XSS across the privilege boundary) |
| ID-1 | High | Defect | emulator run | Channel identity has two meanings (user id vs uuid): channel pages, channel videos and playlists fail for channels created by a first upload; playlist creation fails whenever the platform has other videos |
| CF-01 | High | Defect | emulator run | Collection names disagree between models, aggregate $lookup and direct db calls — subscribed/views/comment state in feeds is wrong; several screens return HTTP 500 or never respond |
| PN-1 | High | Defect | emulator run + static read | Users are attributed to the wrong District Franchise, and ordinary consumers never get a district at all, so franchise commissions are not generated |
| PN-2 | High | Defect | emulator run + static read | Ad credits and wallet coins are created without payment (self-reported licence fee, local-ad approval, ad credits that can never be spent) |
| MON-1 | High | Defect | static read | Approving a creator's monetisation request zeroes their withdrawable wallet and erases their channel's watch history |
| GR-1 | High | Defect | static read | One anonymous grievance with a CRITICAL category hides any video from every feed |
| DEP-4 | High | Defect | deployed (read-only) + static read | No Razorpay webhook secret in production, and the app abandons a paid order if the screen is closed before verify — paid orders can stay unfulfilled with no repair path in the admin UI |
| DEP-5 | High | Requirement | deployed (read-only) + static read | Starter Pass, Creator VIP passes and the Digital Partner licence are not purchasable: the membership portal does not exist |
| AD-4 | High | Requirement | static read | Payouts are manual clicks: no automatic midnight settlement, no gateway payout, no UTR/reference, and 'Accept' says 'paid' without paying |
| RF-1 | High | Requirement | static read | Referral payouts exceed the written rules: up to ₹202.50 per referral (₹100 + ₹100 + 250 coins + 20 % passive + 10 % of purchases) against 250 coins or 10 % of a Starter Pass |
| AF-1 | High | Risk | static read | Device attestation and rewarded-ad completion are self-reported by the client; VPN detection is a short IPv4 CIDR sample |
| SUBS-1 | High | Requirement | static read | Creator tiers, ad-revenue share and promotion are sold but never delivered |
| LIVE-2 | High | Defect | static read | A live session can never be ended on the Vercel deployment: Socket.IO cleanup is not attached |
| PLAT-1 | High | Risk | static read | Handlers respond first and write afterwards; on Vercel the work after the response may not run |
| PERF-1 | High | Risk | static read | Every feed/search/aggregate request loads whole collections into memory |
| DL-1 | High | Defect | deployed (read-only) + static read | App Links / Universal Links cannot verify: apex redirect, empty iOS association file, template bundle id |
| MOB-1 | High | Defect | static read | Both mobile apps ship Google's sample AdMob application id |
| FL-1 | High | Requirement | static read | Digital goods are sold in the Android/iOS app through Razorpay; the store-billing path is a stub |
| SCR-1 | High | Risk | static read | Seed/import scripts can overwrite production data: no environment guard |
| SM-2 | High | Defect | emulator run + static read | Admin comment list and translation management are broken |
| AFE-17 | High | Requirement | static read | No admin screens for grievances, local-business-ad approval, payment reconcile/mark-paid, creator funding, media audit, languages/translations (~50 of 185 admin routes have no SPA caller) |
| D-04 | Medium | Defect | emulator run | create() falls back to Date.now() ids: 25 parallel creates kept 5 documents |
| D-05 | Medium | Defect | emulator run | updateOne/findOneAndUpdate upsert ignores `upsert` or drops query keys (duplicates, orphan rows) |
| D-06 | Medium | Defect | emulator run | $round truncates/returns 0 for array args; $dateToString/$dateDiff return null; $year uses server timezone |
| DT-1 | Medium | Defect | emulator run | Date-range filters compare ISO strings with Date objects and always fail (9 call sites) |
| FEED-1 | Medium | Defect | emulator run | Home feed type=all is ordered by ascending _id (oldest first); type=popular sorts on an array |
| WH-3 | Medium | Defect | static read | Creator weekly analytics use unsupported $dateToString and Date-vs-string ranges (empty results) |
| A-01 | Medium | Defect | static read | Global error handler answers HTTP 200 {status:false,message: err.message} (misleading status, leaks internals) |
| A-02 | Medium | Defect | deployed (read-only) | CORS reflects any Origin with credentials (production preflight from https://evil.example got 204 + ACAO + ACAC) |
| DEP-2 | Medium | Defect | deployed (read-only) | Only HSTS is sent: no CSP, frame-ancestors/X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy on admin or consumer |
| A-03 | Medium | Risk | static read | Shared app key accepted from query/body, logged by morgan('dev'), compared non-constant-time (it is public by design) |
| SEARCH-1 | Medium | Defect | static read | Client search passes raw text into $regex evaluated in JS over whole collections (ReDoS / wrong results for 'c++', '(') |
| RC-A | Medium | Requirement | static read | Defaults point to youpeak.in / youpeak-9ff65.web.app instead of youpeak.app domains |
| RC-C | Medium | Requirement | static read | Free tier: monthly withdrawal cap ₹300 < ₹500 second-payout minimum with the cap enforced → a Free Tasker can never withdraw twice |
| CU-1 | Medium | Defect | static read | Coin↔₹ has several sources (coinsPerInr, coinToInrRate, minCoinForCashOut divisor, hard-coded 0.01) |
| CU-4 | Medium | Defect | static read | Three definitions of 'coins for an ad' (AdRewardCoin rows, settings.adRewardCoins overwritten by the last saved row, system_configs rewards.adCoins); the app shows per-row amounts but the server pays the flat setting |
| PN-3 | Medium | Risk | static read | Franchise sets the partner's portal and app password (isDefaultPassword:false) and can sign in as the partner |
| PN-4 | Medium | Risk | static read | Franchise can reinstate a partner auto-suspended for fraud |
| PN-5 | Medium | Requirement | static read | District unlock cap (₹1,000) applied per commission row, not per district/period |
| PN-6 | Medium | Requirement | static read | Rates differ: tierUpgrade 15 % (setting.js:181) vs 20 % (revenueSplit) vs document 20 %; partner 50 % local-ad share has no source |
| RF-2 | Medium | Requirement | static read | applyReferralCode does not check phone-OTP verification; 'new user' is a flag + coin heuristic; device dedupe uses a client string |
| RF-3 | Medium | Requirement | static read | Stage 2 uses lifetime watch minutes, not minutes within 7 days |
| RF-4 | Medium | Defect | static read | releaseHeldReferrals flips the release flag before moving coins; a failure leaves the reward unpaid with no retry |
| AF-2 | Medium | Requirement | static read | VPN detection = short IPv4 CIDR sample; Terms §4.2 permanent lock only pauses tasks |
| AF-3 | Medium | Risk | static read | Heartbeat credit is bounded by wall-clock but not tied to an active playback session (a script pinging every ≤15 s earns hours and the 500-coin bonus) |
| CP-1 | Medium | Defect | static read | Three different 'partner earnings' numbers across app, partner portal, super admin and franchise dashboards |
| CP-2 | Medium | Defect | static read | Partner report counts unverified franchise-declared fees as revenue; period boundaries use server-local time |
| LB-2 | Medium | Risk | static read | recordImpression/recordClick for local ads are unauthenticated and unlimited |
| MON-2 | Medium | Requirement | static read | Any paid tier sets isMonetization:true, bypassing the admin monetisation criteria |
| MOD-1 | Medium | Defect | static read | Copyright-flagged videos keep earning creator income (only unlock settlement checks isMonetizable) |
| MOD-2 | Medium | Requirement | static read | Audio transcript (Whisper) screening is not implemented; uploads publish before transcript screening |
| DASH-1 | Medium | Defect | static read | Dashboard 'total channels' counts a collection nothing writes; queries load whole collections and bucket by UTC |
| CF-05 | Medium | Defect | emulator run | Paid-channel subscription expiryDate is written (+1 month) but never enforced |
| SUB-1 | Medium | Defect | static read | Paid subscription: spendBalance then subscription/credit/history rows in Promise.all outside a transaction; owner gets 100 % |
| PD-1 | Medium | Defect | emulator run | GET client/partner/dashboard rotates and returns the portal password on every call while isDefaultPassword is true |
| ME-1 | Medium | Defect | static read | deleteFromStorage skips R2/Stream/Firebase hosts: deleted media stays public and billable |
| ME-2 | Medium | Risk | static read | Presigned R2 PUT has no size limit; no per-user upload quota |
| ME-3 | Medium | Risk | static read | Coin-locked video URLs are public by URL once known (API withholds them only) |
| P-03 | Medium | Defect | emulator run | Duplicate-account sign-up for an e-mail already used by Google/Apple; social login resolves by non-unique e-mail |
| P-04 | Medium | Defect | emulator run | No throttling on user login or admin login (20 wrong passwords evaluated) |
| P-05 | Medium | Defect | emulator run | deleteUserAccount is a soft flag: e-mail, hash, phone and tokens remain; Firebase Auth user not deleted |
| P-06 | Medium | Defect | static read | OTP: 4 digits, 5 attempts, 5 codes/hour per exact e-mail, no IP limit (~0.28 %/h takeover odds); otplogin e-mails any address; fullName unescaped in the e-mail HTML; registration enumeration |
| AD-1 | Medium | Risk | static read | POST /admin/admin/create is unauthenticated by design; ADMIN_SIGNUP_CODE holders can mint an AGENCY_ADMIN bound to any agencyId |
| AD-2 | Medium | Defect | static read | Admin JWT 7 days with no revocation on password change; forgotPassword is a stub that reports success |
| AD-3 | Medium | Defect | static read | Admin updatePassword has no minimum length |
| AD-5 | Medium | Risk | static read | Cron accepts ?key=<CRON_SECRET> in the query string (logged), non-constant-time compare |
| SET-1 | Medium | Risk | static read | client/setting removes ~60 named secret keys from the settings document (deny-list); any new secret field leaks to every key holder |
| DL-2 | Medium | Defect | deployed (read-only) | https://www.youpeak.app/privacy and /terms render the sign-in screen; robots.txt and sitemap.xml return the HTML shell |
| DL-2b | Medium | Defect | deployed (read-only) | Default privacy/website URL (youpeak-9ff65.web.app) serves a stale unbranded Flutter build; in-app Privacy Policy screen loads it unless production overrides |
| A11Y-1 | Medium | Defect | deployed (read-only) | Flutter web semantics tree is empty until the hidden placeholder is activated (no readable text for screen readers); text scaler forced to 0.8 |
| A11Y-2 | Medium | Defect | static read | 318 GestureDetector + 20 InkWell taps vs 16 Semantics / 15 tooltips / 12 semanticLabels |
| AFE-2 | Medium | Risk | static read | Admin JWT, role and shared key live in sessionStorage; PrivateRoute trusts isAuth |
| AFE-18 | Medium | Risk | static read | Admin shell loads jQuery, bootstrap4-toggle (jsdelivr gh path), icon and font CSS without SRI; empty <title>; password input not in a <form> |
| AFE-5 | Medium | Defect | static read | Withdrawal accept/decline show a toast only on success; failures are silent |
| AFE-10 | Medium | Defect | static read | Partner wallet preview uses a client-side rate that can differ from the server's |
| AFE-14 | Medium | Defect | static read | Redux fetch actions only console.error on failure: an outage looks like an empty table |
| AFE-15 | Medium | Risk | static read | Admin video upload has no client size/type limit; image upload buffered by the 4.5 MB serverless limit |
| AFE-25 | Medium | Defect | static read | 107 of 169 catch handlers only console-log; 1 test file for the SPA |
| FL-2 | Medium | Requirement | static read | Store app contains coin purchase, premium purchase, promotion purchase, withdrawals, Peak Boost and a partner dashboard although the Architecture Split says no financial logic in the app |
| FL-8 | Medium | Defect | static read | Daily check-in picks 'today' from the device clock while the server uses the IST business day |
| FL-9 | Medium | Risk | static read | showLog is `true == true ? log : null`: auth/OTP/payment response bodies (incl. firebaseCustomToken) are logged in every build; 56 print() calls (web console) |
| FL-10 | Medium | Risk | static read | Deep link `videoUrl` is played for the linked videoId (content spoofing; watch credited to another video) |
| FL-15 | Medium | Risk | static read | Zego AppSign and a Stripe test key are shipped to every client via settings |
| FL-18 | Medium | Defect | static read | 101 of 104 HTTP calls have no timeout (loaders can hang) |
| FL-19 | Medium | Defect | static read | Video upload reads the whole file into memory in one PUT, no progress, 15-minute cutoff |
| FL-24 | Medium | Defect | static read | Bites audio merge uses executeAsync + two fixed 10 s timers; FFmpeg completion never awaited |
| IAP-1 | Medium | Defect | static read | Legacy IAP helper verifies iOS receipts on-device against the sandbox URL (`if (2 == 2)`), 5 µs timeouts, no backend |
| CHN-1 | Medium | Risk | static read | Profile edit sends the global AppSettings.channelType (default 1) and may reset a paid channel to public |
| MOB-2 | Medium | Risk | static read | android:usesCleartextTraffic=true |
| MOB-3 | Medium | Defect | static read | iOS placeholder usage strings, no ATT/SKAdNetwork, aps-environment=development, template bundle id |
| MOB-5 | Medium | Risk | static read | Release build falls back to the debug key without key.properties; Crashlytics mapping upload off |
| LIVE-1 | Medium | Risk | static read | Zego token04 with publish privilege for any roomId the caller names |
| DOC-1 | Medium | Risk | git history | Docs call history rewrite 'optional' and rotation 'required'; nothing proves rotation happened |
| NOT-1 | Low | Defect | static read | Notification 'time ago' uses unsupported $dateDiff/$$NOW (empty text) |
| D-08 | Low | Defect | static read | update()/incrementFields() create ghost documents for unknown ids (crediting a deleted user) |
| D-09 | Low | Defect | static read | $unset writes null instead of deleting the field |
| A-04 | Low | Risk | static read | Firebase ID token verified without checkRevoked |
| CACHE-1 | Low | Risk | static read | Settings cache TTL (5 min per instance) lets instances disagree after an admin change |
| CU-2 | Low | Risk | static read | findOne('settings',{}) picks an arbitrary document if several exist |
| DR-1 | Low | Defect | static read | Ad-reward rows are capped by maxAdPerDay; daily-reward ladder days can be deleted ('configuration missing' in the app) |
| RF-5 | Low | Defect | static read | Referral history type stored as float 5.1; pending credit/count/record are separate non-atomic writes |
| AG-1 | Low | Defect | static read | Franchise district uniqueness and code generation are check-then-create |
| ADM-2 | Low | Defect | static read | admin/video.deleteVideo hard-deletes only the video document (no comments/likes/reports/storage cleanup) |
| FRAUD-ADM-1 | Low | Defect | static read | toggleUserRestriction uses user.save() (whole-document overwrite) |
| FIN-1 | Low | Defect | static read | Legacy createWithdrawRequest deletes the user's earlier declined request (audit trail loss) |
| AZ-12 | Low | Defect | emulator run | Franchise/partner logins are refused on the /api/admin/... URL form (allow-list compares /admin/...) — functional only; the SPA uses /admin/... |
| P-07 | Low | Defect | static read | store login rewrites coin/reward fields from a stale snapshot |
| P-08 | Low | Defect | static read | updateProfile accepts subscriptionCost/videoUnlockCost/ipAddress/mobileNumber without bounds |
| DEP-8 | Low | Defect | deployed (read-only) | Grievance officer is a placeholder (grievance@youpeak.in, empty phone) |
| DL-3 | Low | Defect | deployed (read-only) | Every unknown path returns 200 + the shell; no 'link not found' state |
| WEB-1 | Low | Risk | deployed (read-only) | All consumer assets (6.4 MB main.dart.js) are served max-age=0, must-revalidate |
| AFE-3 | Low | Risk | static read | sessionStorage.dialogueData re-opens the last dialog (with payout details) after refresh |
| AFE-6 | Low | Defect | static read | declineRequest does not URL-encode the reason |
| AFE-7 | Low | Defect | static read | Accept dialog has editable no-op fields with 'Enter Symbol' placeholder, raw ISO date, icon-only buttons without labels, MM/DD/YYYY dates |
| AFE-8 | Low | Defect | static read | Payout detail 'Key:value' split on the first colon truncates values containing ':' |
| AFE-11 | Low | Defect | static read | Failed first load renders nothing (wallet) / generic toast without retry |
| AFE-12 | Low | Risk | static read | Franchise partners list is unpaginated and filtered client-side |
| AFE-16 | Low | Defect | static read | Fake upload progress (0 → 100) |
| AFE-19 | Low | Defect | demo-stack browser run | Super Admin unknown route renders an empty content area |
| AFE-20 | Low | Defect | demo-stack browser run | Dashboard chart: unequal date gaps drawn equidistant, Bézier smoothing, no y labels; donut clipped at 1366 px |
| AFE-21 | Low | Defect | demo-stack browser run | Controls without an accessible name (up to 35 per config page) |
| FL-7 | Low | Defect | static read | No ad loaded → Play does nothing silently; ad cooldown lives in local storage |
| FL-11 | Low | Risk | static read | Any 6–12 alphanumeric path on youpeak.app is treated as a referral code unless reserved |
| FL-13 | Low | Defect | static read | Upload deletes the whole app temp directory; failure shows only 'Upload Failed' |
| FL-14 | Low | Risk | static read | Password sign-in posts the password (TLS only) with no server throttling |
| FL-20 | Low | Defect | static read | Referral screen shows a hard-coded '1' and the legacy referralRewardCoins; prints the link to the console |
| FL-22 | Low | Defect | static read | Search/playlist-search/referral/grievance URLs interpolate raw text without encoding |
| FL-23 | Low | Defect | static read | Comment/reply/like/share/report calls ignore the response (refusals invisible) |
| FL-25 | Low | Defect | static read | Channel-name check sends the name as the body of a GET (dropped by browsers/proxies) |
| PP-1 | Low | Defect | static read | premiumPlan.update crashes without planBenefit; no numeric validation; plan deletion with active holders |
| CUR-1 | Low | Defect | static read | Default currency can be changed but the app formats ₹/INR and Razorpay is INR-only; default currency can be deleted |
| LIVE-3 | Low | Defect | static read | Live list uses $lookup let/pipeline (shim crash); notifications sent after the response |
| MOB-4 | Low | Defect | static read | Version drift: pubspec 1.0.0+1 vs Android 1.1.2 (2) |
| DOC-2 | Low | Defect | static read | HANDOVER.md says 'not pushed' and 'smoke-tested against live Firestore'; both outdated |
| ADV-1 | Info | Defect | static read | Advertise admin cannot clear an ad unit id (empty values ignored) |

---

## 4. Critical and High findings (full detail)

Each entry: where (path:lines), expected vs actual, reproduction, impact, fix and the test that proves the fix. Emulator checks refer to `audit-tests/suites/*` and `logs/*`.

### SEC-1 — Backend secrets and the Firebase Admin service-account key are in pushed git history
**Severity:** Critical · **Kind:** Defect · **Area:** Secrets / release · **Evidence:** git history + static read · **Detail notes:** findings-draft-12, -16 (DOC-1)

- **Where:** git objects 0d423333 (functions/backend/.env, functions/backend/serviceAccountKey.json, root serviceAccountKey.json), 70130744 (admin/frontend/backend/.env + key), 4ffc19ee (admin/backend/.env); reachable from origin/main and origin/fix/deploy-readiness (`git branch -a --contains 0d423333`); commit 523258f9 only untracked them
- **Expected:** No credential ever enters version control; anything that did is rotated and purged (DEPLOYMENT.md §1 and HANDOVER.md lines 288 and 298 say rotation is required).
- **Actual:** The committed .env files carried values for JWT_SECRET, the shared app key (secretKey) and the database connection string; the committed service-account JSON has the same private_key_id/project_id as the file the backend loads today; JWT_SECRET, secretKey and the connection string in history are byte-identical to the current local .env (compared in memory, nothing printed). Cloudflare variables were blank in every committed revision. Repository visibility could not be checked (`gh` not installed) — BLOCKED. Whether production still uses these values was not verified.
- **Reproduce:** `git log --all --oneline -- functions/backend/serviceAccountKey.json` (2 commits); `git branch -a --contains 0d423333`; load both revisions and compare field values without printing.
- **Impact:** Anyone who can read the history can sign admin JWTs (admin _id values are in the tracked DB/admins.json), act as the Firebase Admin SDK (read/write every collection, mint custom tokens for any guessable 13-digit user id — P-02) and use the database credentials.
- **Fix:** Rotate the Firebase service-account key (and revoke the old one in Google Cloud), JWT_SECRET and the database credentials in the provider consoles and in Vercel; rewrite history (git filter-repo/BFG) or retire the repository; add a secret scanner to CI; keep credentials only in Vercel/Secret Manager.
- **Verification test:** gitleaks over `git log --all` finds nothing; the old key is rejected by Google; a JWT signed with the old secret gets 401 from every /admin route.

### D-01 — The Firestore compatibility shim silently drops every Mongo operator, turning filters into whole-collection operations (any user can delete all videos)
**Severity:** Critical · **Kind:** Defect · **Area:** Data layer · **Evidence:** emulator run + static read · **Detail notes:** findings-draft (D-01 blast radius), -3 (V-01)

- **Where:** functions/backend/util/firestoreDb.service.js:175-190 (_flattenQuery); callers include client/video.controller.js:4831-4875 (deleteVideoRecord), admin/report.controller.js:156-217 (deleteVideoReport), admin/soundList.controller.js:206-229, admin/soundCategory.controller.js:98-132, admin/videoComment.controller.js:264, client/playLIst.controller.js:21,108, client/liveUser.controller.js:100,159, client/withDrawalRequest.controller.js:203-205, client/video.controller.js:620-622,1326
- **Expected:** `{ _id: { $in: ids } }`, `$gte`, `$or`, `$ne`, `$and` restrict the documents touched, or the shim refuses unsupported operators.
- **Actual:** Operator keys and object-valued filters are skipped, so find/findOne/count/deleteMany/updateMany run against the whole collection.
- **Reproduce:** Suite 01 DL-01 (`find({_id:{$in:[x]}})` returned 3 of 3), DL-02 (`$gte` returned 4 of 4), DL-03 (`deleteVideoReport` for ONE report deleted all 3 seeded videos). Suite 03 MS-01: user ms_u1 calls `DELETE /client/video/deleteVideoRecord?videoId=<own video>` → videos before=3 after=0, other users' videos deleted.
- **Impact:** Any registered user can wipe every video record on the platform in one request; one admin report deletion wipes videos, comments, likes, notifications and watch history; validations built on `$in` (playlist videos, live subscribers, withdrawal status) are vacuous (PL-01).
- **Fix:** Implement the operators the code uses (or move to real queries/transactions) and make the shim throw on any unsupported operator; replace id-list filters with per-id reads/batches; add the DL-/MS- suites as regression tests.
- **Verification test:** Suite 01 and 03 pass; a repository-wide test fails if a non-aggregate shim call receives an operator it does not implement.

### PAY-1 — Coin plans can be credited for any gateway proof, for the wrong plan and repeatedly; premium plans can be activated with no payment at all; gateway orders of arbitrary amount can be created
**Severity:** Critical · **Kind:** Defect · **Area:** Payments · **Evidence:** emulator run · **Detail notes:** findings-draft-3

- **Where:** client/coinplan.controller.js:49-166 (createCoinPlanHistory), client/coinplan.controller.js:338 (processRazorpayPayment), client/premiumPlan.controller.js:28-120 (createHistory)
- **Expected:** Fulfilment only for a verified order that exists in paymentTransactions, belongs to the caller and matches the plan/amount; replay-safe; plans delivered only after payment.
- **Actual:** createCoinPlanHistory verifies only an HMAC over orderId|paymentId; it never looks the order up. Replay protection is a non-atomic findOne. premiumPlan/createHistory has no payment check. processRazorpayPayment multiplies a client-supplied amount.
- **Reproduce:** Suite 04: PY-02 credited 1,100,000 coins (₹11,000) for a proof never tied to plan cp_big (₹10,000); PY-03 one ₹1 payment (100 coins) produced 600 coins after 6 parallel replays; PY-01 premium activated with status=true and no payment; PY-04 amount taken from the client.
- **Impact:** Free coins (and via PAY-4 withdrawable cash), free premium, and gateway orders that mismatch the catalogue. The shipped app uses the newer createOrder/verify path (FL-3 narrowed), but these endpoints stay reachable to any signed-in user with a valid signature oracle.
- **Fix:** Delete or lock these legacy endpoints behind the server-side order state machine (client/payment/*) that the repo's suite 05 already tests; if kept, bind proof → paymentTransactions → plan and use a transaction.
- **Verification test:** Suite 04 expectations pass; repo suite 05 (PF-01..12) keeps passing.

### P-01 — Public endpoints return raw user documents (password hash, e-mail, FCM token, device id) to anyone holding the public app key; user ids are guessable timestamps
**Severity:** Critical · **Kind:** Defect · **Area:** Privacy / auth · **Evidence:** emulator run · **Detail notes:** findings-draft-2

- **Where:** client/user.controller.js:378-390 (aboutOfChannel), :393-409 (searchChannel); ids from firestoreDb.service.js create() fallback `Date.now()` (P-02)
- **Expected:** Only public channel fields (name, image, description, counts).
- **Actual:** Whole user records are returned with passwordHash, email, fcmToken, identity and, for legacy accounts, cryptr password, mobileNumber, ipAddress, wallet balances.
- **Reproduce:** Suite 02 AP-02 (`GET aboutOfChannel?channelId=<id>` with only the key header: leaked passwordHash, email, fcmToken, identity), AP-03 (`POST searchChannel`), AP-01 (13-digit epoch-ms user ids).
- **Impact:** Bulk harvest of every user's hash, e-mail and push token (the key is compiled into the public web bundle and the APK); sequential ids make enumeration trivial; offline cracking of hashes; push spam.
- **Fix:** Return a whitelisted DTO (util/safeUser.js already exists for other routes); use random 128-bit ids for new documents; invalidate and rotate exposed hashes/tokens; require a user token for these routes.
- **Verification test:** Suite 02 AP-01..03 pass; contract test asserts no response contains passwordHash/email/fcmToken keys.

### WH-1 — Creator earnings can be minted: createWatchHistory re-credits on every call, trusts the playhead position and a creator-declared video duration
**Severity:** Critical · **Kind:** Defect · **Area:** Creator earnings · **Evidence:** emulator run + static read · **Detail notes:** findings-draft-6, -11 (FL-5, UP-1)

- **Where:** client/watchHistory.controller.js:16-202 (upsert at ~176-196; early response at :88); app calls: youpeak/lib/features/video/controller/normal_video_details_controller.dart:345, features/video/view/shorts_video_details_view.dart:116, features/bites/view/nav_shorts_details_view.dart:259, features/bites/view/preview_shorts_video.dart:470; duration from client/video.controller.js:505 (createVideo) — UP-1
- **Expected:** A viewer is credited once per (viewer, video) for real playback, bounded by the real duration, tied to the secure heartbeat ledger.
- **Actual:** The dedupe row is written with `updateOne(..., {upsert:true})`, which the shim ignores, so the row never exists and every call credits `watchTime/3600 × earningPerHour` again. `currentWatchTime` is the player position (`position.inSeconds`) sent once past 40%, and the cap is the duration the creator typed at upload.
- **Reproduce:** Suite 06 RW-02: 5 identical calls credited ₹10 for one 1-hour video watched once; watch-history rows stored = 0. Shipped app calls the endpoint from four screens.
- **Impact:** Unlimited withdrawable creator earnings for a creator plus a second account (the earning is `totalWithdrawableAmount`/`totalEarningAmount`, convertible and payable); lost writes on Vercel after the early response (PLAT-1).
- **Fix:** Remove the endpoint from the app and server (the heartbeat ledger already tracks real viewing), or rewrite it on the ledger with a unique (viewer, video) key created in a transaction, server-side duration from Stream/R2 metadata, and pre-response persistence.
- **Verification test:** Suite 06 RW-02 passes; a test replays 20 calls and asserts one credit; duration is read from Cloudflare metadata (UP-1).

### D-02 — Guarded balance updates are check-then-act and instance.save() overwrites whole documents (double spend, lost credits)
**Severity:** High · **Kind:** Defect · **Area:** Data layer · **Evidence:** emulator run · **Detail notes:** findings-draft

- **Where:** util/mongooseShim.js:382-400 (matchesQueryGuards before write), :706-712 (save = create = set merge of the whole object)
- **Expected:** A guarded `$inc` or a save never lets two requests spend the same balance or erase a concurrent credit.
- **Actual:** The guard is evaluated on an earlier read; the write is separate; save() writes the in-memory object back.
- **Reproduce:** Suite 01 DL-05: two parallel spends of 100 against a balance of 100 → balance ended at −200; DL-06: a stale save() erased a concurrent +500 credit (coin=0).
- **Impact:** Coins, subscription fees, unlocks and legacy withdrawal paths that use the shim (not the transaction-based reward/withdrawal ledgers) can overspend or lose credits.
- **Fix:** Route every balance mutation through Firestore transactions (as util/withdrawalLedger.js and rewardEngine already do); ban save() on user documents.
- **Verification test:** Suite 01 DL-05/06 pass; a concurrency test (40 parallel spends) never drives a balance negative.

### PAY-4 — Coins bought with money can be converted to withdrawable rupees — and the shipped Convert screen does it with a state-changing GET
**Severity:** High · **Kind:** Defect · **Area:** Payments / wallet · **Evidence:** emulator run + static read · **Detail notes:** findings-draft-3, -11 (FL-4)

- **Where:** client/withDrawalRequest.controller.js:71-178 (coinToAmountConverter), util/withdrawalLedger.js (reserveWithdrawal convertShortfall); app: coins/api/convert_coin_api.dart:11 (GET …/coinToAmountConverter?userId&coin)
- **Expected:** Purchased coins are spendable in-app only (or follow a documented cash-out rule); money-moving calls are POST/PATCH with an idempotency key.
- **Actual:** `purchasedCoin` is tracked but never excluded; conversion is 100:1 for any balance; the app converts by GET with userId/amount in the URL.
- **Reproduce:** Suite 03 MS-03: ₹ of purchased coins converted into withdrawable balance (totalEarningAmount=100).
- **Impact:** A rupee-in/rupee-out channel (stolen-card cash-out, bonus-pack arbitrage); chains with PAY-1..3.
- **Fix:** Separate purchased from earned coin buckets; block conversion of purchased coins; move conversion to POST with a request id.
- **Verification test:** Suite 03 MS-03 passes; repo suites 06/07 keep passing.

### UP-1 — Video duration is whatever the client says; it drives creator earnings, the Bites length limit and the 90 % 'finished' flag
**Severity:** High · **Kind:** Defect · **Area:** Media / earnings · **Evidence:** static read · **Detail notes:** findings-draft-11, -5 (VID-1)

- **Where:** client/video.controller.js:353 (durationOfShorts check), :505 (video.videoTime = req.body.videoTime); client/watchHistory.controller.js:66; client/playbackSession.controller.js:27; setting.js `durationOfShorts: 60000`
- **Expected:** Duration read from Cloudflare Stream/R2 metadata after transcoding; Bites limit in seconds.
- **Actual:** Stored as declared; `durationOfShorts` is 60000 (≈16.7 h if seconds) so the Bites limit is effectively absent.
- **Reproduce:** Read of createVideo and the three consumers; no code reads Stream duration into videoTime.
- **Impact:** Inflated declared duration raises the creator-earning ceiling (WH-1); a long clip can be published as a Bite; progress/finished metrics are wrong.
- **Fix:** Set videoTime from the Stream webhook (readyToStream duration) or ffprobe; fix the unit/default of durationOfShorts.
- **Verification test:** Upload a 5-second clip declaring 3,600 s: stored duration is 5; a 10-minute clip is refused as a Bite.

### RW-1 — Daily like/earning caps can be bypassed with like → convert → unlike cycles
**Severity:** High · **Kind:** Defect · **Area:** Rewards · **Evidence:** emulator run · **Detail notes:** findings-draft-6

- **Where:** util/rewardEngine.js:472-513 (reverseReward); coinToAmountConverter has no minimum (minConvertCoin is displayed, not enforced)
- **Expected:** 5 likes/day (10 coins) for the Free tier regardless of toggling.
- **Actual:** Un-liking decrements the daily counters but claws back only what is still in the coin balance; converted coins stay.
- **Reproduce:** Suite 06 RW-01: 14 coins (₹0.14) earned and converted from 7 cycles although the cap is 10 coins; counters back to 0.
- **Impact:** Free tier ₹10/day cap bypassable at one cycle per 3-second pacing gap (also for dislikes).
- **Fix:** Keep the per-day counters monotonic (never decrement) or block conversion of unsettled engagement coins; enforce minConvertCoin server-side.
- **Verification test:** Suite 06 RW-01 passes.

### XSS-1 — A District Franchise login can plant HTML that the Super Admin's browser renders (stored XSS across the privilege boundary)
**Severity:** High · **Kind:** Defect · **Area:** Admin UI / privilege boundary · **Evidence:** emulator run + static read · **Detail notes:** findings-draft-18

- **Where:** functions/backend/util/partnerNetwork.service.js:30 (EMAIL_RE), admin/frontend/src/Component/Pages/DigitalPartner/PartnerDetail.js:84-88 (Swal `html:` with portalCredentials.email)
- **Expected:** User-controlled text is escaped; e-mail addresses with markup are rejected.
- **Actual:** `<img/src=x/onerror=alert(document.domain)>@a.bc` passes the validator, is stored, returned verbatim to the Super Admin and interpolated into SweetAlert HTML.
- **Reproduce:** Suite 10 XSS-01 (franchise creates the partner: status true) and XSS-02 (regeneratePassword returns the markup verbatim). Browser execution not performed; the sink is a direct template-string `html:` in the SPA.
- **Impact:** Script in the admin origin can read the 7-day JWT and shared key from sessionStorage (AFE-2) and call any admin API; no CSP is served (DEP-2).
- **Fix:** Use `text:`/DOM text nodes for these values; tighten e-mail validation; add CSP to admin.youpeak.app; move the token out of sessionStorage.
- **Verification test:** Suite 10 passes; a browser test shows the literal text in the dialog.

### ID-1 — Channel identity has two meanings (user id vs uuid): channel pages, channel videos and playlists fail for channels created by a first upload; playlist creation fails whenever the platform has other videos
**Severity:** High · **Kind:** Defect · **Area:** Channels / playlists · **Evidence:** emulator run · **Detail notes:** findings-draft-15, -16

- **Where:** client/user.controller.js:181-183 (channelId = userId) vs client/video.controller.js:435 (uuid.v4()); consumers user.controller.js:266-270 (detailsOfChannel), :324 (videosOfChannel), :343 (playListsOfChannel); client/playLIst.controller.js:21,108 ($in)
- **Expected:** One channel id; channel page, videos and playlists load; creating a playlist from an existing video succeeds.
- **Actual:** For uuid channels detailsOfChannel answers 'Channel not found', videosOfChannel and playListsOfChannel return empty; `newPlayList` answers 'One or more videos not found!' for a valid single video because `$in` is dropped.
- **Reproduce:** Suite 09: ID-01 (status=false 'Channel not found.'), ID-03 (total 0), PL-02 (3 playlists → total 0), PL-01 (3 active videos exist; creating a one-video playlist refused); ID-02 control passes for channelId = userId.
- **Impact:** Creators who started by uploading cannot open their channel page/playlists; viewers following their video's channel link get an error; nobody can create a playlist once the platform has more active videos than the selection.
- **Fix:** Standardise on channelId = userId (migrate uuid channels), resolve channel pages by the channelId field, fix the `$in` validation (D-01), align `start` semantics (PL-03).
- **Verification test:** Suite 09 passes (7/7).

### CF-01 — Collection names disagree between models, aggregate $lookup and direct db calls — subscribed/views/comment state in feeds is wrong; several screens return HTTP 500 or never respond
**Severity:** High · **Kind:** Defect · **Area:** Data layer / feeds · **Evidence:** emulator run · **Detail notes:** findings-draft-5, -6, -8

- **Where:** util/firestoreDb.service.js:107-155 (normalizeCollectionName), util/mongooseShim.js:230-243 ($lookup needs localField), client/user.controller.js:269, client/video.controller.js:714-899 (shortsOfUser never responds)
- **Expected:** One name per collection; every lookup resolves; every handler answers.
- **Actual:** Writes go to the model name, lookups read the lower-case plural, direct calls use camelCase; `$lookup` with let/pipeline crashes.
- **Reproduce:** Suite 05 CF-02 (after a real subscribe: feed isSubscribed=false, totalSubscribers=0), CF-03 (views=0 after a watch row), CF-04 (shortsOfUser hangs); suite 06 RW-04 and suite 07: getComments, repliesOfVideoComment, getWatchHistory, getdownloadVideoHistory → HTTP 500 'reading indexOf'; RW-03 (syncPlayback stores orphan rows with no userId).
- **Impact:** Comments list, viewing history, download history cannot load; feeds show wrong subscribed/views state; resume-watching is empty and each heartbeat adds an orphan document. Production impact depends on the names actually used by live data (not readable here).
- **Fix:** Single source of collection names (derive from the model), implement `$lookup` pipelines or rewrite these queries with explicit reads, add the audit suites as regression tests.
- **Verification test:** Suites 05/06/07 pass for these checks.

### PN-1 — Users are attributed to the wrong District Franchise, and ordinary consumers never get a district at all, so franchise commissions are not generated
**Severity:** High · **Kind:** Defect · **Area:** Franchise attribution · **Evidence:** emulator run + static read · **Detail notes:** findings-draft-3, -4 (DS-1)

- **Where:** util/geofence.service.js:18-57 (resolveAgency: district OR state on the first agency); no consumer path sets users.state/district (only createEmailPasswordAccount for franchise-created partners)
- **Expected:** District-scoped attribution from the buyer's location; commissions per the District Partner chart.
- **Actual:** A user from Tiruchirappalli resolved to the Chennai franchise (same state); real consumers have no state/district so resolveAgency returns null.
- **Reproduce:** Suite 03 MS-04 (resolved to "ms_ag_chennai"); static: the Flutter app has no location/district input.
- **Impact:** Commission rows (unlocks, passes, ads) are misattributed or never created; franchise reports show ~0 users.
- **Fix:** Collect district at sign-up or derive it from a verified source; match district first, then state only when a single franchise exists; add tests for both.
- **Verification test:** Suite 03 MS-04 passes; an end-to-end purchase creates one commission for the right franchise.

### PN-2 — Ad credits and wallet coins are created without payment (self-reported licence fee, local-ad approval, ad credits that can never be spent)
**Severity:** High · **Kind:** Defect · **Area:** Partner credits · **Evidence:** emulator run + static read · **Detail notes:** findings-draft-2, -3, -4

- **Where:** util/partnerNetwork.service.js:321-398 (createPartner → grantDigitalPartnerLicense); admin/localBusinessAd.controller.js:46-118 (50 % of declared adBudgetInr as coins); util ad credits (AC-1: no consumer)
- **Expected:** Credits only after a verified payment; ad credits debited when ads are served; budgets bounded.
- **Actual:** A franchise reports licenseFeeInr up to ₹10,00,000 and the partner's ad-credit balance is credited at once (commission row only flagged UNVERIFIED). Approving a partner-submitted local ad credits the partner 50 % of the self-declared budget in coins with no advertiser payment. Ad credits are granted and displayed but nothing debits them.
- **Reproduce:** Suite 03 MS-05: partner ad-credit balance 1,000,000 after an unverified licence fee of 1,000,000.
- **Impact:** A franchise can mint credits; a partner can mint coins through unpaid ads; credits are inert, so the purchasable benefit is undelivered (AC-1).
- **Fix:** Credit only on a verified payment record; bound and verify local-ad budgets; implement credit consumption or stop selling credits.
- **Verification test:** Suite 03 MS-05 passes; local-ad approval test asserts no wallet change until payment is verified.

### MON-1 — Approving a creator's monetisation request zeroes their withdrawable wallet and erases their channel's watch history
**Severity:** High · **Kind:** Defect · **Area:** Monetisation · **Evidence:** static read · **Detail notes:** findings-draft-7

- **Where:** admin/monetizationRequest.controller.js:141-156 (sets totalWithdrawableAmount: 0, totalEarningAmount: 0 and WatchHistory.deleteMany({videoChannelId}))
- **Expected:** Approval flips eligibility only.
- **Actual:** `totalEarningAmount` is the shared withdrawable wallet (tasker conversions, referral/partner payouts, creator earnings); approving a creator wipes cash they earned elsewhere, can leave reserved > available, and the decline branch was already fixed for the same copy/paste problem.
- **Reproduce:** Code read; not run (needs a seeded creator with balance).
- **Impact:** Money loss for approved creators; corrupted reservations.
- **Fix:** Remove the balance reset and the history deletion; write a ledger entry if a baseline is needed.
- **Verification test:** Approve a creator with ₹500 withdrawable: balance unchanged and history intact.

### GR-1 — One anonymous grievance with a CRITICAL category hides any video from every feed
**Severity:** High · **Kind:** Defect · **Area:** Moderation / abuse · **Evidence:** static read · **Detail notes:** findings-draft-7

- **Where:** client/grievance.controller.js:52-67 (route uses optionalAppUser)
- **Expected:** Authenticated, rate-limited, reviewed before takedown (or hold only for the reporter's account).
- **Actual:** Any holder of the public key can file ANTI_NATIONAL/HATE_SPEECH/CSAM against any videoId and the video becomes pending_review immediately; no dedupe, throttle or verification.
- **Reproduce:** Code read; not run against production.
- **Impact:** Malicious takedown of competitors' videos; admin has no UI to resolve grievances (AFE-17).
- **Fix:** Require a user token and per-user/IP rate limits; hold only after N independent reports or an officer's review; add the admin grievance screen.
- **Verification test:** Anonymous request is refused; one authenticated report does not hide the video.

### DEP-4 — No Razorpay webhook secret in production, and the app abandons a paid order if the screen is closed before verify — paid orders can stay unfulfilled with no repair path in the admin UI
**Severity:** High · **Kind:** Defect · **Area:** Payments / deployment · **Evidence:** deployed (read-only) + static read · **Detail notes:** findings-draft-9, -13 (PAY-5)

- **Where:** POST https://api.youpeak.app/payment/webhook/razorpay → 400 {message:'no_webhook_secret'}; Flutter coins/widget/coin_payment_view.dart:84-104, premium/view/payments_view.dart:79-96, video_promotion/view/promote_video_view.dart (`if (!mounted) return;` before PaymentApi.verify); core/payment/razorpay/razorpay_service_mobile.dart dispose clears listeners; Constant.paymentStatus unused
- **Expected:** Gateway webhooks verified and fulfil orders independently of the client; the client recovers pending orders.
- **Actual:** Webhooks cannot be verified (no secret); fulfilment depends on the client's verify call, which is skipped when the widget is gone; no pending-order store, no status polling; the admin reconcile API has no UI.
- **Reproduce:** Deployed read-only probe of the webhook; code read of the three payment screens.
- **Impact:** A user can be charged (coins, premium, promotion) and receive nothing, with no automatic recovery.
- **Fix:** Configure the webhook secret; persist orderId at creation and verify even when unmounted; poll payment/status on launch; add the admin reconcile/mark-paid screen.
- **Verification test:** Widget test that disposes the view before the SDK callback and still verifies; signed webhook fulfils an unverified order (repo suite 05 covers the server half).

### DEP-5 — Starter Pass, Creator VIP passes and the Digital Partner licence are not purchasable: the membership portal does not exist
**Severity:** High · **Kind:** Requirement · **Area:** Memberships · **Evidence:** deployed (read-only) + static read · **Detail notes:** findings-draft-9, -12

- **Where:** default membershipPortalUrl https://youpeak.in (setting.js, core/system_config/domain/system_configs.dart:348, core/membership/membership_portal.dart); https://youpeak.in → HTTP 404; partners.youpeak.in does not resolve; no repository code implements the portal or calls createOrder(purpose: tier_upgrade | digital_partner_license)
- **Expected:** V9 Option B: instant Starter Pass; Creator VIP passes; Partner licence (portal or in-app).
- **Actual:** Every 'Buy pass' button opens a dead URL. The Activation lock screen (PopScope canPop:false) would trap an account if joiningFeeInr > 0.
- **Reproduce:** Deployed GET of youpeak.in and the system default; static read of the app.
- **Impact:** The paid tiers, ad credits, passes and partner onboarding by the stated model cannot generate revenue; DEPLOYMENT/Architecture Split assumptions are unmet.
- **Fix:** Build/point the portal, or expose purchase in the app within store policy (FL-1); bind payments to an authenticated session, not the `uid` query parameter.
- **Verification test:** An end-to-end test purchases a Starter Pass and the tier changes (repo suite 05 PF-09/10 already cover the backend).

### AD-4 — Payouts are manual clicks: no automatic midnight settlement, no gateway payout, no UTR/reference, and 'Accept' says 'paid' without paying
**Severity:** High · **Kind:** Requirement · **Area:** Payouts · **Evidence:** static read · **Detail notes:** findings-draft-2, -10 (AFE-4)

- **Where:** controllers/cron.controller.js:11-14 (settlement documented as not implemented); util/withdrawalLedger.js header (MANUAL_ADMIN_APPROVAL); admin/withDrawalRequest.controller.js:124-215 and SPA admin/frontend/src/Component/Pages/WithDrawRequest/WithDrawDetails.js:62-66
- **Expected:** Terms V9 §3.1 midnight settlement; Developer Spec §3 RazorpayX/Cashfree payouts with webhooks and references.
- **Actual:** An admin marks the request accepted; the wallet is settled whether or not money was sent; no payout reference is captured; user is told 'being processed'.
- **Reproduce:** Code read of both sides.
- **Impact:** No auditable link between a ₹ debit and a bank transfer; errors surface only through support.
- **Fix:** Add payout gateway + reference capture + webhook reconciliation; implement or formally drop the midnight settlement.
- **Verification test:** Accepted withdrawal stores a payout id; reconciliation report matches ledger and gateway.

### RF-1 — Referral payouts exceed the written rules: up to ₹202.50 per referral (₹100 + ₹100 + 250 coins + 20 % passive + 10 % of purchases) against 250 coins or 10 % of a Starter Pass
**Severity:** High · **Kind:** Requirement · **Area:** Referrals · **Evidence:** static read · **Detail notes:** findings-draft-2

- **Where:** setting.js:96-100,147-150,201 (taskerEarningsReferralPercentage: 20), util/referral.service.js (applyReferralCode/completeStage2), util/revenueSplit.service.js DEFAULT_SPLITS
- **Expected:** V9 §1.5: Free referrer 250 coins or 10 % of the referred member's Starter Pass, single tier, no passive multi-level commission; Peak Partner terms apply only to Peak Partners.
- **Actual:** Stage rewards are open to every user; a recurring 20 % of the referee's tasker rewards and 10 % of coin/premium purchases are credited to referrers; stage 2 uses lifetime watch minutes, not minutes within 7 days (RF-3).
- **Reproduce:** Config and code read.
- **Impact:** Cost overrun and a requirement conflict that affects finance planning; contradicts the franchise dashboard text.
- **Fix:** Decide the authoritative document (RC-1..RC-6) and align settings; add a test per rule.
- **Verification test:** REQ-0040 (repo suite 09) plus new tests for the passive percentage and Stage-2 window.

### AF-1 — Device attestation and rewarded-ad completion are self-reported by the client; VPN detection is a short IPv4 CIDR sample
**Severity:** High · **Kind:** Risk · **Area:** Anti-fraud · **Evidence:** static read · **Detail notes:** findings-draft-2 (AF-1..3), -11 (FL-12)

- **Where:** util/taskSecurity.service.js (header acknowledges it), client/user.controller.js handleAdWatchReward, userTaskReward/adWatch; Flutter core/security/*
- **Expected:** Play Integrity/App Attest verification, AdMob server-side verification, permanent VPN lock per Terms §4.2.
- **Actual:** `integrityToken` stored as the string 'received'; one-account-per-device keys on a client-supplied deviceId; ad claims need only a plain call; browser refusal checks Origin/Sec-Fetch headers; VPN lock only pauses tasks.
- **Reproduce:** Code read; the repo suite 10 shows the server-side caps hold under concurrency.
- **Impact:** A modified client can farm ads/likes up to the daily caps on many accounts; caps and pacing limit the loss.
- **Fix:** Verify attestations server-side, use AdMob SSV callbacks, ban per device fingerprint, extend IP intelligence (IPv6, ASN lists).
- **Verification test:** Forged attestation and forged ad claim are refused in integration tests.

### SUBS-1 — Creator tiers, ad-revenue share and promotion are sold but never delivered
**Severity:** High · **Kind:** Requirement · **Area:** Creator monetisation · **Evidence:** static read · **Detail notes:** findings-draft-7, -13 (PROMO-2)

- **Where:** users.totalSubscribers never written (gates Silver/Gold/Platinum and funding tiers); util/revenueSplit.service.js adRevenue + rewardEngine.getCreatorRevenueShare have no callers (REV-1); videos.isPromoted never read (PROMO-1/2); Flutter promote_video_view.dart shows plans, prices and impression ranges
- **Expected:** V6 Creator VIP: 60–80 % ad-revenue share by subscriber band; video promotion delivers the purchased reach.
- **Actual:** Subscriber-gated tiers are unreachable; no creator ad revenue is computed or paid; promotions only set a flag.
- **Reproduce:** grep for writers/readers of the fields.
- **Impact:** Customers pay for passes/promotions whose benefits do not exist (consumer-protection and refund exposure).
- **Fix:** Implement or withdraw the products; write totalSubscribers atomically on (un)subscribe; add delivery and expiry.
- **Verification test:** Subscribing increments totalSubscribers; a promoted video appears in feeds within its impression budget and stops at expiry.

### LIVE-2 — A live session can never be ended on the Vercel deployment: Socket.IO cleanup is not attached
**Severity:** High · **Kind:** Defect · **Area:** Live · **Evidence:** static read · **Detail notes:** findings-draft-15

- **Where:** functions/backend/socket.js (only code that sets isLive=false), attached only in functions/backend/server.js:89; api/index.js and functions/index.js create no socket server; client/liveUser.controller.js:51 'already live'
- **Expected:** Ending or abandoning a stream clears isLive.
- **Actual:** isLive is set by POST client/liveUser/live and cleared only by socket events that cannot run on Vercel functions, so the user stays 'live' forever and cannot go live again; live chat/view counters do not exist.
- **Reproduce:** Static; not run on production (no writes).
- **Impact:** Live feature unusable after the first attempt on the deployed API (mobile only; Zego has no web build).
- **Fix:** Add an HTTP end-live endpoint with server-side TTL, or host sockets off Vercel.
- **Verification test:** Start/stop a live session on a preview deployment and check isLive.

### PLAT-1 — Handlers respond first and write afterwards; on Vercel the work after the response may not run
**Severity:** High · **Kind:** Risk · **Area:** Serverless · **Evidence:** static read · **Detail notes:** findings-draft-15

- **Where:** client/watchHistory.controller.js:88; admin/report.controller.js:180-217; client/liveUser.controller.js (FCM after res); no waitUntil anywhere
- **Expected:** Writes complete before the response or use waitUntil/after.
- **Actual:** Creator earnings, report deletions and notifications happen after res.json.
- **Reproduce:** Cannot reproduce on a long-running local server; confirm on a preview deployment.
- **Impact:** Intermittent lost earnings/deletions/notifications.
- **Fix:** Persist before responding or use platform background primitives.
- **Verification test:** Preview-deployment test of each endpoint with a forced freeze.

### PERF-1 — Every feed/search/aggregate request loads whole collections into memory
**Severity:** High · **Kind:** Risk · **Area:** Scale / cost · **Evidence:** static read · **Detail notes:** findings-draft (D-07), -6 (PERF-1)

- **Where:** util/mongooseShim.js:856-870 (aggregate loads the collection and every $lookup collection); 25+ pipelines in client/video.controller.js; count() reads all documents
- **Expected:** Indexed, paginated queries.
- **Actual:** Cost and latency grow linearly with total data per request; Vercel's 30 s limit and the 8 s Firestore timeout will be hit.
- **Reproduce:** Code read (not load-tested).
- **Impact:** Outage and Firestore bill growth as content grows.
- **Fix:** Replace hot feeds with indexed queries/denormalised counters; cache; move aggregates to a search/analytics store.
- **Verification test:** Load test at 10k videos / 100k users with p95 latency and read counts.

### DL-1 — App Links / Universal Links cannot verify: apex redirect, empty iOS association file, template bundle id
**Severity:** High · **Kind:** Defect · **Area:** Deep links · **Evidence:** deployed (read-only) + static read · **Detail notes:** findings-draft-14

- **Where:** https://youpeak.app/.well-known/assetlinks.json and apple-app-site-association → 308 to www; https://www.youpeak.app/.well-known/apple-app-site-association = {"applinks":{"apps":[],"details":[]}}; AndroidManifest.xml intent filters host youpeak.app; ios/Runner/Runner.entitlements applinks:youpeak.app; iOS bundle id com.live.metube
- **Expected:** Verified association on the host used in the manifest; real AASA with team/bundle id.
- **Actual:** Android verification fails on a redirect; iOS file is empty.
- **Reproduce:** `curl -I` both hosts; read the files.
- **Impact:** Referral and share links open the browser instead of the installed app.
- **Fix:** Serve both files with HTTP 200 from the apex (or use www in the manifest/entitlement), publish a real AASA, align bundle ids.
- **Verification test:** Google Digital Asset Links API and Apple's AASA validator report success.

### MOB-1 — Both mobile apps ship Google's sample AdMob application id
**Severity:** High · **Kind:** Defect · **Area:** Mobile release · **Evidence:** static read · **Detail notes:** findings-draft-16

- **Where:** youpeak/android/app/src/main/AndroidManifest.xml (com.google.android.gms.ads.APPLICATION_ID = ca-app-pub-3940256099942544~3347511713), youpeak/ios/Runner/Info.plist GADApplicationIdentifier
- **Expected:** The project's own AdMob application ids.
- **Actual:** Test ids; real unit ids arrive from admin settings.
- **Reproduce:** Read the files.
- **Impact:** Ads may not serve/earn; policy violation in production builds; rewarded-ad earning depends on ad loads.
- **Fix:** Create the AdMob apps and put their ids in both platform files; add ATT text and SKAdNetwork items on iOS (MOB-3).
- **Verification test:** Release build loads a real rewarded ad.

### FL-1 — Digital goods are sold in the Android/iOS app through Razorpay; the store-billing path is a stub
**Severity:** High · **Kind:** Requirement · **Area:** Store policy · **Evidence:** static read · **Detail notes:** findings-draft-9, -17 (IAP-1)

- **Where:** features/coins/widget/coin_payment_view.dart, features/premium/view/payments_view.dart, core/payment/in_app_purchase/* (empty onSuccessPurchase, IAP-1)
- **Expected:** Play Billing / Apple IAP for digital goods or an approved alternative; Architecture Split says no financial logic in the store app.
- **Actual:** Coins and premium are bought with Razorpay in-app; Google/Apple/Stripe/PayPal/Paystack/Cashfree rows toast 'coming soon'.
- **Reproduce:** Code read.
- **Impact:** Store rejection/removal risk; conflicts with RC-5.
- **Fix:** Decide the compliant flow per store and region; implement server-validated store purchases or remove the entry points.
- **Verification test:** Store pre-review checklist.

### SCR-1 — Seed/import scripts can overwrite production data: no environment guard
**Severity:** High · **Kind:** Risk · **Area:** Operations · **Evidence:** static read · **Detail notes:** findings-draft-17

- **Where:** DB/execute_import.js, DB/fix_video_urls.js, DB/enrich_videos_db.js, DB/execute_video_import.js, DB/execute_non_video_import.js (util/localServerGuard.js protects server.js only)
- **Expected:** Refuse live projects unless explicitly forced.
- **Actual:** They import the Firestore service directly; execute_import writes every DB/*.json (users/admins with plaintext passwords) with seed ids; fix_video_urls rewrites all video URLs.
- **Reproduce:** Code read; not run.
- **Impact:** One mistaken run with the production service account corrupts users, admins and videos.
- **Fix:** Call the guard first, require an explicit flag, hash seed passwords or remove them from the repo.
- **Verification test:** Running a script with production credentials exits with an error.

### SM-2 — Admin comment list and translation management are broken
**Severity:** High · **Kind:** Defect · **Area:** Admin functions · **Evidence:** emulator run + static read · **Detail notes:** findings-draft-8

- **Where:** admin/videoComment.controller.js:16 (`mongoose` not imported → 'mongoose is not defined'); admin/translation.controller.js and language.controller.js call Translation.bulkWrite / Language.bulkWrite / createVersionIfNeeded, which do not exist
- **Expected:** Admin can list comments and upload/edit translations.
- **Actual:** getComment → HTTP 500; CSV upload/edit throw TypeError; no admin UI for languages at all (AFE-17).
- **Reproduce:** Suite 07 (admin getComment 500); `typeof createVersionIfNeeded` is undefined; grep shows no bulkWrite in the shim.
- **Impact:** Localisation content cannot be maintained; comment moderation by list is unavailable.
- **Fix:** Import/implement the missing pieces and add a translations screen and tests.
- **Verification test:** Suite 07 passes for these routes; upload a CSV and read it back.

---

## 5. Medium, Low, Info, blocked and positive findings

Shorter form; the detailed notes are in the cited `findings-draft-*.md` file (each contains the evidence, line references and reasoning).

| ID | Sev | Kind | Evidence | Finding | Where | Fix / next step | Notes |
|---|---|---|---|---|---|---|---|
| AFE-17 | High | Requirement | static read | No admin screens for grievances, local-business-ad approval, payment reconcile/mark-paid, creator funding, media audit, languages/translations (~50 of 185 admin routes have no SPA caller) | admin/frontend/src (no callers); routes in route-inventory.md | Add the screens (grievance SLA queue and payment reconcile first) or remove the dead routes. | findings-draft-10 |
| D-04 | Medium | Defect | emulator run | create() falls back to Date.now() ids: 25 parallel creates kept 5 documents | util/firestoreDb.service.js:339; DL-04 | Use Firestore auto-ids (random 128-bit). | findings-draft |
| D-05 | Medium | Defect | emulator run | updateOne/findOneAndUpdate upsert ignores `upsert` or drops query keys (duplicates, orphan rows) | util/mongooseShim.js:644,815; DL-07 | Implement upsert with query keys in a transaction. | findings-draft |
| D-06 | Medium | Defect | emulator run | $round truncates/returns 0 for array args; $dateToString/$dateDiff return null; $year uses server timezone | util/mongooseShim.js:183-225; DL-08 | Implement or refuse; test IST day boundaries. | findings-draft |
| DT-1 | Medium | Defect | emulator run | Date-range filters compare ISO strings with Date objects and always fail (9 call sites) | util/mongooseShim.js:107-110; MS-02; client/monetizationRequest:172, admin/monetizationRequest:40, admin/premiumPlan:133,252, client/withDrawalRequest:335, admin/videoComment:146, admin/withDrawalRequest:59, admin/report:41, client/userWiseSubscription:380 | Normalise to one type in matchStage. | findings-draft-3 |
| FEED-1 | Medium | Defect | emulator run | Home feed type=all is ordered by ascending _id (oldest first); type=popular sorts on an array | client/video.controller.js:1903,2093; RW-05/06 | Sort on a numeric/date key; compute counts first. | findings-draft-6 |
| WH-3 | Medium | Defect | static read | Creator weekly analytics use unsupported $dateToString and Date-vs-string ranges (empty results) | client weeklyViewsAnalytics | Aggregate by IST day in code. | findings-draft-6 |
| A-01 | Medium | Defect | static read | Global error handler answers HTTP 200 {status:false,message: err.message} (misleading status, leaks internals) | functions/backend/index.js:164-173 | Return 5xx and a generic body. | findings-draft |
| A-02 | Medium | Defect | deployed (read-only) | CORS reflects any Origin with credentials (production preflight from https://evil.example got 204 + ACAO + ACAC) | functions/backend/index.js:15; deployed api.youpeak.app | Allow-list youpeak.app, www., admin. only. | findings-draft, -9 (DEP-3) |
| DEP-2 | Medium | Defect | deployed (read-only) | Only HSTS is sent: no CSP, frame-ancestors/X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy on admin or consumer | vercel.json (root and youpeak/web) | Add headers in both vercel.json files. | findings-draft-9 |
| A-03 | Medium | Risk | static read | Shared app key accepted from query/body, logged by morgan('dev'), compared non-constant-time (it is public by design) | checkAccess.js:6 | Header only; treat as an identifier, not a secret. | findings-draft |
| SEARCH-1 | Medium | Defect | static read | Client search passes raw text into $regex evaluated in JS over whole collections (ReDoS / wrong results for 'c++', '(') | client/video.controller.js:3377,3601,3793,3860,4033,4233,4430,5102; util/mongooseShim.js:116 | Escape or use a prefix index. | findings-draft-17 |
| RC-A | Medium | Requirement | static read | Defaults point to youpeak.in / youpeak-9ff65.web.app instead of youpeak.app domains | setting.js:27,283, membershipPortalUrl, grievance e-mail | Set production values; remove stale defaults. | findings-draft, -17 (DL-2b) |
| RC-C | Medium | Requirement | static read | Free tier: monthly withdrawal cap ₹300 < ₹500 second-payout minimum with the cap enforced → a Free Tasker can never withdraw twice | setting.js:254-261 | Resolve RC-1/RC-4; align minimum and cap. | findings-draft |
| CU-1 | Medium | Defect | static read | Coin↔₹ has several sources (coinsPerInr, coinToInrRate, minCoinForCashOut divisor, hard-coded 0.01) | systemConfig.service.js:39-43; referral.service.js:273,422 | One constant read everywhere. | findings-draft-2 |
| CU-4 | Medium | Defect | static read | Three definitions of 'coins for an ad' (AdRewardCoin rows, settings.adRewardCoins overwritten by the last saved row, system_configs rewards.adCoins); the app shows per-row amounts but the server pays the flat setting | admin/adRewardCoin.controoler.js:13-27; client/adRewardCoin.controller.js | Single source (system_configs). | findings-draft-15 |
| PN-3 | Medium | Risk | static read | Franchise sets the partner's portal and app password (isDefaultPassword:false) and can sign in as the partner | partnerNetwork.service.js createPartner | Send a set-password link; force change. | findings-draft-2 |
| PN-4 | Medium | Risk | static read | Franchise can reinstate a partner auto-suspended for fraud | partnerNetwork.service.js setPartnerStatus | Super-admin approval for fraud suspensions. | findings-draft-2 |
| PN-5 | Medium | Requirement | static read | District unlock cap (₹1,000) applied per commission row, not per district/period | revenueCommission.service.js:35-36 | Clarify cap scope with the document owner. | findings-draft-2 |
| PN-6 | Medium | Requirement | static read | Rates differ: tierUpgrade 15 % (setting.js:181) vs 20 % (revenueSplit) vs document 20 %; partner 50 % local-ad share has no source | setting.js:181,194; revenueSplit.service.js | Pick the authoritative table. | findings-draft-2 |
| RF-2 | Medium | Requirement | static read | applyReferralCode does not check phone-OTP verification; 'new user' is a flag + coin heuristic; device dedupe uses a client string | referral.service.js | Require verified phone and account age. | findings-draft-2 |
| RF-3 | Medium | Requirement | static read | Stage 2 uses lifetime watch minutes, not minutes within 7 days | referral.service.js completeStage2 | Window the minutes. | findings-draft-2 |
| RF-4 | Medium | Defect | static read | releaseHeldReferrals flips the release flag before moving coins; a failure leaves the reward unpaid with no retry | referral.service.js | Move and flag in one transaction. | findings-draft-2 |
| AF-2 | Medium | Requirement | static read | VPN detection = short IPv4 CIDR sample; Terms §4.2 permanent lock only pauses tasks | taskSecurity.service.js | Extend IP intelligence; decide lock policy. | findings-draft-2 |
| AF-3 | Medium | Risk | static read | Heartbeat credit is bounded by wall-clock but not tied to an active playback session (a script pinging every ≤15 s earns hours and the 500-coin bonus) | watchLedger.service.js; watchSession.controller.js | Bind to a server-issued playback session. | findings-draft-2 |
| CP-1 | Medium | Defect | static read | Three different 'partner earnings' numbers across app, partner portal, super admin and franchise dashboards | partner.controller.js:68; partnerNetwork.service; digitalPartner.report | One ledger-based definition. | findings-draft-4 |
| CP-2 | Medium | Defect | static read | Partner report counts unverified franchise-declared fees as revenue; period boundaries use server-local time | digitalPartner.report | Count VERIFIED only; IST boundaries. | findings-draft-4 |
| LB-2 | Medium | Risk | static read | recordImpression/recordClick for local ads are unauthenticated and unlimited | client/localBusinessAd.controller.js | Authenticate, dedupe, rate-limit. | findings-draft-4 |
| MON-2 | Medium | Requirement | static read | Any paid tier sets isMonetization:true, bypassing the admin monetisation criteria | payment.controller.js:499,511 | Gate on criteria. | findings-draft-7 |
| MOD-1 | Medium | Defect | static read | Copyright-flagged videos keep earning creator income (only unlock settlement checks isMonetizable) | watchHistory.controller.js:146-151 | Check the video's moderation state. | findings-draft-7 |
| MOD-2 | Medium | Requirement | static read | Audio transcript (Whisper) screening is not implemented; uploads publish before transcript screening | worker/fingerprintWorker.js | Implement or document. | findings-draft-7 |
| DASH-1 | Medium | Defect | static read | Dashboard 'total channels' counts a collection nothing writes; queries load whole collections and bucket by UTC | admin dashboard controller | Count users.isChannel; IST buckets. | findings-draft-7 |
| CF-05 | Medium | Defect | emulator run | Paid-channel subscription expiryDate is written (+1 month) but never enforced | userWiseSubscription; withholdLockedPlayback.js; CF-05 | Enforce expiry or sell permanent access explicitly. | findings-draft-5 |
| SUB-1 | Medium | Defect | static read | Paid subscription: spendBalance then subscription/credit/history rows in Promise.all outside a transaction; owner gets 100 % | client/userWiseSubscription.controller.js | Single transaction; platform split. | findings-draft-5 |
| PD-1 | Medium | Defect | emulator run | GET client/partner/dashboard rotates and returns the portal password on every call while isDefaultPassword is true | client/partner.controller.js:77-91; MS-06 | Never mutate on GET. | findings-draft-3 |
| ME-1 | Medium | Defect | static read | deleteFromStorage skips R2/Stream/Firebase hosts: deleted media stays public and billable | util/storageHelper.js:88-117 (skips at :112) | Implement provider deletes. | findings-draft-2 |
| ME-2 | Medium | Risk | static read | Presigned R2 PUT has no size limit; no per-user upload quota | client/file.controller.js; cloudflareStorage.service.js | Content-Length condition + quota. | findings-draft-2 |
| ME-3 | Medium | Risk | static read | Coin-locked video URLs are public by URL once known (API withholds them only) | withholdLockedPlayback.js | Signed, short-lived URLs/tokens. | findings-draft-2 |
| P-03 | Medium | Defect | emulator run | Duplicate-account sign-up for an e-mail already used by Google/Apple; social login resolves by non-unique e-mail | client/userFirestore.controller.js:252-335; AP-04 | Unique e-mail index (transaction), verify e-mail. | findings-draft-2 |
| P-04 | Medium | Defect | emulator run | No throttling on user login or admin login (20 wrong passwords evaluated) | client/user.controller.js checkUser; admin.controller.js; AP-05 | Per-account/IP limits and backoff. | findings-draft-2 |
| P-05 | Medium | Defect | emulator run | deleteUserAccount is a soft flag: e-mail, hash, phone and tokens remain; Firebase Auth user not deleted | client/user.controller.js:412; AP-06 | Erase/anonymise per DPDP and store policy. | findings-draft-2 |
| P-06 | Medium | Defect | static read | OTP: 4 digits, 5 attempts, 5 codes/hour per exact e-mail, no IP limit (~0.28 %/h takeover odds); otplogin e-mails any address; fullName unescaped in the e-mail HTML; registration enumeration | client/otp.controller.js | 6 digits, IP + global limits, escape. | findings-draft-2 |
| AD-1 | Medium | Risk | static read | POST /admin/admin/create is unauthenticated by design; ADMIN_SIGNUP_CODE holders can mint an AGENCY_ADMIN bound to any agencyId | admin/admin.controller.js:167-214 | Super-admin-only creation. | findings-draft-2 |
| AD-2 | Medium | Defect | static read | Admin JWT 7 days with no revocation on password change; forgotPassword is a stub that reports success | admin/admin.controller.js | Short tokens + refresh, real reset flow. | findings-draft-2 |
| AD-3 | Medium | Defect | static read | Admin updatePassword has no minimum length | admin/admin.controller.js:254,269 | Shared password policy. | findings-draft-2 |
| AD-5 | Medium | Risk | static read | Cron accepts ?key=<CRON_SECRET> in the query string (logged), non-constant-time compare | cron routes | Authorization header only. | findings-draft-2 |
| SET-1 | Medium | Risk | static read | client/setting removes ~60 named secret keys from the settings document (deny-list); any new secret field leaks to every key holder | client/setting.controller.js:19-72 | Allow-list the public fields. | findings-draft-12 |
| DL-2 | Medium | Defect | deployed (read-only) | https://www.youpeak.app/privacy and /terms render the sign-in screen; robots.txt and sitemap.xml return the HTML shell | youpeak/web/vercel.json | Real policy/terms pages and static robots/sitemap. | findings-draft-14 |
| DL-2b | Medium | Defect | deployed (read-only) | Default privacy/website URL (youpeak-9ff65.web.app) serves a stale unbranded Flutter build; in-app Privacy Policy screen loads it unless production overrides | setting.js:27,283; privacy_policy_web_view.dart | Publish the policy; remove the stale site. | findings-draft-17 |
| A11Y-1 | Medium | Defect | deployed (read-only) | Flutter web semantics tree is empty until the hidden placeholder is activated (no readable text for screen readers); text scaler forced to 0.8 | main.dart:399 | ensureSemantics() on web; remove the scaler. | findings-draft-14 |
| A11Y-2 | Medium | Defect | static read | 318 GestureDetector + 20 InkWell taps vs 16 Semantics / 15 tooltips / 12 semanticLabels | youpeak/lib | Label icon-only controls. | findings-draft-17 |
| AFE-2 | Medium | Risk | static read | Admin JWT, role and shared key live in sessionStorage; PrivateRoute trusts isAuth | admin/frontend/src/util/PrivateRoute.js, setAuth.js | httpOnly cookie or short-lived token; CSP. | findings-draft-10 |
| AFE-18 | Medium | Risk | static read | Admin shell loads jQuery, bootstrap4-toggle (jsdelivr gh path), icon and font CSS without SRI; empty <title>; password input not in a <form> | admin/frontend/public/index.html:25-57 | Self-host or add integrity; CSP. | findings-draft-14 |
| AFE-5 | Medium | Defect | static read | Withdrawal accept/decline show a toast only on success; failures are silent | store/withdraw/withdraw.action.js | Show errors. | findings-draft-10 |
| AFE-10 | Medium | Defect | static read | Partner wallet preview uses a client-side rate that can differ from the server's | PartnerNetwork/PartnerWallet.js | Take the rate from the server response. | findings-draft-10 |
| AFE-14 | Medium | Defect | static read | Redux fetch actions only console.error on failure: an outage looks like an empty table | store/*/*.action.js | Error state. | findings-draft-10 |
| AFE-15 | Medium | Risk | static read | Admin video upload has no client size/type limit; image upload buffered by the 4.5 MB serverless limit | util/AwsFunction.js | Client limits + clear error. | findings-draft-10 |
| AFE-25 | Medium | Defect | static read | 107 of 169 catch handlers only console-log; 1 test file for the SPA | admin/frontend/src | Central error handling + tests. | findings-draft-17 |
| FL-2 | Medium | Requirement | static read | Store app contains coin purchase, premium purchase, promotion purchase, withdrawals, Peak Boost and a partner dashboard although the Architecture Split says no financial logic in the app | youpeak/lib/features | Decide the target split. | findings-draft-9 |
| FL-8 | Medium | Defect | static read | Daily check-in picks 'today' from the device clock while the server uses the IST business day | rewards/controller/earn_reward_controller.dart:261-266 | Use the server's day. | findings-draft-11 |
| FL-9 | Medium | Risk | static read | showLog is `true == true ? log : null`: auth/OTP/payment response bodies (incl. firebaseCustomToken) are logged in every build; 56 print() calls (web console) | core/settings/app_settings.dart:15; auth/api/*.dart; payment_api.dart | Gate on kDebugMode; never log bodies. | findings-draft-11 |
| FL-10 | Medium | Risk | static read | Deep link `videoUrl` is played for the linked videoId (content spoofing; watch credited to another video) | core/deep_link/services/deep_link_services.dart; normal_video_details_controller.dart:383-392 | Resolve media from the API only. | findings-draft-11 |
| FL-15 | Medium | Risk | static read | Zego AppSign and a Stripe test key are shipped to every client via settings | main.dart:480,493; app_string.dart | Token auth for Zego; remove Stripe. | findings-draft-12 |
| FL-18 | Medium | Defect | static read | 101 of 104 HTTP calls have no timeout (loaders can hang) | youpeak/lib/**/api/*.dart | Shared client with timeouts. | findings-draft-13 |
| FL-19 | Medium | Defect | static read | Video upload reads the whole file into memory in one PUT, no progress, 15-minute cutoff | core/file_upload/direct_upload_video_api.dart:41-46 | Streamed/multipart upload. | findings-draft-13 |
| FL-24 | Medium | Defect | static read | Bites audio merge uses executeAsync + two fixed 10 s timers; FFmpeg completion never awaited | bites/controller/create_short_controller.dart:135-138,304-322 | Await the session / use the completion callback. | findings-draft-17 |
| IAP-1 | Medium | Defect | static read | Legacy IAP helper verifies iOS receipts on-device against the sandbox URL (`if (2 == 2)`), 5 µs timeouts, no backend | core/payment/in_app_purchase/in_app_purchase_helper.dart | Delete or implement server validation. | findings-draft-17 |
| CHN-1 | Medium | Risk | static read | Profile edit sends the global AppSettings.channelType (default 1) and may reset a paid channel to public | profile/api/edit_profile_api.dart; userFirestore.controller.js:454-456 | Send only changed fields. | findings-draft-17 |
| MOB-2 | Medium | Risk | static read | android:usesCleartextTraffic=true | AndroidManifest.xml | Disable. | findings-draft-16 |
| MOB-3 | Medium | Defect | static read | iOS placeholder usage strings, no ATT/SKAdNetwork, aps-environment=development, template bundle id | ios/Runner/Info.plist, Runner.entitlements | Fix before submission. | findings-draft-16 |
| MOB-5 | Medium | Risk | static read | Release build falls back to the debug key without key.properties; Crashlytics mapping upload off | android/app/build.gradle | Fail the build; upload mappings. | findings-draft-16 |
| LIVE-1 | Medium | Risk | static read | Zego token04 with publish privilege for any roomId the caller names | client/liveUser.controller.js:307-318 | Bind to the caller's own live session. | findings-draft-15 |
| DOC-1 | Medium | Risk | git history | Docs call history rewrite 'optional' and rotation 'required'; nothing proves rotation happened | HANDOVER.md:288-298, DEPLOYMENT.md §1 | Record rotation evidence. | findings-draft-16 |
| NOT-1 | Low | Defect | static read | Notification 'time ago' uses unsupported $dateDiff/$$NOW (empty text) | client/notification.controller.js | Compute in code. | findings-draft-7 |
| D-08 | Low | Defect | static read | update()/incrementFields() create ghost documents for unknown ids (crediting a deleted user) | util/firestoreDb.service.js | Use update (fails if missing). | findings-draft |
| D-09 | Low | Defect | static read | $unset writes null instead of deleting the field | util/mongooseShim.js | Use FieldValue.delete(). | findings-draft |
| A-04 | Low | Risk | static read | Firebase ID token verified without checkRevoked | middleware/appUser.middleware.js:37 | Enable checkRevoked for money routes. | findings-draft |
| CACHE-1 | Low | Risk | static read | Settings cache TTL (5 min per instance) lets instances disagree after an admin change | util/loadSettings.js | Version the settings doc and check it per request. | findings-draft-18 |
| CU-2 | Low | Risk | static read | findOne('settings',{}) picks an arbitrary document if several exist | util/loadSettings.js | Fixed document id. | findings-draft-2 |
| DR-1 | Low | Defect | static read | Ad-reward rows are capped by maxAdPerDay; daily-reward ladder days can be deleted ('configuration missing' in the app) | admin/adRewardCoin.controoler.js:41; admin/dailyRewardCoin.controller.js | Guard deletes; separate settings. | findings-draft-15 |
| RF-5 | Low | Defect | static read | Referral history type stored as float 5.1; pending credit/count/record are separate non-atomic writes | referral.service.js | Transactional write. | findings-draft-2 |
| AG-1 | Low | Defect | static read | Franchise district uniqueness and code generation are check-then-create | agency controllers | Transactional uniqueness. | findings-draft-4 |
| ADM-2 | Low | Defect | static read | admin/video.deleteVideo hard-deletes only the video document (no comments/likes/reports/storage cleanup) | admin/video.controller.js | Reuse the cleanup path. | findings-draft-7 |
| FRAUD-ADM-1 | Low | Defect | static read | toggleUserRestriction uses user.save() (whole-document overwrite) | admin/fraud.controller.js | Targeted update. | findings-draft-7 |
| FIN-1 | Low | Defect | static read | Legacy createWithdrawRequest deletes the user's earlier declined request (audit trail loss) | client/withDrawalRequest.controller.js:251-253 | Keep declined records. | findings-draft-15 |
| AZ-12 | Low | Defect | emulator run | Franchise/partner logins are refused on the /api/admin/... URL form (allow-list compares /admin/...) — functional only; the SPA uses /admin/... | middleware/admin.middleware.js:69-100 | Normalise the prefix. | findings-draft-8 |
| P-07 | Low | Defect | static read | store login rewrites coin/reward fields from a stale snapshot | userFirestore.controller.js:61-110 | Targeted updates. | findings-draft-2 |
| P-08 | Low | Defect | static read | updateProfile accepts subscriptionCost/videoUnlockCost/ipAddress/mobileNumber without bounds | client/user.controller.js | Validate ranges. | findings-draft-2 |
| DEP-8 | Low | Defect | deployed (read-only) | Grievance officer is a placeholder (grievance@youpeak.in, empty phone) | production settings via GET client/grievance | Publish named officer details. | findings-draft-9 |
| DL-3 | Low | Defect | deployed (read-only) | Every unknown path returns 200 + the shell; no 'link not found' state | youpeak/web/vercel.json | Handle unknown routes in-app. | findings-draft-14 |
| WEB-1 | Low | Risk | deployed (read-only) | All consumer assets (6.4 MB main.dart.js) are served max-age=0, must-revalidate | youpeak/web/vercel.json | Immutable caching for fingerprinted files. | findings-draft-14 |
| AFE-3 | Low | Risk | static read | sessionStorage.dialogueData re-opens the last dialog (with payout details) after refresh | dialogue components | Do not persist row data. | findings-draft-10 |
| AFE-6 | Low | Defect | static read | declineRequest does not URL-encode the reason | store/withdraw/withdraw.action.js | encodeURIComponent / body. | findings-draft-10 |
| AFE-7 | Low | Defect | static read | Accept dialog has editable no-op fields with 'Enter Symbol' placeholder, raw ISO date, icon-only buttons without labels, MM/DD/YYYY dates | WithDrawRequest/*.js | Read-only fields, labels, locale dates. | findings-draft-10 |
| AFE-8 | Low | Defect | static read | Payout detail 'Key:value' split on the first colon truncates values containing ':' | WithDrawRequest/WithDrawDetails.js | Store structured details. | findings-draft-10 |
| AFE-11 | Low | Defect | static read | Failed first load renders nothing (wallet) / generic toast without retry | PartnerNetwork/PartnerWallet.js, DigitalPartner/PartnerPortalPages.js | Error state with Retry. | findings-draft-10 |
| AFE-12 | Low | Risk | static read | Franchise partners list is unpaginated and filtered client-side | Franchise/FranchisePartners.js | Server paging. | findings-draft-10 |
| AFE-16 | Low | Defect | static read | Fake upload progress (0 → 100) | util/AwsFunction.js | XHR progress. | findings-draft-10 |
| AFE-19 | Low | Defect | demo-stack browser run | Super Admin unknown route renders an empty content area | Pages/Admin.js | 404 route or redirect. | findings-draft-14 |
| AFE-20 | Low | Defect | demo-stack browser run | Dashboard chart: unequal date gaps drawn equidistant, Bézier smoothing, no y labels; donut clipped at 1366 px | Pages/dashboard | Time scale, linear lines, responsive donut. | findings-draft-14 |
| AFE-21 | Low | Defect | demo-stack browser run | Controls without an accessible name (up to 35 per config page) | PlatformConfig and list pages | aria-labels. | findings-draft-14 |
| FL-7 | Low | Defect | static read | No ad loaded → Play does nothing silently; ad cooldown lives in local storage | core/ads/google_reward_ad.dart | Show state; server cooldown is authoritative. | findings-draft-11 |
| FL-11 | Low | Risk | static read | Any 6–12 alphanumeric path on youpeak.app is treated as a referral code unless reserved | core/deep_link/referral_link.dart | Validate server-side before storing. | findings-draft-11 |
| FL-13 | Low | Defect | static read | Upload deletes the whole app temp directory; failure shows only 'Upload Failed' | upload/controller/upload_video_controller.dart:261-275 | Delete only own files; show reasons. | findings-draft-11 |
| FL-14 | Low | Risk | static read | Password sign-in posts the password (TLS only) with no server throttling | auth/api/sign_up_api.dart | See P-04. | findings-draft-11 |
| FL-20 | Low | Defect | static read | Referral screen shows a hard-coded '1' and the legacy referralRewardCoins; prints the link to the console | referral/view/referral_program_view.dart | Show real rules. | findings-draft-13 |
| FL-22 | Low | Defect | static read | Search/playlist-search/referral/grievance URLs interpolate raw text without encoding | search_api.dart, play_list_get_with_search_api.dart | Uri.https queryParameters. | findings-draft-17 |
| FL-23 | Low | Defect | static read | Comment/reply/like/share/report calls ignore the response (refusals invisible) | comments/api/*, video/api/like_dislike_api.dart | Surface errors, roll back optimistic UI. | findings-draft-17 |
| FL-25 | Low | Defect | static read | Channel-name check sends the name as the body of a GET (dropped by browsers/proxies) | channel/api/check_channel_name_api.dart | Use query parameters. | findings-draft-17 |
| PP-1 | Low | Defect | static read | premiumPlan.update crashes without planBenefit; no numeric validation; plan deletion with active holders | admin/premiumPlan.controller.js:42 | Validate. | findings-draft-15 |
| CUR-1 | Low | Defect | static read | Default currency can be changed but the app formats ₹/INR and Razorpay is INR-only; default currency can be deleted | admin/currencyController.js | Lock to INR or implement multi-currency. | findings-draft-15 |
| LIVE-3 | Low | Defect | static read | Live list uses $lookup let/pipeline (shim crash); notifications sent after the response | client/liveUser.controller.js:198-286 | See CF-01/PLAT-1. | findings-draft-15 |
| MOB-4 | Low | Defect | static read | Version drift: pubspec 1.0.0+1 vs Android 1.1.2 (2) | pubspec.yaml, android/app/build.gradle | Single version source. | findings-draft-16 |
| DOC-2 | Low | Defect | static read | HANDOVER.md says 'not pushed' and 'smoke-tested against live Firestore'; both outdated | HANDOVER.md | Refresh docs. | findings-draft-16 |
| ADV-1 | Info | Defect | static read | Advertise admin cannot clear an ad unit id (empty values ignored) | admin/advertise.controller.js | Allow clearing. | findings-draft-15 |
| DEP-1 | Info | Positive | deployed (read-only) | Domain split is live: www/apex, admin and api all answer on Vercel over HTTPS | DNS/Vercel | – | findings-draft-9 |
| DEP-6 | Info | Positive | deployed (read-only) | Protected endpoints answer 401 as designed (client/setting without key, cron/daily, internal/fingerprint/queue) | api.youpeak.app | – | findings-draft-9 |
| WEB-0 | Info | Positive | deployed (read-only) | Admin sign-in and consumer onboarding/sign-in render without horizontal overflow at 1920/1366/768/390 px | admin.youpeak.app, www.youpeak.app | – | findings-draft-14 |
| AFE-22 | Info | Positive | demo-stack browser run | 184 role/route/width views of the admin panel loaded real content with no exception, HTTP ≥ 400 or overflow; role redirect, offline message, invalid-token logout, back and refresh work | demo stack | – | responsive-and-ui.md |
| AZ-01..11 | Info | Positive | emulator run | Role isolation holds: franchise and partner logins are refused on all super-admin routes tested, cannot touch another franchise's partners, report/commission endpoints force the caller's scope, only super admin verifies/pays commissions, app tokens ≠ admin tokens, webhooks/cron/worker reject unsigned calls, suspended partners lose access immediately, path tricks do not bypass the allow-list | middleware/admin.middleware.js | – | findings-draft-8 |
| REPO-OK | Info | Positive | emulator run | The repository's own checks pass: 28/28 unit, 115/115 emulator checks (security, visibility, bcrypt, Peak Boost idempotency, payment state machine, withdrawal ledger concurrency, reward caps, media grants, web tasking), 107 Flutter tests; admin build succeeds | tests/ | – | test-and-build-results.md |
| FL-12 | Info | Positive | static read | AppApiClient (timeouts, one token refresh retry, structured errors) and the client watch accumulator are well built | core/network/app_api_client.dart; watch_tracking/* | – | findings-draft-11 |
| FL-21 | Info | Positive | static read | Peak Boost client uses unique request ids reused after network failures; server idempotency is tested (repo suite PB-04) | peak_boost/presentation/peak_boost_bottom_sheet.dart | – | findings-draft-13 |
| DEP-7 | Info | Blocked | deployed (read-only) | Anonymous Firestore list requests for users/admins/paymentTransactions/withDrawRequests/settings/system_configs returned 403; the repository rules allow public get/list on system_configs/*, so the deployed rules may differ — reading the document was refused by the permission policy and I did not look for another route | firestore.rules vs deployed project | Confirm the deployed rules in the console. | findings-draft-9 |
| BLOCK-1 | Info | Blocked | git history | Repository visibility on GitHub (public/private) could not be checked (`gh` not installed, no API call made) | github.com/youpeak24/youpeak | Check in GitHub settings. | findings-draft-12 |
| BLOCK-2 | Info | Blocked | static read | Production `settings` document, Vercel environment variables, Razorpay/Cloudflare/AdMob/Branch consoles, Google Cloud API-key restrictions, App Check and store consoles were not accessible | – | Owner to confirm. | test-and-build-results.md |

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

Ledger (`ledger.md`, `ledger.json`): 1047 files / 177,861 lines: reviewed 460 files / 45,306 lines (25.5%); partial 52 / 21,626 (12.2%); scan-only 535 / 110,929 (62.4%).

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
