const express = require("express");
const route = express.Router();
const optionalAppUser = require("../../middleware/optionalAppUser.middleware");
const checkAccess = require("../../checkAccess");
const taskerTierController = require("../../controllers/client/taskerTier.controller");

route.get("/getAvailableTiers", optionalAppUser(), taskerTierController.getAvailableTaskerTiers);

module.exports = route;
