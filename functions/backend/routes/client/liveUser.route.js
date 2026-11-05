//express
const express = require("express");
const route = express.Router();
const optionalAppUser = require("../../middleware/optionalAppUser.middleware");
const bindAppUser = require("../../middleware/bindAppUser.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const liveUserController = require("../../controllers/client/liveUser.controller");

//live the user
route.post("/live", bindAppUser(), liveUserController.liveUser);

//get live user list
route.get("/getliveUserList", optionalAppUser(), liveUserController.getliveUserList);

//generate zego auth token
route.post("/generateZegoAuthToken", bindAppUser(), liveUserController.generateZegoAuthToken);

module.exports = route;
