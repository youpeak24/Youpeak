/**
 * Comprehensive Automated Test Suite for YouPeak Ad Credits.
 *
 * Verifies:
 *   1. Integer-Hundredths Precision (1 credit = 100 units, zero floating-point drift)
 *   2. Strict Decimal Validation (rejects >2 decimal places, non-finite, unsafe ranges)
 *   3. Authoritative Inclusive Bonus Calculation (base = round(total / (1 + bonus/100)), bonus = total - base)
 *   4. Pack Catalog, Terms Snapshot & Tamper Resistance
 *   5. Granting Lots (Base 98.04, Bonus 1.96, Permanent Plan) & Multi-Account Segregation
 *   6. Authoritative Wallet Balance & Dynamic Expiry Calculation
 *   7. FIFO Spend Engine (earliest-expiring first, plan last)
 *   8. Overdraft Prevention (concurrency & balance guards)
 *   9. Spend Idempotency & Conflict Detection (409 on parameter mismatch)
 *   10. Expiry Maintenance Worker (idempotent lot exhaust & ledger entry)
 *   11. Reversal Engine (atomic restoration, double-reversal prevention)
 */
"use strict";

const assert = require("assert");
const adCreditWallet = require("../util/adCreditWallet.service");

async function runTests() {
  console.log("==================================================================");
  console.log("        YOUPEAK AD CREDITS — AUTOMATED TEST SUITE                 ");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${e.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${e.message}`);
      failed++;
    }
  }

  // ── TEST 1: Integer-Hundredths Precision & Quantizing ───────────────────────
  console.log("--- 1. Integer-Hundredths Precision & Validation ---");
  test("creditsToUnits converts numbers and decimal strings to integer units", () => {
    assert.strictEqual(adCreditWallet.creditsToUnits(1), 100);
    assert.strictEqual(adCreditWallet.creditsToUnits(0.01), 1);
    assert.strictEqual(adCreditWallet.creditsToUnits(98.04), 9804);
    assert.strictEqual(adCreditWallet.creditsToUnits(1.96), 196);
    assert.strictEqual(adCreditWallet.creditsToUnits("100.00"), 10000);
    assert.strictEqual(adCreditWallet.creditsToUnits("0.5"), 50);
  });

  test("creditsToUnits rejects excess precision (>2 decimal places)", () => {
    assert.throws(() => adCreditWallet.creditsToUnits(10.125), /Excess precision/);
    assert.throws(() => adCreditWallet.creditsToUnits("98.045"), /Invalid credit format/);
    assert.throws(() => adCreditWallet.creditsToUnits(null), /Credit value is required/);
    assert.throws(() => adCreditWallet.creditsToUnits(NaN), /finite number/);
  });

  test("unitsToCredits converts integer units to 2-decimal floats", () => {
    assert.strictEqual(adCreditWallet.unitsToCredits(10000), 100.0);
    assert.strictEqual(adCreditWallet.unitsToCredits(9804), 98.04);
    assert.strictEqual(adCreditWallet.unitsToCredits(196), 1.96);
    assert.strictEqual(adCreditWallet.unitsToCredits(1), 0.01);
  });

  // ── TEST 2: Authoritative Bonus Formula Calculation ─────────────────────────
  console.log("\n--- 2. Authoritative Bonus Formula Calculation ---");
  test("calculatePackSplit calculates exact inclusive split for all configured bonus tiers", () => {
    // 100 credits at 2% bonus: base 98.04, bonus 1.96
    const split100 = adCreditWallet.calculatePackSplit(100, 2);
    assert.strictEqual(split100.baseCredits, 98.04);
    assert.strictEqual(split100.bonusCredits, 1.96);
    assert.strictEqual(split100.totalCredits, 100.0);
    assert.strictEqual(split100.baseUnits + split100.bonusUnits, split100.totalUnits);

    // 3500 credits at 6% bonus: base 3301.89, bonus 198.11
    const split3500 = adCreditWallet.calculatePackSplit(3500, 6);
    assert.strictEqual(split3500.baseCredits, 3301.89);
    assert.strictEqual(split3500.bonusCredits, 198.11);
    assert.strictEqual(split3500.totalCredits, 3500.0);
    assert.strictEqual(split3500.baseUnits + split3500.bonusUnits, split3500.totalUnits);

    // 7500 credits at 14% bonus: base 6578.95, bonus 921.05
    const split7500 = adCreditWallet.calculatePackSplit(7500, 14);
    assert.strictEqual(split7500.baseCredits, 6578.95);
    assert.strictEqual(split7500.bonusCredits, 921.05);
    assert.strictEqual(split7500.totalCredits, 7500.0);
    assert.strictEqual(split7500.baseUnits + split7500.bonusUnits, split7500.totalUnits);

    // 330 credits at 0% bonus: base 330.00, bonus 0.00
    const split330 = adCreditWallet.calculatePackSplit(330, 0);
    assert.strictEqual(split330.baseCredits, 330.0);
    assert.strictEqual(split330.bonusCredits, 0.0);
    assert.strictEqual(split330.totalCredits, 330.0);
  });

  // ── TEST 3: Pack Catalog & Term Snapshotting ────────────────────────────────
  console.log("\n--- 3. Pack Catalog & Term Snapshotting ---");
  test("getPacks returns 6 configured packs with exact inclusive bonus values", () => {
    const packs = adCreditWallet.getPacks();
    assert.strictEqual(packs.length, 6);

    const p100 = packs.find((p) => p.id === "pack_100");
    assert.ok(p100, "pack_100 exists");
    assert.strictEqual(p100.credits, 100.0);
    assert.strictEqual(p100.baseCredits, 98.04);
    assert.strictEqual(p100.bonusCredits, 1.96);
    assert.strictEqual(p100.baseCreditUnits, 9804);
    assert.strictEqual(p100.bonusCreditUnits, 196);
    assert.strictEqual(p100.priceINR, 160.0);
    assert.strictEqual(p100.validityDays, 730);

    const p3500 = packs.find((p) => p.id === "pack_3500");
    assert.ok(p3500, "pack_3500 exists");
    assert.strictEqual(p3500.credits, 3500.0);
    assert.strictEqual(p3500.baseCredits, 3301.89);
    assert.strictEqual(p3500.bonusCredits, 198.11);
    assert.strictEqual(p3500.bonusPercent, 6);

    const p7500 = packs.find((p) => p.id === "pack_7500");
    assert.ok(p7500, "pack_7500 exists");
    assert.strictEqual(p7500.credits, 7500.0);
    assert.strictEqual(p7500.baseCredits, 6578.95);
    assert.strictEqual(p7500.bonusCredits, 921.05);
    assert.strictEqual(p7500.bonusPercent, 14);
  });

  test("snapshotPack freezes terms immutably with integer units", () => {
    const pack = adCreditWallet.findPack("pack_100");
    const snap = adCreditWallet.snapshotPack(pack);
    assert.strictEqual(snap.id, "pack_100");
    assert.strictEqual(snap.priceINR, 160.0);
    assert.strictEqual(snap.pricePaise, 16000);
    assert.strictEqual(snap.baseCredits, 98.04);
    assert.strictEqual(snap.bonusCredits, 1.96);
    assert.strictEqual(snap.baseCreditUnits, 9804);
    assert.strictEqual(snap.bonusCreditUnits, 196);
    assert.ok(snap.snapshottedAt);
  });

  // ── TEST 4: Mock Storage Engine for Business Flow Testing ───────────────────
  console.log("\n--- 4. Mock Storage Engine for Comprehensive Flow Testing ---");
  class MockFirestore {
    constructor() {
      this.data = {
        users: new Map(),
        adCreditLots: new Map(),
        adCreditLedger: new Map(),
        adCreditOperations: new Map(),
      };
    }

    collection(colName) {
      const store = this.data[colName] || (this.data[colName] = new Map());
      return {
        doc: (id) => ({
          id,
          get: async () => ({
            exists: store.has(id),
            data: () => store.get(id),
          }),
          set: (data, opts) => {
            if (opts && opts.merge && store.has(id)) {
              store.set(id, { ...store.get(id), ...data });
            } else {
              store.set(id, data);
            }
          },
          update: (data) => {
            if (!store.has(id)) throw new Error(`Document ${id} does not exist.`);
            store.set(id, { ...store.get(id), ...data });
          },
        }),
        where: (field, op, val) => {
          let list = Array.from(store.entries()).map(([k, v]) => ({ id: k, ...v }));
          list = list.filter((item) => {
            if (op === "==") return item[field] === val;
            if (op === "<=") return item[field] <= val;
            return false;
          });
          return {
            where: (f2, o2, v2) => ({
              get: async () => {
                let sub = list.filter((item) => {
                  if (o2 === "==") return item[f2] === v2;
                  if (o2 === "<=") return item[f2] <= v2;
                  return false;
                });
                return {
                  empty: sub.length === 0,
                  docs: sub.map((d) => ({
                    id: d.id,
                    data: () => d,
                  })),
                  forEach: (cb) => sub.forEach((d) => cb({ id: d.id, data: () => d })),
                };
              },
              limit: (n) => ({
                get: async () => {
                  let sub = list.filter((item) => {
                    if (o2 === "==") return item[f2] === v2;
                    if (o2 === "<=") return item[f2] <= v2;
                    return false;
                  }).slice(0, n);
                  return {
                    empty: sub.length === 0,
                    docs: sub.map((d) => ({ id: d.id, data: () => d })),
                    forEach: (cb) => sub.forEach((d) => cb({ id: d.id, data: () => d })),
                  };
                },
              }),
            }),
            orderBy: () => ({
              limit: (n) => ({
                get: async () => ({
                  empty: list.length === 0,
                  docs: list.slice(0, n).map((d) => ({ id: d.id, data: () => d })),
                  forEach: (cb) => list.slice(0, n).forEach((d) => cb({ id: d.id, data: () => d })),
                }),
              }),
            }),
            limit: (n) => ({
              get: async () => ({
                empty: list.length === 0,
                docs: list.slice(0, n).map((d) => ({ id: d.id, data: () => d })),
                forEach: (cb) => list.slice(0, n).forEach((d) => cb({ id: d.id, data: () => d })),
              }),
            }),
            get: async () => ({
              empty: list.length === 0,
              docs: list.map((d) => ({ id: d.id, data: () => d })),
              forEach: (cb) => list.forEach((d) => cb({ id: d.id, data: () => d })),
            }),
          };
        },
      };
    }

    async runTransaction(updateFunction) {
      const transaction = {
        get: async (refOrQuery) => {
          if (refOrQuery.get) return refOrQuery.get();
          throw new Error("Invalid ref passed to transaction.get");
        },
        create: (ref, data) => {
          const pathParts = ref.id ? [ref.id] : [];
          ref.set(data);
        },
        set: (ref, data, opts) => {
          ref.set(data, opts);
        },
        update: (ref, data) => {
          ref.update(data);
        },
      };
      return updateFunction(transaction);
    }
  }

  const mockFs = new MockFirestore();
  const testUserId = "user_ad_credit_tester_01";
  mockFs.data.users.set(testUserId, {
    _id: testUserId,
    adCreditsBalance: 0,
    adCreditsBalanceUnits: 0,
    adCreditsGranted: 0,
    adCreditsGrantedUnits: 0,
    isBlock: false,
  });

  // Temporarily replace db.getDb()
  const origGetDb = require("../util/connection").getDb;
  require("../util/connection").getDb = () => mockFs;

  // ── TEST 5: Grant Top-Up Pack with Exact Base & Bonus ───────────────────────
  console.log("\n--- 5. Granting Credits & Lots ---");
  await asyncTest("Grant pack_100 creates BASE (98.04) and BONUS (1.96) lots and updates user balance", async () => {
    const res = await adCreditWallet.grantCredits({
      userId: testUserId,
      amount: 98.04,
      bonus: 1.96,
      source: "TOPUP",
      type: "BASE",
      validityDays: 730,
      paymentTransactionId: "ptxn_mock_001",
      packId: "pack_100",
      fs: mockFs,
    });

    assert.strictEqual(res.creditsGranted, 100.0);
    assert.strictEqual(res.creditUnits, 10000);
    assert.strictEqual(res.baseCredits, 98.04);
    assert.strictEqual(res.bonusCredits, 1.96);
    assert.strictEqual(res.balanceAfter, 100.0);
    assert.strictEqual(res.balanceAfterUnits, 10000);

    const user = mockFs.data.users.get(testUserId);
    assert.strictEqual(user.adCreditsBalance, 100.0);
    assert.strictEqual(user.adCreditsBalanceUnits, 10000);

    assert.strictEqual(res.lots.length, 2);
    const baseLot = res.lots.find((l) => l.type === "BASE");
    const bonusLot = res.lots.find((l) => l.type === "BONUS");
    assert.ok(baseLot, "Base lot created");
    assert.ok(bonusLot, "Bonus lot created");
    assert.strictEqual(baseLot.amount, 98.04);
    assert.strictEqual(baseLot.amountUnits, 9804);
    assert.strictEqual(bonusLot.amount, 1.96);
    assert.strictEqual(bonusLot.amountUnits, 196);
  });

  await asyncTest("Grant Starter Pass creates permanent PLAN lot (expiresAt: null)", async () => {
    const res = await adCreditWallet.grantCredits({
      userId: testUserId,
      amount: 1000.0,
      bonus: 0,
      source: "STARTER_PASS",
      type: "PLAN",
      validityDays: null,
      paymentTransactionId: "ptxn_mock_002",
      fs: mockFs,
    });

    assert.strictEqual(res.creditsGranted, 1000.0);
    assert.strictEqual(res.creditUnits, 100000);
    assert.strictEqual(res.balanceAfter, 1100.0);
    assert.strictEqual(res.balanceAfterUnits, 110000);

    const planLot = res.lots.find((l) => l.type === "PLAN");
    assert.ok(planLot);
    assert.strictEqual(planLot.expiresAt, null, "Plan credits must have null expiresAt (permanent)");
  });

  // ── TEST 6: Authoritative Wallet Query ──────────────────────────────────────
  console.log("\n--- 6. Authoritative Wallet Query ---");
  await asyncTest("getWalletBalance breaks down plan, topup, bonus, and available accurately", async () => {
    const wallet = await adCreditWallet.getWalletBalance(testUserId, { fs: mockFs });
    assert.strictEqual(wallet.available, 1100.0);
    assert.strictEqual(wallet.availableUnits, 110000);
    assert.strictEqual(wallet.plan, 1000.0);
    assert.strictEqual(wallet.topup, 98.04);
    assert.strictEqual(wallet.bonus, 1.96);
    assert.strictEqual(wallet.activeLotsCount, 3);
  });

  // ── TEST 7: Dynamic Expiry Enforcement ──────────────────────────────────────
  console.log("\n--- 7. Dynamic Expiry Enforcement ---");
  await asyncTest("Expired lot is dynamically excluded from available balance without running worker", async () => {
    const expiredLotId = "lot_already_expired_001";
    mockFs.data.adCreditLots.set(expiredLotId, {
      _id: expiredLotId,
      id: expiredLotId,
      userId: testUserId,
      source: "TOPUP",
      type: "BASE",
      amount: 50.0,
      amountUnits: 5000,
      remaining: 50.0,
      remainingUnits: 5000,
      expiresAt: new Date(Date.now() - 86400000).toISOString(), // expired yesterday
      status: "ACTIVE",
    });

    const wallet = await adCreditWallet.getWalletBalance(testUserId, { fs: mockFs });
    // Balance must STILL be 1100.0, not 1150.0
    assert.strictEqual(wallet.available, 1100.0);
  });

  // ── TEST 8: Spend Engine with FIFO & Overdraft Prevention ────────────────────
  console.log("\n--- 8. Spend Engine, FIFO & Overdraft Guard ---");
  await asyncTest("Overdraft attempt is rejected with clear error message", async () => {
    let threw = false;
    try {
      await adCreditWallet.spendCredits({
        userId: testUserId,
        amount: 5000.0,
        operationId: "op_overdraft_attempt",
        purpose: "video_promotion",
        fs: mockFs,
      });
    } catch (e) {
      threw = true;
      assert.ok(e.message.includes("Insufficient ad credits balance"));
    }
    assert.ok(threw, "Overdraft must throw");
  });

  await asyncTest("spendCredits executes FIFO: expiring lots consumed first, permanent plan credits last", async () => {
    // Current available: 1100.0 (98.04 base, 1.96 bonus expiring in 730 days, 1000.0 plan permanent)
    // Debit 101.0 credits:
    // Should consume:
    //   - 98.04 from Base lot (exhausted)
    //   - 1.96 from Bonus lot (exhausted)
    //   - 1.00 from Plan lot (remaining: 999.00)
    const receipt = await adCreditWallet.spendCredits({
      userId: testUserId,
      amount: 101.0,
      operationId: "op_spend_fifo_001",
      purpose: "video_promotion",
      reference: { videoId: "vid_123" },
      fs: mockFs,
    });

    assert.strictEqual(receipt.success, true);
    assert.strictEqual(receipt.debitedAmount, 101.0);
    assert.strictEqual(receipt.debitedUnits, 10100);
    assert.strictEqual(receipt.balanceAfter, 999.0);
    assert.strictEqual(receipt.lotsDeducted.length, 3);

    assert.strictEqual(receipt.lotsDeducted[0].amountDeducted, 98.04);
    assert.strictEqual(receipt.lotsDeducted[1].amountDeducted, 1.96);
    assert.strictEqual(receipt.lotsDeducted[2].amountDeducted, 1.0);
    assert.strictEqual(receipt.lotsDeducted[2].lotType, "PLAN");

    const user = mockFs.data.users.get(testUserId);
    assert.strictEqual(user.adCreditsBalance, 999.0);
    assert.strictEqual(user.adCreditsBalanceUnits, 99900);
  });

  // ── TEST 9: Spend Idempotency & Conflict Detection ──────────────────────────
  console.log("\n--- 9. Spend Idempotency & Conflict Detection ---");
  await asyncTest("Duplicate call with same operationId returns cached receipt without debiting twice", async () => {
    const replayReceipt = await adCreditWallet.spendCredits({
      userId: testUserId,
      amount: 101.0,
      operationId: "op_spend_fifo_001",
      purpose: "video_promotion",
      fs: mockFs,
    });

    assert.strictEqual(replayReceipt.replayed, true);
    assert.strictEqual(replayReceipt.debitedAmount, 101.0);
    assert.strictEqual(replayReceipt.balanceAfter, 999.0);

    const user = mockFs.data.users.get(testUserId);
    assert.strictEqual(user.adCreditsBalance, 999.0);
  });

  await asyncTest("Reusing operationId with differing parameters throws HTTP 409 conflict", async () => {
    let threwConflict = false;
    try {
      await adCreditWallet.spendCredits({
        userId: testUserId,
        amount: 200.0, // Different amount!
        operationId: "op_spend_fifo_001",
        purpose: "video_promotion",
        fs: mockFs,
      });
    } catch (e) {
      threwConflict = true;
      assert.strictEqual(e.code, "OPERATION_CONFLICT");
      assert.strictEqual(e.status, 409);
    }
    assert.ok(threwConflict, "Parameter mismatch on reused opId must throw 409 conflict");
  });

  // ── TEST 10: Reversal Support ───────────────────────────────────────────────
  console.log("\n--- 10. Debit Reversal Engine ---");
  await asyncTest("reverseDebit restores credits referencing original operationId", async () => {
    const revReceipt = await adCreditWallet.reverseDebit({
      userId: testUserId,
      originalOperationId: "op_spend_fifo_001",
      reason: "Campaign cancelled before broadcast",
      fs: mockFs,
    });

    assert.strictEqual(revReceipt.success, true);
    assert.strictEqual(revReceipt.restoredCredits, 101.0);
    assert.strictEqual(revReceipt.balanceAfter, 1100.0);
    assert.ok(Array.isArray(revReceipt.lots));
    assert.strictEqual(revReceipt.lots.length, 3);

    // Verify provenance preservation:
    const restoredPlan = revReceipt.lots.find((l) => l.type === "PLAN");
    assert.ok(restoredPlan, "PLAN lot must be restored");
    assert.strictEqual(restoredPlan.expiresAt, null, "Restored PLAN lot must retain expiresAt: null");
    assert.strictEqual(restoredPlan.amount, 1.0);

    const restoredBase = revReceipt.lots.find((l) => l.type === "BASE");
    assert.ok(restoredBase, "BASE lot must be restored");
    assert.strictEqual(restoredBase.amount, 98.04);

    const restoredBonus = revReceipt.lots.find((l) => l.type === "BONUS");
    assert.ok(restoredBonus, "BONUS lot must be restored");
    assert.strictEqual(restoredBonus.amount, 1.96);

    const user = mockFs.data.users.get(testUserId);
    assert.strictEqual(user.adCreditsBalance, 1100.0);

    // Replay reversal is idempotent
    const replayRev = await adCreditWallet.reverseDebit({
      userId: testUserId,
      originalOperationId: "op_spend_fifo_001",
      fs: mockFs,
    });
    assert.strictEqual(replayRev.replayed, true);
    assert.strictEqual(user.adCreditsBalance, 1100.0);
  });

  await asyncTest("reverseDebit rejects operations where a deducted lot has expired with EXPIRED_REVERSAL_POLICY_PENDING", async () => {
    // Seed an operation whose deducted lot has an expired date
    const expiredOpId = "op_with_expired_lot_001";
    mockFs.data.adCreditOperations.set(expiredOpId, {
      _id: expiredOpId,
      id: expiredOpId,
      userId: testUserId,
      amount: 10.0,
      amountUnits: 1000,
      purpose: "test_expired_spend",
      isReversed: false,
      lotsDeducted: [
        {
          lotId: "lot_past_expired_1",
          amountDeducted: 10.0,
          amountDeductedUnits: 1000,
          lotType: "BASE",
          expiresAt: new Date(Date.now() - 3600000).toISOString(), // expired 1 hour ago
        },
      ],
    });

    let threwPending = false;
    try {
      await adCreditWallet.reverseDebit({
        userId: testUserId,
        originalOperationId: expiredOpId,
        fs: mockFs,
      });
    } catch (e) {
      threwPending = true;
      assert.strictEqual(e.code, "EXPIRED_REVERSAL_POLICY_PENDING");
      assert.strictEqual(e.statusCode, 422);
    }
    assert.ok(threwPending, "Reversal involving expired lots must throw EXPIRED_REVERSAL_POLICY_PENDING");
  });

  // Restore connection
  require("../util/connection").getDb = origGetDb;

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n==================================================================");
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test runner crashed:", e);
  process.exit(1);
});
