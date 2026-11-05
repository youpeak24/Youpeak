# YouPeak Ad Credits — Requirements & Alignment Matrix

**Date**: 2026-10-14  
**Status**: Authoritative Requirements Baseline (Audited, Remediated & Verified)  
**Scope**: In-app Advertising Credits Wallet, Ledger, Purchase, Expiry, and Debit Engine

---

## 1. Account Segregation Architecture

To maintain financial integrity and adhere strictly to YouPeak's non-investment, purely promotional service terms (V9 §1.1), the system strictly separates all user balances. **Zero cross-account conversion or bleeding is permitted.**

| Account Type | Unit | Rate / Backing | Storage Location | Can Convert To Ad Credits? | Description |
|---|---|---|---|---|---|
| **Reward Coins** | Coins | 100 Coins = ₹1 INR (cap-bounded) | `users.coin` | ❌ No | Earned through micro-tasks and watch time. Reducible only via payout redemption. |
| **Advertising Credits** | Credits | 1 Credit = 100 Integer Units | `adCreditLots` + `users.adCreditsBalance` | N/A | Purchased or granted purely for digital video / profile / business promotion. Non-withdrawable. |
| **Withdrawable INR** | ₹ INR | 1:1 Fiat Currency | `users.wallet` / `users.withdrawableInr` | ❌ No | Cleared earnings available for bank/UPI withdrawal. |
| **Reserved Payouts** | ₹ INR | 1:1 Fiat Currency | `withdrawalRequests` / `payoutTransactions` | ❌ No | Earnings locked during withdrawal processing. |
| **Pending Referral Rewards** | ₹ INR / Coins | Stage 1 (₹100) & Stage 2 (₹100) | `referrals.pendingReward` | ❌ No | Referral commissions undergoing 24h / 48h fraud and watch-time audit. |

---

## 2. Top-Up Pack Catalog & Authoritative Bonus Specification

The approved business rule dictates an **Inclusive Total**:
- The pack quantity is the total credits received, inclusive of bonus.
- Bonus percentage is calculated relative to the base:
  $$\text{base} = \frac{\text{total}}{1 + \text{bonusPercent} / 100}$$
  $$\text{bonus} = \text{total} - \text{roundedBase}$$

| Pack ID | Display Name | Price (₹ INR) | Total Credits | Base Credits | Bonus Credits | Validity | Bonus % | Units Breakdown (1 Credit = 100 Units) |
|---|---|---|---|---|---|---|---|---|
| `pack_100` | 100 Credits | ₹160 | 100.00 | **98.04** | **1.96** | 730 Days | 2% | 9,804 Base + 196 Bonus = 10,000 Units |
| `pack_330` | 330 Credits | ₹520 | 330.00 | 330.00 | 0.00 | 730 Days | 0% | 33,000 Base + 0 Bonus = 33,000 Units |
| `pack_660` | 660 Credits | ₹1,050 | 660.00 | 660.00 | 0.00 | 730 Days | 0% | 66,000 Base + 0 Bonus = 66,000 Units |
| `pack_1320` | 1320 Credits | ₹2,150 | 1320.00 | 1320.00 | 0.00 | 730 Days | 0% | 132,000 Base + 0 Bonus = 132,000 Units |
| `pack_3500` | 3500 Credits | ₹5,500 | 3500.00 | **3301.89** | **198.11** | 730 Days | 6% | 330,189 Base + 19,811 Bonus = 350,000 Units |
| `pack_7500` | 7500 Credits | ₹11,100 | 7500.00 | **6578.95** | **921.05** | 730 Days | 14% | 657,895 Base + 92,105 Bonus = 750,000 Units |

*Note*: Earlier explicit setting values (`98 + 2`, `3302 + 198`, `6579 + 921`) were audited and corrected to exact mathematical numbers. Inconsistent manual overrides are formally rejected.

---

## 3. Integer-Hundredths Credit Accounting

| Parameter | Approved Specification | Technical Implementation |
|---|---|---|
| **Accounting Base Unit** | 1 Credit = 100 Integer Units | All internal operations transact integers (`creditsToUnits`). Eliminates binary floating-point drift. |
| **Fiat Base Unit** | 1 INR = 100 Paise | All prices stored/checked in paise integers (`inrToPaise`). |
| **Precision Boundary** | Strictly 2 Decimals | Parsing rejects excess precision (>2 decimal places, e.g. `12.345`) and non-safe integers. |
| **External Display** | 2-Decimal Float / String | Formatted via `unitsToCredits` at HTTP / UI boundaries only. |

---

## 4. Security & Authorization Rules

| Domain | Rule | Enforcement Mechanism |
|---|---|---|
| **Wallet Ownership** | Verified Identity Authority | Controllers strictly read `req.appUserId` populated by `requireAppUser()` from verified Firebase ID token. |
| **Cross-User Tampering** | Strict Rejection | Any client-supplied `userId` differing from `req.appUserId` triggers HTTP 403 `FORBIDDEN_USER_MISMATCH`. |
| **Client Credit Consumption** | Disabled for Client Calls | Public client endpoint `/client/adCredits/consume` returns HTTP 400 `CONSUMPTION_UNAVAILABLE` without changing balances. Spending engine is internal for authorized server-side operations. |
| **Conflict Detection** | Reused `operationId` Guard | Reusing an `operationId` with mismatched parameters returns HTTP 409 `OPERATION_CONFLICT`. Identical retry replays original receipt. |
| **Maintenance Route** | Non-Public Authorization | `/maintenance/expire` removed from client router; mounted under `/admin/adCredits/maintenance/expire` and `/admin/adCredits/reverse` behind admin middleware. |

---

## 5. Grant Types, Provenance & Expiry Lifecycle

| Grant Source | Lot Type | Expiry Policy | Default Validity | Provenance Tracking |
|---|---|---|---|---|
| **TOPUP** | `BASE` | Expires after configured validity | 730 Days (2 rolling years) | `paymentTransactions.id` + `packId` |
| **TOPUP** | `BONUS` | Expires after configured validity | 730 Days (2 rolling years) | `paymentTransactions.id` + `packId` |
| **STARTER_PASS** (Tasker V9) | `PLAN` | **Non-expiring** (Permanent) | `null` | `membershipTiers.id` + `paymentTransactions.id` |
| **PARTNER_LICENSE** (Digital Partner) | `PLAN` | **Non-expiring** (Permanent) | `null` | `digitalPartnerProfiles.id` + `paymentTransactions.id` |
| **REVERSAL (Unexpired)** | Original Lot Type (`BASE`/`BONUS`/`PLAN`) | Retains original expiry date (`PLAN` remains permanent with `null` expiry) | Original Lot Validity | `originalOperationId` + `reversalOperationId` |
| **REVERSAL (Expired)** | Strict Expiry (Approved) | Reversals involving expired lots are rejected with `EXPIRED_REVERSAL_POLICY_PENDING` (HTTP 422) | Non-reversible | Strict expiry guard active per confirmed policy |

---

## 6. Spend Order (Consumption Engine)

1. **FIFO Earliest-Expiring First**:
   - Expiring lots consumed first (`expiresAt ASC`, then `createdAt ASC`).
   - Permanent plan credits (`expiresAt: null`) consumed last.
2. **Transaction Correctness**: All reads precede all writes in Firestore transactions.
3. **Overdraft Prevention**: Available unexpired credits validated atomically within transaction.
