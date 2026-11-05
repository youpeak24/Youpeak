//express
const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const SaveToWatchController = require("../../controllers/client/saveToWatchLater.controller");

//user wise add video to saveToWatchLater
route.post("/addVideoToWatchLater", bindAppUser(), SaveToWatchController.addVideoToWatchLater);

//get all saveToWatchLater videos for that user
route.get("/getSaveToWatchLater", bindAppUser(), SaveToWatchController.getSaveToWatchLater);

module.exports = route;
