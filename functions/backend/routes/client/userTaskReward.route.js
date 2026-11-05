const express = require("express");
const route = express.Router();
const bindAppUser = require("../../middleware/bindAppUser.middleware");
const checkAccess = require("../../checkAccess");
const userTaskRewardController = require("../../controllers/client/userTaskReward.controller");

route.post("/like", bindAppUser(), userTaskRewardController.rewardVideoLike);
route.post("/comment", bindAppUser(), userTaskRewardController.rewardVideoComment);
route.post("/adWatch", bindAppUser(), userTaskRewardController.rewardAdWatch);
route.get("/status", bindAppUser(), userTaskRewardController.getDailyEarningStatus);
// Watch-time milestone: 500 Coins after 2 hours (120 min) daily engagement (Per YP-TC-2026-FINAL)
route.post("/watchTimeMilestone", bindAppUser(), userTaskRewardController.checkWatchTimeMilestone);

module.exports = route;
