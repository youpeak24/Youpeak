/**
 * YouPeak – Tasker withdrawal (Trust Hook).
 *
 * POST client/payout/request
 *   { amountInr, method: "UPI" | "BANK", upiId?, accountHolderName?, accountNumber?, ifsc? }
 *
 *   • First-ever payout: minimum settings.firstWithdrawalMinimumInr (₹100).
 *     Every later payout: settings.minWithdrawalRequestedAmount (₹500).
 *   • Optional cap: no single request above the user's Tasker tier's
 *     estimated monthly income (settings.enforceTierMonthlyWithdrawalCap).
 *   • Pays from the withdrawable ₹ balance first; any shortfall is converted
 *     from coins in the same request (atomic debit via spendBalance, at the
 *     same rate the coin -> ₹ converter uses).
 *   • Creates a PENDING (status 1) withDrawRequests row for admin approval —
 *     admin acceptance re-checks the balance, as for every other request.
 */
"use strict";

const db = require("../../util/connection");
const { getLimits } = require("../../util/rewardEngine");
const { taskerLadderPosition, coinsPerInr } = require("../../util/systemConfig.service");
const { generateHistoryUniqueId } = require("../../util/generateHistoryUniqueId");
const { payoutCapInr } = require("./tasker.controller");
const { payoutHoldReason } = require("../../util/payoutHold");
const { reserveWithdrawal, WithdrawalRefused } = require("../../util/withdrawalLedger");

const UPI_ID = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NUMBER = /^\d{9,18}$/;
const HOLDER_NAME = /^[A-Za-z][A-Za-z .'-]{1,99}$/;

function fail(res, code, message, extra = {}) {
  return res.status(200).json({ status: false, code, message, ...extra });
}

function payoutDetails(body) {
  const method = String(body.method || "").toUpperCase();
  if (method === "UPI") {
    const upiId = String(body.upiId || "").trim();
    if (!UPI_ID.test(upiId)) return { error: "Enter a valid UPI ID, like name@bank." };
    return { gateway: "UPI", details: [`UPI ID: ${upiId}`] };
  }
  if (method === "BANK") {
    const holder = String(body.accountHolderName || "").trim();
    const account = String(body.accountNumber || "").replace(/\s+/g, "");
    const ifsc = String(body.ifsc || "").trim().toUpperCase();
    if (!HOLDER_NAME.test(holder)) return { error: "Enter the account holder's name as on the bank account." };
    if (!ACCOUNT_NUMBER.test(account)) return { error: "Enter a valid bank account number (9–18 digits)." };
    if (!IFSC.test(ifsc)) return { error: "Enter a valid IFSC code, like SBIN0001234." };
    return {
      gateway: "Bank Transfer",
      details: [`Account Holder: ${holder}`, `Account Number: ${account}`, `IFSC: ${ifsc}`],
    };
  }
  return { error: "Choose UPI or bank transfer." };
}

exports.requestPayout = async (req, res) => {
  try {
    const user = req.appUser;
    const userId = req.appUserId;
    const s = global.settingJSON || {};
    const rate = coinsPerInr(s);

    const hold = payoutHoldReason(user);
    if (hold) return fail(res, "PAYOUT_ON_HOLD", hold);

    const amount = Math.floor(Number((req.body || {}).amountInr));
    if (!Number.isFinite(amount) || amount <= 0) return fail(res, "INVALID_AMOUNT", "Enter an amount in rupees.");

    const payout = payoutDetails(req.body || {});
    if (payout.error) return fail(res, "INVALID_PAYOUT_DETAILS", payout.error);

    const requests = await db.find("withDrawRequests", { userId });
    if (requests.some((r) => Number(r.status) === 1)) {
      return fail(res, "PENDING_EXISTS", "You already have a withdrawal waiting for approval.");
    }
    const isFirstWithdrawal = !requests.some((r) => Number(r.status) === 2);
    const minInr = isFirstWithdrawal
      ? Number(s.firstWithdrawalMinimumInr) > 0 ? Number(s.firstWithdrawalMinimumInr) : 100
      : Number(s.minWithdrawalRequestedAmount) > 0 ? Number(s.minWithdrawalRequestedAmount) : 500;
    if (amount < minInr) {
      return fail(res, "BELOW_MINIMUM",
        `Minimum withdrawal is ₹${minInr} (${(minInr * rate).toLocaleString("en-IN")} coins)${isFirstWithdrawal ? " for your first payout" : ""}.`,
        { minInr, isFirstWithdrawal });
    }

    if (s.enforceTierMonthlyWithdrawalCap !== false) {
      const [limits, position] = await Promise.all([getLimits(user), taskerLadderPosition(user)]);
      const capInr = await payoutCapInr(user, userId, limits, position.current, rate);
      if (capInr !== null && capInr > 0 && amount > capInr) {
        return fail(res, "ABOVE_TIER_CAP",
          `Your ${position.current.tierName || "tier"} allows up to ₹${capInr.toLocaleString("en-IN")} per withdrawal.`,
          { capInr });
      }
    }

    // Reserve atomically (util/withdrawalLedger.js): any coin → ₹ shortfall
    // conversion, available → reserved and the PENDING request commit in one
    // transaction with the per-user pending lock, so two simultaneous requests
    // can't both be created or reserve the same balance.
    let reserved;
    try {
      reserved = await reserveWithdrawal({
        userId,
        amountInr: amount,
        convertShortfall: true,
        coinsPerInr: rate,
        conversionHistory: { uniqueId: await generateHistoryUniqueId(), date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }) },
        request: {
          channelId: user.channelId || "",
          channelName: user.fullName || "",
          paymentGateway: payout.gateway,
          paymentDetails: payout.details,
          uniqueId: await generateHistoryUniqueId(),
          requestDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
          paymentDate: "",
          source: "tasker_app",
        },
      });
    } catch (e) {
      if (e instanceof WithdrawalRefused) return fail(res, e.code, e.message, e.extra);
      throw e;
    }
    const request = reserved.request;
    const convertedCoins = reserved.convertedCoins;

    return res.status(200).json({
      status: true,
      message: "Withdrawal request sent. It will be paid after admin approval.",
      requestId: request._id || request.id,
      amountInr: amount,
      convertedCoins,
      isFirstWithdrawal,
      withdrawStatus: "PENDING",
    });
  } catch (error) {
    console.error("payout request error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
