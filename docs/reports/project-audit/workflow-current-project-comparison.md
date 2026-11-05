# Workflow versus current project — 9 October 2026

## Scope and evidence

Input: `E:/Legendary One/youpeak/documents/new/work flow.txt`, all **1,734 lines**, and the two supplied screenshots. Compared against the current working files in `E:/Legendary One/youpeak/source`, including uncommitted changes. Git HEAD: `894b2f4e0f17ec515c0d09d8574d45bb6f1cd7ef`; HEAD alone does not describe this checkout because it has extensive local changes.

This is a **static requirements comparison**, not a production acceptance test. No application source, settings, money, deployments or production data were changed. No new test suite was run. An implemented code path is not proof that its deployed configuration or real device flow works. Earlier audit/test results are not reused as proof of the current files.

Every workflow line is retained in `workflow-comparison/line-ledger.csv`, with its original text, section, classification and comparison reference. Table fragments are interpreted together; blank lines, page footers, isolated bullet marks and diagram scaffolding are accounted for without inventing functional requirements. Section-level comparison is deliberately distinguished from testing every line of application source. The ledger is traceability, not 1,734 independent passed tests.

Status vocabulary: **MATCH** = corresponding static implementation/default; **PARTIAL** = some layers exist; **GAP** = required path not found in the reviewed source and targeted repository searches; **CONFLICT** = document versions or implementation disagree; **UNVERIFIED** = requires runtime, account/configuration, visual or external service evidence. A row can have more than one status.

Code references below use repository-relative paths and one-based line numbers. The source manifest records hashes of evidence files so later edits can be distinguished from this review.

## Main conclusions

1. **2,000 / 5,000 / 10,000 Peak Boost presets are explicitly specified**, at workflow lines 1534–1542 and 1608–1610. They are fan tips, not the ₹49–₹3,000 promotion packages. Removing them merely because they were thought absent from documents would contradict this supplied workflow.
2. Tasker V9 defaults, cumulative watch-hour targets, daily counters and the dashboard broadly correspond to the Tasker screenshot. Payout completion, verified advertising and hard anti-fraud enforcement remain separate gaps.
3. The KLING screenshot's top-up amounts, prices and 730-day validity have already been copied into backend settings, but **a complete ad-credit top-up purchase, separate balances and expiration flow were not found**. Configuration is not a finished feature.
4. The workflow combines multiple conflicting generations of terms. Old V2 caps and payout rules cannot all be implemented alongside V9 unchanged. The final blueprint's pay-before-access rule conflicts with V9's Free Tasker and free watch-hour progression.
5. Material incomplete areas: midnight settlement, automated UPI payouts, phone-verified referral/payout eligibility, local-ad credit consumption, promotion delivery/expiry enforcement, Whisper transcription, and a working compatible fingerprint pipeline.

## A. Digital Partner TRS — lines 1–89

Lines 52–89 restate the same requirements as lines 1–50. They are duplicate obligations, not a second license charge or second reward. Current storage is Firestore, not SQL. Equivalent collection/document fields count as an implementation; literal snake-case table names are not required unless an external integration depends on them.

| Ref | Workflow lines | Requirement | Current comparison / evidence |
|---|---|---|---|
| DP-01 | 7, 10–16, 55, 57–63 | Partner role/status and linked profile | MATCH/PARTIAL. `util/digitalPartner.service.js:88` assigns `isDigitalPartner`, `partnerStatus: ACTIVE`, linked profile with fee, transaction, credits and counters. Firestore replaces relational tables. Pending lifecycle and profile counters are not fully established by this assignment alone. |
| DP-02 | 20–22, 65–67 | ₹25,000 inclusive-GST license; payment-triggered activation and credits | MATCH/UNVERIFIED. `setting.js:101` and `controllers/client/partner.controller.js:44` default to ₹25,000; `controllers/client/payment.controller.js:69,400` resolves and fulfils the license; `util/digitalPartner.service.js:85` grants role/profile once in a transaction. Tax-inclusive display does not itself prove invoice/GST accounting. |
| DP-03 | 24–26, 68–70 | Unique referral links and installation attribution | PARTIAL. Referral generation exists; `youpeak/lib/core/deep_link/services/deep_link_services.dart:44` consumes query/path codes and remembers them. Real deferred attribution through store install/reinstall and link ownership/collision behaviour need device tests. A code application is not proof of an installation. |
| DP-04 | 28–34, 71–77 | ₹100 registration/profile milestone and ₹100 at 100 minutes within seven days | PARTIAL/CONFLICT. `util/referral.service.js:105,175,242,280` uses code application as Stage 1, creates the signup-based deadline and checks 100 minutes for Stage 2. It does not enforce completed profile or phone OTP inside the service. See partner terms section for hold/release differences. |
| DP-05 | 36–38, 78–80 | Submit local banners/video, region/unsold inventory; debit ad credits per impressions/clicks | PARTIAL/GAP. `controllers/client/localBusinessAd.controller.js:19,73,102,115` accepts creatives, filters region and increments counters. No debit from partner `adCreditsBalance` is performed by those counting paths; no CPM/CPC billing or unsold-inventory allocation was found. Existing APIs must not be described as wholly absent. |
| DP-06 | 41,82 | Hardware/IP/subnet duplicate prevention | PARTIAL. `util/referral.service.js:129` checks stored identity and exact IP (three referrals/day for a referrer); `util/taskSecurity.service.js:160` binds a self-reported device ID. Exact IP is not subnet detection; client identity is not verified hardware attestation. |
| DP-07 | 42,83 | Exclude bots, headless browsers and zero-watch accounts from both phases | GAP/PARTIAL. Basic velocity/network checks exist, but Stage 1 can be credited before any watch minutes. No proven headless/browser risk verdict was found. This also conflicts with the document's immediate-registration reward. |
| DP-08 | 43,84 | Suspend partner and freeze payouts after fraud threshold | MATCH/PARTIAL. `util/referral.service.js:71,216` suspension helper; `util/payoutHold.js:15` prevents payout of suspended/restricted accounts. Threshold effectiveness requires fraud tests; this is review suspension, not guaranteed permanent confiscation. |
| DP-09 | 46–49,86–89 | Upgrade/dashboard/ads/fraud APIs | PARTIAL. Equivalent routes exist at `/client/partner/upgrade`, `/client/partner/dashboard`, `/client/localBusinessAd/submit` and admin fraud routes. `routes/client/partner.route.js:9`, `routes/client/localBusinessAd.route.js:8`; literal `/api/v1/...` aliases are not established. An API-path naming difference is not a missing feature by itself. |

