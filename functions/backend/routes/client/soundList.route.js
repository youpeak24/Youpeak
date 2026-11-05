//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const soundListController = require("../../controllers/client/soundList.controller");

//get all soundList for user
route.get("/getSoundList", checkAccessWithSecretKey(), soundListController.getSoundList);

module.exports = route;
