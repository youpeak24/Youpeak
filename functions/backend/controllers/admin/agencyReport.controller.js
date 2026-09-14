const db = require("../../util/connection");

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
      message: "Agency report generated successfully!",
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
      message: "Agency report generated",
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