## B. Legacy VIP fragment and district transcript — lines 92–129

| Ref | Lines | Comparison |
|---|---|---|
| OLD-VIP | 92–95 | CONFLICT. Old subscriber brackets/prices/splits differ from the complete V6 table. They are not current defaults. The ₹600/₹400/₹300 columns have no heading, so their meaning cannot be safely inferred. |
| DIST-01 | 101–104,122–129 | MATCH/PARTIAL. District agency, partner network and role-specific dashboards exist in `util/partnerNetwork.service.js:297,321`, `controllers/admin/franchisePortal.controller.js:50,142` and `controllers/client/partner.controller.js:50`. Counts represent application/referral records, not independently verified store-install events. API fetches are not an automatic live subscription. |
| DIST-02 | 106–109 | CONFLICT. Transcript says install-day ₹100; TRS says registration/profile; later partner policy says phone-verified registration with 24-hour hold. Current service triggers on applying a code. |
| DIST-03 | 111–118 | Forecast, not guaranteed income. Two fully qualified referrals/day × ₹200 ×30 = ₹12,000; 30/month = ₹6,000. 100 partners ×2/day ×30 =6,000/month. Install alone does not qualify Stage 2, and holds/fraud/expiry affect earnings. |
| DIST-04 | 114,125 | MATCH/UNVERIFIED. `setting.js:184` sets district ad-revenue share to 10%; `util/revenueSplit.service.js:149` can plan district commission when an agency context is supplied. The transcript does not prove that every deployed ad event supplies that context or that the base is verified net advertising income. |

## C. Tasker terms V2 versus V9 — lines 135–280,337–493,560–761,1356–1512

The old August terms repeat, including the V2 block near the end. **V9, September 10, is the later Tasker table in this input.** Current defaults deliberately follow it. This is a comparison baseline, not permission to silently overwrite the older legal pages or runtime settings.

### Tier-by-tier comparison

| Tasker | Price | Purchased ad credits | Lifetime target | Ads / likes / comments daily | V9 coin cap | Current default | V9 daily/monthly ₹ |
|---|---:|---:|---:|---|---:|---:|---|
| Free | 0 | 0 | Entry |20 /5 /2|1,000|1,000|10 /300|
| Level 1 |999|1,000|50h|20 /10 /5|2,500|2,500|25 /750|
| Level 2 |2,499|2,500|100h|20 /20 /10|4,500|4,500|45 /1,350|
| Level 3 |4,999|5,000|200h|20 /40 /20|12,500|12,500|125 /3,750|
| Level 4 |9,999|10,000|400h|20 /60 /30|17,167|17,167|171.67 /5,150 shown in doc|

Evidence: `functions/backend/types/tiers.js:24`. These are defaults, not a read of production `membershipTiers`. Stored active tiers/admin overrides can differ. Internal `level` values are 1–5, with 1 = Free; the product names correctly remain Free and Level 1–4. IDs still contain bronze/silver/gold/platinum for compatibility.

V9 Level 4 monthly arithmetic is **₹171.67×30=₹5,150.10**, not exactly ₹5,150. Current dashboard fallback rounds the monthly cap to ₹5,150 (`controllers/client/tasker.controller.js:26`). Define whether whole-rupee rounding is intentional. Potential monthly maximum is not assured income.

