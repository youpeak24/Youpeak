# Findings draft part 2 (auth/privacy/admin/partner/referral/anti-fraud/config/media)

## Auth / privacy (emulator-proven: audit-tests/suites/02-auth-privacy.cjs, logs/audit-02-auth-privacy.txt)
- P-01 [Critical, CONFIRMED on emulator] `GET /client/user/aboutOfChannel?channelId=<id>` (user.controller.js:378-390) and `POST /client/user/searchChannel` (user.controller.js:393-409) return **raw user documents** — `passwordHash`, `email`, `fcmToken`, `identity` (device id), and (for legacy accounts) cryptr `password`, `mobileNumber`, `ipAddress`, `taskAttestation`, wallet balances — to any caller holding only the shared app key (compiled into public app/admin bundles). No `safeUser()`/`stripCredentials()`. Prior reports claimed "responses never include credentials".
- P-02 [High, CONFIRMED] User document ids are 13-digit epoch milliseconds (firestoreDb.create falls back to `Date.now()`), so ids are guessable/enumerable, which turns P-01 into bulk harvesting. Also feeds D-04 collisions.
- P-03 [Medium, CONFIRMED] Sign-up integrity: `store` (userFirestore.controller.js:252-335) creates a second user document with the same email when that email belongs to a Google/Apple account (AP-04: 2 documents). Social login then resolves by non-unique `findOne({email})` → account pre-hijack / mis-binding. No email verification on loginType 4 sign-up.
- P-04 [Medium, CONFIRMED] No rate limiting/lockout on password login or `checkUser` (AP-05: 20 wrong passwords all evaluated) and none on admin login.
- P-05 [Medium, CONFIRMED] `deleteUserAccount` is a soft flag (`isActive:false`): email, password hash, phone, tokens remain (AP-06); Firebase Auth user not deleted; Play/App Store account-deletion + DPDP erasure expectations not met. A "deleted" account can still pass `store` login and gets a session token that the middleware then rejects (limbo).
- P-06 [Medium] OTP (otp.controller.js): 4-digit code, 5 attempts per code, 5 codes/hour per exact email string, no IP/global limit → ≈25 guesses/hour against 9,000 codes for password-reset takeover (≈0.28 %/hour) using only the public key; `otplogin` will email any address (sender-reputation / email-bombing vector); OTP email HTML interpolates `fullName` unescaped; `store` confirms whether an email is registered (enumeration). Resend key is read from the Firestore settings doc while `.env.example` lists a `resendApiKey` env; `EMAIL`/`appName` env vars are used but absent from `.env.example`.
- P-07 [Low] `store` login rewrites `coin`, `loginRewardCoin`, `totalRewardCoin`, `isBlock` from a stale snapshot (`buildUserData`, userFirestore.controller.js:61-110) → lost update if balance changes during login.
- P-08 [Low] `updateProfile`/`update` accept `subscriptionCost`, `videoUnlockCost` (`Number()` of anything, no bounds/NaN check), `mobileNumber`, `ipAddress` (client-supplied) unvalidated.

## Admin / panels (code read)
- AD-1 [Medium] `POST /admin/admin/create` is unauthenticated by design; with `ADMIN_SIGNUP_CODE` set, anyone with the code can mint an AGENCY_ADMIN bound to an attacker-chosen `agencyId` (admin.controller.js:167-214) → cross-franchise access. Fail-closed when unset. No password policy at creation.
- AD-2 [Medium] No login throttling; admin JWT 7 d with no server-side revocation on password change (admin existence/active flag re-checked per request); `forgotPassword` is a stub returning "Password reset instructions sent" while doing nothing (misleading success).
- AD-3 [Medium] Admin `updatePassword` has no minimum-length check (only `setPassword` does).
- AD-4 [High, requirement] `cron.controller.js:11-14`: automatic coin→INR midnight settlement (Terms V9 §3.1) "intentionally NOT implemented"; weekly Monday partner payout is manual; payouts are an admin click ("MANUAL_ADMIN_APPROVAL", withdrawalLedger.js header) with no gateway/UTR verification (Developer Spec §3 requires RazorpayX/Cashfree payouts + webhooks).
- AD-5 [Medium] cron accepts `?key=<CRON_SECRET>` in the query string (logged by morgan) and compares non-constant-time.

