# YouPeak — Backend Rework Handover

Branch **`fix/deploy-readiness`** (10 commits, branched from `main @ 145ea1ae`, **not pushed**).
`npm run check` → *backend loads OK*. Every change below was smoke-tested against the
live Firestore project `youpeak-9ff65`.

This document is the single source of truth for what changed, how the system is
wired now, every config knob, the new API surface, the deploy runbook, and what's
left to do. Pair it with [`DEPLOYMENT.md`](./DEPLOYMENT.md) (short runbook) and
[`.env.example`](./.env.example) (env var list).

---

## 1. Commits (newest first)

| Hash | Title |
|---|---|
| `e39e67a` | moderation (IT Rules 2021) + grievance + copyright engine |
| `200eef9` | Cloudflare Stream (HLS) pipeline + Firebase Storage for images |
| `5d47d0c` | gateway-agnostic payments — Razorpay built-in, joining fee + tiers |
| `522ad09` | 2-stage referral — holding periods, device dedup, paid-tier bonus, cron release |
| `25ff504` | config-driven revenue-split engine + settings actually load |
| `dd3a490` | membership tier system + scheduled maintenance (Vercel cron) |
| `af2bfd0` | daily caps + reversible coins for like / dislike / comment / check-in |
| `7ea40dd` | enforce 20-ads/day + daily earning cap; server decides coin amounts |
| `3fcfc43` | deploy-readiness — boot, secrets, auth, Firebase init, Firestore queries |
| `523258f` | untrack node_modules, .env files and service-account keys |

---

## 2. Architecture

```
┌──────────────┐   REST (key header / admin JWT)   ┌───────────────────────────┐
│  Flutter app │ ────────────────────────────────► │  Vercel                    │
│  Admin (React)│                                   │  • admin/frontend (static) │
└──────────────┘                                   │  • api/index.js  ─┐        │
                                                    └──────────────────┼────────┘
                                                                       │ wraps
                                                          functions/backend (Express)
                                                          │        │            │
                                              ┌───────────┘        │            └───────────┐
                                              ▼                    ▼                        ▼
                                   ┌────────────────────┐  ┌────────────────┐   ┌───────────────────────┐
                                   │ Firebase           │  │ Cloudflare      │   │ Fingerprint worker    │
                                   │ • Firestore (DB)   │  │ • Stream (HLS)  │   │ (Railway/Render/VPS)   │
                                   │ • Auth (OTP)       │  │ • R2 (raw+img?) │   │  FFmpeg + fpcalc + pHash│
                                   │ • Storage (images) │  └────────────────┘   └───────────────────────┘
                                   │ • FCM              │
                                   └────────────────────┘
```

- **Vercel** serves the admin SPA and runs the whole API as one serverless function
  (`api/index.js` → `functions/backend/index.js`). `vercel.json` has the build,
  rewrites (`/admin/*`, `/client/*`, `/api/*`, `/cron/*` → `/api`) and a daily **cron**.
- **Firebase** = data + auth + push + non-video file storage. No Firebase Hosting,
  no Cloud Functions (`firebase.json` is Firestore + Storage rules only).
- **Cloudflare Stream** transcodes video/shorts to HLS. R2 is the raw fallback.
- **Firestore is accessed through a Mongoose-compatible shim** (`util/mongooseShim.js`
  → `util/firestoreDb.service.js`). The models are unchanged Mongoose schemas; the
  shim translates. See §7 for its limits.

### Request flow for a client call
1. `checkAccess()` middleware validates the shared `secretKey` header (`key`).
2. `settingsMiddleware` refreshes `global.settingJSON` from the Firestore `settings`
   doc (5-min TTL) merged over `functions/backend/setting.js` defaults.
3. Controller runs, using the shim models + the engine services in `util/`.

---

## 3. The critical fixes (commit `3fcfc43` + shim work)

