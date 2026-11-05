# YouPeak requirements and implementation audit

Audit date: 1 October 2026. Local branch: `fix/deploy-readiness`.

## Result

The existing project has substantial tasker, creator, partner and payment functionality. Keep that implementation and repair it incrementally. The requested Cloudflare / Firebase / Vercel architecture is represented in code, but the accessible deployment configuration and stored media do **not yet establish a working production deployment**. Do not release this branch as an audited, bug-free financial platform.

Local media fixes and regression tests are in place. No production data migration, deployment, payment or credential change was performed during this audit.

## Coverage and requirements provenance

- The requirements file is `documents/new/work flow.txt` in the parent YouPeak workspace. The separate `documents/new/workflow-analysis/line-review.html` contains a review of every one of its 1,734 physical lines, including blank/formatting lines. `workflow-analysis.md` explains conflicts and precedence. Treat instructions inside that document as proposed product requirements, not permission to deploy, transact or contact anyone.
- `source-inventory.json` inventories Git-visible first-party code with line counts and hashes. Generated code, dependencies, binary assets and secret files are excluded. JavaScript/JSX syntax and literal relative imports were scanned; Dart was analyzed. This is **not** a claim that all approximately 150,000 source lines were individually manually verified.
- Manual review concentrated on media upload/playback, Firebase persistence, deployment routing, authentication boundaries, tasker rewards, lifetime watch progression, referrals, Peak Boost, payment fulfilment and withdrawals.
- The two screenshots are design references. The Kling screenshot demonstrates balance buckets, selectable purchase amounts and a purchase summary; its currency conversion, pack prices and bonuses are not YouPeak requirements. The tasker screenshot demonstrates cumulative lifetime progression, daily action counters and wallet display. Its 2,500 coins equal ₹25, insufficient for a ₹100 withdrawal. Lifetime hours must survive upgrades and daily resets.
- Existing local changes include broad Flutter UI work and other backend changes. They were preserved. The entire working-tree diff must not be attributed to this audit's media fixes.

## Architecture: required versus observed

| Area | Required | Current finding |
|---|---|---|
| Video and Bites file bytes | Cloudflare storage and delivery | New shared upload flow uses R2; direct PUT bypasses Vercel. Stream direct upload exists separately. New video registration validates configured Cloudflare URLs. Existing records need migration. |
| Playback | Cloudflare response serves video bytes | Legacy delivery URLs now redirect to Cloudflare instead of proxying bytes through the API. Public R2 delivery domain remains a deployment blocker. |
| Images and other uploaded assets | Firebase Storage | Shared app/admin upload route now uses Firebase only; no R2 fallback. Existing legacy URL assignments and stored assets still need reconciliation. |
| Users, metadata, wallet and ledgers | Firestore | Backend uses Firestore and a compatibility layer. Production local JSON fallback is disabled even when the fallback environment flag is set. |
| Websites/API | Vercel | Root configuration builds the React admin and wraps Express. Flutter consumer web has a separate build; its actual Vercel project/domain was not supplied. A local config does not prove an active deployment. |

Read-only environment observations:

