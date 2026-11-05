const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const currencyController = require("../../controllers/admin/currencyController");

route.post("/create", checkAccessWithSecretKey(), currencyController.store);
route.patch("/update", checkAccessWithSecretKey(), currencyController.update);
route.get("/", checkAccessWithSecretKey(), currencyController.get);
route.get("/getDefault", checkAccessWithSecretKey(), currencyController.getDefault);
route.patch("/default", checkAccessWithSecretKey(), currencyController.defaultCurrency);
route.delete("/delete", checkAccessWithSecretKey(), currencyController.destroy);

module.exports = route;
