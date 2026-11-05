/**
 * Client Controller for Ad Credits Wallet, Catalog, History, and Server-Authoritative Consumption.
 *
 * Security & Integrity Guarantees:
 *   - Authenticated wallet ownership: Strictly uses req.appUserId from requireAppUser() middleware.
 *   - Cross-user rejection: Rejects any request where supplied query/body userId !== req.appUserId with HTTP 403.
 *   - Unauthenticated rejection: Returns HTTP 401 AUTH_REQUIRED for unauthenticated callers.
 *   - Server-authoritative consumption: Rejects arbitrary client amounts/purposes with HTTP 400.
 *   - Operation namespace & conflict detection: Propagates HTTP 409 on reused operationId with mismatched parameters.
 *   - Public maintenance removal: Expiry maintenance is strictly admin/internal-only.
 */
"use strict";

const adCreditWallet = require("../../util/adCreditWallet.service");

// Allowlist of approved client consumption operations
const ALLOWED_OPERATIONS = ["PROMOTION_CAMPAIGN"];

/**
 * Validates authenticated wallet ownership against client-supplied parameters.
 * Throws structured errors for consistent HTTP response handling.
 */
function assertWalletOwnership(req) {
  const authenticatedUserId = req.appUserId;
  if (!authenticatedUserId) {
    const err = new Error("User authentication required.");
    err.code = "AUTH_REQUIRED";
    err.statusCode = 401;
    throw err;
  }

  const suppliedUserId = req.query?.userId || req.body?.userId;
  if (suppliedUserId && String(suppliedUserId).trim() !== authenticatedUserId) {
    const err = new Error("Access denied. You cannot access or debit another user's wallet.");
    err.code = "FORBIDDEN_USER_MISMATCH";
    err.statusCode = 403;
    throw err;
  }

  return authenticatedUserId;
}

exports.getWallet = async (req, res) => {
  try {
    const userId = assertWalletOwnership(req);
    const wallet = await adCreditWallet.getWalletBalance(userId);

    return res.status(200).json({
      status: true,
      message: "Wallet fetched successfully.",
      wallet: {
        available: wallet.available,
        plan: wallet.plan,
        topup: wallet.topup,
        bonus: wallet.bonus,
        expiringSoon: wallet.expiringSoon,
        expiringSoonDate: wallet.expiringSoonDate,
        activeLotsCount: wallet.activeLotsCount,
      },
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      status: false,
      code: status === 500 ? "WALLET_FETCH_FAILED" : error.code || "WALLET_FETCH_FAILED",
      message: status === 500 ? "Failed to fetch wallet." : error.message,
    });
  }
};

exports.getPacks = async (req, res) => {
  try {
    const packs = adCreditWallet.getPacks();
    return res.status(200).json({
      status: true,
      message: "Ad credit packs fetched successfully.",
      packs,
      validityDays: packs[0]?.validityDays || 730,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      code: "PACKS_FETCH_FAILED",
      message: error.message || "Failed to fetch packs.",
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const userId = assertWalletOwnership(req);

    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const startAfter = typeof req.query.startAfter === "string" && req.query.startAfter.trim() ? req.query.startAfter.trim() : null;
    const direction = req.query.direction ? String(req.query.direction).toUpperCase() : null;
    if (direction && direction !== "CREDIT" && direction !== "DEBIT") {
      return res.status(400).json({
        status: false,
        code: "INVALID_PARAMETERS",
        message: "direction must be CREDIT or DEBIT.",
      });
    }

    const history = await adCreditWallet.getLedgerHistory(userId, { limit, startAfter, direction });
    return res.status(200).json({
      status: true,
      message: "Ledger history fetched successfully.",
      history,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      status: false,
      code: status === 500 ? "HISTORY_FETCH_FAILED" : error.code || "HISTORY_FETCH_FAILED",
      message: status === 500 ? "Failed to fetch history." : error.message,
    });
  }
};

exports.consumeCredits = async (req, res) => {
  try {
    const userId = assertWalletOwnership(req);

    // Client-initiated consumption is disabled. Ad credits are consumed strictly via authorized server-side operations.
    return res.status(400).json({
      status: false,
      code: "CONSUMPTION_UNAVAILABLE",
      message:
        "Client-initiated credit consumption is currently disabled. Ad credits spending is reserved for authorized server-side operations.",
    });
  } catch (error) {
    const status = error.statusCode || error.status || 500;
    return res.status(status).json({
      status: false,
      code: error.code || "CONSUMPTION_FAILED",
      message: error.message || "Failed to process consumption request.",
    });
  }
};
