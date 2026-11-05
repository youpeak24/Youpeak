/**
 * Withdrawal reservation (Phase 2, F-24). Units: INR in rupees with paise
 * precision (users.totalEarningAmount = available, users.reservedEarningAmount
 * = held for pending requests); coins are integers (100 coins = ₹1).
 *
 *   reserve   one transaction: per-user pending lock (withdrawalLocks/<userId>)
 *             + optional coin → ₹ conversion + available → reserved + the
 *             PENDING request (status 1, reserved: true). Two simultaneous
 *             requests can never reserve the same balance or both be pending.
 *   settle    admin approval: reserved → paid (status 2), lock released.
 *   release   admin decline: reserved → available again (status 3), once only.
 *
 * Requests created before this existed (reserved !== true) keep the old path:
 * nothing was held, and approval debits the available balance directly.
 *
 * There is no payout gateway: "paid" records an administrator's manual
 * approval (settlementEvidence: MANUAL_ADMIN_APPROVAL), not a verified bank
 * settlement. A payout reference (UTR) can be stored when provided.
 */
"use strict";

const db = require("./connection");

const round2 = (n) => Math.round(Number(n) * 100) / 100;

class WithdrawalRefused extends Error {
  constructor(code, message, extra = {}) { super(message); this.code = code; this.extra = extra; }
}

/**
 * @param {object} p
 * @param {string} p.userId
 * @param {number} p.amountInr          whole rupees requested
 * @param {boolean} [p.convertShortfall] convert missing ₹ from coins (tasker payout route)
 * @param {number} [p.coinsPerInr]
 * @param {object} p.request            request fields (gateway, details, uniqueId, ...)
 * @param {object} [p.conversionHistory] walletHistories row fields for a conversion
 * @returns {Promise<{request:object, convertedCoins:number}>}
 */
async function reserveWithdrawal({ userId, amountInr, convertShortfall = false, coinsPerInr = 100, request, conversionHistory = {} }) {
  const fs = db.getDb();
  const uid = String(userId);
  const userRef = fs.collection("users").doc(uid);
  const lockRef = fs.collection("withdrawalLocks").doc(uid);
  const reqRef = fs.collection(db.normalizeCollectionName("WithDrawRequest")).doc();
  const amount = round2(amountInr);

  return db.withTimeout(fs.runTransaction(async (tx) => {
    const [lock, userSnap] = await Promise.all([tx.get(lockRef), tx.get(userRef)]);
    if (lock.exists) throw new WithdrawalRefused("PENDING_EXISTS", "You already have a withdrawal waiting for approval.");
    if (!userSnap.exists) throw new WithdrawalRefused("USER_NOT_FOUND", "User not found.");
    const u = userSnap.data();
    const available = round2(Number(u.totalEarningAmount) || 0);
    const coins = Math.floor(Number(u.coin) || 0);

    let convertedCoins = 0;
    let creditedInr = 0;
    if (amount > available) {
      if (!convertShortfall) throw new WithdrawalRefused("INSUFFICIENT_BALANCE", "Insufficient funds.", { availableInr: available });
      convertedCoins = Math.ceil(round2(amount - available) * coinsPerInr);
      if (convertedCoins > coins) {
        throw new WithdrawalRefused("INSUFFICIENT_BALANCE", `You can withdraw up to ₹${Math.floor(available + coins / coinsPerInr).toLocaleString("en-IN")}.`, { availableInr: Math.floor(available + coins / coinsPerInr) });
      }
      creditedInr = round2(convertedCoins / coinsPerInr);
    }

    const now = new Date().toISOString();
    const update = {
      totalEarningAmount: round2(available + creditedInr - amount),
      reservedEarningAmount: round2((Number(u.reservedEarningAmount) || 0) + amount),
      updatedAt: now,
    };
    if (convertedCoins) update.coin = coins - convertedCoins;
    tx.update(userRef, update);
    if (convertedCoins) {
      const hRef = fs.collection(db.normalizeCollectionName("WalletHistory")).doc(`${reqRef.id}_conversion`);
      tx.create(hRef, { _id: hRef.id, id: hRef.id, userId: uid, coin: convertedCoins, amount: creditedInr, type: 2, ...conversionHistory, createdAt: now, updatedAt: now });
    }
    const doc = {
      _id: reqRef.id, id: reqRef.id, userId: uid, requestAmount: amount, status: 1, accepted: false, reason: "",
      reserved: true, ...request, createdAt: now, updatedAt: now,
    };
    tx.create(reqRef, doc);
    tx.create(lockRef, { _id: uid, userId: uid, requestId: reqRef.id, createdAt: now });
    return { request: doc, convertedCoins };
  }));
}