## Partner / franchise service logic (code read)
- PN-1 [High] `resolveAgency` (geofence.service.js:44-57) matches `districtMatch || stateMatch` on the first agency returned → a user from district X can be attributed to any franchise in the same state; unlock/pass/ad commissions credited to the wrong franchise (requirement: district-scoped). Needs emulator confirmation.
- PN-2 [High] A District Franchise creating a partner (`createPartner`, partnerNetwork.service.js:321-398) self-reports `licenseFeeInr` (0 – ₹10,00,000); `grantDigitalPartnerLicense` immediately credits the partner's ad-credit wallet with that amount — only the commission row is `UNVERIFIED`. No payment verified → franchise can mint ad credits.
- PN-3 [Medium] The franchise sets the partner's portal password and, for a newly created app account, the *app* password too; `isDefaultPassword:false` → no forced change; the franchise can sign in as the partner and request payouts.
- PN-4 [Medium] Franchise can reinstate a partner auto-suspended for fraud (`setPartnerStatus`) — conflict of interest; no super-admin approval.
- PN-5 [Medium/req] `districtPartnerUnlockCapINR` is applied per commission row (revenueCommission.service.js:35-36), not per district/period — document `DOC-20260826-WA0000` says "Maximum Capping: INR 1,000" (ambiguous).
- PN-6 [req] District rates: code default tierUpgrade 15 % (setting.js:181, "V4 adjustment") vs `revenueSplit.DEFAULT_DISTRICT_RATES.tierUpgrade` 20 % vs the only available commission document (20 %). Digital Partner direct 50 % local-business-ad share (setting.js:194) has no source in the available documents.

## Referral / rewards (code read)
- RF-1 [High, requirement] `applyReferralCode` pays the ₹100 + ₹100 Peak-Partner stages to **any** referrer (setting.js:96-100: "stays open to every user"), plus 250 coins to free referrers, plus recurring 20 % of the referee's rewards (RC-B) and 10 % of every coin/premium purchase (setting.js:147-150). Terms V9 §1.5 defines only 250 coins (free) or 10 % of the Starter Pass (paid); Peak Partner terms apply to Peak Partners. Up to ₹202.50 per referral vs ₹2.50 specified.
- RF-2 [Medium] No phone-OTP verification check in `applyReferralCode` although Peak Partner Terms stage 1 requires "verifies phone number"; "new user" = flag `isNewUser` + coin heuristic, not account age. Device dedupe uses the client-supplied `identity` string.
- RF-3 [Medium] Stage 2 uses lifetime watch minutes (`completeStage2(totalWatchMinutes)`), not minutes within 7 days.
- RF-4 [Medium] `releaseHeldReferrals` flips `stageNReleased` (claimOnce) before moving coins; a failure between the claim and `moveBalance` leaves the reward unpaid with no retry/reconciliation. Scans every referral record each run (scale).
- RF-5 [Low] referral history `type` 5.1 stored as float; pending credit, `referralCount` and the referral record are separate non-atomic writes after `claimOnce("referralApplied")`.

## Anti-fraud (code read)
- AF-1 [High] All device signals are self-reported (taskSecurity.service.js header acknowledges); `integrityToken` stored as the string "received", never verified; one-account-per-device keys on a client-supplied `deviceId`. Rewarded-ad completion is claimed by a plain API call (`handleAdWatchReward`, `userTaskReward/adWatch`) with no AdMob server-side verification; the browser refusal only checks `Origin`/`Sec-Fetch-Site` (non-browser clients bypass).
- AF-2 [Medium] VPN/proxy detection = static IPv4 CIDR sample; IPv6 never checked; Terms §4.2 requires permanent lock on VPN use, implementation only pauses tasks — requirement difference.
- AF-3 [Medium] Heartbeat watch credit (watchLedger.service.js) is bounded by wall-clock but not tied to an actual playing video/session → a script pinging every ≤15 s earns watch hours, the 500-coin daily bonus and free level-ups (verify against watchSession.controller).

## Config / money-unit consistency
- CU-1 [Medium] Coin↔INR has several sources of truth: `coinsPerInr`, `coinToInrRate`, `minCoinForCashOut` (used as the divisor in systemConfig.service.js:39-43), and hard-coded `0.01` in referral.service.js:273,422. Editing `coinsPerInr` changes `coinToInrRate` but not the code using `minCoinForCashOut`/`0.01`.
- CU-2 [Low] `findOne("settings", {})` picks an arbitrary document if more than one exists.
- CU-3 [Low] Creator funding (`creatorFunding.service.js`): refund/payout run after `claimOnce`; a crash mid-loop leaves backers unrefunded with the campaign stuck ACTIVE; refunds are coins, not original-method money; feature absent from the supplied requirement documents.

## Media (code read)
- ME-1 [Medium] `deleteFromStorage` (storageHelper.js:88-117) ignores R2/Stream/Firebase hosts ("Unknown storage. Skipping deletion") → deleted videos/thumbnails remain publicly reachable and billable (admin report.controller.js:193-203 relies on it).
- ME-2 [Medium] Presigned R2 PUT has no size limit; grants are per upload but there is no per-user quota → storage-cost abuse by any authenticated user.
- ME-3 [Medium] Coin-locked video URL is withheld by the API only; bucket/Stream objects are public by URL (documented limitation, withholdLockedPlayback.js) → paywall bypass after first purchase/share.
