const express = require("express");
const route = express.Router();
const cronController = require("../controllers/cron.controller");

// GET so Vercel Cron can call it; auth is via CRON_SECRET (Bearer or ?key=)
route.get("/daily", cronController.daily);
route.post("/daily", cronController.daily);

// Ad Credits expiry sweep only (CRON_SECRET), so it can be scheduled more often than the daily bundle.
route.get("/adCreditsExpiry", cronController.adCreditsExpiry);
route.post("/adCreditsExpiry", cronController.adCreditsExpiry);

module.exports = route;
