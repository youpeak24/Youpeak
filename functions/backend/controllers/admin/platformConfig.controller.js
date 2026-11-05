/**
 * Super Admin "Platform Config" pages — see util/platformConfig.js.
 *
 *   GET   /admin/platformConfig                  every section: field metadata, checks, current values, last change
 *   PATCH /admin/platformConfig/:section         { values: { "<path>": value, ... } } — validated, audited
 *   GET   /admin/platformConfig/history?section= audit trail (who changed what, from → to)
 *
 * SUPER_ADMIN only: admin.middleware.js confines franchise and partner logins
 * to their own portals, so these routes are unreachable for them.
 */
"use strict";

const platformConfig = require("../../util/platformConfig");

exports.getAll = async (req, res) => {
  try {
    const data = await platformConfig.getAll();
    return res.status(200).json({ status: true, message: "Platform config fetched.", ...data });
  } catch (error) {
    console.error("platformConfig.getAll error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

exports.save = async (req, res) => {
  try {
    const values = req.body && req.body.values;
    if (!values || typeof values !== "object") {
      return res.status(200).json({ status: false, message: "values is required." });
    }
    const result = await platformConfig.saveSection(req.params.section, values, req.admin);
    if (!result.ok) {
      return res.status(result.notFound ? 404 : 200).json({
        status: false,
        message: result.errors._section || "Some values are invalid — fix the highlighted fields.",
        errors: result.errors,
      });
    }
    return res.status(200).json({
      status: true,
      message: result.changed ? "Saved. Live across the platform within 30 seconds." : "No changes to save.",
      changed: result.changed,
      section: result.section,
    });
  } catch (error) {
    console.error("platformConfig.save error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

exports.history = async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const rows = await platformConfig.history(req.query.section || null, limit);
    return res.status(200).json({ status: true, message: "Config history fetched.", history: rows });
  } catch (error) {
    console.error("platformConfig.history error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
