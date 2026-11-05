/**
 * App access gate (Play Store / App Store compliance).
 *
 * The mobile app never takes a membership, Starter Pass or license payment
 * itself — it sends the user to the web portal (settings.membershipPortalUrl).
 * It locks the app only while an activation payment is actually owed:
 *
 *   • a one-time joining fee is configured (settings.joiningFeeINR > 0), or
 *   • the user picked a paid membership on the web portal and hasn't paid yet
 *     (users.pendingMembershipTierId),
 *
 * and paymentStatus is still false. Everyone else — free taskers, and anyone
 * who reached a level through watch hours instead of buying it — gets in.
 * (A literal "locked unless paymentStatus or tier == free" rule would lock
 * out users who earned their level for free.)
 */
"use strict";

function portalUrl() {
  const url = String((global.settingJSON || {}).membershipPortalUrl || "").trim();
  return url || "https://youpeak.in";
}

function accessGateFor(user) {
  const s = global.settingJSON || {};
  const paid = !!(user && (user.paymentStatus === true || user.payment_status === true));
  const pendingTierId = (user && user.pendingMembershipTierId) || null;
  const joiningFee = Number(s.joiningFeeINR) || 0;

  let reason = null;
  if (!paid && pendingTierId) reason = "MEMBERSHIP_PAYMENT_PENDING";
  else if (!paid && joiningFee > 0) reason = "JOINING_FEE_PENDING";

  return {
    locked: reason !== null,
    reason,
    paymentStatus: paid,
    pendingMembershipTierId: pendingTierId,
    activationUrl: portalUrl(),
  };
}

module.exports = { accessGateFor, portalUrl };
