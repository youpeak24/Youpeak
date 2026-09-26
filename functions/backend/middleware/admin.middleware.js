//JWT Token
const jwt = require("jsonwebtoken");
const db = require("../util/connection");

// A franchise/partner login is disabled when its franchise is deactivated or
// the partner is suspended — say that, not a generic "account disabled".
function disabledMessage(role) {
  if (role === "AGENCY_ADMIN") return "This District Franchise is deactivated. Contact the Youpeak admin.";
  if (role === "DIGITAL_PARTNER_ADMIN") return "This Digital Partner account is suspended or removed. Contact your District Franchise.";
  return "This admin account is disabled.";
}

module.exports = async (req, res, next) => {
  try {
    const Authorization = req.get("Authorization");
    if (!Authorization) {
      return res.status(401).json({ status: false, message: "Oops ! You are not authorized." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("admin.middleware: JWT_SECRET env var is not set — refusing all admin requests.");
      return res.status(500).json({ status: false, message: "Server auth not configured" });
    }

    let decodeToken;
    try {
      decodeToken = jwt.verify(Authorization, secret);
    } catch (jwtErr) {
      return res.status(401).json({ status: false, message: "Invalid or expired token. Authorization failed." });
    }

    const adminId = decodeToken && (decodeToken._id || decodeToken.id);
    if (!adminId) {
      return res.status(401).json({ status: false, message: "Invalid token. Authorization failed." });
    }

    // The admin MUST exist in the database. Never trust role/identity claims
    // from the token alone.
    let admin;
    try {
      admin = await db.findById("admins", adminId);
    } catch (dbErr) {
      console.error("admin.middleware: admin lookup failed:", dbErr.message);
      return res.status(503).json({ status: false, message: "Service temporarily unavailable. Please retry." });
    }

    if (!admin) {
      return res.status(401).json({ status: false, message: "Admin account not found. Authorization failed." });
    }
    if (admin.isBlock || admin.isActive === false) {
      // code lets the panel sign the session out (util/AxiosInterceptor.js).
      return res.status(403).json({ status: false, message: disabledMessage(admin.role), code: "ACCOUNT_DISABLED" });
    }

    // Every admin route below is otherwise reachable by ANY valid admin JWT
    // regardless of role — the rest of the panel only hides menus in the
    // frontend. Franchise and partner logins belong to outside business
    // partners, so confine each to its own portal plus the shared panel
    // chrome (own profile/password, the default-currency read the navbar
    // makes). Anything not listed is SUPER_ADMIN only.
    const SELF_SERVICE = [
      "/admin/admin/profile",
      "/admin/admin/update",
      "/admin/admin/updatePassword",
      "/admin/admin/setPassword",
      "/admin/currency/getDefault",
    ];
    const path = req.originalUrl.split("?")[0];

    if (admin.role === "AGENCY_ADMIN") {
      const agency = admin.agencyId ? await db.findById("agencies", admin.agencyId).catch(() => null) : null;
      if (!agency || agency.isActive === false) {
        return res.status(403).json({ status: false, message: "This District Franchise is deactivated. Contact the Youpeak admin.", code: "ACCOUNT_DISABLED" });
      }
      const allowed =
        path.startsWith("/admin/franchisePortal/") ||
        // Report endpoints below scope themselves to req.agencyId.
        path === "/admin/agencyReport/getAgencyReport" ||
        path === "/admin/agencyReport/getDigitalPartners" ||
        path === "/admin/commission/getCommissions" ||
        path === "/admin/digitalPartner/report" ||
        SELF_SERVICE.includes(path);
      if (!allowed) {
        return res.status(403).json({ status: false, message: "This account only has access to the District Franchise portal." });
      }
    } else if (admin.role === "DIGITAL_PARTNER_ADMIN") {
      const partner = admin.partnerUserId ? await db.findById("users", admin.partnerUserId).catch(() => null) : null;
      if (!partner || !partner.isDigitalPartner || partner.partnerStatus !== "ACTIVE") {
        return res.status(403).json({ status: false, message: "This Digital Partner account is suspended or removed. Contact your District Franchise.", code: "ACCOUNT_DISABLED" });
      }
      const allowed =
        path.startsWith("/admin/partnerPortal/") ||
        path === "/admin/digitalPartner/report" ||
        // Ad creative upload for the local business ad form — shared with
        // every other admin page that uploads an image (util/AwsFunction.js
        // uploadFile()), not partner-specific data, safe to allow.
        path === "/admin/file/upload-file" ||
        SELF_SERVICE.includes(path);
      if (!allowed) {
        return res.status(403).json({ status: false, message: "This account only has access to the Digital Partner portal." });
      }
    } else if (admin.role && admin.role !== "SUPER_ADMIN") {
      return res.status(403).json({ status: false, message: "Unknown admin role." });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ status: false, message: "Invalid or expired token. Authorization failed." });
    }
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
