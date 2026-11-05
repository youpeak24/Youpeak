# Findings draft part 8 — endpoint smoke (suite 07) and authorization isolation (suite 08)

Evidence: logs/audit-07-smoke.txt (94 of 104 checks answered correctly), logs/audit-08-authz.txt (11 of 12).

## Smoke (client + admin, seeded emulator data)
Broken endpoints (real defects):
- SM-1 [High] `GET client/videoComment/getComments`, `repliesOfVideoComment`, `GET client/watchHistory/getWatchHistory`, `GET client/userWiseDownload/getdownloadVideoHistory` → HTTP 500 "Cannot read properties of undefined (reading 'indexOf')" (shim `$lookup` with `let`/`pipeline` and no `localField`, mongooseShim.js:230-243). Comments list, viewing history and download history screens cannot load.
- SM-2 [High] `GET admin/videoComment/getComment` → 500 "mongoose is not defined" (controllers/admin/videoComment.controller.js:16 uses `mongoose` without importing it).
- SM-3 [High, static] admin translation CSV upload and key edit: `Translation.bulkWrite`, `Language.bulkWrite` and `createVersionIfNeeded` do not exist (grep: no definition in mongooseShim.js / versionUtils.js) → TypeError 500; `existingDoc.translations.get(key)` also assumes a Mongoose Map. Admin cannot update translations.
- SM-4 [Low] `weeklyViewsAnalytics` is correctly refused for another user's id (403); its data is empty anyway (WH-3).
Seed-dependent "not found" answers (not defects once data exists, but empty-state responses are `status:false`): active languages ("No languages found"), daily reward ladder ("Daily reward configuration missing"), admin translations, admin advertise. Note `harvestActiveLanguages` returns `status:false` for an empty list and the daily-reward screen shows a configuration error when the 7-day ladder is missing — empty states surface as failures.
Passing (answered `status:true` with seeded data): the other 94 checks, incl. all feed/search/list endpoints, tasker dashboard, wallet/withdrawal reads, creator funding, partner dashboard, and 45 admin reads. (Passing means it answers; it does not validate correctness of every field — see CF-01, RW-05/06.)

## Authorization (positive controls)
CONFIRMED GOOD on emulator: (AZ-01/02) franchise and partner JWTs are refused on all super-admin routes tested; (AZ-03) franchise A cannot read/update/suspend/remove franchise B's partner; (AZ-04/05) report/commission endpoints force the caller's own scope; (AZ-06) only super admin can verify/pay commissions; (AZ-07/08) app tokens ≠ admin tokens, user-id mismatch refused; (AZ-09) cron, fingerprint worker, payment/stream webhooks reject unsigned calls; (AZ-10) suspended partner / deactivated franchise lose access on the next request; (AZ-11) case/slash/dot-segment/`/api` path tricks do not bypass the allow-list.
- AZ-12 [Medium/functional] Franchise and partner logins are refused on the `/api/admin/...` form of the URL (allow-list compares `req.originalUrl` with `/admin/...` prefixes, admin.middleware.js:69-100). Works only if the admin SPA calls `/admin/...` — verify against `admin/frontend/src/util/config.js` (see admin frontend section).
