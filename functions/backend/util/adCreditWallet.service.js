/**
 * Authoritative Server-Side Ad Credits Wallet, Ledger & Consumption Service.
 *
 * Wallet model
 * ────────────
 *   - Integer-hundredths accounting: 1 credit = 100 integer units (no floating point in any stored value).
 *   - Lots (`adCreditLots`) and the immutable ledger (`adCreditLedger`) are authoritative.
 *     A lot is ACTIVE until it is exhausted (EXHAUSTED), swept after its expiry (EXPIRED) or set aside for
 *     manual review because its data is inconsistent (EXPIRY_REVIEW).
 *   - `available` (what can be spent) = sum of remaining units of ACTIVE lots whose expiresAt is in the future.
 *     Expiry is enforced dynamically on every read/spend, so an unswept expired lot is never spendable.
 *   - `users.adCreditsBalanceUnits` is a compatibility cache maintained by DELTAS in the same transaction as the
 *     lot mutation (grant +, spend −, reversal +, expiry −). Invariant:
 *         cache = legacyUnits + sum(remainingUnits of every ACTIVE lot, expired-but-unswept included)
 *     so `cache − available` equals the units still waiting for the expiry sweep. `legacyUnits` is any balance
 *     that predates lots (never spendable through the lot engine); deltas never touch it.
 *   - Spend is FIFO by earliest expiry (non-expiring PLAN credits last), idempotent per operationId and
 *     conflict-checked (HTTP 409) when an id is reused with different terms.
 *   - Reversal restores each deducted allocation with its original lot type, source and expiry. Any allocation that
 *     has already expired (expiresAt <= operation time) rejects the whole reversal — no partial restoration.
 *
 * Expiry sweep (see expireCredits): the eligibility query itself is the durable checkpoint — processed lots leave
 * the ACTIVE set, so there is no cursor to persist, lose or move past unprocessed work.
 */
"use strict";

const crypto = require("node:crypto");
const db = require("./connection");
const firebaseAdmin = require("./firebaseAdmin");
const setting = require("../setting");

const COLLECTIONS = {
  LOTS: "adCreditLots",
  LEDGER: "adCreditLedger",
  OPERATIONS: "adCreditOperations",
  USERS: "users",
};

const UNITS_PER_CREDIT = 100;
const PAISE_PER_INR = 100;

/** Upper bound for a single grant / debit / lot / balance, in units (10 billion credits). */
const MAX_UNITS = 1e12;
const OPERATION_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const LOT_TYPES = new Set(["PLAN", "BASE", "BONUS"]);

const EXPIRY_LIMITS = Object.freeze({
  DEFAULT_BATCH_SIZE: 100,
  MAX_BATCH_SIZE: 500,
  DEFAULT_MAX_BATCHES: 1,
  MAX_BATCHES: 20,
  /** Consecutive deterministic failures after which a lot is set aside for review so it cannot block the queue. */
  FAILURE_LIMIT: 3,
});

// gRPC status codes that mean "try again" rather than "this lot is broken".
const TRANSIENT_GRPC = new Set([1, 4, 8, 10, 13, 14]);
const TRANSIENT_NODE = new Set(["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "EPIPE", "ECONNREFUSED"]);

function coded(message, code, statusCode) {
  const err = new Error(message);
  err.code = code;
  if (statusCode) {
    err.statusCode = statusCode;
    err.status = statusCode;
  }
  return err;
}

function isTransient(err) {
  if (!err) return false;
  if (TRANSIENT_GRPC.has(err.code) || TRANSIENT_NODE.has(err.code)) return true;
  return /Transaction is invalid or closed|too much contention|Transaction was aborted/i.test(String(err.message || ""));
}

/** A label that is safe to return to callers: never the raw message (it can name documents or users). */
function safeErrorLabel(err) {
  if (!err) return "UNKNOWN";
  if (typeof err.code === "number") return `GRPC_${err.code}`;
  if (typeof err.code === "string" && /^[A-Z][A-Z0-9_]{1,47}$/.test(err.code)) return err.code;
  return "UNKNOWN";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function resolveNow(now) {
  if (now === null || now === undefined) return new Date();
  const d = now instanceof Date ? new Date(now.getTime()) : new Date(now);
  if (Number.isNaN(d.getTime())) throw coded("Invalid operation time.", "INVALID_PARAMETERS", 400);
  return d;
}

/**
 * Runs a Firestore transaction. The SDK already retries ABORTED a few times; this adds a bounded outer retry for
 * transient errors (contention bursts, dropped connections). Callbacks must be side-effect free outside the
 * transaction — every caller here only reads/writes through `tx` and returns an outcome object.
 */
async function runTx(firestore, fn, { attempts = 4 } = {}) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      return await firestore.runTransaction(fn, { maxAttempts: 5 });
    } catch (e) {
      last = e;
      if (!isTransient(e) || i === attempts - 1) throw e;
      await sleep(20 * 2 ** i + Math.floor(Math.random() * 40));
    }
  }
  throw last;
}

// ── Integer & Decimal Accounting Helpers ─────────────────────────────────────

/**
 * Converts a credit amount (number or string) to integer hundredths (1 credit = 100 units).
 * Parsed from the decimal text (never `value * 100`), so there is no binary-float drift. Rejects excess
 * precision (>2 decimals), exponent notation and values outside the safe integer range.
 */
function creditsToUnits(val) {
  if (val === null || val === undefined || val === "") {
    throw new Error("Credit value is required.");
  }

  let text;
  if (typeof val === "number") {
    if (!Number.isFinite(val)) {
      throw new Error("Credit value must be a finite number.");
    }
    text = String(val);
    if (/e/i.test(text)) {
      throw new Error(
        Math.abs(val) < 1
          ? `Excess precision: credits cannot exceed 2 decimal places (${val}).`
          : "Credit value exceeds safe integer bounds."
      );
    }
    const dec = text.split(".")[1];
    if (dec && dec.length > 2) {
      throw new Error(`Excess precision: credits cannot exceed 2 decimal places (${val}).`);
    }
  } else if (typeof val === "string") {
    text = val.trim();
    if (!/^-?\d+(\.\d{1,2})?$/.test(text)) {
      throw new Error(`Invalid credit format: '${val}'. Maximum 2 decimal places allowed.`);
    }
  } else {
    throw new Error("Credit value must be a number or numeric string.");
  }

  const negative = text.startsWith("-");
  const [whole, frac = ""] = text.replace("-", "").split(".");
  if (whole.length > 15) {
    throw new Error("Credit value exceeds safe integer bounds.");
  }
  const units = Number(whole) * UNITS_PER_CREDIT + Number((frac + "00").slice(0, 2));
  if (!Number.isSafeInteger(units)) {
    throw new Error("Credit value exceeds safe integer bounds.");
  }
  return negative && units !== 0 ? -units : units;
}

/** Validates an operation amount (already in units): safe integer within [0, MAX_UNITS]. */
function assertUnits(units, label) {
  if (!Number.isSafeInteger(units) || units < 0 || units > MAX_UNITS) {
    throw coded(`${label} is outside the supported range.`, "INVALID_AMOUNT", 400);
  }
  return units;
}

