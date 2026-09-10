const express = require("express");
const route = express.Router();
const videoPromotionController = require("../../controllers/client/videoPromotion.controller");
const checkAccess = require("../../checkAccess");

route.post("/create", checkAccess(), videoPromotionController.createCampaign);
route.get("/", checkAccess(), videoPromotionController.getUserCampaigns);

module.exports = route;
