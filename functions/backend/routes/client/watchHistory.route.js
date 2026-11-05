//express
const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const watchHistoryController = require("../../controllers/client/watchHistory.controller");

//when user view video create video's watchHistory
route.post("/createWatchHistory", bindAppUser(), watchHistoryController.createWatchHistory);

//get user wise watchHistory
route.get("/getWatchHistory", bindAppUser(), watchHistoryController.getWatchHistory);

//get weekly analytics of views for a particular user, counting all videos across all their channels
route.get("/weeklyViewsAnalytics", bindAppUser(), watchHistoryController.weeklyViewsAnalytics);

module.exports = route;
