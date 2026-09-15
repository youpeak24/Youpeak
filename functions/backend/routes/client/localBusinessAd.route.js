const express = require("express");
const route = express.Router();
const checkAccess = require("../../checkAccess");
const localBusinessAd = require("../../controllers/client/localBusinessAd.controller");

route.post("/submit", checkAccess(), localBusinessAd.submit);
route.get("/getMyAds", checkAccess(), localBusinessAd.getMyAds);
route.get("/getActiveAdsForRegion", checkAccess(), localBusinessAd.getActiveAdsForRegion);
route.post("/recordImpression", checkAccess(), localBusinessAd.recordImpression);
route.post("/recordClick", checkAccess(), localBusinessAd.recordClick);

module.exports = route;
