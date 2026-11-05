const express = require("express");
const route = express.Router();

// Per-user routes: shared app key + Firebase ID token (middleware/appUser.middleware.js).
const requireAppUser = require("../../middleware/appUser.middleware");
const watchSessionController = require("../../controllers/client/watchSession.controller");

// Playback heartbeat — every ~10 s while a video genuinely plays
route.post("/heartbeat", requireAppUser(), watchSessionController.heartbeat);

module.exports = route;
