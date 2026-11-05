const express = require("express");
const route = express.Router();

// Per-user routes: shared app key + Firebase ID token (middleware/appUser.middleware.js).
const requireAppUser = require("../../middleware/appUser.middleware");
const peakBoostController = require("../../controllers/client/peakBoost.controller");

// Fan -> creator coin boost (80% creator / 20% platform)
route.post("/", requireAppUser(), peakBoostController.boost);
// Outcome of an earlier boost request (checked after a timeout before retrying)
route.get("/status", requireAppUser(), peakBoostController.status);

module.exports = route;
