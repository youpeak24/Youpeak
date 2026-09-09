const express = require("express");
const route = express.Router();
const cronController = require("../controllers/cron.controller");

// GET so Vercel Cron can call it; auth is via CRON_SECRET (Bearer or ?key=)
route.get("/daily", cronController.daily);
route.post("/daily", cronController.daily);

module.exports = route;
