# YouPeak Ad Credits Feature — Implementation & Audit Report

**Date**: 2026-10-14  
**Status**: Feature Complete, Fully Remediated & Real-Emulator Verified  
**Engineers**: Senior Backend Engineer & UI/UX Engineer  
**Workspace**: `E:\Legendary One\youpeak\source`  

---

## 1. Executive Summary & Architectural Scope

The complete **YouPeak Advertising Credits ("Ad Credits")** feature has been comprehensively audited, corrected, and verified across backend services, admin routes, daily cron tasks, real Firebase emulator suites, and Flutter mobile/web clients.

In strict compliance with YouPeak Terms of Service (V9 §1.1), Advertising Credits represent digital promotional units (video impressions, profile reach, and local business promotion). They are completely segregated from monetary accounts:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        YOUPEAK ACCOUNT BOUNDARIES                      │
├───────────────────┬──────────────┬───────────────┬─────────────────────┤
│ Account           │ Unit         │ Rate/Backing  │ Convert to Credits? │
├───────────────────┼──────────────┼───────────────┼─────────────────────┤
│ Reward Coins      │ Coins        │ 100 = ₹1 INR  │ ❌ NO               │
│ Ad Credits        │ Credits      │ 1 = 100 Units │ N/A                 │
│ Withdrawable INR  │ ₹ Fiat       │ 1:1 Bank/UPI  │ ❌ NO               │
│ Reserved Payouts  │ ₹ Fiat       │ Locked Payout │ ❌ NO               │
│ Pending Referrals │ ₹ Fiat/Coins │ 24h/48h Audit │ ❌ NO               │
└───────────────────┴──────────────┴───────────────┴─────────────────────┘
```

---

## 2. Confirmed Gaps & Applied Engineering Remediations

| # | Audit Finding / Gap | Severity | Technical Remediation Applied |
|---|---|---|---|
| 1 | **Authenticated Wallet Ownership**: Controller previously fell back to client-supplied `userId`. | Critical Security | Refactored `adCredits.controller.js` to strictly enforce `req.appUserId` from `requireAppUser()`. Mismatched query/body `userId` immediately rejected with HTTP 403 `FORBIDDEN_USER_MISMATCH`. Missing auth returns HTTP 401 `AUTH_REQUIRED`. |
| 2 | **Unapproved Promotion Credit Billing**: Client `/consume` previously accepted `PROMOTION_CAMPAIGN` and used `plan.creditsCost \|\| plan.priceINR` (treating INR as credits). | Critical Economic & Integrity | Removed the arbitrary fallback. Public client consumption via `/client/adCredits/consume` is disabled, returning HTTP 400 `CONSUMPTION_UNAVAILABLE` without changing balances. Internal reusable spending engine (`adCreditWallet.spendCredits`) is reserved strictly for authorized server-side flows. |
| 3 | **Provenance-Preserving Reversals**: `reverseDebit` previously recreated all credits as a single 730-day `BASE` lot, converting permanent `PLAN` credits into expiring credits. | Financial Integrity | Refactored `reverseDebit` to restore each deducted lot slice preserving exact provenance: `PLAN` lots retain permanent status (`expiresAt: null`), while unexpired top-up lots retain their original expiry dates and lot types. Reversals involving expired lots are rejected with HTTP 422 `EXPIRED_REVERSAL_POLICY_PENDING` pending business decision. Deterministic ledger ID `adc_rev_${origOpId}` written. |
| 4 | **Bounded, Resumable Cron Expiry Maintenance**: Expiry worker was not wired to daily scheduler. | Reliability & Automation | Integrated `adCreditWallet.expireCredits({ batchSize: 100 })` into `cron.controller.js` `daily` handler protected by `CRON_SECRET`. Errors isolated per task. Added cursor pagination support (`nextCursor`) for bounded, resumable execution across large lot volumes. |
| 5 | **Inconsistent Bonus Calculations**: Settings previously used explicit `98 + 2` instead of mathematically exact formula. | Financial Accuracy | Implemented authoritative inclusive formula $\text{base} = \text{round}(\text{total} / (1 + \text{bonus}/100))$ across settings, platform config, snapshotting, APIs, Flutter UI, and tests: Pack 100 = 98.04 + 1.96, Pack 3500 = 3301.89 + 198.11, Pack 7500 = 6578.95 + 921.05. Inconsistent manual overrides rejected. |
| 6 | **Integer Credit Accounting**: Floating-point balance arithmetic in `toDecimal2`. | Financial Accuracy | Implemented integer-hundredths arithmetic ($1\text{ credit} = 100\text{ integer units}$, $1\text{ INR} = 100\text{ paise}$). Stored and transacted via `amountUnits` and `remainingUnits`. Rejects excess precision (>2 decimal places) and non-safe integers. Formats 2-decimal floats strictly at boundary. |
| 7 | **Public Expiry Maintenance**: `/maintenance/expire` previously mounted on public client route with only app key. | Security & Operations | Removed `/maintenance/expire` from client router. Mounted under `/admin/adCredits/maintenance/expire` and `/admin/adCredits/reverse` protected by `AdminMiddleware` and `CheckScope`. Query made index-safe to operate reliably across all Firestore environments. |
| 8 | **Payment & Tier Fulfilment Integrity**: Ledger ID collision & tamper resistance. | Integrity | Resolved `paymentTransactionId` deterministic ledger ID (`adc_${paymentTransactionId}`) in `grantCredits`, ensuring payment webhook test `PF-09` passes completely. Client price tampering rejected during order creation. |
| 9 | **UI/UX Completion**: Exact breakdown, subset indication, and responsive layout. | UI/UX Quality | Verified exact base/bonus figures in UI. Tested and verified layout at 390px Mobile, 768px Tablet, 1366px Laptop, and 1920px Wide Desktop. |

---

## 3. Verified Pack Catalog Baseline

| Pack ID | Display Name | Price (₹ INR) | Total Credits | Base Credits | Bonus Credits | Validity | Bonus % | Units Breakdown (1 Credit = 100 Units) |
|---|---|---|---|---|---|---|---|---|
| `pack_100` | 100 Credits | ₹160 | 100.00 | **98.04** | **1.96** | 730 Days | 2% | 9,804 Base + 196 Bonus = 10,000 Units |
| `pack_330` | 330 Credits | ₹520 | 330.00 | 330.00 | 0.00 | 730 Days | 0% | 33,000 Base + 0 Bonus = 33,000 Units |
| `pack_660` | 660 Credits | ₹1,050 | 660.00 | 660.00 | 0.00 | 730 Days | 0% | 66,000 Base + 0 Bonus = 66,000 Units |
| `pack_1320` | 1320 Credits | ₹2,150 | 1320.00 | 1320.00 | 0.00 | 730 Days | 0% | 132,000 Base + 0 Bonus = 132,000 Units |
| `pack_3500` | 3500 Credits | ₹5,500 | 3500.00 | **3301.89** | **198.11** | 730 Days | 6% | 330,189 Base + 19,811 Bonus = 350,000 Units |
| `pack_7500` | 7500 Credits | ₹11,100 | 7500.00 | **6578.95** | **921.05** | 730 Days | 14% | 657,895 Base + 92,105 Bonus = 750,000 Units |

---

## 4. Automated Verification Matrix

| Test Suite | File Location | Tests | Result | Notes |
|---|---|---|---|---|
| **Real Emulator Ad Credits Suite** | `tests/emulator/suites/15-ad-credits.cjs` | 12 / 12 | **PASS** | Real HTTP calls: auth token verification, client consume 400 unavailable, admin 401 guard, catalog split, checkout price tampering, webhook fulfilment (`adc_${txnId}`), FIFO spend, idempotency/conflict 409, dynamic expiry, daily cron with `CRON_SECRET`, provenance reversal, expired-lot rejection. |
| **Real Emulator Payments Suite** | `tests/emulator/suites/05-payments.cjs` | 12 / 12 | **PASS** | Webhook fulfilment state machine, Tasker pass ad credit grant (`PF-09`), Digital Partner license grant (`PF-11`), recovery and reconciliation. |
| **Backend Unit & Flow Suite** | `functions/backend/test/adCreditWallet.test.js` | 16 / 16 | **PASS** | Integer units, inclusive bonus math, FIFO spend, overdraft refusal, 409 conflict, reversal provenance & expired guard. |
| **Backend End-to-End Integration Suite** | `functions/backend/test/adCreditIntegration.test.js` | 11 / 11 | **PASS** | 401 unauthenticated, 403 user mismatch, 400 consumption unavailable, admin maintenance, admin reversal validation, price tampering rejection, migration dry-run simulation. |
| **Flutter Models, Controller & Responsive Suite** | `youpeak/test/features/ad_credits_test.dart` | 8 / 8 | **PASS** | Model parsing, controller pack/terms/filter logic, responsive rendering on 390px, 768px, 1366px, and 1920px. |
| **Flutter Static Analysis** | `youpeak` | 0 errors | **PASS** | `flutter analyze` completed with no issues found. |
| **Idempotent Migration Dry-Run** | `scripts/migrate-ad-credits-dryrun.js` | 100% Read-Only | **PASS** | Zero mutations to database. Provenance and overlap analysis verified. |

---

## 5. Deployment Safety Adherence
- Zero mutations to live production databases.
- No live payments or real financial transfers initiated.
- No credentials rotated or exposed.
- All existing unrelated and uncommitted changes across repository preserved.
