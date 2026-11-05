//express
const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const contactController = require("../../controllers/client/contact.controller");

//get contact
route.get("/", checkAccessWithSecretKey(), contactController.get);

module.exports = route;
