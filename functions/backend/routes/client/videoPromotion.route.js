const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");
const optionalAppUser = require("../../middleware/optionalAppUser.middleware");
const requireAppUser = require("../../middleware/appUser.middleware");
const videoPromotionController = require("../../controllers/client/videoPromotion.controller");
const checkAccess = require("../../checkAccess");

// Catalogue (prices are the server's; orders use plan ids).
route.get("/plans", checkAccess(), videoPromotionController.getPlans);

// The signed-in creator's own videos, campaigns and campaign details.
route.get("/eligibleVideos", requireAppUser(), videoPromotionController.getEligibleVideos);
route.get("/", bindAppUser(), videoPromotionController.getUserCampaigns);
route.get("/campaign", requireAppUser(), videoPromotionController.getCampaign);

// Delivery: the Home "Promoted" slot and counted impressions.
route.get("/placements", optionalAppUser(), videoPromotionController.getPlacements);
route.post("/impression", requireAppUser(), videoPromotionController.recordImpression);

module.exports = route;