/** Operation amounts arrive from callers: map every parse failure to a typed 400. */
function parseOperationUnits(amount, label) {
  let units;
  try {
    units = creditsToUnits(amount);
  } catch (e) {
    throw coded(e.message, "INVALID_AMOUNT", 400);
  }
  return assertUnits(units, label);
}

/**
 * Converts integer hundredths back to a 2-decimal JavaScript number at API/UI boundaries.
 */
function unitsToCredits(units) {
  if (!Number.isSafeInteger(units)) {
    throw new Error("Units must be a safe integer.");
  }
  return Number((units / UNITS_PER_CREDIT).toFixed(2));
}

/**
 * Format integer units to a fixed 2-decimal string.
 */
function formatCredits(units) {
  return (units / UNITS_PER_CREDIT).toFixed(2);
}

/**
 * Safe 2-decimal rounding helper for legacy compatibility.
 */
function toDecimal2(val) {
  if (val === null || val === undefined || val === "") return 0;
  try {
    return unitsToCredits(creditsToUnits(val));
  } catch (e) {
    const n = Number(val);
    if (!Number.isFinite(n)) return 0;
    return Number(Math.round(Number(n + "e+2")) + "e-2");
  }
}

function num(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Reads a stored unit count. Prefers the integer field; falls back to the legacy 2-decimal credit field
 * (tolerating float noise, never a third decimal). Throws on anything that is not a non-negative safe integer,
 * so corrupt data is surfaced instead of being coerced.
 */
function readStoredUnits(doc, unitsField, creditsField) {
  const units = doc ? doc[unitsField] : undefined;
  if (units !== undefined && units !== null) {
    if (!Number.isSafeInteger(units) || units < 0 || units > MAX_UNITS) {
      throw coded(`Stored ${unitsField} is not a valid unit count.`, "STORED_UNITS_INVALID");
    }
    return units;
  }
  const credits = doc ? doc[creditsField] : undefined;
  if (credits === undefined || credits === null || credits === "") return 0;
  const n = Number(credits);
  const scaled = n * UNITS_PER_CREDIT;
  const rounded = Math.round(scaled);
  if (!Number.isFinite(n) || Math.abs(scaled - rounded) > 1e-6 || !Number.isSafeInteger(rounded) || rounded < 0 || rounded > MAX_UNITS) {
    throw coded(`Stored ${creditsField} is not a valid credit amount.`, "STORED_UNITS_INVALID");
  }
  return rounded;
}

const lotUnits = (lot) => readStoredUnits(lot, "remainingUnits", "remaining");
const userBalanceUnits = (user) => readStoredUnits(user, "adCreditsBalanceUnits", "adCreditsBalance");

/**
 * Converts INR amount to paise integer (1 INR = 100 paise).
 */
function inrToPaise(val) {
  const n = Number(val);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Invalid INR amount.");
  }
  return Math.round(n * PAISE_PER_INR);
}

/**
 * Converts paise integer to INR 2-decimal number.
 */
function paiseToInr(paise) {
  return Number((paise / PAISE_PER_INR).toFixed(2));
}

// ── Authoritative Bonus Calculation ──────────────────────────────────────────
/**
 * Computes base and bonus credit split according to approved business policy:
 *   - Pack quantity (totalCredits) is the total received, inclusive of bonus.
 *   - Bonus percentage is calculated relative to the base:
 *       base = total / (1 + bonusPercent / 100)
 *       bonus = total - roundedBase
 *
 * Example (100 credits at 2%):
 *   base = 100 / 1.02 = 98.04
 *   bonus = 100 - 98.04 = 1.96
 *   total = 100.00
 */
function calculatePackSplit(totalCredits, bonusPercent) {
  const totalUnits = creditsToUnits(totalCredits);
  const bp = num(bonusPercent, 0);

  if (bp <= 0) {
    return {
      totalUnits,
      baseUnits: totalUnits,
      bonusUnits: 0,
      totalCredits: unitsToCredits(totalUnits),
      baseCredits: unitsToCredits(totalUnits),
      bonusCredits: 0.0,
      bonusPercent: 0,
    };
  }

  // Integer-hundredths rounding of base
  const baseUnits = Math.round(totalUnits / (1 + bp / 100));
  const bonusUnits = totalUnits - baseUnits;

  return {
    totalUnits,
    baseUnits,
    bonusUnits,
    totalCredits: unitsToCredits(totalUnits),
    baseCredits: unitsToCredits(baseUnits),
    bonusCredits: unitsToCredits(bonusUnits),
    bonusPercent: bp,
  };
}

// ── Top-Up Pack Catalog Helpers ──────────────────────────────────────────────
function getPacks() {
  const packs = Array.isArray(setting.adCreditPacks) ? setting.adCreditPacks : [];
  const defaultValidity = num(setting.adCreditValidityDays, 730);

  return packs.map((p, idx) => {
    const id = p.id || `pack_${p.credits || idx}`;
    const totalCredits = p.credits != null ? p.credits : 0;
    const bonusPercent = num(p.bonusPercent, 0);
    const split = calculatePackSplit(totalCredits, bonusPercent);

    const priceINR = toDecimal2(p.priceINR);
    const pricePaise = inrToPaise(priceINR);
    const validityDays = num(p.validityDays, defaultValidity);

    return {
      id,
      name: p.name || `${split.totalCredits} Credits`,
      credits: split.totalCredits,
      creditUnits: split.totalUnits,
      baseCredits: split.baseCredits,
      baseCreditUnits: split.baseUnits,
      bonusCredits: split.bonusCredits,
      bonusCreditUnits: split.bonusUnits,
      bonusPercent: split.bonusPercent,
      priceINR,
      pricePaise,
      validityDays,
      isActive: p.isActive !== false,
    };
  });
}

function findPack(packIdOrName) {
  if (!packIdOrName) return null;
  const key = String(packIdOrName).trim().toLowerCase();
  const packs = getPacks();
  return packs.find((p) => p.id.toLowerCase() === key || p.name.toLowerCase() === key) || null;
}

function snapshotPack(pack) {
  const split = calculatePackSplit(pack.credits, pack.bonusPercent);
  const priceINR = toDecimal2(pack.priceINR);

  return {
    id: pack.id,
    name: pack.name,
    credits: split.totalCredits,
    creditUnits: split.totalUnits,
    baseCredits: split.baseCredits,
    baseCreditUnits: split.baseUnits,
    bonusCredits: split.bonusCredits,
    bonusCreditUnits: split.bonusUnits,
    bonusPercent: split.bonusPercent,
    priceINR,
    pricePaise: inrToPaise(priceINR),
    validityDays: num(pack.validityDays, 730),
    snapshottedAt: new Date().toISOString(),
  };
}

// ── Authoritative Wallet Balance Query ─────────────────────────────────────────
/**
 * Reads all active lots for a user and calculates:
 *   - available: unexpired usable balance (unitsToCredits)
 *   - availableUnits: integer units of available balance
 *   - plan: non-expiring starter pass / partner license credits
 *   - topup: unexpired purchased base credits
 *   - bonus: unexpired promotional bonus credits
 *   - expiringSoon: credits expiring within the next 30 days (tracked as a SUBSET of available)
 *   - expiringSoonDate: ISO date of earliest expiring unexhausted lot
 *
 * Expired-but-unswept lots and lots whose stored units are corrupt are excluded (they can never be spent).
 */
