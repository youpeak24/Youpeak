const db = require("../../util/connection");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

function requireSuperAdmin(req, res) {
  if (req.adminRole !== "SUPER_ADMIN") {
    res.status(403).json({ status: false, message: "Only a super admin can change commission records." });
    return false;
  }
  return true;
}

// Fetch commission ledgers with optional agency filter
exports.getCommissions = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const { agencyId, payoutStatus, verificationStatus } = req.query;

    let filter = {};
    if (req.adminRole === "AGENCY_ADMIN" && req.agencyId) {
      filter.agencyId = req.agencyId;
    } else if (agencyId) {
      filter.agencyId = agencyId;
    }

    if (payoutStatus) {
      filter.payoutStatus = payoutStatus;
    }
    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }

    const commissions = await db.find("agencyCommissions", filter, { sort: { createdAt: -1 } });
    const count = commissions.length;
    const totalAmount = commissions.reduce((acc, c) => acc + (Number(c.commissionAmount) || 0), 0);

    const paginated = commissions.slice((start - 1) * limit, start * limit);

    return res.status(200).json({
      status: true,
      message: "Commission ledger fetched successfully!",
      total: count,
      totalCommissionAmount: totalAmount,
      commissions: paginated,
    });
  } catch (error) {
    console.error("Error fetching commissions:", error);
    return res.status(200).json({
      status: true,
      message: "Commissions fetched",
      total: 0,
      totalCommissionAmount: 0,
      commissions: [],
    });
  }
};

// Update payout status (Pending -> Paid). Super admin only — a franchise
// login could otherwise mark its own commission as paid.
exports.updatePayoutStatus = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const { commissionId, payoutStatus } = req.body;
    if (!["PENDING", "PAID"].includes(payoutStatus)) {
      return res.status(200).json({ status: false, message: "payoutStatus must be PENDING or PAID." });
    }
    const commission = await db.findById("agencyCommissions", commissionId);
    if (!commission) {
      return res.status(200).json({ status: false, message: "Commission record not found!" });
    }
    if (payoutStatus === "PAID" && commission.verificationStatus === "UNVERIFIED") {
      return res.status(200).json({ status: false, message: "Verify that the licence fee was received before paying this commission." });
    }
    if (commission.verificationStatus === "REJECTED") {
      return res.status(200).json({ status: false, message: "This commission was rejected and can't be paid." });
    }

    const updated = await db.update("agencyCommissions", commissionId, {
      payoutStatus,
      paidAt: payoutStatus === "PAID" ? new Date().toISOString() : null,
    });

    return res.status(200).json({ status: true, message: "Payout status updated!", commission: updated });
  } catch (error) {
    console.error("Error updating payout status:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

// PATCH /admin/commission/verify  { commissionId, decision: VERIFIED|REJECTED, note? }
// A licence fee a franchise *says* it collected (util/digitalPartner.service.js,
// feeRecordedByAdminId) creates an UNVERIFIED commission. The super admin
// confirms the money actually reached Youpeak before it can be paid out.
// Rejecting also takes back the ad credits and licence total that fee granted.
exports.verify = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const { commissionId, decision } = req.body || {};
    const note = String(req.body?.note || "").trim().slice(0, 300);
    if (!["VERIFIED", "REJECTED"].includes(decision)) {
      return res.status(200).json({ status: false, message: "decision must be VERIFIED or REJECTED." });
    }
    const commission = await db.findById("agencyCommissions", commissionId);
    if (!commission) {
      return res.status(200).json({ status: false, message: "Commission record not found!" });
    }
    if (commission.verificationStatus !== "UNVERIFIED") {
      return res.status(200).json({ status: false, message: "Only unverified commissions can be verified or rejected." });
    }

    // Atomic claim so a double click can't reverse the ad credits twice.
    const claim = await db.claimOnce("agencyCommissions", commissionId, "verificationDecided");
    if (!claim.claimed) {
      return res.status(200).json({ status: false, message: "This commission was already decided." });
    }

    const patch = {
      verificationStatus: decision,
      verificationNote: note || null,
      verifiedAt: new Date().toISOString(),
      verifiedByAdminId: String(req.admin?._id || req.admin?.id || ""),
    };
    if (decision === "REJECTED") patch.payoutStatus = "CANCELLED";
    const updated = await db.update("agencyCommissions", commissionId, patch);

    let reversed = null;
    if (decision === "REJECTED" && commission.sourceType === "DIGITAL_PARTNER_LICENSE" && commission.partnerUserId) {
      const profile = await db.findOne("PartnerProfile", { userId: String(commission.partnerUserId) });
      if (profile) {
        const fee = num(commission.grossAmount);
        const credits = Math.min(fee, num(profile.adCreditsBalance));
        await db.incrementFields("PartnerProfile", profile._id || profile.id, {
          adCreditsBalance: -credits,
          adCreditsGranted: -fee,
          licenseFeePaid: -Math.min(fee, num(profile.licenseFeePaid)),
        });
        reversed = { adCredits: credits, licenseFee: fee };
      }
    }

    return res.status(200).json({
      status: true,
      message: decision === "VERIFIED"
        ? "Licence fee verified — the commission can now be paid."
        : "Rejected — the commission is cancelled and the ad credits from this fee were taken back.",
      commission: updated,
      reversed,
    });
  } catch (error) {
    console.error("Error verifying commission:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};
