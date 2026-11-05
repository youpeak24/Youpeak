//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const settingController = require("../../controllers/client/setting.controller");

//get setting
route.get("/", checkAccessWithSecretKey(), settingController.get);

module.exports = route;
