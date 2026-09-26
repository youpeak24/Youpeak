const express = require("express");
const route = express.Router();

// Per-user routes: shared app key + Firebase ID token (middleware/appUser.middleware.js).
const requireAppUser = require("../../middleware/appUser.middleware");
const peakBoostController = require("../../controllers/client/peakBoost.controller");

// Fan -> creator coin boost (80% creator / 20% platform)
route.post("/", requireAppUser(), peakBoostController.boost);

module.exports = route;
