const express = require("express");
const route = express.Router();
const optionalAppUser = require("../../middleware/optionalAppUser.middleware");
const bindAppUser = require("../../middleware/bindAppUser.middleware");
const checkAccess = require("../../checkAccess");
const creatorFunding = require("../../controllers/client/creatorFunding.controller");

route.get("/eligibility", bindAppUser(), creatorFunding.getEligibility);
route.post("/createCampaign", bindAppUser(), creatorFunding.createCampaign);
route.get("/getActiveCampaigns", optionalAppUser(), creatorFunding.getActiveCampaigns);
route.get("/getCampaignDetails", optionalAppUser(), creatorFunding.getCampaignDetails);
route.get("/getMyCampaigns", bindAppUser(), creatorFunding.getMyCampaigns);
route.get("/getMyBackings", bindAppUser(), creatorFunding.getMyBackings);
route.post("/cancelCampaign", bindAppUser(), creatorFunding.cancelCampaign);

module.exports = route;