async function getWalletBalance(userId, { tx = null, fs = null, now = null } = {}) {
  const uid = String(userId);
  const firestore = fs || db.getDb();
  const at = resolveNow(now);
  const nowIso = at.toISOString();
  const soonLimitIso = new Date(at.getTime() + 30 * 86400000).toISOString();

  const lotsQuery = firestore
    .collection(COLLECTIONS.LOTS)
    .where("userId", "==", uid)
    .where("status", "==", "ACTIVE");

  const snapshot = tx ? await tx.get(lotsQuery) : await lotsQuery.get();

  let availableUnits = 0;
  let planUnits = 0;
  let topupUnits = 0;
  let bonusUnits = 0;
  let expiringSoonUnits = 0;
  let earliestExpiringDate = null;
  const activeLots = [];

  snapshot.forEach((doc) => {
    const lot = doc.data();
    lot._id = doc.id;
    lot.id = doc.id;

    let remainingUnits;
    try {
      remainingUnits = lotUnits(lot);
    } catch (e) {
      console.warn(`adCreditWallet: lot ${doc.id} has invalid stored units; excluded from available balance.`);
      return;
    }
    if (remainingUnits <= 0) return;

    // Dynamic expiry enforcement: do NOT count expired lots even if worker hasn't run yet
    if (lot.expiresAt && lot.expiresAt <= nowIso) {
      return;
    }

    availableUnits += remainingUnits;

    if (lot.type === "PLAN") {
      planUnits += remainingUnits;
    } else if (lot.type === "BONUS") {
      bonusUnits += remainingUnits;
    } else {
      topupUnits += remainingUnits;
    }

    if (lot.expiresAt && lot.expiresAt <= soonLimitIso) {
      expiringSoonUnits += remainingUnits;
      if (!earliestExpiringDate || lot.expiresAt < earliestExpiringDate) {
        earliestExpiringDate = lot.expiresAt;
      }
    }

    activeLots.push({
      ...lot,
      remainingUnits,
      remaining: unitsToCredits(remainingUnits),
    });
  });

  return {
    userId: uid,
    available: unitsToCredits(availableUnits),
    availableUnits,
    plan: unitsToCredits(planUnits),
    planUnits,
    topup: unitsToCredits(topupUnits),
    topupUnits,
    bonus: unitsToCredits(bonusUnits),
    bonusUnits,
    expiringSoon: unitsToCredits(expiringSoonUnits),
    expiringSoonUnits,
    expiringSoonDate: earliestExpiringDate,
    activeLotsCount: activeLots.length,
    activeLots,
  };
}

// ── Grant Credits (Top-up, Starter Pass, Partner License) ────────────────────
/**
 * Grants credits atomically creating grant lot(s) and writing immutable credit ledger.
 * All arithmetic executed in integer units. When `paymentTransactionId` is given, lot and ledger ids are derived
 * from it, so a replay can never create a second grant (document creation fails instead).
 */
