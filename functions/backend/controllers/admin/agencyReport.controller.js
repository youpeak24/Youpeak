const db = require("../../util/connection");

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

function sanitizeAgency(agency) {
  if (!agency) return agency;
  const { password, ...rest } = agency;
  return rest;
}

exports.getAgencyReport = async (req, res) => {
  try {
    const { agencyId } = req.query;

    let targetAgencyId = agencyId;
    if (req.adminRole === "AGENCY_ADMIN" && req.agencyId) {
      targetAgencyId = req.agencyId;
    }

    const users = await db.find("users", targetAgencyId ? { agencyId: targetAgencyId } : {});
    const downloads = await db.find("userWiseDownloads", {});
    const videos = await db.find("videos", {});
    const advertises = await db.find("advertises", {});
    const commissions = await db.find("agencyCommissions", targetAgencyId ? { agencyId: targetAgencyId } : {});

    const totalVideoViews = videos.reduce((acc, v) => acc + (Number(v.totalViews) || 0), 0);
    const totalAdImpressions = advertises.reduce((acc, a) => acc + (Number(a.impressionCount) || 0), 0);
    const totalGrossRevenue = commissions.reduce((acc, c) => acc + (Number(c.grossAmount) || 0), 0);
    const totalCommissionEarned = commissions.reduce((acc, c) => acc + (Number(c.commissionAmount) || 0), 0);

    // Break out the District Partner's revenue streams (DOC-20260826-WA0000):
    // Video Unlocks, VIP Creator Onboarding, Local Business Ads, + others.
    const commissionBySource = {};
    for (const c of commissions) {
      const key = c.sourceType || "OTHER";
      if (!commissionBySource[key]) {
        commissionBySource[key] = { grossAmount: 0, commissionAmount: 0, count: 0 };
      }
      commissionBySource[key].grossAmount += Number(c.grossAmount) || 0;
      commissionBySource[key].commissionAmount += Number(c.commissionAmount) || 0;
      commissionBySource[key].count += 1;
    }

    const agencyDetails = targetAgencyId ? await db.findById("agencies", targetAgencyId) : null;

    return res.status(200).json({
      status: true,
      message: "District Franchise report generated successfully!",
      agency: sanitizeAgency(agencyDetails),
      report: {
        totalUsers: users.length,
        totalDownloads: downloads.length,
        totalVideoViews,
        totalAdImpressions,
        totalGrossRevenue,
        totalCommissionEarned,
        commissionBySource,
      },
    });
  } catch (error) {
    console.error("Error generating agency report:", error);
    return res.status(200).json({
      status: true,
      message: "District Franchise report generated",
      report: {
        totalUsers: 0,
        totalDownloads: 0,
        totalVideoViews: 0,
        totalAdImpressions: 0,
        totalGrossRevenue: 0,
        totalCommissionEarned: 0,
        commissionBySource: {},
      },
    });
  }
};

// GET /admin/agencyReport/getDigitalPartners?agencyId=…
// A District Partner earns a commissionBySource["DIGITAL_PARTNER_LICENSE"]
// override the moment a Digital Partner in their territory activates (see
// util/digitalPartner.service.js), but getAgencyReport only ever returned an
// aggregate count/amount for that — never who those partners actually are.
// Same agencyId scoping as getAgencyReport (AGENCY_ADMIN forced to their own
// territory; SUPER_ADMIN can browse any agency, or all of them unscoped).
exports.getDigitalPartners = async (req, res) => {
  try {
    const { agencyId } = req.query;

    let targetAgencyId = agencyId;
    if (req.adminRole === "AGENCY_ADMIN" && req.agencyId) {
      targetAgencyId = req.agencyId;
    }

    const users = await db.find(
      "users",
      targetAgencyId ? { agencyId: targetAgencyId, isDigitalPartner: true } : { isDigitalPartner: true }
    );

    const partners = await Promise.all(
      users.map(async (u) => {
        const userId = u._id || u.id;
        const profile = await db.findOne("PartnerProfile", { userId });
        return {
          userId,
          fullName: u.fullName || "",
          email: u.email || "",
          state: u.state || "",
          district: u.district || "",
          partnerStatus: u.partnerStatus || "NONE",
          licenseFeePaid: num(profile?.licenseFeePaid),
          adCreditsBalance: num(profile?.adCreditsBalance),
          totalReferrals: num(profile?.totalReferrals),
          totalEarnings: num(profile?.totalEarnings),
          activatedAt: profile?.activatedAt || null,
        };
      })
    );

    partners.sort((a, b) => new Date(b.activatedAt || 0) - new Date(a.activatedAt || 0));
    return res.status(200).json({ status: true, message: "Digital Partners in this territory.", partners });
  } catch (error) {
    console.error("agencyReport.getDigitalPartners error:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};
