const express = require("express");
const route = express.Router();

// Per-user routes: shared app key + Firebase ID token (middleware/appUser.middleware.js).
const requireAppUser = require("../../middleware/appUser.middleware");
const taskerController = require("../../controllers/client/tasker.controller");

// Tasker dashboard: tier, caps, daily checklist, lifetime watch hours, Milestone 2, payout rules
route.get("/dashboard", requireAppUser(), taskerController.dashboard);

module.exports = route;
