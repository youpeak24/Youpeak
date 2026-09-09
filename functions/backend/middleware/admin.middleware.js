//JWT Token
const jwt = require("jsonwebtoken");
const db = require("../util/connection");

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
      return res.status(403).json({ status: false, message: "This admin account is disabled." });
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
