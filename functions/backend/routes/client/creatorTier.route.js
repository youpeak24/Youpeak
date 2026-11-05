const express = require("express");
const route = express.Router();
const optionalAppUser = require("../../middleware/optionalAppUser.middleware");
const bindAppUser = require("../../middleware/bindAppUser.middleware");
const checkAccess = require("../../checkAccess");
const creatorTierController = require("../../controllers/client/creatorTier.controller");

route.get("/getAvailableTiers", optionalAppUser(), creatorTierController.getAvailableCreatorTiers);
route.post("/upgradeTier", bindAppUser(), creatorTierController.upgradeCreatorTier);

module.exports = route;
