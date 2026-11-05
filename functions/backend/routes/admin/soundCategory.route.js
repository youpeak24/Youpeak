//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const soundCategoryController = require("../../controllers/admin/soundCategory.controller");

//create soundCategory
route.post("/create", checkAccessWithSecretKey(), soundCategoryController.create);

//update soundCategory
route.patch("/update", checkAccessWithSecretKey(), soundCategoryController.update);

//delete soundCategory
route.delete("/delete", checkAccessWithSecretKey(), soundCategoryController.destroy);

//get all soundCategory
route.get("/", checkAccessWithSecretKey(), soundCategoryController.get);

module.exports = route;
