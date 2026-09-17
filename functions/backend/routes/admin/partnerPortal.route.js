const express = require("express");
const route = express.Router();
const partnerPortal = require("../../controllers/admin/partnerPortal.controller");

route.get("/dashboard", partnerPortal.getDashboard);
route.post("/localBusinessAd/submit", partnerPortal.submitLocalBusinessAd);
route.get("/localBusinessAd/myAds", partnerPortal.getMyLocalBusinessAds);

module.exports = route;
