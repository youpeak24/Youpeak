# Peak Boost & Video Promotion — alignment report

**Date:** 10 Oct 2026 · **Branch:** `fix/deploy-readiness` (uncommitted, as instructed) · **Scope:** Peak Boost (fan → creator coins) and paid Video Promotion, from UI → API → backend → Firebase, plus the admin panel.

Nothing was committed, pushed or deployed. No production pricing, settings or financial records were changed. No real payment was made. No real user's balance was touched.

## 1. Summary

| Area | Before | After |
|---|---|---|
| Peak Boost presets / limits | Already matched both Peak Boost documents (100 / 500 / 2,000 / 5,000 / 10,000 coins + custom 100–10,00,000), server-enforced | Unchanged, as the owner confirmed ("Keep documented set") |
| Peak Boost after a timeout | Kept the same request id, but told the user to retry without checking | The app asks the server first: if the boost went through, the sheet closes with the receipt; if not, it says no coins were taken; if the server can't be reached, it says retrying won't charge twice |
| Promotion catalogue | Settings plans keyed by **name**; the app had a hard-coded impression map that broke on renamed plans; prices shown with a **"$"** symbol | Stable plan ids, rate-card names, Global targeting and category, served by the API with cost per 1,000 estimated impressions; ₹ everywhere |
| Ordering | Client sent `planName`; ownership checked; no eligibility rules; a double tap created two orders | Server prices from the plan id and checks ownership, video type, public/published state and any running promotion; the same unpaid order is reused for 15 minutes |
| Activation | One campaign per verified payment, but two payments could overlap | Same verified-payment trigger, plus the plan snapshot and an audit event; a second paid campaign is queued after the first, serialised by a per-video lock |
| **Delivery** | **None.** Nothing read `isPromoted` or the campaigns; no impressions; campaigns never ended | A "Promoted" spot on Home, paced across campaigns; server-counted impressions (signed token, 1 per viewer per campaign per India day, owner excluded); end at the duration or the upper estimate; daily expiry plus a sweep on read |
| My Promotions | Plan name and status chip only | Real status, counted impressions against the estimate, dates, what was bought, and history |
| Admin | "Approve" restarted the campaign dates and could activate an **unpaid** row; reject didn't clear the promoted flag; no history | Review (dates kept), pause, resume (paused time added back), take down (reason required, flag cleared, "no refund issued" note); unpaid rows can't be activated; every action logged |

## 2. Sources and the rules applied

### 2.1 Documents read (`E:\Legendary One\youpeak\documents\new`)

| Document | What it governs |
|---|---|
| `Youpeak_Peak_Boost_Updated_Spec.pdf` (YP-DEV-BOOST-V4, Sept 2026) | Presets, custom range, 100 coins = ₹1, 80/20 split, minimum 100, insufficient-balance flow, transaction logging |
| `Youpeak_Peak_Boost_UI_Design_Spec.pdf` (UI SPEC V1.0) | Same presets, custom validation (integers, 100–10,00,000), "Insufficient Balance · Get Coins" |
| `DOC-20260826-WA0214.pdf` — Official Rate Card, "Creator Growth & Video Promotion" | The six promotion plans (matches screenshot 3 in the brief exactly), plus an ROI/comparison section |
| Membership Terms, Digital Partner ad-credits spec | Ad credits = digital promotional services; nothing on promotion refunds, taxes or fees |
| WhatsApp images in the same folder | One is a third-party (KLING AI) credits screen; one is a Tasker dashboard mock. Neither is about Peak Boost or promotion |

The three screenshots referenced in the brief were not attached to the session. I used the brief's rate-card table, which matches the rate card PDF line for line.

### 2.2 Comparison matrix

