//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const FAQController = require("../../controllers/admin/FAQ.controller");

//create FAQ
route.post("/create", checkAccessWithSecretKey(), FAQController.store);

//update FAQ
route.patch("/update", checkAccessWithSecretKey(), FAQController.update);

//delete FAQ
route.delete("/delete", checkAccessWithSecretKey(), FAQController.destroy);

//get FAQ
route.get("/", checkAccessWithSecretKey(), FAQController.get);

module.exports = route;
