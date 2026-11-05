# YouPeak Phase 2 — remediation queue

Created 2026-10-01 after baseline reconciliation. Working-tree baseline (173 modified + 26 untracked
files, with SHA-256 prefixes) is in `baseline-worktree.txt`. Requirement IDs are those of
`YOUPEAK_REQUIREMENTS_MATRIX.txt`; no new REQ IDs are invented. Phase 2 issue IDs continue the F-series
(F-21 onward) for defects found during Phase 2 verification.

Status key: QUEUED · DONE (tested) · BLOCKED (named dependency/decision) · DEFERRED (lower priority, reason given).
The final state of every item is recorded in `YOUPEAK_PHASE2_REMEDIATION_REPORT.txt`.

| # | Issue | REQ | Sev | Phase-1 status | Current evidence (re-verified 2026-10-01) | Files | Root cause | Fix | Acceptance / tests | Deps | Local? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | F-13 | REQ-0111 | Critical | OPEN | `getVideos` without userId returns `db.find("videos",{})` unfiltered (video.controller.js:1045-1050) | client/video.controller.js | anonymous fallback dumps collection | public-listing filter + pagination, no internal fields | emulator: anon/owner/other x public/private/inactive/held/rejected/flagged/scheduled | util/videoVisibility.js | yes |
| 2 | F-12 | REQ-0111 | High | OPEN (edit declined, now authorised) | getAllLikeThis no moderation/isActive; getVideoList none; searchShorts and searchChannelVideoShortsByUser(type videos/shorts) search `visibilityType: 2` (owner-only PRIVATE) for any caller; detailsOfVideo no moderation filter; channel/playlist lists unfiltered | client/video.controller.js, client/user.controller.js | inline, inconsistent filters | central policy module; apply to every listing/search/detail path | same matrix as #1 | #1 | yes |
| 3 | F-21 (new) | REQ-0120/0111 | High | — | Video bytes on a public R2 domain stay reachable by URL after a video is made private/held | media delivery config | API filtering ≠ object privacy | local: never return playback URL for non-viewable videos; external: signed Stream URLs / private R2 | test: URL withheld | Cloudflare config | partly (BLOCKED externally) |
| 4 | F-18 | REQ-0146/0154 | High | OPEN (~20) | **63** key-only client routes read userId (private reads + writes on others' behalf + viewer context) | routes/client/*, 61 Dart API files | shared public key treated as auth | bindAppUser on owner/actor routes; optionalAppUser (token-bound or anonymous, never caller-chosen id) on browse routes; app sends ID token via AppSession.authHeaders | emulator: key-only, mismatched token, own token per class | none | yes |
| 5 | F-19 | REQ-0152 | High | OPEN | cryptr reversible passwords (userFirestore:74, 223, 360; user.controller); login/signup responses echo password (userFirestore:255, 299) | userFirestore.controller.js, user.controller.js | legacy design | bcrypt `passwordHash`; verify-and-rehash on login; legacy field cleared only after successful rehash; never serialise password/hash | emulator: legacy login migrates, wrong password fails, response has no password, reset writes hash | bcryptjs (present) | yes |
| 6 | F-22 (new) | REQ-0006/0088 | High | (REVIEW blocker 2) | markPaidAndFulfil claims `fulfilled` before effects; errors swallowed, `fulfilledAt` set → partial failure looks complete; webhook amount/currency never compared to order | client/payment.controller.js | single boolean | fulfilmentStatus state machine (PROCESSING/COMPLETED/REQUIRES_RECONCILIATION/FAILED), per-effect idempotency markers committed with the effect, amount/currency check, stuck-PROCESSING recovery via admin retry | emulator: duplicate/simultaneous webhooks, callback+webhook, injected failure then retry without double credit, mismatch, unknown order | — | yes (gateway mocked) |
| 7 | F-23 (new) | REQ-0134/0135 | High | PARTIAL | Peak Boost: debit, creator credit, ledger in separate writes; refund after partial settlement can leave creator credit; same requestId with different payload returns prior result | client/peakBoost.controller.js, revenueSplit | multi-write settlement | single Firestore transaction (debit, creator credit, ledger with platform share, boost doc); payload mismatch → 409 | emulator matrix from Phase-2 brief §10 | rounding = owner decision (BLOCK-01) | yes |
| 8 | F-24 (new) | REQ-0051/0052/0149 | High | PARTIAL | Withdrawals don't reserve funds; "pending exists" check is read-then-write → concurrent requests | client/payout + withDrawalRequest, admin withDrawalRequest | no reservation model | atomic reserve (available→reserved) + per-user pending lock; accept debits reserved; decline releases once; legacy unreserved requests keep old path | emulator: parallel requests, accept/decline races, double decline | — | yes |
| 9 | F-25 (new) | REQ-0033/0038 | High | PASS AFTER FIX (partial) | ensureDailyReset writes outside the tx → a stale reset after midnight can wipe counts already credited by a concurrent request; watch milestone credit not cap-atomic; reverseReward not atomic with balances | util/rewardEngine.js, watchLedger.service.js | non-transactional reset/milestone | transactional reset-if-stale; milestone credit inside a transaction with cap; reversal in a transaction | emulator: concurrent requests across a simulated day change, parallel milestones, unlike/re-like | — | yes |
| 10 | F-14 | REQ-0044 | Medium | OPEN | buying a lower/equal Tasker pass downgrades membershipTierId | payment.controller resolveAmount | no level check | refuse TASKER pass level <= current tasker level (passes do not expire, so current level is never stale) | emulator | — | yes |
| 11 | F-15 | REQ-0041 | Medium | OPEN | Free-tier referrer gets paid-tier 10% | referral.service handlePaidTierReferral | no referrer tier check | V9 §1.5: 10% only for Level 1-4 referrers on Tasker passes; creator-pass referral untouched (no spec) | emulator | — | yes (spec unambiguous) |
| 12 | F-26 (new) | REQ-0046 | High→Missing | MISSING | Starter Pass never grants Ad Credits | payment fulfilTierUpgrade | not built | idempotent grant of tier.adCreditsGranted to a tasker Ad Credits balance (separate unit) + ledger row | emulator | spending UI/packs = external/product | yes (grant only) |
| 13 | F-16 / F-17 | REQ-0075/0101 | Medium | OPEN | Stage 1 without OTP phone; withdrawal without OTP phone | referral.service, payout | policy | — | — | BLOCK-02/03 owner | no |
| 14 | media lifecycle | REQ-0120 et al. | Medium | REVIEW blocker 7 | upload grants not persisted; ownership of object not verified at publish | file/video controllers (user's uncommitted media work) | — | persist grant at presign; require owned grant at createVideo; dry-run orphan report | node tests with mocked R2 | R2 HEAD needs real bucket for full proof | partly |
| 15 | test infra | — | — | — | e2e suite only in session scratchpad | tests/emulator/* | — | move suite into repo, fail-closed guard, npm script | runs green | Java + firebase-tools | yes |
| 16 | analyzer | — | Low | 85 warnings | dead null-aware / unused imports | Dart | — | fix runtime-relevant only | flutter analyze | — | yes (low priority) |

Policy blockers (owner decisions) carried from Phase 1 conflict matrix C-02..C-11 plus BLOCK-01 (Peak Boost rounding),
BLOCK-02 (Stage 1 phone OTP), BLOCK-03 (OTP-phone gate before withdrawal), BLOCK-04 (passive 20% commission).

## Final state (end of Phase 2, 2026-10-01)

| # | Issue | Final | Evidence |
|---|---|---|---|
| 1 | F-13 | DONE | 02:VIS-01, 03:VIS-10 |
| 2 | F-12 | DONE (wider than queued: channel/playlist/subscription/saved lists, details) | 02:VIS-02..05, 03:VIS-11..17, 09:REQ-0111 |
| 3 | F-21 | BLOCKED — EXT-01 (signed Stream / private R2); local URL withholding done | 03:PAY-01 |
| 4 | F-18 | DONE (46 bound + 32 anonymised in Phase 2; 60 Dart files) | 03:AUTH-01..03 |
| 5 | F-19 | DONE (incl. admin plaintext writes; 3 defects in interrupted attempt fixed) | 02:PW-01..10 |
| 6 | F-22 | DONE | 05:PF-01..12, 09:REQ-0088 |
| 7 | F-23 | DONE; rounding BLOCK-01 | 04:PB-01..09 |
| 8 | F-24 | DONE | 06:WD-01..09 |
| 9 | F-25 | DONE | 07:RW-01..07 |
| 10 | F-14 | DONE | 05:PF-10 |
| 11 | F-15 | DONE | 05:PF-06, PF-09 |
| 12 | F-26 | DONE (grant); spending BLOCK-11 | 05:PF-06, PF-09 |
| 13 | F-16/F-17 | BLOCKED — BLOCK-02/03 | — |
| 14 | media lifecycle | DONE locally (grants, ownership, F-28, dry-run report); R2 HEAD needs a real bucket | 08:MED-01..06 |
| 15 | test infra | DONE | `npm run test:emulator` |
| 16 | analyzer | DEFERRED — no runtime-relevant warnings; counts unchanged | dart-analysis-phase2.txt |
| — | F-27 (new) | DONE | 03:PAY-01..03 |
| — | F-28 (new) | DONE | 08:MED-03, MED-05 |
| — | F-29, F-30, F-31, F-32 (new) | OPEN — env var / UX decision / owner key revocation / low | report §2 |