| Problem | Fix |
|---|---|
| **Backend didn't boot** — syntax error in `routes/client/index.js`, 4 routes `require`d a non-existent `middleware/checkAccess` | de-duped the file, fixed the requires |
| **Secrets committed** — Firebase private key *embedded in `firestoreDb.service.js`*, R2 keys hard-coded in 6 files, `secretKey`/`JWT_SECRET` fallbacks everywhere | all removed; `util/validateEnv.js` refuses to boot in production without `secretKey` + `JWT_SECRET`; `util/loadSettings.js` pulls the rest from env/settings |
| **`node_modules` (55k files) + `.env` + service keys tracked**; `.gitignore` was UTF-16 (Git couldn't read it) | untracked, `.gitignore` rewritten UTF-8 |
| **Admin auth = no auth** — password `12345678` always worked, any email containing "agency" auto-provisioned SUPER_ADMIN, JWT signed with a public string, middleware *fabricated* a SUPER_ADMIN when the record was missing | magic passwords gone; bcrypt + legacy-verify-and-rehash; JWT `expiresIn`; one-time bootstrap via `SEED_ADMIN_*`; middleware 401s instead of fabricating |
| **`storage.rules` = `allow read,write: if true`** (world-writable bucket) | locked; public read only on `public/**` |
| **Firebase Admin init race** — a credential-less `initializeApp()` could win | single `util/firebaseAdmin.js`; everything defers to it |
| **Firestore 1.5 s timeout → silent fallback to stale `DB/*.json`**, writes returned fake success | timeout 8 s; fallback OFF unless `ALLOW_LOCAL_DB_FALLBACK=true`; writes throw on failure |
| **`updateOne(... {$inc:{}})` wrote a literal `$inc` field** → like / comment / check-in / coin→INR / withdrawals credited **nothing** | shim `buildUpdatePayload` implements `$inc/$mul/$push/$addToSet/$pull/$unset` + `$gte` guards; `updateMany`, `findByIdAndUpdate`, `findOneAndUpdate` too |
| **`aggregate()` = `$match`-equality + `$sort` + `$limit` only** → `$facet`-based feeds returned nothing | real pipeline: `$match` (`$ne/$gte/$in/$or/$exists`), `$sort`, `$skip`, `$limit`, `$count`, `$facet`, `$group`, `$project`, `$addFields` |
| **`new mongoose.Types.ObjectId(x)` returned `{}`** in ~10 controllers | fixed — instance carries `toString`/`valueOf`/`toJSON` = the id |
| **model name ↔ collection name mismatch** (`History` vs `histories`, `MembershipTier` vs `membershipTiers`, `DailyReward` vs `dailyrewards`, …) | `normalizeCollectionName` map |
| **`.save()` on plain objects** crashed `createVideo`, `shareCount`, `modifyVideo`, tier controllers | replaced with explicit `db.update` |
| **`/client/setting` leaked R2 + payment secrets** | strips every gateway secret + infra key (allowlist-style deny list) |

---

## 4. The 8 engines (Step 3)

All amounts / limits are **config-driven** — see §6. Defaults are the YP-TC-2026-FINAL
values.

### 4.1 `util/rewardEngine.js` — engagement rewards + daily caps
- `todayStr()` (Asia/Kolkata), `ensureDailyReset(user)`, `getLimits(user)` (per-tier),
  `getCreatorRevenueShare(user)`
- `creditReward({userId, kind, historyType, countField, capField, fixedCoins, dedupeVideoId})`
  — enforces the per-action count cap **and** the daily coin cap, partial-credits near
  the cap, writes a `histories` row
- `reverseReward({userId, videoId, historyType, countField})` — un-does a credit
- `HISTORY_TYPE`: `AD_WATCH 2`, `DAILY_CHECKIN 5`, `VIDEO_LIKE 7`, `VIDEO_COMMENT 8`,
  `WATCH_TIME_MILESTONE 9`, `STAGE2_REFERRAL 10`, `ENGAGEMENT_WATCH 11`, `VIDEO_DISLIKE 12`

**Wired into:** `client/user/handleAdWatchReward` (20/day, server-set amount — the
client's `coinEarnedFromAd` is ignored, kept only as `claimedByClient`),
`handleEngagementVideoWatchReward` (2 h milestone → 500), `client/video/likeOrDislikeOfVideo`
(5 likes/day, dislike earns too, like↔dislike reverses), `client/videoComment/createComment`
(2/day, once per video), `client/dailyCoinReward/handleDailyCheckInReward`
(1/day, server picks the amount from the `dailyrewards` ladder),
`client/userTaskReward/*`.

### 4.2 `util/revenueSplit.service.js` — creator / referrer / platform / District Partner
- `settleRevenue({sourceType, grossCoins|grossInr, creatorId, buyerId, agencyContext, ...})`
  — splits per `settings.revenueSplits[sourceType]`, credits creator + referrer in
  coins, records a `revenueLedger` row, files a District-Partner commission
  (`agencyCommissions`, rate from `settings.districtPartnerRates`, `videoUnlock` capped
  at `districtPartnerUnlockCapINR`)
- `resolveReferrer(userId)` — `referralHistories` → `user.referrerId`

**Wired into:** `unlockPrivateVideo` (80/10/10, only if the video `isMonetizable`),
`coinplan/createCoinPlanHistory` + the payment fulfilment (referrer 10%).

### 4.3 `util/referral.service.js` — Peak Partner 2-stage referral
- `applyReferralCode` — new-user / already-applied / self / blocked guards; anti-fraud
  (1 per referred **device** = `user.identity`, ≥3 per IP, per-day cap →
  `FLAGGED_SUSPICIOUS`, no credit); Stage-1 ₹100 → `user.pendingReferralCoin`, held 24 h
- `completeStage2` — 100 watch-min within 7 days → Stage-2 ₹100 → pending, held 48 h
- `releaseHeldReferrals()` — **cron**: after the hold, pending → spendable `coin` +
  `referralRewardCoin` + `totalEarningAmount`
- `handlePaidTierReferral({buyerId, tierPriceInr})` — YP-TC §1.5, referrer gets 10%

**Wired into:** `client/user/validateAndApplyReferralCode`,
`handleEngagementVideoWatchReward` + `checkWatchTimeMilestone` (stage 2),
`creatorTier/upgradeTier` + payment fulfilment (paid-tier bonus), `cron/daily`.

### 4.4 `util/payment.service.js` + `controllers/client/payment.controller.js` — payments
Gateway-agnostic. **Razorpay implemented**, Cashfree/PhonePe stubbed. Env-first creds.

| Route | |
|---|---|
| `POST /client/payment/createOrder` `{userId, purpose, tierId?/coinPlanId?/premiumPlanId?}` | resolves amount, creates gateway order + `created` `paymentTransactions` row |
| `POST /client/payment/verify` `{orderId, paymentId, signature}` | verifies HMAC, marks paid, fulfils |
| `POST /payment/webhook/:gateway` | verifies webhook signature against the **raw body**, fast-200, fulfils (idempotent) |
| `GET /client/payment/status?orderId=` | state |
| `GET /admin/payment/list`, `POST /admin/payment/markPaid` | reconciliation |

**Purposes:** `joining_fee` → `paymentStatus:true` · `tier_upgrade` → assign
`membershipTierId`/`activeCreatorTierId` + paid-tier referral · `coin_plan` → credit
coins + `revenueSplit` · `premium_plan` → `user.plan` with expiry. Fulfilment is
**idempotent** (`fulfilled` flag).

### 4.5 `util/videoPipeline.service.js` — Cloudflare Stream / HLS
- `createDirectUpload()` (one-time URL — large videos upload straight to Cloudflare),
  `uploadFromPath()` (small/server-side), `copyFromUrl()` (R2 → Stream), `getStatus()`,
  `deleteVideo()`, `verifyWebhook()`
- `POST /client/file/stream-upload-url` → `{uploadURL, streamUid, hlsUrl}`
- `POST /stream/webhook` → on transcode-ready sets `video.hlsUrl` / `dashUrl` /
  `videoDuration` / thumbnail, `videoUrl = hlsUrl`
- `GET /client/video/streamStatus?videoId=` → client poll fallback
- `createVideo` accepts `streamUid`; `video.model` gained `streamUid, hlsUrl, dashUrl,
  videoDuration, availableResolutions, streamStatus, storageProvider, rawVideoUrl`

Non-video assets (images, thumbnails, sounds) → **Firebase Storage**
(`util/imageStorage.service.js`, `public/` prefix, world-readable).

### 4.6 `util/moderation.service.js` — content moderation (Vercel-safe)
- `screenText` / `screenVideo` — keyword-blacklist screening (word-boundary, 60 s cache)
  → `moderationStatus: "pending_review"` + `flaggedKeywords`
- `applyReportAutoHold(videoId)` — rolling window (`reportAutoHoldThreshold` /
  `WindowHours`) → auto-hold
- `isMonetizable` / `isPubliclyVisible` / `filterVisible`

**Wired into:** `createVideo` (screen), `client/report/reportToVideo` (auto-hold),
`unlockPrivateVideo` (monetisation gate), and every feed aggregate `$match` now
excludes `moderationStatus in [pending_review, rejected]` + `isCopyrightFlagged`.

Admin: `GET /admin/contentModeration/queue`, `POST /moderate` (approve /
reject-takedown / muteAudio), keyword CRUD, `POST /rescreen`.

### 4.7 `util/copyright.service.js` + `worker/fingerprintWorker.js`
- Vercel side: `queueForFingerprint` (`fingerprintQueue`), `ingestFingerprint`
  (worker callback), `findMatch` (Chromaprint audio similarity + pHash frame hamming),
  `flagCopyright` → `isCopyrightFlagged` + demonetise + notify. Gated by
  `copyrightEngineEnabled` (default **off**).
- Worker side: `worker/fingerprintWorker.js` — deploy off-Vercel; pulls
  `GET /api/internal/fingerprint/queue`, runs FFmpeg/fpcalc/pHash, posts to
  `POST /api/internal/fingerprint/ingest` (header `X-Worker-Secret` =
  `FINGERPRINT_WORKER_SECRET`). See `worker/README.md`.
- Admin: `GET /admin/copyrightModeration/flagged`, `POST /action`
  (override / takedown / warn), `POST /manualFlag`.

### 4.8 Grievance (IT Rules 2021) — `controllers/client/grievance.controller.js`
| Route | |
|---|---|
| `GET /client/grievance` | Grievance Officer contact details (from settings) |
| `POST /client/grievance/file` `{userId, videoId?, category, description}` | files a grievance, starts the **36 h SLA** clock; CRITICAL categories (`ANTI_NATIONAL`, `HATE_SPEECH`, `CSAM`) auto-hold the video |
| `GET /client/grievance/track?grievanceId=` | status |
| `GET /admin/grievance/list` | queue, **overdue** flagged, open/overdue counts |
| `POST /admin/grievance/resolve` `{grievanceId, action, note}` | `in_progress` / `resolve` / `reject` / `takedown` |

### 4.9 Scheduled maintenance — `controllers/cron.controller.js`
`GET|POST /cron/daily` (auth: `CRON_SECRET` Bearer or `?key=`). Vercel Cron calls
`/api/cron/daily` at **00:00 IST** (`vercel.json` → `30 18 * * *`).
Tasks: expire stale Stage-2 referral windows, `releaseHeldReferrals`, optional bulk
daily-counter reset (`?full=1` / `CRON_BULK_RESET`).
> Auto coin→INR settlement at midnight (YP-TC §3.1) is **deliberately not implemented**
> — it would drain the spendable `coin` balance; confirm the intended behaviour first.

### 4.10 Membership tiers — `types/tiers.js`
5 **TASKER** tiers (Free/Bronze/Silver/Gold/Platinum, `₹0/999/2499/4999/9999`,
daily caps `500/2000/4000/12000/16667`) + 5 **CREATOR** tiers (Classic → Platinum VIP,
ad-revenue split `50/60/65/75/80%`). Seeded on boot if `membershipTiers` is empty.
Admin: `GET /admin/membershipTier/getTiers?tierType=`, `POST /store`, `DELETE /destroy`,
`POST /seedDefaults`.

---

## 5. New Firestore collections

Seeded automatically: `membershipTiers`, `dailyrewards` (7-day ladder).
Created on use: `revenueLedger`, `agencyCommissions`, `paymentTransactions`,
`referralHistories`, `grievances`, `fingerprintQueue`, `contentFingerprints`,
`videoUnlocks`, `fraudAlerts`, `checkIns`.

`users` gained: `paymentStatus, paymentVerifiedAt, paymentGatewayRef,
membershipTierId, activeCreatorTierId, pendingReferralCoin, referralApplied,
referrerId, isNewUser, copyrightStrikes, daily*Today counters, lastActivityDate`.
`videos` gained: the Stream/HLS fields + `moderationStatus, isFlaggedAntiNational,
flaggedKeywords, isCopyrightFlagged, copyrightMatched*, takedownReason`.

---

## 6. Configuration

Two layers, merged at runtime (`util/loadSettings.js`): `functions/backend/setting.js`
(defaults, in code) ← the Firestore **`settings`** doc (admin panel) wins for any key
it sets. Run **`POST /admin/setting/applyEconomyDefaults`** once — the live settings
doc has stale template values (e.g. `likeVideoRewardCoins: 100` should be `2`).

### 6.1 Environment variables (`.env.example`)

| Var | Purpose |
|---|---|
| `secretKey` | shared client API key (also in the app build + admin web) |
| `JWT_SECRET`, `ADMIN_JWT_EXPIRES_IN` | admin token signing / expiry (default `7d`) |
| `FIREBASE_SERVICE_ACCOUNT` | service-account JSON (one line) — or `GOOGLE_APPLICATION_CREDENTIALS` |
| `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET` | `youpeak-9ff65`, `youpeak-9ff65.appspot.com` |
| `FIRESTORE_TIMEOUT_MS` | default 8000; `ALLOW_LOCAL_DB_FALLBACK` — dev only, leave unset |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | Stream + R2 |
| `CLOUDFLARE_R2_ACCESS_KEY`, `CLOUDFLARE_R2_SECRET_KEY`, `CLOUDFLARE_R2_BUCKET`, `CLOUDFLARE_R2_PUBLIC_DOMAIN` | R2 |
| `CLOUDFLARE_STREAM_CUSTOMER_CODE`, `CLOUDFLARE_STREAM_WEBHOOK_SECRET` | Stream |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | payments |
| `CRON_SECRET` | Vercel Cron auth; `CRON_BULK_RESET` optional |
| `FINGERPRINT_WORKER_SECRET` | copyright worker auth |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | **one-time** super-admin bootstrap — remove after first login |
| `REACT_APP_SECRET_KEY` | admin/frontend build — same value as `secretKey` |
| `NODE_ENV=production`, `baseURL` | — |

### 6.2 Key settings-doc knobs (defaults in `setting.js`)

`coinToInrRate: 0.01` · `coinsPerInr / minCoinForCashOut: 100` · `maxAdPerDay: 20` ·
`dailyMaxLikes: 5` · `dailyMaxComments: 2` · `dailyMaxEarningCapInCoins: 500` ·
`adRewardCoins: 25` · `likeVideoRewardCoins: 2` · `commentingRewardCoins: 5` ·
`engagementWatchRewardCoins: 500` · `minWatchMinutesForEngagementReward: 120` ·
`minWithdrawalRequestedCoin: 50000` (₹500) ·
`revenueSplits` (per source: creator/referrer/platform %) ·
`districtPartnerRates` + `districtPartnerUnlockCapINR: 1000` ·
`referralStage1Coins / Stage2Coins: 10000` · `referralStage1HoldHours: 24` ·
`referralStage2HoldHours: 48` · `referralStage2WatchMinutes: 100` ·
`referralStage2WindowDays: 7` · `maxReferralsPerDayPerUser: 20` ·
`paidTierReferralPercentage: 10` · `joiningFeeINR: 0` · `paymentGateway: "razorpay"` ·
`moderationEnabled: true` · `reportAutoHoldThreshold: 5` · `grievanceSlaHours: 36` ·
`copyrightEngineEnabled: false` · `copyrightAudioMatchThreshold: 0.85` ·
grievance officer fields.

---

## 7. Known limitations / tech debt

| Area | Note |
|---|---|
| **Firestore shim** | equality + the operators listed in §3; **no transactions** → reward/wallet updates are read-modify-write (daily *coin* cap still bounds abuse; `$gte` guards prevent negative balances). Complex `$lookup`/`$unwind` aggregation is skipped — controllers populate manually. |
| **Feed controllers** | `videosOfHome` / `getShorts` etc. lean on big Mongo aggregate pipelines. The shim now runs `$facet`/`$group`/`$project` so they return data, but `$lookup` (per-video like/subscribe/comment counts) is not resolved — those fields come back empty. A proper rewrite of the feed to native Firestore is still owed. |
| **User passwords** | still `Cryptr("myTotallySecretKey")` (reversible, key overridable via `USER_PW_SECRET`). Migrate to bcrypt with verify-and-rehash on login (same pattern as admin). |
| **Client auth** | users are still identified by a `userId` in the request body + the shared `key`. No per-user token. Real fix: verify the Firebase OTP ID token on login, issue a per-user JWT, derive `userId` from it. |
| **Secrets in git history** | untracked going forward, but the pre-branch `main` commits still contain them. Rotating every key (mandatory anyway) neutralises this; a BFG history rewrite is optional. |
| **Copyright FFmpeg** | needs the external worker deployed; `copyrightEngineEnabled: false` until then. |
| **Auto midnight settlement** | not built (see §4.9). |
| **Dead code** | `admin/backend/`, `admin/frontend/backend/`, `metube/` (untracked ~9 GB dup of the Flutter app) — delete in a cleanup PR. |
| **Secret rotation breaks legacy** | rotating `secretKey` invalidates admin passwords still stored via cryptr (they'll need a reset) and the `USER_PW_SECRET` for user passwords. |

---

## 8. Deploy runbook

1. **Rotate every secret** that was ever committed — Firebase service-account key
   (Console → Service Accounts → generate new, disable `f656fa51…`), R2 keys
   (Cloudflare → R2 → API tokens), Mongo URI (or drop the cluster — unused now),
   `secretKey`, `JWT_SECRET`, super-admin password.
2. **Vercel → Settings → Environment Variables** — set everything in §6.1 (Production).
   Set `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` for the first login, then delete them.
3. `firebase deploy --only firestore:rules,firestore:indexes,storage`
4. `vercel --prod`
5. Verify:
   - `GET  https://<domain>/api/ping` → `{"status":true}`
   - `GET  https://<domain>/client/setting` (with `key` header) → settings, **no secret fields**
   - `POST https://<domain>/admin/login` → token
   - `GET  https://<domain>/api/cron/daily` → 401 (no secret) ✔
6. **`POST /admin/setting/applyEconomyDefaults`** (admin JWT) — writes the T&C economy
   values into the settings doc.
7. Register webhooks:
   - Razorpay → `https://<domain>/api/payment/webhook/razorpay` (events
     `payment.captured`, `order.paid`)
   - Cloudflare Stream → `https://<domain>/api/stream/webhook`
8. (optional) deploy `worker/fingerprintWorker.js` to Railway/Render/a VPS, then set
   `copyrightEngineEnabled: true`.
9. Build the app: `flutter build apk --release --dart-define=API_BASE_URL=https://<domain>/
   --dart-define=API_SECRET_KEY=<secretKey>` — after the rewiring in §9.

---

## 9. Flutter app rewiring (required — the app can't use the new backend as-is)

| File | Change |
|---|---|
| `lib/utils/constant/app_constant.dart` | already reads `API_BASE_URL` / `API_SECRET_KEY` from `--dart-define`; point it at the Vercel domain |
| `lib/utils/common_payment.dart`, `payment_page/*` | the `razorPay()` / `stripe()` functions are gutted stubs — replace with: `POST /client/payment/createOrder` → open the gateway checkout with the returned `checkout` object → on success `POST /client/payment/verify`. Delete the client-side secret-key usage. |
| video upload flow (`create_video*`) | `POST /client/file/stream-upload-url` → upload the file to the returned `uploadURL` → pass `streamUid` to `client/video/createVideo`. Poll `GET /client/video/streamStatus` until ready (or rely on the feed showing it once the webhook fires). |
| player | `videoUrl` is now an HLS `.m3u8` — `better_player_plus` / `chewie` handle it; confirm HLS is enabled in the player config. |
| referral screen | response shape changed: `{status, message, flagged, stage1CoinsPending, holdHours}` |
| grievance / report UI | new `POST /client/grievance/file`, report response has `underReview` |

---

## 10. What's outstanding (priority order)

1. **Legal opinion** on the ₹2,100 joining-fee + referral model before `joiningFeeINR > 0`.
2. Rotate secrets, set Vercel env, deploy (runbook §8).
3. Flutter app rewiring (§9) + rebuild + store submission.
4. Client auth rebuild — Firebase OTP verification → per-user JWT (§7).
5. User password → bcrypt migration (§7).
6. Feed controller rewrite to native Firestore (drop the aggregate `$lookup` reliance).
7. Deploy the fingerprint worker (or launch curated-content-only).
8. Delete dead code: `admin/backend/`, `admin/frontend/backend/`, `metube/`.
9. Decide + build midnight coin→INR settlement if wanted.
