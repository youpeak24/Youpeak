// Derives the caller's role/agency scope from req.admin (set by admin.middleware).
// Never defaults to SUPER_ADMIN — an unknown role gets the narrowest scope.
const checkScope = async (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ status: false, message: "Unauthorized request" });
    }

    const role = req.admin.role || "AGENCY_ADMIN";
    const agencyId = req.admin.agencyId || null;
    const partnerUserId = req.admin.partnerUserId || null;

    req.adminRole = role;
    req.agencyId = agencyId;
    req.partnerUserId = partnerUserId;

    // Agency admins are always constrained to their own agency's data.
    req.getScopeFilter = (baseFilter = {}) => {
      if (role !== "SUPER_ADMIN" && agencyId) {
        return { ...baseFilter, agencyId };
      }
      return baseFilter;
    };

    next();
  } catch (error) {
    console.error("Error in checkScope middleware:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

module.exports = checkScope;
