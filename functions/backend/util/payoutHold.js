/**
 * Accounts whose payouts are frozen pending admin review.
 *
 *   • partnerStatus SUSPENDED — Digital Partner TRS §4 "Auto-Suspension":
 *     flag the partner and "freeze wallet payouts pending admin review".
 *   • isRestricted — set by util/fraudDetection.service.js after repeated
 *     fraud alerts, or by an admin on the Fraud page.
 *
 * Used by both withdrawal paths and by the held-referral release cron, so a
 * flag actually stops money leaving rather than only being displayed.
 * (isBlock is checked separately by every caller.)
 */
"use strict";

function payoutHoldReason(user) {
  if (!user) return null;
  if (user.partnerStatus === "SUSPENDED") {
    return "Your partner account is suspended pending review, so payouts are paused.";
  }
  if (user.isRestricted === true) {
    return "Payouts are paused on this account pending a security review.";
  }
  return null;
}

module.exports = { payoutHoldReason };