| Ref | Requirement / workflow lines | Current comparison |
|---|---|---|
| T-01 | 562,565–569: coin conversion and paid passes as advertising credits | MATCH/PARTIAL. Default 100 coins/₹1; purchased Tasker pass grants a separate `users.adCreditsBalance` and `adCreditLedger`, `controllers/client/payment.controller.js:517`. Advertising service consumption is incomplete (DP-05). Classification text is not proof of regulatory compliance. |
| T-02 | 570–572,601–736: daily caps include +500 boost | MATCH. Defaults match V9; `util/rewardEngine.js:130` applies configurable boost behaviour and tier limits. Admin configuration must be checked. Old V2 caps 500/2000/4000/12000/16667 conflict with these. |
| T-03 | 574–576: like2, unlike/dislike2, comment5 | MATCH/PARTIAL. `util/rewardEngine.js:115` reward defaults and `:251` transactional credit path exist. Product meaning of unlike versus dislike must be explicit; toggling repeatedly must not become repeated rewarded actions. End-to-end counts/reversal/reward dedup need tests, not just matching rates. |
| T-04 | 577,580–582: variable ad rewards, universal20/day | PARTIAL. Daily count/cap transaction exists. Tier settings can override the ad limit; universal20 is not an immutable global ceiling. `util/taskSecurity.service.js:224` admits that native claims are client-reported until ad-provider server-side verification is installed. Web claims are rejected. |
| T-05 | 578–579:120 minutes earns500, subject to cap | MATCH/PARTIAL. `util/watchLedger.service.js:143` grants a once/day history-protected, cap-bounded reward. If only200 coins remain, only200 are credited. Reaching120 minutes when cap is already full grants0. No blanket promise of500 irrespective of cap. |
| T-06 | 589–600: cumulative50/100/200/400h OR paid upgrade | MATCH/PARTIAL. `util/rewardEngine.js:173` advances next tier using lifetime minutes; `util/watchLedger.service.js:190` invokes it. Lifetime time is preserved; free watch-hour upgrade does not itself grant purchased advertising credits. Paid fulfilment grants them. Automatic upgrade currently advances one next tier per call; large imported balances need migration/backfill verification. |
| T-07 | 585–588: Free250 referral; Level1–4 direct10% pass referral | MATCH/CONFLICT. Free250 and10% tier-based referral planning exist (`util/referral.service.js:245,404`). A watch-earned Level1–4 referrer qualifies even without a paid pass. The wording “paid tiers” does not settle whether actual purchase is required. Native Stage1/2 rewards also stack, including for non-partners; see REF-06. |
| T-08 | 738: automatic midnight coin-to-INR settlement | GAP. `controllers/cron.controller.js:13` explicitly says automatic settlement is not implemented. Current Tasker payout can convert a shortfall on request (`controllers/client/payout.controller.js:111`), which is different. Need an agreed separate coin/cash ledger model before implementing a sweep. |
| T-09 | 740–744: first₹100, later₹500 | MATCH/PARTIAL. Tasker payout and legacy withdrawal route select first minimum until a completed payout exists; declined/pending attempts do not consume first-payout status. `controllers/client/payout.controller.js:82`, `controllers/client/withDrawalRequest.controller.js:233`. Partner first-payout behaviour differs from its own policy. |
| T-10 | 745–747: minimum AND monthly income-cap eligibility | CONFLICT. Current Tasker path treats the monthly figure as a **maximum per request**, not balance you must first reach or a cumulative monthly payout limit (`controllers/client/payout.controller.js:97`). Pure Free Tasker maximum₹300 is below later minimum₹500, so a second request becomes impossible without upgrading/exemption. Creator/partner accounts are exempt. This materially affects withdrawal usability. |
| T-11 | 748–749: bank/UPI processing | PARTIAL/GAP. Validated UPI/bank inputs and atomic reservation exist. Response is a PENDING request for admin approval, not a completed bank transfer. No automated gateway payout integration found in the reviewed source/search. |
| T-12 | 751–758: VPN prohibition, permanent freeze/forfeiture | PARTIAL/CONFLICT. Task attestation mainly pauses task rewards until signals clear (`util/taskSecurity.service.js:183`); referral fraud can suspend/restrict. Permanent seizure of all balances/pass/pending payouts is not the same policy. No universal irreversible confiscation path was established. |

## D. Promotion rate card — lines 285–334

| Plan in document | Price ₹ | Estimated impressions | Days | Current default |
|---|---:|---|---:|---|
| Starter Plan |49|2,000–2,500|1|Matches|
| Basic Plan |99|3,000–3,500|2|Matches|
| Pro Starter |199|3,000–5,000|2|Matches|
| Boost Plan |249|3,000–8,000|4|Matches|
| Weekly Mega Plan |1,000|50,000–75,000|7|Numeric match; named Weekly Mega|
| Monthly Pro Plan |3,000|200,000–250,000|30|Numeric match; named Monthly Pro|

Evidence: `functions/backend/setting.js:156`. Names are existing transaction keys; do not rename without compatibility handling.

| Ref | Lines | Current comparison |
|---|---|---|
| PROMO-01 | 285–314 | MATCH/PARTIAL. Settings and plans endpoint supply prices, duration, min/max impressions; `controllers/client/videoPromotion.controller.js:20`. Global/category/best-value descriptors are not supplied in this endpoint. |
| PROMO-02 | 315–334 | PARTIAL. `youpeak/lib/features/video_promotion/view/promote_video_view.dart:119` shows plan picker price/days/reach. Reach copy comes from a hard-coded map at line23 rather than API min/max; admin changes can leave UI stale. No complete ROI/comparison/benefit display established. |
| PROMO-03 | Purchase implied by packages | MATCH/PARTIAL. Own-video check, server price and term snapshot at `controllers/client/payment.controller.js:86`; signed Razorpay flow and idempotent activation at line453. Error results in the Flutter loading path become empty lists (`promote_video_view.dart:64`) rather than distinct failure/empty states. |
| PROMO-04 | Automated7/30-day growth, placement, delivery | GAP/PARTIAL. Activation writes `isPromoted` and expiry (`payment.controller.js:466`); searches for `videoPromotions` found payment/client/admin CRUD but no campaign impression accounting, pacing, feed prioritisation or expiry worker. A flag/target does not deliver the estimated impressions. Runtime delivery is unverified. |
| PROMO-05 | Campaign lifecycle | GAP/RISK. `controllers/admin/videoPromotion.controller.js:56` approving resets start/expiry; rejecting only sets campaign status and does not clear the video's promotion flag. No demonstrated handling for multiple overlapping campaigns or refund/dispute/delivery shortfall. |
| PROMO-06 | ROI comparison | Document arithmetic needs careful wording. Starter30days costs₹1,470; CPM is₹19.60–₹24.50, not precisely₹20–₹24. Monthly CPM₹12–₹15. The3.3× ratio uses paired corresponding estimate endpoints; independent range extremes allow2.67×–4.17×. Impressions are estimates, not fabricated observed results or a guaranteed financial return. |

