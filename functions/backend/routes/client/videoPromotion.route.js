const express = require("express");
const route = express.Router();
const videoPromotionController = require("../../controllers/client/videoPromotion.controller");
const checkAccess = require("../../checkAccess");

route.get("/plans", checkAccess(), videoPromotionController.getPlans);
route.get("/", checkAccess(), videoPromotionController.getUserCampaigns);

module.exports = route;
