const express = require("express");
const route = express.Router();
const checkAccess = require("../../checkAccess");
const creatorFunding = require("../../controllers/client/creatorFunding.controller");

route.get("/eligibility", checkAccess(), creatorFunding.getEligibility);
route.post("/createCampaign", checkAccess(), creatorFunding.createCampaign);
route.get("/getActiveCampaigns", checkAccess(), creatorFunding.getActiveCampaigns);
route.get("/getCampaignDetails", checkAccess(), creatorFunding.getCampaignDetails);
route.get("/getMyCampaigns", checkAccess(), creatorFunding.getMyCampaigns);
route.get("/getMyBackings", checkAccess(), creatorFunding.getMyBackings);
route.post("/cancelCampaign", checkAccess(), creatorFunding.cancelCampaign);

module.exports = route;