## E. Creator VIP V6 — lines 497–554

| Pass | Subscriber bracket in document | Quarterly₹ | Annual₹ | Creator/company split | Current defaults |
|---|---|---:|---:|---|---|
| Classic |All, default|0|0|50/50|Matches|
| Starter |<5,000|1,499|4,999|60/40|Matches|
| Silver |5,000–25,000|899|2,999|65/35|Matches|
| Gold |25,000–100,000|449|1,499|75/25|Matches|
| Platinum |>100,000|0|0|80/20|Matches except boundary interpretation|

Evidence: `functions/backend/types/tiers.js:82` and `util/creatorPass.js:64`.

| Ref | Comparison |
|---|---|
| VIP-01 | MATCH/PARTIAL. Timed quarterly/annual checkout, renewal extension and expired-pass fallback to Classic exist at `util/creatorPass.js:104,121`, `controllers/client/payment.controller.js:496`, `util/rewardEngine.js:221`. Current user billing options exist; real renewal/deployment tests needed. |
| VIP-02 | CONFLICT/PARTIAL. Doc limits launch offer to first1,000 creators **or3–6 months**. Current `qualifiesForIntro`, `creatorPass.js:51`, counts distinct paid users per tier and preserves intro price on renewal; no elapsed3–6month cutoff. Checking qualification before payment is not an atomic reservation of the last introductory slot. |
| VIP-03 | CONFLICT. Document renewal wording refers to grandfathering during active term; source preserves intro price for any earlier qualifying buyer. Upper subscriber boundaries overlap in display; listing checks `<= maxSubscribers` (`creatorTier.controller.js:24`) whereas checkout only checks minimum (`creatorPass.js:88`). Exactly5k/25k/100k behaviour needs one agreed rule. |
| VIP-04 | EXTRA RULE. Per-video maximum earnings1000/2000/5000/10000/25000 are current source defaults but not specified by this supplied V6 table; source itself says carried over. Verify other project documents before removing. |
| VIP-05 | CONFLICT. Screenshot “instant In-App Purchase” versus later workflow web-only pass payment. Current `youpeak/lib/core/membership/membership_portal.dart:10` opens external membership portal. Do not implement both checkout policies without resolving this. |

## F. Vibe Media website copy — lines 765–892

| Ref | Lines | Comparison |
|---|---|---|
| VIBE-01 | 769–782 | UNVERIFIED/OUTSIDE CHECKOUT. Primary/alternative hero, strategy-call and work CTAs are website copy for Vibe Media, not instructions to replace YouPeak consumer screens. No corresponding site implementation located in this source checkout by targeted filenames/text searches. |
| VIBE-02 | 783–835 | Same scope: four services, service headlines/descriptions/bullets need a separate website content checklist. Implementation not established here. |
| VIBE-03 | 836–850 | About, mission, trend-first/data-backed/execution pillars: no implementation established in this checkout. |
| VIBE-04 | 851–866 | Explicit **sample testimonials**. Do not present Suresh/Priya/Karthik statements as verified real customer endorsements. |
| VIBE-05 | 867–883 | SEO title/description/favicon/OG; required name/email/phone, service and budget dropdowns, optional brief; compressed lazy videos/WebP/Calendly-or-WhatsApp. All remain unverified outside the reviewed app/backend; alternative CTA choices are not all mandatory. |

## G. Peak Partner payout policy — lines 899–955

| Ref | Lines | Current comparison |
|---|---|---|
| REF-01 | 906–926 | PARTIAL/GAP. Default Stage1₹100 held24hours matches amount/hold (`util/referral.service.js:46`). Service has no required `verifiedPhoneNumber` or completed-profile check before crediting. Shared token authentication also accepts password/social accounts; token validity is not phone OTP verification. |
| REF-02 | 914–920,927–932,948–949 | MATCH/PARTIAL. Stage2₹100,100minutes,7days and48-hour hold exist (`referral.service.js:175,280`). Clock begins at signup. Stage1 release is independent once24h expires (`:345`); later text says full₹200 moves after Stage2. Choose one release policy. |
| REF-03 | 927–944 | PARTIAL. Heartbeat rejects explicitly muted/background/>2× requests (`controllers/client/watchSession.controller.js:47`) and lifetime claims are bounded by wall time (`util/watchLedger.service.js:52`). Client reports these signals; no verified non-repetitive-content quota or reliable bot proof. Loops/backward seeks are not universally excluded by lifetime counting. |
| REF-04 | 937–940 | PARTIAL. New-user guard/device identity/IP checks exist; physical IMEI persistence across reinstall/factory reset is not proved. Exact shared Wi-Fi IP logic can penalise genuine users; it is not proof that one physical device was reused. |
| REF-05 | 945–947 | PARTIAL/CONFLICT. Device signals and network heuristic exist, but VPN/emulator protection is not exhaustive. Partner suspension/payout hold is implemented; forfeiture wording is stronger than observed general enforcement. |
| REF-06 | 903,585–588 | CONFLICT / MATERIAL EXTRA PAYOUT. `applyReferralCode` does not require the **referrer** to be an active Digital Partner. Any eligible unblocked referrer can get Stage1/2; Free Tasker additionally gets250 coins. `rewardEngine.js:530` also adds a recurring20% reward commission to a referrer. These are extra economic obligations beyond this input's fixed250/10%-pass/direct-partner model and should be reconciled before launch. This is a requirements mismatch, not a legal classification. |
| REF-07 | 950–955 | CONFLICT/GAP. Partner policy minimum₹500 and weeklyMonday transfer differs from current first-payout₹100 rule. No Monday payout automation/tax/fee deduction implementation found in reviewed payout code. Collections/reservations exist, actual banking integration does not follow from them. |

