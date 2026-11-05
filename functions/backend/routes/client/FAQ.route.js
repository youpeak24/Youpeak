//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const FAQController = require("../../controllers/client/FAQ.controller");

//get FAQ
route.get("/", checkAccessWithSecretKey(), FAQController.get);

module.exports = route;
