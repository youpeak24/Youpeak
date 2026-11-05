//express
const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const playbackSessionController = require("../../controllers/client/playbackSession.controller");

// Sync video watch progress (Heartbeat / Resume feature)
route.post("/syncPlayback", bindAppUser(), playbackSessionController.syncPlayback);

// Fetch user watch history with video details
route.get("/getMyWatchHistory", bindAppUser(), playbackSessionController.getMyWatchHistory);

// Remove all watch history for a specific user
route.delete("/clearAllWatchHistory", bindAppUser(), playbackSessionController.clearAllWatchHistory);

module.exports = route;