## H. Web/mobile integration and final blueprint — lines 960–986,1299–1352

| Ref | Lines | Current comparison |
|---|---|---|
| ACCESS-01 | 963–981,1331–1348 | PARTIAL/CONFLICT. Paid joining-fee fulfilment updates status server-side (`payment.controller.js:386`); verified phone login exists (`userFirestore.controller.js:226`). Actual gate (`util/accessGate.js:25`) locks only configured fee or pending membership while unpaid, allowing Free and watch-earned users. Literal paymentStatus=true for everybody contradicts V9. |
| ACCESS-02 | 1305–1327 | PARTIAL/UNVERIFIED. Agency/franchise/partner role APIs exist; actual `youpeak.in` / `partners.youpeak.in` hosted portal and DNS not verified this run. User's working consumer URL is `youpeak.app`; source membership URL still defaults to `https://youpeak.in`. Domain references need a current approved mapping. |
| ACCESS-03 | 1313–1314,1349–1351 | PARTIAL. MembershipPortal opens external checkout for passes/licenses. This does not prove every paid feature follows the intended rules; promotion/coin/premium flows are distinct. Current consumer web tasking is enabled by default (`setting.js:250`), an extension beyond this mobile-focused brief authorised in earlier conversation. |
| ACCESS-04 | 963,1302,1350 | Unsupported guarantee. A domain split is an architecture choice; it does not by itself guarantee app-store approval or exemption from platform commission. No current platform-policy validation performed in this static comparison. |

## I. Reward, payout and anti-fraud briefing — lines 991–1063

| Ref | Lines | Current comparison |
|---|---|---|
| SEC-01 | 997–1002,1027–1034 | PARTIAL/GAP. Coin economy, authenticated payouts, reserved balances and histories exist (`controllers/client/payout.controller.js:111`, `util/withdrawalLedger.js`). Automated RazorpayX/Cashfree **payouts** and success/pending/failed banking webhooks not located. Razorpay checkout is a different operation. |
| SEC-02 | 1011–1014 | PARTIAL/GAP. Action caps/dedup/wall-clock watch ledger exist; ad completion still lacks server-verifiable proof (`taskSecurity.service.js:224`). Do not equate a client reward callback with validated ad delivery. |
| SEC-03 | 1019–1020,1031–1032 | GAP. `util/payment.service.js:5,89` implements Razorpay purchases; Cashfree/PhonePe order adapters are stubs. It is not an automated bank payout provider adapter. |
| SEC-04 | 1025–1026 | CONFLICT. Extra recurring20% tasker referral commission and universal₹100+₹100 stacking need comparison with the specified simple direct scheme; do not hide them in a UI-only review. |
| SEC-05 | 1029–1030 | MATCH/CONFLICT. Configurable thresholds exist; examples₹50/₹100 are not an instruction to override later₹100/₹500 policy. |
| SEC-06 | 1045–1046 | PARTIAL. Self-reported device ID hash and server binding; no verified hardware fingerprint/Play Integrity/App Attest verdict. Source acknowledges token verdict verification is unfinished. |
| SEC-07 | 1047–1048 | GAP. Native phone sign-in can verify a phone, but payout route/middleware do not require verified Indian phone before redemption. Regex-valid UPI is not proof of beneficiary ownership. |
| SEC-08 | 1049–1050 | GAP. No reward/withdrawal reCAPTCHA Enterprise/v3 risk-score validation found by backend search. Firebase's phone-flow captcha, if configured, would not fulfil this broader requirement automatically. |
| SEC-09 | 1051–1052 | PARTIAL. `util/vpnDetection.service.js:23` is a fixed sample IPv4 datacenter list. IPv6 and other VPN ranges can escape; no comprehensive IP intelligence verdict. Emulator/root/VPN claims can be forged by modified clients. |
| SEC-10 | 1053–1057 | UNVERIFIED/GAP. No payout-gateway risk checks or staging gateway end-to-end evidence from this review. Store/financial compliance labels in the document are requirements, not a certified legal conclusion. |

## J. Moderation — lines 1068–1145

| Ref | Lines | Current comparison |
|---|---|---|
| MOD-01 | 1075–1088,1120–1125 | PARTIAL/GAP. Metadata keyword screening (`util/moderation.service.js:67`, `video.controller.js:631`) and manual transcript re-screen exist (`controllers/admin/contentModeration.controller.js:141`). Worker does not run Whisper; automated audio-to-transcript screening pipeline not found. |
| MOD-02 | 1090–1114 | PARTIAL/ADAPTED. Firestore video flags, blacklist and reports implement analogous storage. Literal PostgreSQL/MySQL migrations are unsuitable for this current Firestore architecture and should not be run as-is. |
| MOD-03 | 1089,1126–1130 | MATCH/PARTIAL. Default5reports in rolling24hours auto-hold (`moderation.service.js:94`); reporting UI exists. Distinct genuine reporters and all feed/direct-access enforcement still need adversarial/runtime tests. |
| MOD-04 | 1131–1134 | PARTIAL. Queue/report count, approve/reject/mute and moderation data exist (`contentModeration.controller.js:6,42`). General content reject does not ban the owner; copyright takedownBan does (`copyrightModeration.controller.js:70`). Transcript highlighting cannot show a transcript that was never generated. |
| MOD-05 | 1135–1136 | PARTIAL/UNVERIFIED. Grievance contact/file/track routes and deadlineAt36h exist (`controllers/client/grievance.controller.js:41`); actual public footer/domain and staff response within deadline not tested. Deadline tracking alone is not automatic takedown or statutory compliance proof. |
| MOD-06 | 1122–1123 | DOC DEFECT. Whisper sample treats Tamil,English,Hindi as a single language option. Determine supported detection/per-language processing rather than copying this command unchanged. Infrastructure “$0” describes open-source licenses, not guaranteed free compute/storage/operations. |