/** Admin approval of a reserved request. Refuses anything not pending. */
async function settleWithdrawal(requestId, { adminId = null, payoutReference = null } = {}) {
  const fs = db.getDb();
  const reqRef = fs.collection(db.normalizeCollectionName("WithDrawRequest")).doc(String(requestId));
  return db.withTimeout(fs.runTransaction(async (tx) => {
    const reqSnap = await tx.get(reqRef);
    if (!reqSnap.exists) throw new WithdrawalRefused("NOT_FOUND", "Withdrawal Request does not found!");
    const r = reqSnap.data();
    if (Number(r.status) !== 1 || r.accepted) throw new WithdrawalRefused("NOT_PENDING", "Withdrawal request is no longer pending.");
    const userRef = fs.collection("users").doc(String(r.userId));
    const lockRef = fs.collection("withdrawalLocks").doc(String(r.userId));
    const [userSnap, lockSnap] = await Promise.all([tx.get(userRef), tx.get(lockRef)]);
    const reserved = round2(userSnap.exists ? Number(userSnap.data().reservedEarningAmount) || 0 : 0);
    const amount = round2(r.requestAmount);
    if (reserved < amount) throw new WithdrawalRefused("RESERVATION_MISSING", "The reserved amount for this request is missing — review it manually.");
    const now = new Date().toISOString();
    tx.update(userRef, { reservedEarningAmount: round2(reserved - amount), updatedAt: now });
    tx.update(reqRef, {
      status: 2, accepted: true, paymentDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      settledAt: now, settledByAdminId: adminId, settlementEvidence: payoutReference ? "PAYOUT_REFERENCE" : "MANUAL_ADMIN_APPROVAL",
      payoutReference: payoutReference || null, updatedAt: now,
    });
    if (lockSnap.exists && lockSnap.data().requestId === reqRef.id) tx.delete(lockRef);
    return { ...r, status: 2 };
  }));
}

/** Admin decline of a reserved request: the reservation returns to available once. */
async function releaseWithdrawal(requestId, { reason = "", adminId = null } = {}) {
  const fs = db.getDb();
  const reqRef = fs.collection(db.normalizeCollectionName("WithDrawRequest")).doc(String(requestId));
  return db.withTimeout(fs.runTransaction(async (tx) => {
    const reqSnap = await tx.get(reqRef);
    if (!reqSnap.exists) throw new WithdrawalRefused("NOT_FOUND", "Withdrawal Request does not found!");
    const r = reqSnap.data();
    if (Number(r.status) !== 1 || r.accepted) throw new WithdrawalRefused("NOT_PENDING", "Withdrawal request is no longer pending.");
    const userRef = fs.collection("users").doc(String(r.userId));
    const lockRef = fs.collection("withdrawalLocks").doc(String(r.userId));
    const [userSnap, lockSnap] = await Promise.all([tx.get(userRef), tx.get(lockRef)]);
    const u = userSnap.exists ? userSnap.data() : {};
    const amount = round2(r.requestAmount);
    const now = new Date().toISOString();
    tx.update(userRef, {
      totalEarningAmount: round2((Number(u.totalEarningAmount) || 0) + amount),
      reservedEarningAmount: round2(Math.max(0, (Number(u.reservedEarningAmount) || 0) - amount)),
      updatedAt: now,
    });
    tx.update(reqRef, { status: 3, reason: String(reason || "").trim(), declinedByAdminId: adminId, paymentDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }), updatedAt: now });
    if (lockSnap.exists && lockSnap.data().requestId === reqRef.id) tx.delete(lockRef);
    return { ...r, status: 3 };
  }));
}

module.exports = { reserveWithdrawal, settleWithdrawal, releaseWithdrawal, WithdrawalRefused };
