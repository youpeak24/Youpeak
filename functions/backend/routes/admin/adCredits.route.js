const express = require("express");
const route = express.Router();
const adCreditsAdminController = require("../../controllers/admin/adCredits.controller");

// Admin / internal maintenance worker for expiring ad credits
route.post("/maintenance/expire", adCreditsAdminController.runExpiryMaintenance);

// Admin-initiated provenance-preserving debit reversal
route.post("/reverse", adCreditsAdminController.reverseDebit);

module.exports = route;