## K. Copyright / duplicate detection — lines 1151–1222

| Ref | Lines | Current comparison |
|---|---|---|
| COPY-01 | 1158–1187 | PARTIAL/UNVERIFIED. Separate Firestore fingerprint queue + polling Node worker exist (`util/copyright.service.js:73`, `worker/fingerprintWorker.js:115`). Engine defaults opt-in (`copyright.service.js:29`); worker running in production not verified. Firestore queue is an alternative to BullMQ/Celery, not equivalent proof of job retries/leases/throughput. |
| COPY-02 | 1188–1191,1205 | DEFECT. Worker `audioFingerprint` invokes `fpcalc -json -length120` (`fingerprintWorker.js:74`) and returns its compressed fingerprint string. Backend `audioSimilarity` expects numeric raw arrays/comma-separated numbers (`copyright.service.js:53`). Missing raw-vector output/decode means normal worker strings cannot satisfy the intended85% numeric comparison. Needs fixture reproduction before fixing. |
| COPY-03 | 1199–1207 | MISMATCH. Frames sampled every2sec, but worker builds an8×8 **average hash**, not DCT pHash (`fingerprintWorker.js:102`). Backend uses <=10 distance and defaults3matching frames (`copyright.service.js:31,104`), whereas doc says <10 with no3-frame requirement. Shared blank frames can match falsely; threshold/algorithm need validation. |
| COPY-04 | 1208–1213 | MATCH/PARTIAL. Matching flags/de-monetises (`copyright.service.js:146`); admin override/takedown/warn paths exist. A duplicate match is not proof of copyright ownership/license violation. Admin review remains necessary. Audio-muted flag does not prove the media bytes/CDN asset lost its audio track. |
| COPY-05 | 1155–1157,1163–1164 | LIMITATION. Matching against locally stored fingerprints identifies similarities within that catalogue, not all copyrighted material worldwide. “100% free” excludes hosting, processing and operations costs. |

## L. HLS, transcoding and CDN — lines 1228–1294

| Ref | Lines | Current comparison |
|---|---|---|
| MEDIA-01 | 1232–1258 | PARTIAL/MISMATCH. Cloudflare Stream path supports managed HLS/DASH (`util/videoPipeline.service.js:41,64`). Current native/web direct upload uses R2 (`controllers/client/file.controller.js:43`, `youpeak/lib/core/file_upload/direct_upload_video_api.dart:19`); createVideo's R2 branch stores raw URL (`video.controller.js:592`). R2+public domain does not transcode; the “never rawMP4” requirement is not fulfilled for all uploads. |
| MEDIA-02 | 1259–1261 | UNVERIFIED/GAP. No dedicated FFmpeg transcoder configuring exact360/480/720/1080p,600/1000/2500/4500k and4s segments found. Managed Stream may adapt quality, but source does not establish these exact settings for every video. |
| MEDIA-03 | 1262–1264 | GAP/PARTIAL. Client generates/uploaded thumbnails and Stream default thumbnail exist; no3choices at25/50/75% or WebP hover-preview sprite generation found. |
| MEDIA-04 | 1265–1268,1280–1286 | PARTIAL. R2 storage/public URL and Stream hlsUrl/duration metadata exist. available-resolutions metadata/preview sprite pipeline not established. Caching/headers/CDN throughput not measured here. |
| MEDIA-05 | 1287–1293 | DOC DEFECT. Sample transcode command only creates3variants despite the4-resolution requirement, contains malformed split/map formatting, and no mapped audio path. It is not a reliable production command as pasted. |
| MEDIA-06 | 1230–1234,1254 | Unsupported performance guarantee. No system can promise zero buffering on every2G–5G connection. “Up to80%” bandwidth saving needs a defined billing baseline and measurements. |

## M. Peak Boost UI and backend — lines 1518–1650

| Ref | Lines | Current comparison |
|---|---|---|
| BOOST-01 | 1524–1545,1577–1589,1606–1614 | MATCH. Presets100/500/2000/5000/10000, custom100–1,000,000;100coins₹1. `setting.js:207`, `controllers/client/peakBoost.controller.js:71`, Flutter sheet config-driven cards at `peak_boost_bottom_sheet.dart:155`. These are tips to creators, not promotion impressions. |
| BOOST-02 | 1549–1555,1558–1563 | MATCH/PARTIAL. Colour tokens match (`core/theme/app_color.dart:14`); custom input/balance states, haptic selection/success/error and modal exist. Full animation/spring/particle parity and keyboard/screenreader behaviour need visual/device verification. |
| BOOST-03 | 1546,1594–1597 | GAP. Current boost request/repository only sendsvideoId,coins,requestId. Optional shoutout, badge/pinned boost comment and Top Supporters tab not found in targeted backend/Flutter search. |
| BOOST-04 | 1592–1593 | PARTIAL. Boost toast exists; no demonstrated shared real-time event broadcasting to other current viewers. Sender toast alone is not a cross-user Firebase/Socket broadcast. |
| BOOST-05 | 1620–1637 | MATCH/PARTIAL. Authenticated spender, no self-tip, amount/balance checks, atomic debit+creator credit+platform ledger+histories+video counters at `peakBoost.controller.js:112`. Defaults80/20; integer rounding uses creator=round(T×0.8),platform=remainder (`revenueSplit.service.js:136`). Document does not specify fractional-coin rounding. |
| BOOST-06 | 1638–1639 | GAP. Boost endpoint returns sender receipt; no creator push call or Socket/Firebase publish appears in that handler. Ledger writes may support future subscriptions but do not implement the specified notification themselves. |
| BOOST-07 | Financial error handling | PARTIAL/RISK. Request ID reused after network timeout, sheet `:100`; closing/reopening creates a new request ID (`:57`), so a late server commit followed by a new attempt can still produce a second distinct tip. Need receipt reconciliation/operation history before a new submission, not just generic error copy. |
| BOOST-08 | 1548 and earlier user correction | INTENTIONAL UI DIFFERENCE. User explicitly requested removing the displayed80/20 line. Current sheet shows only “Boosts can't be refunded.” at line200. This user preference overrides screenshot/document UI copy; backend split should remain unless separately changed. |

