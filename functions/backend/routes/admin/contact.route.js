//express
const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const contactController = require("../../controllers/admin/contact.controller");

//create contact
route.post("/create", checkAccessWithSecretKey(), contactController.store);

//update contact
route.patch("/update", checkAccessWithSecretKey(), contactController.update);

//delete contact
route.delete("/delete", checkAccessWithSecretKey(), contactController.destroy);

//get contact
route.get("/", checkAccessWithSecretKey(), contactController.get);

module.exports = route;