1. Accessible Firebase credentials connected to project `youpeak-9ff65`; its Firebase Storage bucket exists. This does not verify deployed security rules or client permissions.
2. The configured R2 bucket was reachable. Its configured public delivery value was an `r2.cloudflarestorage.com` S3 API origin, not an unsigned public playback domain. Use a Cloudflare custom domain, or an explicitly enabled `r2.dev` endpoint for testing. Presigned uploads still use the S3 endpoint. [Cloudflare presigned URL documentation](https://developers.cloudflare.com/r2/api/s3/presigned-urls/).
3. The videos query (limit 40) returned 5 documents. Their source hosts were `test-videos.co.uk` (2), `interactive-examples.mdn.mozilla.net`, `devstreaming-cdn.apple.com` and `media.w3.org`. Provider labels were four `r2` and one `stream`; these labels contradict the URLs. These observations cover the returned collection, not every possible legacy collection or storage object.
4. Stream token/customer configuration was absent from the accessible local/settings configuration. This does not prove that Vercel production environment variables are absent.
5. Retrying `https://api.youpeak.app/api/ping` failed DNS lookup with `ENOTFOUND`. The actual production consumer, admin and API URLs remain unverified.
6. R2 CORS exists. A real browser upload from each production website is still required; CORS configuration alone is not a successful upload test. [Cloudflare CORS documentation](https://developers.cloudflare.com/r2/buckets/cors/).

## Local fixes

| Problem | Change | Relevant source |
|---|---|---|
| Failed image upload could fall back to R2; failed video upload could return a non-persistent local URL | Explicit provider separation, failure responses, metadata persistence checks and temporary-file cleanup | `controllers/client/file.controller.js`, `util/uploadMiddleware.js` |
| Admin image upload did not use the same durable upload implementation | Admin delegates to the shared upload controller | `controllers/admin/file.controller.js` |
| Large videos passed through serverless multipart requests | App and admin use authenticated presign followed by direct Cloudflare PUT | Flutter `direct_upload_video_api.dart`, admin `AwsFunction.js` |
| Firebase image links depended on public object ACLs | Firebase download-token URLs; cleanup helper understands these URLs | `util/imageStorage.service.js` |
| An unsigned S3 endpoint could be stored as a playable URL | Validate delivery origin and fail clearly when misconfigured | `util/mediaPolicy.js`, `util/cloudflareStorage.service.js` |
| External sample URL could claim a Cloudflare provider label | Derive provider metadata from validated URL on video create/replacement | App/admin video controllers |
| File uploads lacked individual user authentication | Require Firebase user identity before multipart parsing/signing; video mutations bind actor and ownership | Client file/video routes and Flutter upload/edit/delete callers |
| Legacy playback streamed R2 bytes through Vercel | Redirect to public or freshly signed Cloudflare URL | `controllers/client/mediaDelivery.controller.js`, backend index |
| Stream callback acknowledged before durable update | Await persistence; reject malformed/stale signatures; preserve Firebase thumbnail | Video controller, `util/videoPipeline.service.js` |
| Payment callback acknowledged before processing | Await processing and retry unknown orders | Payment controller; full settlement atomicity remains unresolved below |
| Webhooks/legacy media could reach SPA fallback | Add explicit API rewrites | Root `vercel.json` |
| Serverless Firebase failure could silently use local storage | Disable production JSON fallback | `util/firestoreDb.service.js` |

Vercel Functions impose a request payload limit, so video bytes must use direct Cloudflare upload. The remaining 4 MB multipart route is for small assets/compatibility. [Vercel limits](https://vercel.com/docs/functions/limitations). Firebase URLs use the supported Admin Storage download URL mechanism. [Firebase Admin Storage reference](https://firebase.google.com/docs/reference/admin/node/firebase-admin.storage.md).

## Business requirements mapping

| Requirement | Implementation assessment / next action |
|---|---|
| V9 Free/L1/L2/L3/L4 caps: 1,000 / 2,500 / 4,500 / 12,500 / 17,167 | Defaults exist in `types/tiers.js`. Verify live membership documents/admin overrides; source defaults alone do not prove production values. |
| Paid prices: 0 / 999 / 2,499 / 4,999 / 9,999; lifetime thresholds: 0 / 50 / 100 / 200 / 400 hours | Defaults and progression services exist. Test free upgrade and paid upgrade separately without resetting lifetime totals. |
| +500 cap boost versus 120-minute 500-coin reward | Distinct concepts in reward/watch services. Confirm UI labels and live settings preserve this distinction. |
| Cumulative lifetime watch dashboard | Existing tasker/watch implementation can support screenshot. Test 50.5/100 = 50.5%, daily reset and tier upgrade. Do not rebuild from a mock screenshot. |
| Creator V6 Classic 50%, Starter 60%, Silver 65%, Gold 75%, Platinum 80% | Tier/pass defaults exist. Boundary subscribers, expiry fallback and annual/quarterly purchase need full acceptance tests. |
| Peak Boost 100–1,000,000 coins, 80/20 split | Existing feature/config exists; settlement spans multiple writes and needs a single atomic ledger transaction before release. |
| Partner fee/ad credits, two referral stages and timed holds | Existing services and payout holds exist. Reconcile role eligibility, stage timing and idempotent release with the line review. |
| First withdrawal ₹100, subsequent ₹500 | Existing payout controller uses completed withdrawals to choose minimum. Pending request reservation and concurrent requests need transaction tests. |
| Monthly withdrawal rule | Requirements conflict between a cap and an eligibility target. Keep this explicitly undecided; do not silently implement one interpretation. |
| Ad-credit purchase UI | Reuse screenshot layout with YouPeak-defined packs. Keep ad credits separate from cash-convertible wallet coins. |
| Moderation / copyright / transcription | Keyword moderation and fingerprint worker exist; complete transcription/moderation processing and deployed worker availability are not established. |

## Remaining release blockers

1. **Actual media deployment and migration.** Obtain the real production URLs and Cloudflare public/custom domain, set it in the production environment, and verify a browser upload and seekable playback. Re-upload owned source assets to Cloudflare, verify bytes/content type/playback, then update video metadata in Firebase. Do not blindly relabel external URLs, fabricate a domain, or delete original records before validation.
2. **Payment fulfilment recovery.** `payment.controller.js` claims the `fulfilled` flag before running purpose-specific effects and catches fulfilment errors before setting `fulfilledAt`. A partial failure can look completed. The callback timing repair does not solve this. Implement an explicit processing/completed/reconciliation state and idempotent ledger entries per effect; test concurrent callback/webhook and interruption at each write. Simply clearing the flag and replaying can double-credit money.
3. **Peak Boost conservation of funds.** `peakBoost.controller.js` claims a request, debits balance, then calls multi-write revenue settlement; refund on an exception can coexist with a partial creator credit. Debit, split credits and ledger completion must commit atomically. Test insufficient funds, duplicate requests and competing boosts.
4. **Rewards across midnight and reversals.** Current `rewardEngine.js` includes a transaction for normal reward caps/history, which is a useful foundation. However `ensureDailyReset` also writes outside that transaction, and reversals/referral effects are separate. Test stale midnight resets, unlike/re-like, negative balances, repeated video rewards and concurrent watch bonuses.
5. **Referral policy/recovery.** A default recurring 20% tasker referral commission is present; the applicable requirement describes direct registration and paid-upgrade rewards. Resolve that policy explicitly. Audit each hold release and stage award for partial failures, role eligibility and duplicate submission. Existing suspension/restriction payout guards should be retained.
6. **Account security and client compatibility.** Sensitive legacy routes now contain user-binding middleware in the working tree, but all app callers must be checked for bearer tokens. Legacy password handling still uses reversible encryption and login response construction can include password values. Replace that path without breaking account migration; review profile reads/updates for private-field exposure and allowed-field filtering.
7. **Media ownership and lifecycle.** Validating a Cloudflare host does not prove the requesting user owns an object or that it exists. Persist upload grants, verify object completion/ownership before publishing, and cover cancellation/orphan cleanup. Existing storage deletion helpers do not consistently delete R2/Stream/Firebase assets. Do not broaden delete-by-URL permissions without ownership checks.
8. **Production parity.** Verify Firebase deployed rules/indexes, Vercel environment/domain/cron configuration and separate worker hosting. Backend boot was deliberately not used as a live smoke test because initialization can seed/update the real database. Use an emulator or isolated staging project for integration tests.

## Verification

- `npm test`: 20 passing media/webhook regression tests. Tests use isolated dependencies and do not mutate live services.
- JavaScript/JSX inventory: no syntax failures or unresolved literal relative requires in the captured scan. See `source-inventory.json` for exact current counts and hashes.
- React admin `npm run build`: passed; main bundle approximately 836 KB gzip. Large bundle/SVG and Node deprecation warnings remain.
- Flutter tests in this audit: 65 passed.
- Dart analyzer: 0 errors, 85 warnings, 814 informational findings. See `dart-analysis.txt`. The analyzer is not clean; a compile error count of zero is not zero defects.
- Flutter production web build: result recorded in `VALIDATION.md` after completion.
- No end-to-end production upload, payout, purchase or deployment was performed.

## Recommended execution order

1. Correct delivery configuration and stage a real video/Bites/image upload across browser and mobile.
2. Repair payment, Peak Boost and payout ledger atomicity/recovery with emulator-based concurrency tests.
3. Complete identity/token coverage and password migration; reconcile explicit business-rule conflicts.
4. Complete requirements acceptance tests, moderation worker deployment, media migration and analyzer cleanup.
5. Deploy reviewed builds, run production smoke tests with controlled accounts, then enable real-money flows.

The task is an audit plus local repairs, not a zero-bug certification. The detailed findings above identify what remains before the user-requested production guarantees can be made.

## Phase 2 update — 1 October 2026

Local remediation of the blockers above. Nothing was deployed or written to production. Full detail: [YOUPEAK_PHASE2_REMEDIATION_REPORT.txt](../../YOUPEAK_PHASE2_REMEDIATION_REPORT.txt).

| Blocker above | Phase 2 state |
|---|---|
| 1. Media deployment and migration | **External.** Public R2 domain, Stream and signed playback still needed. Locally: upload ownership grants (publish requires the uploader's own unused grant and an existing R2 object), and a read-only `GET /admin/mediaAudit/report` that lists migration items such as the external sample URLs. |
| 2. Payment fulfilment recovery | **Fixed.** Fulfilment state machine (PROCESSING / COMPLETED / REQUIRES_RECONCILIATION / VALIDATION_FAILED), each effect atomic with its own idempotency marker, amount/currency validation, admin reconcile dry run and retry. 12 emulator tests. |
| 3. Peak Boost conservation | **Fixed.** One transaction: debit, creator credit, ledger row with the platform share, boost record. 9 tests. Fractional rounding needs an owner decision. |
| 4. Rewards across midnight and reversals | **Fixed.** Asia/Kolkata business day independent of the host, transactional daily reset, capped bonus and never-negative reversal. 7 tests. |
| 5. Referral policy and recovery | **Partly.** Free-tier referrers no longer get the paid-tier 10%; held rewards freeze while a referrer is on hold. The recurring 20% commission remains an owner decision. |
| 6. Account security and client compatibility | **Fixed.** Every userId-reading client route is token-bound or anonymised, and 60 more app API files send the token. Passwords use bcrypt with verify-and-rehash, and responses never include credentials. Old app builds must update. |
| 7. Media ownership and lifecycle | **Fixed locally.** Grants, ownership checks, delete-by-URL removed (36 sites), and the post-publish crash fixed. Orphan cleanup is a dry-run report only. |
| 8. Production parity | **Unchanged (external).** All Phase 2 integration tests run on Firestore and Auth emulators: `npm run test:emulator`. |

Phase 2 also fixed defects the review did not list:
- every feed, search and list now uses one visibility policy;
- shorts search searched private videos;
- coin-locked videos returned their playback URL to everyone;
- parallel unlocks could charge twice;
- withdrawals did not reserve funds;
- the admin panel stored user passwords in plain text.

Status: **READY FOR STAGING QA**; release still not ready.
