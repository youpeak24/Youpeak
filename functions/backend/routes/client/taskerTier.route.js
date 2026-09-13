const express = require("express");
const route = express.Router();
const checkAccess = require("../../checkAccess");
const taskerTierController = require("../../controllers/client/taskerTier.controller");

route.get("/getAvailableTiers", checkAccess(), taskerTierController.getAvailableTaskerTiers);

module.exports = route;
