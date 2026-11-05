//express
const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const PlayListController = require("../../controllers/client/playLIst.controller");

//user wise new playList
route.post("/newPlayList", bindAppUser(), PlayListController.newPlayList);

//user wise update playist
route.patch("/updatePlayList", bindAppUser(), PlayListController.updatePlayList);

//user wise delete playist
route.delete("/deletePlayList", bindAppUser(), PlayListController.deletePlayList);

module.exports = route;
