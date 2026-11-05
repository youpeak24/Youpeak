# Findings draft (working notes — consolidated into the main report at the end)

Status legend: CONFIRMED (code read + reproduced or unambiguous from code), SUSPECTED (needs more evidence), CONFLICT (requirement conflict), BLOCKED (no access).

## Data layer (functions/backend/util/mongooseShim.js, firestoreDb.service.js)

- D-01 [Critical, pending emulator proof] `_flattenQuery` (firestoreDb.service.js:175-190) silently drops every `$operator` key and every object-valued filter. `Model.find/findOne/count/deleteMany/updateMany` therefore ignore `$in/$gt/$or/$regex/...` and operate on the *whole collection*. Admin `deleteVideoReport` (controllers/admin/report.controller.js:166-216) is built entirely on `{ _id: { $in } }` / `{ videoId: { $in } }` filters followed by `deleteMany` → would delete every video, comment, like, notification, report, watch-history and playback session, and delete all matching storage objects first.
- D-02 [High] `Model.updateOne/findOneAndUpdate` guard (`matchesQueryGuards`, mongooseShim.js:382-400) is evaluated on a prior read, then the write happens separately → check-then-act race on any `{ coin: { $gte } }` guarded `$inc`.
- D-03 [High] `instance.save()` (mongooseShim.js:706-712) = `create()` = `set(..., {merge:true})` of the *entire in-memory object* → lost updates when a stale loaded doc is saved (balances, counters).
- D-04 [Medium] `create()` falls back to `Date.now()` as document id (firestoreDb.service.js:339) → two inserts in the same millisecond merge into one document.
- D-05 [Medium] `findOneAndUpdate(..., {upsert:true})` (mongooseShim.js:815-817) creates the document from the update payload only; the query's equality keys are not written → upserted docs cannot be found again → duplicates.
- D-06 [Medium] `$round` implemented as `Math.trunc`; `$dateDiff/$timeDiff/$dateToString` return null; `$year` uses server-local timezone (mongooseShim.js:186,225,183).
- D-07 [Medium/scale] `aggregate()` loads the whole collection and every `$lookup` collection into memory per request (mongooseShim.js:856-870); `count()` reads all documents; `find` with sort sorts in memory (firestoreDb.service.js:254).
- D-08 [Low] `update()`/`incrementFields()` use `set(merge)` → updating/crediting a non-existent id silently creates a ghost document (e.g. crediting a deleted user).
- D-09 [Low] `$unset` writes `null` instead of deleting the field.

## Platform / API

- A-01 [Medium] Global Express error handler returns HTTP 200 `{status:false,message: err.message}` (functions/backend/index.js:164-173) → misleading success status for clients/monitors and internal error text leaked.
- A-02 [Medium] CORS reflects any origin with credentials (`cors({origin:true,credentials:true})`, index.js:15) and `app.options("*", cors())`; `functions/index.js` / `server.js` set `Access-Control-Allow-Origin: *` additionally. Auth is header-token based so CSRF risk is low, but origin allow-listing is absent (brief requires API CORS review).
- A-03 [Medium] Shared app key accepted from query string and body (checkAccess.js:6) and `morgan("dev")` logs `req.originalUrl` → key can appear in logs; compare is not constant-time. Key is by design public (compiled into app/admin bundle, see bindAppUser.middleware.js header comment) — it provides no real authentication.
- A-04 [Low] Firebase ID token verified without `checkRevoked` (appUser.middleware.js:37): sign-out/revocation not enforced server-side until natural expiry (≤1h); blocked users are enforced by DB check.

## Requirement conflicts / config consistency

- RC-A [Config] `setting.js` `membershipPortalUrl: https://youpeak.in`, `grievanceEmail @youpeak.in`, `websiteUrl/privacyPolicyLink https://youpeak-9ff65.web.app` vs intended youpeak.app / admin.youpeak.app / api.youpeak.app.
- RC-B [Policy] `taskerEarningsReferralPercentage: 20` — recurring 20 % of every referred tasker's rewards credited to the referrer (setting.js:201) vs V9 §1.5 (direct single-tier: 250 coins or 10 % of Starter Pass; "prohibits passive multi-level commission").
- RC-C [Logic] Free tier: monthly withdrawal cap ₹300 (daily cap 1,000 coins ×30 /100) < ₹500 standard minimum for 2nd+ payouts, with `enforceTierMonthlyWithdrawalCap:true` (setting.js:254-261) → a pure Free Tasker can never make a second withdrawal (acknowledged in code comment).

## D-01 evidence (emulator, isolated — audit-tests/suites/01-data-layer.cjs, log logs/audit-data-layer.txt)
All 8 expectations failed on the Firestore emulator (demo project): DL-01 `$in` ignored (3 of 3 docs returned for a 1-id filter); DL-02 `$gte` ignored (4 of 4); **DL-03 `deleteVideoReport` for ONE report deleted all 3 seeded videos**; DL-04 25 parallel `create()` w/o id produced 5 docs (20 lost to `Date.now()` id collisions); DL-05 3 parallel guarded spends of 100 vs balance 100 → balance -200; DL-06 stale `save()` erased a concurrent +500 credit; DL-07 upsert dropped query keys; DL-08 `$round:[x,0]` returns 0 (array arg → Number([..]) → NaN → 0; latent — not used in controllers).

## D-01 blast radius — handlers that pass operator filters to the shim's non-aggregate API (grep, controllers)
Admin: soundList.controller.js:206-229 (find/deleteMany `_id:{$in}`), soundCategory.controller.js:98-132 (find/deleteMany `soundCategoryId`/`_id` `$in` → deletes ALL sounds and ALL categories), videoComment.controller.js:264 (`deleteMany({_id:{$in}})` → ALL comments), referral.controller.js:28 (`referralCount:{$gt}` ignored), report.controller.js:166-216 (see above), translation.controller.js:191,296 (`languageCode:{$in}`).
Client: video.controller.js:4839-4866 (owner deleting a video that has ≥1 comment runs `LikeHistoryOfVideoComment.deleteMany({videoCommentId:{$in:ids}})` → deletes every comment-like record platform-wide; also `Video.find({_id:{$in}})` at 4839), video.controller.js:1326 (`UserWiseSubscription.findOne({$and:[…]})` → `$and` dropped → returns an arbitrary subscription → wrong "subscribed" state), video.controller.js:620-622 (`userId:{$ne}` ignored), playLIst.controller.js:21,108 (`countDocuments/find _id:{$in}` → validation of videoIds is vacuous), liveUser.controller.js:100,159 (`_id:{$in}`), withDrawalRequest.controller.js:203-205 (`status:{$in}` ignored → any past request of the user matches), videoComment.controller.js:159-162 (`$or` dropped).