async function grantCredits({
  userId,
  amount,
  bonus = 0,
  source, // "TOPUP" | "STARTER_PASS" | "PARTNER_LICENSE" | "MIGRATION" | "REVERSAL"
  type = "BASE", // "BASE" | "PLAN" | "BONUS"
  validityDays = null,
  paymentTransactionId = null,
  packId = null,
  ref = null,
  tx = null,
  fs = null,
  now = null,
}) {
  const uid = String(userId);
  const firestore = fs || db.getDb();
  const at = resolveNow(now);
  const nowIso = at.toISOString();

  const baseUnits = parseOperationUnits(amount, "Grant amount");
  const bonusUnits = bonus ? parseOperationUnits(bonus, "Bonus amount") : 0;
  const totalUnits = baseUnits + bonusUnits;
  assertUnits(totalUnits, "Grant total");

  if (totalUnits <= 0) {
    throw coded("Grant amount must be greater than zero.", "INVALID_AMOUNT", 400);
  }

  let days = null;
  if (validityDays !== null && validityDays !== undefined) {
    days = Number(validityDays);
    if (!Number.isFinite(days) || days < 0 || days > 3650) {
      throw coded("validityDays must be between 0 and 3650.", "INVALID_PARAMETERS", 400);
    }
  }

  const computeExpiresAt = (d) => {
    if (!d || d <= 0) return null;
    return new Date(at.getTime() + d * 86400000).toISOString();
  };

  const txnKey = paymentTransactionId ? String(paymentTransactionId) : null;
  const uniq = txnKey ? null : crypto.randomUUID();

  const executeGrant = async (transaction) => {
    const userRef = firestore.collection(COLLECTIONS.USERS).doc(uid);
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw coded(`User ${uid} not found.`, "USER_NOT_FOUND", 404);
    }
    const userData = userSnap.data();
    let currentUserUnits;
    let existingGrantedUnits;
    try {
      currentUserUnits = userBalanceUnits(userData);
      existingGrantedUnits = readStoredUnits(userData, "adCreditsGrantedUnits", "adCreditsGranted");
    } catch (e) {
      throw coded("Wallet balance data is inconsistent; grant refused.", "WALLET_INCONSISTENT", 409);
    }
    const newUserUnits = currentUserUnits + totalUnits;
    const newGrantedUnits = existingGrantedUnits + totalUnits;
    if (!Number.isSafeInteger(newUserUnits) || !Number.isSafeInteger(newGrantedUnits)) {
      throw coded("Wallet balance would exceed the supported range.", "INVALID_AMOUNT", 400);
    }

    const createdLots = [];
    const makeLot = (lotId, lotType, units, expiresAt) => {
      const lotRef = firestore.collection(COLLECTIONS.LOTS).doc(lotId);
      const lotDoc = {
        _id: lotId,
        id: lotId,
        userId: uid,
        source: String(source).toUpperCase(),
        type: lotType,
        amount: unitsToCredits(units),
        amountUnits: units,
        remaining: unitsToCredits(units),
        remainingUnits: units,
        expiresAt,
        status: "ACTIVE",
        paymentTransactionId: txnKey,
        packId: packId ? String(packId) : null,
        ref: ref || {},
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      transaction.create(lotRef, lotDoc);
      createdLots.push(lotDoc);
    };

    // 1. Base/Plan lot
    if (baseUnits > 0) {
      const lotType = type === "PLAN" ? "PLAN" : "BASE";
      const lotId = txnKey ? `lot_${txnKey}_base` : `lot_${uniq}_base`;
      makeLot(lotId, lotType, baseUnits, lotType === "PLAN" ? null : computeExpiresAt(days));
    }

    // 2. Bonus lot (if applicable)
    if (bonusUnits > 0) {
      const lotId = txnKey ? `lot_${txnKey}_bonus` : `lot_${uniq}_bonus`;
      makeLot(lotId, "BONUS", bonusUnits, computeExpiresAt(days));
    }

    // 3. Immutable Credit Ledger entry
    const ledgerId = txnKey ? `adc_${txnKey}` : `adc_${uniq}`;
    const ledgerRef = firestore.collection(COLLECTIONS.LEDGER).doc(ledgerId);

    const ledgerDoc = {
      _id: ledgerId,
      id: ledgerId,
      userId: uid,
      credits: unitsToCredits(totalUnits),
      creditUnits: totalUnits,
      baseCredits: unitsToCredits(baseUnits),
      baseCreditUnits: baseUnits,
      bonusCredits: unitsToCredits(bonusUnits),
      bonusCreditUnits: bonusUnits,
      direction: "CREDIT",
      source: String(source).toUpperCase(),
      type: bonusUnits > 0 ? "MIXED" : type,
      paymentTransactionId: txnKey,
      packId: packId ? String(packId) : null,
      balanceAfter: unitsToCredits(newUserUnits),
      balanceAfterUnits: newUserUnits,
      lotsCreated: createdLots.map((l) => ({
        lotId: l.id,
        amount: l.amount,
        amountUnits: l.amountUnits,
        type: l.type,
        expiresAt: l.expiresAt,
      })),
      ref: ref || {},
      createdAt: nowIso,
    };
    transaction.create(ledgerRef, ledgerDoc);

    // 4. Update user profile cache (delta)
    transaction.set(
      userRef,
      {
        adCreditsBalance: unitsToCredits(newUserUnits),
        adCreditsBalanceUnits: newUserUnits,
        adCreditsGranted: unitsToCredits(newGrantedUnits),
        adCreditsGrantedUnits: newGrantedUnits,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    return {
      userId: uid,
      creditsGranted: unitsToCredits(totalUnits),
      creditUnits: totalUnits,
      baseCredits: unitsToCredits(baseUnits),
      bonusCredits: unitsToCredits(bonusUnits),
      balanceAfter: unitsToCredits(newUserUnits),
      balanceAfterUnits: newUserUnits,
      lots: createdLots,
      ledgerId,
    };
  };

  if (tx) {
    return executeGrant(tx);
  }
  return runTx(firestore, (transaction) => executeGrant(transaction));
}

// ── Spend Credits (Debit Engine with FIFO & Idempotency) ──────────────────────
function receiptFromMarker(opId, data) {
  const existingUnits = readStoredUnits(data, "amountUnits", "amount");
  const balanceUnits = readStoredUnits(data, "balanceAfterUnits", "balanceAfter");
  return {
    success: true,
    replayed: true,
    operationId: opId,
    debitedAmount: unitsToCredits(existingUnits),
    debitedUnits: existingUnits,
    balanceAfter: unitsToCredits(balanceUnits),
    balanceAfterUnits: balanceUnits,
    lotsDeducted: data.lotsDeducted || [],
    message: "Operation previously completed.",
  };
}

function operationConflict() {
  return coded("Operation ID conflict: previously executed with differing parameters.", "OPERATION_CONFLICT", 409);
}

function assertSameOperation(data, uid, debitUnits, purpose) {
  let existingUnits;
  try {
    existingUnits = readStoredUnits(data, "amountUnits", "amount");
  } catch (e) {
    throw operationConflict();
  }
  if (data.userId !== uid || existingUnits !== debitUnits || data.purpose !== purpose) {
    throw operationConflict();
  }
}

/**
 * Debits unexpired credits transactionally.
 *
 * Requirements enforced:
 *   - Account ownership authorization.
 *   - Mandatory stable `operationId` for exact once-execution semantics.
 *   - Conflict detection: Reusing an operation ID with differing parameters throws HTTP 409 conflict.
 *   - Legitimate retries with matching parameters return the original receipt without double debit.
 *   - Debit strictly unexpired available credits; prevents overdrafts under concurrent requests.
 *   - Spend Order: FIFO earliest-expiring first (`expiresAt ASC`), consuming permanent plan credits last.
 *   - All reads precede all writes in the transaction.
 *   - Records lot-by-lot deductions and immutable debit ledger entry in integer units.
 *   - The compatibility balance moves by the debit (a delta); it is never recomputed from a subset of lots.
 */
async function spendCredits({
  userId,
  amount,
  operationId,
  purpose = "advertising_consumption",
  reference = null,
  fs = null,
  now = null,
}) {
  const uid = String(userId || "").trim();
  const opId = String(operationId === null || operationId === undefined ? "" : operationId).trim();
  if (!uid) throw coded("userId is required.", "INVALID_PARAMETERS", 400);
  if (!opId) throw coded("operationId is required for idempotent spend.", "INVALID_OPERATION_ID", 400);
  if (!OPERATION_ID_RE.test(opId) || opId.startsWith("rev_")) {
    throw coded(
      "operationId must be 1-128 characters of letters, digits, '_', '.', ':' or '-', and may not start with 'rev_'.",
      "INVALID_OPERATION_ID",
      400
    );
  }

  const debitUnits = parseOperationUnits(amount, "Debit amount");
  if (debitUnits <= 0) {
    throw coded("Debit amount must be greater than zero.", "INVALID_AMOUNT", 400);
  }

  const firestore = fs || db.getDb();
  const at = resolveNow(now);
  const nowIso = at.toISOString();

  // 1. Cheap replay check before opening a transaction (authoritative check is repeated inside it)
  const opMarkerRef = firestore.collection(COLLECTIONS.OPERATIONS).doc(opId);
  const existingOp = await opMarkerRef.get();
  if (existingOp.exists) {
    const data = existingOp.data();
    assertSameOperation(data, uid, debitUnits, purpose);
    return receiptFromMarker(opId, data);
  }

  return runTx(firestore, async (transaction) => {
    // ── READS (in-transaction, authoritative) ────────────────────────────────
    const inTxOp = await transaction.get(opMarkerRef);
    if (inTxOp.exists) {
      const data = inTxOp.data();
      assertSameOperation(data, uid, debitUnits, purpose);
      return receiptFromMarker(opId, data);
    }

    const userRef = firestore.collection(COLLECTIONS.USERS).doc(uid);
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw coded(`User ${uid} not found.`, "USER_NOT_FOUND", 404);
    }
    const userData = userSnap.data();
    if (userData.isBlock) {
      throw coded("Account is blocked.", "ACCOUNT_BLOCKED", 403);
    }

    const lotsQuery = firestore
      .collection(COLLECTIONS.LOTS)
      .where("userId", "==", uid)
      .where("status", "==", "ACTIVE");
    const lotsSnap = await transaction.get(lotsQuery);

    // ── ALL READS FINISHED — NOW COMPUTE ──────────────────────────────────────
    let currentBalanceUnits;
    try {
      currentBalanceUnits = userBalanceUnits(userData);
    } catch (e) {
      throw coded("Wallet balance data is inconsistent; spend refused.", "WALLET_INCONSISTENT", 409);
    }

    const eligibleLots = [];
    let totalAvailableUnits = 0;

    lotsSnap.forEach((doc) => {
      const lot = doc.data();
      lot._id = doc.id;
      lot.id = doc.id;
      let remUnits;
      try {
        remUnits = lotUnits(lot);
      } catch (e) {
        return; // corrupt lot: never spend from it
      }
      if (remUnits <= 0) return;

      // Dynamic expiry: ignore expired lots
      if (lot.expiresAt && lot.expiresAt <= nowIso) return;

      totalAvailableUnits += remUnits;
      eligibleLots.push({ ...lot, remainingUnits: remUnits });
    });

    if (totalAvailableUnits < debitUnits) {
      throw coded(
        `Insufficient ad credits balance. Available: ${unitsToCredits(totalAvailableUnits).toFixed(2)}, Requested: ${unitsToCredits(debitUnits).toFixed(2)}.`,
        "INSUFFICIENT_CREDITS",
        409
      );
    }

    if (currentBalanceUnits < debitUnits) {
      // The lots are authoritative, but a cache lower than the debit means the wallet is corrupt:
      // refuse rather than drive the cache negative or silently clamp it.
      throw coded("Wallet balance data is inconsistent; spend refused.", "WALLET_INCONSISTENT", 409);
    }

    // FIFO earliest-expiring first; PLAN (non-expiring) last; ties by createdAt then id (total order).
    eligibleLots.sort((a, b) => {
      if (a.expiresAt && b.expiresAt) {
        if (a.expiresAt !== b.expiresAt) return a.expiresAt < b.expiresAt ? -1 : 1;
      } else if (a.expiresAt) {
        return -1;
      } else if (b.expiresAt) {
        return 1;
      }
      const ca = a.createdAt || "";
      const cb = b.createdAt || "";
      if (ca !== cb) return ca < cb ? -1 : 1;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

    let remainingToDebitUnits = debitUnits;
    const lotsDeducted = [];
    const lotUpdates = [];

    for (const lot of eligibleLots) {
      if (remainingToDebitUnits <= 0) break;

      const deductUnits = Math.min(lot.remainingUnits, remainingToDebitUnits);
      if (deductUnits <= 0) continue;

      const newRemainingUnits = lot.remainingUnits - deductUnits;
      const isExhausted = newRemainingUnits <= 0;

      lotUpdates.push({
        ref: firestore.collection(COLLECTIONS.LOTS).doc(lot.id),
        data: {
          remaining: unitsToCredits(newRemainingUnits),
          remainingUnits: newRemainingUnits,
          status: isExhausted ? "EXHAUSTED" : "ACTIVE",
          updatedAt: nowIso,
        },
      });

      lotsDeducted.push({
        lotId: lot.id,
        amountDeducted: unitsToCredits(deductUnits),
        amountDeductedUnits: deductUnits,
        lotType: lot.type,
        lotSource: lot.source,
        expiresAt: lot.expiresAt || null,
      });

      remainingToDebitUnits -= deductUnits;
    }

    if (remainingToDebitUnits > 0) {
      throw coded("Debit allocation error: could not satisfy required amount from eligible lots.", "ALLOCATION_FAILED", 500);
    }

    const newBalanceUnits = currentBalanceUnits - debitUnits;

    // ── ALL WRITES ────────────────────────────────────────────────────────────
    for (const update of lotUpdates) {
      transaction.update(update.ref, update.data);
    }

    // Immutable DEBIT entry in adCreditLedger
    const ledgerId = `adc_debit_${opId}`;
    const ledgerRef = firestore.collection(COLLECTIONS.LEDGER).doc(ledgerId);
    transaction.create(ledgerRef, {
      _id: ledgerId,
      id: ledgerId,
      userId: uid,
      credits: unitsToCredits(debitUnits),
      creditUnits: debitUnits,
      direction: "DEBIT",
      source: "SPEND",
      purpose,
      operationId: opId,
      lotsDeducted,
      balanceAfter: unitsToCredits(newBalanceUnits),
      balanceAfterUnits: newBalanceUnits,
      reference: reference || {},
      createdAt: nowIso,
    });

    // Idempotency marker
    transaction.create(opMarkerRef, {
      _id: opId,
      id: opId,
      userId: uid,
      amount: unitsToCredits(debitUnits),
      amountUnits: debitUnits,
      purpose,
      balanceAfter: unitsToCredits(newBalanceUnits),
      balanceAfterUnits: newBalanceUnits,
      lotsDeducted,
      reference: reference || {},
      createdAt: nowIso,
    });

    // Synchronize user balance (delta)
    transaction.set(
      userRef,
      {
        adCreditsBalance: unitsToCredits(newBalanceUnits),
        adCreditsBalanceUnits: newBalanceUnits,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    return {
      success: true,
      replayed: false,
      operationId: opId,
      debitedAmount: unitsToCredits(debitUnits),
      debitedUnits: debitUnits,
      balanceAfter: unitsToCredits(newBalanceUnits),
      balanceAfterUnits: newBalanceUnits,
      lotsDeducted,
      ledgerId,
    };
  });
}

// ── Expiry Maintenance Job ───────────────────────────────────────────────────
/**
 * Eligibility model
 * ─────────────────
 * A lot is eligible for expiry when   status == "ACTIVE"  AND  expiresAt <= asOf.
 * Non-expiring lots (expiresAt: null) are excluded by the range filter itself, so they can never occupy a page.
 * Every outcome moves the lot OUT of the ACTIVE set (EXPIRED, EXHAUSTED, or EXPIRY_REVIEW), so "the first N
 * eligible lots ordered by (expiresAt, documentId)" is always the next unprocessed work: there is no cursor to
 * persist, lose or advance past unprocessed lots. Index: adCreditLots (status ASC, expiresAt ASC) + implicit __name__.
 *
 * Progress guarantees
 * ───────────────────
 *   - Order is total: expiresAt ASC, then document id ASC.
 *   - One page = at most `batchSize` reads; at most `maxBatches` pages and `deadlineMs` bound a single invocation.
 *     An in-memory cursor moves past lots that failed IN THIS RUN so one bad lot cannot hide the rest of its page;
 *     it is never stored, so the next invocation re-examines everything still ACTIVE.
 *   - A lot that fails deterministically `FAILURE_LIMIT` times is set aside (EXPIRY_REVIEW); transient errors
 *     (contention, dropped connections) never count against a lot.
 *   - Lots inserted behind any earlier position are picked up by the next invocation (nothing is checkpointed).
 *
 * Concurrency / retries
 * ─────────────────────
 *   - Each lot is processed in its own transaction that re-reads the lot, its owner and the deterministic ledger
 *     document, re-checks status/expiry/units from authoritative data, and commits lot exhaustion + compatibility
 *     balance + immutable `adc_exp_<lotId>` ledger entry atomically. Overlapping workers serialize on the lot;
 *     the loser observes a non-ACTIVE lot and skips it. No lease is required.
 *   - The transaction callback only returns an outcome; counters are aggregated after `runTransaction` resolves,
 *     so SDK retries can never inflate totals.
 *   - The operation time (`asOf`) is fixed once per invocation and reused by every retry.
 *
 * Returns committed counts only (no lot or user identifiers except `processedLotIds`, which callers that
 * expose results over HTTP must strip — see toPublicExpiryResult).
 */
async function processExpiredLot(firestore, lotId, asOfIso) {
  const lotRef = firestore.collection(COLLECTIONS.LOTS).doc(lotId);

  return runTx(firestore, async (tx) => {
    // ── READS ────────────────────────────────────────────────────────────────
    const lotSnap = await tx.get(lotRef);
    if (!lotSnap.exists) return { outcome: "SKIPPED", reason: "MISSING" };
    const lot = lotSnap.data();
    if (lot.status !== "ACTIVE") return { outcome: "SKIPPED", reason: "NOT_ACTIVE" };
    if (typeof lot.expiresAt !== "string" || !(lot.expiresAt <= asOfIso)) {
      return { outcome: "SKIPPED", reason: "NOT_EXPIRED" };
    }

    const review = (reason) => {
      tx.update(lotRef, {
        status: "EXPIRY_REVIEW",
        expiryReviewReason: reason,
        expiryReviewedAt: asOfIso,
        updatedAt: asOfIso,
      });
      return { outcome: "REVIEW", reason };
    };

    const ownerId = typeof lot.userId === "string" ? lot.userId.trim() : "";
    if (!ownerId) return review("LOT_OWNER_INVALID");

    let units;
    try {
      units = lotUnits(lot);
    } catch (e) {
      return review("LOT_UNITS_INVALID");
    }

    if (units === 0) {
      tx.update(lotRef, { status: "EXHAUSTED", remaining: 0, remainingUnits: 0, updatedAt: asOfIso });
      return { outcome: "EXHAUSTED" };
    }

    const userRef = firestore.collection(COLLECTIONS.USERS).doc(ownerId);
    const ledgerId = `adc_exp_${lotId}`;
    const ledgerRef = firestore.collection(COLLECTIONS.LEDGER).doc(ledgerId);
    const userSnap = await tx.get(userRef);
    const ledgerSnap = await tx.get(ledgerRef);

    if (!userSnap.exists) return review("OWNER_NOT_FOUND");
    if (ledgerSnap.exists) return review("LEDGER_ENTRY_EXISTS");

    let balanceUnits;
    try {
      balanceUnits = userBalanceUnits(userSnap.data());
    } catch (e) {
      return review("OWNER_BALANCE_INVALID");
    }
    if (balanceUnits < units) return review("BALANCE_BELOW_LOT");

    // ── WRITES (all reads are done) ──────────────────────────────────────────
    const newBalanceUnits = balanceUnits - units;

    tx.update(lotRef, {
      remaining: 0,
      remainingUnits: 0,
      status: "EXPIRED",
      expiredAt: asOfIso,
      updatedAt: asOfIso,
    });

    tx.create(ledgerRef, {
      _id: ledgerId,
      id: ledgerId,
      userId: ownerId,
      credits: unitsToCredits(units),
      creditUnits: units,
      direction: "DEBIT",
      source: "EXPIRY",
      purpose: "lot_expired",
      lotsDeducted: [
        {
          lotId,
          amountDeducted: unitsToCredits(units),
          amountDeductedUnits: units,
          lotType: lot.type,
          expiresAt: lot.expiresAt,
        },
      ],
      balanceAfter: unitsToCredits(newBalanceUnits),
      balanceAfterUnits: newBalanceUnits,
      createdAt: asOfIso,
    });

    tx.update(userRef, {
      adCreditsBalance: unitsToCredits(newBalanceUnits),
      adCreditsBalanceUnits: newBalanceUnits,
      updatedAt: asOfIso,
    });

    return { outcome: "EXPIRED", units };
  });
}

/** Counts a deterministic failure against a lot; sets it aside once FAILURE_LIMIT is reached. */
async function recordExpiryFailure(firestore, lotId, err, asOfIso) {
  const lotRef = firestore.collection(COLLECTIONS.LOTS).doc(lotId);
  return runTx(firestore, async (tx) => {
    const snap = await tx.get(lotRef);
    if (!snap.exists) return { quarantined: false };
    const lot = snap.data();
    if (lot.status !== "ACTIVE") return { quarantined: false };
    const failures = (Number.isSafeInteger(lot.expiryFailures) ? lot.expiryFailures : 0) + 1;
    const patch = {
      expiryFailures: failures,
      expiryLastError: safeErrorLabel(err),
      expiryLastFailureAt: asOfIso,
      updatedAt: asOfIso,
    };
    const quarantined = failures >= EXPIRY_LIMITS.FAILURE_LIMIT;
    if (quarantined) {
      patch.status = "EXPIRY_REVIEW";
      patch.expiryReviewReason = "REPEATED_FAILURE";
      patch.expiryReviewedAt = asOfIso;
    }
    tx.update(lotRef, patch);
    return { quarantined };
  });
}

function invalidParameter(message) {
  return coded(message, "INVALID_PARAMETERS", 400);
}

async function expireCredits({
  batchSize = EXPIRY_LIMITS.DEFAULT_BATCH_SIZE,
  maxBatches = EXPIRY_LIMITS.DEFAULT_MAX_BATCHES,
  deadlineMs = null,
  now = null,
  fs = null,
} = {}) {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > EXPIRY_LIMITS.MAX_BATCH_SIZE) {
    throw invalidParameter(`batchSize must be an integer between 1 and ${EXPIRY_LIMITS.MAX_BATCH_SIZE}.`);
  }
  if (!Number.isInteger(maxBatches) || maxBatches < 1 || maxBatches > EXPIRY_LIMITS.MAX_BATCHES) {
    throw invalidParameter(`maxBatches must be an integer between 1 and ${EXPIRY_LIMITS.MAX_BATCHES}.`);
  }
  if (deadlineMs !== null && !Number.isFinite(deadlineMs)) {
    throw invalidParameter("deadlineMs must be an epoch-millisecond number.");
  }

  const firestore = fs || db.getDb();
  const asOf = resolveNow(now);
  const asOfIso = asOf.toISOString();
  const FieldPath = firebaseAdmin.firestore.FieldPath;
  const outOfTime = () => deadlineMs !== null && Date.now() >= deadlineMs;

  const eligibleQuery = () =>
    firestore
      .collection(COLLECTIONS.LOTS)
      .where("status", "==", "ACTIVE")
      .where("expiresAt", "<=", asOfIso)
      .orderBy("expiresAt", "asc")
      .orderBy(FieldPath.documentId(), "asc");

  const result = {
    asOf: asOfIso,
    batchSize,
    maxBatches,
    batches: 0,
    scannedLots: 0,
    expiredLotsCount: 0,
    totalUnitsExpired: 0,
    totalCreditsExpired: 0,
    exhaustedLotsCount: 0,
    alreadyProcessedLotsCount: 0,
    reviewLotsCount: 0,
    reviewReasons: {},
    errorCount: 0,
    errorCodes: {},
    moreWork: false,
    stoppedReason: null,
    processedLotIds: [],
  };

  const bump = (map, key) => {
    map[key] = (map[key] || 0) + 1;
  };

  let after = null; // in-memory only: skips lots that failed earlier in THIS invocation
  let stopped = null;

  pages: for (let page = 0; page < maxBatches; page++) {
    if (outOfTime()) {
      stopped = "TIME_BUDGET";
      break;
    }

    let query = eligibleQuery().limit(batchSize);
    if (after) query = query.startAfter(after);
    const snap = await query.get();
    result.batches += 1;
    result.scannedLots += snap.size;

    if (snap.empty) {
      stopped = "COMPLETE";
      break;
    }

    for (const doc of snap.docs) {
      if (outOfTime()) {
        stopped = "TIME_BUDGET";
        break pages;
      }

      let outcome;
      try {
        outcome = await processExpiredLot(firestore, doc.id, asOfIso);
      } catch (err) {
        result.errorCount += 1;
        bump(result.errorCodes, safeErrorLabel(err));
        console.warn(`adCreditWallet.expireCredits: lot ${doc.id} failed (${safeErrorLabel(err)}).`);
        if (!isTransient(err)) {
          try {
            const rec = await recordExpiryFailure(firestore, doc.id, err, asOfIso);
            if (rec.quarantined) {
              result.reviewLotsCount += 1;
              bump(result.reviewReasons, "REPEATED_FAILURE");
            }
          } catch (_) {
            /* bookkeeping is best effort; the lot simply stays eligible */
          }
        }
        continue;
      }

      // Committed outcomes only — runTransaction has resolved at this point.
      switch (outcome.outcome) {
        case "EXPIRED":
          result.expiredLotsCount += 1;
          result.totalUnitsExpired += outcome.units;
          result.processedLotIds.push(doc.id);
          break;
        case "EXHAUSTED":
          result.exhaustedLotsCount += 1;
          break;
        case "REVIEW":
          result.reviewLotsCount += 1;
          bump(result.reviewReasons, outcome.reason);
          break;
        default:
          result.alreadyProcessedLotsCount += 1;
      }
    }

    after = snap.docs[snap.docs.length - 1];
    if (snap.size < batchSize) {
      stopped = "COMPLETE";
      break;
    }
  }

  result.totalCreditsExpired = unitsToCredits(result.totalUnitsExpired);

  // Remaining-work state: is any lot still eligible right now (failed lots included)?
  try {
    const probe = await eligibleQuery().limit(1).get();
    result.moreWork = !probe.empty;
  } catch (_) {
    result.moreWork = true;
    bump(result.errorCodes, "PROBE_FAILED");
    result.errorCount += 1;
  }

  if (!stopped) stopped = "BATCH_LIMIT";
  if (stopped === "BATCH_LIMIT" && !result.moreWork) stopped = "COMPLETE";
  result.stoppedReason = stopped;
  return result;
}

/** Response-safe view of an expiry result: counts and reason codes only, no lot/user identifiers. */
function toPublicExpiryResult(r) {
  if (!r) return r;
  return {
    asOf: r.asOf,
    batches: r.batches,
    scannedLots: r.scannedLots,
    expiredLotsCount: r.expiredLotsCount,
    totalUnitsExpired: r.totalUnitsExpired,
    totalCreditsExpired: r.totalCreditsExpired,
    exhaustedLotsCount: r.exhaustedLotsCount,
    alreadyProcessedLotsCount: r.alreadyProcessedLotsCount,
    reviewLotsCount: r.reviewLotsCount,
    reviewReasons: r.reviewReasons,
    errorCount: r.errorCount,
    errorCodes: r.errorCodes,
    moreWork: r.moreWork,
    stoppedReason: r.stoppedReason,
  };
}

// ── Reversal Support ─────────────────────────────────────────────────────────
function expiredNotReversible() {
  return coded(
    "Cannot reverse debit: at least one credit allocation in this operation has already expired, so the reversal is rejected in full.",
    "EXPIRED_CREDITS_NOT_REVERSIBLE",
    422
  );
}

function reversalReplay(reversalOpId, markerData) {
  const out = {
    success: true,
    replayed: true,
    reversalOperationId: reversalOpId,
    message: "Debit reversal previously completed.",
  };
  if (markerData) {
    try {
      const units = readStoredUnits(markerData, "amountUnits", "amount");
      out.restoredUnits = units;
      out.restoredCredits = unitsToCredits(units);
    } catch (_) {
      /* replay details are informational */
    }
  }
  return out;
}

/**
 * Reverses a previous debit by referencing the original operationId.
 * Policy (approved): the reversal is all-or-nothing.
 *   - If ANY allocation (other than non-expiring PLAN credits) has expiresAt <= the operation time, the whole
 *     reversal is rejected with EXPIRED_CREDITS_NOT_REVERSIBLE and nothing is written.
 *   - Otherwise every allocation is restored with its original type, source and expiry; PLAN credits stay
 *     non-expiring. A reversal never extends validity and never mints a fresh validity window.
 *   - Operations without a complete, consistent allocation record are refused (REVERSAL_PROVENANCE_*).
 * The operation time is captured once per call so SDK retries evaluate the same boundary.
 */
async function reverseDebit({
  userId,
  originalOperationId,
  reason = "customer_support_reversal",
  now = null,
  fs = null,
}) {
  const uid = String(userId || "").trim();
  const origOpId = String(originalOperationId === null || originalOperationId === undefined ? "" : originalOperationId).trim();
  if (!uid) throw coded("userId is required.", "INVALID_PARAMETERS", 400);
  if (!origOpId) throw coded("originalOperationId is required.", "INVALID_PARAMETERS", 400);
  if (!OPERATION_ID_RE.test(origOpId) || origOpId.startsWith("rev_")) {
    throw coded("originalOperationId is not a valid spend operation id.", "INVALID_OPERATION_ID", 400);
  }
  const note = String(reason === null || reason === undefined ? "" : reason).trim().slice(0, 200) || "customer_support_reversal";

  const firestore = fs || db.getDb();
  const at = resolveNow(now);
  const nowIso = at.toISOString();

  const origMarkerRef = firestore.collection(COLLECTIONS.OPERATIONS).doc(origOpId);
  const reversalOpId = `rev_${origOpId}`;
  const revMarkerRef = firestore.collection(COLLECTIONS.OPERATIONS).doc(reversalOpId);

  return runTx(firestore, async (transaction) => {
    // ── READS FIRST ──────────────────────────────────────────────────────────
    const origSnap = await transaction.get(origMarkerRef);
    if (!origSnap.exists) {
      throw coded(`Original operation ${origOpId} not found.`, "OPERATION_NOT_FOUND", 404);
    }
    const op = origSnap.data();
    if (op.userId !== uid) {
      throw coded("Operation does not belong to this user.", "OPERATION_NOT_OWNED", 403);
    }
    const revSnap = await transaction.get(revMarkerRef);
    const userRef = firestore.collection(COLLECTIONS.USERS).doc(uid);
    const userSnap = await transaction.get(userRef);

    // Replays are answered before any policy check: a completed reversal stays completed.
    if (op.isReversed || revSnap.exists) {
      return reversalReplay(op.reversalOperationId || reversalOpId, revSnap.exists ? revSnap.data() : null);
    }

    // ── VALIDATE ─────────────────────────────────────────────────────────────
    let restoreUnits;
    try {
      restoreUnits = readStoredUnits(op, "amountUnits", "amount");
    } catch (_) {
      throw coded("Original operation has an invalid amount.", "REVERSAL_PROVENANCE_INVALID", 422);
    }
    if (restoreUnits <= 0) {
      throw coded("Original operation has no debited units to reverse.", "REVERSAL_PROVENANCE_INVALID", 422);
    }
    const allocations = Array.isArray(op.lotsDeducted) ? op.lotsDeducted : [];
    if (allocations.length === 0) {
      throw coded("Original operation has no recorded lot allocations; it cannot be reversed.", "REVERSAL_PROVENANCE_MISSING", 422);
    }
    const parsed = [];
    let allocatedUnits = 0;
    for (const a of allocations) {
      let units;
      try {
        units = readStoredUnits(a, "amountDeductedUnits", "amountDeducted");
      } catch (_) {
        throw coded("Original operation has an invalid lot allocation.", "REVERSAL_PROVENANCE_INVALID", 422);
      }
      if (units <= 0 || typeof a.lotId !== "string" || !LOT_TYPES.has(a.lotType)) {
        throw coded("Original operation has an invalid lot allocation.", "REVERSAL_PROVENANCE_INVALID", 422);
      }
      allocatedUnits += units;
      parsed.push({ ...a, units });
    }
    if (allocatedUnits !== restoreUnits) {
      throw coded("Original operation's lot allocations do not add up to its amount.", "REVERSAL_PROVENANCE_INCONSISTENT", 422);
    }

    // Strict expiry policy: expiresAt <= operation time is expired. PLAN credits never expire.
    const anyExpired = parsed.some((a) => a.lotType !== "PLAN" && a.expiresAt && a.expiresAt <= nowIso);
    if (anyExpired) throw expiredNotReversible();

    if (!userSnap.exists) {
      throw coded(`User ${uid} not found.`, "USER_NOT_FOUND", 404);
    }
    let currentUserUnits;
    try {
      currentUserUnits = userBalanceUnits(userSnap.data());
    } catch (_) {
      throw coded("Wallet balance data is inconsistent; reversal refused.", "WALLET_INCONSISTENT", 409);
    }
    const newBalanceUnits = currentUserUnits + restoreUnits;
    if (!Number.isSafeInteger(newBalanceUnits)) {
      throw coded("Wallet balance would exceed the supported range.", "INVALID_AMOUNT", 400);
    }

    // ── WRITES ───────────────────────────────────────────────────────────────
    transaction.update(origMarkerRef, {
      isReversed: true,
      reversedAt: nowIso,
      reversalOperationId: reversalOpId,
    });

    const createdLots = parsed.map((a, idx) => {
      const lotType = a.lotType;
      const lotId = `lot_rev_${origOpId}_${idx}`;
      const lotDoc = {
        _id: lotId,
        id: lotId,
        userId: uid,
        source: a.lotSource || "REVERSAL",
        type: lotType,
        amount: unitsToCredits(a.units),
        amountUnits: a.units,
        remaining: unitsToCredits(a.units),
        remainingUnits: a.units,
        expiresAt: lotType === "PLAN" ? null : a.expiresAt || null,
        status: "ACTIVE",
        ref: { originalOperationId: origOpId, originalLotId: a.lotId, reason: note },
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      transaction.create(firestore.collection(COLLECTIONS.LOTS).doc(lotId), lotDoc);
      return lotDoc;
    });

    const lotsCreated = createdLots.map((l) => ({
      lotId: l.id,
      amount: l.amount,
      amountUnits: l.amountUnits,
      type: l.type,
      expiresAt: l.expiresAt,
    }));

    const ledgerId = `adc_rev_${origOpId}`;
    transaction.create(firestore.collection(COLLECTIONS.LEDGER).doc(ledgerId), {
      _id: ledgerId,
      id: ledgerId,
      userId: uid,
      credits: unitsToCredits(restoreUnits),
      creditUnits: restoreUnits,
      direction: "CREDIT",
      source: "REVERSAL",
      operationId: reversalOpId,
      originalOperationId: origOpId,
      reason: note,
      balanceAfter: unitsToCredits(newBalanceUnits),
      balanceAfterUnits: newBalanceUnits,
      lotsCreated,
      createdAt: nowIso,
    });

    transaction.create(revMarkerRef, {
      _id: reversalOpId,
      id: reversalOpId,
      originalOperationId: origOpId,
      userId: uid,
      amount: unitsToCredits(restoreUnits),
      amountUnits: restoreUnits,
      balanceAfter: unitsToCredits(newBalanceUnits),
      balanceAfterUnits: newBalanceUnits,
      lotsCreated,
      createdAt: nowIso,
    });

    transaction.set(
      userRef,
      {
        adCreditsBalance: unitsToCredits(newBalanceUnits),
        adCreditsBalanceUnits: newBalanceUnits,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    return {
      success: true,
      replayed: false,
      reversalOperationId: reversalOpId,
      restoredCredits: unitsToCredits(restoreUnits),
      restoredUnits: restoreUnits,
      balanceAfter: unitsToCredits(newBalanceUnits),
      balanceAfterUnits: newBalanceUnits,
      lots: createdLots,
    };
  });
}

// ── Ledger History Query ─────────────────────────────────────────────────────
/**
 * Newest-first ledger page for one user. `startAfter` must be the id of a row of the SAME user (the last id of the
 * previous page); anything else is a 400 so a malformed cursor can never silently restart at page one.
 * Ties on createdAt are broken by document id (implicit, descending), so pagination is stable.
 * Required composite indexes: (userId, createdAt desc) and (userId, direction, createdAt desc).
 */
async function getLedgerHistory(userId, { limit = 20, startAfter = null, direction = null } = {}) {
  const uid = String(userId);
  const firestore = db.getDb();

  if (direction !== null && direction !== undefined && direction !== "CREDIT" && direction !== "DEBIT") {
    throw coded("direction must be CREDIT or DEBIT.", "INVALID_PARAMETERS", 400);
  }

  let query = firestore
    .collection(COLLECTIONS.LEDGER)
    .where("userId", "==", uid);

  if (direction) {
    query = query.where("direction", "==", direction);
  }

  query = query.orderBy("createdAt", "desc").limit(limit);

  if (startAfter) {
    const cursorDoc = await firestore.collection(COLLECTIONS.LEDGER).doc(String(startAfter)).get();
    if (!cursorDoc.exists || cursorDoc.data().userId !== uid) {
      throw coded("startAfter is not a valid history cursor.", "INVALID_CURSOR", 400);
    }
    query = query.startAfter(cursorDoc);
  }

  const snapshot = await query.get();
  const history = [];
  snapshot.forEach((doc) => {
    const item = doc.data();
    item._id = doc.id;
    item.id = doc.id;
    history.push(item);
  });

  return history;
}

module.exports = {
  COLLECTIONS,
  UNITS_PER_CREDIT,
  PAISE_PER_INR,
  MAX_UNITS,
  EXPIRY_LIMITS,
  creditsToUnits,
  unitsToCredits,
  formatCredits,
  toDecimal2,
  inrToPaise,
  paiseToInr,
  calculatePackSplit,
  getPacks,
  findPack,
  snapshotPack,
  getWalletBalance,
  grantCredits,
  spendCredits,
  expireCredits,
  toPublicExpiryResult,
  reverseDebit,
  getLedgerHistory,
};
