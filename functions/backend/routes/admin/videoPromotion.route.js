const express = require("express");
const route = express.Router();
const videoPromotionController = require("../../controllers/admin/videoPromotion.controller");
const checkAccess = require("../../checkAccess");

route.get("/index", checkAccess(), videoPromotionController.index);
route.post("/updateStatus", checkAccess(), videoPromotionController.updateCampaignStatus);

module.exports = route;