| Topic | Documents | Implemented (after) | Status |
|---|---|---|---|
| **Peak Boost vs promotion** | Peak Boost = fan sends coins to a creator. Promotion = creator pays ₹ for placement of their own video | Separate products, separate code paths. The Promote page explains the difference at the top | Aligned |
| Peak Boost presets | Starter 100 · Mini 500 · Super 2,000 · Mega 5,000 · Ultra 10,000 · Custom 100–10,00,000 | Same, from server config (`settings.peakBoost`); the app reads it from the system config, with the same values as fallback | Aligned (owner confirmed) |
| Coin ↔ ₹ | 100 coins = ₹1 | Labels use the configured rate (₹1.00 … ₹100.00) | Aligned |
| Split | 80% creator / 20% platform | One Firestore transaction; creator = round(T × 80%), platform = the rest; ledger row `rev_<boostId>` | Aligned (rounding rule still awaits sign-off, BLOCK-01 from the earlier audit) |
| Split text in UI | UI spec CTA says "80% goes directly to Creator" | **Not shown**, per the brief's instruction to keep the split sentence removed | Brief overrides the UI spec — noted |
| Refund text | Not specified in the boost docs | "Boosts can't be refunded." kept (no document contradicts it) | Kept |
| Boost log | `boost_transactions` | `peakBoosts/pb_<user>_<requestId>` + both users' `histories` rows + `revenueLedger` | Same data, different collection name; no migration needed |
| Promotion plans | 6 plans (table in §3) | Same prices, estimates, durations; stable ids; Global; Daily/Weekly/Monthly | Aligned |
| **Impressions vs coins** | Impressions are a count of views, not coins | Never converted. Promotion is paid only in ₹ through the existing gateway | Aligned |
| Guarantees | Rate card says "estimated" | Every screen says "estimates, not guarantees" | Aligned |
| Fees / tax / discounts / refunds | Not in any document | None invented. UI: "The price shown is the full amount you pay. Refunds aren't covered by the published rate card — contact YouPeak support" | Aligned; refund policy is an owner decision (§9) |
| Rate-card marketing claims | "Priority Recommendation Placement", "automated 30-day growth engine", "3.3× more reach" | Not shown. The comparison is computed from live prices as a range (§3) | Deliberately not repeated |

## 3. Rate card and the comparison claims

| Plan (id) | Price | Est. impressions | Duration | Category | ₹ per 1,000 est. |
|---|---|---|---|---|---|
| Starter Plan (`starter_plan`) | ₹49 | 2,000–2,500 | 1 day | Daily | ₹19.60–₹24.50 |
| Basic Plan (`basic_plan`) | ₹99 | 3,000–3,500 | 2 days | Daily | ₹28.29–₹33 |
| Pro Starter (`pro_starter`) | ₹199 | 3,000–5,000 | 2 days | Daily | ₹39.80–₹66.33 |
| Boost Plan (`boost_plan`) | ₹249 | 3,000–8,000 | 4 days | Daily | ₹31.13–₹83 |
| Weekly Mega Plan (`weekly_mega_plan`) | ₹1,000 | 50,000–75,000 | 7 days | Weekly | ₹13.33–₹20 |
| Monthly Pro Plan (`monthly_pro_plan`) | ₹3,000 | 2,00,000–2,50,000 | 30 days | Monthly | ₹12–₹15 |

All plans target Global.

The rate card's comparison section, checked:

| Claim | Check | Verdict |
|---|---|---|
| Starter × 30 days = ₹1,470 | 49 × 30 = 1,470 | Correct |
| 30 Starters ≈ 60,000–75,000 impressions | 2,000 × 30 and 2,500 × 30 | Correct (estimates) |
| CPM ~₹20–24 vs ~₹12–15 | ₹19.60–₹24.50 vs ₹12–₹15 | Correct, rounded |
| "3.3× more reach" | 2,00,000 ÷ 60,000 = 3.33 (low vs low). Across the ranges it is 2,00,000 ÷ 75,000 = **2.67** to 2,50,000 ÷ 60,000 = **4.17** | **Not a fixed multiplier.** The app shows "about 2.7× to 4.2× (3.3× comparing the low ends)" |
| "Priority Recommendation Placement" | The product places promoted videos in a labelled Home spot; it doesn't change recommendations | Not claimed in the app |
| "Continuous automated 30-day growth engine" | No such mechanism | Not claimed in the app |

## 4. Peak Boost — what was corrected

The server path was already correct and is unchanged. It enforces the documented limits on integer coins only. It refuses self-boosts, hidden videos and blocked creators. It settles debit + creator credit + platform ledger + both history rows + video counters in one transaction, and the request id makes it idempotent.

