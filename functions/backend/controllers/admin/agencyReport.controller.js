const db = require("../../util/connection");
const net = require("../../util/partnerNetwork.service");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// startDate/endDate are YYYY-MM-DD (inclusive). A row without a date only
// counts when no range is set.
function rangeFilter(q) {
  const from = q.startDate ? new Date(`${q.startDate}T00:00:00`).getTime() : null;
  const to = q.endDate ? new Date(`${q.endDate}T23:59:59.999`).getTime() : null;
  return (value) => {
    if (from == null && to == null) return true;
    const t = value ? new Date(value).getTime() : NaN;
    if (Number.isNaN(t)) return false;
    return (from == null || t >= from) && (to == null || t <= to);
  };
}

// A franchise login is always forced to its own franchise; a super admin may
// pick one (agencyId) or see the whole platform (none).
function targetAgency(req) {
  if (req.adminRole === "AGENCY_ADMIN") return req.agencyId || "__none__";
  return req.query.agencyId || null;
}

// GET /admin/agencyReport/getAgencyReport?agencyId=&startDate=&endDate=
exports.getAgencyReport = async (req, res) => {
  try {
    const inRange = rangeFilter(req.query || {});
    const agencyId = targetAgency(req);

    const commissions = (await db.find("agencyCommissions", agencyId ? { agencyId: String(agencyId) } : {}))
      .filter((c) => inRange(c.createdAt));
    const commissionBySource = {};
    for (const c of commissions) {
      if (c.verificationStatus === "REJECTED") continue;
      const key = c.sourceType || "OTHER";
      commissionBySource[key] = commissionBySource[key] || { grossAmount: 0, commissionAmount: 0, count: 0 };
      commissionBySource[key].grossAmount += num(c.grossAmount);
      commissionBySource[key].commissionAmount += num(c.commissionAmount);
      commissionBySource[key].count += 1;
    }
    const counted = commissions.filter((c) => c.verificationStatus !== "REJECTED");
    const base = {
      totalGrossRevenue: counted.reduce((a, c) => a + num(c.grossAmount), 0),
      totalCommissionEarned: Number(counted.reduce((a, c) => a + num(c.commissionAmount), 0).toFixed(2)),
      commissionBySource,
    };

    if (agencyId) {
      const agency = await db.findById("agencies", agencyId);
      if (!agency) return res.status(200).json({ status: false, message: "District Franchise not found." });
      const [districtUsers, partners] = await Promise.all([
        agency.district ? db.find("users", { district: agency.district }) : [],
        net.listPartnerRows({ agencyId }),
      ]);
      const allRefs = await net.referralFacts(partners);
      const periodRefs = allRefs.filter((r) => inRange(r.createdAt));
      return res.status(200).json({
        status: true,
        message: "District Franchise report generated successfully!",
        agency: net.publicAgency(agency),
        report: {
          scope: "FRANCHISE",
          ...base,
          totalUsers: districtUsers.filter((u) => inRange(u.createdAt || u.date)).length,
          totalDigitalPartners: partners.length,
          activeDigitalPartners: partners.filter((p) => p.partnerStatus === "ACTIVE").length,
          totalReferrals: periodRefs.length,
          completedReferrals: periodRefs.filter((r) => r.stage === "COMPLETED").length,
          referralRewardsPaidInr: Number(periodRefs.reduce((a, r) => a + r.releasedInr, 0).toFixed(2)),
          lifetimeReferrals: allRefs.length,
        },
      });
    }

    // Platform-wide (super admin, no franchise picked).
    const [users, downloads, videos, advertises, partners] = await Promise.all([
      db.find("users", {}),
      db.find("userWiseDownloads", {}),
      db.find("videos", {}),
      db.find("advertises", {}),
      db.find("users", { isDigitalPartner: true }),
    ]);
    return res.status(200).json({
      status: true,
      message: "Platform report generated successfully!",
      agency: null,
      report: {
        scope: "PLATFORM",
        ...base,
        totalUsers: users.filter((u) => inRange(u.createdAt || u.date)).length,
        totalDigitalPartners: partners.length,
        totalDownloads: downloads.filter((d) => inRange(d.createdAt)).length,
        // Lifetime counters — views/impressions aren't stored per day.
        totalVideoViews: videos.reduce((acc, v) => acc + num(v.totalViews), 0),
        totalAdImpressions: advertises.reduce((acc, a) => acc + num(a.impressionCount), 0),
      },
    });
  } catch (error) {
    console.error("Error generating agency report:", error);
    return res.status(500).json({ status: false, message: error.message || "Failed to generate report" });
  }
};

// GET /admin/agencyReport/getDigitalPartners?agencyId=
// Same franchise scoping as above; figures come from partnerNetwork.service
// (PartnerProfile's totalReferrals/totalEarnings were never maintained).
exports.getDigitalPartners = async (req, res) => {
  try {
    const agencyId = targetAgency(req);
    const partners = await net.listPartnerRows({ agencyId: agencyId || null });
    return res.status(200).json({ status: true, message: "Digital Partners in this territory.", partners });
  } catch (error) {
    console.error("agencyReport.getDigitalPartners error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};
