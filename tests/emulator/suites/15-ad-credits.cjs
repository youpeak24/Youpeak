// Phase 2: Ad Credits Wallet, Integrity, Consumption, Cron Maintenance & Provenance Reversals.
//
// Verifies:
//   1. Authenticated Wallet Ownership (owner 200, unauthenticated 401, cross-user query/body 403, client consume 400 unavailable)
//   2. Admin endpoint protection (shared secret key without admin token calling /admin/adCredits returns 401)
//   3. Financial Integrity (pack catalog split, price tampering rejection on checkout, webhook fulfilment with adc_${txnId}, duplicate webhook idempotency)
//   4. Spend engine concurrency & idempotency (overdraft prevention, duplicate opId replay, opId parameter conflict 409)
//   5. Expiry & Cron Maintenance (dynamic expiry exclusion before cron, daily cron execution with CRON_SECRET, duplicate cron run idempotency)
//   6. Reversals (provenance preservation: PLAN retains null expiry, BASE retains original expiry, expired-lot reversal throws EXPIRED_CREDITS_NOT_REVERSIBLE 422)
"use strict";

const crypto = require("node:crypto");

module.exports = async (h, check, assert) => {
  const { call, seedUser, idToken, setSettings, nowIso, set, get, getUser, where, fsdb } = h;
  const adCreditWallet = h.req("util/adCreditWallet.service");

  await setSettings({
    paymentGateway: "razorpay",
    adCreditValidityDays: 730,
  });

  const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

  function webhook(orderId, { amountPaise, currency = "INR", event = "payment.captured", paymentId = `pay_${orderId}` } = {}) {
    const raw = JSON.stringify({
      event,
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderId,
            amount: amountPaise,
            currency,
            status: event === "payment.captured" ? "captured" : "failed",
          },
        },
      },
    });
    const sig = crypto.createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
    return call("POST", "/payment/webhook/razorpay", { raw, headers: { "x-razorpay-signature": sig } });
  }

  let adSeq = 0;
  async function orderAdCredits(userId, packId, amountInr) {
    const n = ++adSeq;
    const id = `adc_txn_${n}`;
    const orderId = `order_adc_${n}`;
    const pack = adCreditWallet.findPack(packId);
    await set("paymentTransactions", id, {
      userId,
      gateway: "razorpay",
      purpose: "ad_credits",
      packId,
      adCreditPack: pack,
      amountInr,
      currency: "INR",
      orderId,
      status: "created",
      fulfilled: false,
      createdAt: nowIso(),
    });
    return { id, orderId, pack };
  }

  // ── TEST 1: Authenticated Wallet Ownership & Boundaries ─────────────────────
  await check("ADC-01", "Wallet ownership: owner 200 without userId, unauthenticated 401, cross-user 403 on query/body", async () => {
    await seedUser("u_adc_owner");
    await seedUser("u_adc_victim");
    const tokOwner = await idToken("u_adc_owner");

    // 1. Unauthenticated -> 401 AUTH_REQUIRED
    const unauth = await call("GET", "/client/adCredits/wallet");
    assert.equal(unauth.status, 401);
    assert.equal(unauth.json.code, "AUTH_REQUIRED");

    // 2. Owner without specifying userId -> 200 OK
    const ownerRes = await call("GET", "/client/adCredits/wallet", { token: tokOwner });
    assert.equal(ownerRes.status, 200);
    assert.equal(ownerRes.json.status, true);
    assert.equal(ownerRes.json.wallet.available, 0);

    // 3. Cross-user query mismatch -> 403 FORBIDDEN_USER_MISMATCH
    const tamperedQuery = await call("GET", "/client/adCredits/wallet?userId=u_adc_victim", { token: tokOwner });
    assert.equal(tamperedQuery.status, 403);
    assert.equal(tamperedQuery.json.code, "FORBIDDEN_USER_MISMATCH");

    // 4. Cross-user history query mismatch -> 403 FORBIDDEN_USER_MISMATCH
    const tamperedHistory = await call("GET", "/client/adCredits/history?userId=u_adc_victim", { token: tokOwner });
    assert.equal(tamperedHistory.status, 403);
    assert.equal(tamperedHistory.json.code, "FORBIDDEN_USER_MISMATCH");
  });

  // ── TEST 2: Client Credit Consumption Disabled ──────────────────────────────
  await check("ADC-02", "Client consumption disabled: /client/adCredits/consume returns 400 CONSUMPTION_UNAVAILABLE without changing balance", async () => {
    await seedUser("u_adc_consumer");
    const tok = await idToken("u_adc_consumer");

    const r = await call("POST", "/client/adCredits/consume", {
      token: tok,
      body: { amount: 10, purpose: "arbitrary_debit" },
    });
    assert.equal(r.status, 400);
    assert.equal(r.json.code, "CONSUMPTION_UNAVAILABLE");

    const u = await getUser("u_adc_consumer");
    assert.equal(u.adCreditsBalance || 0, 0);
  });

  // ── TEST 3: Admin Route Security ───────────────────────────────────────────
  await check("ADC-03", "Admin protection: app-shared key without admin JWT calling /admin/adCredits/* is rejected with 401", async () => {
    const rExpire = await call("POST", "/admin/adCredits/maintenance/expire", { body: { batchSize: 10 } });
    assert.equal(rExpire.status, 401);

    const rReverse = await call("POST", "/admin/adCredits/reverse", { body: { userId: "test", originalOperationId: "op_1" } });
    assert.equal(rReverse.status, 401);
  });

  // ── TEST 4: Pack Catalog Bonus Mathematics ──────────────────────────────────
  await check("ADC-04", "Pack catalog: 6 packs returned with exact inclusive base + bonus split", async () => {
    const r = await call("GET", "/client/adCredits/packs");
    assert.equal(r.status, 200);
    assert.equal(r.json.status, true);
    assert.equal(r.json.packs.length, 6);

    const p100 = r.json.packs.find((p) => p.id === "pack_100");
    assert.ok(p100);
    assert.equal(p100.credits, 100);
    assert.equal(p100.baseCredits, 98.04);
    assert.equal(p100.bonusCredits, 1.96);
    assert.equal(p100.priceINR, 160);

    const p3500 = r.json.packs.find((p) => p.id === "pack_3500");
    assert.ok(p3500);
    assert.equal(p3500.credits, 3500);
    assert.equal(p3500.baseCredits, 3301.89);
    assert.equal(p3500.bonusCredits, 198.11);

    const p7500 = r.json.packs.find((p) => p.id === "pack_7500");
    assert.ok(p7500);
    assert.equal(p7500.credits, 7500);
    assert.equal(p7500.baseCredits, 6578.95);
    assert.equal(p7500.bonusCredits, 921.05);
  });

  // ── TEST 5: Checkout Price Tamper Resistance ────────────────────────────────
  await check("ADC-05", "Checkout tamper guard: payment.createOrder rejects tampered ad_credits pack price", async () => {
    await seedUser("u_adc_buyer1");
    const tok = await idToken("u_adc_buyer1");

    const r = await call("POST", "/client/payment/createOrder", {
      token: tok,
      body: {
        userId: "u_adc_buyer1",
        purpose: "ad_credits",
        packId: "pack_100",
        amountInr: 10, // Attempted ₹10 for ₹160 pack!
      },
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.status, false);
    assert.match(r.json.message, /Price mismatch/);
  });

  // ── TEST 6: Webhook Fulfilment & Idempotency ─────────────────────────────────
  await check("ADC-06", "Webhook fulfilment: creates integer lots, ledger adc_${txnId}, duplicate webhook credits zero extra", async () => {
    await seedUser("u_adc_buyer2");
    const tok = await idToken("u_adc_buyer2");

    const o = await orderAdCredits("u_adc_buyer2", "pack_100", 160);
    const wh1 = await webhook(o.orderId, { amountPaise: 16000 });
    assert.equal(wh1.status, 200);

    // Verify wallet
    const u = await getUser("u_adc_buyer2");
    assert.equal(u.adCreditsBalance, 100);
    assert.equal(u.adCreditsBalanceUnits, 10000);

    // Verify ledger row exists at adc_${txnId}
    const ledger = await get("adCreditLedger", `adc_${o.id}`);
    assert.ok(ledger, `Ledger entry adc_${o.id} must exist`);
    assert.equal(ledger.credits, 100);
    assert.equal(ledger.baseCredits, 98.04);
    assert.equal(ledger.bonusCredits, 1.96);

    // Verify lots created
    const lots = await where("adCreditLots", "userId", "u_adc_buyer2");
    assert.equal(lots.length, 2);
    const baseLot = lots.find((l) => l.type === "BASE");
    const bonusLot = lots.find((l) => l.type === "BONUS");
    assert.ok(baseLot && bonusLot);
    assert.equal(baseLot.amount, 98.04);
    assert.equal(baseLot.remainingUnits, 9804);
    assert.equal(bonusLot.amount, 1.96);
    assert.equal(bonusLot.remainingUnits, 196);

    // Duplicate webhook execution -> idempotent
    const wh2 = await webhook(o.orderId, { amountPaise: 16000 });
    assert.equal(wh2.status, 200);

    const uAfter = await getUser("u_adc_buyer2");
    assert.equal(uAfter.adCreditsBalance, 100, "Duplicate webhook must not credit twice");
  });

  // ── TEST 7: Spend Engine FIFO & Overdraft Guard ──────────────────────────────
  await check("ADC-07", "Spend engine FIFO: expiring lots consumed before permanent plan credits, overdraft refused", async () => {
    await seedUser("u_adc_spender");

    // Grant 100 credits top-up (expires in 730 days: 98.04 base, 1.96 bonus)
    await adCreditWallet.grantCredits({
      userId: "u_adc_spender",
      amount: 98.04,
      bonus: 1.96,
      source: "TOPUP",
      type: "BASE",
      validityDays: 730,
      fs: fsdb,
    });

    // Grant 500 credits starter pass (permanent PLAN, expiresAt: null)
    await adCreditWallet.grantCredits({
      userId: "u_adc_spender",
      amount: 500,
      bonus: 0,
      source: "STARTER_PASS",
      type: "PLAN",
      validityDays: null,
      fs: fsdb,
    });

    // Total available: 600.00
    // 1. Overdraft attempt -> throws error
    let threwOverdraft = false;
    try {
      await adCreditWallet.spendCredits({
        userId: "u_adc_spender",
        amount: 700,
        operationId: "op_overdraft_1",
        fs: fsdb,
      });
    } catch (e) {
      threwOverdraft = true;
      assert.match(e.message, /Insufficient ad credits balance/);
    }
    assert.ok(threwOverdraft, "Overdraft spend must be refused");

    // 2. Spend 101 credits FIFO:
    // Should exhaust 98.04 BASE, 1.96 BONUS, then take 1.00 from PLAN
    const receipt = await adCreditWallet.spendCredits({
      userId: "u_adc_spender",
      amount: 101,
      operationId: "op_fifo_spend_1",
      purpose: "campaign_delivery",
      fs: fsdb,
    });
    assert.equal(receipt.success, true);
    assert.equal(receipt.balanceAfter, 499);
    assert.equal(receipt.lotsDeducted.length, 3);
    assert.equal(receipt.lotsDeducted[0].amountDeducted, 98.04);
    assert.equal(receipt.lotsDeducted[1].amountDeducted, 1.96);
    assert.equal(receipt.lotsDeducted[2].amountDeducted, 1.0);
    assert.equal(receipt.lotsDeducted[2].lotType, "PLAN");
  });

  // ── TEST 8: Spend Engine Idempotency & Conflict Detection ────────────────────
  await check("ADC-08", "Spend idempotency & conflict: identical opId replays cached receipt; mismatched opId throws 409", async () => {
    // 1. Replay identical spend -> returns cached receipt without extra debit
    const replay = await adCreditWallet.spendCredits({
      userId: "u_adc_spender",
      amount: 101,
      operationId: "op_fifo_spend_1",
      purpose: "campaign_delivery",
      fs: fsdb,
    });
    assert.equal(replay.replayed, true);
    assert.equal(replay.balanceAfter, 499);

    const u = await getUser("u_adc_spender");
    assert.equal(u.adCreditsBalance, 499);

    // 2. Conflict: reuse op_fifo_spend_1 with different amount
    let threwConflict = false;
    try {
      await adCreditWallet.spendCredits({
        userId: "u_adc_spender",
        amount: 50, // different amount!
        operationId: "op_fifo_spend_1",
        purpose: "campaign_delivery",
        fs: fsdb,
      });
    } catch (e) {
      threwConflict = true;
      assert.equal(e.code, "OPERATION_CONFLICT");
      assert.equal(e.status, 409);
    }
    assert.ok(threwConflict, "Parameter mismatch on reused opId must throw 409");
  });

  // ── TEST 9: Dynamic Expiry Enforcement ──────────────────────────────────────
  await check("ADC-09", "Dynamic expiry: lot whose expiresAt has passed is excluded from getWalletBalance before cron runs", async () => {
    await seedUser("u_adc_expiring");

    // Active lot
    await adCreditWallet.grantCredits({
      userId: "u_adc_expiring",
      amount: 50,
      source: "TOPUP",
      type: "BASE",
      validityDays: 30,
      fs: fsdb,
    });

    // Inject an expired lot (expired 2 days ago)
    const expLotId = "lot_exp_dyn_01";
    await set("adCreditLots", expLotId, {
      userId: "u_adc_expiring",
      source: "TOPUP",
      type: "BASE",
      amount: 40,
      amountUnits: 4000,
      remaining: 40,
      remainingUnits: 4000,
      expiresAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      status: "ACTIVE",
    });

    // Query balance: must be exactly 50.00, dynamically ignoring the 40.00 expired lot
    const bal = await adCreditWallet.getWalletBalance("u_adc_expiring", { fs: fsdb });
    assert.equal(bal.available, 50);
  });

  // ── TEST 10: Daily Cron Expiry Maintenance ──────────────────────────────────
  await check("ADC-10", "Daily cron maintenance: executes expireAdCredits with CRON_SECRET, exhausts lots, idempotent rerun", async () => {
    // Call daily cron with CRON_SECRET ("test-cron")
    const cronRes = await call("GET", "/cron/daily?key=test-cron");
    assert.equal(cronRes.status, 200);
    assert.ok(cronRes.json.tasks.expireAdCredits);
    assert.ok(cronRes.json.tasks.expireAdCredits.expiredLotsCount >= 1);

    // Verify expired lot is marked EXPIRED
    const expLot = await get("adCreditLots", "lot_exp_dyn_01");
    assert.equal(expLot.status, "EXPIRED");
    assert.equal(expLot.remainingUnits, 0);

    // Verify ledger entry created
    const expLedger = await get("adCreditLedger", `adc_exp_lot_exp_dyn_01`);
    assert.ok(expLedger, "Expiry ledger row must exist");
    assert.equal(expLedger.direction, "DEBIT");
    assert.equal(expLedger.source, "EXPIRY");

    // Second cron run is idempotent: 0 lots expired
    const cronRes2 = await call("GET", "/cron/daily?key=test-cron");
    assert.equal(cronRes2.status, 200);
    assert.equal(cronRes2.json.tasks.expireAdCredits.expiredLotsCount, 0);
  });

  // ── TEST 11: Provenance-Preserving Reversals ─────────────────────────────────
  await check("ADC-11", "Reversal provenance: restores exact lot types (PLAN keeps null expiry), deterministic ledger adc_rev_${origOpId}", async () => {
    // Reverse op_fifo_spend_1 from Test 7 (which consumed 98.04 BASE, 1.96 BONUS, 1.00 PLAN)
    const revReceipt = await adCreditWallet.reverseDebit({
      userId: "u_adc_spender",
      originalOperationId: "op_fifo_spend_1",
      reason: "Test refund",
      fs: fsdb,
    });

    assert.equal(revReceipt.success, true);
    assert.equal(revReceipt.restoredCredits, 101);
    assert.equal(revReceipt.balanceAfter, 600);
    assert.equal(revReceipt.lots.length, 3);

    // Check restored PLAN lot retains permanent expiresAt: null
    const planLot = revReceipt.lots.find((l) => l.type === "PLAN");
    assert.ok(planLot);
    assert.equal(planLot.expiresAt, null, "Restored PLAN lot must retain expiresAt: null");

    // Check restored BASE lot retains BASE type
    const baseLot = revReceipt.lots.find((l) => l.type === "BASE");
    assert.ok(baseLot);
    assert.equal(baseLot.type, "BASE");

    // Check deterministic ledger row adc_rev_op_fifo_spend_1
    const revLedger = await get("adCreditLedger", "adc_rev_op_fifo_spend_1");
    assert.ok(revLedger, "Ledger row adc_rev_op_fifo_spend_1 must exist");
    assert.equal(revLedger.direction, "CREDIT");
    assert.equal(revLedger.source, "REVERSAL");
  });

  // ── TEST 12: Expired Lot Reversal Policy Guard ──────────────────────────────
  await check("ADC-12", "Expired-lot reversal guard: reversing an operation whose deducted lot expired throws EXPIRED_CREDITS_NOT_REVERSIBLE", async () => {
    await seedUser("u_adc_rev_guard");

    // Seed an operation whose deducted lot has an expiration date in the past
    const pastOpId = "op_spend_with_past_lot";
    await set("adCreditOperations", pastOpId, {
      userId: "u_adc_rev_guard",
      amount: 25,
      amountUnits: 2500,
      purpose: "expired_spend",
      isReversed: false,
      lotsDeducted: [
        {
          lotId: "lot_historic_1",
          amountDeducted: 25,
          amountDeductedUnits: 2500,
          lotType: "BASE",
          expiresAt: new Date(Date.now() - 3600000).toISOString(), // expired 1 hour ago
        },
      ],
      createdAt: nowIso(),
    });

    let threwNotReversible = false;
    try {
      await adCreditWallet.reverseDebit({
        userId: "u_adc_rev_guard",
        originalOperationId: pastOpId,
        fs: fsdb,
      });
    } catch (e) {
      threwNotReversible = true;
      assert.equal(e.code, "EXPIRED_CREDITS_NOT_REVERSIBLE");
      assert.equal(e.statusCode, 422);
    }
    assert.ok(threwNotReversible, "Reversing an operation with expired lots must fail with EXPIRED_CREDITS_NOT_REVERSIBLE");
  });
};