Added:
- **`GET client/peakBoost/status?requestId=`** (signed-in user only). It reports whether *the caller's* boost with that id exists and completed, plus the current balance. Another account asking about the same id gets `found: false`.
- **App:** after `NETWORK_TIMEOUT` / `NETWORK_ERROR`, the sheet calls the status endpoint (twice, 2 s apart) **before** suggesting another try:
  - completed → closes with the receipt, exactly like a direct success;
  - not found → "Your boost didn't go through and no coins were taken. Please try again." The same request id is kept, so even a racing first attempt can't charge twice;
  - unreachable → "We couldn't confirm whether your boost went through. Tapping Boost again is safe — you won't be charged twice." The button reads "Retry N Coins Boost".
- **Insufficient balance:** the CTA is "Insufficient Balance • Get Coins" (UI spec). A server refusal corrects the shown balance.

## 5. Video Promotion — what was built

### 5.1 Flow

The flow (`PromoteVideoView` → `PromoteFlowView` → `PromotionCampaignView`):

1. **Promote hub** explains "Promote my video" versus "Not the same as Peak Boost". It then shows My promotions (real data), the six plans, the 30-day comparison and "How promotion works".
2. **Step 1 — Video.** The caller's own videos, from `eligibleVideos`. Ineligible ones are greyed out with the server's reason: Bite, private/unlisted/scheduled/under review, or already promoted.
3. **Step 2 — Plan.** The plan grid. Tapping a plan opens **plan details**: price (full amount), duration, estimate, targeting, cost per 1,000, where it's shown, and the estimates note.
4. **Step 3 — Review & pay.** The order summary (a side panel on desktop) with "Pay ₹X", then the existing Razorpay checkout. States handled:
   - preparing;
   - checkout open;
   - confirming;
   - **cancelled** ("No promotion was bought");
   - **failed** (server or gateway message, then "Try again", which reuses the same order);
   - **pending**: the app polls `client/payment/status` for about 20 s. Then it shows "Payment received — we're starting your promotion… Please don't pay again" or "waiting for the payment provider…", with "Check again" and "Go to My promotions";
   - **closed checkout:** the server is asked whether the order was paid before showing "cancelled".
   - On success the app opens the new campaign.
5. **Campaign details:** status, impressions counted so far, a progress bar toward the **lower** estimate (real counts only), start/end, what was bought (snapshot), and history.

Payment architecture: unchanged. The existing `client/payment/createOrder` → Razorpay → `verify` (HMAC) / `webhook` state machine is used; no new gateway or flow was added. Checkout honours the same admin switches as the coin checkout:
- **iOS** requires `razorpayIosEnabled` (store billing is preserved);
- **Android/web** hide checkout only when an admin has explicitly switched Razorpay off. Settings saved before the switch existed don't carry it, and the old promotion page never gated, so this preserves current behaviour.

### 5.2 Backend lifecycle (`functions/backend/util/promotion.service.js`)

- **Catalogue:** `settings.promotionPlans` (admin-editable) normalised to `{id, name, priceINR, currency, impressionsMin/Max, durationDays, targeting, category, isActive}`. Older stored names resolve to the same ids ("Weekly Mega" → `weekly_mega_plan`).
- **Order:** the server resolves the plan by id (or name, for older apps) and requires it to be active and priced. It checks the video: exists, owned by the caller, normal video, publicly listable, no running promotion. Then it stores a **plan snapshot** on the order. The client cannot set price, paid status, duration, delivered impressions or owner.
- **Activation:** only through verified payment (`markPaidAndFulfil` → `effectOnce`). The campaign `promo_<txnId>`, the event and `video.isPromoted` are written in one transaction. A per-video lock (`promotionVideoLocks/<videoId>`) read inside the transaction queues a second paid campaign after the first.
- **Placement:** `GET client/videoPromotion/placements` returns up to 2 live campaigns, excluding the viewer's own and any video no longer public. Order is by delivery deficit against the lower estimate, spread over the duration (pacing). Each comes with an HMAC placement token (campaign + viewer + time; 30-minute life).
- **Impressions:** `POST client/videoPromotion/impression {placementToken}` (signed-in only). The app reports once the card has been ≥50% on screen for 1 s, on the current page, with the app in the foreground. The server counts at most **one per viewer per campaign per India day** (`promotionImpressions/<campaign>_<viewer>_<day>` created in the same transaction as the increment). It never counts the owner, an inactive campaign, a forged or other-viewer token, or an expired one.
- **End:** a campaign stops being served at `expiresAt` or at the **upper** estimate (status `completed`). The daily cron and a throttled sweep on placement reads settle the stored status, log `expired`/`completed`, and clear the video flag.
- **Audit:** `videoPromotionEvents` records activated / scheduled / reviewed / paused / resumed / rejected / expired / completed, with who and when. Creators see "YouPeak" for admin actions, never an admin id.

