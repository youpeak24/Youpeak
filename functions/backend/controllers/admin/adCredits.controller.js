/**
 * Admin Controller for Ad Credits Maintenance.
 *
 * Mounted behind AdminMiddleware + CheckScope (SUPER_ADMIN only; franchise/partner roles are refused there).
 * Inputs are validated strictly (no silent clamping) and error bodies never carry raw exception messages.
 */
"use strict";

const adCreditWallet = require("../../util/adCreditWallet.service");

const { MAX_BATCH_SIZE, MAX_BATCHES, DEFAULT_BATCH_SIZE, DEFAULT_MAX_BATCHES } = adCreditWallet.EXPIRY_LIMITS;

// Stay inside the function's execution limit (vercel.json maxDuration is 30 s).
const ADMIN_RUN_BUDGET_MS = 20000;

function invalid(res, message) {
  return res.status(400).json({ status: false, code: "INVALID_PARAMETERS", message });
}

/** Accepts an integer number or a plain integer string; anything else is rejected, never clamped. */
function parseBoundedInt(raw, { name, min, max, fallback }) {
  if (raw === undefined || raw === null || raw === "") return { value: fallback };
  const n = typeof raw === "number" ? raw : typeof raw === "string" && /^\d{1,6}$/.test(raw.trim()) ? Number(raw.trim()) : NaN;
  if (!Number.isInteger(n) || n < min || n > max) {
    return { error: `${name} must be an integer between ${min} and ${max}.` };
  }
  return { value: n };
}

exports.runExpiryMaintenance = async (req, res) => {
  try {
    const input = { ...(req.query || {}), ...(req.body && typeof req.body === "object" ? req.body : {}) };

    if (input.cursor !== undefined) {
      return invalid(res, "cursor is not supported: progress is tracked by lot status; simply run the maintenance again.");
    }
    const batch = parseBoundedInt(input.batchSize, { name: "batchSize", min: 1, max: MAX_BATCH_SIZE, fallback: DEFAULT_BATCH_SIZE });
    if (batch.error) return invalid(res, batch.error);
    const batches = parseBoundedInt(input.maxBatches, { name: "maxBatches", min: 1, max: MAX_BATCHES, fallback: DEFAULT_MAX_BATCHES });
    if (batches.error) return invalid(res, batches.error);

    const result = await adCreditWallet.expireCredits({
      batchSize: batch.value,
      maxBatches: batches.value,
      deadlineMs: Date.now() + ADMIN_RUN_BUDGET_MS,
    });
    return res.status(200).json({
      status: true,
      message: result.moreWork
        ? "Ad credits expiry maintenance ran; more expired lots remain — run it again to continue."
        : "Ad credits expiry maintenance run completed successfully.",
      result: adCreditWallet.toPublicExpiryResult(result),
    });
  } catch (error) {
    console.error("admin runExpiryMaintenance error:", error && error.code, error && error.message);
    return res.status(500).json({
      status: false,
      code: "MAINTENANCE_RUN_FAILED",
      message: "Failed to execute expiry maintenance.",
    });
  }
};

// Codes the reversal engine raises on purpose; everything else is reported generically.
const REVERSAL_ERRORS = {
  EXPIRED_CREDITS_NOT_REVERSIBLE: 422,
  REVERSAL_PROVENANCE_MISSING: 422,
  REVERSAL_PROVENANCE_INVALID: 422,
  REVERSAL_PROVENANCE_INCONSISTENT: 422,
  OPERATION_NOT_FOUND: 404,
  OPERATION_NOT_OWNED: 403,
  USER_NOT_FOUND: 404,
  INVALID_OPERATION_ID: 400,
  INVALID_PARAMETERS: 400,
  INVALID_AMOUNT: 400,
  WALLET_INCONSISTENT: 409,
};

exports.reverseDebit = async (req, res) => {
  try {
    const { userId, originalOperationId, reason } = req.body || {};
    if (typeof userId !== "string" || typeof originalOperationId !== "string" || !userId.trim() || !originalOperationId.trim()) {
      return invalid(res, "userId and originalOperationId are required.");
    }
    if (reason !== undefined && reason !== null && typeof reason !== "string") {
      return invalid(res, "reason must be a string.");
    }
    const result = await adCreditWallet.reverseDebit({
      userId,
      originalOperationId,
      reason,
    });
    return res.status(200).json({
      status: true,
      message: result.replayed ? "Reversal previously executed." : "Debit successfully reversed.",
      result,
    });
  } catch (error) {
    const known = error && REVERSAL_ERRORS[error.code];
    if (known) {
      return res.status(known).json({ status: false, code: error.code, message: error.message });
    }
    console.error("admin reverseDebit error:", error && error.code, error && error.message);
    return res.status(500).json({
      status: false,
      code: "REVERSAL_FAILED",
      message: "Failed to reverse debit.",
    });
  }
};