## N. UI/UX v3 — lines 1655–1725

| Ref | Lines | Current comparison |
|---|---|---|
| UI-01 | 1663–1684 | MATCH/PARTIAL. Exact principal green/mint/gold/text/notification/search tokens exist in `youpeak/lib/core/theme/app_color.dart:6`. Some assets are raster and additional legacy colours remain. A token definition does not certify every rendered screen. |
| UI-02 | 1667–1671 | PARTIAL. Home header/search/navigation exist; `nav_home_page.dart:51` search container uses40px height and header icons use44px targets at line285. Test actual typing/results, layout, focus, unread count and touch target; screenshot-only copy is insufficient. |
| UI-03 | 1688–1691 | MATCH/PARTIAL. Horizontal category chips and green/mint states exist (`nav_home_page.dart:190`); actual hit-area/accessibility not fully measured. |
| UI-04 | 1692–1696 | MATCH/PARTIAL. Premium shelf after chips (`nav_home_page.dart:218`), horizontal cards, paid flag filter `videoPrivacyType==2` (`premium_videos_shelf.dart:20`). Free uploads should not enter solely because channel has prices. New source filtering is not proof that an old deployed upload is correctly labelled. |
| UI-05 | 1697–1701 | PARTIAL/UNVERIFIED. Bites/short-form views and branded artwork exist. This run did not visually certify removal of every genericS icon or exact9:16/radius/density across all states. |
| UI-06 | 1702–1705 | PARTIAL/UNVERIFIED. Feed/bottom navigation exist; desktop uses side navigation as an adaptation. View count persistence and real second-account updates are a backend/view-ledger acceptance test, not inferred from UI presence. |
| UI-07 | 1706–1710 | PARTIAL/UNVERIFIED. Some44px targets/semantics exist; project still usesPNG badge/artwork assets. No full colour-contrast, keyboard, screenreader, all44×44 targets or all-SVG proof. Do not claim WCAG AA compliance from token matching alone. |

## O. Screenshot 1: credit wallet — detailed comparison

This image is branded **KLING AI**, a reference UI, not a YouPeak project-terms document. Its numbers have nevertheless been inserted into current YouPeak settings. That is an observed source fact, not approval that they are the right business prices.

| Visible item | Current project | Finding |
|---|---|---|
| Credits title/back/Details | No completed corresponding ad-credit purchase screen found by feature/config searches | GAP; existing Coins screens are a different wallet unit. |
| Total66 /plan0 /top-up0 /bonus66 | `users.adCreditsBalance` and partner profile credits exist | PARTIAL; separateplan/top-up/bonus accounts and their aggregate are not implemented by a single balance.66 is sample data. |
| 100credits₹160, bonus2% | `setting.js:167` exact values | CONFIG ONLY. No ad-credit top-up purpose in payment resolver. |
| 330₹520 /660₹1050 /1320₹2150 | `setting.js:168–170` exact values | CONFIG ONLY. |
| 3500₹5500 bonus6% /7500₹11100 bonus14% | `setting.js:171–172` exact values | CONFIG ONLY. |
| Selected card, computed CTA, purchase | No consumption of `adCreditPacks` in Flutter/payment fulfilment located | GAP. Need verified paid order, immutable pack snapshot, idempotent grant, ledger, receipt. |
| 100 = 98.34 + 1.66 bonus | Source comment repeats the same example | Sum 100 is correct, percentage is not 2% of 98.34: 1.66/98.34 ≈ 1.688%. If total 100 includes 2% bonus on base, base ≈ 98.04 and bonus ≈ 1.96. Specify bonus basis/rounding before implementing. |
| Validity 2 years | `setting.js:174`: 730 days | CONFIG ONLY. Grant-lot expiresAt/consumption order/expiry worker not found. 730 days is not always two calendar years. |
| Terms acceptance beforePurchase | KLING wording in reference must not become YouPeak terms | GAP/CONTENT DECISION. Correct YouPeak terms link/version consent timestamp and disabled CTA until accepted would need implementation. |

Keep **reward coins**, **purchased advertising credits**, **withdrawable INR**, **reserved payouts** and **pending referrals** separate. Tasker pass₹999→1000AdCredits is not equivalent to1000reward coins=₹10. Local partner license credits are stored on a partner profile while Tasker purchased credits live onusers; an aggregate UI needs a defined account model rather than adding unrelated balances.

## P. Screenshot 2: Tasker dashboard — detailed comparison

