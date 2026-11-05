//express
const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const UserWiseDownloadController = require("../../controllers/client/userWiseDownload.controller");

//when user view the video create watchHistory for history
route.post("/downloadVideoHistory", bindAppUser(), UserWiseDownloadController.downloadVideoHistory);

//get user wise watchHistory
route.get("/getdownloadVideoHistory", bindAppUser(), UserWiseDownloadController.getdownloadVideoHistory);

module.exports = route;
