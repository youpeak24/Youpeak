const express = require("express");
const route = express.Router();
const checkAccess = require("../../checkAccess");
const platformConfigController = require("../../controllers/admin/platformConfig.controller");

route.get("/", checkAccess(), platformConfigController.getAll);
route.get("/history", checkAccess(), platformConfigController.history);
route.patch("/:section", checkAccess(), platformConfigController.save);

module.exports = route;