| Visible element / specification | Current comparison |
|---|---|
| Vijay S. / avatar / Level 1 | Sample identity must be current account. Current header shows tier/next tier; exact avatar/name mockup parity not present in reviewed header. Product Level 1 maps to internal rank 2. |
| 2,500 coins / ₹25 | Correct 100:1 calculation. Dashboard API returns coin, coinsInr and withdrawableInr separately (`tasker.controller.js:143`). Flutter displays separate cash balance (`tasker_dashboard_view.dart:266`). ₹25 equivalent coins is not automatically ₹25 already settled cash. |
| Today's cap 2,500, boosted 500 | MATCH defaults. 500 boost raises cap; it is not an automatic 500 credit. Runtime admin can disable boost. |
| Earned 1,250 / ₹12.50 | Correct math; must come from today's credited counter, not total wallet or a hard-coded number. API uses counts. |
| 50.5 / 100 h, 50.5% | MATCH formula at `tasker.controller.js:99`; next target 100 h for Level 1. Lifetime carry seconds included. No reset on level-up. |
| 49.5 hours remaining | Math correct; current UI explains target/pct but does not render exact remaining hours in reviewed `_LifetimeCard`. Optional display improvement. |
| 12/20 ads, 10/10 likes, 3/5 comments, 120/120 min Done | MATCH tier quota structure; these are sample counts. Actual server limits/counters populated. Rewarded ads remain native app-only. 120 minutes and bonus claimed are distinct states when cap prevents bonus. |
| Withdraw ₹100 | Current button “Withdraw” opens validated modal; ₹100 is first-payout minimum, not available balance or guaranteed payment. PENDING admin request rather than automatic transfer. |
| Starter Pass Pass | Typo in reference. Current UI correctly uses “Starter Pass”. |
| Developer Implementation Spec panel | Reference handoff content, not user-facing app content. Current dashboard does not need to expose developer instructions. |
| Instant upgrade via In-App Purchase | CONFLICT with web-only fees workflow; current membership external portal policy is different. |
| Dark blue card visual | Current dashboard uses green/white brand and two-column layout at 900 px, one column below (`tasker_dashboard_view.dart:190`). This is a visual difference, not proof of incorrect business logic. Exact mockup adoption would conflict with green/white UI v3 unless intended as a themed card. |

## Q. Decisions needed before a complete implementation prompt

These are concrete unresolved product rules, not requests to change them in this audit:

1. Approve one terms baseline: V9 Tasker, complete V6 Creator, partner-specific payout policy, and current domains. Retire conflicting fragments with an explicit version register.
2. Decide whether partner₹100+₹100 is partner-only; whether ordinary referrals receive only250/10%; whether recurring20% tasker-reward commission is intended; whether watch-earned tiers qualify for paid-tier referral benefits.
3. Define payout eligibility: first₹100/subsequent₹500 for whom, monthly maximum versus minimum versus cumulative limit, Free user's second withdrawal, Monday versus on-demand transfers, and fees/taxes.
4. Define money/credit accounts and settlement: spendable coins versus withdrawable cash, purchased versus earned rewards, midnight settlement timezone and sweep, separate ad-credit grant lots, expiry and spend order.
5. Approve ad-credit top-up pricing and bonus math. KLING screenshot is not sufficient authority for a YouPeak financial catalogue.
6. Define real promotion delivery: valid billable impressions, pacing/placement/expiry, measured campaign history and shortfall/refund policy. Estimates must not be manufactured from targets.
7. Decide security outcomes (temporary earning lock/review suspension/permanent termination) and install actual proof: verifiedphone gates, adcompletion verification, verifieddevice integrity and risk checks.
8. Define media pipeline: mandatory HLS or raw R2 allowed, actual transcoder/worker hosting, copyright reference catalogue, screening hold-before-publish policy, and moderation SLA operations.

## R. Acceptance evidence required after fixes

- Two independent signed-in accounts: like/comment/view/boost from A must persist and show updated counts/history to B after refresh; rejected/private/unpublished content must not become accessible via alternate endpoints.
- Concurrent/retried payments, boosts, referrals and withdrawals: balances/ledgers/rewards must commit once, remain balanced and never overdraw. Test late success after timeout and new-request reconciliation.
- Tasker boundaries: 49.99/50, 99.99/100, 199.99/200, 399.99/400 hours; noon/IST midnight; partial cap bonus; stored tier overrides; repeated unlike/like; paused/muted/background/frozen/seek/loop/multi-device watch.
- Referral boundaries: verified phone/profile/new account, device/IP duplicates, registration deadline, 24/48 h holds, seven-day expiry, suspended referrer and failed cron recovery.
- Payout: first/subsequent/pending/declined/completed, Free ₹300 cap versus ₹500 minimum, bank transfer webhook/reconciliation, duplicate provider callbacks, refund of failed reserved amount.
- Credits: paid pack grant once, correct bonus split, plan/top-up/bonus totals, lot expiry, impression/click billing and exhausted balance stopping delivery.
- Moderation/copyright: real Tamil/Hindi/English audio, raw Chromaprint fixtures, true pHash fixtures, five distinct reports/24 h, false positives/admin override, muted asset access and worker failures.
- Promotion: correct server catalogue and client display, ownership, expiry, rejection, measured impressions/delivery pacing, no fake views and no extra charges after retry.
- Desktop/tablet/mobile UI, keyboard/screenreader/contrast/touch-target checks, with authenticated live test evidence and actual deployment/config IDs.

No zero-error guarantee is made. Completion means the agreed rules have implementation plus reproducible evidence, and uncovered risks are stated honestly.
