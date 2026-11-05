const express = require("express");
const route = express.Router();
const optionalAppUser = require("../../middleware/optionalAppUser.middleware");
const bindAppUser = require("../../middleware/bindAppUser.middleware");
const checkAccess = require("../../checkAccess");
const localBusinessAd = require("../../controllers/client/localBusinessAd.controller");

route.post("/submit", bindAppUser(), localBusinessAd.submit);
route.get("/getMyAds", bindAppUser(), localBusinessAd.getMyAds);
route.get("/getActiveAdsForRegion", optionalAppUser(), localBusinessAd.getActiveAdsForRegion);
route.post("/recordImpression", optionalAppUser(), localBusinessAd.recordImpression);
route.post("/recordClick", optionalAppUser(), localBusinessAd.recordClick);

module.exports = route;