### 5.3 UI → API → data

| Screen / action | API | Data |
|---|---|---|
| Plans grid, details | `GET client/videoPromotion/plans` | `settings.promotionPlans` |
| Video picker | `GET client/videoPromotion/eligibleVideos` | `videos` (caller's), `videoPromotions` |
| Pay | `POST client/payment/createOrder {purpose: video_promotion, videoId, planId}` | `paymentTransactions` (+ `promotionPlan` snapshot) |
| Checkout result | `POST client/payment/verify`; Razorpay → `POST payment/webhook/razorpay` | `paymentTransactions`, `paymentEffects`, `videoPromotions`, `videoPromotionEvents`, `promotionVideoLocks`, `videos.isPromoted` |
| Pending / timeout | `GET client/payment/status?orderId` (caller's orders only; returns `campaignId`) | `paymentTransactions` |
| My promotions / details | `GET client/videoPromotion/`, `GET client/videoPromotion/campaign?campaignId` | `videoPromotions`, `videoPromotionEvents` |
| Home "Promoted" spot | `GET client/videoPromotion/placements`, `POST …/impression` | `videoPromotions`, `promotionImpressions` |
| Admin list / history / actions | `GET admin/videoPromotion/index`, `GET …/events`, `POST …/updateStatus` | same |
| Peak Boost | `POST client/peakBoost`, `GET client/peakBoost/status` | `peakBoosts`, `users.coin`, `histories`, `revenueLedger`, `videos.peakBoost*` |

Media stays on Cloudflare; only records are in Firebase.

## 6. Verification

All runs were on isolated data: the Firestore/Auth emulators (`demo-*` projects), a stubbed Razorpay SDK, and correctly signed test payloads with throwaway secrets. The browser runs used the local stack.

| Check | Result | Log |
|---|---|---|
| Emulator suites (13) | **192/192** (171 earlier + 21 new in `13-peak-boost-promotion.cjs`) | `peak-boost-promotion/logs/emulator-full.log` |
| Backend unit tests | **33/33** | `logs/node-test.txt` |
| Flutter tests | **149/149** (134 earlier + 15 new) | `logs/flutter-test.txt` |
| Flutter analyze (whole app) | **0 errors**, 82 warnings, all pre-existing; none in new or changed files | `logs/flutter-analyze.txt` |
| Admin panel production compile | Compiles (output to a scratch folder; `admin/frontend/build` untouched) | — |
| Browser: 11 app routes × 1920/1366/768/390 | No horizontal overflow; the desktop sidebar is kept at 1366/1920 on every page except the two modal sheets | `screenshots/after/routes.json` |
| Browser: admin promotions | 5/5 checks (list with delivered/estimate; review keeps dates; pause; resume; history) | `screenshots/after/admin/admin-results.json` |
| Browser: real impression path | The viewer saw the other creator's Promoted card across many Home loads; the server counted **exactly 1** (`promo_local_other_local_app_user_2026-10-10`) | emulator data |

New emulator checks (suite 13):

- **Peak Boost**
  - PB3-01: config serves exactly the documented presets and range.
  - PB3-02: every preset settles 80/20, and viewer debit history and creator credit history match.
  - PB3-03: status after a timeout (not found → safe; completed → no second debit on retry).
  - PB3-04: status is per-user; bad id or no token is refused.
  - PB3-05: insufficient balance writes nothing.
- **Promotion: catalogue and ordering**
  - VP-01: the catalogue equals the rate card, including cost per 1,000.
  - VP-02: every plan charges the catalogue price, and tampered `amountInr`/price fields are ignored (asserted on the amount sent to the gateway).
  - VP-03: unknown or inactive plans are refused; the legacy name resolves.
  - VP-04: someone else's video, Bites, private, under-review, rejected, copyright-flagged and scheduled videos are refused.
  - VP-05: a double tap reuses one gateway order.
- **Promotion: payment and activation**
  - VP-06: 2 verifies + 2 webhooks run concurrently, then replays — one campaign, one event, snapshot stored, status returns `campaignId`.
  - VP-07: a bad signature or failed payment never activates; status is private to the buyer.
  - VP-08: a running promotion blocks a new order; two orders paid together queue back-to-back.
  - VP-09: a rate-card edit after purchase changes nothing bought.
  - VP-10: list and detail are user-scoped (403 on a foreign `userId`, 401 without a token).
- **Promotion: delivery and admin**
  - VP-11: placements exclude the owner; anonymous viewers get no token.
  - VP-12: impression dedupe per day; other-viewer, forged and expired tokens rejected; 5 concurrent reports count once; the owner never counts.
  - VP-13: delivery stops at the upper estimate.
  - VP-14: expiry by cron (status, event, flag cleared, re-orderable).
  - VP-15: admin review / pause / resume (+1 h back) / take-down (reason required, price untouched, no-refund note); an unpaid legacy row can't be activated.
  - VP-16: older campaign rows without a snapshot still display.

New Flutter tests:

- **Models:** catalogue parsing; ₹ and Indian grouping; the comparison maths (₹1,470; 60,000–75,000; 2.67 / 3.33 / 4.17); campaigns; payment state; Peak Boost status.
- **Pages:**
  - the hub at 390 and 1366 (Peak Boost vs promotion, real campaigns, comparison; no "priority/guaranteed/automated" text);
  - the hub error state and Retry;
  - the full flow at 390 and 1366 (ineligible reason, plan details, review with the server price);
  - the admin Razorpay switch (explicit off hides Pay; unset keeps it);
  - campaign details.
- **Peak Boost timeout cases:** went through / no record / unreachable.

A real 10 px overflow of the step header at 390 px was found by these tests and fixed: narrow screens now label only the current step.

### Screenshots (`reports/project-audit/peak-boost-promotion/screenshots/`)

Each "after" route has `-1920`, `-1366`, `-768` and `-390` files:

| Route | Files |
|---|---|
| Home with the Promoted spot | `after/home-promoted-*` |
| Promote hub | `after/promote-hub-*` (plus `-lower-*` for plans and comparison) |
| Flow step 1 — video | `after/promote-flow-video-*` |
| Flow step 2 — plans | `after/promote-flow-plans-*` |
| Plan details | `after/promote-plan-details-*` |
| Review | `after/promote-review-*` |
| Admin switched off | `after/promote-pay-gated-*` |
| Server refused the order | `after/promote-pay-refused-*` |
| Campaign running | `after/campaign-details-*` |
| Campaign ended | `after/campaign-ended-*` |
| Peak Boost sheet | `after/peak-boost-sheet-*` |
| Admin | `after/admin/admin-promotions-*`, `admin-paused.png`, `admin-history.png` |
| Previous app | `before/old-promote-page-*`, `before/old-plan-picker-*` |

In the previous app's plan picker, INR prices show as "$", and the weekly/monthly estimates are blank. That old bundle was run against the new backend, so the plan names it saw were the new ones; the "$" symbol is independent of that.

Fixture data: `peak-boost-promotion/harness/seed-promotion.cjs` (emulator only, every document tagged `isTestFixture`). Its 3 counted impressions on the running fixture campaign each have their dedupe row.

## 7. Release candidates (built with the approved key mechanism)

Both builds used `vercel env run -e production` with the repo helpers. The client key is injected for the build only and never printed. The checks print true/false only.

| Build | Location | sha256 | Checks |
|---|---|---|---|
| Web (`youpeak-web`) | `youpeak/build/web` | main.dart.js `af1f3daa…` | Production key embedded; `https://api.youpeak.app/`; no local/emulator hosts; new endpoints present |
| Android APK | `youpeak/build/app/outputs/flutter-apk/app-release.apk` | `65b8d6e7…` | Production key embedded; production API; no local hosts (a `10.0.2.2` match is inside an engine symbol, identical in the previous APK); signing SHA-1 `36e05d07…`, **same as before**, so it updates in place |

- **Copies:** `E:\Legendary One\youpeak\backups\rc-promotion-2026-10-10\`.
- **Previous candidates** (web `2b704a07…`, APK `861c3a43…`) were backed up first to `backups\pre-promotion-2026-10-10\`.
- **Local test bundle** (not a release): `youpeak/build/web_promo_local`.

## 8. Existing data and compatibility

- **No mass edits; nothing migrated.** Existing campaigns, orders and boosts are read as they are:
  - campaigns without a snapshot fall back to their stored plan fields;
  - orders without a snapshot fall back to the catalogue entry by name or id;
  - legacy unpaid `pending_payment` rows can be taken down but not activated.
- **Production settings were not read or changed.** If production `promotionPlans` still hold the older names ("Weekly Mega", "Monthly Pro") without ids, they still resolve to `weekly_mega_plan` / `monthly_pro_plan`. The app will show the stored names until someone renames them in Admin → Platform Config. The new admin field "Plan id" must stay unchanged once a plan has been sold.
- **Older app versions** keep working:
  - `planName` is still accepted;
  - `plans` still includes `planName`;
  - My Promotions on an old app shows the plan name where it used to show the title (cosmetic).
- **Deploy order:** backend + admin (`youpeak`) first, then the web build (`youpeak-web`). This needs your authorization.
- Optional env var: `PROMOTION_TOKEN_SECRET`. It falls back to `JWT_SECRET`; a dedicated value is recommended.

## 9. Not verified / owner decisions

1. **Store billing on Android.** Promotion is bought through Razorpay, as before. Google Play's payments policy may treat in-app promotion as a digital service that requires Play Billing. This is an owner/legal decision; nothing was changed. On iOS, checkout stays off unless `razorpayIosEnabled` is set.
2. **Refunds for a taken-down paid campaign.** No document covers them. The admin tool says no refund was issued and leaves it manual.
3. **Delivery volume.** Placement is real, paced and counted, but the number of impressions depends on how many signed-in viewers open Home during the campaign. Two Promoted slots per Home load were chosen as a default. Whether the larger estimates (e.g. 2,00,000–2,50,000 in 30 days) are achievable at current traffic is not verified. The product presents them as estimates only.
4. **Real payment.** Not executed (by instruction). The path from a verified payment to activation is proven with correctly signed test payloads; a live ₹49 test on a test account would close this.
5. **Peak Boost rounding** (creator = round(80%)) still needs the sign-off noted earlier as BLOCK-01.
6. **Rate-card marketing copy** ("3.3×", "priority placement", "automated growth engine") overstates what the product does if used elsewhere.

## 10. Changed files (this phase)

**Backend** (`functions/backend/`)
- `util/promotion.service.js` (new): catalogue, eligibility, placement, impressions, expiry, audit.
- `controllers/client/videoPromotion.controller.js`, `routes/client/videoPromotion.route.js`: plans, eligibleVideos, campaigns, campaign, placements, impression.
- `controllers/admin/videoPromotion.controller.js`, `routes/admin/videoPromotion.route.js`: review/pause/resume/take-down, events.
- `controllers/client/payment.controller.js`, `routes/client/payment.route.js`: plan-id pricing, eligibility, order reuse, snapshot, queued activation with lock, caller-scoped status with `campaignId`.
- `controllers/client/peakBoost.controller.js`, `routes/client/peakBoost.route.js`: status endpoint.
- `controllers/cron.controller.js`: daily promotion expiry.
- `setting.js`, `util/platformConfig.js`: plan ids, targeting and category; unique-id check skips blanks.

**Admin:** `admin/frontend/src/Component/Pages/VideoPromotion/ManageVideoPromotion.js`.

**App** (`youpeak/lib/`)
- `features/video_promotion/data/promotion_models.dart`, `promotion_repository.dart` (new).
- `features/video_promotion/view/promote_video_view.dart` (rewritten), `promote_flow_view.dart`, `promotion_campaign_view.dart` (new).
- `features/video_promotion/widget/promotion_widgets.dart`, `promoted_videos_shelf.dart` (new).
- `features/video_promotion/api/video_promotion_api.dart` (removed; replaced by the repository).
- `features/peak_boost/data/peak_boost_repository.dart`, `domain/peak_boost.dart`, `presentation/peak_boost_bottom_sheet.dart`.
- `features/home/view/nav_home_page.dart` (Promoted spot), `main.dart` (desktop shell widths).

**Tests and harness**
- `tests/emulator/suites/13-peak-boost-promotion.cjs`
- `youpeak/test/features/video_promotion_test.dart`
- `youpeak/test/widgets/feature_widgets_test.dart`
- `reports/project-audit/peak-boost-promotion/harness/` (`seed-promotion.cjs`, `routes.cjs`, `admin.cjs`)
