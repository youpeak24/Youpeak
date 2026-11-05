const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const advertiseController = require("../../controllers/admin/advertise.controller");

//create advertise
//route.post("/create", checkAccessWithSecretKey(), advertiseController.store);

//update advertise
route.patch("/update", checkAccessWithSecretKey(), advertiseController.update);

//get advertise
route.get("/", checkAccessWithSecretKey(), advertiseController.get);

//handle activation of the switch
route.patch("/handleSwitchForAd", checkAccessWithSecretKey(), advertiseController.handleSwitchForAd);

module.exports = route;
