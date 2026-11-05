const express = require("express");
const route = express.Router();
const mediaAudit = require("../../controllers/admin/mediaAudit.controller");

// Read-only dry run: orphaned uploads and videos needing migration to Cloudflare.
route.get("/report", mediaAudit.report);

module.exports = route;
