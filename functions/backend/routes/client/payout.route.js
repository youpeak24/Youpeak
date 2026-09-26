const express = require("express");
const route = express.Router();

// Per-user routes: shared app key + Firebase ID token (middleware/appUser.middleware.js).
const requireAppUser = require("../../middleware/appUser.middleware");
const payoutController = require("../../controllers/client/payout.controller");

// Tasker withdrawal: ₹100 first payout (trust hook), ₹500 after, UPI or bank
route.post("/request", requireAppUser(), payoutController.requestPayout);

module.exports = route;
