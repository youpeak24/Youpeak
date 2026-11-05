const express = require("express");
const route = express.Router();

const ReferralController = require("../../controllers/admin/referral.controller");

route.get("/getReferralLogs", ReferralController.getReferralLogs);
route.get("/getLeaderboard", ReferralController.getLeaderboard);

module.exports = route;
